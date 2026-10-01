﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import Layout from '../components/Layout';
import SEO from '../components/SEO';
import GameServerConfigurator, {
  FEATURES, STEPS,
  type GameServerOrderPayload,
  type WebsiteOrderPayload,
} from '../components/GameServerConfigurator';
import ContactForm from '../components/ContactForm';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import {
  ArrowRight, Gamepad2, Zap, ChevronDown, X,
  Shield, HardDrive, Upload, Check, Globe,
  Sparkles, Rocket, ShieldCheck, Clock, Award,
  Headphones, MapPin, Mail, Star, Server, Database, Code2, Layers,
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [contactModalOpen, setContactModalOpen] = useState(false);

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
        if (res.status === 401) {
          // сессия истекла — редирект на логин
          localStorage.setItem('wexa_order_intent', JSON.stringify(payload));
          navigate('/login');
          return;
        }
        let message = `Ошибка оформления заказа (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
          else if (data?.message) message = data.message;
        } catch {}
        alert(message);
        return;
      } catch (e) {
        alert('Сетевая ошибка, попробуйте позже');
        return;
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
        if (res.status === 401) {
          localStorage.setItem('wexa_order_intent', JSON.stringify(intent));
          navigate('/login');
          return;
        }
        let message = `Ошибка оформления заказа (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
          else if (data?.message) message = data.message;
        } catch {}
        alert(message);
        return;
      } catch (e) {
        alert('Сетевая ошибка, попробуйте позже');
        return;
      }
    }
    localStorage.setItem('wexa_order_intent', JSON.stringify(intent));
    navigate('/login');
  };

  return (
    <Layout>
      <SEO
        title="Аренда игровых серверов Minecraft, CS2, CS 1.6 + Сайты — Wexa.su"
        description="Хостинг игровых серверов Wexa.su. Minecraft, CS2, CS 1.6. Быстрые NVMe ноды, защита от DDoS, SFTP, панель управления. Мгновенный запуск за 60 секунд. Сайты — Landing, Node.js."
      />
      <div className="bg-white overflow-hidden font-sans">
        <style>{`
          @keyframes floatLeft { 0%, 100% { transform: translate(0, 0) rotate(-4deg); } 50% { transform: translate(0, -10px) rotate(-2deg); } }
          @keyframes floatRight { 0%, 100% { transform: translate(0, 0) rotate(5deg); } 50% { transform: translate(0, -12px) rotate(3deg); } }
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
          @keyframes pulseGlow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
          .rotate-y-180 { transform: rotateY(180deg); }
        `}</style>

        {/* HERO */}
        <section id="hero" className="relative min-h-screen flex items-center justify-center pt-24 pb-32 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white">
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full opacity-20">
              <div className="w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(99,102,241,0.35),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.28),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.2),transparent_50%)]" />
            </div>
            <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-indigo-400 animate-pulse opacity-60" />
            <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse opacity-60" style={{ animationDelay: '0.7s' }} />
            <div className="absolute bottom-1/3 left-1/3 w-1 h-1 rounded-full bg-pink-400 animate-pulse opacity-60" style={{ animationDelay: '1.4s' }} />
            <div className="absolute top-0 left-0 w-[34rem] h-[34rem] bg-indigo-500/20 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/4" />
            <div className="absolute bottom-0 right-0 w-[38rem] h-[38rem] bg-fuchsia-500/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/4" />
          </div>

          {/* LEFT decorative floating stack (screen 3 circled left) */}
          <div className="hidden xl:block absolute left-[calc((100%-90rem)/2)] top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="relative">
              <div className="absolute -top-14 -left-6 px-3 py-1.5 rounded-full bg-emerald-400/15 border border-emerald-300/25 text-emerald-200 text-xs font-bold backdrop-blur-sm flex items-center gap-1.5 animate-[float_6s_ease-in-out_infinite]">
                <Check size={14} className="text-emerald-300" /> Онлайн · 500+
              </div>
              <div className="w-64 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-4 shadow-2xl rotate-[-4deg] animate-[floatLeft_7s_ease-in-out_infinite]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/30"><Server size={18} /></div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-indigo-300 font-bold">minecraft · MSK</div>
                    <div className="text-sm font-bold text-white">mc.wexa.pw</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Слоты</span><span className="text-white font-semibold">28 / 40</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="w-[70%] h-full bg-gradient-to-r from-indigo-400 to-purple-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                    <div className="rounded-lg bg-white/5 py-1.5">
                      <div className="text-[10px] text-gray-400">Tps</div>
                      <div className="text-xs font-bold text-emerald-300">19.98</div>
                    </div>
                    <div className="rounded-lg bg-white/5 py-1.5">
                      <div className="text-[10px] text-gray-400">Пинг</div>
                      <div className="text-xs font-bold text-white">12 мс</div>
                    </div>
                    <div className="rounded-lg bg-white/5 py-1.5">
                      <div className="text-[10px] text-gray-400">CPU</div>
                      <div className="text-xs font-bold text-indigo-300">23%</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-60 mt-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-3 shadow-2xl rotate-[3deg] ml-6 animate-[floatLeft_9s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"><Shield size={16} /></div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white">DDoS защита</div>
                    <div className="text-[10px] text-emerald-300 font-semibold">Активна · L3/L4</div>
                  </div>
                </div>
                <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div className="w-[92%] h-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                </div>
                <div className="mt-1 text-right text-[10px] text-gray-400">1.0 Тбит/с · 99.99% SLA</div>
              </div>
            </div>
          </div>

          {/* RIGHT decorative floating stack (screen 3 circled right) */}
          <div className="hidden xl:block absolute right-[calc((100%-90rem)/2)] top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="relative">
              <div className="absolute -top-12 right-0 px-3 py-1.5 rounded-full bg-pink-400/15 border border-pink-300/25 text-pink-200 text-xs font-bold backdrop-blur-sm flex items-center gap-1.5 animate-[float_6s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }}>
                <Sparkles size={14} className="text-pink-300" /> Запуск сайта за 1 минуту
              </div>
              <div className="w-64 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-4 shadow-2xl rotate-[5deg] animate-[floatRight_8s_ease-in-out_infinite]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"><Globe size={18} /></div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-purple-300 font-bold">nodejs · business</div>
                    <div className="text-sm font-bold text-white">cafe-ulybka.wexa.su</div>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-amber-50/5 to-orange-50/5 h-28">
                  <div className="h-8 bg-white/5 flex items-center gap-1.5 px-2 border-b border-white/10">
                    <div className="w-2 h-2 rounded-full bg-red-400/70" />
                    <div className="w-2 h-2 rounded-full bg-amber-400/70" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400/70" />
                    <div className="ml-2 flex-1 h-4 rounded-md bg-white/5 text-[9px] text-gray-400 px-2 flex items-center">🔒 cafe-ulybka.wexa.su</div>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex gap-1.5">
                      <div className="w-3/5 h-3 rounded bg-pink-400/20" />
                      <div className="w-2/5 h-3 rounded bg-indigo-400/20" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      <div className="aspect-square rounded bg-white/5" />
                      <div className="aspect-square rounded bg-white/5" />
                      <div className="aspect-square rounded bg-white/5" />
                    </div>
                    <div className="h-2 rounded bg-white/5 w-4/5" />
                    <div className="h-2 rounded bg-white/5 w-3/5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-semibold"><ShieldCheck size={12} /> SSL · Valid</div>
                  <div className="flex items-center gap-1.5 text-gray-400"><Clock size={12} /> Вчера 21:04</div>
                </div>
              </div>
              <div className="w-60 mt-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-3 shadow-2xl rotate-[-5deg] mr-5 animate-[floatRight_10s_ease-in-out_infinite]" style={{ animationDelay: '0.7s' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center"><Database size={16} /></div>
                  <div>
                    <div className="text-xs font-bold text-white">Node.js 22 · PM2</div>
                    <div className="text-[10px] text-sky-300 font-semibold">Статус · online</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-0.5"><span>Память</span><span>118 / 256 MB</span></div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="w-[46%] h-full bg-gradient-to-r from-sky-400 to-indigo-400" /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-0.5"><span>Посещений / сут</span><span>3 207</span></div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="w-[68%] h-full bg-gradient-to-r from-purple-400 to-pink-400" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="max-w-6xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm mb-8">
                <Sparkles size={16} className="text-yellow-400" />
                <span className="text-sm font-medium text-gray-200">Первый сервис в России с поддержкой ИИ агентов</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-8 leading-[1.05]">
                Игровые серверы и&nbsp;сайты <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  с&nbsp;нулевым пингом
                </span>
              </h1>

              <p className="mt-6 text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto font-light">
                Аренда серверов Minecraft, CS2 и&nbsp;CS&nbsp;1.6&nbsp;— NVMe SSD, защита от&nbsp;DDoS 1&nbsp;Тбит/с, SFTP-доступ и&nbsp;удобная панель управления. <span className="text-white font-semibold">Сайты</span>: статический Landing или Node.js Business/Premium.
              </p>

              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                <a
                  href="#pricing"
                  className="group w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-[0_0_40px_rgba(99,102,241,0.45)] hover:shadow-[0_0_60px_rgba(168,85,247,0.65)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  Перейти к конфигуратору
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[
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

        {/* SERVICES 2-UP CARDS */}
        <section id="services" className="py-24 bg-white relative overflow-hidden">
          <div className="absolute top-20 left-0 w-[26rem] h-[26rem] bg-indigo-200/40 rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-16 right-0 w-[26rem] h-[26rem] bg-fuchsia-200/40 rounded-full blur-3xl translate-x-1/2 pointer-events-none" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Наши услуги</h2>
              <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Всё, что нужно вашему проекту</p>
              <p className="mt-4 text-xl text-gray-500">
                Две основные услуги — игровые серверы и&nbsp;сайты. Всё в&nbsp;одном личном кабинете, один баланс и&nbsp;единая поддержка.
              </p>
            </div>

            {/* LEFT vertical label + stack for SERVICES (screen 1 circled left) */}
            <div className="hidden 2xl:block absolute left-[max(1rem,calc((100%-88rem)/2))] top-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <div className="flex flex-col items-center gap-5">
                <div className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-center shadow-sm">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center mb-1.5"><Gamepad2 size={20} /></div>
                  <div className="text-[11px] font-bold text-indigo-700">GAME NODES</div>
                  <div className="text-[9px] text-indigo-500 font-semibold uppercase tracking-wider">6 locations</div>
                </div>
                <div className="writing-vertical text-[10px] font-black uppercase tracking-[0.35em] text-indigo-300" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                  Minecraft · CS 1.6 · CS2 · NVMe · DDoS
                </div>
                <div className="px-3 py-2 rounded-xl bg-sky-50 border border-sky-100 text-center shadow-sm">
                  <div className="w-11 h-11 mx-auto rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white flex items-center justify-center mb-1"><Zap size={18} /></div>
                  <div className="text-[10px] font-bold text-sky-700">INSTANT · 60s</div>
                </div>
              </div>
            </div>

            {/* RIGHT vertical label + stack for SERVICES (screen 1 circled right) */}
            <div className="hidden 2xl:block absolute right-[max(1rem,calc((100%-88rem)/2))] top-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <div className="flex flex-col items-center gap-5">
                <div className="px-3 py-2 rounded-xl bg-fuchsia-50 border border-fuchsia-100 text-center shadow-sm">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white flex items-center justify-center mb-1.5"><Layers size={20} /></div>
                  <div className="text-[11px] font-bold text-fuchsia-700">WEB HOSTING</div>
                  <div className="text-[9px] text-fuchsia-500 font-semibold uppercase tracking-wider">3 plans</div>
                </div>
                <div className="writing-vertical text-[10px] font-black uppercase tracking-[0.35em] text-fuchsia-300" style={{ writingMode: 'vertical-rl' }}>
                  Landing · Node.js · EJS · SSL · PM2
                </div>
                <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-center shadow-sm">
                  <div className="w-11 h-11 mx-auto rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center mb-1"><Code2 size={18} /></div>
                  <div className="text-[10px] font-bold text-emerald-700">1-CLICK CMS</div>
                </div>
              </div>
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
                      <h3 className="text-2xl md:text-3xl font-black text-gray-900">Сайты</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                    Статический Landing / Визитка или Node.js Business/Premium с&nbsp;админ-панелью. Бесплатный поддомен <span className="font-mono font-bold text-purple-700">*.wexa.su</span>, SSL и&nbsp;SFTP-доступ.
                  </p>
                  <ul className="flex flex-col gap-3 mb-8">
                    {[
                      'Готовый шаблон сайта за&nbsp;1&nbsp;минуту · Express/EJS + админка',
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


        {/* CONFIGURATOR ANCHOR */}
        <div id="pricing" />
        <GameServerConfigurator
          compact={true}
          isAuthenticated={isAuthenticated}
          onOrder={handleOrder}
          onWebsiteOrder={handleWebsiteOrder}
        />


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
                  role: 'Создала сайт компании · Node.js Business',
                  initials: 'ОВ',
                  color: 'from-purple-500 to-pink-500',
                  text: 'Выбрала готовый шаблон сайта — 1 клик и через 2 минуты сайт был готов! Подключила свой домен, SSL выставился автоматически. Админка простая, даже я разобралась. Сайт стал принимать заявки с первого дня 🔥',
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
                  <button
                    type="button"
                    onClick={() => setContactModalOpen(true)}
                    className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white/5 text-white font-bold text-lg border-2 border-white/20 hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-sm w-full sm:w-auto justify-center"
                  >
                    <Mail size={20} />
                    Написать менеджеру
                  </button>
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

        {contactModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm py-6 px-4 overflow-y-auto"
            onClick={() => setContactModalOpen(false)}
          >
            <div
              className="relative w-full max-w-2xl my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-white text-gray-600 hover:text-gray-900 shadow-2xl flex items-center justify-center z-10 border-2 border-gray-200"
                onClick={() => setContactModalOpen(false)}
              >
                <X size={22} />
              </button>
              <ContactForm />
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Home;
