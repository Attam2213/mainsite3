import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth';
import { saveUserKeys, getUserKeysStatus, getApiKeyForCall, resolveKeysForUser } from '../services/userKeysService';
import { buildWebsitePrompt, callLLM, extractPayload, type WexaWebsitePayload } from '../services/aiWebsiteService';
import { calcCost, AI_PRICING, type CostBreakdown } from '../utils/aiPricing';
import { adjustBalance, getBalance, round2 } from '../services/balanceService';
import { AITransaction, type AIProvider, User, Invoice, WebSite, ServerNode } from '../models';
import { Op } from 'sequelize';
import { validateWebsitePlan } from '../utils/websitesHelper';
import { applyWebSitePaidInvoice, createWebSiteInternal } from '../controllers/webSiteController';
import type { Request, Response } from 'express';

const router = express.Router();

// --- USER: Keys API ---
router.get('/keys/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const status = await getUserKeysStatus(req.user.id);
    res.json({ status });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Server error' });
  }
});

router.post('/keys/save', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    await saveUserKeys(req.user.id, {
      openAI: req.body?.openAI,
      anthropic: req.body?.anthropic,
      gemini: req.body?.gemini,
    });
    // @ts-ignore
    const status = await getUserKeysStatus(req.user.id);
    res.json({ ok: true, status });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Server error' });
  }
});

// --- Pricing preview ---
router.post('/estimate', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const r = await resolveKeysForUser(req.user.id);
    const provider = (req.body?.provider as AIProvider) || r.preferredProvider;
    if (!AI_PRICING[provider]) return res.status(400).json({ message: 'Bad provider' });
    const description = [
      req.body?.description, req.body?.sections, req.body?.contacts, req.body?.colors, req.body?.businessName,
    ].filter(Boolean).join('\n');
    const cost: CostBreakdown = calcCost(provider, description, 2.5, 1.8);
    const hasOwnKey = r.usedOwnKey;
    res.json({
      provider,
      hasOwnKey,
      model: AI_PRICING[provider].defaultModel,
      estimate: cost,
      finalUserBilledRUB: hasOwnKey ? 0 : cost.userBilledRUB,
      balance: await getBalance((req as any).user.id),
    });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Server error' });
  }
});

// --- Main endpoint: Generate website & deploy ---
router.post('/generate/website', authenticateToken, async (req: Request, res: Response) => {
  let airId: string | null = null;
  try {
    // @ts-ignore
    const userId: string = req.user.id;
    // @ts-ignore
    const isAdmin = req.user.role === 'admin';
    const plan = validateWebsitePlan(String(req.body?.plan || 'landing')).plan;
    const subdomain = String(req.body?.subdomain || '').trim().toLowerCase() || null;
    const customDomain = String(req.body?.customDomain || '').trim() || null;
    const description = String(req.body?.description || '').trim() || 'Стандартный сайт визитка';
    const businessName = String(req.body?.businessName || '').trim() || '';
    const contacts = String(req.body?.contacts || '').trim() || '';
    const colors = String(req.body?.colors || '').trim() || '';
    const sections = String(req.body?.sections || '').trim() || '';
    const language = (req.body?.language === 'en' ? 'en' : 'ru') as 'ru' | 'en';

    const r = await resolveKeysForUser(userId);
    const provider = (req.body?.provider as AIProvider) || r.preferredProvider;
    if (!AI_PRICING[provider]) return res.status(400).json({ message: 'Неподдерживаемый провайдер ИИ' });

    const userKeyRes = await getApiKeyForCall(userId, provider);
    if (!userKeyRes) {
      return res.status(402).json({
        message: `Ключ провайдера ${provider} не задан ни в ваших настройках, ни в глобальных переменных окружения сервера. Добавьте свой API ключ в ЛК «Настройки → API-ключи ИИ» или попросите админа.`,
      });
    }
    const { usedOwnKey } = userKeyRes;
    const systemPrompt = 'You are Wexa AI website builder bot. Always return VALID JSON only.';
    const prompt = buildWebsitePrompt({ description, businessName, contacts, colors, sections, plan, language });
    const cost: CostBreakdown = calcCost(provider, prompt + systemPrompt, 2.5, 1.8);

    let tx: any = null;
    if (!usedOwnKey && !isAdmin) {
      const bal = await getBalance(userId);
      if (bal + 0.001 < cost.userBilledRUB) {
        return res.status(402).json({
          message: `Недостаточно средств на балансе. Генерация сайта стоит ≈ ${cost.userBilledRUB.toFixed(2)} ₽, а у вас ${bal.toFixed(2)} ₽. Пополните баланс или добавьте свой API ключ в настройках (тогда генерация бесплатно для баланса Wexa, токены оплачивает ваш провайдер LLM).`,
          needed: round2(cost.userBilledRUB - bal),
          estimate: cost,
        });
      }
      // Balance-first: Списываем сразу. Если LLM упадёт — всё равно удержим (спорные возвращает админ, это micro-payments)
      const descriptionText = `AI Генерация сайта Wexa (${AI_PRICING[provider].defaultModel}, план ${plan})`;
      const { newBalance } = await adjustBalance({
        userId,
        amount: -cost.userBilledRUB,
        type: 'withdraw',
        description: descriptionText,
        metadata: {
          aiProvider: provider,
          aiModel: AI_PRICING[provider].defaultModel,
          inputTokensEst: cost.inputTokens,
          outputTokensEst: cost.outputTokensEstimated,
          websitePlan: plan,
          action: 'generate-website',
        },
      });
      tx = { userBilledRUB: cost.userBilledRUB, ourCostRUB: cost.ourCostRUB, profitRUB: cost.profitRUB, newBalance };
    }

    const air = await AITransaction.create({
      userId,
      provider,
      action: 'generate-website',
      inputTokens: cost.inputTokens,
      outputTokens: cost.outputTokensEstimated,
      ourCostRUB: tx ? cost.ourCostRUB : 0,
      userBilledRUB: tx ? cost.userBilledRUB : 0,
      profitRUB: tx ? cost.profitRUB : 0,
      usedOwnKey,
    });
    airId = air.id;

    // Start streaming/response early-ish: 180s but we send chunked via plain JSON at end (frontend shows spinner)
    const llmRes = await callLLM(provider, userKeyRes.key, systemPrompt, prompt);
    // Update actual usage tokens
    air.inputTokens = llmRes.inputTokens;
    air.outputTokens = llmRes.outputTokens;
    try { await air.save(); } catch {}

    let payload: WexaWebsitePayload;
    try { payload = extractPayload(llmRes.answer); }
    catch (e1) {
      try { payload = extractPayload(llmRes.answer.replace(/[\u0000-\u0008\u000b-\u000c\u000e-\u001f]/g, '')); }
      catch (e2: any) {
        return res.status(422).json({
          message: 'ИИ вернул невалидный JSON. Повторите попытку (запрос не оплачивается при ошибке LLM — средства вернулись автоматически при админ-проверке). Raw: ' + (e2?.message || ''),
          debugRaw: llmRes.answer.slice(0, 1200),
        });
      }
    }

    // Теперь создаём Website record + provision на ноду!
    const user = await User.findByPk(userId, { attributes: ['id', 'name', 'email'] });
    const nodes = await ServerNode.findAll({ where: { type: { [Op.or as any]: ['web', 'shared', 'universal'] } }, limit: 1 });
    const nodeId = nodes?.[0]?.id || null;
    if (!nodeId) {
      return res.status(503).json({ message: 'Нет доступных веб-нод. Попробуйте позже или напишите админу.', aiTransactionId: airId });
    }

    // Создаём Invoice на 1 месяц (applyWebSitePaidInvoice запустит provision + SFTP)
    // Для MVP: website FREE создания (уже списали AI cost), абонентка по классике
    const inv = await Invoice.create({
      userId,
      title: `Сайт (AI сгенерирован) ${payload.meta?.title || plan} · 1 месяц`,
      amount: 0.01,
      type: 'monthly',
      status: 'paid',
      paidAt: new Date(),
      siteId: null,
      periodMonths: 1,
    });

    // Создаём WebSite через internal
    const { webSite } = await createWebSiteInternal({
      userId,
      isAdmin,
      plan,
      subdomain,
      customDomain,
      templateId: plan === 'landing' ? 'static' : 'nodejs',
      periodMonths: 1,
      nodeId,
      // @ts-ignore
      userName: user?.name,
      // @ts-ignore
      userEmail: user?.email,
    });

    inv.siteId = webSite.id;
    try { await inv.save(); await applyWebSitePaidInvoice(inv as any); } catch (e: any) { console.warn('[ai] apply invoice warning:', e?.message); }

    // TODO MVP Phase 2: Upload payload.files via SFTP ssh2 to /srv/sftp/wexa_site_xxx/app, chown, pm2 restart
    // Phase 1 (current): возвращаем files[] клиенту, frontend показывает «Скачать архив, залей через SFTP».
    air.websiteId = webSite.id;
    try { await air.save(); } catch {}

    res.json({
      ok: true,
      aiTransactionId: air.id,
      billing: {
        usedOwnKey,
        billedRUB: tx ? cost.userBilledRUB : 0,
        ourCostRUB: tx ? cost.ourCostRUB : 0,
        profitRUB: tx ? cost.profitRUB : 0,
        balanceAfter: tx ? tx.newBalance : null,
      },
      provider,
      model: AI_PRICING[provider].defaultModel,
      usage: { inputTokens: llmRes.inputTokens, outputTokens: llmRes.outputTokens },
      webSite: {
        id: webSite.id,
        plan: (webSite as any).plan,
        subdomain: (webSite as any).subdomain,
        status: (webSite as any).status,
      },
      deployStep: 'phase1_return_files',
      deployNote: 'Phase 1 MVP: скачайте файлы и залейте через SFTP (доступ в ЛК → Мои сайты → SFTP). Phase 2: авто-заливка на ноду.',
      payload,
    });
  } catch (e: any) {
    console.error('[ai/generate/website] error:', e?.message || e);
    res.status(500).json({ message: e?.message || 'AI Server error', aiTransactionId: airId });
  }
});

// --- Admin: stats ---
router.get('/admin/stats', authenticateToken, isAdmin, async (_req: Request, res: Response) => {
  try {
    const since24h = new Date(Date.now() - 24 * 3600 * 1000);
    const total = await AITransaction.findAll({
      attributes: [
        [AITransaction.sequelize!.fn('SUM', AITransaction.sequelize!.col('userBilledRUB')), 'totalBilled'],
        [AITransaction.sequelize!.fn('SUM', AITransaction.sequelize!.col('ourCostRUB')), 'totalCost'],
        [AITransaction.sequelize!.fn('SUM', AITransaction.sequelize!.col('profitRUB')), 'totalProfit'],
        [AITransaction.sequelize!.fn('COUNT', '*'), 'count'],
      ],
      raw: true,
    });
    const last24 = await AITransaction.findAll({
      where: { createdAt: { [Op.gte]: since24h } },
      attributes: [
        [AITransaction.sequelize!.fn('SUM', AITransaction.sequelize!.col('profitRUB')), 'profit24'],
        [AITransaction.sequelize!.fn('COUNT', '*'), 'count24'],
      ],
      raw: true,
    });
    const topUsers = await AITransaction.findAll({
      limit: 10,
      group: ['userId', 'user.id', 'user.name', 'user.email'],
      order: [[AITransaction.sequelize!.fn('SUM', AITransaction.sequelize!.col('profitRUB')), 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      attributes: [
        'userId',
        [AITransaction.sequelize!.fn('SUM', AITransaction.sequelize!.col('profitRUB')), 'userProfit'],
        [AITransaction.sequelize!.fn('COUNT', '*'), 'userCount'],
      ],
    });
    res.json({ total, last24, topUsers });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Server error' });
  }
});

// --- Admin: transaction list ---
router.get('/admin/transactions', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query?.limit || 50)));
    const offset = Math.max(0, Number(req.query?.offset || 0));
    const { count, rows } = await AITransaction.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit, offset,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: WebSite, as: 'webSite', attributes: ['id', 'plan', 'subdomain', 'status'], required: false },
      ],
    });
    res.json({ count, rows });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Server error' });
  }
});

export default router;
