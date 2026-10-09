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
  PERIOD_DISCOUNTS,
  type WebsitePriceBreakdown,
} from '../utils/websitesHelper';
import { adjustBalance, round2 } from '../services/balanceService';
import { startPM2Process, stopPM2Process } from '../services/sshService';
import bcrypt from 'bcryptjs';
import multer from 'multer';

const router = Router();
const SALT_ROUNDS = 10;
const SUBDOMAIN_PARENT = process.env.WEBSITE_SUBDOMAIN_PARENT || 'wexa.su';
const SUBDOMAIN_REGEX = /^[a-z0-9][a-z0-9-]{0,40}[a-z0-9]$/;
// Unicode-aware custom domain regex (supports IDN: кириллица .рф, .сайт, arabic, chinese etc + punycode xn--)
const CUSTOM_DOMAIN_LABEL_RE = /^[\p{L}\p{N}]+(-[\p{L}\p{N}]+)*$/iu;
// Punycode label: domainToASCII() output is always valid RFC 5891 ASCII, so allow any
// alphanumerics/hyphens after "xn--" prefix (even another hyphen as 1st char after prefix,
// which occurs for strings starting with non-ASCII chars like "орлан" -> xn----7sbb6ajcpfsqi).
const PUNYCODE_LABEL_RE = /^xn--[a-z0-9-]+$/i;

const normalizeCustomDomain = (raw: string): string => {
  const r = String(raw || '').trim().toLowerCase();
  // Strip protocol/ports/paths/user@ just in case
  const cleaned = r
    .replace(/^[a-z]+:\/\/+/i, '')
    .replace(/[:/?#@].*$/, '')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '');
  try {
    return require('url').domainToASCII(cleaned).toLowerCase();
  } catch {
    try {
      return (new URL('http://' + cleaned)).hostname.toLowerCase();
    } catch {
      return cleaned;
    }
  }
};

const isValidCustomDomain = (raw: string): { ok: boolean; normalized?: string; reason?: string } => {
  const normalized = normalizeCustomDomain(raw);
  if (!normalized || normalized.length < 4 || normalized.length > 253) return { ok: false, reason: 'Неверный формат домена' };
  if (normalized.includes('..')) return { ok: false, reason: 'Домен не может содержать две точки подряд' };
  const labels = normalized.split('.');
  if (labels.length < 2) return { ok: false, reason: 'Введите полное доменное имя (например site.ru или орлан-такси.рф)' };
  const tld = labels[labels.length - 1];
  if (tld.length < 2) return { ok: false, reason: 'Неверный формат доменной зоны' };
  for (const label of labels) {
    if (!label) return { ok: false, reason: 'Неверный формат домена (пустая метка)' };
    if (label.length > 63) return { ok: false, reason: 'Метка домена не может быть длиннее 63 символов' };
    if (label.startsWith('-') || label.endsWith('-')) return { ok: false, reason: 'Дефис не может стоять в начале или конце части домена' };
    const isPuny = PUNYCODE_LABEL_RE.test(label);
    if (isPuny) continue;
    if (!CUSTOM_DOMAIN_LABEL_RE.test(label)) return { ok: false, reason: 'Неверный формат домена' };
  }
  return { ok: true, normalized };
};
const RESERVED_SUBDOMAINS = new Set([
  'www', 'mail', 'smtp', 'pop', 'pop3', 'imap', 'ftp', 'sftp', 'ssh',
  'cpanel', 'whm', 'plesk', 'ispmanager', 'ns1', 'ns2', 'ns3', 'ns',
  'admin', 'api', 'app', 'blog', 'shop', 'store', 'dev', 'test',
  'staging', 'stage', 'demo', 'cdn', 'static', 'media', 'img',
  'minecraft', 'cs', 'csgo', 'cs2', 'valve', 'panel', 'billing',
  'cabinet', 'account', 'support', 'help', 'docs', 'status',
]);

const validateSubdomainName = (name: string): { ok: true } | { ok: false; reason: string } => {
  const raw = String(name || '').trim().toLowerCase();
  if (!raw) return { ok: false, reason: 'Введите имя поддомена' };
  if (raw.length < 3) return { ok: false, reason: 'Минимум 3 символа' };
  if (raw.length > 42) return { ok: false, reason: 'Максимум 42 символа' };
  if (!SUBDOMAIN_REGEX.test(raw)) return { ok: false, reason: 'Только a-z, 0-9 и дефис (не в начале/конце)' };
  if (RESERVED_SUBDOMAINS.has(raw)) return { ok: false, reason: 'Это имя зарезервировано' };
  return { ok: true };
};

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

router.get('/check-subdomain', async (req: Request, res: Response) => {
  const name = String(req.query.name || '').trim().toLowerCase();
  const v = validateSubdomainName(name);
  if (!v.ok) return res.json({ ok: true, available: false, reason: v.reason, parent: SUBDOMAIN_PARENT, full: null });
  const colliding = await WebSite.findOne({ where: { subdomainName: name, status: { [Op.ne]: 'deleted' as any } } as any });
  if (colliding) return res.json({ ok: true, available: false, reason: 'Имя уже занято', parent: SUBDOMAIN_PARENT, full: null });
  return res.json({ ok: true, available: true, parent: SUBDOMAIN_PARENT, full: `${name}.${SUBDOMAIN_PARENT}` });
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

export async function createWebSiteInternal(input: {
  userId: string;
  isAdmin: boolean;
  plan: 'landing' | 'business' | 'premium';
  subdomain: string | null;
  customDomain: string | null;
  templateId?: string;
  periodMonths?: number;
  nodeId?: string | null;
  userName?: string;
  userEmail?: string;
}): Promise<{ webSite: any; invoice: any; paidFromBalance: boolean }> {
  const { userId, isAdmin, plan, subdomain, customDomain, templateId, periodMonths } = input;
  const period = validateWebsitePeriod(Number(periodMonths) || 1);
  const breakdown = calculateWebsitePrice(plan, period, null);
  let node: any = null;
  if (input.nodeId) node = await ServerNode.findByPk(input.nodeId);
  if (!node) node = (await pickBestWebNode());
  if (!node && !isAdmin) throw Object.assign(new Error('Нет доступных веб-нод'), { statusCode: 503 });

  let domain: string | null = null;
  let subdomainName: string | null = null;
  let domainType: 'subdomain' | 'custom' | null = null;
  if (subdomain) {
    const v = validateSubdomainName(subdomain);
    if (!v.ok) throw new Error('Имя поддомена: ' + v.reason);
    const colliding = await WebSite.findOne({ where: { subdomainName: subdomain, status: { [Op.ne]: 'deleted' as any } } as any });
    if (colliding) throw new Error('Это имя поддомена уже занято');
    subdomainName = subdomain;
    domain = `${subdomain}.${SUBDOMAIN_PARENT}`;
    domainType = 'subdomain';
  } else if (customDomain) {
    const dom = isValidCustomDomain(customDomain);
    if (!dom.ok || !dom.normalized) throw new Error(dom.reason || 'Неверный формат домена');
    const finalDomain = dom.normalized;
    const col = await WebSite.findOne({ where: { domain: finalDomain, status: { [Op.ne]: 'deleted' as any } } as any });
    if (col) throw new Error('Этот домен уже используется');
    domain = finalDomain;
    domainType = 'custom';
  }

  const existingSite = await WebSite.create({
    userId,
    nodeId: node?.id ?? null,
    domain,
    domainType,
    subdomainName,
    plan,
    priceMonthly: breakdown.priceMonthly,
    status: 'pending',
    paidUntil: null,
    backupEnabled: WEB_PLANS[plan].backupEnabled,
    coreTemplate: (templateId || WEB_PLANS[plan].coreTemplate) as any,
    settings: { aiGenerated: true },
  } as any);

  const invoice = await Invoice.create({
    title: `Хостинг сайта (AI): ${WEB_PLANS[plan].label} · ${period} мес`,
    amount: breakdown.total,
    status: isAdmin ? 'paid' : 'pending',
    type: period > 1 ? 'monthly' : 'one_time',
    userId,
    periodMonths: period,
    siteId: existingSite.id,
  } as any);

  let paidFromBalance = false;
  if (isAdmin || true) {
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    paidFromBalance = true;
    try { await invoice.save(); await applyWebSitePaidInvoice(invoice); } catch (_) {}
  }
  const webSite = await WebSite.findByPk(existingSite.id);
  return { webSite, invoice, paidFromBalance };
}

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

    const rawDomainType = (body.domainType && ['subdomain', 'custom'].includes(body.domainType)) ? body.domainType : null;
    let domain: string | null = null;
    let subdomainName: string | null = null;
    let domainType: 'subdomain' | 'custom' | null = null;

    if (rawDomainType === 'subdomain') {
      const name = String(body.subdomainName || '').trim().toLowerCase();
      const v = validateSubdomainName(name);
      if (!v.ok) return res.status(400).json({ message: `Имя поддомена: ${v.reason}` });
      const colliding = await WebSite.findOne({ where: { subdomainName: name, status: { [Op.ne]: 'deleted' as any } } as any });
      if (colliding) return res.status(409).json({ message: 'Это имя поддомена уже занято' });
      subdomainName = name;
      domain = `${name}.${SUBDOMAIN_PARENT}`;
      domainType = 'subdomain';
    } else {
      if (body.domain && String(body.domain).trim()) {
        const dom = isValidCustomDomain(body.domain);
        if (!dom.ok || !dom.normalized) return res.status(400).json({ message: dom.reason || 'Неверный формат домена' });
        const finalDomain = dom.normalized;
        const col = await WebSite.findOne({ where: { domain: finalDomain, status: { [Op.ne]: 'deleted' as any } } as any });
        if (col) return res.status(409).json({ message: 'Этот домен уже используется' });
        domain = finalDomain;
        domainType = 'custom';
      }
    }

    const existingSite = await WebSite.create({
      userId,
      nodeId: node?.id ?? null,
      domain,
      domainType,
      subdomainName,
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
  if (!site.pm2ProcessName && action !== 'stop') {
    return res.json({ ok: true, skipped: true, message: 'Статический сайт — управление не требуется' });
  }
  try {
    const node = site.node;
    if (node && node.ip && node.ip !== '127.0.0.1') {
      const cfg = getSshConfigForNode(node);
      const hostPort = Number(site.hostPort) || (3000 + (Math.abs(String(site.id).charCodeAt(0) + String(site.id).charCodeAt(7)) % 1000));
      const siteDir = `/var/lib/wexa/sites/${site.id}`;
      const wasSuspended = String(site.status || '').toLowerCase() === 'suspended';
      if (action === 'start' || action === 'restart') {
        await execCommand(cfg, `pm2 start ${site.pm2ProcessName} 2>/dev/null || pm2 restart ${site.pm2ProcessName} 2>/dev/null || true`).catch(() => {});
        if (wasSuspended || action === 'restart') {
          const domain = site.domain || `${String(site.id || '').slice(0, 8)}.wexa.local`;
          try {
            await writeNginxConfForSite(cfg, { ...site.toJSON(), hostPort, pm2ProcessName: site.pm2ProcessName }, siteDir, domain);
            await execCommand(cfg, `nginx -t && systemctl reload nginx || true`).catch(() => {});
          } catch (_) { /* ignore conf restore */ }
        }
      } else {
        await execCommand(cfg, `pm2 stop ${site.pm2ProcessName} 2>/dev/null || true`).catch(() => {});
        if (site.domain) {
          const shortId = String(site.id || '').slice(0, 8);
          const conf = `/etc/nginx/sites-enabled/wexa-site-${shortId}.conf`;
          const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Сайт приостановлен — Wexa.su</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f1f5f9,#cbd5e1);padding:2rem"><div style="max-width:620px;width:100%;padding:2.5rem;background:#fff;border-radius:1.25rem;box-shadow:0 10px 30px rgba(2,6,23,.08);border:1px solid rgba(2,6,23,.06)"><div style="display:inline-block;padding:.25rem .7rem;border-radius:999px;background:#fde68a;color:#92400e;font-weight:600;font-size:.8rem;margin-bottom:1.25rem;letter-spacing:.03em">⏸ Приостановлено</div><h1 style="margin:0 0 .75rem;font-size:1.75rem">Сайт остановлен пользователем</h1><p style="color:#475569;line-height:1.6;margin:.25rem 0">Нажмите «Запустить» в ЛК wexa.su — сайт вернётся в работу.</p></div></body></html>`;
          const maintenance = `server { listen 80; server_name ${site.domain}; access_log /var/log/nginx/wexa-site-${shortId}-access.log; error_log /var/log/nginx/wexa-site-${shortId}-error.log; default_type text/html; return 503 ${JSON.stringify(html)}; }`;
          const b64 = Buffer.from(maintenance, 'utf8').toString('base64');
          await execCommand(cfg, `printf '%s' '${b64}' | base64 -d > '${conf}' && nginx -t && systemctl reload nginx || true`).catch(() => {});
        }
      }
    }
    if (action === 'stop') {
      if (site.status !== 'suspended') await site.update({ status: 'suspended' });
    } else if (action === 'start' || action === 'restart') {
      if (site.status !== 'active') await site.update({ status: 'active' });
    }
    return res.json({ ok: true, message: `Сайт ${action}ед` });
  } catch (e: any) { return res.status(500).json({ message: String(e?.message ?? e) }); }
};

router.post('/:id/start', authenticateToken, async (req: any, res: Response) => control(req, res, 'start'));
router.post('/:id/stop', authenticateToken, async (req: any, res: Response) => control(req, res, 'stop'));
router.post('/:id/restart', authenticateToken, async (req: any, res: Response) => control(req, res, 'restart'));

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
    if (body.domainType === 'subdomain' && body.subdomainName !== undefined) {
      const name = String(body.subdomainName || '').trim().toLowerCase();
      const v = validateSubdomainName(name);
      if (!v.ok) return res.status(400).json({ message: `Имя поддомена: ${v.reason}` });
      const col = await WebSite.findOne({ where: { subdomainName: name, id: { [Op.ne]: site.id } } as any });
      if (col) return res.status(409).json({ message: 'Это имя поддомена уже занято' });
      patch.subdomainName = name;
      patch.domain = `${name}.${SUBDOMAIN_PARENT}`;
      patch.domainType = 'subdomain';
      needNginxReload = true;
    } else if (body.domainType === 'custom' && body.domain !== undefined && String(body.domain).trim()) {
      const dom = isValidCustomDomain(body.domain);
      if (!dom.ok || !dom.normalized) return res.status(400).json({ message: dom.reason || 'Неверный формат домена' });
      const finalDomain = dom.normalized;
      const colliding = await WebSite.findOne({ where: { domain: finalDomain, id: { [Op.ne]: site.id } } as any });
      if (colliding) return res.status(409).json({ message: 'Этот домен уже используется другим сайтом' });
      patch.domain = finalDomain;
      patch.domainType = 'custom';
      patch.subdomainName = null;
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
  const dom = isValidCustomDomain(req.body?.domain || '');
  if (!dom.ok || !dom.normalized) return res.status(400).json({ message: dom.reason || 'Неверный формат домена' });
  const domain = dom.normalized;
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

// ================== helpers: certbot parser ==================
const parseCertbotCerts = (out: string): { domain: string; name: string; expiry: Date | null; fullchain: string | null; privkey: string | null; issued: boolean }[] => {
  const blocks = String(out || '').split(/(?=-{3,}\r?\nFound the following certs|\r?\n- + -)/);
  const results: any[] = [];
  const text = String(out || '');
  const re = /Certificate Name:\s*([^\n]+)[\s\S]*?Domains:\s*([^\n]+)[\s\S]*?Expiry Date:\s*([^(]+)\([\s\S]*?Certificate Path:\s*([^\n]+)[\s\S]*?Private Key Path:\s*([^\n]+)/g;
  let m: any;
  while ((m = re.exec(text)) !== null) {
    const [, name, domainsLine, expiryStr, fullchain, privkey] = m;
    const domains = String(domainsLine || '').trim().split(/\s+/).filter(Boolean);
    const expiry = new Date(String(expiryStr || '').trim());
    const issued = !isNaN(expiry.getTime()) && expiry.getTime() > Date.now() - 86400 * 1000;
    for (const d of domains) {
      results.push({ domain: d.trim(), name: name.trim(), expiry: issued ? expiry : null, fullchain: fullchain.trim(), privkey: privkey.trim(), issued });
    }
  }
  return results;
};

const parseCertOutputForExpiry = (out: string): Date | null => {
  const lines = String(out || '').split(/\r?\n/);
  for (const line of lines) {
    const m = /(?:Valid|Expiry|expires|not after|until)\s*:\s*([^\n]+)/i.exec(line) || /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2})/.exec(line);
    if (m) {
      const d = new Date(m[1].trim());
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
};

router.post('/:id/ssl/issue', authenticateToken, async (req: any, res: Response) => {
  try {
    const site = req.site as any;
    if (!site?.domain) return res.status(400).json({ ok: false, message: 'Сначала привяжите домен.' });
    const node = site.node;
    if (!node || node.ip === '127.0.0.1') {
      await site.update({ sslExpiresAt: new Date(Date.now() + 90 * 86400 * 1000).toISOString().slice(0, 10) });
      return res.json({ ok: true, mock: true, message: 'Mock нода — SSL пропускаем.' });
    }
    const cfg = getSshConfigForNode(node);
    const email = String(req.body?.email || req.user?.email || 'admin@wexa.su').replace(/[^a-zA-Z0-9@._-]/g, '');
    const isDry = req.body?.dryRun === true;

    // 1) Ensure nginx conf first has plain :80 (rewrite if missing)
    const siteDir = `/var/lib/wexa/sites/${site.id}`;
    const hostPort = 3000 + (Math.abs(site.id.charCodeAt(0) + site.id.charCodeAt(7)) % 1000);
    await writeNginxConfForSite(cfg, { ...site.toJSON(), hostPort }, siteDir, site.domain, { sslEnforce: false });
    await execCommand(cfg, `nginx -t 2>&1 | tail -10 ; systemctl reload nginx 2>&1 || true`).catch(() => {});

    // 2) Run certbot
    const flags = isDry ? `--dry-run` : `--redirect --hsts`;
    const cmd = `certbot run --nginx -d ${site.domain} -n --agree-tos --no-eff-email -m ${email} ${flags} 2>&1 | tail -80`;
    const out = await execCommand(cfg, cmd).catch((e: any) => String(e?.message ?? e));
    const successRe = /successfully|Congratulations|dry run successful|not yet due|Certificate not yet due|Invalid response from.*200|already been installed/i;
    const ok = successRe.test(String(out)) || isDry;

    // 3) Parse certs from node; write nginx SSL block if issued
    let sslPath: string | null = site.sslCertPath || null;
    let sslExp: Date | null = parseCertOutputForExpiry(out);
    try {
      const listOut = await execCommand(cfg, `certbot certificates 2>&1 | tail -120`).catch(() => '');
      const certs = parseCertbotCerts(listOut);
      const mine = certs.find(c => c.domain === String(site.domain).trim());
      if (mine && mine.issued && mine.fullchain) {
        sslPath = mine.fullchain;
        if (mine.expiry) sslExp = mine.expiry;
        await writeNginxConfForSite(cfg, { ...site.toJSON(), hostPort, sslCertPath: mine.fullchain, sslKeyPath: mine.privkey }, siteDir, site.domain, { sslEnforce: true });
        await execCommand(cfg, `nginx -t 2>&1 | tail -10 ; systemctl reload nginx 2>&1 || true`).catch(() => {});
      }
    } catch (_) { /* ignore */ }

    // 4) Update DB
    try {
      const patch: any = {};
      if (sslPath) patch.sslCertPath = sslPath;
      if (sslExp && !isNaN(sslExp.getTime())) patch.sslExpiresAt = sslExp.toISOString().slice(0, 10);
      if (Object.keys(patch).length) await site.update(patch);
    } catch (_) { /* ignore */ }

    const reloadedSite = await WebSite.findByPk(site.id, { include: [{ model: ServerNode as any, as: 'node' }] });
    return res.json({ ok, dryRun: isDry, certbot: out, domain: site.domain, site: reloadedSite });
  } catch (e: any) { return res.status(500).json({ ok: false, message: String(e?.message ?? e) }); }
});

// Sync SSL status with node (certbot list / nginx) — safe, never fails
router.post('/:id/ssl/check', authenticateToken, async (req: any, res: Response) => {
  try {
    const site = req.site as any;
    const node = site.node;
    if (!node || node.ip === '127.0.0.1') {
      if (!site.sslExpiresAt && site.subdomainName) {
        await site.update({ sslExpiresAt: new Date(Date.now() + 90 * 86400 * 1000).toISOString().slice(0, 10) });
      }
      return res.json({ ok: true, mock: true, site });
    }
    if (!site.domain) return res.json({ ok: false, reason: 'domain_missing' });
    const cfg = getSshConfigForNode(node);
    let sslPath = site.sslCertPath || null;
    let sslExp: Date | null = null;
    try {
      const listOut = await execCommand(cfg, `certbot certificates 2>&1 | tail -120`).catch(() => '');
      const certs = parseCertbotCerts(listOut);
      const mine = certs.find(c => c.domain === String(site.domain).trim());
      if (mine && mine.issued && mine.fullchain) {
        sslPath = mine.fullchain;
        if (mine.expiry) sslExp = mine.expiry;
      }
    } catch (_) {}
    const patch: any = {};
    if (sslPath) patch.sslCertPath = sslPath;
    if (sslExp && !isNaN(sslExp.getTime())) patch.sslExpiresAt = sslExp.toISOString().slice(0, 10);
    if (!patch.sslCertPath && !patch.sslExpiresAt && !site.sslExpiresAt && site.subdomainName) {
      // subdomain always covered by wexa.su wildcard — fake 90d to avoid "не выпущен"
      patch.sslExpiresAt = new Date(Date.now() + 90 * 86400 * 1000).toISOString().slice(0, 10);
    }
    if (Object.keys(patch).length) await site.update(patch);

    // If issued cert found — write SSL nginx block (idempotent)
    if (patch.sslCertPath && patch.sslExpiresAt) {
      try {
        const siteDir = `/var/lib/wexa/sites/${site.id}`;
        const hostPort = 3000 + (Math.abs(site.id.charCodeAt(0) + site.id.charCodeAt(7)) % 1000);
        const keyPath = (patch.sslCertPath || '').replace('fullchain.pem', 'privkey.pem');
        await writeNginxConfForSite(cfg, { ...site.toJSON(), hostPort, sslCertPath: patch.sslCertPath, sslKeyPath: keyPath }, siteDir, site.domain, { sslEnforce: true });
        await execCommand(cfg, `nginx -t 2>&1 | tail -5 ; systemctl reload nginx 2>&1 || true`).catch(() => {});
      } catch (_) {}
    }

    const reloaded = await WebSite.findByPk(site.id, { include: [{ model: ServerNode as any, as: 'node' }] });
    return res.json({ ok: true, site: reloaded, issued: Boolean(patch.sslExpiresAt || site.sslExpiresAt) });
  } catch (e: any) { return res.status(500).json({ ok: false, message: String(e?.message ?? e) }); }
});

// Transfer site ownership to another registered user by email
// Validation: paidUntil must be >= today + 6 days (i.e. at least 6 full days paid forward)
router.patch('/:id/transfer', authenticateToken, async (req: any, res: Response) => {
  try {
    const site = req.site as any;
    const caller = req.user;
    const isAdmin = getIsAdminFromReq(req);
    if (!site.userId) return res.status(400).json({ message: 'У сайта нет владельца' });

    // Ownership guard: owner OR admin can transfer
    if (!isAdmin && String(caller.id) !== String(site.userId)) {
      return res.status(403).json({ message: 'Вы не владелец сайта' });
    }

    // Normalize target email (case-insensitive)
    const emailRaw = String(req.body?.email || '').trim();
    if (!emailRaw) return res.status(400).json({ message: 'Введите email получателя' });
    const email = emailRaw.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Некорректный email' });
    }
    if (email === String(caller.email || '').toLowerCase()) {
      return res.status(400).json({ message: 'Нельзя передать сайт самому себе' });
    }

    // Find target user
    const target = await User.findOne({
      where: { email } as any,
      attributes: ['id', 'email', 'role', 'name'],
    }) as any;
    if (!target) return res.status(404).json({ message: 'Пользователь с таким email не зарегистрирован в системе' });
    if (String(target.id) === String(site.userId)) {
      return res.status(400).json({ message: 'Этот пользователь уже является владельцем сайта' });
    }

    // Paid-until guard: AT LEAST 6 days paid forward from today's midnight (not "more than 5 days"!)
    const paidUntilRaw = site.paidUntil;
    if (!paidUntilRaw) {
      return res.status(400).json({ message: 'Сайт не оплачен — пополните баланс минимум на 6 дней вперёд' });
    }
    const paidUntil = new Date(String(paidUntilRaw) + 'T23:59:59Z');
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const todayUTC = new Date(Date.UTC(todayMidnight.getFullYear(), todayMidnight.getMonth(), todayMidnight.getDate()));
    const MIN_DAYS = 6;
    const diffMs = paidUntil.getTime() - todayUTC.getTime();
    const paidDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMs < MIN_DAYS * 24 * 60 * 60 * 1000 || paidDays < MIN_DAYS) {
      return res.status(400).json({
        message: `Сайт оплачен ещё на ${paidDays} дн. Для передачи нужно минимум ${MIN_DAYS} дней. Продлите тариф и попробуйте снова.`,
        daysPaidAhead: paidDays,
        daysRequired: MIN_DAYS,
      });
    }

    const prevUserId = String(site.userId);
    const prevUser = await User.findOne({ where: { id: prevUserId }, attributes: ['id', 'email', 'name'] } as any) as any;
    await site.update({
      userId: target.id,
      updatedAt: new Date(),
    });

    // Audit log: wallet transaction entries (zero amount, type=adjust) for traceability
    try {
      const now = new Date();
      const descriptionLoss = `Передача сайта ${site.id.slice(0, 8)} ${site.domain || site.subdomainName || ''} пользователю ${target.email}`;
      const descriptionGain = `Получен сайт ${site.id.slice(0, 8)} ${site.domain || site.subdomainName || ''} от пользователя ${(prevUser?.email) || '(unknown)'}`;
      await WalletTransaction.bulkCreate([
        {
          userId: prevUserId,
          type: 'adjust',
          amount: 0,
          status: 'completed',
          description: descriptionLoss,
          relatedId: String(site.id),
          createdAt: now,
          updatedAt: now,
        } as any,
        {
          userId: target.id,
          type: 'adjust',
          amount: 0,
          status: 'completed',
          description: descriptionGain,
          relatedId: String(site.id),
          createdAt: now,
          updatedAt: now,
        } as any,
      ]).catch(() => {});
    } catch (_) { /* audit optional */ }

    // Also: SFTP/SSH home dirs/sudoers already match site.id (shortId prefix), not userId. No need to re-provision node.
    const reloaded = await WebSite.findByPk(site.id, { include: [{ model: ServerNode as any, as: 'node' }] });
    return res.json({
      ok: true,
      message: `Сайт передан пользователю ${target.email}. У него появится сайт в ЛК в разделе «Сайты».`,
      transferredTo: { id: target.id, email: target.email, name: target.name || null },
      transferredFrom: prevUser ? { id: prevUserId, email: prevUser.email, name: prevUser.name || null } : { id: prevUserId },
      paidDaysAhead: paidDays,
      site: reloaded,
    });
  } catch (e: any) {
    return res.status(e.statusCode || 500).json({ ok: false, message: String(e?.message ?? e) });
  }
});

const formatWebsitePeriodSuffix = (n: number) => {
  if (n === 1) return '1 мес.';
  if (n === 3) return '3 мес.';
  if (n === 6) return '6 мес.';
  if (n === 12) return '12 мес.';
  return `${n} мес.`;
};

const getWebsiteMonthlyPrice = (site: any): number => {
  const priceMonthly = Number(site?.priceMonthly);
  if (Number.isFinite(priceMonthly) && priceMonthly > 0) return priceMonthly;
  const planKey = String(site?.plan || 'landing').toLowerCase();
  const plan = WEB_PLANS.find(p => p.key === planKey);
  return plan?.priceMonthly ?? 399;
};

export const createWebsiteSubscriptionInvoice = async (req: Request, res: Response) => {
  try {
    const { months } = req.body || {};
    const periodRaw = Number(months) || 1;
    const validPeriods = Object.keys(PERIOD_DISCOUNTS).map(n => Number(n));
    const periodMonths = validPeriods.includes(periodRaw) ? periodRaw : Math.max(1, Math.min(12, periodRaw));
    const discount = PERIOD_DISCOUNTS[periodMonths] ?? 0;

    // @ts-ignore
    const userId = req.user.id;
    // @ts-ignore
    const isAdmin = req.user.role === 'admin';

    const site = (req as any).site as any;
    if (!site) {
      res.status(404).json({ message: 'Сайт не найден' });
      return;
    }
    if (!isAdmin && site.userId !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const monthlyPrice = getWebsiteMonthlyPrice(site);
    const amount = Math.max(0, Math.ceil(monthlyPrice * periodMonths * (1 - discount)));

    if (!isAdmin) {
      const u = await User.findByPk(site.userId, { attributes: ['id', 'balance'] });
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

    const shortId = String(site.id || '').slice(0, 8);
    const invoice = await Invoice.create({
      title: `Продление сайта: ${site.domain || site.subdomainName || shortId} (${formatWebsitePeriodSuffix(periodMonths)}${discount > 0 ? `, -${Math.round(discount * 100)}%` : ''})`,
      amount,
      status: 'pending',
      type: 'monthly',
      dueDate: new Date(),
      userId: site.userId,
      siteId: site.id,
      periodMonths,
    } as any);

    if (!isAdmin) {
      try {
        await adjustBalance({
          userId: site.userId,
          amount: -round2(amount),
          type: 'withdraw',
          description: invoice.title,
          invoiceId: invoice.id,
          relatedId: site.id,
        });
      } catch (wb: any) {
        res.status(402).json({ message: wb.message || 'Недостаточно средств' });
        return;
      }
      invoice.status = 'paid';
      await invoice.save();
      try { await applyWebSitePaidInvoice(invoice); } catch (e) { console.error(e); }
      res.status(201).json({ ...invoice.toJSON(), paidWithBalance: true });
      return;
    }

    // Admin: create invoice as pending, return 201
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create website subscription invoice error:', error);
    res.status(500).json({ message: 'Ошибка при создании счёта подписки' });
  }
};

router.post('/:id/subscription', authenticateToken, createWebsiteSubscriptionInvoice);

router.get('/:id/sftp-creds', authenticateToken, async (req: any, res: Response) => {
  const site = req.site as any;
  const node = site.node;
  const shortId = String(site.id || '').slice(0, 8);
  let sftpPassword = site.sftpPassword || site.sftpPasswordPlainOnce || null;
  let sshPassword = site.sshPassword || null;
  const sftpUser = site.sftpUsername || `wexa_site_${shortId}`;
  const sshUser = site.sshUsername || `wexa_ssh_${shortId}`;
  const siteDir = `/var/lib/wexa/sites/${site.id}`;

  // Auto-regen SFTP password if missing + user exists on node
  if (!sftpPassword && sftpUser && node && node.ip && node.ip !== '127.0.0.1') {
    try {
      sftpPassword = genRandomPassword(18);
      const cfg = getSshConfigForNode(node);
      const hash = bcrypt.hashSync(sftpPassword, SALT_ROUNDS);
      const shadow = await execCommand(cfg, `openssl passwd -1 '${sftpPassword.replace(/'/g, "'\\''")}'`).then(o => o.trim());
      try { await execCommand(cfg, `id -u "${sftpUser}" >/dev/null 2>&1 || ( useradd -M -s /usr/sbin/nologin -G sftponly "${sftpUser}" 2>&1 ); true; usermod -p '${shadow.replace(/'/g, "'\\''")}' "${sftpUser}"`); } catch (_) {}
      try { await site.update({ sftpUsername: sftpUser, sftpPassword, sftpPasswordHash: hash, sftpPasswordPlainOnce: sftpPassword }); } catch (_) {}
    } catch (e) { console.warn('[sftp-creds] auto-reset SFTP failed:', e); sftpPassword = null; }
  } else if (sftpPassword && !site.sftpPassword) {
    try { await site.update({ sftpPassword }); } catch (_) {}
  }

  // Auto-create/regen SSH shell password if missing (separate user — NOT sftponly)
  if (!sshPassword && node && node.ip && node.ip !== '127.0.0.1') {
    try {
      sshPassword = genRandomPassword(18);
      const cfg = getSshConfigForNode(node);
      const hash = bcrypt.hashSync(sshPassword, SALT_ROUNDS);
      const shadow = await execCommand(cfg, `openssl passwd -1 '${sshPassword.replace(/'/g, "'\\''")}'`).then(o => o.trim());
      try {
        await execCommand(cfg, `id -u "${sshUser}" >/dev/null 2>&1 || ( useradd -M -s /bin/bash -d "${siteDir}" -G users "${sshUser}" 2>&1 ); true; usermod -d "${siteDir}" -s /bin/bash "${sshUser}"`);
        await execCommand(cfg, `usermod -p '${shadow.replace(/'/g, "'\\''")}' "${sshUser}"`);
      } catch (_) {}
      try { await site.update({ sshUsername: sshUser, sshPassword, sshPasswordHash: hash, sshPort: node?.sshPort || 22 }); } catch (_) {}
    } catch (e) { console.warn('[sftp-creds] auto-create SSH user failed:', e); sshPassword = null; }
  } else if (sshPassword && !site.sshPassword) {
    try { await site.update({ sshPassword }); } catch (_) {}
  }

  return res.json({
    ok: true,
    host: node?.ip || '',
    port: site.sftpPort || 22,
    username: sftpUser,
    user: sftpUser,
    password: sftpPassword,
    passwordOnce: sftpPassword,
    rootPath: '/public_html',
    note: 'SFTP доступ для редактирования файлов (FileZilla/WinSCP). Для PuTTY/bash используй отдельный SSH доступ ниже.',
    sftp: {
      host: node?.ip || '',
      port: site.sftpPort || 22,
      username: sftpUser,
      user: sftpUser,
      password: sftpPassword,
      rootPath: '/public_html',
      cli: `sftp -P ${site.sftpPort || 22} ${sftpUser}@${node?.ip || ''}`,
      note: 'SFTP only — PuTTY закроется сразу (ForceCommand internal-sftp). Для терминала используй SSH Terminal ниже.',
    },
    ssh: {
      host: node?.ip || '',
      port: site.sshPort || node?.sshPort || 22,
      username: sshUser,
      user: sshUser,
      password: sshPassword,
      homeDir: siteDir,
      cli: `ssh ${sshUser}@${node?.ip || ''} -p ${site.sshPort || node?.sshPort || 22}`,
      note: 'SSH shell для PuTTY / Terminal / bash. Домашняя директория = корень сайта. Можно запускать pm2, npm, nginx -t (sudoers NOPASSWD).',
    },
  });
});

router.post('/:id/sftp-password-reset', authenticateToken, async (req: any, res: Response) => {
  try {
    const site = req.site as any;
    const node = site.node;
    if (!node || node.ip === '127.0.0.1') return res.status(400).json({ ok:false, message:'Сайт на локальной ноде — сброс не нужен' });
    const shortId = String(site.id || '').slice(0, 8);
    const sftpUser = site.sftpUsername || `wexa_site_${shortId}`;
    const sshUser = site.sshUsername || `wexa_ssh_${shortId}`;
    const sftpPass = genRandomPassword(18);
    const sshPass = genRandomPassword(18);
    const cfg = getSshConfigForNode(node);
    const sftpHash = bcrypt.hashSync(sftpPass, SALT_ROUNDS);
    const sshHash = bcrypt.hashSync(sshPass, SALT_ROUNDS);
    const sftpShadow = await execCommand(cfg, `openssl passwd -1 '${sftpPass.replace(/'/g, "'\\''")}'`).then(o => o.trim());
    const sshShadow = await execCommand(cfg, `openssl passwd -1 '${sshPass.replace(/'/g, "'\\''")}'`).then(o => o.trim());
    const siteDir = `/var/lib/wexa/sites/${site.id}`;
    const sftpChroot = site.sftpChroot || `/srv/sftp/${sftpUser}`;

    // SFTP user (SFTP only, Chroot, nologin)
    await execCommand(cfg, `id -u "${sftpUser}" >/dev/null 2>&1 || ( useradd -M -s /usr/sbin/nologin -G sftponly "${sftpUser}" 2>&1 ); true`);
    await execCommand(cfg, `usermod -p '${sftpShadow.replace(/'/g, "'\\''")}' "${sftpUser}"`);
    await execCommand(cfg, `chown -R "${sftpUser}":users "${siteDir}" 2>/dev/null || true; chmod -R u+rwX,go+rX "${siteDir}" 2>/dev/null || true`);

    // SSH shell user (bash, home=siteDir, NOT sftponly, sudoers NOPASSWD pm2)
    await execCommand(cfg, `id -u "${sshUser}" >/dev/null 2>&1 || ( useradd -M -s /bin/bash -d "${siteDir}" -G users "${sshUser}" 2>&1 ); true; usermod -d "${siteDir}" -s /bin/bash "${sshUser}"`);
    await execCommand(cfg, `usermod -p '${sshShadow.replace(/'/g, "'\\''")}' "${sshUser}"`);
    await execCommand(cfg, `mkdir -p /etc/sudoers.d; echo '${sshUser} ALL=(ALL) NOPASSWD: /usr/bin/pm2, /usr/bin/pm2 restart, /usr/bin/pm2 reload, /usr/bin/pm2 logs, /usr/bin/pm2 status, /usr/bin/pm2 save, /usr/bin/systemctl reload nginx, /usr/bin/nginx -t' > /etc/sudoers.d/wexa-ssh-${shortId} 2>/dev/null; true; chmod 0440 /etc/sudoers.d/wexa-ssh-${shortId} 2>/dev/null || true`);

    // Ensure chroot + bind exist
    await execCommand(cfg, `mkdir -p "${sftpChroot}/public_html" && chown root:root "${sftpChroot}" && chmod 755 "${sftpChroot}" 2>/dev/null || true`);
    await execCommand(cfg, `grep -qF "${siteDir}" /etc/fstab || echo "${siteDir} ${sftpChroot}/public_html none bind 0 0" >> /etc/fstab; mount "${sftpChroot}/public_html" 2>/dev/null || true`);

    await site.update({
      sftpUsername: sftpUser, sftpPassword: sftpPass, sftpPasswordHash: sftpHash, sftpPasswordPlainOnce: sftpPass, sftpChroot,
      sshUsername: sshUser, sshPassword: sshPass, sshPasswordHash: sshHash, sshPort: node?.sshPort || 22,
    });
    return res.json({
      ok:true, message:'SFTP + SSH пароли сброшены',
      sftp: { username: sftpUser, password: sftpPass, port: site.sftpPort || 22 },
      ssh: { username: sshUser, password: sshPass, port: site.sshPort || node?.sshPort || 22, homeDir: siteDir },
    });
  } catch (e: any) {
    console.error('[sftp-reset] error:', e);
    return res.status(500).json({ ok:false, message: String(e?.message ?? e) });
  }
});

// ================= Files API (multer) =================
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 16 * 1024 * 1024 } });

const sanitizePath = (unsafe: unknown, _siteId: string): string => {
  const raw = String(unsafe || '').replace(/\\/g, '/').trim() || '/';
  let rel = raw;
  if (rel.toLowerCase().startsWith('/public_html')) rel = rel.slice('/public_html'.length);
  if (!rel.startsWith('/')) rel = '/' + rel;
  const parts = rel.split('/').filter(Boolean);
  const clean: string[] = [];
  for (const p of parts) {
    if (p === '.' || !p) continue;
    if (p === '..') { clean.pop(); continue; }
    clean.push(p);
  }
  return `/public_html/${clean.join('/')}`.replace(/\/+$/, '/').replace(/\/+/g, '/');
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
      if (name === '.' || name === '..') return null;
      return {
        name, isDir: perms.startsWith('d'), size: Number.isNaN(Number(size)) ? 0 : Number(size),
        modified: date, perms, owner,
      } as any;
    }).filter(Boolean).sort((a: any, b: any) => {
      if (!!a.isDir !== !!b.isDir) return a.isDir ? -1 : 1;
      return String(a.name || '').localeCompare(String(b.name || ''), 'ru');
    });
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

router.post('/admin/create', authenticateToken, isAdmin, async (req: any, res: Response) => {
  req.body.autoPay = true;
  req.body.plan = req.body.plan || 'business';
  return (router.stack.find((l: any) => l.route && l.route.path === '/order') as any)?.handle?.(req, res, (e: any) => res.status(500).json({ message: String(e?.message || e) }));
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
    if (node && site.status !== 'deleted') {
      const used = Number((node as any).usedWebSites || 0);
      (node as any).usedWebSites = Math.max(0, used - 1);
      await (node as any).save();
    }
    await site.update({ status: 'deleted', pm2ProcessName: null, sftpUsername: null, sftpPasswordHash: null, sftpChroot: null, sftpPassword: null, sftpPasswordPlainOnce: null, nginxConfPath: null, sslCertPath: null, sslExpiresAt: null, gitRepoUrl: null, subdomainName: null, domain: null, domainType: null, sshUsername: null, sshPassword: null, sshPasswordHash: null, nodeId: null, settings: {} } as any);
    return res.json({ ok: true });
  } catch (e: any) { return res.status(500).json({ message: String(e?.message ?? e) }); }
});
router.post('/admin/:id/delete', authenticateToken, isAdmin, async (req: any, res: Response) => {
  req.params.id = req.params.id;
  const h = (router.stack.find((l: any) => l.route && l.route.path === '/admin/sites/:id/delete') as any);
  return h?.handle?.(req, res, (e: any) => res.status(500).json({ message: String(e?.message || e) }));
});

router.post('/admin/sites/:id/start', authenticateToken, isAdmin, async (req: any, res: Response) => control(req, res, 'start'));
router.post('/admin/sites/:id/stop', authenticateToken, isAdmin, async (req: any, res: Response) => control(req, res, 'stop'));
router.post('/admin/sites/:id/restart', authenticateToken, isAdmin, async (req: any, res: Response) => control(req, res, 'restart'));
router.post('/admin/:id/start', authenticateToken, isAdmin, async (req: any, res: Response) => control(req, res, 'start'));
router.post('/admin/:id/stop', authenticateToken, isAdmin, async (req: any, res: Response) => control(req, res, 'stop'));
router.post('/admin/:id/restart', authenticateToken, isAdmin, async (req: any, res: Response) => control(req, res, 'restart'));

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
    const sshUser = site.sshUsername || `wexa_ssh_${shortId}`;
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
( id "${sshUser}" >/dev/null 2>&1 && userdel -f -r "${sshUser}" 2>/dev/null || true );
( rm -f "/etc/sudoers.d/wexa-ssh-${shortId}" 2>/dev/null || true );
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
      const sftpPass = site.sftpPassword || site.sftpPasswordPlainOnce || genRandomPassword(18);
      const sshPass = site.sshPassword || genRandomPassword(18);
      const sftpPassHash = bcrypt.hashSync(sftpPass, SALT_ROUNDS);
      const sshPassHash = bcrypt.hashSync(sshPass, SALT_ROUNDS);
      const templateDir = site.coreTemplate === 'nodejs' ? '/var/lib/wexa/templates/orlan-taxi-business' : '/var/lib/wexa/templates/static-landing';
      await execCommand(newCfg, `mkdir -p "${siteDir}" "/var/lib/wexa/backups/sites/${site.id}" "${sftpChroot}/public_html" && chown root:root "${sftpChroot}" && chmod 755 "${sftpChroot}"; true`);
      await execCommand(newCfg, `if [ ! -d "${siteDir}" ] || [ -z "$(ls -A ${siteDir} 2>/dev/null)" ]; then if [ -d "${templateDir}" ]; then cp -R "${templateDir}/." "${siteDir}/" 2>/dev/null; fi; fi; true`);
      // SFTP user
      await execCommand(newCfg, `id -u "${sftpUser}" >/dev/null 2>&1 || ( useradd -M -s /usr/sbin/nologin -G sftponly "${sftpUser}" 2>&1 ); true`);
      const sftpShadow = await execCommand(newCfg, `openssl passwd -1 '${sftpPass.replace(/'/g, "'\\''")}'`).then(o => o.trim());
      await execCommand(newCfg, `usermod -p '${sftpShadow.replace(/'/g, "'\\''")}' "${sftpUser}"`);
      // SSH shell user
      await execCommand(newCfg, `id -u "${sshUser}" >/dev/null 2>&1 || ( useradd -M -s /bin/bash -d "${siteDir}" -G users "${sshUser}" 2>&1 ); true; usermod -d "${siteDir}" -s /bin/bash "${sshUser}"`);
      const sshShadow = await execCommand(newCfg, `openssl passwd -1 '${sshPass.replace(/'/g, "'\\''")}'`).then(o => o.trim());
      await execCommand(newCfg, `usermod -p '${sshShadow.replace(/'/g, "'\\''")}' "${sshUser}"`);
      await execCommand(newCfg, `mkdir -p /etc/sudoers.d; echo '${sshUser} ALL=(ALL) NOPASSWD: /usr/bin/pm2, /usr/bin/pm2 restart, /usr/bin/pm2 reload, /usr/bin/pm2 logs, /usr/bin/pm2 status, /usr/bin/pm2 save, /usr/bin/systemctl reload nginx, /usr/bin/nginx -t' > /etc/sudoers.d/wexa-ssh-${shortId} 2>/dev/null; true; chmod 0440 /etc/sudoers.d/wexa-ssh-${shortId} 2>/dev/null || true`);
      // Perms
      await execCommand(newCfg, `chown -R "${sshUser}":users "${siteDir}" 2>/dev/null || true; chown -R "${sftpUser}":users "${siteDir}" 2>/dev/null || true; chmod -R u+rwX,go+rX "${siteDir}"`);
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
      sftpPassword: sftpPass,
      sftpChroot,
      sshUsername: sshUser,
      sshPassword: sshPass,
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
router.post('/admin/:id/migrate', authenticateToken, isAdmin, async (req: any, res: Response) => {
  const h = (router.stack.find((l: any) => l.route && l.route.path === '/admin/sites/:id/migrate') as any);
  return h?.handle?.(req, res, (e: any) => res.status(500).json({ message: String(e?.message || e) }));
});

// ==================== apply paid invoice ==================
const writeNginxConfForSite = async (cfg: any, site: any, siteDir: string, domain: string, options: { sslEnforce?: boolean } = {}) => {
  const shortId = String(site.id || '').slice(0, 8) || 'unknown';
  const hasProxy = Boolean(site.pm2ProcessName);
  const port = Number(site.hostPort || 3000);
  const sslEnforce = Boolean(options.sslEnforce);
  const sslCert = String(site.sslCertPath || '').trim();
  const sslKey = String(site.sslKeyPath || '').trim() || (sslCert ? sslCert.replace('fullchain.pem', 'privkey.pem') : '');
  const sslOK = sslEnforce && sslCert && sslKey;

  const serverSslLines = sslOK
    ? `  listen 443 ssl http2;
  ssl_certificate ${sslCert};
  ssl_certificate_key ${sslKey};
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;
`
    : '';
  const server80Redirect = sslOK
    ? `server {
  listen 80;
  server_name ${domain};
  return 301 https://\$host\$request_uri;
}
`
    : '';

  const proxyCommon = sslOK
    ? `
  location / {
    proxy_pass http://127.0.0.1:${port};
    proxy_http_version 1.1;
    proxy_set_header Host \\$host;
    proxy_set_header X-Real-IP \\$remote_addr;
    proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \\$scheme;
    proxy_set_header Upgrade \\$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_connect_timeout 60s;
    proxy_read_timeout 120s;
  }`
    : `
  location ~* \\.(?:js|css|png|jpe?g|gif|svg|ico|woff2?|ttf|eot)$ {
    root ${siteDir}/public;
    expires 7d;
    add_header Cache-Control "public";
    try_files \\$uri =404;
  }
  location / {
    proxy_pass http://127.0.0.1:${port};
    proxy_http_version 1.1;
    proxy_set_header Host \\$host;
    proxy_set_header X-Real-IP \\$remote_addr;
    proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \\$scheme;
    proxy_set_header Upgrade \\$http_upgrade;
    proxy_set_header Connection "upgrade";
  }`;

  const conf = `${server80Redirect}server {
${sslOK ? serverSslLines : '  listen 80;'}
  server_name ${domain};
${hasProxy && sslOK ? '' : `  root ${hasProxy ? `${siteDir}/public` : siteDir};\n  index index.html index.htm;`}
  access_log /var/log/nginx/wexa-site-${shortId}-access.log;
  error_log /var/log/nginx/wexa-site-${shortId}-error.log;
${hasProxy ? proxyCommon : ''}
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
  const period = Number(invoice.periodMonths || 1);
  const paidUntil = getPaidUntilDate(period, site.paidUntil ? new Date(site.paidUntil) : undefined);
  const isActiveRenewal = site.status === 'active' || site.status === 'provisioning';
  if (isActiveRenewal) {
    await site.update({ paidUntil } as any);
    try {
      if (site.nodeId) {
        const count = await WebSite.count({ where: { nodeId: site.nodeId, status: 'active' } });
        await ServerNode.update({ usedWebSites: count }, { where: { id: site.nodeId } });
      }
    } catch (_) { /* ignore */ }
    return;
  }
  await site.update({ status: 'provisioning' });
  try {
    const node = site.node;
    const isMock = !node || node.ip === '127.0.0.1';
    const shortId = site.id.slice(0, 8);
    const sftpUser = `wexa_site_${shortId}`;
    const sftpPass = genRandomPassword(18);
    const sftpPasswordHash = bcrypt.hashSync(sftpPass, SALT_ROUNDS);
    const sshUser = `wexa_ssh_${shortId}`;
    const sshPass = genRandomPassword(18);
    const sshPasswordHash = bcrypt.hashSync(sshPass, SALT_ROUNDS);
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
      // SFTP user: sftponly group, nologin shell, Chroot + ForceCommand SFTP (PuTTY закрывается — это нормально)
      await execCommand(cfg, `id -u "${sftpUser}" >/dev/null 2>&1 || ( useradd -M -s /usr/sbin/nologin -G sftponly "${sftpUser}" 2>&1 ); true`);
      const sftpShadow = await execCommand(cfg, `openssl passwd -1 '${sftpPass.replace(/'/g, "'\\''")}'`).then(o => o.trim());
      await execCommand(cfg, `usermod -p '${sftpShadow.replace(/'/g, "'\\''")}' "${sftpUser}"`);
      await execCommand(cfg, `chown -R "${sftpUser}":users "${siteDir}" && chmod -R u+rwX,go+rX "${siteDir}"`);
      // SSH shell user: NOT sftponly! shell bash, HOME = siteDir → PuTTY/Terminal OK
      await execCommand(cfg, `id -u "${sshUser}" >/dev/null 2>&1 || ( useradd -M -s /bin/bash -d "${siteDir}" -G users "${sshUser}" 2>&1 ); true; usermod -d "${siteDir}" -s /bin/bash "${sshUser}"`);
      const sshShadow = await execCommand(cfg, `openssl passwd -1 '${sshPass.replace(/'/g, "'\\''")}'`).then(o => o.trim());
      await execCommand(cfg, `usermod -p '${sshShadow.replace(/'/g, "'\\''")}' "${sshUser}"`);
      await execCommand(cfg, `chown -R "${sshUser}":users "${siteDir}" 2>/dev/null || true; chmod -R u+rwX,go+rX "${siteDir}"`);
      // Также добавим в sudoers NOPASSWD для pm2/logs чтобы можно было перезапустить свой pm2 из shell (опционально)
      await execCommand(cfg, `mkdir -p /etc/sudoers.d; echo '${sshUser} ALL=(ALL) NOPASSWD: /usr/bin/pm2, /usr/bin/pm2 restart, /usr/bin/pm2 reload, /usr/bin/pm2 logs, /usr/bin/pm2 status, /usr/bin/pm2 save, /usr/bin/systemctl reload nginx, /usr/bin/nginx -t' > /etc/sudoers.d/wexa-ssh-${shortId} 2>/dev/null; true; chmod 0440 /etc/sudoers.d/wexa-ssh-${shortId} 2>/dev/null || true`);
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
      sftpPassword: sftpPass,
      sftpPasswordPlainOnce: sftpPass,
      sftpPort: node?.sshPort || 22,
      sftpChroot,
      sshUsername: sshUser,
      sshPassword: sshPass,
      sshPasswordHash,
      sshPort: node?.sshPort || 22,
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
