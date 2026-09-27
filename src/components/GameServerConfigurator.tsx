import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Gamepad2, MapPin, Shield, Zap, HardDrive,
  Settings, Users, CheckCircle, Lock, Clock,
  Terminal, Upload, Crown, Sparkles, CreditCard
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

export interface GameServerOrderPayload {
  game: string;
  location: string;
  slots: number;
  ram?: number;
  core?: number;
  periodMonths: number;
  name?: string;
  nodeId?: string;
}

interface GameServerConfiguratorProps {
  compact?: boolean;
  initialGame?: string;
  initialLocation?: string;
  nodes?: PublicNode[];
  showNameField?: boolean;
  isAuthenticated?: boolean;
  orderLoading?: boolean;
  onOrder: (payload: GameServerOrderPayload) => void | Promise<void>;
}

const GameServerConfigurator = ({
  compact = false,
  initialGame,
  initialLocation,
  nodes: nodesProp,
  showNameField = false,
  isAuthenticated = false,
  orderLoading: externalLoading,
  onOrder,
}: GameServerConfiguratorProps) => {
  const [selectedGame, setSelectedGame] = useState(initialGame ?? SUPPORTED_GAMES[0].id);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation ?? LOCATIONS[0].id);
  const [slots, setSlots] = useState(SUPPORTED_GAMES.find(g => g.id === (initialGame ?? SUPPORTED_GAMES[0].id))!.defaultSlots);
  const [periodMonths, setPeriodMonths] = useState(1);
  const [name, setName] = useState('');
  const [internalNodes, setInternalNodes] = useState<PublicNode[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  const nodes = nodesProp ?? internalNodes;
  const orderLoading = externalLoading ?? internalLoading;

  useEffect(() => {
    if (nodesProp !== undefined) return;
    fetch('/api/nodes/public')
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        if (Array.isArray(data) && data.length) setInternalNodes(data);
      })
      .catch(() => {});
  }, [nodesProp]);

  useEffect(() => {
    const game = SUPPORTED_GAMES.find(g => g.id === selectedGame);
    if (game) {
      setSlots(game.defaultSlots);
    }
  }, [selectedGame]);

  const game = SUPPORTED_GAMES.find(g => g.id === selectedGame)!;

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

  const submitOrder = async () => {
    setInternalLoading(true);
    try {
      await onOrder({
        game: selectedGame,
        location: selectedLocation,
        slots,
        ram: 1024,
        core: 1,
        periodMonths,
        name: name.trim() || undefined,
        nodeId: selectedNode?.id,
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
              onClick={() => setSelectedGame(g.id)}
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
              onClick={() => setSelectedLocation(loc.id)}
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
              onClick={() => setPeriodMonths(p)}
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

  const GamesHeroSection = () => (
    <section id="games" className="py-24 bg-gray-50 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Игры</h2>
          <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Поддерживаемые игры</p>
          <p className="mt-4 text-xl text-gray-500">Выберите игру и соберите сервер под ваши задачи.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SUPPORTED_GAMES.map((g, idx) => {
            const Icon = g.icon;
            const selected = selectedGame === g.id;
            return (
              <motion.button
                key={g.id}
                type="button"
                onClick={() => setSelectedGame(g.id)}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
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
              </motion.button>
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
          {LOCATIONS.map((loc, idx) => {
            const selected = selectedLocation === loc.id;
            return (
              <motion.button
                key={loc.id}
                type="button"
                onClick={() => setSelectedLocation(loc.id)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
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
              </motion.button>
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
            <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Соберите свой сервер</p>
            <p className="mt-4 text-xl text-gray-500">Выберите параметры — цена рассчитается автоматически.</p>
          </div>
        )}
        <div className={`max-w-5xl mx-auto ${compact ? '' : 'bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100'}`}>
          <div className="grid lg:grid-cols-5 rounded-3xl overflow-hidden bg-white shadow-2xl border border-gray-100">
            <div className="lg:col-span-3 p-6 md:p-10 space-y-6">
              <CompactGameSelector />
              <CompactLocationSelector />
              <PeriodSelector />
              {showNameField && <NameField />}
              <div className="space-y-6 pt-2">
                <Sliders />
              </div>
            </div>
            <div className="lg:col-span-2">
              <PricePanel />
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  if (compact) {
    return (
      <div className="space-y-5">
        <PeriodSelector />
        {showNameField && <NameField />}
        <div className="grid lg:grid-cols-5 rounded-3xl overflow-hidden bg-white shadow-lg border border-gray-100">
          <div className="lg:col-span-3 p-6 space-y-5">
            <CompactGameSelector />
            <CompactLocationSelector />
            <div className="space-y-5 pt-2">
              <Sliders />
            </div>
          </div>
          <div className="lg:col-span-2">
            <PricePanel />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <GamesHeroSection />
      <LocationsHeroSection />
      <ConfiguratorPanel />
    </>
  );
};

export default GameServerConfigurator;
