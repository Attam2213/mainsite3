
import { Request, Response } from 'express';
import { GameServer, ServerNode, Invoice } from '../models';
import { decrypt } from '../utils/crypto';
import { execCommand, uploadStream } from '../services/sshService';
import Busboy from 'busboy';
import * as net from 'net';
import * as dgram from 'dgram';
import crypto from 'crypto';

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
            dockerCmd = `docker run -d -p ${port}:25565 -e EULA=TRUE -e MAX_PLAYERS=${slots || 20} --name ${containerName} -m ${ram || 1024}m ${GAME_IMAGES['minecraft']}`;
        } else if (game === 'cs2') {
            dockerCmd = `docker run -d -p ${port}:27015/udp -p ${port}:27015/tcp --name ${containerName} -e SRCDS_TOKEN=YOUR_TOKEN ${GAME_IMAGES['cs2']} +maxplayers ${slots || 32}`;
        } else if (game === 'cs16') {
            dockerCmd = `docker run -d -p ${port}:27015/udp -p ${port}:27015/tcp --name ${containerName} ${GAME_IMAGES['cs16']} +map de_dust2 +maxplayers ${slots || 32}`;
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

export const orderGameServer = async (req: Request, res: Response) => {
    try {
        const { nodeId, game, name, ram, slots } = req.body;
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
        const monthlyPrice = calculateMonthlyPrice(ram || 1024, slots || 10, getSlotPriceForNodeGame(node as any, game));

        const server = await GameServer.create({
            userId,
            nodeId,
            game,
            name,
            ram: ram || 1024,
            slots: slots || 10,
            status: 'pending_payment',
            monthlyPrice,
            paidUntil: now
        });

        const invoice = await Invoice.create({
            title: `Оплата игрового сервера: ${server.name} (1 мес.)`,
            amount: monthlyPrice,
            status: 'pending',
            type: 'monthly',
            dueDate: new Date(),
            userId,
            gameServerId: server.id,
            periodMonths: 1
        });

        res.status(201).json({ server, invoice });

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

        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            res.json({ online: 0, max: server.slots || 0 });
            return;
        }

        const host = node.ip as string;
        const port = server.port as number;

        if (server.game === 'minecraft') {
            const { online, max } = await getMinecraftPlayers(host, port);
            res.json({ online, max });
            return;
        }

        if (server.game === 'cs2' || server.game === 'cs16') {
            const { online, max } = await getSourcePlayers(host, port);
            res.json({ online, max });
            return;
        }

        res.json({ online: 0, max: server.slots || 0 });
    } catch (error) {
        console.error('Players count error:', error);
        res.status(500).json({ message: 'Error fetching players count' });
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
                'core': server.core || 'vanilla'
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
        props.core = server.core || 'vanilla';
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

        if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
            console.log(`[Mock] Updating settings for ${server.containerId}:`, newSettings);
            if (newSettings.core && newSettings.core !== server.core) {
                await server.update({ core: newSettings.core });
            }
            res.json({ message: 'Settings updated' });
            return;
        }

        const config = {
            host: node.ip,
            port: node.sshPort,
            username: node.sshUser,
            password: node.sshPassword ? decrypt(node.sshPassword) : undefined
        };

        // 1. Get current properties
        const content = await execCommand(config, `docker exec -i ${server.containerId} cat /data/server.properties`);
        const props = parseProperties(content);
        
        // 2. Merge new settings
        // Remove 'core' from props to save, as it's not in server.properties
        const { core, ...fileSettings } = newSettings;
        const updatedProps = { ...props, ...fileSettings };
        
        // 3. Write back
        const newContent = stringifyProperties(updatedProps);
        // We need to escape special characters for bash echo/cat
        // Using a temporary file approach or proper escaping would be safer
        // For now, let's try a simple cat with heredoc or similar if possible, 
        // but ssh exec is tricky. Let's use the stream upload we already have or simple echo.
        
        // Simple echo might fail with multiline. 
        // Let's use a one-liner to write file
        const cmd = `echo "${newContent.replace(/"/g, '\\"')}" > /data/server.properties`;
        await execCommand(config, `docker exec -i ${server.containerId} sh -c '${cmd}'`);
        
        // 4. Update Core in DB if changed
        if (core && core !== server.core) {
            await server.update({ core });
            // TODO: Trigger reinstall/update logic if core changed
        }

        res.json({ message: 'Settings updated' });

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
        const periodMonths = Math.max(1, Math.min(12, Number(months) || 1));

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
        const amount = Math.max(0, Math.round(monthlyPrice * periodMonths));

        const invoice = await Invoice.create({
            title: `Продление игрового сервера: ${server.name} (${periodMonths} мес.)`,
            amount,
            status: 'pending',
            type: 'monthly',
            dueDate: new Date(),
            userId: server.userId,
            gameServerId: server.id,
            periodMonths: periodMonths
        });

        res.status(201).json(invoice);
    } catch (error) {
        console.error('Create game server subscription invoice error:', error);
        res.status(500).json({ message: 'Ошибка при создании счета подписки' });
    }
};
