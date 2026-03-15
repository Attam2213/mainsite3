import { GameServer, Project, ServerNode } from '../models';
import { execCommand, stopPM2Process } from './sshService';
import { Op } from 'sequelize';
import { decrypt } from '../utils/crypto';

const getContainerIdent = (server: GameServer) => {
    const cid = server.containerId;
    if (cid && cid.trim()) return cid.trim();
    if (server.userId && server.port) return `gs_${server.userId.split('-')[0]}_${server.port}`;
    return null;
};

const getSftpContainerName = (server: GameServer) => {
    const base = (server.containerId || server.id || '').toString().replace(/[^a-zA-Z0-9_.-]/g, '');
    return `sftp_${base.slice(0, 24)}`;
};

const getNodeFromIncluded = (server: GameServer) => {
    return (server as unknown as { node?: ServerNode }).node;
};

export const checkSubscriptions = async () => {
    try {
        const now = new Date();
        const overdueDeleteBefore = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

        const expiredProjects = await Project.findAll({
            where: {
                paidUntil: {
                    [Op.lt]: now // expired
                },
                pm2ProcessName: { [Op.ne]: null } // has PM2 setup
            }
        });

        for (const project of expiredProjects) {
            console.log(`Project ${project.title} expired on ${project.paidUntil}. Stopping process...`);
            await stopPM2Process(project);
        }

        const deletableGameServers = await GameServer.findAll({
            where: {
                paidUntil: { [Op.lt]: overdueDeleteBefore }
            },
            include: [{ model: ServerNode, as: 'node' }]
        });

        for (const server of deletableGameServers) {
            const node = getNodeFromIncluded(server);
            if (!node) continue;
            if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
                await server.destroy();
                continue;
            }

            const config = {
                host: node.ip,
                port: node.sshPort,
                username: node.sshUser,
                password: node.sshPassword ? decrypt(node.sshPassword) : undefined
            };

            const ident = getContainerIdent(server);
            const sftpName = getSftpContainerName(server);
            const hostDir = `/var/lib/wexa/game-servers/${server.id}`;

            try {
                if (ident) {
                    await execCommand(config, `sh -lc "docker rm -f ${ident} >/dev/null 2>&1 || true"`);
                }
                await execCommand(config, `sh -lc "docker rm -f ${sftpName} >/dev/null 2>&1 || true"`);
                await execCommand(config, `sh -lc "rm -rf ${hostDir} >/dev/null 2>&1 || true"`);
            } catch (e) {
                console.error('Error deleting game server resources:', e);
            }

            await server.destroy();
        }

        const expiredGameServers = await GameServer.findAll({
            where: {
                paidUntil: { [Op.lt]: now }
            },
            include: [{ model: ServerNode, as: 'node' }]
        });

        for (const server of expiredGameServers) {
            if (server.paidUntil && server.paidUntil.getTime() < overdueDeleteBefore.getTime()) continue;
            if (server.status === 'suspended') continue;

            const node = getNodeFromIncluded(server);
            if (!node) continue;
            if (node.ip === '127.0.0.1' || node.ip === '1.1.1.1') {
                await server.update({ status: 'suspended' });
                continue;
            }

            const config = {
                host: node.ip,
                port: node.sshPort,
                username: node.sshUser,
                password: node.sshPassword ? decrypt(node.sshPassword) : undefined
            };

            const ident = getContainerIdent(server);
            if (ident) {
                try {
                    await execCommand(config, `sh -lc "docker stop ${ident} >/dev/null 2>&1 || true"`);
                } catch (e) {
                    console.error('Error stopping expired game server:', e);
                }
            }

            await server.update({ status: 'suspended' });
        }
    } catch (error) {
        console.error('Error checking subscriptions:', error);
    }
};

export const startSubscriptionService = () => {
    // Check every 1 minute (for testing)
    setInterval(checkSubscriptions, 60 * 1000);
    // Initial check
    checkSubscriptions();
};
