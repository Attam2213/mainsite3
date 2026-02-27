import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { ArrowRight, Code2, Monitor, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    {
      icon: Code2,
      title: 'Чистый Код',
      description: 'Пишу поддерживаемый и масштабируемый код на современных стеках.',
      color: 'bg-blue-500'
    },
    {
      icon: Monitor,
      title: 'Современный UI/UX',
      description: 'Адаптивный дизайн, который отлично выглядит на любых устройствах.',
      color: 'bg-purple-500'
    },
    {
      icon: Zap,
      title: 'Высокая Производительность',
      description: 'Оптимизация загрузки и работы приложений для максимальной скорости.',
      color: 'bg-yellow-500'
    },
    {
      icon: Shield,
      title: 'Безопасность',
      description: 'Защита данных и безопасная архитектура ваших приложений.',
      color: 'bg-green-500'
    }
  ];

  const technologies = [
    "React", "TypeScript", "Node.js", "PostgreSQL", "Next.js", "TailwindCSS", "Docker", "AWS"
  ];

  return (
    <Layout>
      <SEO 
        title="Создание сайтов для бизнеса" 
        description="Wexa - профессиональная веб-разработка сайтов под ключ. Создание современных, быстрых и адаптивных сайтов для вашего бизнеса." 
      />
      <div className="bg-white overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
          {/* Background Image & Overlay */}
          <div className="absolute inset-0 z-0">
            <motion.div 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
              className="w-full h-full"
            >
              <img 
                src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop" 
                alt="Background" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gray-900/80" />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 via-gray-900/80 to-white" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-sm font-semibold mb-6 backdrop-blur-sm">
                  Available for Hire
                </span>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-tight">
                  Превращаю идеи в <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                    цифровую реальность
                  </span>
                </h1>
                <p className="mt-6 text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
                  Full-stack разработчик, специализирующийся на создании быстрых, красивых и функциональных веб-приложений для бизнеса.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/services"
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-indigo-600 text-white font-bold text-lg shadow-lg hover:bg-indigo-500 hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                  >
                    Обсудить проект <ArrowRight size={20} />
                  </Link>
                  <Link
                    to="/portfolio"
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 text-white font-bold text-lg border-2 border-white/20 hover:bg-white/20 hover:border-white/40 transition-all flex items-center justify-center backdrop-blur-sm"
                  >
                    Смотреть работы
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Tech Stack Marquee */}
        <section className="py-12 border-y border-gray-800 bg-gray-900 overflow-hidden relative">
          <div className="container mx-auto px-4 mb-10">
            <p className="text-center text-indigo-400 text-sm font-medium uppercase tracking-wider">Технологический стек</p>
          </div>
          
          {/* Gradient Masks */}
          <div className="absolute inset-y-0 left-0 w-20 md:w-40 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 md:w-40 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none" />

          <div className="flex overflow-hidden">
            <motion.div
              className="flex gap-12 md:gap-24 whitespace-nowrap px-6 md:px-12"
              animate={{ x: "-50%" }}
              transition={{ 
                repeat: Infinity, 
                ease: "linear", 
                duration: 25 
              }}
            >
              {[...technologies, ...technologies, ...technologies, ...technologies].map((tech, index) => (
                <span 
                  key={index} 
                  className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-300 hover:from-indigo-400 hover:to-purple-400 transition-all duration-300 cursor-default transform hover:scale-110"
                >
                  {tech}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Почему я</h2>
              <p className="mt-2 text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-4xl">
                Качество в каждой строчке кода
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -10 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />
                  
                  <div className={`w-14 h-14 rounded-2xl ${feature.color} text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                    <feature.icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 break-words relative z-10">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed relative z-10">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats / Trust Section */}
        <section className="py-20 bg-indigo-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div>
                        <div className="text-4xl md:text-5xl font-bold mb-2">50+</div>
                        <div className="text-indigo-200">Проектов завершено</div>
                    </div>
                    <div>
                        <div className="text-4xl md:text-5xl font-bold mb-2">30+</div>
                        <div className="text-indigo-200">Довольных клиентов</div>
                    </div>
                    <div>
                        <div className="text-4xl md:text-5xl font-bold mb-2">5</div>
                        <div className="text-indigo-200">Лет опыта</div>
                    </div>
                    <div>
                        <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
                        <div className="text-indigo-200">Поддержка</div>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-indigo-600 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">Готовы начать свой проект?</h2>
              <p className="text-indigo-100 text-lg max-w-2xl mx-auto mb-10 relative z-10">
                Давайте обсудим вашу идею и найдем лучшее решение для ее реализации.
                Консультация бесплатна.
              </p>
              <a
                href="https://t.me/iljes222"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-50 transition-colors relative z-10"
              >
                Написать мне <ArrowRight size={20} />
              </a>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Home;
