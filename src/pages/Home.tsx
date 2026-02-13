import { ArrowRight, Code, Zap, Shield, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
            Создаем цифровое <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              будущее вашего бизнеса
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
            Профессиональная разработка сайтов, веб-приложений и поддержка.
            Качественный код, современный дизайн и внимание к деталям.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/contact"
              state={{ scrollToForm: true }}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Обсудить проект
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/portfolio"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Смотреть работы
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Code className="h-8 w-8 text-indigo-400" />,
                title: 'Чистый код',
                description: 'Используем современные технологии и лучшие практики разработки.'
              },
              {
                icon: <Zap className="h-8 w-8 text-indigo-400" />,
                title: 'Быстрая работа',
                description: 'Оптимизируем производительность для максимальной скорости загрузки.'
              },
              {
                icon: <Smartphone className="h-8 w-8 text-indigo-400" />,
                title: 'Адаптивность',
                description: 'Ваш сайт будет идеально выглядеть на любом устройстве.'
              },
              {
                icon: <Shield className="h-8 w-8 text-indigo-400" />,
                title: 'Поддержка',
                description: 'Надежная поддержка и сопровождение вашего проекта.'
              }
            ].map((feature, index) => (
              <div key={index} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-indigo-500/30 transition-colors">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
