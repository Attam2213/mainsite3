export type WebPlanId = 'landing' | 'business' | 'premium';
export type WebPlan = {
  id: WebPlanId;
  label: string;
  priceMonthly: number;
  description: string;
  features: string[];
  coreTemplate: 'static' | 'nodejs';
  sftpEnabled: boolean;
  backupEnabled: boolean;
  sslIncluded: boolean;
};

export const PERIOD_DISCOUNTS: Record<number, number> = {
  1: 0,
  3: 0.05,
  6: 0.10,
  12: 0.15,
};

export const WEB_PLANS: Record<WebPlanId, WebPlan> = {
  landing: {
    id: 'landing',
    label: 'Лендинг',
    priceMonthly: 399,
    description: 'Статический сайт-лендинг / визитка без бэкенда. HTML/CSS/JS форма обратной связи через JS.',
    features: [
      '~1 000 посещений/сутки',
      '5 000 файлов / 2 ГБ диска',
      'SFTP доступ',
      'SSL Let\'s Encrypt бесплатно',
      'Резервные копии 7 дней',
      'Поддержка Email/Telegram',
    ],
    coreTemplate: 'static',
    sftpEnabled: true,
    backupEnabled: true,
    sslIncluded: true,
  },
  business: {
    id: 'business',
    label: 'Бизнес',
    priceMonthly: 799,
    description: 'Node.js Express + EJS. Встроенная админ-панель и динамические страницы.',
    features: [
      '~5 000 посещений/сутки',
      '10 000 файлов / 5 ГБ диска',
      'SFTP + файловый менеджер',
      'Node.js 20 LTS PM2 auto restart',
      'SQLite / JSON база данных',
      'SSL Let\'s Encrypt бесплатно',
      'Резервные копии 7 дней',
      'Приоритетная поддержка',
    ],
    coreTemplate: 'nodejs',
    sftpEnabled: true,
    backupEnabled: true,
    sslIncluded: true,
  },
  premium: {
    id: 'premium',
    label: 'Премиум',
    priceMonthly: 1299,
    description: 'Максимальные лимиты, Redis + SQLite + бесплатная инструкция домена в подарок (админ покупает по запросу).',
    features: [
      '~20 000 посещений/сутки',
      '50 000 файлов / 20 ГБ диска',
      'SFTP + файловый менеджер',
      'Node.js 20 LTS + Redis cache',
      'SQLite + JSON БД',
      'Авто-SSL + авто-продление домена',
      'Резервные копии 14 дней',
      'Персональный менеджер Telegram',
      'Бесплатный домен .ru/.рф (по запросу админу)',
    ],
    coreTemplate: 'nodejs',
    sftpEnabled: true,
    backupEnabled: true,
    sslIncluded: true,
  },
};

export const WEB_PLAN_LIST: WebPlan[] = Object.values(WEB_PLANS);

export const WEB_PLAN_IDS: WebPlanId[] = WEB_PLAN_LIST.map(p => p.id);

export const validateWebsitePlan = (plan: unknown): WebPlanId => {
  if (typeof plan !== 'string' || !(WEB_PLANS as Record<string, unknown>)[plan]) {
    const err = new Error(`Invalid website plan: '${plan ?? '(empty)'}. Allowed: ${WEB_PLAN_IDS.join(', ')}`);
    (err as any).statusCode = 400;
    throw err;
  }
  return plan as WebPlanId;
};

export const validateWebsitePeriod = (period: unknown): number => {
  const p = Number(period);
  if (!Number.isInteger(p) || !(p in PERIOD_DISCOUNTS)) {
    const err = new Error(`Invalid website period: '${period ?? '(empty)'}. Allowed periods: ${Object.keys(PERIOD_DISCOUNTS).join(', ')} months`);
    (err as any).statusCode = 400;
    throw err;
  }
  return p;
};

export type WebsitePriceBreakdown = {
  planId: WebPlanId;
  planLabel: string;
  priceMonthly: number;
  periodMonths: number;
  discountPct: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  perMonthEffective: number;
};

export const calculateWebsitePrice = (
  planIdRaw: string,
  periodMonthsRaw: number | string,
  customMonthlyOverride?: number | null
): WebsitePriceBreakdown => {
  const planId = validateWebsitePlan(planIdRaw);
  const period = validateWebsitePeriod(periodMonthsRaw);
  const plan = WEB_PLANS[planId];
  const monthly = customMonthlyOverride && Number.isFinite(Number(customMonthlyOverride)) && Number(customMonthlyOverride) > 0
    ? Number(customMonthlyOverride)
    : plan.priceMonthly;

  const discountPct = PERIOD_DISCOUNTS[period] ?? 0;
  const subtotal = monthly * period;
  const discountAmount = Math.ceil(subtotal * discountPct);
  const total = Math.max(1, subtotal - discountAmount);
  const perMonthEffective = Math.ceil(total / period);

  return {
    planId,
    planLabel: plan.label,
    priceMonthly: monthly,
    periodMonths: period,
    discountPct,
    subtotal,
    discountAmount,
    total,
    perMonthEffective,
  };
};

export const getPaidUntilDate = (periodMonths: number, from?: Date): string => {
  const d = from ? new Date(from) : new Date();
  d.setDate(d.getDate() + 1);
  d.setMonth(d.getMonth() + Number(periodMonths));
  return d.toISOString().slice(0, 10);
};
