
import { Request, Response } from 'express';
import { GameServer, ServerNode, Invoice, User } from '../models';
import { decrypt } from '../utils/crypto';
import { execCommand, uploadStream } from '../services/sshService';
import Busboy from 'busboy';
import * as net from 'net';
import * as dgram from 'dgram';
import crypto from 'crypto';
import { adjustBalance, round2 } from '../services/balanceService';

const GAME_PORTS: Record<string, number> = {
    'minecraft': 25565,
    'cs2': 27015,
    'cs16': 27015
};

const GAME_IMAGES: Record<string, string> = {
    'minecraft': 'itzg/minecraft-server',
    'cs2': 'joedwards32/cs2',
    'cs16': 'archont94/counter-strike1.6:latest'
};

const MINECRAFT_CORES = new Set([
    'paper', 'purpur', 'folia', 'spigot', 'bukkit', 'pufferfish',
    'fabric', 'forge', 'neoforge', 'mohist', 'vanilla', 'custom'
]);

const POPULAR_MINECRAFT_VERSIONS = new Set([
    'LATEST', 'SNAPSHOT', '1.21.4', '1.21.3', '1.21.1', '1.21',
    '1.20.6', '1.20.4', '1.20.2', '1.20.1',
    '1.19.4', '1.18.2', '1.17.1', '1.16.5'
]);

const CS16_BUILDS: Record<string, {
    image: string;
    label: string;
    mountPath: string;
    steamMountPath?: string;
    env?: Record<string, string | number>;
    extraPorts?: string[];
    startup: (args: { slots: number; map: string; rcon: string; port: number }) => string;
}> = {
    jives_cstrike_latest: {
        image: 'jives/hlds:cstrike',
        label: 'Steam Latest (Post-25th Anniversary, build 9xxx, protocol 48)',
        mountPath: '/hlds',
        startup: ({ slots, map, rcon, port }) =>
            `+ip 0.0.0.0 +port ${port} +maxplayers ${slots} +map ${map} +rcon_password ${shellQuote(rcon)} +sv_lan 0 +log on`
    },
    jives_cstrike_legacy: {
        image: 'jives/hlds:cstrike-legacy',
        label: 'Steam Legacy (Pre-25th Anniversary, build ~8684, ReHLDS/ReGameDLL/old AMX plugins)',
        mountPath: '/hlds',
        startup: ({ slots, map, rcon, port }) =>
            `+ip 0.0.0.0 +port ${port} +maxplayers ${slots} +map ${map} +rcon_password ${shellQuote(rcon)} +sv_lan 0 +log on`
    },
    steamcmd_latest: {
        image: 'ghcr.io/ich777/steamcmd:cstrike1.6',
        label: 'SteamCMD Fresh (Always latest official Valve build, auto-updates; долгая первая установка 2–10 мин)',
        mountPath: '/hlds',
        steamMountPath: '/serverdata/serverfiles',
        env: { GAME_ID: 90, GAME_NAME: 'cstrike', VALIDATE: 'true', UID: 1000, GID: 1000 },
        startup: () => '',
    },
    archont94_stable_2021: {
        image: 'archont94/counter-strike1.6:latest',
        label: 'Stable 2021 AMXModX (встроены Metamod + AMX Mod X + Fast DL 80/tcp, проверенный временем)',
        mountPath: '/hlds',
        env: { SV_LAN: 0 },
        extraPorts: ['80'],
        startup: () => ''
    },
    hlds_official: {
        image: 'hlds/server:latest',
        label: 'Classic HLDS Official (базовый build, без предустановленных плагинов)',
        mountPath: '/hlds',
        startup: ({ slots, map, rcon, port }) =>
            `-game cstrike -ip 0.0.0.0 -port ${port} +maxplayers ${slots} +map ${map} +rcon_password ${shellQuote(rcon)} +sv_lan 0`
    }
};

const DEFAULT_CS16_BUILD_KEY = 'jives_cstrike_latest';
const LEGACY_CS16_BUILD_KEY = 'archont94_stable_2021';

const validateCs16Build = (key?: string): string => {
    if (!key) return LEGACY_CS16_BUILD_KEY;
    const k = String(key).trim().toLowerCase();
    if (!k) return LEGACY_CS16_BUILD_KEY;
    if (Object.prototype.hasOwnProperty.call(CS16_BUILDS, k)) return k;
    return LEGACY_CS16_BUILD_KEY;
};

const buildCs16DockerArgs = (server: any, port: number, containerName: string): { runFlags: string; image: string; cmd: string; hostVolumeArg: string } => {
    const slots = Number(server?.slots) || 32;
    const map = 'de_dust2';
    const rcon = String(server?.rconPassword || '').trim() || ('rcon_' + crypto.randomBytes(6).toString('hex'));
    const buildKey = validateCs16Build(server?.cs16Build);
    const meta = CS16_BUILDS[buildKey];

    const uidPart = (String(server.userId || '')).split('-')[0] || 'u';
    const hostDir = `/var/lib/wexa/game-servers/${String(server.id)}`;

    const flags: string[] = [];
    flags.push('-d');
    flags.push('--restart unless-stopped');
    flags.push(`--name ${containerName}`);
    flags.push(`-p ${port}:27015/udp`);
    flags.push(`-p ${port}:27015/tcp`);

    if (meta?.extraPorts?.length) {
        for (const ep of meta.extraPorts) {
            flags.push(`-p 9${port.toString().slice(-4)}:${ep}/tcp`);
        }
    }

    if (meta?.env && Object.keys(meta.env).length) {
        if (buildKey === 'archont94_stable_2021') {
            flags.push(`-e PORT=${port}`);
            flags.push(`-e MAP=${map}`);
            flags.push(`-e MAXPLAYERS=${slots}`);
        }
        for (const [k, v] of Object.entries(meta.env)) {
            flags.push(`-e ${k}=${shellQuote(String(v))}`);
        }
    }

    if (server?.ram && Number(server.ram) > 64) {
        flags.push(`-m ${Number(server.ram)}m`);
    }

    const volMounts: string[] = [];
    volMounts.push(`-v ${hostDir}:${meta.mountPath}`);
    if (meta.steamMountPath && meta.steamMountPath !== meta.mountPath) {
        volMounts.push(`-v ${hostDir}:${meta.steamMountPath}`);
    }

    return {
        runFlags: flags.join(' '),
        image: meta.image,
        cmd: meta.startup({ slots, map, rcon, port }),
        hostVolumeArg: volMounts.join(' ')
    };
};

const validateMcVersion = (v?: string): string => {
    if (!v) return 'LATEST';
    const clean = String(v).trim();
    if (!clean) return 'LATEST';
    if (!/^[a-zA-Z0-9_.\-]+$/.test(clean)) return 'LATEST';
    return clean;
};

const validateMcCore = (core?: string): string => {
    if (!core) return 'paper';
    const c = String(core).trim().toLowerCase();
    if (!MINECRAFT_CORES.has(c)) return 'paper';
    return c;
};

const validateUrlSafe = (u?: string): string | null => {
    if (!u) return null;
    const s = String(u).trim();
    if (!s) return null;
    if (!/^https?:\/\/[^\s"'`]+$/i.test(s)) return null;
    return s;
};

const validateJarName = (n?: string): string | null => {
    if (!n) return null;
    const s = String(n).trim();
    if (!s) return null;
    if (!/^[a-zA-Z0-9._\-]+\.jar$/i.test(s)) return null;
    return s;
};

const shellQuote = (s: string | number): string => {
    const str = String(s);
    if (/^[a-zA-Z0-9_./:?=&%@+\-]+$/.test(str)) return str;
    return "'" + str.replace(/'/g, "'\\''") + "'";
};

const buildMinecraftDockerArgs = (server: any, port: number, containerName: string): string => {
    const ram = Number(server?.ram) || 1024;
    const slots = Number(server?.slots) || 20;
    const version = validateMcVersion(server?.mcVersion);
    const core = validateMcCore(server?.core);
    const customUrl = validateUrlSafe(server?.mcCustomJarUrl);
    const customJarName = validateJarName(server?.mcCustomJarName);

    const isCustom = core === 'custom';

    const parts: string[] = [];
    parts.push(`-d`);
    parts.push(`--restart unless-stopped`);
    parts.push(`--name ${containerName}`);
    parts.push(`-p ${port}:25565/tcp`);
    parts.push(`-m ${ram}m`);
    parts.push(`-e EULA=TRUE`);
    parts.push(`-e MAX_PLAYERS=${slots}`);
    parts.push(`-e VERSION=${shellQuote(version)}`);
    parts.push(`-e TYPE=${shellQuote(isCustom ? 'CUSTOM' : core.toUpperCase())}`);
    if (isCustom && customUrl) {
        parts.push(`-e DOWNLOAD_URL=${shellQuote(customUrl)}`);
    }
    if (isCustom && customJarName && !customUrl) {
        parts.push(`-e CUSTOM_SERVER=/data/${shellQuote(customJarName)}`);
    }

    return `${parts.join(' ')} ${GAME_IMAGES['minecraft']}`;
};


const reprovisionMinecraftContainer = async (server: any, node: any, config: any): Promise<string> => {
    const basePort = Number(GAME_PORTS[server.game as string]) || 25565;
    const port = Number(server.port) || basePort;
    const uidPart = (String(server.userId || '')).split('-')[0] || 'u';
    const containerName = `gs_${uidPart}_${port}`;
    const hostDir = `/var/lib/wexa/game-servers/${String(server.id)}`;
    const mountPath = '/data';

    const oldIdent = String(server.containerId || '').trim();

    try {
        await execCommand(config, `sh -lc "docker stop ${containerName} >/dev/null 2>&1 || true"`);
    } catch {}
    if (oldIdent && !oldIdent.startsWith('mock_')) {
        try {
            await execCommand(config, `sh -lc "docker stop ${oldIdent} >/dev/null 2>&1 || true"`);
        } catch {}
    }

    try {
        const lsHostRaw = await execCommand(config, `sh -lc "ls -A ${hostDir} 2>/dev/null || true"`);
        const hostHasFiles = Boolean((lsHostRaw || '').trim());

        if (!hostHasFiles && oldIdent && !oldIdent.startsWith('mock_')) {
            const owner = await getPathOwner(config, oldIdent, mountPath);
            const uid = owner?.uid ?? 1000;
            const gid = owner?.gid ?? 1000;
            await execCommand(config, `sh -lc "mkdir -p ${hostDir} >/dev/null 2>&1 || true"`);
            try {
                await execCommand(config, `sh -lc "docker cp ${oldIdent}:${mountPath}/. ${hostDir}/ >/dev/null 2>&1 || true"`);
            } catch {}
            try {
                await execCommand(config, `sh -lc "chown -R ${uid}:${gid} ${hostDir} >/dev/null 2>&1 || true"`);
            } catch {}
        }
    } catch (e: any) {
        console.warn('[reprovisionMinecraft] bind/data-copy step warning:', e?.message || e);
    }

    try { await execCommand(config, `sh -lc "docker rm -f ${containerName} >/dev/null 2>&1 || true"`); } catch {}
    if (oldIdent && !oldIdent.startsWith('mock_')) {
        try { await execCommand(config, `sh -lc "docker rm -f ${oldIdent} >/dev/null 2>&1 || true"`); } catch {}
    }

    const baseArgs = buildMinecraftDockerArgs(server, port, containerName);
    const runCmd = `docker run -v ${hostDir}:${mountPath} ${baseArgs}`;
    const output = await execCommand(config, runCmd);
    const containerId = (output || '').trim().substring(0, 12);
    if (!containerId) {
        throw new Error('Пустой ответ при запуске нового контейнера Minecraft');
    }
    return containerId;
};

const reprovisionCs16Container = async (server: any, node: any, config: any): Promise<string> => {
    const basePort = Number(GAME_PORTS[server.game as string]) || 27015;
    const port = Number(server.port) || basePort;
    const uidPart = (String(server.userId || '')).split('-')[0] || 'u';
    const containerName = `gs_${uidPart}_${port}`;
    const hostDir = `/var/lib/wexa/game-servers/${String(server.id)}`;

    const buildKey = validateCs16Build(server?.cs16Build);
    const meta = CS16_BUILDS[buildKey];
    const mountPath = meta.mountPath || '/hlds';

    const oldIdent = String(server.containerId || '').trim();

    try {
        await execCommand(config, `sh -lc "docker stop ${containerName} >/dev/null 2>&1 || true"`);
    } catch {}
    if (oldIdent && !oldIdent.startsWith('mock_')) {
        try {
            await execCommand(config, `sh -lc "docker stop ${oldIdent} >/dev/null 2>&1 || true"`);
        } catch {}
    }

    try {
        const lsHostRaw = await execCommand(config, `sh -lc "ls -A ${hostDir} 2>/dev/null || true"`);
        const hostHasFiles = Boolean((lsHostRaw || '').trim());

        if (!hostHasFiles && oldIdent && !oldIdent.startsWith('mock_')) {
            const owner = await getPathOwner(config, oldIdent, mountPath).catch(() => null)
                ?? { uid: 0, gid: 0 };
            const uid = owner?.uid ?? 1000;
            const gid = owner?.gid ?? 1000;
            await execCommand(config, `sh -lc "mkdir -p ${hostDir} >/dev/null 2>&1 || true"`);
            try {
                await execCommand(config, `sh -lc "docker cp ${oldIdent}:${mountPath}/. ${hostDir}/ >/dev/null 2>&1 || true"`);
            } catch {}
            try {
                await execCommand(config, `sh -lc "chown -R ${uid}:${gid} ${hostDir} >/dev/null 2>&1 || true"`);
            } catch {}
        }
    } catch (e: any) {
        console.warn('[reprovisionCs16] bind/data-copy step warning:', e?.message || e);
    }

    try { await execCommand(config, `sh -lc "docker rm -f ${containerName} >/dev/null 2>&1 || true"`); } catch {}
    if (oldIdent && !oldIdent.startsWith('mock_')) {
        try { await execCommand(config, `sh -lc "docker rm -f ${oldIdent} >/dev/null 2>&1 || true"`); } catch {}
    }

    const built = buildCs16DockerArgs(server, port, containerName);
    const runParts: string[] = ['docker run'];
    if (built.hostVolumeArg) runParts.push(built.hostVolumeArg);
    if (built.runFlags) runParts.push(built.runFlags);
    runParts.push(built.image);
    if (built.cmd) runParts.push(built.cmd);
    const runCmd = runParts.join(' ');
    const output = await execCommand(config, runCmd);
    const containerId = (output || '').trim().substring(0, 12);
    if (!containerId) {
        throw new Error('Пустой ответ при запуске нового контейнера CS 1.6');
    }
    return containerId;
};


const calculateMonthlyPrice = (_ramMb: number, slots: number, slotPrice: number) => {
    return Math.ceil(slots * slotPrice);
};

const getSlotPriceForNodeGame = (node: any, game: string) => {
    const slotPrices = node?.slotPrices;
    if (slotPrices && typeof slotPrices === 'object' && !Array.isArray(slotPrices) && Number.isFinite(Number(slotPrices[game]))) {
        return Number(slotPrices[game]);
    }
    const fallback = Number(node?.slotPrice);
    return Number.isFinite(fallback) ? fallback : 10;
};

const addMonths = (date: Date, months: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
};

const findFreePort = async (nodeId: string, startPort: number) => {
    const lastServer = await GameServer.findOne({
        where: { nodeId },
        order: [['port', 'DESC']]
    });
    
    if (!lastServer) return startPort;
    // If last server port is less than startPort (e.g. different game), start from startPort
    if (lastServer.port < startPort) return startPort;
    
    return lastServer.port + 1;
};

const encodeVarInt = (value: number) => {
    const bytes: number[] = [];
    let v = value >>> 0;
    while (true) {
        if ((v & 0xffffff80) === 0) {
            bytes.push(v);
            break;
        }
        bytes.push((v & 0x7f) | 0x80);
        v >>>= 7;
    }
    return Buffer.from(bytes);
};

const decodeVarInt = (buf: Buffer, offset: number) => {
    let num = 0;
    let shift = 0;
    let pos = offset;
    while (true) {
        if (pos >= buf.length) throw new Error('VarInt out of bounds');
        const byte = buf[pos++];
        num |= (byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7;
        if (shift > 35) throw new Error('VarInt too big');
    }
    return { value: num, size: pos - offset };
};

const encodeString = (value: string) => {
    const s = Buffer.from(value, 'utf8');
    return Buffer.concat([encodeVarInt(s.length), s]);
};

const makePacket = (packetId: number, data: Buffer) => {
    const payload = Buffer.concat([encodeVarInt(packetId), data]);
    return Buffer.concat([encodeVarInt(payload.length), payload]);
};

const getIdParam = (req: Request) => {
    const raw = (req.params as any).id;
    if (Array.isArray(raw)) return raw[0];
    return raw as string;
};

const getUserIdFromReq = (req: Request) => {
    return (req as any).user?.id as string | undefined;
};

const getIsAdminFromReq = (req: Request) => {
    return (req as any).user?.role === 'admin';
};

const generateSftpCredentials = (serverId: string) => {
    const username = `gs${serverId.replace(/-/g, '').slice(0, 10)}`;
    const secret = process.env.ENCRYPTION_KEY || 'default_secret_key_change_me_32_chars';
    const h = crypto.createHmac('sha256', secret).update(serverId).digest('hex');
    const password = h.slice(0, 20);
    return { username, password };
};

const getSftpContainerName = (server: any) => {
    const base = (server.containerId || server.id || '').toString().replace(/[^a-zA-Z0-9_.-]/g, '');
    return `sftp_${base.slice(0, 24)}`;
};

const getListeningPortsFromOutput = (output: string) => {
    const ports = new Set<number>();
    output.split('\n').forEach(line => {
        const m = line.match(/:(\d+)\s*$/);
        if (m) ports.add(Number(m[1]));
    });
    return ports;
};

const findAvailableSftpPort = async (config: any, preferred: number) => {
    let portsOutput = await execCommand(config, `sh -lc "ss -ltnH 2>/dev/null | awk '{print \\$4}' || true"`);
    if (!portsOutput.trim()) {
        portsOutput = await execCommand(config, `sh -lc "netstat -ltn 2>/dev/null | awk '{print \\$4}' || true"`);
    }
    const used = getListeningPortsFromOutput(portsOutput);

    for (let p = preferred; p < 24000; p += 1) {
        if (!used.has(p)) return p;
    }
    for (let p = 22000; p < preferred; p += 1) {
        if (!used.has(p)) return p;
    }
    throw new Error('No free SFTP port found');
};

const getExistingSftpPort = async (config: any, containerName: string) => {
    const out = await execCommand(
        config,
        `sh -lc "docker port ${containerName} 22/tcp 2>/dev/null | head -n 1 | sed -E 's/.*:([0-9]+)$/\\1/' || true"`
    );
    const p = Number(out.trim());
    return Number.isFinite(p) && p > 0 ? p : null;
};

const getVolumeAtPath = async (config: any, containerId: string, destPath: string) => {
    const out = await execCommand(
        config,
        `sh -lc "docker inspect ${containerId} --format '{{ range .Mounts }}{{ if eq .Destination \\\"${destPath}\\\" }}{{ .Name }}{{ end }}{{ end }}' 2>/dev/null || true"`
    );
    return out.trim() || null;
};

const getPathOwner = async (config: any, containerId: string, destPath: string) => {
    try {
        const out = await execCommand(
            config,
            `sh -lc "docker exec -i ${containerId} sh -lc 'stat -c \\\"%u %g\\\" ${destPath} 2>/dev/null || echo \\\"\\\"'"`
        );
        const parts = out.trim().split(/\\s+/).filter(Boolean);
        if (parts.length >= 2) {
            const uid = Number(parts[0]);
            const gid = Number(parts[1]);
            if (Number.isFinite(uid) && Number.isFinite(gid)) return { uid, gid };
        }
    } catch {
        return null;
    }
    return null;
};

const getGameContainerIdentifier = (server: any) => {
    const cid = server.containerId as string | undefined;
    if (cid && cid.trim()) return cid.trim();
    const uid = server.userId as string | undefined;
    const port = server.port as number | undefined;
    if (uid && port) return `gs_${uid.split('-')[0]}_${port}`;
    return null;
};

const getMountPathForGame = (game: string) => {
    if (game === 'minecraft') return '/data';
    if (game === 'cs16') return '/hlds';
    return null;
};

const ensureHostBindForContainerPath = async (
    config: any,
    server: any,
    containerIdent: string,
    mountPath: string
) => {
    const hostDir = `/var/lib/wexa/game-servers/${server.id}`;

    const owner = await getPathOwner(config, containerIdent, mountPath);
    const uid = owner?.uid ?? 1000;
    const gid = owner?.gid ?? 1000;

    await execCommand(config, `sh -lc "mkdir -p ${hostDir} >/dev/null 2>&1 || true"`);
    await execCommand(config, `sh -lc "docker cp ${containerIdent}:${mountPath}/. ${hostDir}/ >/dev/null 2>&1 || true"`);
    await execCommand(config, `sh -lc "chown -R ${uid}:${gid} ${hostDir} >/dev/null 2>&1 || true"`);

    const containerName = await execCommand(
        config,
        `sh -lc "docker inspect -f '{{.Name}}' ${containerIdent} 2>/dev/null | sed 's:^/::'"`
    );
    const name = containerName.trim();
    if (!name) throw new Error('Cannot determine container name');

    const image = await execCommand(config, `sh -lc "docker inspect -f '{{.Config.Image}}' ${containerIdent} 2>/dev/null || true"`);
    const envArgs = await execCommand(
        config,
        `sh -lc "docker inspect -f '{{range .Config.Env}}{{printf \\\"-e %q \\\" .}}{{end}}' ${containerIdent} 2>/dev/null || true"`
    );
    const cmdArgs = await execCommand(
        config,
        `sh -lc "docker inspect -f '{{range .Config.Cmd}}{{printf \\\"%q \\\" .}}{{end}}' ${containerIdent} 2>/dev/null || true"`
    );

    await execCommand(config, `sh -lc "docker rm -f ${name} >/dev/null 2>&1 || true"`);

    const port = server.port as number;
    const portArgs =
        server.game === 'cs16'
            ? `-p ${port}:27015/udp -p ${port}:27015/tcp`
            : server.game === 'minecraft'
              ? `-p ${port}:25565/tcp`
              : '';

    const runOut = await execCommand(
        config,
        `sh -lc "docker run -d --restart unless-stopped --name ${name} ${portArgs} -v ${hostDir}:${mountPath} ${envArgs.trim()} ${image.trim()} ${cmdArgs.trim()}"`
    );

    const newContainerId = runOut.trim().substring(0, 12);
    if (newContainerId) {
        await server.update({ containerId: newContainerId });
    }

    return { hostDir, uid, gid };
};

const readOnePacket = (socket: net.Socket, timeoutMs: number) => {
    return new Promise<Buffer>((resolve, reject) => {
        let buffer = Buffer.alloc(0);

        const cleanup = () => {
            socket.off('data', onData);
            socket.off('error', onError);
            socket.off('timeout', onTimeout);
        };

        const onError = (err: Error) => {
            cleanup();
            reject(err);
        };

        const onTimeout = () => {
            cleanup();
            reject(new Error('timeout'));
        };

        const onData = (chunk: Buffer) => {
            buffer = Buffer.concat([buffer, chunk]);
            try {
                const { value: length, size } = decodeVarInt(buffer, 0);
                const total = size + length;
                if (buffer.length >= total) {
                    const packet = buffer.subarray(size, total);
                    cleanup();
                    resolve(packet);
                }
            } catch {
                return;
            }
        };

        socket.setTimeout(timeoutMs);
        socket.on('data', onData);
        socket.on('error', onError);
        socket.on('timeout', onTimeout);
    });
};

const getMinecraftPlayers = async (host: string, port: number) => {
    const protocolVersion = 767;
    const socket = new net.Socket();

    try {
        await new Promise<void>((resolve, reject) => {
            socket.once('error', reject);
            socket.connect(port, host, () => resolve());
        });

        const handshake = makePacket(
            0x00,
            Buffer.concat([
                encodeVarInt(protocolVersion),
                encodeString(host),
                (() => {
                    const b = Buffer.alloc(2);
                    b.writeUInt16BE(port, 0);
                    return b;
                })(),
                encodeVarInt(0x01)
            ])
        );

        const request = makePacket(0x00, Buffer.alloc(0));
        socket.write(Buffer.concat([handshake, request]));

        const response = await readOnePacket(socket, 1500);
        let offset = 0;
        const pid = decodeVarInt(response, offset);
        offset += pid.size;
        if (pid.value !== 0x00) throw new Error('unexpected packet id');
        const sl = decodeVarInt(response, offset);
        offset += sl.size;
        const json = response.subarray(offset, offset + sl.value).toString('utf8');
        const parsed = JSON.parse(json);
        const online = typeof parsed?.players?.online === 'number' ? parsed.players.online : 0;
        const max = typeof parsed?.players?.max === 'number' ? parsed.players.max : 0;
        return { online, max };
    } finally {
        socket.destroy();
    }
};

const getSourcePlayers = async (host: string, port: number) => {
    return new Promise<{ online: number; max: number }>((resolve, reject) => {
        const socket = dgram.createSocket('udp4');
        const payload = Buffer.concat([
            Buffer.from([0xff, 0xff, 0xff, 0xff]),
            Buffer.from('TSource Engine Query\0', 'binary')
        ]);

        const timer = setTimeout(() => {
            socket.close();
            reject(new Error('timeout'));
        }, 1500);

        const cleanup = () => {
            clearTimeout(timer);
            socket.removeAllListeners();
        };

        socket.on('error', (err) => {
            cleanup();
            socket.close();
            reject(err);
        });

        socket.on('message', (msg) => {
            try {
                cleanup();
                socket.close();
                if (msg.length < 6) throw new Error('short response');
                if (msg.readInt32LE(0) !== -1) throw new Error('bad header');
                if (msg[4] !== 0x49) throw new Error('unexpected response type');
                let offset = 5;
                const readString = () => {
                    const end = msg.indexOf(0, offset);
                    if (end === -1) throw new Error('unterminated string');
                    const s = msg.toString('utf8', offset, end);
                    offset = end + 1;
                    return s;
                };

                offset += 1;
                readString();
                readString();
                readString();
                readString();
                offset += 2;
                const online = msg[offset];
                const max = msg[offset + 1];
                resolve({ online, max });
            } catch (e) {
                reject(e);
            }
        });

        socket.send(payload, port, host, (err) => {
            if (err) {
                cleanup();
                socket.close();
                reject(err);
            }
        });
    });
};

export const createGameServer = async (req: Request, res: Response) => {
    // Admin only or via payment
    try {
        const { userId, nodeId, game, name, ram, slots } = req.body;
        const rawMcVersion = (req.body as any).mcVersion;
        const rawMcCore = (req.body as any).mcCore ?? (req.body as any).core;
        const rawMcCustomJarUrl = (req.body as any).mcCustomJarUrl;
        const rawMcCustomJarName = (req.body as any).mcCustomJarName;
        const rawCs16Build = (req.body as any).cs16Build;

        const safeMcVersion = validateMcVersion(rawMcVersion);
        const safeMcCore = validateMcCore(rawMcCore);
        const safeMcCustomJarUrl = validateUrlSafe(rawMcCustomJarUrl);
        const safeMcCustomJarName = validateJarName(rawMcCustomJarName);
        const safeCs16Build = validateCs16Build(rawCs16Build);
        
        if (game === 'minecraft' && safeMcCore === 'custom' && !safeMcCustomJarUrl && !safeMcCustomJarName) {
            res.status(400).json({ message: 'Для CUSTOM-ядра Minecraft укажите mcCustomJarUrl (ссылка на .jar) или mcCustomJarName (имя файла, залили через SFTP в /data).' });
            return;
        }

        if (game === 'cs16' && rawCs16Build && Object.prototype.hasOwnProperty.call(CS16_BUILDS, String(rawCs16Build).trim().toLowerCase()) === false) {
            res.status(400).json({
                message: `Неизвестная сборка CS16: '${rawCs16Build}'. Доступные: ${Object.keys(CS16_BUILDS).join(', ')}.`
            });
            return;
        }
        
        const node = await ServerNode.findByPk(nodeId);
        if (!node) {
            res.status(404).json({ message: 'Node not found' });
            return;
        }

        const basePort = GAME_PORTS[game];
        if (!basePort) {
            res.status(400).json({ message: 'Unsupported game' });
            return;
        }

        const port = await findFreePort(nodeId, basePort);
        const containerName = `gs_${userId.split('-')[0]}_${port}`;
        
        let dockerCmd = '';
        if (game === 'minecraft') {
            dockerCmd = `docker run ${buildMinecraftDockerArgs({
                ram: ram || 1024, slots: slots || 20,
                mcVersion: safeMcVersion, core: safeMcCore,
                mcCustomJarUrl: safeMcCustomJarUrl, mcCustomJarName: safeMcCustomJarName,
            }, port, containerName)}`;
        } else if (game === 'cs2') {
            dockerCmd = `docker run -d -p ${port}:27015/udp -p ${port}:27015/tcp --name ${containerName} -e SRCDS_TOKEN=YOUR_TOKEN ${GAME_IMAGES['cs2']} +maxplayers ${slots || 32}`;
        } else if (game === 'cs16') {
            const built = buildCs16DockerArgs({
                ram: ram || 1024,
                slots: slots || 32,
                userId,
                id: 'tmp_' + userId,
                cs16Build: safeCs16Build,
            }, port, containerName);
            const parts: string[] = ['docker run'];
            if (built.hostVolumeArg) parts.push(built.hostVolumeArg);
            if (built.runFlags) parts.push(built.runFlags);
            parts.push(built.image);
            if (built.cmd) parts.push(built.cmd);
            dockerCmd = parts.join(' ');
        }

        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        let containerId = '';
        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
             console.log(`[Mock] Creating ${game} server on test node ${node.name}...`);
             containerId = 'mock_' + Math.random().toString(36).substring(7);
        } else {
             console.log(`Creating container ${containerName} on ${node.ip}...`);
             const output = await execCommand(config, dockerCmd);
             containerId = output.trim().substring(0, 12);
        }

        const now = new Date();
        const paidUntil = addMonths(now, 1);
        const monthlyPrice = calculateMonthlyPrice(ram || 1024, slots || 10, getSlotPriceForNodeGame(node as any, game));

        const server = await GameServer.create({
            userId,
            nodeId,
            game,
            name,
            port,
            ram: ram || 1024,
            slots: slots || 10,
            core: game === 'minecraft' ? safeMcCore : undefined,
            mcVersion: game === 'minecraft' ? safeMcVersion : undefined,
            mcCustomJarUrl: game === 'minecraft' ? safeMcCustomJarUrl : undefined,
            mcCustomJarName: game === 'minecraft' ? safeMcCustomJarName : undefined,
            cs16Build: game === 'cs16' ? safeCs16Build : undefined,
            status: 'running',
            containerId,
            monthlyPrice,
            paidUntil
        });

        res.status(201).json(server);

    } catch (error) {
        console.error('Create game server error:', error);
        res.status(500).json({ message: 'Error creating game server' });
    }
};

export const getGameServers = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        // @ts-ignore
        const isAdmin = req.user.role === 'admin';
        
        const where = isAdmin ? {} : { userId };
        const servers = await GameServer.findAll({ where, include: ['node'] });
        res.json(servers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching servers' });
    }
};

export const controlServer = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const { action } = req.body; // start, stop, restart
        
        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }

        const paidUntil = (server as any).paidUntil ? new Date((server as any).paidUntil) : null;
        if (paidUntil && paidUntil < new Date() && (action === 'start' || action === 'restart')) {
            res.status(402).json({ message: 'Подписка не оплачена' });
            return;
        }
        
        // @ts-ignore
        const node = server.node;
        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        const ident = getGameContainerIdentifier(server as any);
        if (!ident) {
            res.status(400).json({ message: 'Container is not ready yet' });
            return;
        }
        let cmd = '';
        if (action === 'start') cmd = `docker start ${ident}`;
        if (action === 'stop') cmd = `docker stop ${ident}`;
        if (action === 'restart') cmd = `docker restart ${ident}`;

        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            console.log(`[Mock] ${action} server ${server.containerId}`);
        } else {
             if (cmd) {
                await execCommand(config, cmd);
            }
        }
        
        // Update status
        if (action === 'start') await server.update({ status: 'running' });
        if (action === 'stop') await server.update({ status: (server as any).status === 'suspended' ? 'suspended' : 'stopped' });
        if (action === 'restart') await server.update({ status: 'running' });

        res.json({ message: `Server ${action}ed` });
    } catch (error) {
        console.error('Control error:', error);
        res.status(500).json({ message: 'Error controlling server' });
    }
};

const PERIOD_DISCOUNTS: Record<number, number> = { 1: 0, 3: 0.05, 6: 0.10, 12: 0.15 };
const VALID_PERIODS = [1, 3, 6, 12];

const formatPeriodSuffix = (n: number) => {
  if (n === 1) return '1 мес.';
  if (n === 3) return '3 мес.';
  if (n === 6) return '6 мес.';
  return '12 мес.';
};

export const orderGameServer = async (req: Request, res: Response) => {
    try {
        const { nodeId, game, name, ram, slots } = req.body;
        const periodRaw = Number(req.body.periodMonths) || 1;
        const periodMonths = VALID_PERIODS.includes(periodRaw) ? periodRaw : 1;
        const discount = PERIOD_DISCOUNTS[periodMonths] ?? 0;

        const rawMcVersion = (req.body as any).mcVersion;
        const rawMcCore = (req.body as any).mcCore ?? (req.body as any).core;
        const rawMcCustomJarUrl = (req.body as any).mcCustomJarUrl;
        const rawMcCustomJarName = (req.body as any).mcCustomJarName;
        const rawCs16Build = (req.body as any).cs16Build;

        const safeMcVersion = validateMcVersion(rawMcVersion);
        const safeMcCore = validateMcCore(rawMcCore);
        const safeMcCustomJarUrl = validateUrlSafe(rawMcCustomJarUrl);
        const safeMcCustomJarName = validateJarName(rawMcCustomJarName);
        const safeCs16Build = validateCs16Build(rawCs16Build);

        if (game === 'minecraft' && safeMcCore === 'custom' && !safeMcCustomJarUrl && !safeMcCustomJarName) {
            res.status(400).json({ message: 'Для CUSTOM-ядра Minecraft укажите ссылку на .jar (mcCustomJarUrl) или имя файла, который вы зальёте через SFTP (mcCustomJarName).' });
            return;
        }

        if (game === 'cs16' && rawCs16Build && Object.prototype.hasOwnProperty.call(CS16_BUILDS, String(rawCs16Build).trim().toLowerCase()) === false) {
            res.status(400).json({
                message: `Неизвестная сборка CS16: '${rawCs16Build}'. Доступные: ${Object.keys(CS16_BUILDS).join(', ')}.`
            });
            return;
        }

        // @ts-ignore
        const userId = req.user.id;

        const node = await ServerNode.findByPk(nodeId);
        if (!node) {
            res.status(404).json({ message: 'Node not found' });
            return;
        }
        const supportedGamesRaw = (node as any).supportedGames;
        const supportedGames = Array.isArray(supportedGamesRaw) ? supportedGamesRaw : typeof supportedGamesRaw === 'string' ? (() => { try { const p = JSON.parse(supportedGamesRaw); return Array.isArray(p) ? p : null; } catch { return null; } })() : null;
        if (supportedGames && !supportedGames.includes(game)) {
            res.status(400).json({ message: 'Game is not available on this node' });
            return;
        }

        const basePort = GAME_PORTS[game];
        if (!basePort) {
            res.status(400).json({ message: 'Unsupported game' });
            return;
        }

        const now = new Date();
        const safeRam = Number(ram) || 1024;
        const safeSlots = Math.max(10, Number(slots) || 10);
        const monthlyPrice = calculateMonthlyPrice(safeRam, safeSlots, getSlotPriceForNodeGame(node as any, game));
        const totalAmount = Math.ceil(monthlyPrice * periodMonths * (1 - discount));

        // @ts-ignore
        const isAdmin: boolean = req.user.role === 'admin';
        const user = await User.findByPk(userId, { attributes: ['id', 'balance'] });
        if (!user) {
            res.status(404).json({ message: 'Пользователь не найден' });
            return;
        }
        const userBalance = round2(user.balance ?? 0);

        if (!isAdmin && userBalance < totalAmount - 0.001) {
            res.status(402).json({
                message: 'Недостаточно средств на балансе',
                needed: round2(totalAmount - userBalance),
                balance: userBalance,
                totalAmount,
            });
            return;
        }

        const server = await GameServer.create({
            userId,
            nodeId,
            game,
            name: name || `${game} server`,
            ram: safeRam,
            slots: safeSlots,
            core: game === 'minecraft' ? safeMcCore : undefined,
            mcVersion: game === 'minecraft' ? safeMcVersion : undefined,
            mcCustomJarUrl: game === 'minecraft' ? safeMcCustomJarUrl : undefined,
            mcCustomJarName: game === 'minecraft' ? safeMcCustomJarName : undefined,
            cs16Build: game === 'cs16' ? safeCs16Build : undefined,
            status: isAdmin ? 'running' : 'pending_payment',
            monthlyPrice,
            paidUntil: now
        });

        const invoice = await Invoice.create({
            title: `Оплата игрового сервера: ${server.name} (${formatPeriodSuffix(periodMonths)}${discount > 0 ? `, -${Math.round(discount*100)}%` : ''})`,
            amount: totalAmount,
            status: 'pending',
            type: 'monthly',
            dueDate: new Date(),
            userId,
            gameServerId: server.id,
            periodMonths
        });

        if (!isAdmin) {
            try {
                await adjustBalance({
                    userId,
                    amount: -round2(totalAmount),
                    type: 'withdraw',
                    description: invoice.title,
                    invoiceId: invoice.id,
                    gameServerId: server.id,
                });
            } catch (wb: any) {
                res.status(402).json({
                    message: wb.message || 'Недостаточно средств',
                    balance: userBalance,
                    totalAmount,
                    needed: round2(totalAmount - userBalance),
                });
                return;
            }
            invoice.status = 'paid';
            await invoice.save();
            server.status = 'running';
            server.paidUntil = addMonths(now, periodMonths);
            await server.save();
            try {
                await applyGameServerPaidInvoice(invoice);
            } catch (provErr: any) {
                console.error('Provision after order pay failed:', provErr?.message || provErr);
            }
            res.status(201).json({ server, invoice, period: periodMonths, discount: Math.round(discount * 100), paidWithBalance: true });
            return;
        }

        res.status(201).json({ server, invoice, period: periodMonths, discount: Math.round(discount * 100), paidWithBalance: false });

    } catch (error) {
        console.error('Order game server error:', error);
        res.status(500).json({ message: 'Error ordering game server' });
    }
};

export const getConsoleLogs = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }
        
        // @ts-ignore
        const node = server.node;
        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            const mockLogs = `[${new Date().toISOString()}] Server starting...\n[${new Date().toISOString()}] Loading maps...\n[${new Date().toISOString()}] Server is ready for connections on port ${server.port}`;
            res.json({ logs: mockLogs });
        } else {
            const userId = (server as any).userId as string | undefined;
            const containerName = userId ? `gs_${userId.split('-')[0]}_${server.port}` : null;
            const identifiers = [server.containerId, containerName].filter(Boolean) as string[];

            let logs = '';
            for (const ident of identifiers) {
                const out = await execCommand(config, `sh -lc "docker logs --tail 200 ${ident} 2>&1 || true"`);
                if (out && out.trim()) {
                    logs = out;
                    break;
                }
                logs = out;
            }

            res.json({ logs });
        }
    } catch (error) {
        console.error('Logs error:', error);
        res.status(500).json({ message: 'Error fetching logs' });
    }
};

export const getPlayersCount = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }

        // @ts-ignore
        const node = server.node;
        const safeMax = server.slots || 0;

        if (!node || !node.ip || !server.port || server.status === 'suspended' || server.status === 'pending' || server.status === 'pending_payment' || server.status === 'awaiting_payment') {
            res.json({ online: 0, max: safeMax });
            return;
        }

        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            res.json({ online: 0, max: safeMax });
            return;
        }

        const host = node.ip as string;
        const port = Number(server.port) || 0;
        if (!port) {
            res.json({ online: 0, max: safeMax });
            return;
        }

        let online = 0;
        let max = safeMax;
        try {
            if (server.game === 'minecraft') {
                const r = await getMinecraftPlayers(host, port);
                online = Number(r?.online ?? 0); max = Number(r?.max ?? safeMax);
            } else if (server.game === 'cs2' || server.game === 'cs16') {
                const r = await getSourcePlayers(host, port);
                online = Number(r?.online ?? 0); max = Number(r?.max ?? safeMax);
            }
        } catch (qerr: any) {
            online = 0;
            max = safeMax;
        }
        res.json({ online, max: max || safeMax });
    } catch (error) {
        console.error('Players count error:', error);
        res.status(200).json({ online: 0, max: 0 });
    }
};

export const sendCommand = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const { command } = req.body;
        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }
        
        // @ts-ignore
        const node = server.node;
        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        let fullCmd = `docker exec -i ${server.containerId} ${command}`;
        if (server.game === 'minecraft') {
            fullCmd = `docker exec -i ${server.containerId} rcon-cli ${command}`;
        }
        
        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            console.log(`[Mock] Executing command ${command} in container ${server.containerId}...`);
            res.json({ output: `Executed command: ${command}\nResult: Success (Mock)` });
        } else {
            const output = await execCommand(config, fullCmd);
            res.json({ output });
        }
    } catch (error) {
        console.error('Command error:', error);
        res.status(500).json({ message: 'Error sending command' });
    }
};

const parseProperties = (content: string) => {
    const props: any = {};
    content.split('\n').forEach(line => {
        if (line.trim().startsWith('#')) return;
        const [key, ...valueParts] = line.split('=');
        if (key) props[key.trim()] = valueParts.join('=').trim();
    });
    return props;
};

const stringifyProperties = (props: any) => {
    return Object.entries(props).map(([k, v]) => `${k}=${v}`).join('\n');
};

export const getServerSettings = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }
        
        // @ts-ignore
        const node = server.node;
        
        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            res.json({
                'motd': 'A Minecraft Server',
                'gamemode': 'survival',
                'difficulty': 'easy',
                'pvp': 'true',
                'online-mode': 'false',
                'max-players': '20',
                'white-list': 'false',
                'core': server.core || 'paper',
                'mcVersion': (server as any).mcVersion || 'LATEST',
                'mcCustomJarUrl': (server as any).mcCustomJarUrl || '',
                'mcCustomJarName': (server as any).mcCustomJarName || '',
            });
            return;
        }

        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        const content = await execCommand(config, `docker exec -i ${server.containerId} cat /data/server.properties`);
        const props = parseProperties(content);
        props.core = server.core || 'paper';
        props.mcVersion = (server as any).mcVersion || 'LATEST';
        props.mcCustomJarUrl = (server as any).mcCustomJarUrl || '';
        props.mcCustomJarName = (server as any).mcCustomJarName || '';
        res.json(props);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ message: 'Error fetching settings' });
    }
};

export const updateServerSettings = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const newSettings = req.body;
        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }

        // @ts-ignore
        const node = server.node;
        const isMinecraft = server.game === 'minecraft';
        const isCs16 = server.game === 'cs16';
        const isMockNode = node.ip === '127.0.0.1' || node.ip === '1.1.1.1';

        const rawMcVersion = isMinecraft ? (newSettings.mcVersion ?? (server as any).mcVersion) : undefined;
        const rawMcCore = isMinecraft ? (newSettings.mcCore ?? newSettings.core ?? server.core) : undefined;
        const rawMcCustomJarUrl = isMinecraft ? (newSettings.mcCustomJarUrl ?? (server as any).mcCustomJarUrl) : undefined;
        const rawMcCustomJarName = isMinecraft ? (newSettings.mcCustomJarName ?? (server as any).mcCustomJarName) : undefined;
        const rawCs16Build = isCs16 ? (newSettings.cs16Build ?? (server as any).cs16Build) : undefined;

        const safeMcVersion = isMinecraft ? validateMcVersion(rawMcVersion) : undefined;
        const safeMcCore = isMinecraft ? validateMcCore(rawMcCore) : undefined;
        const safeMcCustomJarUrl = isMinecraft ? validateUrlSafe(rawMcCustomJarUrl) : undefined;
        const safeMcCustomJarName = isMinecraft ? validateJarName(rawMcCustomJarName) : undefined;
        const safeCs16Build = isCs16 ? validateCs16Build(rawCs16Build) : undefined;

        if (isMinecraft && safeMcCore === 'custom' && !safeMcCustomJarUrl && !safeMcCustomJarName) {
            res.status(400).json({
                message: 'Для CUSTOM-ядра Minecraft укажите ссылку на .jar (mcCustomJarUrl) или имя файла .jar, залитого через SFTP в /data (mcCustomJarName).'
            });
            return;
        }

        if (isCs16 && rawCs16Build && Object.prototype.hasOwnProperty.call(CS16_BUILDS, String(rawCs16Build).trim().toLowerCase()) === false) {
            res.status(400).json({
                message: `Неизвестная сборка CS16: '${rawCs16Build}'. Доступные: ${Object.keys(CS16_BUILDS).join(', ')}.`
            });
            return;
        }

        const beforeCore = String(server.core || '').toLowerCase();
        const beforeVersion = String((server as any).mcVersion || 'LATEST').trim();
        const beforeCustomUrl = String((server as any).mcCustomJarUrl || '').trim();
        const beforeCustomName = String((server as any).mcCustomJarName || '').trim();
        const beforeCs16Build = validateCs16Build((server as any).cs16Build);

        const mcChanged = isMinecraft && (
            String(safeMcCore || '').toLowerCase() !== beforeCore ||
            String(safeMcVersion || '').trim() !== beforeVersion ||
            String(safeMcCustomJarUrl || '').trim() !== beforeCustomUrl ||
            String(safeMcCustomJarName || '').trim() !== beforeCustomName
        );

        const cs16Changed = isCs16 && String(safeCs16Build || '') !== beforeCs16Build;

        if (isMockNode) {
            console.log(`[Mock] Updating settings for ${server.containerId}:`, { mcChanged, cs16Changed });
            const patch: any = {};
            if (isMinecraft && safeMcCore !== undefined) patch.core = safeMcCore;
            if (isMinecraft && safeMcVersion !== undefined) patch.mcVersion = safeMcVersion;
            if (isMinecraft) patch.mcCustomJarUrl = safeMcCustomJarUrl ?? null;
            if (isMinecraft) patch.mcCustomJarName = safeMcCustomJarName ?? null;
            if (isCs16 && safeCs16Build) patch.cs16Build = safeCs16Build;
            if (Object.keys(patch).length > 0) {
                await server.update(patch);
            }
            res.json({ message: 'Settings updated', reprovisioned: false, mock: true });
            return;
        }

        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        let reprovisioned = false;
        let newContainerId: string | undefined;

        if (isMinecraft && mcChanged && !isMockNode) {
            try {
                console.log(`[updateServerSettings] mc* changed, reprovisioning server ${server.id}...`);
                const serverSnapshot: any = server.toJSON
                    ? server.toJSON()
                    : { ...(server as any) };
                serverSnapshot.core = safeMcCore;
                serverSnapshot.mcVersion = safeMcVersion;
                serverSnapshot.mcCustomJarUrl = safeMcCustomJarUrl;
                serverSnapshot.mcCustomJarName = safeMcCustomJarName;

                newContainerId = await reprovisionMinecraftContainer(serverSnapshot, node, config);
                reprovisioned = true;
                console.log(`[updateServerSettings] reprovision OK, new containerId=${newContainerId}`);
            } catch (repErr: any) {
                console.error('[updateServerSettings] reprovision failed:', repErr?.message || repErr);
                res.status(500).json({
                    message: `Ошибка переустановки контейнера: ${repErr?.message || 'unknown'}`,
                    reprovisioned: false,
                });
                return;
            }
        }

        if (isCs16 && cs16Changed && !isMockNode) {
            try {
                console.log(`[updateServerSettings] cs16 build changed, reprovisioning server ${server.id}...`);
                const serverSnapshot: any = server.toJSON
                    ? server.toJSON()
                    : { ...(server as any) };
                serverSnapshot.cs16Build = safeCs16Build;

                newContainerId = await reprovisionCs16Container(serverSnapshot, node, config);
                reprovisioned = true;
                console.log(`[updateServerSettings] cs16 reprovision OK, new containerId=${newContainerId}`);
            } catch (repErr: any) {
                console.error('[updateServerSettings] cs16 reprovision failed:', repErr?.message || repErr);
                res.status(500).json({
                    message: `Ошибка переустановки контейнера CS 1.6: ${repErr?.message || 'unknown'}`,
                    reprovisioned: false,
                });
                return;
            }
        }

        const propsIdent = newContainerId || server.containerId;

        // 1. Read current properties (path depends on game)
        const propsFile =
            isMinecraft ? '/data/server.properties'
            : isCs16 ? '/hlds/cstrike/server.cfg'
            : null;

        let props: any = {};
        if (propsFile) {
            try {
                const content = await execCommand(config, `docker exec -i ${propsIdent} cat "${propsFile}"`);
                props = parseProperties(content);
            } catch (e) {
                console.warn(`[updateServerSettings] could not read ${propsFile}, will write new file:`, e);
            }
        }

        // 2. Merge new settings, strip game-specific keys
        const stripKeys: string[] = [
            'core', 'mcCore', 'mcVersion', 'mcCustomJarUrl', 'mcCustomJarName',
            'cs16Build'
        ];
        const fileSettings: any = {};
        for (const [k, v] of Object.entries(newSettings)) {
            if (stripKeys.includes(k)) continue;
            (fileSettings as any)[k] = v;
        }
        const updatedProps = { ...props, ...fileSettings };
        const newContent = stringifyProperties(updatedProps);

        // 3. Write to container via tmpFile + docker cp
        if (propsFile) {
            try {
                const tmpExt = isMinecraft ? 'properties' : 'cfg';
                const tmpFile = `/tmp/wexa_server_${id}.${tmpExt}`;
                const escapedContent = newContent
                    .replace(/\\/g, '\\\\')
                    .replace(/'/g, "'\\''");
                await execCommand(config, `sh -lc "printf '%s' '${escapedContent}' > ${tmpFile}"`);
                await execCommand(config, `sh -lc "docker cp ${tmpFile} ${propsIdent}:${propsFile} >/dev/null 2>&1 || true"`);
                await execCommand(config, `sh -lc "rm -f ${tmpFile} >/dev/null 2>&1 || true"`);
            } catch (writeErr: any) {
                console.error(`[updateServerSettings] write ${propsFile} failed:`, writeErr?.message || writeErr);
                const humanName = isMinecraft ? 'server.properties' : 'server.cfg';
                res.status(500).json({ message: `Ошибка сохранения ${humanName}` });
                return;
            }
        }

        // 4. DB patch
        const dbPatch: any = {};
        if (isMinecraft && safeMcCore !== undefined) dbPatch.core = safeMcCore;
        if (isMinecraft && safeMcVersion !== undefined) dbPatch.mcVersion = safeMcVersion;
        if (isMinecraft) dbPatch.mcCustomJarUrl = safeMcCustomJarUrl ?? null;
        if (isMinecraft) dbPatch.mcCustomJarName = safeMcCustomJarName ?? null;
        if (isCs16 && safeCs16Build) dbPatch.cs16Build = safeCs16Build;
        if (reprovisioned && newContainerId) dbPatch.containerId = newContainerId;
        if (Object.keys(dbPatch).length > 0) {
            await server.update(dbPatch);
        }

        const actionText = reprovisioned
            ? 'Настройки сохранены. Сервер переустановлен с сохранением данных/миров/админ-листов и запущен.'
            : isCs16
                ? 'Настройки сохранены. Перезапустите сервер CS 1.6 для применения server.cfg (параметры запуска map/slots применены).'
                : 'Настройки сохранены. Перезапустите сервер для применения server.properties.';

        res.json({
            message: actionText,
            reprovisioned,
            newContainerId,
        });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ message: 'Error updating settings' });
    }
};

export const getGameServerFiles = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const path = req.query.path as string || '/';
        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }

        // @ts-ignore
        const node = server.node;
        
        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
             res.json([
                { name: 'server.properties', isDirectory: false, size: 1024, permissions: '-rw-r--r--' },
                { name: 'world', isDirectory: true, size: 4096, permissions: 'drwxr-xr-x' },
                { name: 'logs', isDirectory: true, size: 4096, permissions: 'drwxr-xr-x' },
                { name: 'eula.txt', isDirectory: false, size: 12, permissions: '-rw-r--r--' }
            ]);
            return;
        }

        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        // ls -F to distinguish directories
        const output = await execCommand(config, `docker exec -i ${server.containerId} ls -lF /data/${path}`);
        
        const files = output.split('\n').slice(1).map(line => {
            const parts = line.split(/\s+/);
            if (parts.length < 9) return null;
            
            const permissions = parts[0];
            const size = parseInt(parts[4]);
            const name = parts.slice(8).join(' ');
            const isDirectory = name.endsWith('/') || permissions.startsWith('d');
            
            return {
                name: name.replace(/\/$/, ''), // remove trailing slash
                isDirectory,
                size,
                permissions
            };
        }).filter(f => f !== null);

        res.json(files);
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ message: 'Error fetching files' });
    }
};

export const getGameServerFileContent = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const path = req.query.path as string;
        if (!path) {
            res.status(400).json({ message: 'Path required' });
            return;
        }

        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }

        // @ts-ignore
        const node = server.node;

        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            res.json({ content: '# Mock file content\nserver-port=25565' });
            return;
        }

        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        // Use cat to read file
        const content = await execCommand(config, `docker exec -i ${server.containerId} cat /data/${path}`);
        res.json({ content });

    } catch (error) {
        console.error('Get file content error:', error);
        res.status(500).json({ message: 'Error fetching file content' });
    }
};

export const saveGameServerFileContent = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const { path, content } = req.body;
        
        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }

        // @ts-ignore
        const node = server.node;
        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            console.log(`[Mock] Saving file ${path} for ${server.containerId}`);
            res.json({ message: 'File saved' });
            return;
        }

        // Write file using base64 to avoid escaping issues
        const base64Content = Buffer.from(content).toString('base64');
        const cmd = `echo "${base64Content}" | base64 -d > /data/${path}`;
        await execCommand(config, `docker exec -i ${server.containerId} sh -c '${cmd}'`);
        
        res.json({ message: 'File saved' });

    } catch (error) {
        console.error('Save file error:', error);
        res.status(500).json({ message: 'Error saving file' });
    }
};

export const deleteGameServerFile = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const path = req.query.path as string;
        
        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }

        // @ts-ignore
        const node = server.node;
        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            console.log(`[Mock] Deleting file ${path}`);
            res.json({ message: 'File deleted' });
            return;
        }

        await execCommand(config, `docker exec -i ${server.containerId} rm -rf /data/${path}`);
        
        res.json({ message: 'File deleted' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ message: 'Error deleting file' });
    }
};

export const uploadGameServerFileStream = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const path = req.query.path as string || '';
        
        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }

        // @ts-ignore
        const node = server.node;
        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        if (path.includes('..')) {
            res.status(400).json({ message: 'Invalid path' });
            return;
        }

        const bb = Busboy({ headers: req.headers });
        let uploadPromise: Promise<void> | null = null;

        bb.on('file', (_name, file) => {
            // Escape double quotes in path to prevent command injection/errors
            const safePath = path.replace(/"/g, '\\"');
            const command = `docker exec -i ${server.containerId} sh -c 'cat > "/data/${safePath}"'`;
            uploadPromise = uploadStream(config, command, file);
        });

        bb.on('close', async () => {
            if (uploadPromise) {
                try {
                    await uploadPromise;
                    res.json({ message: 'File uploaded' });
                } catch (error) {
                    console.error('Upload stream error:', error);
                    res.status(500).json({ message: 'Error uploading file' });
                }
            } else {
                res.status(400).json({ message: 'No file uploaded' });
            }
        });

        req.pipe(bb);
    } catch (error) {
        console.error('Upload init error:', error);
        res.status(500).json({ message: 'Error initializing upload' });
    }
};

export const deleteGameServer = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }

        // @ts-ignore
        const node = server.node;
        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            console.log(`[Mock] Deleting server container ${server.containerId}...`);
        } else {
            try {
                // Stop and remove container
                await execCommand(config, `docker stop ${server.containerId}`);
                await execCommand(config, `docker rm ${server.containerId}`);
                // Optional: remove data volume or folder?
                // For now, let's keep data or remove it? Usually we remove it to save space.
                // await execCommand(config, `rm -rf /opt/wexa/servers/${server.containerId}`); // If we used bind mounts
            } catch (err) {
                console.error('Error removing docker container:', err);
                // Continue to delete from DB even if docker fails (maybe it's already gone)
            }
        }

        await server.destroy();
        res.json({ message: 'Server deleted successfully' });

    } catch (error) {
        console.error('Delete server error:', error);
        res.status(500).json({ message: 'Error deleting server' });
    }
};

export const getSftpAccess = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const userId = getUserIdFromReq(req);
        const isAdmin = getIsAdminFromReq(req);

        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }
        if (!isAdmin && userId && (server as any).userId !== userId) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        // @ts-ignore
        const node = server.node;
        const creds = generateSftpCredentials(server.id);

        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            res.json({ enabled: true, host: node.ip, port: 22222, username: creds.username, password: creds.password, path: '/files' });
            return;
        }

        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        const containerName = getSftpContainerName(server as any);
        const exists = await execCommand(config, `sh -lc "docker inspect ${containerName} >/dev/null 2>&1 && echo yes || echo no"`);
        if (exists.trim() !== 'yes') {
            res.json({ enabled: false });
            return;
        }

        const port = await getExistingSftpPort(config, containerName);
        res.json({ enabled: true, host: node.ip, port, username: creds.username, password: creds.password, path: '/files' });
    } catch (error) {
        console.error('SFTP info error:', error);
        res.status(500).json({ message: 'Error fetching SFTP access' });
    }
};

export const enableSftpAccess = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const userId = getUserIdFromReq(req);
        const isAdmin = getIsAdminFromReq(req);

        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }
        if (!isAdmin && userId && (server as any).userId !== userId) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        // @ts-ignore
        const node = server.node;
        const creds = generateSftpCredentials(server.id);

        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            res.json({ enabled: true, host: node.ip, port: 22222, username: creds.username, password: creds.password, path: '/files' });
            return;
        }

        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        const sftpContainerName = getSftpContainerName(server as any);
        const exists = await execCommand(config, `sh -lc "docker inspect ${sftpContainerName} >/dev/null 2>&1 && echo yes || echo no"`);

        const gameContainerId = getGameContainerIdentifier(server as any);
        if (!gameContainerId) {
            res.status(500).json({ message: 'Container ID is missing' });
            return;
        }

        const mountPath = getMountPathForGame((server as any).game);
        if (!mountPath) {
            res.status(400).json({ message: 'SFTP не поддерживается для этой игры' });
            return;
        }

        let dataMountSource = await getVolumeAtPath(config, gameContainerId, mountPath);
        let mountIsVolume = true;
        let bindOwner: { uid: number; gid: number } | null = null;

        if (!dataMountSource) {
            if ((server as any).game === 'cs16') {
                const bind = await ensureHostBindForContainerPath(config, server as any, gameContainerId, mountPath);
                dataMountSource = bind.hostDir;
                mountIsVolume = false;
                bindOwner = { uid: bind.uid, gid: bind.gid };
            } else {
                res.status(500).json({ message: `Не удалось определить volume для ${mountPath}` });
                return;
            }
        }

        const preferred = 22000 + (parseInt(server.id.replace(/-/g, '').slice(0, 4), 16) % 1000);
        let port = await findAvailableSftpPort(config, preferred);
        const existingPort = exists.trim() === 'yes' ? await getExistingSftpPort(config, sftpContainerName) : null;
        if (existingPort) port = existingPort;
        if (exists.trim() === 'yes') {
            await execCommand(config, `sh -lc "docker rm -f ${sftpContainerName} >/dev/null 2>&1 || true"`);
        }

        const owner = bindOwner || (await getPathOwner(config, gameContainerId, mountPath));
        const uid = owner?.uid ?? 1000;
        const gid = owner?.gid ?? 1000;

        await execCommand(
            config,
            `sh -lc "docker run -d --restart unless-stopped --name ${sftpContainerName} -p ${port}:22 -v ${dataMountSource}:/home/${creds.username}/files atmoz/sftp ${creds.username}:${creds.password}:${uid}:${gid}:files >/dev/null"`
        );

        const created = await execCommand(config, `sh -lc "docker inspect ${sftpContainerName} >/dev/null 2>&1 && echo yes || echo no"`);
        if (created.trim() !== 'yes') {
            res.status(500).json({ message: 'Не удалось создать SFTP контейнер' });
            return;
        }

        res.json({ enabled: true, host: node.ip, port, username: creds.username, password: creds.password, path: '/files' });
    } catch (error) {
        console.error('Enable SFTP error:', error);
        const message = error instanceof Error ? error.message : 'Error enabling SFTP access';
        res.status(500).json({ message });
    }
};

export const disableSftpAccess = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const userId = getUserIdFromReq(req);
        const isAdmin = getIsAdminFromReq(req);

        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }
        if (!isAdmin && userId && (server as any).userId !== userId) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        // @ts-ignore
        const node = server.node;

        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            res.json({ enabled: false });
            return;
        }

        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        const containerName = getSftpContainerName(server as any);
        await execCommand(config, `sh -lc "docker rm -f ${containerName} >/dev/null 2>&1 || true"`);
        res.json({ enabled: false });
    } catch (error) {
        console.error('Disable SFTP error:', error);
        res.status(500).json({ message: 'Error disabling SFTP access' });
    }
};

export const createGameServerSubscriptionInvoice = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const { months } = req.body || {};
        const periodRaw = Number(months) || 1;
        const periodMonths = VALID_PERIODS.includes(periodRaw) ? periodRaw : Math.max(1, Math.min(12, periodRaw));
        const discount = PERIOD_DISCOUNTS[periodMonths] ?? 0;

        // @ts-ignore
        const userId = req.user.id;
        // @ts-ignore
        const isAdmin = req.user.role === 'admin';

        const server = await GameServer.findByPk(id);
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }
        if (!isAdmin && (server as any).userId !== userId) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        let fallbackMonthly = calculateMonthlyPrice(server.ram || 1024, server.slots || 10, 10);
        try {
            const node = await ServerNode.findByPk((server as any).nodeId);
            if (node) {
                fallbackMonthly = calculateMonthlyPrice((server as any).ram || 1024, (server as any).slots || 10, getSlotPriceForNodeGame(node as any, (server as any).game));
            }
        } catch (e) {
            void e;
        }
        const monthlyPrice = Number(server.monthlyPrice) || fallbackMonthly;
        const amount = Math.max(0, Math.ceil(monthlyPrice * periodMonths * (1 - discount)));

        if (!isAdmin) {
            const u = await User.findByPk(server.userId, { attributes: ['id', 'balance'] });
            const userBal = round2(u?.balance ?? 0);
            if (userBal < amount - 0.001) {
                res.status(402).json({
                    message: 'Недостаточно средств на балансе',
                    needed: round2(amount - userBal),
                    balance: userBal,
                    totalAmount: amount,
                });
                return;
            }
        }

        const invoice = await Invoice.create({
            title: `Продление игрового сервера: ${server.name} (${formatPeriodSuffix(periodMonths)}${discount > 0 ? `, -${Math.round(discount*100)}%` : ''})`,
            amount,
            status: 'pending',
            type: 'monthly',
            dueDate: new Date(),
            userId: server.userId,
            gameServerId: server.id,
            periodMonths: periodMonths
        });

        if (!isAdmin) {
            try {
                await adjustBalance({
                    userId: server.userId,
                    amount: -round2(amount),
                    type: 'withdraw',
                    description: invoice.title,
                    invoiceId: invoice.id,
                    gameServerId: server.id,
                });
            } catch (wb: any) {
                res.status(402).json({ message: wb.message || 'Недостаточно средств' });
                return;
            }
            invoice.status = 'paid';
            await invoice.save();
            try { await applyGameServerPaidInvoice(invoice); } catch (e) { console.error(e); }
            res.status(201).json({ ...invoice.toJSON(), paidWithBalance: true });
            return;
        }

        res.status(201).json(invoice);
    } catch (error) {
        console.error('Create game server subscription invoice error:', error);
        res.status(500).json({ message: 'Ошибка при создании счета подписки' });
    }
};

export const applyGameServerPaidInvoice = async (invoice: any): Promise<void> => {
    if (!invoice || !invoice.gameServerId) return;
    if (invoice.type !== 'monthly') return;

    const server = await GameServer.findByPk(invoice.gameServerId, { include: [{ model: ServerNode, as: 'node' }] });
    if (!server) return;

    let startDate = new Date();
    const currentPaidUntil = server.paidUntil ? new Date(server.paidUntil as string) : null;
    if (currentPaidUntil && currentPaidUntil > startDate) {
        startDate = currentPaidUntil;
    }

    const monthsToAdd = Number(invoice.periodMonths) || 1;
    const newPaidUntil = new Date(startDate);
    newPaidUntil.setMonth(newPaidUntil.getMonth() + monthsToAdd);

    const needsProvision = !server.containerId || !server.port;
    const node = (server as unknown as { node?: ServerNode }).node;

    if (needsProvision) {
        if (!node) {
            console.error('GameServer has no node loaded for provisioning');
        } else if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            const basePortByGame: Record<string, number> = { minecraft: 25565, cs2: 27015, cs16: 27015 };
            const basePort = basePortByGame[server.game] || 25565;
            const last = await GameServer.findOne({ where: { nodeId: server.nodeId }, order: [['port', 'DESC']] });
            const port = !last || !last.port || last.port < basePort ? basePort : last.port + 1;
            await server.update({
                port,
                containerId: 'mock_' + Math.random().toString(36).substring(7),
                status: 'running',
                paidUntil: newPaidUntil
            });
        } else {
            const basePortByGame: Record<string, number> = { minecraft: 25565, cs2: 27015, cs16: 27015 };
            const basePort = basePortByGame[server.game] || 25565;
            const last = await GameServer.findOne({ where: { nodeId: server.nodeId }, order: [['port', 'DESC']] });
            const port = !last || !last.port || last.port < basePort ? basePort : last.port + 1;
            const containerName = `gs_${server.userId.split('-')[0]}_${port}`;

            let dockerCmd = '';
            if (server.game === 'minecraft') {
                dockerCmd = `docker run ${buildMinecraftDockerArgs(server, port, containerName)}`;
            } else if (server.game === 'cs2') {
                dockerCmd = `docker run -d -p ${port}:27015/udp -p ${port}:27015/tcp --name ${containerName} -e SRCDS_TOKEN=YOUR_TOKEN joedwards32/cs2 +maxplayers ${server.slots || 32}`;
            } else if (server.game === 'cs16') {
                const built = buildCs16DockerArgs(server, port, containerName);
                const parts: string[] = ['docker run'];
                if (built.hostVolumeArg) parts.push(built.hostVolumeArg);
                if (built.runFlags) parts.push(built.runFlags);
                parts.push(built.image);
                if (built.cmd) parts.push(built.cmd);
                dockerCmd = parts.join(' ');
            } else {
                dockerCmd = `docker run -d -p ${port}:27015/udp -p ${port}:27015/tcp --name ${containerName} archont94/counter-strike1.6:latest +map de_dust2 +maxplayers ${server.slots || 32}`;
            }

            const config = {
                host: node.ip,
                port: node.sshPort,
                username: node.sshUser,
                password: node.sshPassword ? decrypt(node.sshPassword) : undefined
            };

            const output = await execCommand(config, dockerCmd);
            const containerId = output.trim().substring(0, 12);
            await server.update({ port, containerId, status: 'running', paidUntil: newPaidUntil });
        }
    } else {
        await server.update({ paidUntil: newPaidUntil });
    }
    console.log(`GameServer ${server.id} subscription extended by ${monthsToAdd} months until ${newPaidUntil}`);

    if (node && node.ip !== '127.0.0.1' && node.ip !== '1.1.1.1') {
        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };
        const ident = server.containerId || `gs_${(server.userId as string).split('-')[0]}_${server.port}`;
        await execCommand(config, `sh -lc "docker start ${ident} >/dev/null 2>&1 || true"`);
        await server.update({ status: 'running' });
    }
};

const readCString = (buf: Buffer, offset: number) => {
    const end = buf.indexOf(0, offset);
    if (end === -1) return { value: '', next: buf.length };
    return { value: buf.toString('utf8', offset, end), next: end + 1 };
};

const getSourcePlayersDetailed = async (host: string, port: number): Promise<{ name: string; score: number; durationSec: number }[]> => {
    return new Promise((resolve, reject) => {
        const socket = dgram.createSocket('udp4');
        let challenge = -1;
        let stage: 'challenge' | 'player' = 'challenge';
        let timer: NodeJS.Timeout | null = null;

        const cleanup = () => {
            if (timer) clearTimeout(timer);
            socket.removeAllListeners();
        };

        const sendChallenge = () => {
            socket.send(Buffer.from([0xff, 0xff, 0xff, 0xff, 0x55, 0xff, 0xff, 0xff, 0xff]), port, host);
        };
        const sendPlayer = () => {
            const b = Buffer.alloc(9);
            b.writeInt32LE(-1, 0);
            b[4] = 0x55;
            b.writeInt32LE(challenge, 5);
            socket.send(b, port, host);
        };

        timer = setTimeout(() => {
            cleanup();
            socket.close();
            reject(new Error('timeout A2S_PLAYER'));
        }, 2500);

        socket.on('error', (err) => {
            cleanup();
            socket.close();
            reject(err);
        });

        socket.on('message', (msg) => {
            try {
                if (msg.length < 6) return;
                if (msg.readInt32LE(0) !== -1) return;

                if (stage === 'challenge') {
                    if (msg[4] === 0x41 && msg.length >= 9) {
                        challenge = msg.readInt32LE(5);
                        stage = 'player';
                        sendPlayer();
                        return;
                    }
                }

                if (stage === 'player' && msg[4] === 0x44) {
                    cleanup();
                    socket.close();
                    let offset = 5;
                    const count = msg[offset++];
                    const result: { name: string; score: number; durationSec: number }[] = [];
                    for (let i = 0; i < count; i++) {
                        offset += 1;
                        const nameRes = readCString(msg, offset);
                        const name = nameRes.value;
                        offset = nameRes.next;
                        const score = msg.readInt32LE(offset);
                        offset += 4;
                        const durationF = msg.readFloatLE(offset);
                        offset += 4;
                        result.push({ name, score, durationSec: Math.max(0, Math.round(durationF)) });
                    }
                    resolve(result);
                }
            } catch (e) {
                cleanup();
                socket.close();
                reject(e);
            }
        });

        socket.on('listening', () => {
            sendChallenge();
        });

        socket.bind(0);
    });
};

const getMinecraftPlayersDetailed = async (server: any, node: any): Promise<{ name: string; score: number; durationSec: number }[]> => {
    const config = {
        host: node.ip,
        port: node.sshPort,
        username: node.sshUser,
        password: node.sshPassword ? decrypt(node.sshPassword) : undefined
    };
    const ident = server.containerId || `gs_${(server.userId as string).split('-')[0]}_${server.port}`;
    let out = '';
    try {
        out = await execCommand(config, `docker exec -i ${ident} rcon-cli list`);
    } catch (e) {
        out = '';
    }
    if (!out && (node.ip === '127.0.0.1' || node.ip === '1.1.1.1')) {
        return [];
    }
    if (!out) return [];
    const match = out.match(/[:]\s*(.+)$/m);
    if (!match) return [];
    const names = match[1].split(',').map((s) => s.trim()).filter(Boolean);
    return names.map((name) => ({ name, score: 0, durationSec: 0 }));
};

export const getPlayersList = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const userId = getUserIdFromReq(req);
        const isAdmin = getIsAdminFromReq(req);
        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) {
            res.status(404).json({ message: 'Server not found' });
            return;
        }
        if (!isAdmin && userId && (server as any).userId !== userId) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        // @ts-ignore
        const node = server.node;
        let players: { name: string; score: number; durationSec: number }[] = [];
        let countOnly = false;

        try {
            if (server.game === 'minecraft') {
                if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
                    players = [];
                } else {
                    players = await getMinecraftPlayersDetailed(server, node);
                }
            } else if (server.game === 'cs2' || server.game === 'cs16') {
                if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
                    players = [];
                } else {
                    players = await getSourcePlayersDetailed(node.ip as string, server.port as number);
                }
            }
        } catch (e) {
            countOnly = true;
        }

        let fallback: { online: number; max: number } = { online: players.length, max: server.slots || 0 };
        try {
            if (server.game === 'minecraft') {
                if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') fallback = { online: 0, max: server.slots || 0 };
                else fallback = await getMinecraftPlayers(node.ip as string, server.port as number);
            } else if (server.game === 'cs2' || server.game === 'cs16') {
                if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') fallback = { online: 0, max: server.slots || 0 };
                else fallback = await getSourcePlayers(node.ip as string, server.port as number);
            }
        } catch (_) { /* keep fallback */ }

        res.json({ players, countOnly, online: fallback.online, max: fallback.max });
    } catch (error) {
        console.error('Players list error:', error);
        res.status(500).json({ message: 'Error fetching players' });
    }
};

export const kickPlayer = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const userId = getUserIdFromReq(req);
        const isAdmin = getIsAdminFromReq(req);
        const { name, reason } = req.body;
        if (!name) { res.status(400).json({ message: 'name required' }); return; }

        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) { res.status(404).json({ message: 'Server not found' }); return; }
        if (!isAdmin && userId && (server as any).userId !== userId) { res.status(403).json({ message: 'Forbidden' }); return; }
        // @ts-ignore
        const node = server.node;

        let cmd = '';
        if (server.game === 'minecraft') {
            cmd = `kick ${name}${reason ? ` ${reason}` : ''}`;
        } else {
            cmd = `sm_kick "${name}"${reason ? ` "${reason}"` : ''}`;
        }

        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            res.json({ ok: true, output: `[Mock] ${cmd}` });
            return;
        }
        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };
        const fullCmd = server.game === 'minecraft'
            ? `docker exec -i ${server.containerId} rcon-cli ${cmd}`
            : `docker exec -i ${server.containerId} ${cmd}`;
        const output = await execCommand(config, fullCmd);
        res.json({ ok: true, output });
    } catch (error) {
        console.error('Kick player error:', error);
        res.status(500).json({ message: 'Error kicking player' });
    }
};

export const banPlayer = async (req: Request, res: Response) => {
    try {
        const id = getIdParam(req);
        const userId = getUserIdFromReq(req);
        const isAdmin = getIsAdminFromReq(req);
        const { name, minutes, reason } = req.body;
        if (!name) { res.status(400).json({ message: 'name required' }); return; }
        const mins = Math.max(0, Number(minutes) || 0);

        const server = await GameServer.findByPk(id, { include: ['node'] });
        if (!server) { res.status(404).json({ message: 'Server not found' }); return; }
        if (!isAdmin && userId && (server as any).userId !== userId) { res.status(403).json({ message: 'Forbidden' }); return; }
        // @ts-ignore
        const node = server.node;

        let cmd = '';
        if (server.game === 'minecraft') {
            cmd = mins <= 0 ? `ban ${name}${reason ? ` ${reason}` : ''}` : `ban-ip ${name} ${mins}m${reason ? ` ${reason}` : ''}`;
        } else {
            cmd = mins <= 0 ? `banid 0 "${name}" kick` : `banid ${mins} "${name}" kick`;
        }

        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            res.json({ ok: true, output: `[Mock] ${cmd}` });
            return;
        }
        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };
        const fullCmd = server.game === 'minecraft'
            ? `docker exec -i ${server.containerId} rcon-cli ${cmd}`
            : `docker exec -i ${server.containerId} ${cmd}`;
        const output = await execCommand(config, fullCmd);
        res.json({ ok: true, output });
    } catch (error) {
        console.error('Ban player error:', error);
        res.status(500).json({ message: 'Error banning player' });
    }
};
