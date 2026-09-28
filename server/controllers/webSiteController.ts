import { Request, Response, Router } from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth';
import { decrypt } from '../utils/crypto';
import { execCommand } from '../services/sshService';
import { Op } from 'sequelize';
import {
  WebSite,
  WebSiteBackup,
  ServerNode,
  Invoice,
  User,
  WalletTransaction,
} from '../models';
import {
  WEB_PLANS,
  WEB_PLAN_LIST,
  validateWebsitePlan,
  validateWebsitePeriod,
  calculateWebsitePrice,
  getPaidUntilDate,
  type WebsitePriceBreakdown,
} from '../utils/websitesHelper';
import bcrypt from 'bcryptjs';
import multer from 'multer';

const router = Router();
const SALT_ROUNDS = 10;

const getIsAdminFromReq = (req: any): boolean => Boolean(req?.user?.role === 'admin');

const getSshConfigForNode = (node: any) => ({
  host: node.ip,
  port: node.sshPort || 22,
  username: node.sshUser || 'root',
  password: node.sshPassword ? decrypt(node.sshPassword) : undefined,
});

const pickBestWebNode = async (): Promise<any | null> => {
  const nodes = await ServerNode.findAll({
    where: {
      status: 'active',
      [Op.or]: [{ type: 'web' }, { type: 'both' }] as any,
    },
    order: [['usedWebSites', 'ASC'] as any],
  });
  for (const n of nodes) {
    const used = Number((n as any).usedWebSites || 0);
    const cap = Number((n as any).capacityWebSites || 50);
    if (used < cap) return n;
  }
  return null;
};

const genRandomPassword = (len = 16): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

// =================== Public endpoints =================================
router.get('/plans', (_req: Request, res: Response) => {
  return res.json({
    plans: WEB_PLAN_LIST,
    periodDiscounts: { 1: 0, 3: 0.05, 6: 0.10, 12: 0.15 },
    periods: [1, 3, 6, 12],
  });
});

router.post('/plans/calculate', (req: Request, res: Response) => {
  try {
    const { plan, periodMonths, customMonthlyPrice } = req.body || {};
    const breakdown: WebsitePriceBreakdown = calculateWebsitePrice(plan, periodMonths, customMonthlyPrice);
    return res.json({ ok: true, breakdown });
  } catch (err: any) {
    return res.status(err.statusCode || 400).json({ message: err.message });
  }
});

// ============== Auth required user endpoints ==============
router.get('/mine', authenticateToken, async (req: any, res: Response) => {
  const userId = req.user.id;
  const rows = await WebSite.findAll({
    where: { userId, status: { [Op.ne]: 'deleted' as any } } as any,
    include: [
      { model: ServerNode as any, as: 'node', attributes: ['id', 'name', 'ip', 'type'] },
    ],
    order: [['createdAt', 'DESC'] as any],
  });
  return res.json({ ok: true, items: rows });
});

router.post('/order', authenticateToken, async (req: any, res: Response) => {
  const userId = req.user.id;
  const isAdmin = getIsAdminFromReq(req);
  try {
    const body = req.body || {};
    const plan = validateWebsitePlan(body.plan);
    const period = validateWebsitePeriod(body.periodMonths ?? 1);
    const customMonthlyOverride = (isAdmin && Number.isFinite(Number(body.customMonthlyPrice)))
      ? Number(body.customMonthlyPrice)
      : null;
    const breakdown = calculateWebsitePrice(plan, period, customMonthlyOverride);
    const node = (await pickBestWebNode());
    if (!node && !isAdmin) throw Object.assign(new Error('Нет доступных веб-нод. Пожалуйста, попробуйте позже или сообщите администратору.'), { statusCode: 503 });
    const user = await User.findByPk(userId) as any;
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    const existingSite = await WebSite.create({
      userId,
      nodeId: node?.id ?? null,
      domain: typeof body.domain === 'string' && body.domain.trim() ? body.domain.trim() : null,
      plan,
      priceMonthly: breakdown.priceMonthly,
      status: 'pending',
      paidUntil: null,
      backupEnabled: WEB_PLANS[plan].backupEnabled,
      coreTemplate: WEB_PLANS[plan].coreTemplate as any,
      settings: {},
    } as any);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const invoice = await Invoice.create({
      title: `Хостинг сайта: ${WEB_PLANS[plan].label} · ${period} мес`,
      amount: breakdown.total,
      status: 'pending',
      type: period > 1 ? 'monthly' : 'one_time',
      dueDate: dueDate.toISOString().slice(0, 10),
      userId,
      periodMonths: period,
      siteId: existingSite.id,
    } as any);

    if (isAdmin && body.autoPay === true) {
      invoice.status = 'paid';
      await invoice.save();
      await applyWebSitePaidInvoice(invoice);
      const s = await WebSite.findByPk(existingSite.id);
      return res.json({ ok: true, site: s, invoice, message: 'Сайт создан админом и активирован' });
    }

    const balanceNum = Number(user.balance || 0);
    if (!isAdmin && balanceNum >= breakdown.total - 0.0001) {
      user.balance = balanceNum - breakdown.total;
      await user.save();
      try {
        await (WalletTransaction as any).create({
          userId,
          amount: -breakdown.total,
          type: 'debit',
          description: `Оплата хостинга сайта ${WEB_PLANS[plan].label} ${period} мес (ID ${existingSite.id.slice(0, 8)})`,
          relatedId: existingSite.id,
          relatedType: 'website',
        });
      } catch (_) { /* ignore */ }
      invoice.status = 'paid';
      await invoice.save();
      await applyWebSitePaidInvoice(invoice);
      return res.json({ ok: true, site: await WebSite.findByPk(existingSite.id), invoice, paidFromBalance: true });
    }
    return res.status(201).json({
      ok: true,
      site: existingSite,
      invoice,
      userBalance: balanceNum,
      message: `Создан счёт на ${breakdown.total} ₽ — пополните баланс для активации сайта.`,
    });
  } catch (err: any) {
    console.error('[webSiteController] order error:', err);
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
});

router.param('id', async (req: any, res: Response, next: any, id: string) => {
  try {
    const isAdmin = getIsAdminFromReq(req);
    const userId = req.user?.id;
    let site = await WebSite.findOne({
      where: { id, status: { [Op.ne]: 'deleted' as any } } as any,
      include: [{ model: ServerNode as any, as: 'node' }],
    });
    if (!site) return res.status(404).json({ message: 'Сайт не найден' });
    if (userId && !isAdmin && (site as any).userId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!(site as any).node && (site as any).nodeId) {
      site = (await WebSite.findOne({
        where: { id: (site as any).id },
        include: [{ model: ServerNode as any, as: 'node' }],
      })) as any;
    }
    req.site = site;
    return next();
  } catch (e) { next(e); }
});

router.get('/:id/settings', (req: any, res: Response) => res.json({ ok: true, site: req.site }));

router.get('/:id/logs', async (req: any, res: Response) => {
  try {
    const site = req.site as any;
    const node = site.node;
    if (!node || node.ip === '127.0.0.1') return res.json({ ok: true, pm2: 'Нода неактивна (режим эмуляции)', nginx: '' });
    const cfg = getSshConfigForNode(node);
    const pm2 = site.pm2ProcessName
      ? await execCommand(cfg, `pm2 logs ${site.pm2ProcessName} --nostream --lines 100 2>&1 | tail -200`).catch(String)
      : '';
    const nginx = site.nginxConfPath
      ? await execCommand(cfg, `tail -200 /var/log/nginx/error.log 2>/dev/null; echo '---ACCESS---'; tail -200 /var/log/nginx/access.log 2>/dev/null; true`).catch(String)
      : '';
    return res.json({ ok: true, pm2, nginx });
  } catch (e: any) { return res.status(500).json({ message: String(e?.message ?? e) }); }
});

const control = async (req: any, res: Response, action: 'start' | 'stop' | 'restart') => {
  const site = req.site as any;
  if (!site.pm2ProcessName) return res.json({ ok: true, skipped: true, message: 'Статический сайт — управление не требуется' });
  try {
    const node = site.node;
    if (node && node.ip && node.ip !== '127.0.0.1') {
      const cfg = getSshConfigForNode(node);
      await execCommand(cfg, `pm2 ${action} ${site.pm2ProcessName} || true`).catch(() => {});
    }
    if (action === 'stop') {
      if (site.status !== 'suspended') await site.update({ status: 'suspended' });
    } else if (action === 'start' || action === 'restart') {
      if (site.status !== 'active') await site.update({ status: 'active' });
    }
    return res.json({ ok: true, message: `Сайт ${action}ед` });
  } catch (e: any) { return res.status(500).json({ message: String(e?.message ?? e) }); }
};

router.post('/:id/start', async (req: any, res: Response) => control(req, res, 'start'));
router.post('/:id/stop', async (req: any, res: Response) => control(req, res, 'stop'));
router.post('/:id/restart', async (req: any, res: Response) => control(req, res, 'restart'));

router.patch('/:id/settings', async (req: any, res: Response) => {
  const site = req.site as any;
  try {
    const body = req.body || {};
    const patch: any = {};
    if (body.settings && typeof body.settings === 'object') {
      patch.settings = { ...(site.settings || {}), ...body.settings };
    }
    let needNginxReload = false;
    const node = site.node;
    if (body.domain !== undefined && String(body.domain).trim()) {
      const domain = String(body.domain).trim().toLowerCase();
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return res.status(400).json({ message: 'Неверный формат домена' });
      const colliding = await WebSite.findOne({ where: { domain, id: { [Op.ne]: site.id } } as any });
      if (colliding) return res.status(409).json({ message: 'Этот домен уже используется другим сайтом' });
      patch.domain = domain;
      needNginxReload = true;
    }
    if (body.plan !== undefined) {
      const p = validateWebsitePlan(body.plan);
      patch.plan = p;
      if (!patch.priceMonthly) patch.priceMonthly = WEB_PLANS[p].priceMonthly;
      patch.coreTemplate = WEB_PLANS[p].coreTemplate;
      patch.backupEnabled = WEB_PLANS[p].backupEnabled;
    }
    if (body.customMonthlyPrice !== undefined && getIsAdminFromReq(req)) {
      const v = Number(body.customMonthlyPrice);
      if (Number.isFinite(v) && v > 0) patch.priceMonthly = Math.ceil(v);
    }
    await site.update(patch);
    if (needNginxReload && node && node.ip !== '127.0.0.1') {
      const cfg = getSshConfigForNode(node);
      const siteDir = `/var/lib/wexa/sites/${site.id}`;
      const hostPort = 3000 + (Math.abs(site.id.charCodeAt(0) + site.id.charCodeAt(7)) % 1000);
      await writeNginxConfForSite(cfg, { ...site.toJSON(), hostPort }, siteDir, patch.domain || site.domain || `${site.id.slice(0,8)}.wexa.local`);
      await execCommand(cfg, `nginx -t && systemctl reload nginx || true`).catch(() => {});
    }
    return res.json({ ok: true, site: await WebSite.findByPk(site.id, { include: [{ model: ServerNode as any, as: 'node' }] }) });
  } catch (e: any) {
    return res.status(e.statusCode || 500).json({ message: e.message });
  }
});

router.post('/:id/domain/attach', authenticateToken, async (req: any, res: Response) => {
  const site = req.site as any;
  const domain = String(req.body?.domain || '').trim().toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return res.status(400).json({ message: 'Неверный формат домена' });
  const existing = await WebSite.findOne({ where: { domain, id: { [Op.ne]: site.id } } as any });
  if (existing) return res.status(409).json({ message: 'Этот домен уже используется другим сайтом' });
  const node = site.node;
  if (node && node.ip !== '127.0.0.1') {
    const cfg = getSshConfigForNode(node);
    const siteDir = `/var/lib/wexa/sites/${site.id}`;
    const hostPort = 3000 + (Math.abs(site.id.charCodeAt(0) + site.id.charCodeAt(7)) % 1000);
    await writeNginxConfForSite(cfg, { ...site.toJSON(), hostPort }, siteDir, domain);
    try { await execCommand(cfg, `nginx -t && systemctl reload nginx || true`).catch(() => {}); } catch (_) {}
  }
  await site.update({ domain });
  return res.json({ ok: true, message: 'Домен привязан.', instructions: `Создайте A-запись DNS: ${domain} · A → ${node?.ip || ''} · TTL 300`, nodeIp: node?.ip, site });
});

router.post('/:id/ssl/issue', authenticateToken, async (req: any, res: Response) => {
  try {
    const site = req.site as any;
    if (!site?.domain) return res.status(400).json({ message: 'Сначала привяжите домен.' });
    const node = site.node;
    if (!node || node.ip === '127.0.0.1') return res.json({ ok: true, mock: true, message: 'Mock нода — SSL пропускаем.' });
    const cfg = getSshConfigForNode(node);
    const email = String(req.body?.email || req.user?.email || 'admin@wexa.su').replace(/[^a-zA-Z0-9@._-]/g, '');
    const dryRun = req.body?.dryRun === true ? '--dry-run' : '';
    const cmd = `certbot --nginx -d ${site.domain} -n --agree-tos -m ${email} ${dryRun} --redirect --hsts 2>&1 | tail -40`;
    const out = await execCommand(cfg, cmd).catch((e: any) => String(e?.message ?? e));
    const success = /successfully|Congratulations|dry run successful/i.test(String(out)) || /certificate not yet due/i.test(String(out));
    return res.json({ ok: success, dryRun: !!dryRun, certbot: out, domain: site.domain });
  } catch (e: any) { return res.status(500).json({ message: String(e?.message ?? e) }); }
});

router.get('/:id/sftp-creds', authenticateToken, async (req: any, res: Response) => {
  const site = req.site as any;
  const node = site.node;
  let passwordOnce: string | null = site.sftpPasswordPlainOnce;
  if (passwordOnce) {
    await site.update({ sftpPasswordPlainOnce: null });
  }
  return res.json({
    ok: true,
    host: node?.ip || '',
    port: site.sftpPort || 22,
    username: site.sftpUsername || '',
    passwordOnce,
    password: passwordOnce,
    rootPath: '/public_html',
    note: 'SFTP-only, shell отключен. Загружать/редактировать/удалять файлы можно только в /public_html.',
  });
});

// ================= Files API (multer) =================
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 16 * 1024 * 1024 } });

const sanitizePath = (unsafe: unknown, siteId: string): string => {
  const raw = String(unsafe || '').replace(/\\/g, '/').trim() || '/';
  if (!raw.startsWith('/')) return '/' + raw;
  // jail into /public_html/
  const jailRoot = `/public_html`;
  const parts = raw.split('/').filter(Boolean);
  const clean: string[] = [];
  for (const p of parts) {
    if (p === '.' || !p) continue;
    if (p === '..') { clean.pop(); continue; }
    clean.push(p);
  }
  let out = jailRoot + '/' + clean.join('/');
  out = out.replace(/\/+/g, '/');
  return out === jailRoot ? `${jailRoot}/` : out;
};

router.get('/:id/files', async (req: any, res: Response) => {
  try {
    const site = req.site as any;
    const node = site.node;
    if (!node || node.ip === '127.0.0.1') return res.json({ ok: true, items: [] });
    const path = sanitizePath(req.query.path, site.id);
    const cfg = getSshConfigForNode(node);
    const hostDir = `/var/lib/wexa/sites/${site.id}`;
    const relPath = path.startsWith('/public_html/') ? path.slice('/public_html'.length) : '';
    const absPath = relPath === '' || relPath === '/' ? hostDir : `${hostDir}${relPath.startsWith('/') ? relPath : '/' + relPath}`;
    const out = await execCommand(cfg, `ls -lah --time-style=long-iso "${absPath}" 2>/dev/null || true`);
    const lines = out.trim().split(/\r?\n/).slice(1).filter(Boolean);
    const items = lines.map(line => {
      const m = line.match(/^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+\s+\S+)\s+(.+)$/);
      if (!m) return null;
      const [, perms, links, owner, group, size, date, name] = m;
      return {
        name, isDir: perms.startsWith('d'), size: Number.isNaN(Number(size)) ? 0 : Number(size),
        modified: date, perms, owner,
      } as any;
    }).filter(Boolean);
    return res.json({ ok: true, path, hostDir, items });
  } catch (e: any) { return res.status(500).json({ message: String(e?.message ?? e) }); }
});

router.post('/:id/files/upload', authenticateToken, upload.single('file'), async (req: any, res: Response) => {
  try {
    const site = req.site as any;
    const node = site.node;
    if (!node || node.ip === '127.0.0.1') return res.json({ ok: true });
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Отсутствует файл' });
    const dstPath = sanitizePath(req.body?.path || '/', site.id);
    const hostDir = `/var/lib/wexa/sites/${site.id}`;
    const relPath = dstPath.startsWith('/public_html/') ? dstPath.slice('/public_html'.length) : '/';
    const absDir = relPath === '' || relPath === '/' ? hostDir : `${hostDir}${relPath.startsWith('/') ? relPath : '/' + relPath}`;
    const fileName = (file.originalname || 'upload.bin').replace(/[^a-zA-Z0-9._-]/g, '_');
    const b64 = Buffer.from(file.buffer).toString('base64');
    const cfg = getSshConfigForNode(node);
    await execCommand(cfg, `mkdir -p "${absDir}" && printf '%s' '${b64}' | base64 -d > "${absDir}/${fileName}" && chown -R ${site.sftpUsername || 'wexa-www-data'}:users "${absDir}/${fileName}" 2>/dev/null || true`);
    return res.json({ ok: true, message: `Файл загружен: ${relPath}/${fileName}`, size: file.size });
  } catch (e: any) { return res.status(500).json({ message: String(e?.message ?? e) }); }
});

router.delete('/:id/files', authenticateToken, async (req: any, res: Response) => {
  try {
    const site = req.site as any;
    const node = site.node;
    if (!node || node.ip === '127.0.0.1') return res.json({ ok: true });
    const path = sanitizePath(req.query.path, site.id);
    if (path === '/public_html/') return res.status(400).json({ message: 'Нельзя удалить корневую папку' });
    const hostDir = `/var/lib/wexa/sites/${site.id}`;
    const relPath = path.startsWith('/public_html/') ? path.slice('/public_html'.length) : '/forbidden';
    if (relPath === '/forbidden' || !relPath) return res.status(400).json({ message: 'Некорректный путь' });
    const cfg = getSshConfigForNode(node);
    await execCommand(cfg, `rm -rf "${hostDir}${relPath.startsWith('/') ? relPath : '/' + relPath}" || true`);
    return res.json({ ok: true });
  } catch (e: any) { return res.status(500).json({ message: String(e?.message ?? e) }); }
});

// ================== Backups ============================
router.post('/:id/backups/trigger', authenticateToken, async (req: any, res: Response) => {
  try {
    const site = req.site as any;
    const node = site.node;
    if (!node || node.ip === '127.0.0.1') return res.json({ ok: true, mock: true });
    const cfg = getSshConfigForNode(node);
    const backupDir = `/var/lib/wexa/backups/sites/${site.id}`;
    const siteDir = `/var/lib/wexa/sites/${site.id}`;
    const ts = new Date();
    const date = ts.toISOString().slice(0, 10).replace(/-/g, '');
    const fn = `${date}-manual.tar.gz`;
    await execCommand(cfg, `mkdir -p "${backupDir}" && tar -czf "${backupDir}/${fn}" -C "$(dirname ${siteDir})" "$(basename ${siteDir})" && chmod 0640 "${backupDir}/${fn}" || true`);
    const out = await execCommand(cfg, `stat -c%s "${backupDir}/${fn}" 2>/dev/null || echo 0`);
    const size = Number(out || 0);
    const bk = await WebSiteBackup.create({
      webSiteId: site.id, fileName: fn, filePath: `${backupDir}/${fn}`, sizeBytes: size, note: 'manual-user',
    } as any);
    return res.json({ ok: true, backup: bk });
  } catch (e: any) { return res.status(500).json({ message: String(e?.message ?? e) }); }
});

router.get('/:id/backups', async (req: any, res: Response) => {
  try {
    const rows = await WebSiteBackup.findAll({ where: { webSiteId: req.site.id }, order: [['createdAt', 'DESC']] });
    return res.json({ ok: true, items: rows });
  } catch (e: any) { return res.status(500).json({ message: String(e?.message ?? e) }); }
});

// ================= ADMIN endpoints =================
router.get('/admin/all', authenticateToken, isAdmin, async (_req: any, res: Response) => {
  const rows = await WebSite.findAll({
    where: { status: { [Op.ne]: 'deleted' as any } } as any,
    include: [
      { model: User as any, as: 'user', attributes: ['id', 'email'] },
      { model: ServerNode as any, as: 'node' },
    ],
    order: [['createdAt', 'DESC'] as any],
  });
  return res.json({ ok: true, items: rows });
});

router.post('/admin/sites/create', authenticateToken, isAdmin, async (req: any, res: Response) => {
  req.body.autoPay = true;
  req.body.plan = req.body.plan || 'business';
  return (router.stack.find((l: any) => l.route && l.route.path === '/order') as any)?.handle?.(req, res, (e: any) => res.status(500).json({ message: String(e?.message || e) }));
});

router.post('/admin/sites/:id/delete', authenticateToken, isAdmin, async (req: any, res: Response) => {
  try {
    const site = await WebSite.findByPk(req.params.id, { include: [{ model: ServerNode as any, as: 'node' }] }) as any;
    if (!site) return res.status(404).json({ message: 'Сайт не найден' });
    const node = site?.node;
    if (node && node.ip !== '127.0.0.1' && site.status !== 'deleted') {
      const cfg = getSshConfigForNode(node);
      const shortId = site.id.slice(0, 8);
      if (site.sftpUsername) await execCommand(cfg, `id "${site.sftpUsername}" >/dev/null 2>&1 && ( umount "/srv/sftp/${site.sftpUsername}/public_html" 2>/dev/null; sed -i "\#/var/lib/wexa/sites/${site.id}#d" /etc/fstab 2>/dev/null; userdel -f -r "${site.sftpUsername}" 2>/dev/null; ) || true`);
      if (site.pm2ProcessName) await execCommand(cfg, `pm2 delete "${site.pm2ProcessName}" 2>/dev/null; rm -f "/etc/nginx/sites-enabled/wexa-site-${shortId}.conf"; pm2 save 2>/dev/null || true; nginx -t && systemctl reload nginx || true`);
    }
    await site.update({ status: 'deleted', pm2ProcessName: null, sftpUsername: null, sftpPasswordHash: null, sftpChroot: null, nginxConfPath: null });
    return res.json({ ok: true });
  } catch (e: any) { return res.status(500).json({ message: String(e?.message ?? e) }); }
});

router.post('/admin/sites/:id/migrate', authenticateToken, isAdmin, async (req: any, res: Response) => {
  try {
    const newNodeId = String(req.body?.nodeId || '').trim();
    if (!newNodeId) return res.status(400).json({ message: 'Укажите новую nodeId' });
    const site = await WebSite.findByPk(req.params.id, { include: [{ model: ServerNode as any, as: 'node' }] }) as any;
    if (!site) return res.status(404).json({ message: 'Сайт не найден' });
    if (site.status === 'deleted') return res.status(400).json({ message: 'Сайт удалён' });
    const newNode = await ServerNode.findByPk(newNodeId) as any;
    if (!newNode) return res.status(404).json({ message: 'Новая нода не найдена' });
    if (newNode.status !== 'active' || (newNode.type !== 'web' && newNode.type !== 'both')) {
      return res.status(400).json({ message: 'Новая нода неактивна или не поддерживает веб-сайты' });
    }
    const used = Number(newNode.usedWebSites || 0);
    const cap = Number(newNode.capacityWebSites || 50);
    if (used >= cap) return res.status(400).json({ message: 'На новой ноде закончилось место' });

    const oldNode = site.node;
    const shortId = site.id.slice(0, 8);
    const siteDir = `/var/lib/wexa/sites/${site.id}`;
    const sftpChroot = `/srv/sftp/${site.sftpUsername || `wexa_site_${shortId}`}`;
    const sftpUser = site.sftpUsername || `wexa_site_${shortId}`;
    const pm2Name = site.pm2ProcessName || `wexa-site-${shortId}`;
    const hostPort = 3000 + (Math.abs(site.id.charCodeAt(0) + site.id.charCodeAt(7)) % 1000);

    const newCfg = getSshConfigForNode(newNode);
    const publicHost = site.domain || `${shortId}.sites.wexa.su`;

    if (oldNode && oldNode.ip !== '127.0.0.1') {
      const oldCfg = getSshConfigForNode(oldNode);
      try {
        const rsyncKey = `ssh -o StrictHostKeyChecking=no -p ${newNode.sshPort || 22}`;
        const newHostUser = `${newNode.sshUser || 'root'}@${newNode.ip}`;
        await execCommand(oldCfg, `
mkdir -p "${siteDir}" "/var/lib/wexa/backups/sites/${site.id}" ;
if command -v rsync >/dev/null 2>&1; then
  rsync -az -e '${rsyncKey}' "${siteDir}/" ${newHostUser}:"${siteDir}/" 2>&1 | tail -10 || true ;
  rsync -az -e '${rsyncKey}' "/var/lib/wexa/backups/sites/${site.id}/" ${newHostUser}:"/var/lib/wexa/backups/sites/${site.id}/" 2>&1 | tail -10 || true ;
else
  tar -czf - -C "$(dirname ${siteDir})" "$(basename ${siteDir})" | ${rsyncKey} ${newHostUser} "mkdir -p ${siteDir} && tar -xzf - -C $(dirname ${siteDir})" 2>&1 | tail -10 || true ;
fi; true`).catch(() => {});
        await execCommand(oldCfg, `
( umount "${sftpChroot}/public_html" 2>/dev/null || true );
( sed -i "\#/var/lib/wexa/sites/${site.id}#d" /etc/fstab 2>/dev/null || true );
( id "${sftpUser}" >/dev/null 2>&1 && userdel -f -r "${sftpUser}" 2>/dev/null || true );
( pm2 delete "${pm2Name}" 2>/dev/null || true );
( rm -f "/etc/nginx/sites-enabled/wexa-site-${shortId}.conf" );
pm2 save 2>/dev/null || true;
nginx -t && systemctl reload nginx || true`).catch(() => {});
        try {
          const oldRemain = await WebSite.count({ where: { nodeId: oldNode.id, status: 'active' } });
          await ServerNode.update({ usedWebSites: oldRemain }, { where: { id: oldNode.id } });
        } catch (_) {}
      } catch (e) { console.error('Migrate old node cleanup error:', e); }
    }

    if (newNode.ip !== '127.0.0.1') {
      const sftpPass = site.sftpPasswordPlainOnce || genRandomPassword(18);
      const sftpPassHash = bcrypt.hashSync(sftpPass, SALT_ROUNDS);
      const templateDir = site.coreTemplate === 'nodejs' ? '/var/lib/wexa/templates/orlan-taxi-business' : '/var/lib/wexa/templates/static-landing';
      await execCommand(newCfg, `mkdir -p "${siteDir}" "/var/lib/wexa/backups/sites/${site.id}" "${sftpChroot}/public_html" && chown root:root "${sftpChroot}" && chmod 755 "${sftpChroot}"; true`);
      await execCommand(newCfg, `if [ ! -d "${siteDir}" ] || [ -z "$(ls -A ${siteDir} 2>/dev/null)" ]; then if [ -d "${templateDir}" ]; then cp -R "${templateDir}/." "${siteDir}/" 2>/dev/null; fi; fi; true`);
      await execCommand(newCfg, `id -u "${sftpUser}" >/dev/null 2>&1 || ( useradd -M -s /usr/sbin/nologin -G sftponly "${sftpUser}" 2>&1 ); true`);
      const shadow = await execCommand(newCfg, `openssl passwd -1 '${sftpPass.replace(/'/g, "'\\''")}'`).then(o => o.trim());
      await execCommand(newCfg, `usermod -p '${shadow.replace(/'/g, "'\\''")}' "${sftpUser}"`);
      await execCommand(newCfg, `chown -R "${sftpUser}":users "${siteDir}" && chmod -R u+rwX,go+rX "${siteDir}"`);
      await execCommand(newCfg, `grep -qF "${siteDir}" /etc/fstab || echo "${siteDir} ${sftpChroot}/public_html none bind 0 0" >> /etc/fstab`);
      await execCommand(newCfg, `mount "${sftpChroot}/public_html" 2>/dev/null || true`);
      if (site.coreTemplate === 'nodejs') {
        await execCommand(newCfg, `cd "${siteDir}" && ([ -f package.json ] && npm install --production --no-audit --no-fund || true) 2>&1 | tail -10 || true`);
        const pm2Conf = JSON.stringify({
          name: pm2Name, cwd: siteDir, script: 'server.js',
          env: { PORT: hostPort, NODE_ENV: 'production' },
          instances: 1, autorestart: true, watch: false, max_memory_restart: '256M',
        });
        await execCommand(newCfg, `mkdir -p /etc/wexa/pm2 && cat > /etc/wexa/pm2/${pm2Name}.json <<'PM2EOF'\n${pm2Conf}\nPM2EOF\npm2 start /etc/wexa/pm2/${pm2Name}.json 2>/dev/null || true ; pm2 save 2>/dev/null || true`);
      }
      await writeNginxConfForSite(newCfg, { ...site.toJSON(), hostPort, pm2ProcessName: site.coreTemplate === 'nodejs' ? pm2Name : null }, siteDir, publicHost);
      await execCommand(newCfg, `nginx -t && systemctl reload nginx || true`);
    }

    await site.update({
      nodeId: newNode.id,
      sftpUsername: sftpUser,
      sftpChroot,
      nginxConfPath: `/etc/nginx/sites-enabled/wexa-site-${shortId}.conf`,
    } as any);
    try {
      const count = await WebSite.count({ where: { nodeId: newNode.id, status: 'active' } });
      await ServerNode.update({ usedWebSites: count }, { where: { id: newNode.id } });
    } catch (_) {}

    return res.json({ ok: true, message: `Сайт перенесён на ноду ${newNode.name}`, site: await WebSite.findByPk(site.id, { include: [{ model: ServerNode as any, as: 'node' }] }) });
  } catch (e: any) {
    console.error('Migrate site error:', e);
    return res.status(500).json({ message: String(e?.message ?? e) });
  }
});

// ==================== apply paid invoice ==================
const writeNginxConfForSite = async (cfg: any, site: any, siteDir: string, domain: string) => {
  const shortId = String(site.id || '').slice(0, 8) || 'unknown';
  const hasProxy = Boolean(site.pm2ProcessName);
  const port = Number(site.hostPort || 3000);
  const conf = hasProxy
    ? `server {
  listen 80;
  server_name ${domain};
  root ${siteDir}/public;
  index index.html index.htm;
  access_log /var/log/nginx/wexa-site-${shortId}-access.log;
  error_log /var/log/nginx/wexa-site-${shortId}-error.log;
  location ~* \.(?:js|css|png|jpe?g|gif|svg|ico|woff2?|ttf|eot)$ {
    root ${siteDir}/public;
    expires 7d;
    add_header Cache-Control "public";
    try_files \$uri =404;
  }
  location / {
    proxy_pass http://127.0.0.1:${port};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}`
    : `server {
  listen 80;
  server_name ${domain};
  root ${siteDir};
  index index.html index.htm;
  access_log /var/log/nginx/wexa-site-${shortId}-access.log;
  error_log /var/log/nginx/wexa-site-${shortId}-error.log;
}`;
  const cmd = `mkdir -p /etc/nginx/sites-enabled && cat > /etc/nginx/sites-enabled/wexa-site-${shortId}.conf <<'NGINXEOF'
${conf}
NGINXEOF
`;
  await execCommand(cfg, cmd);
};

const applyWebSitePaidInvoice = async (invoice: any): Promise<void> => {
  const site = await WebSite.findOne({
    where: { id: invoice.siteId },
    include: [{ model: ServerNode as any, as: 'node' }],
  }) as any;
  if (!site) throw new Error('applyWebSitePaidInvoice: site not found');
  if (site.status === 'active' || site.status === 'provisioning') return;
  await site.update({ status: 'provisioning' });
  try {
    const period = Number(invoice.periodMonths || 1);
    const paidUntil = getPaidUntilDate(period, site.paidUntil ? new Date(site.paidUntil) : undefined);
    const node = site.node;
    const isMock = !node || node.ip === '127.0.0.1';
    const shortId = site.id.slice(0, 8);
    const sftpUser = `wexa_site_${shortId}`;
    const sftpPass = genRandomPassword(18);
    const sftpPasswordHash = bcrypt.hashSync(sftpPass, SALT_ROUNDS);
    const pm2Name = `wexa-site-${shortId}`;
    const siteDir = `/var/lib/wexa/sites/${site.id}`;
    const sftpChroot = `/srv/sftp/${sftpUser}`;
    const nginxConf = `/etc/nginx/sites-enabled/wexa-site-${shortId}.conf`;
    const publicHost = site.domain || `${shortId}.sites.wexa.su`;
    const hostPort = 3000 + (Math.abs(site.id.charCodeAt(0) + site.id.charCodeAt(7)) % 1000);

    if (!isMock) {
      const cfg = getSshConfigForNode(node);
      const templateDir = site.coreTemplate === 'nodejs' ? '/var/lib/wexa/templates/orlan-taxi-business' : '/var/lib/wexa/templates/static-landing';
      await execCommand(cfg, `mkdir -p "${siteDir}" "/var/lib/wexa/backups/sites/${site.id}" "${sftpChroot}/public_html" && chown root:root "${sftpChroot}" && chmod 755 "${sftpChroot}"`);
      await execCommand(cfg, `if [ -d "${templateDir}" ]; then cp -R "${templateDir}/." "${siteDir}/" 2>/dev/null; fi; true`);
      if (site.coreTemplate === 'static') {
        await execCommand(cfg, `[ -f "${siteDir}/index.html" ] || (echo '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Сайт на Wexa.su</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0f172a;color:#fff}.box{padding:2rem 3rem;border-radius:1rem;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}.tag{background:#22c55e22;color:#86efac;padding:.25rem .6rem;border-radius:999px;font-size:.7rem;font-weight:700;letter-spacing:.04em}</style></head><body><div class="box"><span class="tag">WEXA.SU · LANDING</span><h1>Сайт готов 🎉</h1><p>Загрузите свои файлы через SFTP (данные в ЛК wexa.su) или используйте файловый менеджер.</p></div></body></html>' > "${siteDir}/index.html"; fi; true`);
      }
      // Create user
      await execCommand(cfg, `id -u "${sftpUser}" >/dev/null 2>&1 || ( useradd -M -s /usr/sbin/nologin -G sftponly "${sftpUser}" 2>&1 ); true`);
      const shadow = await execCommand(cfg, `openssl passwd -1 '${sftpPass.replace(/'/g, "'\\''")}'`).then(o => o.trim());
      await execCommand(cfg, `usermod -p '${shadow.replace(/'/g, "'\\''")}' "${sftpUser}"`);
      await execCommand(cfg, `chown -R "${sftpUser}":users "${siteDir}" && chmod -R u+rwX,go+rX "${siteDir}"`);
      // bind mount + fstab permanent
      await execCommand(cfg, `grep -qF "${siteDir}" /etc/fstab || echo "${siteDir} ${sftpChroot}/public_html none bind 0 0" >> /etc/fstab`);
      await execCommand(cfg, `mount "${sftpChroot}/public_html" 2>/dev/null || true`);
      // nodejs: npm install + pm2
      if (site.coreTemplate === 'nodejs') {
        await execCommand(cfg, `cd "${siteDir}" && ([ -f package.json ] && npm install --production --no-audit --no-fund || true) 2>&1 | tail -10 || true`);
        const pm2Conf = JSON.stringify({
          name: pm2Name, cwd: siteDir, script: 'server.js',
          env: { PORT: hostPort, NODE_ENV: 'production' },
          instances: 1, autorestart: true, watch: false, max_memory_restart: '256M',
        });
        await execCommand(cfg, `mkdir -p /etc/wexa/pm2 && cat > /etc/wexa/pm2/${pm2Name}.json <<'PM2EOF'\n${pm2Conf}\nPM2EOF\npm2 start /etc/wexa/pm2/${pm2Name}.json 2>/dev/null || true ; pm2 save 2>/dev/null || true`);
      }
      await writeNginxConfForSite(cfg, { ...site.toJSON(), hostPort, pm2ProcessName: site.coreTemplate === 'nodejs' ? pm2Name : null }, siteDir, publicHost);
      await execCommand(cfg, `nginx -t && systemctl reload nginx || true`);
    }

    await site.update({
      sftpUsername: sftpUser,
      sftpPasswordHash,
      sftpPasswordPlainOnce: sftpPass,
      sftpPort: node?.sshPort || 22,
      sftpChroot,
      pm2ProcessName: site.coreTemplate === 'nodejs' ? pm2Name : null,
      nginxConfPath: nginxConf,
      paidUntil,
      status: 'active',
    } as any);
    try {
      if (site.nodeId) {
        const count = await WebSite.count({ where: { nodeId: site.nodeId, status: 'active' } });
        await ServerNode.update({ usedWebSites: count }, { where: { id: site.nodeId } });
      }
    } catch (_) { /* ignore */ }
  } catch (err) {
    console.error('[applyWebSitePaidInvoice] failed:', err);
    await site.update({ status: 'pending' });
    throw err;
  }
};

export { applyWebSitePaidInvoice, router as default, writeNginxConfForSite };
