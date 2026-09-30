import { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, Gamepad2, MapPin, Shield, Zap, HardDrive,
  Settings, Users, CheckCircle, Lock, Clock,
  Terminal, Upload, Crown, Sparkles, CreditCard, Cpu,
  Globe, Database, FileText, Headphones, Rocket, Award,
  Loader2, CheckCircle2, XCircle, Search,
} from 'lucide-react';

export const SUPPORTED_GAMES = [
  {
    id: 'minecraft',
    name: 'Minecraft',
    icon: Gamepad2,
    color: 'from-green-500 to-emerald-600',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Java & Bedrock. Плагины, моды, миры. Любые сборки.',
    slotPrice: 15,
    defaultSlots: 10,
    maxSlots: 100,
  },
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    icon: Crown,
    color: 'from-orange-500 to-red-600',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: '128-tick серверы, SourceMod, готовые карты и конфиги.',
    slotPrice: 25,
    defaultSlots: 12,
    maxSlots: 64,
  },
  {
    id: 'cs16',
    name: 'Counter-Strike 1.6',
    icon: Sparkles,
    color: 'from-amber-500 to-yellow-600',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'Классика CS 1.6. AMX Mod X, плагины, Deathmatch / Surf / MG.',
    slotPrice: 10,
    defaultSlots: 20,
    maxSlots: 32,
  },
];

export const LOCATIONS = [
  { id: 'msk', name: 'Москва', code: 'MSK', flag: '🇷🇺', ping: '5-15 мс' },
  { id: 'spb', name: 'Санкт-Петербург', code: 'SPB', flag: '🇷🇺', ping: '10-20 мс' },
  { id: 'kaz', name: 'Казань', code: 'KAZ', flag: '🇷🇺', ping: '15-25 мс' },
  { id: 'fra', name: 'Франкфурт', code: 'FRA', flag: '🇩🇪', ping: '40-60 мс' },
  { id: 'ams', name: 'Амстердам', code: 'AMS', flag: '🇳🇱', ping: '45-65 мс' },
  { id: 'hel', name: 'Хельсинки', code: 'HEL', flag: '🇫🇮', ping: '30-50 мс' },
];

export const FEATURES = [
  { icon: Zap, title: 'Мгновенный запуск', desc: 'Сервер готов к игре за 60 секунд после оплаты.', color: 'bg-yellow-500' },
  { icon: Shield, title: 'Защита от DDoS', desc: 'L3/L4 защита до 1 Тбит/с, атаки не страшны.', color: 'bg-red-500' },
  { icon: HardDrive, title: 'NVMe SSD', desc: 'Быстрые диски для миров Minecraft и демок CS.', color: 'bg-blue-500' },
  { icon: Terminal, title: 'Консоль и RCON', desc: 'Полный доступ к консоли и RCON-командам.', color: 'bg-green-500' },
  { icon: Upload, title: 'SFTP доступ', desc: 'Заливайте миры, плагины, моды по SFTP.', color: 'bg-purple-500' },
  { icon: Settings, title: 'Панель управления', desc: 'Удобный ЛК: файлы, настройки, логи, игроки.', color: 'bg-indigo-500' },
  { icon: Clock, title: 'Uptime 99.9%', desc: 'Стабильная работа нод 24/7 с мониторингом.', color: 'bg-teal-500' },
  { icon: Lock, title: 'Бэкапы', desc: 'Автоматические ежедневные бэкапы ваших данных.', color: 'bg-pink-500' },
];

export const STEPS = [
  { icon: Settings, title: '1. Конфигуратор', desc: 'Выберите игру, локацию и количество слотов.' },
  { icon: CreditCard, title: '2. Оплата', desc: 'Оплатите счёт через Platega (карты, СБП).' },
  { icon: Zap, title: '3. Запуск', desc: 'Сервер автоматически разворачивается на ноде.' },
  { icon: Users, title: '4. Играйте', desc: 'Подключайтесь и приглашайте друзей!' },
];

export const PERIOD_DISCOUNTS: Record<number, number> = { 1: 0, 3: 0.05, 6: 0.10, 12: 0.15 };
export const VALID_PERIODS = [1, 3, 6, 12];

export const POPULAR_MINECRAFT_VERSIONS: string[] = [
  'LATEST', 'SNAPSHOT',
  '1.21.4', '1.21.3', '1.21.1', '1.21',
  '1.20.6', '1.20.4', '1.20.1',
  '1.19.4', '1.18.2', '1.17.1', '1.16.5',
];

export const MINECRAFT_CORE_OPTIONS: Array<{ value: string; label: string; hint: string }> = [
  { value: 'paper', label: 'Paper (рекомендуемый)', hint: 'Плагины Paper / Spigot. Лучшая производительность + стабильность.' },
  { value: 'purpur', label: 'Purpur', hint: 'Форк Paper. Дополнительные твики, лучше TPS, 1.21 оптимизации.' },
  { value: 'folia', label: 'Folia', hint: 'Многопоточный Paper. Для больших серверов 50+ игроков (автор PaperMC).' },
  { value: 'spigot', label: 'Spigot', hint: 'Классический Spigot. Поддержка плагинов Spigot API.' },
  { value: 'fabric', label: 'Fabric', hint: 'Моды Fabric. Лёгкий loader, современные моды 1.17+.' },
  { value: 'forge', label: 'Forge', hint: 'Моды Minecraft Forge. Классические модпаки.' },
  { value: 'neoforge', label: 'NeoForge', hint: 'Современный форк Forge 1.20.1+. Новые моды 1.21.' },
  { value: 'mohist', label: 'Mohist', hint: 'Плагины Paper/Bukkit + моды Forge одновременно. Forge + Plugins!' },
  { value: 'vanilla', label: 'Vanilla (чистый)', hint: 'Оригинальный сервер Mojang без плагинов и модов.' },
  { value: 'custom', label: 'Своё ядро (.jar)', hint: 'Укажите ссылку на .jar или загрузите свой файл через SFTP в /data.' },
];

export const CS16_BUILD_OPTIONS: Array<{ value: string; label: string; desc: string }> = [
  { value: 'jives_cstrike_latest', label: 'Steam Latest (build 9xxx, 25th Anniv.)', desc: 'jives/hlds:cstrike — актуальная post-25th Anniversary сборка 9xxx, протокол 48, современный ReHLDS/ReGameDLL.' },
  { value: 'jives_cstrike_legacy', label: 'Steam Legacy (build ~8684)', desc: 'jives/hlds:cstrike-legacy — старая сборка ~8684 ReHLDS/ReGameDLL, совместимость со старыми плагинами AMX.' },
  { value: 'steamcmd_latest', label: 'SteamCMD авто-обновления (чистая)', desc: 'ghcr.io/ich777/steamcmd:cstrike1.6 — чистая сборка из Steam 90, автообновления при старте. ⚠️ Первая установка 2-10 минут.' },
  { value: 'archont94_stable_2021', label: 'Stable 2021 (AMXModX + FastDL)', desc: 'archont94/counter-strike1.6 — стабильная сборка 2021, предустановлены Metamod + AMX Mod X, FastDL 80/tcp внутри образа.' },
  { value: 'hlds_official', label: 'Classic HLDS Official', desc: 'hlds/server:latest — базовый официальный HLDS, без предустановленных плагинов. Для опытных админов.' },
];


export interface PublicNode {
  id: string;
  name: string;
  location: string;
  ip: string;
  supportedGames: string[];
  slotPrices: Record<string, number>;
  slotPrice: number;
  maxSlots: number;
}

const isRoutablePublicIp = (ip: string): boolean => {
  if (!ip) return false;
  const s = ip.trim().toLowerCase();
  if (['127.0.0.1', '0.0.0.0', '::1', '1.1.1.1', '255.255.255.255', 'localhost'].includes(s)) return false;
  if (s.startsWith('127.') || s.startsWith('192.168.') || s.startsWith('10.')) return false;
  if (s.startsWith('172.')) {
    const parts = s.split('.');
    if (parts.length >= 2) {
      const n = Number(parts[1]);
      if (!Number.isNaN(n) && n >= 16 && n <= 31) return false;
    }
  }
  return /^[0-9a-f:.]+$/i.test(s);
};

const inferLocationFromNodeName = (name: string | undefined): string | null => {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes('msk') || n.includes('mosk') || n.includes('моск') || n.includes('msk-')) return 'msk';
  if (n.includes('spb') || n.includes('piter') || n.includes('saint') || n.includes('спб') || n.includes('питер')) return 'spb';
  if (n.includes('kazan') || n.includes('kaz') || n.includes('казан') || n.includes('каз')) return 'kaz';
  if (n.includes('fra') || n.includes('frankfurt') || n.includes('франк')) return 'fra';
  if (n.includes('ams') || n.includes('amsterdam') || n.includes('амстер')) return 'ams';
  if (n.includes('hel') || n.includes('helsinki') || n.includes('хельс')) return 'hel';
  return null;
};

export interface GameServerOrderPayload {
  game: string;
  location: string;
  slots: number;
  ram?: number;
  periodMonths: number;
  name?: string;
  nodeId?: string;
  mcVersion?: string;
  mcCore?: string;
  mcCustomJarUrl?: string;
  mcCustomJarName?: string;
  cs16Build?: string;
}

export interface WebsitePlan {
  id: 'landing' | 'business' | 'premium';
  label: string;
  priceMonthly: number;
  description: string;
  features: string[];
  coreTemplate: 'static' | 'nodejs';
  backupEnabled: boolean;
  included?: string[];
}

export interface WebsiteOrderPayload {
  plan: 'landing' | 'business' | 'premium';
  periodMonths: number;
  domainType?: 'subdomain' | 'custom';
  subdomainName?: string;
  domain?: string;
}

interface GameServerConfiguratorProps {
  compact?: boolean;
  initialGame?: string;
  initialLocation?: string;
  initialConfiguratorTab?: 'game' | 'website';
  configuratorMode?: 'both' | 'game-only' | 'website-only';
  nodes?: PublicNode[];
  showNameField?: boolean;
  isAuthenticated?: boolean;
  orderLoading?: boolean;
  onOrder: (payload: GameServerOrderPayload) => void | Promise<void>;
  onWebsiteOrder?: (payload: WebsiteOrderPayload) => void | Promise<void>;
}

const GameServerConfigurator = ({
  compact = false,
  initialGame,
  initialLocation,
  initialConfiguratorTab = 'game',
  configuratorMode = 'both',
  nodes: nodesProp,
  showNameField = false,
  isAuthenticated = false,
  orderLoading: externalLoading,
  onOrder,
  onWebsiteOrder,
}: GameServerConfiguratorProps) => {
  const forceTab = configuratorMode === 'game-only' ? 'game' : configuratorMode === 'website-only' ? 'website' : null;
  const [selectedGame, setSelectedGame] = useState(initialGame ?? SUPPORTED_GAMES[0].id);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation ?? LOCATIONS[0].id);
  const [slots, setSlots] = useState(SUPPORTED_GAMES.find(g => g.id === (initialGame ?? SUPPORTED_GAMES[0].id))!.defaultSlots);
  const [periodMonths, setPeriodMonths] = useState(1);
  const [name, setName] = useState('');
  const [mcVersion, setMcVersion] = useState('LATEST');
  const [mcCore, setMcCore] = useState('paper');
  const [mcCustomJarUrl, setMcCustomJarUrl] = useState('');
  const [mcCustomJarName, setMcCustomJarName] = useState('');
  const [cs16Build, setCs16Build] = useState('jives_cstrike_latest');
  const [internalNodes, setInternalNodes] = useState<PublicNode[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [configuratorTab, setConfiguratorTab] = useState<'game' | 'website'>(forceTab ?? initialConfiguratorTab);
  const actualTab = forceTab ?? configuratorTab;
  const [selectedWebsitePlan, setSelectedWebsitePlan] = useState<'landing' | 'business' | 'premium'>('business');
  const [websitePlans, setWebsitePlans] = useState<WebsitePlan[]>([]);
  const [websiteDomain, setWebsiteDomain] = useState('');
  const [websiteDomainMode, setWebsiteDomainMode] = useState<'subdomain' | 'custom'>('subdomain');
  const [websiteSubdomainName, setWebsiteSubdomainName] = useState('');
  const websiteSubdomainRef = useRef<HTMLInputElement>(null);
  const [subdomainCheck, setSubdomainCheck] = useState<{ status: 'idle' | 'loading' | 'ok' | 'error'; message?: string; full?: string }>({ status: 'idle' });
  const [subdomainParent, setSubdomainParent] = useState<string>('wexa.su');

  const nodes = nodesProp ?? internalNodes;
  const orderLoading = externalLoading ?? internalLoading;

  const setSelectedGameStable = (next: string) => {
    const x = window.scrollX ?? 0;
    const y = window.scrollY ?? 0;
    const doc = (document.scrollingElement || document.documentElement) as HTMLElement;
    const docX = doc?.scrollLeft ?? 0;
    const docY = doc?.scrollTop ?? 0;
    const keepX = Math.max(x, docX);
    const keepY = Math.max(y, docY);
    setSelectedGame(next);
    queueMicrotask(() => {
      try { window.scrollTo({ left: keepX, top: keepY, behavior: 'instant' as ScrollBehavior }); } catch {}
      requestAnimationFrame(() => { try { window.scrollTo({ left: keepX, top: keepY, behavior: 'instant' as ScrollBehavior }); } catch {} });
    });
  };

  const setSelectedLocationStable = (next: string) => {
    const y = window.scrollY ?? document.documentElement?.scrollTop ?? 0;
    setSelectedLocation(next);
    queueMicrotask(() => { try { window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }); } catch {} });
  };

  const setPeriodMonthsStable = (next: number) => {
    const y = window.scrollY ?? document.documentElement?.scrollTop ?? 0;
    setPeriodMonths(next);
    queueMicrotask(() => { try { window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }); } catch {} });
  };

  const setConfiguratorTabStable = (next: 'game' | 'website') => {
    const y = window.scrollY ?? document.documentElement?.scrollTop ?? 0;
    setConfiguratorTab(next);
    queueMicrotask(() => {
      try { window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }); } catch {}
      requestAnimationFrame(() => { try { window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }); } catch {} });
    });
  };

  const setSelectedWebsitePlanStable = (next: 'landing' | 'business' | 'premium') => {
    const y = window.scrollY ?? document.documentElement?.scrollTop ?? 0;
    setSelectedWebsitePlan(next);
    queueMicrotask(() => {
      try { window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }); } catch {}
      requestAnimationFrame(() => { try { window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }); } catch {} });
    });
  };

  const setWebsiteDomainModeStable = (next: 'subdomain' | 'custom') => {
    const y = window.scrollY ?? document.documentElement?.scrollTop ?? 0;
    setWebsiteDomainMode(next);
    queueMicrotask(() => {
      try { window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }); } catch {}
      requestAnimationFrame(() => { try { window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }); } catch {} });
    });
  };

  const setWebsiteSubdomainNameStable = (_next: string) => {
    // УПРАВЛЯЕМЫЙ НА UREF: НИКАКОГО setState при вводе, чтобы не вызывать re-render и scroll jump
    // Значение хранится в DOM input через ref, читаем только при check/submit
    if (websiteSubdomainRef.current) {
      const el = websiteSubdomainRef.current;
      const sanitized = el.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (sanitized !== el.value) el.value = sanitized;
    }
  };

  let subdomainCheckCancelRef = false;
  const checkSubdomainNow = () => {
    if (websiteDomainMode !== 'subdomain') return;
    const raw = (websiteSubdomainRef.current?.value ?? websiteSubdomainName).trim().toLowerCase();
    if (!raw) { setSubdomainCheck({ status: 'idle' }); return; }
    if (raw.length < 3) { setSubdomainCheck({ status: 'error', message: 'Минимум 3 символа' }); return; }
    if (raw.length > 42) { setSubdomainCheck({ status: 'error', message: 'Максимум 42 символа' }); return; }
    if (!/^[a-z0-9][a-z0-9-]{0,40}[a-z0-9]$/.test(raw)) { setSubdomainCheck({ status: 'error', message: 'Только a-z, 0-9 и дефис (не в начале/конце)' }); return; }
    const y = window.scrollY ?? document.documentElement?.scrollTop ?? 0;
    setWebsiteSubdomainName(raw);
    setSubdomainCheck({ status: 'loading' });
    subdomainCheckCancelRef = false;
    fetch(`/api/sites/check-subdomain?name=${encodeURIComponent(raw)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (subdomainCheckCancelRef) return;
        const keepY = Math.max(y, window.scrollY ?? 0);
        if (!d?.ok) { setSubdomainCheck({ status: 'error', message: 'Ошибка проверки' }); }
        else {
          if (d.parent) setSubdomainParent(d.parent);
          if (d.available) setSubdomainCheck({ status: 'ok', message: `Свободно: ${d.full}`, full: d.full || undefined });
          else setSubdomainCheck({ status: 'error', message: d.reason || 'Занято' });
        }
        queueMicrotask(() => { try { window.scrollTo(0, keepY); } catch {} });
      })
      .catch(() => { if (!subdomainCheckCancelRef) setSubdomainCheck({ status: 'error', message: 'Не удалось проверить' }); });
  };

  const setMcVersionStable = (next: string) => { const y = window.scrollY ?? 0; setMcVersion(next); queueMicrotask(() => { try { window.scrollTo(0, y); } catch {} }); };
  const setMcCoreStable = (next: string) => { const y = window.scrollY ?? 0; setMcCore(next); queueMicrotask(() => { try { window.scrollTo(0, y); } catch {} }); };
  const setCs16BuildStable = (next: string) => { const y = window.scrollY ?? 0; setCs16Build(next); queueMicrotask(() => { try { window.scrollTo(0, y); } catch {} }); };

  useEffect(() => {
    if (nodesProp !== undefined) return;
    fetch('/api/nodes/public')
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        if (Array.isArray(data) && data.length) {
          const normalized: PublicNode[] = data
            .filter((n: any) => isRoutablePublicIp(n?.ip))
            .map((raw: any): PublicNode => {
              const location = (raw?.location && LOCATIONS.some(l => l.id === raw.location))
                ? raw.location
                : inferLocationFromNodeName(raw?.name) || LOCATIONS[0].id;
              return {
                id: String(raw.id || ''),
                name: String(raw.name || 'Node'),
                ip: String(raw.ip || ''),
                location,
                supportedGames: Array.isArray(raw.supportedGames) ? raw.supportedGames : (raw.game ? [raw.game] : ['minecraft']),
                slotPrices: typeof raw.slotPrices === 'object' && raw.slotPrices ? raw.slotPrices : { minecraft: 15, cs2: 25, cs16: 10 },
                slotPrice: typeof raw.slotPrice === 'number' ? raw.slotPrice : 15,
                maxSlots: typeof raw.maxSlots === 'number' ? raw.maxSlots : 100,
              };
            });
          setInternalNodes(normalized);
        }
      })
      .catch(() => {});
  }, [nodesProp]);

  useEffect(() => {
    const game = SUPPORTED_GAMES.find(g => g.id === selectedGame);
    if (game) {
      setSlots(game.defaultSlots);
    }
    if (selectedGame === 'minecraft') {
      if (!mcVersion || !['LATEST', 'SNAPSHOT'].includes(mcVersion) && !/^\d+\.\d+/.test(mcVersion)) {
        setMcVersion('LATEST');
      }
      if (!MINECRAFT_CORE_OPTIONS.some(o => o.value === mcCore)) {
        setMcCore('paper');
      }
      setCs16Build('jives_cstrike_latest');
    } else if (selectedGame === 'cs16') {
      if (!CS16_BUILD_OPTIONS.some(o => o.value === cs16Build)) {
        setCs16Build('jives_cstrike_latest');
      }
      setMcVersion('LATEST');
      setMcCore('paper');
      setMcCustomJarUrl('');
      setMcCustomJarName('');
    } else {
      setMcVersion('LATEST');
      setMcCore('paper');
      setMcCustomJarUrl('');
      setMcCustomJarName('');
      setCs16Build('jives_cstrike_latest');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGame]);

  useEffect(() => {
    fetch('/api/sites/plans')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.plans && Array.isArray(data.plans)) {
          setWebsitePlans(data.plans);
        } else {
          setWebsitePlans([
            { id: 'landing', label: 'Landing', priceMonthly: 149, description: 'Статичный лендинг. HTML/CSS/JS без бэкенда.', features: ['1 сайт HTML/CSS/JS', 'SSL-сертификат', 'SFTP доступ', 'Бэкапы раз в неделю'], coreTemplate: 'static', backupEnabled: false },
            { id: 'business', label: 'Business', priceMonthly: 299, description: 'Node.js + Express/EJS. Сайт с админ-панелью и формой.', features: ['Node.js 20 LTS', 'PM2 автоперезапуск', 'SSL Let\'s Encrypt', 'SFTP доступ', 'Бэкапы 7 дней'], coreTemplate: 'nodejs', backupEnabled: true },
            { id: 'premium', label: 'Premium', priceMonthly: 599, description: 'Максимальные лимиты, поддержка 24/7, домен в подарок.', features: ['Node.js / Static', 'Повышенные лимиты RAM/CPU', 'Поддержка 24/7', 'Домен в подарок', 'Бэкапы каждый день'], coreTemplate: 'nodejs', backupEnabled: true },
          ] as WebsitePlan[]);
        }
      })
      .catch(() => {
        setWebsitePlans([
          { id: 'landing', label: 'Landing', priceMonthly: 149, description: 'Статичный лендинг. HTML/CSS/JS без бэкенда.', features: ['1 сайт HTML/CSS/JS', 'SSL-сертификат', 'SFTP доступ', 'Бэкапы раз в неделю'], coreTemplate: 'static', backupEnabled: false },
          { id: 'business', label: 'Business', priceMonthly: 299, description: 'Node.js + Express/EJS. Сайт с админ-панелью и формой.', features: ['Node.js 20 LTS', 'PM2 автоперезапуск', 'SSL Let\'s Encrypt', 'SFTP доступ', 'Бэкапы 7 дней'], coreTemplate: 'nodejs', backupEnabled: true },
          { id: 'premium', label: 'Premium', priceMonthly: 599, description: 'Максимальные лимиты, поддержка 24/7, домен в подарок.', features: ['Node.js / Static', 'Повышенные лимиты RAM/CPU', 'Поддержка 24/7', 'Домен в подарок', 'Бэкапы каждый день'], coreTemplate: 'nodejs', backupEnabled: true },
        ] as WebsitePlan[]);
      });
  }, []);

  const game = SUPPORTED_GAMES.find(g => g.id === selectedGame)!;
  const websitePlan = websitePlans.find(p => p.id === selectedWebsitePlan) ?? websitePlans[1];

  const slotPrice =
    nodes.find(n => n.supportedGames?.includes(selectedGame) && n.location === selectedLocation)
      ?.slotPrices?.[selectedGame]
    ?? nodes.find(n => n.supportedGames?.includes(selectedGame))?.slotPrices?.[selectedGame]
    ?? nodes.find(n => n.supportedGames?.includes(selectedGame))?.slotPrice
    ?? game.slotPrice;

  const selectedNode = nodes.find(
    n => n.supportedGames?.includes(selectedGame) && n.location === selectedLocation
  ) ?? nodes.find(n => n.supportedGames?.includes(selectedGame));

  const monthlyPrice = Math.ceil(slots * slotPrice);
  const discount = PERIOD_DISCOUNTS[periodMonths] ?? 0;
  const totalPrice = Math.ceil(monthlyPrice * periodMonths * (1 - discount));

  const websiteMonthlyPrice = websitePlan?.priceMonthly ?? 299;
  const websiteTotalPrice = Math.ceil(websiteMonthlyPrice * periodMonths * (1 - discount));

  const submitOrder = async () => {
    setInternalLoading(true);
    try {
      await onOrder({
        game: selectedGame,
        location: selectedLocation,
        slots,
        ram: 1024,
        periodMonths,
        name: name.trim() || undefined,
        nodeId: selectedNode?.id,
        mcVersion: selectedGame === 'minecraft' ? mcVersion : undefined,
        mcCore: selectedGame === 'minecraft' ? mcCore : undefined,
        mcCustomJarUrl: selectedGame === 'minecraft' ? mcCustomJarUrl.trim() || undefined : undefined,
        mcCustomJarName: selectedGame === 'minecraft' ? mcCustomJarName.trim() || undefined : undefined,
        cs16Build: selectedGame === 'cs16' ? cs16Build : undefined,
      });
    } finally {
      setInternalLoading(false);
    }
  };

  const submitWebsiteOrder = async () => {
    if (!onWebsiteOrder) return;
    const finalSubdomainName = websiteDomainMode === 'subdomain'
      ? (websiteSubdomainRef.current?.value ?? websiteSubdomainName).trim().toLowerCase()
      : undefined;
    if (websiteDomainMode === 'subdomain' && subdomainCheck.status !== 'ok') {
      alert('Пожалуйста, сначала нажмите «Проверить доступность» и выберите свободное имя для поддомена');
      return;
    }
    if (websiteDomainMode === 'subdomain' && (!finalSubdomainName || finalSubdomainName.length < 3)) {
      alert('Введите имя поддомена (минимум 3 символа) и проверьте его доступность');
      return;
    }
    setInternalLoading(true);
    try {
      await onWebsiteOrder({
        plan: selectedWebsitePlan,
        periodMonths,
        domainType: websiteDomainMode,
        subdomainName: finalSubdomainName,
        domain: websiteDomainMode === 'custom' ? websiteDomain.trim() || undefined : undefined,
      });
    } finally {
      setInternalLoading(false);
    }
  };

  const periodLabel = (p: number) =>
    p === 1 ? '1 мес' : p === 3 ? '3 мес' : p === 6 ? '6 мес' : '12 мес';

  const discountBadge = (p: number) => {
    const d = PERIOD_DISCOUNTS[p];
    if (!d) return null;
    return (
      <span className="ml-1.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
        -{Math.round(d * 100)}%
      </span>
    );
  };

  const CompactGameSelector = () => (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-4">Игра</label>
      <div className="grid grid-cols-3 gap-3">
        {SUPPORTED_GAMES.map(g => {
          const Icon = g.icon;
          const active = selectedGame === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={(e) => { e.preventDefault(); setSelectedGameStable(g.id); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                active
                  ? 'border-indigo-500 bg-indigo-50 shadow-inner'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon size={24} className={active ? game.textColor : 'text-gray-500'} />
              <span className="text-xs font-semibold text-gray-700">{g.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const CompactLocationSelector = () => (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-4">Локация</label>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {LOCATIONS.map(loc => {
          const active = selectedLocation === loc.id;
          return (
            <button
              key={loc.id}
              type="button"
              onClick={(e) => { e.preventDefault(); setSelectedLocationStable(loc.id); }}
              className={`p-3 rounded-xl border-2 text-center transition-all text-sm font-bold ${
                active
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="text-lg">{loc.flag}</div>
              {loc.code}
            </button>
          );
        })}
      </div>
    </div>
  );

  const PeriodSelector = () => (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-4">Период оплаты</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {VALID_PERIODS.map(p => {
          const active = periodMonths === p;
          return (
            <button
              key={p}
              type="button"
              onClick={(e) => { e.preventDefault(); setPeriodMonthsStable(p); }}
              className={`flex items-center justify-center py-3 px-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                active
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-inner'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {periodLabel(p)}
              {discountBadge(p)}
            </button>
          );
        })}
      </div>
    </div>
  );

  const NameField = () => (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-3">Название сервера (необязательно)</label>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={60}
        placeholder={`${game.name} #1`}
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 outline-none text-gray-900 font-medium"
      />
    </div>
  );

  const Sliders = () => (
    <div>
      <div className="flex justify-between items-baseline mb-4">
        <label className="block text-sm font-bold text-gray-700">Слоты (игроки)</label>
        <span className="text-2xl font-black text-indigo-600">
          {slots} <span className="text-sm font-semibold text-gray-500">сл.</span>
        </span>
      </div>
      <input
        type="range"
        min={2}
        max={game.maxSlots}
        value={slots}
        onChange={e => setSlots(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
        <span>2</span>
        <span>{game.maxSlots}</span>
      </div>
    </div>
  );

  const McVersionSelector = () => {
    if (selectedGame !== 'minecraft') return null;
    const coreHint = MINECRAFT_CORE_OPTIONS.find(o => o.value === mcCore)?.hint ?? '';
    return (
      <div className="space-y-5 bg-white/70 border border-indigo-100 rounded-2xl p-5 mt-2">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-extrabold text-gray-800 tracking-wide">Версия Minecraft и ядро</h4>
          <span className="text-[10px] uppercase tracking-wider text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
            настройки сервера
          </span>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Версия</label>
          <div className="flex gap-2">
            <select
              value={POPULAR_MINECRAFT_VERSIONS.includes(mcVersion) ? mcVersion : '__custom__'}
              onChange={e => {
                const v = e.target.value;
                if (v === '__custom__') return;
                setMcVersionStable(v);
              }}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 outline-none text-sm font-medium bg-white"
            >
              {POPULAR_MINECRAFT_VERSIONS.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
              <option value="__custom__">✎ Ввести вручную…</option>
            </select>
            <input
              type="text"
              value={mcVersion}
              onChange={e => setMcVersionStable(e.target.value)}
              placeholder="например 1.20.1"
              className="w-40 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 outline-none text-sm font-medium font-mono text-indigo-900"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-gray-500 leading-relaxed">
            <span className="font-semibold">LATEST</span> — автоматически последняя стабильная Mojang •&nbsp;
            <span className="font-semibold">SNAPSHOT</span> — снапшоты разработки •&nbsp;
            <span className="font-semibold">1.20.1 / 1.20.4</span> — популярные сборки модов.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Тип ядра</label>
          <select
            value={mcCore}
            onChange={e => setMcCoreStable(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 outline-none text-sm font-medium bg-white"
          >
            {MINECRAFT_CORE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {coreHint && (
            <p className="mt-1.5 text-[11px] text-gray-500 leading-relaxed">{coreHint}</p>
          )}
        </div>

        {mcCore === 'custom' && (
          <div className="space-y-3 p-4 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black">!</span>
              <p className="text-xs font-bold text-indigo-800 leading-snug">
                Для СВОЕГО ядра укажите <span className="underline underline-offset-1">либо</span> прямую ссылку HTTPS на .jar,
                <span className="underline underline-offset-1"> либо</span> имя файла .jar, который вы зальёте через SFTP в корень /data.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-800 mb-1.5">Ссылка на .jar (https://…/server.jar)</label>
              <input
                type="url"
                value={mcCustomJarUrl}
                onChange={e => setMcCustomJarUrl(e.target.value)}
                placeholder="https://example.com/modpacks/mycore-1.20.4.jar"
                className="w-full px-3 py-2.5 rounded-lg border-2 border-indigo-200 focus:border-indigo-500 focus:ring-0 outline-none text-xs font-mono bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-800 mb-1.5">или имя файла в /data (SFTP)</label>
              <input
                type="text"
                value={mcCustomJarName}
                onChange={e => setMcCustomJarName(e.target.value)}
                placeholder="my-awesome-server.jar"
                className="w-full px-3 py-2.5 rounded-lg border-2 border-indigo-200 focus:border-indigo-500 focus:ring-0 outline-none text-xs font-mono bg-white"
              />
              <p className="mt-1 text-[10px] text-indigo-600/80 leading-relaxed">
                Загрузите свой .jar по SFTP в папку сервера (/data), укажите точное имя файла, сервер запустит его.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Cs16BuildSelector = () => {
    if (selectedGame !== 'cs16') return null;
    const opt = CS16_BUILD_OPTIONS.find(o => o.value === cs16Build);
    return (
      <div className="space-y-5 bg-white/70 border border-amber-100 rounded-2xl p-5 mt-2">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-extrabold text-gray-800 tracking-wide">Сборка CS 1.6</h4>
          <span className="text-[10px] uppercase tracking-wider text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
            билд сервера
          </span>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Версия HLDS / ReHLDS</label>
          <select
            value={cs16Build}
            onChange={e => setCs16BuildStable(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-0 outline-none text-sm font-medium bg-white"
          >
            {CS16_BUILD_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {opt && (
            <p className="mt-2 text-[11px] text-gray-600 leading-relaxed bg-amber-50/60 border border-amber-100 rounded-lg px-3 py-2">
              {opt.desc}
            </p>
          )}
          {cs16Build === 'steamcmd_latest' && (
            <div className="mt-2 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500 text-white text-[10px] font-black flex-shrink-0 mt-0.5">!</span>
              <p className="text-xs font-semibold text-yellow-900 leading-snug">
                Первая установка займёт 2–10 минут (скачивание ~1.5 ГБ HLDS через SteamCMD).
                Последующие запуски — мгновенные, обновления проверяются автоматически.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const WebsitePlanCards = () => (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-4">Тариф хостинга сайтов</label>
      <div className="grid md:grid-cols-3 gap-4">
        {websitePlans.map(p => {
          const active = selectedWebsitePlan === p.id;
          const accent = p.id === 'landing'
            ? { border: 'border-sky-500', bg: 'bg-sky-50', text: 'text-sky-700', grad: 'from-sky-500 to-cyan-500' }
            : p.id === 'business'
            ? { border: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', grad: 'from-indigo-500 to-purple-500' }
            : { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', grad: 'from-amber-500 to-orange-500' };
          const Icon = p.id === 'landing' ? FileText : p.id === 'business' ? Rocket : Award;
          return (
            <button
              key={p.id}
              type="button"
              onClick={(e) => { e.preventDefault(); setSelectedWebsitePlanStable(p.id); }}
              className={`text-left p-5 rounded-2xl border-2 transition-all relative bg-white hover:shadow-lg ${
                active ? `${accent.border} ring-4 ${accent.bg}/60 shadow-inner` : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent.grad} text-white flex items-center justify-center mb-4 shadow-md`}>
                <Icon size={22} />
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <h5 className="text-xl font-extrabold text-gray-900">{p.label}</h5>
                {p.id === 'business' && (
                  <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                    ПОПУЛЯРНЫЙ
                  </span>
                )}
              </div>
              <div className={`text-3xl font-black ${accent.text} mb-2`}>
                {p.priceMonthly} <span className="text-sm font-semibold text-gray-500">₽/мес</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{p.description}</p>
              <ul className="space-y-1.5 mb-1">
                {p.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                    <CheckCircle size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {active && (
                <div className={`absolute top-3 right-3 w-7 h-7 rounded-full ${accent.border.replace('border-', 'bg-')} text-white flex items-center justify-center shadow`}>
                  <CheckCircle size={16} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const WebsiteDomainField = () => (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-3">Домен вашего сайта</label>
      <div className="flex items-stretch gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-1 mb-3">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setWebsiteDomainModeStable('subdomain'); }}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${websiteDomainMode === 'subdomain' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500 hover:text-slate-700'}`}
        >
          🎁 Бесплатный поддомен
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setWebsiteDomainModeStable('custom'); }}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${websiteDomainMode === 'custom' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500 hover:text-slate-700'}`}
        >
          🌐 Свой домен
        </button>
      </div>

      {websiteDomainMode === 'subdomain' && (
        <>
          <div className="flex items-stretch gap-2 rounded-2xl border-2 border-slate-200 focus-within:border-indigo-500 bg-white overflow-hidden">
            <input
              ref={websiteSubdomainRef}
              type="text"
              defaultValue={websiteSubdomainName}
              onChange={(e) => setWebsiteSubdomainNameStable(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); checkSubdomainNow(); } }}
              placeholder="например: orlan-taxi, ilves-shop, lk-my-site"
              className="flex-1 px-4 py-3 bg-transparent outline-none text-gray-900 font-medium"
              maxLength={42}
              autoComplete="off"
            />
            <div className="flex items-center shrink-0 px-4 py-3 bg-slate-50 border-l border-slate-200 font-mono text-sm text-slate-600 font-bold select-none">
              .{subdomainParent}
            </div>
            <div className="flex items-center shrink-0 px-3">
              {subdomainCheck.status === 'loading' && (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              )}
              {subdomainCheck.status === 'ok' && (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              )}
              {subdomainCheck.status === 'error' && (
                <XCircle className="h-5 w-5 text-rose-500" />
              )}
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); checkSubdomainNow(); }}
              disabled={subdomainCheck.status === 'loading'}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-70 disabled:cursor-wait text-white px-4 py-2 text-sm font-bold shadow-sm transition-all"
            >
              {subdomainCheck.status === 'loading' ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              {subdomainCheck.status === 'loading' ? 'Проверяем…' : '🔍 Проверить доступность'}
            </button>
            <span className="text-[11px] text-slate-500">или нажмите Enter в поле</span>
          </div>
          <p className={`mt-2.5 text-[12px] font-semibold leading-snug ${
            subdomainCheck.status === 'ok' ? 'text-emerald-600' :
            subdomainCheck.status === 'error' ? 'text-rose-600' :
            subdomainCheck.status === 'loading' ? 'text-indigo-600' : 'text-slate-500'
          }`}>
            {subdomainCheck.status === 'idle' && 'Введите имя от 3 до 42 символов (a-z, 0-9, дефис), затем нажмите «Проверить доступность».'}
            {subdomainCheck.status === 'loading' && 'Проверяем свободность имени…'}
            {subdomainCheck.status === 'ok' && (subdomainCheck.message || `Свободно ✓ ${websiteSubdomainName.toLowerCase()}.${subdomainParent}`)}
            {subdomainCheck.status === 'error' && (subdomainCheck.message || 'Занято. Попробуйте другое имя.')}
          </p>
          <p className="mt-1.5 text-[11px] text-gray-500 leading-relaxed">
            Бесплатно навсегда. SSL-сертификат Let's Encrypt выдаётся автоматически. Ничего регистрировать не нужно.
          </p>
        </>
      )}

      {websiteDomainMode === 'custom' && (
        <>
          <input
            type="text"
            value={websiteDomain}
            onChange={e => setWebsiteDomain(e.target.value)}
            placeholder="например: orlan-taxi.ru или ilves.com"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 outline-none text-gray-900 font-medium"
          />
          <p className="mt-1.5 text-[11px] text-gray-500 leading-relaxed">
            Купите домен у любого регистратора (reg.ru / webnames.ru / nic.ru). Затем в DNS добавьте A-запись <code className="rounded bg-slate-100 px-1.5 py-0.5">@ → 82.146.47.246</code> и подождите 5–60 минут. Привязать домен можно позже в ЛК.
          </p>
        </>
      )}
    </div>
  );


  const PricePanel = () => {
    const IconGame = game.icon;
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white p-6 md:p-8 flex flex-col justify-center rounded-3xl lg:rounded-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_60%)]" />
        <div className="relative z-10 w-full">
          {periodMonths > 1 && discount > 0 ? (
            <>
              <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Итого за {periodMonths} мес</div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl md:text-6xl font-black text-white">{totalPrice}</span>
                <span className="text-xl font-bold text-gray-300">₽</span>
              </div>
              <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-gray-400">{monthlyPrice} ₽ × {periodMonths} мес</span>
                <span className="text-emerald-400 font-bold">× {Math.round((1 - discount) * 100)}%</span>
                <span className="text-emerald-400/80 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  экономия {monthlyPrice * periodMonths - totalPrice} ₽
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">Итого в месяц</div>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-6xl md:text-7xl font-black text-white">{monthlyPrice}</span>
                <span className="text-2xl font-bold text-gray-300">₽ / мес</span>
              </div>
            </>
          )}

          <div className="space-y-2.5 mb-8 text-sm">
            {[
              { k: 'Игра', v: game.name, I: IconGame },
              { k: 'Локация', v: LOCATIONS.find(l => l.id === selectedLocation)?.name ?? '', I: MapPin },
              { k: 'Слоты', v: `${slots} шт.`, I: Users },
              { k: 'Период', v: periodLabel(periodMonths), I: Clock },
              ...(selectedGame === 'minecraft' ? [
                { k: 'Версия', v: mcVersion || 'LATEST', I: Sparkles },
                { k: 'Ядро', v: (MINECRAFT_CORE_OPTIONS.find(o => o.value === mcCore)?.label || mcCore || 'Paper'), I: Cpu },
              ] : []),
              ...(selectedGame === 'cs16' ? [
                { k: 'Сборка', v: (CS16_BUILD_OPTIONS.find(o => o.value === cs16Build)?.label || cs16Build || 'Steam Latest'), I: Sparkles },
              ] : []),
            ].map((row, i) => {
              const Ic = row.I as any;
              return (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/10">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Ic size={14} />
                    {row.k}
                  </div>
                  <div className="font-semibold text-white">{row.v}</div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={submitOrder}
            disabled={orderLoading}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 font-bold text-lg shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:shadow-[0_0_50px_rgba(168,85,247,0.7)] transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {orderLoading ? (
              'Создаю...'
            ) : isAuthenticated ? (
              <>Заказать <ArrowRight size={18} className="inline ml-2" /></>
            ) : (
              <>Войти и заказать <ArrowRight size={18} className="inline ml-2" /></>
            )}
          </button>
          <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
            Оплата картами / СБП через Platega • Счёт создаётся автоматически
          </p>
        </div>
      </div>
    );
  };

  const WebsitePricePanel = () => {
    const p = websitePlan;
    const accent = p?.id === 'landing'
      ? { from: 'from-sky-500', to: 'to-cyan-500', shadow: 'rgba(14,165,233,0.5)', shadowHover: 'rgba(6,182,212,0.7)' }
      : p?.id === 'business'
      ? { from: 'from-indigo-500', to: 'to-purple-500', shadow: 'rgba(99,102,241,0.5)', shadowHover: 'rgba(168,85,247,0.7)' }
      : { from: 'from-amber-500', to: 'to-orange-500', shadow: 'rgba(245,158,11,0.5)', shadowHover: 'rgba(249,115,22,0.7)' };
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white p-6 md:p-8 flex flex-col justify-center rounded-3xl lg:rounded-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_60%)]" />
        <div className="relative z-10 w-full">
          {periodMonths > 1 && discount > 0 ? (
            <>
              <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Итого за {periodMonths} мес</div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl md:text-6xl font-black text-white">{websiteTotalPrice}</span>
                <span className="text-xl font-bold text-gray-300">₽</span>
              </div>
              <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-gray-400">{websiteMonthlyPrice} ₽ × {periodMonths} мес</span>
                <span className="text-emerald-400 font-bold">× {Math.round((1 - discount) * 100)}%</span>
                <span className="text-emerald-400/80 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  экономия {websiteMonthlyPrice * periodMonths - websiteTotalPrice} ₽
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">Итого в месяц</div>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-6xl md:text-7xl font-black text-white">{websiteMonthlyPrice}</span>
                <span className="text-2xl font-bold text-gray-300">₽ / мес</span>
              </div>
            </>
          )}

          <div className="space-y-2.5 mb-8 text-sm">
            {[
              { k: 'Тариф', v: p?.label ?? 'Business', I: Globe },
              { k: 'Движок', v: p?.coreTemplate === 'nodejs' ? 'Node.js + Express' : 'Static HTML', I: Database },
              { k: 'Бэкапы', v: p?.backupEnabled ? '7 дней ротация' : 'Раз в неделю', I: Lock },
              { k: 'Период', v: periodLabel(periodMonths), I: Clock },
              { k: 'Поддержка', v: p?.id === 'premium' ? '24/7 приоритет' : 'в рабочее время', I: Headphones },
            ].map((row, i) => {
              const Ic = row.I as any;
              return (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/10">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Ic size={14} />
                    {row.k}
                  </div>
                  <div className="font-semibold text-white">{row.v}</div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={submitWebsiteOrder}
            disabled={orderLoading || !onWebsiteOrder}
            className={`w-full py-5 rounded-2xl bg-gradient-to-r ${accent.from} ${accent.to} hover:brightness-110 font-bold text-lg shadow-[0_0_30px_${accent.shadow}] hover:shadow-[0_0_50px_${accent.shadowHover}] transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {orderLoading ? (
              'Создаю сайт...'
            ) : isAuthenticated ? (
              <>Заказать сайт <ArrowRight size={18} className="inline ml-2" /></>
            ) : (
              <>Войти и заказать <ArrowRight size={18} className="inline ml-2" /></>
            )}
          </button>
          <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
            Оплата с внутреннего баланса • Пополнение — карты / СБП через Platega
          </p>
        </div>
      </div>
    );
  };

  const GamesHeroSection = () => (
    <section id="games" className="py-24 bg-gray-50 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Игры</h2>
          <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Поддерживаемые игры</p>
          <p className="mt-4 text-xl text-gray-500">Выберите игру и соберите сервер под ваши задачи.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SUPPORTED_GAMES.map((g) => {
            const Icon = g.icon;
            const selected = selectedGame === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGame(g.id)}
               
               
               
               
                className={`group text-left p-8 rounded-3xl transition-all border-2 relative bg-white shadow-lg hover:shadow-2xl ${
                  selected ? 'border-indigo-500 ring-4 ring-indigo-100' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${g.color} text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon size={30} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{g.name}</h3>
                <p className="text-gray-500 mb-4 leading-relaxed">{g.description}</p>
                <div className={`text-sm font-bold ${g.textColor}`}>от {g.slotPrice} ₽ / слот</div>
                {selected && (
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                    <CheckCircle size={20} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );

  const LocationsHeroSection = () => (
    <section id="locations" className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Локации</h2>
          <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">География серверов</p>
          <p className="mt-4 text-xl text-gray-500">
            Ноды в России и Европе — выберите ближайшую точку для минимального пинга.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {LOCATIONS.map((loc) => {
            const selected = selectedLocation === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => setSelectedLocation(loc.id)}
               
               
               
               
                className={`p-6 rounded-2xl text-center transition-all border-2 ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                    : 'border-gray-100 bg-gray-50 hover:bg-white hover:shadow-lg hover:border-gray-200'
                }`}
              >
                <div className="text-4xl mb-3">{loc.flag}</div>
                <div className="font-bold text-gray-900 text-lg mb-1">{loc.code}</div>
                <div className="text-sm text-gray-600 mb-2">{loc.name}</div>
                <div className="text-xs font-semibold text-green-600 bg-green-50 rounded-full px-2 py-1 inline-block">
                  {loc.ping}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );

  const ConfiguratorPanel = () => (
    <section id="pricing" className="py-24 bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {!compact && (
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Конфигуратор</h2>
            <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Соберите сервер или сайт</p>
            <p className="mt-4 text-xl text-gray-500">Выберите услугу и параметры — цена рассчитается автоматически.</p>
          </div>
        )}
        <div className={`max-w-5xl mx-auto ${compact ? '' : 'bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100'}`}>
          <div className="grid lg:grid-cols-5 rounded-3xl overflow-hidden bg-white shadow-2xl border border-gray-100">
            <div className="lg:col-span-3 p-6 md:p-10 space-y-6">
              {configuratorMode === 'both' && (
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setConfiguratorTabStable('game'); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                      actualTab === 'game'
                        ? 'bg-white shadow text-indigo-700 border border-indigo-100'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Gamepad2 size={18} />
                    Игровые серверы
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setConfiguratorTabStable('website'); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                      actualTab === 'website'
                        ? 'bg-white shadow text-indigo-700 border border-indigo-100'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Globe size={18} />
                    Сайты под заказ
                  </button>
                </div>
              )}

              <div
                aria-hidden={actualTab !== 'game'}
                style={{display: actualTab === 'game' ? undefined : 'none'}}
                className="flex flex-col gap-6"
              >
                <CompactGameSelector />
                <CompactLocationSelector />
                <PeriodSelector />
                {showNameField && <NameField />}
                <div className="flex flex-col gap-6 pt-2">
                  <Sliders />
                  <McVersionSelector />
                  <Cs16BuildSelector />
                </div>
              </div>
              <div
                aria-hidden={actualTab !== 'website'}
                style={{display: actualTab === 'website' ? undefined : 'none'}}
                className="flex flex-col gap-6"
              >
                <WebsitePlanCards />
                <PeriodSelector />
                <WebsiteDomainField />
                <div className="flex items-start gap-3 p-4 bg-sky-50 border border-sky-200 rounded-2xl">
                  <Rocket size={20} className="text-sky-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-sky-800 mb-1">Быстрый старт</div>
                    <p className="text-xs text-sky-700/90 leading-relaxed">
                      После оплаты сайт развернётся за ~2 минуты: <b>Business</b> — шаблон как Ordlan Такси (Express + EJS + админка), <b>Landing</b> — чистый HTML.
                      Загружайте свои файлы через SFTP или файловый менеджер в ЛК.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div
                aria-hidden={actualTab !== 'game'}
                style={{display: actualTab === 'game' ? undefined : 'none'}}
              >
                <PricePanel />
              </div>
              <div
                aria-hidden={actualTab !== 'website'}
                style={{display: actualTab === 'website' ? undefined : 'none'}}
              >
                <WebsitePricePanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <>
      {!compact && (
        <>
          <GamesHeroSection />
          <LocationsHeroSection />
        </>
      )}
      <ConfiguratorPanel />
    </>
  );
};

export default GameServerConfigurator;
