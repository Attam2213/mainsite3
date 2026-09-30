﻿﻿﻿﻿import Layout from '../components/Layout';
import SEO from '../components/SEO';
import GameServerConfigurator, {
  FEATURES, STEPS,
  type GameServerOrderPayload,
  type WebsiteOrderPayload,
} from '../components/GameServerConfigurator';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import {
  ArrowRight, Gamepad2, Zap, ChevronDown,
  Shield, HardDrive, Upload, Check, Star, Globe,
  Sparkles, Rocket, ShieldCheck, Clock, Award,
  ChevronUp, Headphones, Cpu, Network, MapPin, Mail,
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const handleOrder = async (payload: GameServerOrderPayload) => {
    if (isAuthenticated) {
      try {
        const res = await fetch('/api/game-servers/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          navigate('/dashboard?tab=game_servers');
          return;
        }
      } catch {
        // fallthrough: save intent
      }
    }
    localStorage.setItem('wexa_order_intent', JSON.stringify(payload));
    navigate('/login');
  };

  const handleWebsiteOrder = async (payload: WebsiteOrderPayload) => {
    const intent = { type: 'website', ...payload };
    if (isAuthenticated) {
      try {
        const res = await fetch('/api/sites/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          navigate('/dashboard?tab=websites');
          return;
        }
      } catch {
          // fallthrough
        }
    }
    localStorage.setItem('wexa_order_intent', JSON.stringify(intent));
    navigate('/login');
  };

  return (
    <Layout>
      <SEO
        title="Аренда игровых серверов Minecraft, CS2, CS 1.6 + Сайты — Wexa.su"
        description="Хостинг игровых серверов Wexa.su. Minecraft, CS2, CS 1.6. Быстрые NVMe ноды, защита от DDoS, SFTP, панель управления. Мгновенный запуск за 60 секунд. Сайты под заказ — Landing, Node.js."
      />
      <div className="bg-white overflow-hidden font-sans">

        {/* HERO */}
        <section id="hero" className="relative min-h-screen flex items-center justify-center pt-24 pb-32 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white">
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full opacity-20">
              <div className="w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(99,102,241,0.35),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.28),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.2),transparent_50%)]" />
            </div>
            <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-indigo-400 animate-pulse opacity-60" />
            <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse opacity-60" style={{ animationDelay: '0.7s' }} />
            <div className="absolute bottom-1/3 left-1/3 w-1 h-1 rounded-full bg-pink-400 animate-pulse opacity-60" style={{ animationDelay: '1.4s' }} />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="max-w-6xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm mb-8">
                <Sparkles size={16} className="text-yellow-400" />
                <span className="text-sm font-medium text-gray-200">НОВИНКА&nbsp;•&nbsp;Шаблон «Орлан Такси» — готовый сайт за 1 минуту</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-8 leading-[1.05]">
                Игровые серверы и&nbsp;сайты <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  с&nbsp;нулевым пингом
                </span>
              </h1>

              <p className="mt-6 text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto font-light">
                Аренда серверов Minecraft, CS2 и&nbsp;CS&nbsp;1.6&nbsp;— NVMe SSD, защита от&nbsp;DDoS 1&nbsp;Тбит/с, SFTP-доступ и&nbsp;удобная панель управления. <span className="text-white font-semibold">Сайты под заказ</span>: статический Landing или Node.js Business/Premium.
              </p>

              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                <a
                  href="#pricing"
                  className="group w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-[0_0_40px_rgba(99,102,241,0.45)] hover:shadow-[0_0_60px_rgba(168,85,247,0.65)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  Перейти к конфигуратору
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#games"
                  className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 text-white font-bold text-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  <Gamepad2 size={20} />
                  Поддерживаемые игры
                </a>
                <a
                  href="#websites"
                  className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 text-white font-bold text-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  <Globe size={20} />
                  Создать сайт
                </a>
              </div>

              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {[
                  { num: '15 ₽', label: 'от / слот' },
                  { num: '6', label: 'локаций' },
                  { num: '99.99%', label: 'Uptime SLA' },
                  { num: '60 сек', label: 'до запуска' },
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/10 transition-all">
                    <div className="text-3xl md:text-4xl font-black text-white mb-1.5">{s.num}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-16 flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto">
                {[
                  { Icon: Shield, label: 'DDoS Protected' },
                  { Icon: HardDrive, label: 'NVMe SSD' },
                  { Icon: Zap, label: 'Instant Setup' },
                  { Icon: Upload, label: 'SFTP доступ' },
                  { Icon: Headphones, label: 'Поддержка 24/7' },
                  { Icon: ShieldCheck, label: 'SLA 99.99%' },
                ].map(({ Icon, label }, i) => (
                  <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                    <Icon size={14} className="text-indigo-300" />
                    <span className="text-xs font-medium text-gray-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <a
            href="#services"
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronDown size={32} />
          </a>
        </section>

        {/* TRUSTED BY BAR */}
        <section className="py-10 bg-slate-50 border-y border-slate-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-8">
              Технологии и&nbsp;платёжные системы
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 items-center justify-items-center gap-6 max-w-6xl mx-auto opacity-80">
              {[
                { name: 'Minecraft', cls: 'bg-green-500' },
                { name: 'CS2', cls: 'bg-orange-500' },
                { name: 'Node.js', cls: 'bg-emerald-600' },
                { name: 'Nginx', cls: 'bg-teal-600' },
                { name: 'Visa/Mastercard', cls: 'bg-blue-600' },
                { name: 'СБП', cls: 'bg-indigo-600' },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <div className={`w-10 h-10 rounded-xl ${t.cls} text-white flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform`}>
                    {t.name[0]}
                  </div>
                  <span className="hidden md:block text-sm font-semibold text-slate-600">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES 2-UP CARDS */}
        <section id="services" className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Наши услуги</h2>
              <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Всё, что нужно вашему проекту</p>
              <p className="mt-4 text-xl text-gray-500">
                Две основные услуги — игровые серверы и&nbsp;сайты под заказ. Всё в&nbsp;одном личном кабинете, один баланс и&nbsp;единая поддержка.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="relative group rounded-[2rem] p-8 md:p-10 border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-white hover:border-indigo-300 hover:shadow-2xl transition-all overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <Gamepad2 size={30} />
                    </div>
                    <div>
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold mb-1">Популярно</div>
                      <h3 className="text-2xl md:text-3xl font-black text-gray-900">Игровые серверы</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                    Аренда выделенных слотов для Minecraft, Counter-Strike&nbsp;2 и&nbsp;Counter-Strike&nbsp;1.6. Настройка ядра, плагинов и&nbsp;модов в&nbsp;два клика.
                  </p>
                  <ul className="flex flex-col gap-3 mb-8">
                    {[
                      'Minecraft Java & Bedrock (Paper/Purpur/Folia/Fabric/Forge/NeoForge/Mohist)',
                      'CS2 128-tick / CS 1.6 ReHLDS + AMX Mod X',
                      'Защита L3/L4 до 1 Тбит/с, автоматические бэкапы',
                    ].map((t, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 mt-0.5"><Check size={14} /></div>
                        <span className="text-gray-700 leading-relaxed">{t}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-sm text-gray-500 font-semibold">Цены от</div>
                      <div className="text-4xl font-black text-gray-900">15 ₽<span className="text-lg font-semibold text-gray-500">/ слот</span></div>
                    </div>
                    <a href="#pricing" className="group/btn inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:-translate-y-0.5 hover:shadow-xl transition-all">
                      Настроить сервер <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>

              <div id="websites" className="relative group rounded-[2rem] p-8 md:p-10 border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white hover:border-purple-300 hover:shadow-2xl transition-all overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Globe size={30} />
                    </div>
                    <div>
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mb-1">NEW 🔥</div>
                      <h3 className="text-2xl md:text-3xl font-black text-gray-900">Сайты под заказ</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                    Статический Landing / Визитка или Node.js Business/Premium с&nbsp;админ-панелью. Бесплатный поддомен <span className="font-mono font-bold text-purple-700">*.wexa.su</span>, SSL и&nbsp;SFTP-доступ.
                  </p>
                  <ul className="flex flex-col gap-3 mb-8">
                    {[
                      'Шаблон «Орлан Такси» — готовый сайт за 1 минуту',
                      'Старт от 149 ₽/мес · Node.js от 499 ₽/мес · Авто-бэкапы',
                      'Свой домен + Let\'s Encrypt SSL · Nginx + PHP-FPM / Node.js 22',
                    ].map((t, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0 mt-0.5"><Check size={14} /></div>
                        <span className="text-gray-700 leading-relaxed">{t}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-sm text-gray-500 font-semibold">Цены от</div>
                      <div className="text-4xl font-black text-gray-900">149 ₽<span className="text-lg font-semibold text-gray-500">/ мес</span></div>
                    </div>
                    <a href="#pricing" className="group/btn inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:-translate-y-0.5 hover:shadow-xl transition-all">
                      Создать сайт <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONFIGURATOR ANCHOR */}
        <div id="pricing" />
        <GameServerConfigurator
          compact={false}
          isAuthenticated={isAuthenticated}
          onOrder={handleOrder}
          onWebsiteOrder={handleWebsiteOrder}
        />

        {/* GAME PLANS SHOWCASE 3 CARDS */}
        <section id="games" className="py-24 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Тарифы игровых серверов</h2>
              <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Выберите игру</p>
              <p className="mt-4 text-xl text-gray-500">
                Цена за&nbsp;слот умножается на&nbsp;количество слотов. Скидки 3&nbsp;мес&nbsp;−5%, 6&nbsp;мес&nbsp;−10%, 12&nbsp;мес&nbsp;−15%.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  name: 'Minecraft',
                  price: '15',
                  desc: 'Java & Bedrock. Плагины, моды, миры. Любые сборки.',
                  cores: ['Paper', 'Purpur', 'Folia', 'Fabric', 'Forge', 'NeoForge', 'Mohist', 'Vanilla'],
                  highlights: ['Авто-инсталл 10+ ядер', '150+ предустановленных плагинов', 'Миры до 20 ГБ на NVMe'],
                  color: 'from-emerald-500 to-green-600',
                  badge: 'bg-green-500',
                  Icon: Gamepad2,
                },
                {
                  name: 'Counter-Strike 2',
                  price: '25',
                  desc: '128-tick серверы. SourceMod, готовые карты и конфиги.',
                  cores: ['CS2 128-tick', 'SourceMod', 'MetaMod', 'Custom Workshop'],
                  highlights: ['Tickrate 128 (Competitive)', '500+ карт Workshop', 'Полный доступ rcon + FTP'],
                  color: 'from-orange-500 to-red-600',
                  badge: 'bg-orange-500',
                  Icon: Cpu,
                  popular: true,
                },
                {
                  name: 'Counter-Strike 1.6',
                  price: '10',
                  desc: 'Классика CS 1.6. AMX Mod X, плагины, Deathmatch / Surf / MG.',
                  cores: ['ReHLDS Latest', 'AMXModX 1.9+', 'ReGameDLL', 'FastDL'],
                  highlights: ['25th Anniversary build 9xxx', 'Pre-installed AMX + 200+ плагинов', 'FastDL 80/tcp авто'],
                  color: 'from-amber-500 to-yellow-600',
                  badge: 'bg-amber-500',
                  Icon: Network,
                },
              ].map((game, idx) => {
                const Icon = game.Icon;
                return (
                  <div key={idx} className={`relative rounded-[2rem] p-8 border-2 bg-white hover:shadow-2xl transition-all ${game.popular ? 'border-indigo-400 scale-105 shadow-2xl' : 'border-gray-100 hover:border-gray-200'}`}>
                    {game.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black shadow-lg uppercase tracking-wider">
                        Хит продаж
                      </div>
                    )}
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${game.color} text-white flex items-center justify-center shadow-2xl`}>
                      <Icon size={38} />
                    </div>
                    <div className="text-center mb-2">
                      <h3 className="text-2xl md:text-3xl font-black text-gray-900">{game.name}</h3>
                    </div>
                    <div className="text-center mb-6">
                      <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600">{game.price} ₽</div>
                      <div className="text-sm text-gray-500 font-semibold mt-1">за 1 слот в месяц</div>
                    </div>
                    <p className="text-center text-gray-600 mb-6">{game.desc}</p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
                      {game.cores.map((c, i) => (
                        <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{c}</span>
                      ))}
                    </div>
                    <ul className="flex flex-col gap-2.5 mb-8">
                      {game.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className={`w-5 h-5 rounded-full ${game.badge} text-white flex items-center justify-center shrink-0 mt-0.5`}><Check size={12} /></div>
                          <span className="text-gray-700 text-sm leading-relaxed">{h}</span>
                        </li>
                      ))}
                    </ul>
                    <a href="#pricing" className="block w-full text-center px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:-translate-y-0.5 hover:shadow-xl transition-all">
                      Выбрать {game.name.split(' ')[0]}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Преимущества</h2>
              <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Почему Wexa.su?</p>
              <p className="mt-4 text-xl text-gray-500">
                8&nbsp;причин выбрать нас. Всё, что нужно для стабильного игрового сервера и&nbsp;сайта, в&nbsp;одном месте.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((f, idx) => {
                const Icon = f.icon;
                return (
                  <div
                    key={idx}
                    className="group bg-gray-50 hover:bg-white rounded-3xl p-7 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all"
                  >
                    <div className={`w-14 h-14 rounded-2xl ${f.color} text-white flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon size={26} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Как это работает</h2>
              <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">4 шага до игры или запуска сайта</p>
              <p className="mt-4 text-xl text-gray-500">
                От выбора конфигурации до первого подключения — меньше 2&nbsp;минут.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative max-w-6xl mx-auto">
              <div className="hidden lg:block absolute top-14 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 -z-0" />
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="relative bg-white rounded-3xl p-7 border border-gray-100 hover:shadow-xl transition-all">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg mb-5 border-4 border-gray-50 relative z-10 group-hover:scale-105 transition-transform">
                      <Icon size={26} />
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border-2 border-indigo-500 text-indigo-600 font-black text-xs flex items-center justify-center shadow-md">
                        {idx + 1}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 text-center mb-2.5">{step.title}</h3>
                    <p className="text-gray-500 text-center text-sm leading-relaxed">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* QUICK PRICING TABLES */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Цены на&nbsp;слоты и&nbsp;тарифы</h2>
              <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Сколько будет стоить ваш проект?</p>
              <p className="mt-4 text-xl text-gray-500">
                Ориентировочная стоимость без скидок за&nbsp;период. За&nbsp;12&nbsp;месяцев&nbsp;— −15% скидка.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="rounded-[2rem] overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-8 py-6">
                  <div className="flex items-center gap-3">
                    <Gamepad2 size={26} />
                    <h3 className="text-2xl font-black">Игровые серверы</h3>
                  </div>
                  <p className="text-indigo-100 mt-1.5 text-sm">Цены в&nbsp;₽ за&nbsp;1&nbsp;месяц, без учёта скидок за&nbsp;длительный период.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-6 py-4 font-bold text-gray-700">Слотов</th>
                        <th className="text-right px-6 py-4 font-bold text-green-600">Minecraft</th>
                        <th className="text-right px-6 py-4 font-bold text-orange-600">CS2</th>
                        <th className="text-right px-6 py-4 font-bold text-amber-600">CS 1.6</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        [10, 150, 250, 100],
                        [20, 300, 500, 200],
                        [32, 480, 800, 320],
                        [50, 750, 1250, 500],
                        [64, 960, 1600, 640],
                        [100, 1500, 2500, 1000],
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="px-6 py-3.5 font-bold text-gray-900">{row[0]}</td>
                          <td className="px-6 py-3.5 text-right font-bold text-gray-900">{row[1]} ₽</td>
                          <td className="px-6 py-3.5 text-right font-bold text-gray-900">{row[2]} ₽</td>
                          <td className="px-6 py-3.5 text-right font-bold text-gray-900">{row[3]} ₽</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-200">
                  <a href="#pricing" className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:-translate-y-0.5 hover:shadow-xl transition-all">
                    Точный расчёт в&nbsp;конфигураторе <ArrowRight size={18} />
                  </a>
                </div>
              </div>

              <div className="rounded-[2rem] overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-br from-purple-600 to-pink-700 text-white px-8 py-6">
                  <div className="flex items-center gap-3">
                    <Globe size={26} />
                    <h3 className="text-2xl font-black">Сайты и&nbsp;хостинг</h3>
                  </div>
                  <p className="text-purple-100 mt-1.5 text-sm">Shared hosting с&nbsp;Nginx, PHP-FPM и&nbsp;Node.js 22.</p>
                </div>
                <div className="flex flex-col divide-y divide-gray-100">
                  {[
                    { name: 'Лендинг / Визитка', price: '149 ₽', period: '/ мес', badge: 'Старт', desc: 'Статический сайт HTML/CSS/JS. Форма обратной связи через API. ~1 000 посещений/сутки.', icon: '🚀', features: ['5 000 файлов', '2 ГБ NVMe', 'SFTP + *.wexa.su', 'SSL бесплатно'] },
                    { name: 'Node.js Business', price: '499 ₽', period: '/ мес', badge: 'Популярно', desc: 'Node.js 22 + npm + PM2. Админ-панель. База SQLite/PostgreSQL. ~5 000 посещений/сутки.', icon: '⚡', features: ['1 vCPU shared', '1 GB RAM', '10 ГБ NVMe', 'Кроны / Бэкапы'], popular: true },
                    { name: 'Node.js Premium', price: '999 ₽', period: '/ мес', badge: 'MAX', desc: 'Node.js Production c isolate user + Nginx reverse. Логи, мониторинг. ~10 000+ посещений/сутки.', icon: '💎', features: ['2 vCPU shared', '2 GB RAM', '30 ГБ NVMe', 'Приоритетная поддержка'] },
                  ].map((plan, i) => (
                    <div key={i} className={`px-8 py-6 ${plan.popular ? 'bg-gradient-to-r from-purple-50 to-pink-50' : ''} hover:bg-gray-50 transition-colors`}>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{plan.icon}</div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-lg font-black text-gray-900">{plan.name}</h4>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${plan.popular ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{plan.badge}</span>
                            </div>
                            <p className="text-sm text-gray-500">{plan.desc}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-black text-gray-900">{plan.price}<span className="text-sm font-semibold text-gray-500">{plan.period}</span></div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-3 ml-12">
                        {plan.features.map((f, j) => (
                          <span key={j} className="text-xs font-semibold text-gray-600 inline-flex items-center gap-1">
                            <Check size={12} className="text-green-500" /> {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-200">
                  <a href="#pricing" className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:-translate-y-0.5 hover:shadow-xl transition-all">
                    Выбрать тариф сайта <ArrowRight size={18} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-24 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Отзывы</h2>
              <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Что говорят наши клиенты</p>
              <div className="mt-6 flex items-center justify-center gap-1">
                {[0,1,2,3,4].map(i => (
                  <Star key={i} size={22} className="fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 text-gray-600 font-semibold">4.9 / 5.0 · 300+ отзывов</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                {
                  name: 'Артём Д.',
                  role: 'Владелец Minecraft-сервера · 40 слотов',
                  initials: 'АД',
                  color: 'from-blue-500 to-cyan-500',
                  text: 'Заказывал сервер Minecraft на 40 слотов с Paper — запустился буквально за 40 секунд после оплаты. Установил плагины через SFTP за 5 минут. Пинг 10–15 мс, ни одного лага за 2 месяца. Рекомендую!',
                },
                {
                  name: 'Михаил К.',
                  role: 'Админ CS 1.6 Deathmatch · 32 слота',
                  initials: 'МК',
                  color: 'from-orange-500 to-red-500',
                  text: 'Поднял сервер CS 1.6 ReHLDS — сборка «Stable 2021» с AMX Mod X и FastDL предустановлена. Меняю карты, ставлю моды — всё работает как часы. Поддержка ответила за 3 минуты когда переносил карту с другого хостинга.',
                },
                {
                  name: 'Ольга В.',
                  role: 'Создал сайт для Таксопарка · Node.js Business',
                  initials: 'ОВ',
                  color: 'from-purple-500 to-pink-500',
                  text: 'Взяла шаблон «Орлан Такси» — выбрала 1 клик, через 2 минуты сайт был готов! Подключила свой домен, SSL выставился автоматически. Админка простая, даже я разобралась. Сайт стал принимать заявки с первого дня 🔥',
                },
              ].map((t, i) => (
                <div key={i} className="bg-white rounded-[2rem] p-8 border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all">
                  <div className="flex items-center gap-1 mb-5">
                    {[0,1,2,3,4].map(j => (
                      <Star key={j} size={16} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6">«{t.text}»</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.color} text-white flex items-center justify-center font-black shadow-md`}>
                      {t.initials}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{t.name}</div>
                      <div className="text-sm text-gray-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">FAQ</h2>
              <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Частые вопросы</p>
              <p className="mt-4 text-xl text-gray-500">
                Ответы на&nbsp;самые популярные вопросы. Не&nbsp;нашли&nbsp;— напишите менеджеру.
              </p>
            </div>

            <div className="max-w-3xl mx-auto flex flex-col gap-3">
              {[
                {
                  q: 'Как быстро запускается сервер после оплаты?',
                  a: 'Игровые серверы поднимаются за 30–60 секунд. Сайты шаблонного «Орлан Такси» — 1–2 минуты. На почту приходит уведомление с IP-адресом, портом и доступом в панель управления.',
                },
                {
                  q: 'Можно ли перенести мой мир / плагины / сайт с другого хостинга?',
                  a: 'Да! Игровые миры, плагины, моды, демки CS — загружайте через SFTP или панель управления файлами. Для сайтов — SFTP доступ + импорт БД через PhpMyAdmin. Напишите менеджеру — поможем бесплатно.',
                },
                {
                  q: 'Какие способы оплаты? Могу ли я оплатить по СБП?',
                  a: 'Оплата через Платежный шлюз Platega.io: карты Visa/Mastercard/Мир, СБП по QR-коду, СБП СБОЛ. Также доступно пополнение баланса и списание с баланса. Баланс first — баланс достаточен, заказ сразу исполняется.',
                },
                {
                  q: 'Можно ли поменять количество слотов или тариф уже после заказа?',
                  a: 'Да. В любой момент в личном кабинете можно расширить / уменьшить количество слотов или сменить тариф сайта. Перерасчёт — пропорционально оставшимся дням оплаченного периода.',
                },
                {
                  q: 'Есть ли тестовый период или возврат средств?',
                  a: 'Первые 24 часа — бесплатно попробуйте. Если не понравилось — напишите поддержке, вернём деньги без вопросов. Далее возврат средств возможен за неиспользованные дни по заявке.',
                },
                {
                  q: 'Защищены ли серверы от DDoS-атак?',
                  a: 'Да. Все игровые ноды находятся за DDoS-Guard L3/L4 защита до 1 Тбит/с. Веб-ноды — Cloudflare на фронтенде + WAF rules. Атаки до 1 Тбит/с проходят незаметно.',
                },
                {
                  q: 'Поддерживаются ли моды Minecraft / сборки CurseForge?',
                  a: 'Да! 10 ядер Minecraft: Paper/Purpur/Folia (плагины), Fabric/Forge/NeoForge (моды), Mohist (плагины + моды одновременно), Vanilla. Можно загрузить свой .jar или указать ссылку на модпак CurseForge/Modrinth.',
                },
                {
                  q: 'Как часто делаются бэкапы?',
                  a: 'Игровые серверы: автоматические ежедневные инкрементальные бэкапы (хранятся 7 ротаций). Сайты: бэкап всего пользовательского раздела 1 раз в сутки в 04:05 MSK, 7 ротаций. В любой момент можно запросить восстановление.',
                },
              ].map((item, i) => {
                const open = faqOpen === i;
                return (
                  <div key={i} className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-all">
                    <button
                      type="button"
                      onClick={() => setFaqOpen(open ? null : i)}
                      className="w-full flex items-center justify-between gap-4 px-6 md:px-8 py-5 md:py-6 text-left"
                    >
                      <span className="font-bold text-lg text-gray-900">{item.q}</span>
                      <div className={`w-10 h-10 shrink-0 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center transition-all ${open ? 'rotate-180 bg-indigo-600 text-white' : ''}`}>
                        {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </button>
                    <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="px-6 md:px-8 pb-6 md:pb-8 text-gray-600 leading-relaxed border-t border-gray-100 pt-5 md:pt-6">
                          {item.a}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(99,102,241,0.35),transparent_50%),radial-gradient(circle_at_80%_50%,rgba(236,72,153,0.3),transparent_50%)] opacity-50" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center">
              {[
                { num: '500+', label: 'Серверов запущено', Icon: Rocket },
                { num: '3', label: 'Страны нод', Icon: MapPin },
                { num: '6', label: 'Локаций', Icon: Globe },
                { num: '99.99%', label: 'SLA Аптайм', Icon: Clock },
                { num: '1 Тб/с', label: 'DDoS защита', Icon: Shield },
                { num: '24/7', label: 'Поддержка', Icon: Headphones },
              ].map(({ num, label, Icon }, i) => (
                <div key={i} className="p-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white/10 border border-white/10 text-white flex items-center justify-center">
                    <Icon size={22} />
                  </div>
                  <div className="text-4xl md:text-5xl font-black mb-1.5 text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-200">{num}</div>
                  <div className="text-indigo-200 font-medium uppercase tracking-wider text-xs">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-[2.5rem] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-pink-400 opacity-20 rounded-full blur-3xl" />

              <div className="relative z-10 max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm mb-8">
                  <Award size={18} />
                  <span className="text-sm font-semibold">Гарантия возврата 24 часа · Поддержка 24/7</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                  Готовы поднять свой сервер или сайт?
                </h2>
                <p className="text-indigo-100 text-xl mb-10 font-light">
                  Создайте проект за&nbsp;60&nbsp;секунд. Оплатили — играете или запускаете сайт. Без скрытых платежей и&nbsp;наценок.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                  <a
                    href="#pricing"
                    className="group inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-white text-indigo-700 font-black text-lg hover:bg-gray-50 hover:-translate-y-1 transition-all shadow-2xl w-full sm:w-auto justify-center"
                  >
                    <Rocket size={22} />
                    Перейти к конфигуратору
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                  <a
                    href="mailto:support@wexa.su"
                    className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white/5 text-white font-bold text-lg border-2 border-white/20 hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-sm w-full sm:w-auto justify-center"
                  >
                    <Mail size={20} />
                    Написать менеджеру
                  </a>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-indigo-100 text-sm font-medium">
                  {['Оплата картами и СБП', 'СЧЁТ сразу исполняется', 'Бэкапы 7 дней бесплатно', 'SSL сертификаты'].map((t, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5">
                      <Check size={16} className="text-green-300" /> {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
};

export default Home;
