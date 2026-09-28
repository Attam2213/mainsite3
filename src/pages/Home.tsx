import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import GameServerConfigurator, {
  FEATURES, STEPS,
  type GameServerOrderPayload,
  type WebsiteOrderPayload,
} from '../components/GameServerConfigurator';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight, Gamepad2, Server, Zap, ChevronDown
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
        title="Аренда игровых серверов Minecraft, CS2, CS 1.6 — Wexa.su"
        description="Хостинг игровых серверов Wexa.su. Minecraft, CS2, CS 1.6. Быстрые NVMe ноды, защита от DDoS, SFTP, панель управления. Мгновенный запуск за 60 секунд."
      />
      <div className="bg-white overflow-hidden font-sans">

        {/* HERO */}
        <section id="hero" className="relative min-h-screen flex items-center justify-center pt-24 pb-32 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white">
          <div className="absolute inset-0 z-0">
            <motion.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
              className="w-full h-full opacity-20"
            >
              <div className="w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(99,102,241,0.3),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.25),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.15),transparent_50%)]" />
            </motion.div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="max-w-5xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm mb-8">
                <Zap size={16} className="text-yellow-400" />
                <span className="text-sm font-medium text-gray-200">Мгновенный запуск за 60 секунд</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight">
                Игровые серверы <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  с нулевым пингом
                </span>
              </h1>

              <p className="mt-6 text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto font-light">
                Аренда серверов Minecraft, CS2 и CS 1.6. NVMe SSD, защита от DDoS, SFTP-доступ и
                удобная панель управления. Подними свой сервер прямо сейчас.
              </p>

              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                <a
                  href="#pricing"
                  className="group w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  Создать сервер
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#games"
                  className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 text-white font-bold text-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center backdrop-blur-sm"
                >
                  <Gamepad2 size={20} className="mr-2" />
                  Смотреть игры
                </a>
              </div>

              <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                {[
                  { num: '3+', label: 'Ноды' },
                  { num: '99.9%', label: 'Uptime' },
                  { num: '60с', label: 'Запуск' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl md:text-4xl font-black text-white mb-2">{s.num}</div>
                    <div className="text-sm text-gray-400 uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.a
            href="#games"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ delay: 1.2, duration: 2, repeat: Infinity }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-gray-400"
          >
            <ChevronDown size={32} />
          </motion.a>
        </section>

        <GameServerConfigurator
          compact={false}
          isAuthenticated={isAuthenticated}
          onOrder={handleOrder}
          onWebsiteOrder={handleWebsiteOrder}
        />

        {/* FEATURES */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Преимущества</h2>
              <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Почему Wexa.su?</p>
              <p className="mt-4 text-xl text-gray-500">
                Всё, что нужно для стабильного игрового сервера, в одном месте.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {FEATURES.map((f, idx) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08 }}
                    className="group bg-gray-50 hover:bg-white rounded-3xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all"
                  >
                    <div className={`w-14 h-14 rounded-2xl ${f.color} text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon size={26} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{f.desc}</p>
                  </motion.div>
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
              <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">4 шага до игры</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gray-200 -z-0 transform translate-y-4" />
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.15 }}
                    className="relative bg-gray-50 pt-4"
                  >
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg mb-6 border-4 border-gray-50 relative z-10">
                      <Icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-3">{step.title}</h3>
                    <p className="text-gray-500 text-center text-sm leading-relaxed">{step.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(99,102,241,0.3),transparent_50%),radial-gradient(circle_at_80%_50%,rgba(236,72,153,0.25),transparent_50%)] opacity-50" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center divide-x divide-white/10">
              {[
                { num: '500+', label: 'Серверов запущено' },
                { num: '3', label: 'Страны / 6 локаций' },
                { num: '99.9%', label: 'Аптайм нод' },
                { num: '24/7', label: 'Поддержка' },
              ].map((s, i) => (
                <div key={i} className="p-4">
                  <div className="text-5xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-200">{s.num}</div>
                  <div className="text-indigo-200 font-medium uppercase tracking-wider text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-[2.5rem] p-10 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-pink-400 opacity-20 rounded-full blur-3xl" />

              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                  Готовы поднять свой сервер?
                </h2>
                <p className="text-indigo-100 text-xl mb-10 font-light">
                  Создайте сервер за 60 секунд. Оплатили — играете.
                </p>
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-white text-indigo-700 font-black text-lg hover:bg-gray-50 hover:-translate-y-1 transition-all shadow-2xl"
                >
                  <Server size={22} />
                  Перейти к конфигуратору
                  <ArrowRight size={20} />
                </a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
};

export default Home;
