import { GameServer, Project, ServerNode, WebSite, Invoice, WalletTransaction } from '../models';
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

        // ========== AWAITING PAYMENT: DELETE WEBSITES OLDER THAN 3 DAYS ==========
        const unpaidAwaitingSites = await WebSite.findAll({
            where: {
                createdAt: { [Op.lt]: overdueDeleteBefore },
                status: { [Op.in]: ['pending', 'pending_payment', 'awaiting_payment'] as any },
                paidUntil: { [Op.is]: null },
            },
            include: [{ model: ServerNode, as: 'node' }],
        });
        for (const s of unpaidAwaitingSites) {
            const node = (s as any).node;
            try {
                if (node && node.ip && node.ip !== '127.0.0.1') {
                    const cfg = {
                        host: node.ip, port: node.sshPort || 22, username: node.sshUser || 'root',
                        password: node.sshPassword ? decrypt(node.sshPassword) : undefined,
                    };
                    const shortId = String(s.id || '').slice(0, 8);
                    const user = (s as any).sftpUsername;
                    if (user) {
                        await execCommand(cfg, `
( umount "/srv/sftp/${user}/public_html" 2>/dev/null || true );
( sed -i "\#/var/lib/wexa/sites/${s.id}#d" /etc/fstab 2>/dev/null || true );
( userdel -f -r "${user}" 2>/dev/null || true );
( pm2 delete "wexa-site-${shortId}" 2>/dev/null || true );
( rm -f "/etc/nginx/sites-enabled/wexa-site-${shortId}.conf" );
( rm -rf "/var/lib/wexa/sites/${s.id}" 2>/dev/null || true );
pm2 save 2>/dev/null || true;
nginx -t && systemctl reload nginx || true
`);
                    }
                    if (s.nodeId) {
                        try {
                            const remaining = await WebSite.count({ where: { nodeId: s.nodeId, status: { [Op.not]: 'deleted' as any } } });
                            await ServerNode.update({ usedWebSites: Math.max(0, remaining - 1) }, { where: { id: s.nodeId } });
                        } catch (_) { /* ignore */ }
                    }
                }
            } catch (e) { console.error('Delete unpaid website resources error:', s.id, e); }
            try {
                await s.update({
                    status: 'deleted', pm2ProcessName: null, sftpUsername: null, sftpPasswordHash: null, sftpChroot: null, sftpPassword: null, sftpPasswordPlainOnce: null, nginxConfPath: null, sslCertPath: null, sslExpiresAt: null, gitRepoUrl: null, subdomainName: null, domain: null, domainType: null, sshUsername: null, sshPassword: null, sshPasswordHash: null, nodeId: null, settings: {} as any,
                });
            } catch (_) { try { await s.destroy(); } catch (_e) {} }
            console.log(`[webSite] DELETED (unpaid >3d) id=${s.id}, domain=${(s as any).domain || '-'}.`);
        }

        // ========== AWAITING PAYMENT: DELETE GAME SERVERS OLDER THAN 3 DAYS ==========
        const unpaidGameServers = await GameServer.findAll({
            where: {
                createdAt: { [Op.lt]: overdueDeleteBefore },
                status: { [Op.in]: ['pending_payment', 'awaiting_payment', 'pending'] as any },
                paidUntil: { [Op.is]: null },
            },
            include: [{ model: ServerNode, as: 'node' }],
        });
        for (const server of unpaidGameServers) {
            const node = getNodeFromIncluded(server);
            try {
                if (node && node.ip && node.ip !== '127.0.0.1' && node.ip !== '1.1.1.1') {
                    const config = {
                        host: node.ip,
                        port: node.sshPort,
                        username: node.sshUser,
                        password: node.sshPassword ? decrypt(node.sshPassword) : undefined
                    };
                    const ident = getContainerIdent(server);
                    const sftpName = getSftpContainerName(server);
                    const hostDir = `/var/lib/wexa/game-servers/${server.id}`;
                    if (ident) {
                        await execCommand(config, `sh -lc "docker rm -f ${ident} >/dev/null 2>&1 || true"`);
                    }
                    await execCommand(config, `sh -lc "docker rm -f ${sftpName} >/dev/null 2>&1 || true"`);
                    await execCommand(config, `sh -lc "rm -rf ${hostDir} >/dev/null 2>&1 || true"`);
                }
            } catch (e) { console.error('Delete unpaid game server resources error:', server.id, e); }
            try {
                await Invoice.update({ gameServerId: null }, { where: { gameServerId: server.id } });
                await WalletTransaction.update({ gameServerId: null }, { where: { gameServerId: server.id } });
            } catch (_) {}
            try { await server.destroy(); } catch (_) {}
            console.log(`[GameServer] DELETED (unpaid >3d) id=${server.id}, name=${server.name}.`);
        }

        // ========== WEBSITES SUSPEND EXPIRED ==========
        const expiredSites = await WebSite.findAll({
            where: {
                paidUntil: { [Op.lt]: now },
                status: { [Op.in]: ['active', 'pending', 'provisioning'] as any },
            },
            include: [{ model: ServerNode, as: 'node' }],
        });
        for (const s of expiredSites) {
            if (s.status === 'suspended' || s.status === 'deleting' || s.status === 'deleted') continue;
            const node = (s as any).node;
            if (node && node.ip && node.ip !== '127.0.0.1' && (s as any).pm2ProcessName) {
                try {
                    const cfg = {
                        host: node.ip, port: node.sshPort || 22, username: node.sshUser || 'root',
                        password: node.sshPassword ? decrypt(node.sshPassword) : undefined,
                    };
                    const shortId = String(s.id || '').slice(0, 8);
                    await execCommand(cfg, `pm2 stop "${(s as any).pm2ProcessName}" 2>/dev/null || true; true`);
                    if ((s as any).domain) {
                        const conf = `/etc/nginx/sites-enabled/wexa-site-${shortId}.conf`;
                        const suspend = `server {
  listen 80;
  server_name ${(s as any).domain};
  access_log /var/log/nginx/wexa-site-${shortId}-access.log;
  error_log /var/log/nginx/wexa-site-${shortId}-error.log;
  default_type text/html;
  return 503 '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Сайт приостановлен — Wexa.su</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f1f5f9,#cbd5e1);padding:2rem"><div style="max-width:620px;width:100%;padding:2.5rem;background:#fff;border-radius:1.25rem;box-shadow:0 10px 30px rgba(2,6,23,.08);border:1px solid rgba(2,6,23,.06)"><div style="display:inline-block;padding:.25rem .7rem;border-radius:999px;background:#fde68a;color:#92400e;font-weight:600;font-size:.8rem;margin-bottom:1.25rem;letter-spacing:.03em">⏸ Приостановлено</div><h1 style="margin:0 0 .75rem;font-size:1.75rem">Подписка закончилась</h1><p style="color:#475569;line-height:1.6;margin:.25rem 0">Ваш сайт временно отключён за неуплату. Зайдите в Личный кабинет на <a href="https://wexa.su/dashboard" style="color:#4f46e5;text-decoration:underline">wexa.su</a> и оплатите счёт — сайт запустится автоматически в течение 1 минуты.</p><p style="color:#64748b;font-size:.9rem;margin-top:1.25rem">По вопросам: support@wexa.su · Telegram @wexasupport</p></div></body></html>';
}`;
                        const b64 = Buffer.from(suspend, 'utf8').toString('base64');
                        await execCommand(cfg, `printf '%s' '${b64}' | base64 -d > '${conf}' && nginx -t && systemctl reload nginx || true`);
                    }
                } catch (e) { console.error('Suspend website error:', s.id, e); }
            }
            await s.update({ status: 'suspended' });
            console.log(`[webSite] suspended id=${s.id} (domain ${(s as any).domain || '-'}).`);
        }

        // ========== WEBSITES DELETE AFTER 3 DAYS ==========
        const deletableSites = await WebSite.findAll({
            where: { paidUntil: { [Op.lt]: overdueDeleteBefore }, status: { [Op.ne]: 'deleted' as any } },
            include: [{ model: ServerNode, as: 'node' }],
        });
        for (const s of deletableSites) {
            const node = (s as any).node;
            try {
                if (node && node.ip && node.ip !== '127.0.0.1') {
                    const cfg = {
                        host: node.ip, port: node.sshPort || 22, username: node.sshUser || 'root',
                        password: node.sshPassword ? decrypt(node.sshPassword) : undefined,
                    };
                    const shortId = String(s.id || '').slice(0, 8);
                    const user = (s as any).sftpUsername;
                    if (user) {
                        await execCommand(cfg, `
( umount "/srv/sftp/${user}/public_html" 2>/dev/null || true );
( sed -i "\#/var/lib/wexa/sites/${s.id}#d" /etc/fstab 2>/dev/null || true );
( userdel -f -r "${user}" 2>/dev/null || true );
( pm2 delete "wexa-site-${shortId}" 2>/dev/null || true );
( rm -f "/etc/nginx/sites-enabled/wexa-site-${shortId}.conf" );
( rm -rf "/var/lib/wexa/sites/${s.id}" 2>/dev/null || true );
pm2 save 2>/dev/null || true;
nginx -t && systemctl reload nginx || true
`);
                    }
                    if (s.nodeId) {
                        try {
                            const remaining = await WebSite.count({ where: { nodeId: s.nodeId, status: 'active' } });
                            await ServerNode.update({ usedWebSites: remaining }, { where: { id: s.nodeId } });
                        } catch (_) { /* ignore */ }
                    }
                }
            } catch (e) { console.error('Delete website resources error:', s.id, e); }
            try {
                await s.update({
                    status: 'deleted', pm2ProcessName: null, sftpUsername: null, sftpPasswordHash: null, sftpChroot: null, sftpPassword: null, sftpPasswordPlainOnce: null, nginxConfPath: null, sslCertPath: null, sslExpiresAt: null, gitRepoUrl: null, subdomainName: null, domain: null, domainType: null, sshUsername: null, sshPassword: null, sshPasswordHash: null, nodeId: null, settings: {} as any,
                });
            } catch (_) { try { await s.destroy(); } catch (_e) {} }
            console.log(`[webSite] DELETED id=${s.id}.`);
        }

        // ========== GAME SERVERS DELETE AFTER 3 DAYS ==========
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

        // ========== GAME SERVERS SUSPEND EXPIRED ==========
        const expiredGameServers = await GameServer.findAll({
            where: {
                paidUntil: { [Op.lt]: now }
            },
            include: [{ model: ServerNode, as: 'node' }]
        });

        for (const server of expiredGameServers) {
            if (server.paidUntil && new Date(server.paidUntil).getTime() < overdueDeleteBefore.getTime()) continue;
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

