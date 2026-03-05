import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { ArrowRight, Code2, Monitor, Shield, Zap, CheckCircle, Globe, PenTool } from 'lucide-react';
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
    "React", "TypeScript", "Node.js", "PostgreSQL", "Next.js", "TailwindCSS", "Docker", "AWS", "Figma", "Redux", "GraphQL"
  ];

  const steps = [
    {
      icon: PenTool,
      title: '1. Анализ и Дизайн',
      description: 'Изучаю ваши требования, целевую аудиторию и создаю прототип будущего сайта.'
    },
    {
      icon: Code2,
      title: '2. Разработка',
      description: 'Пишу чистый и оптимизированный код, настраиваю серверную часть и базы данных.'
    },
    {
      icon: CheckCircle,
      title: '3. Тестирование',
      description: 'Проверяю работу на всех устройствах, исправляю баги и оптимизирую скорость.'
    },
    {
      icon: Globe,
      title: '4. Запуск',
      description: 'Размещаю сайт на хостинге, настраиваю домен и передаю вам готовый проект.'
    }
  ];

  return (
    <Layout>
      <SEO 
        title="Создание сайтов для бизнеса" 
        description="Wexa - профессиональная веб-разработка сайтов под ключ. Создание современных, быстрых и адаптивных сайтов для вашего бизнеса." 
      />
      <div className="bg-white overflow-hidden font-sans">
        
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden bg-gray-900 text-white">
          {/* Animated Background */}
          <div className="absolute inset-0 z-0">
            <motion.div 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
              className="w-full h-full opacity-40"
            >
              <img 
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
                alt="Background" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900/90 to-white" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-900/0 to-gray-900/0" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-4xl mx-auto"
            >
              {/* Available for Hire badge removed */}
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-tight">
                Создаю <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Цифровые</span> <br className="hidden md:block" />
                <span className="relative inline-block">
                  Продукты
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-indigo-500 opacity-60" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.00025 6.99997C25.7501 2.99991 132.5 -2.5001 198 2.99996" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                </span>
              </h1>
              
              <p className="mt-6 text-xl md:text-2xl text-gray-300 leading-relaxed max-w-2xl mx-auto font-light">
                Превращаю сложные идеи в элегантные, быстрые и масштабируемые веб-приложения, которые помогают бизнесу расти.
              </p>
              
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link
                  to="/services"
                  className="group w-full sm:w-auto px-8 py-4 rounded-full bg-indigo-600 text-white font-bold text-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  Обсудить проект 
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/portfolio"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 text-white font-bold text-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center backdrop-blur-sm"
                >
                  Смотреть портфолио
                </Link>
              </div>
            </motion.div>
          </div>
          
          {/* Scroll Down Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ delay: 1, duration: 2, repeat: Infinity }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-gray-400"
          >
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center p-1">
              <div className="w-1 h-2 bg-gray-400 rounded-full" />
            </div>
          </motion.div>
        </section>

        {/* Tech Stack Marquee */}
        <section className="py-12 border-b border-gray-100 bg-white overflow-hidden relative">
          <div className="flex overflow-hidden relative z-0 mask-gradient">
            <motion.div
              className="flex gap-12 md:gap-24 whitespace-nowrap px-8 items-center"
              animate={{ x: "-50%" }}
              transition={{ 
                repeat: Infinity, 
                ease: "linear", 
                duration: 40 
              }}
            >
              {[...technologies, ...technologies, ...technologies, ...technologies].map((tech, index) => (
                <span 
                  key={index} 
                  className="text-3xl md:text-5xl font-bold text-gray-300 hover:text-indigo-600 transition-colors duration-300 cursor-default select-none"
                >
                  {tech}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-gray-50 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Преимущества</h2>
              <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                Почему выбирают меня?
              </p>
              <p className="mt-4 text-xl text-gray-500">
                Мой подход к разработке гарантирует качество, скорость и безопасность вашего продукта.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 relative overflow-hidden"
                >
                  <div className={`w-16 h-16 rounded-2xl ${feature.color} bg-opacity-10 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon size={32} className={`text-${feature.color.split('-')[1]}-600`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Процесс</h2>
              <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                Как мы работаем
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gray-100 -z-10 transform translate-y-4"></div>

              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="relative bg-white pt-4"
                >
                  <div className="w-16 h-16 mx-auto bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg mb-6 border-4 border-white relative z-10">
                    <step.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-center text-sm leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-indigo-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-purple-900/90"></div>
            
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center divide-x divide-white/10">
                    <div className="p-4">
                        <div className="text-5xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-200">50+</div>
                        <div className="text-indigo-200 font-medium uppercase tracking-wider text-sm">Проектов завершено</div>
                    </div>
                    <div className="p-4">
                        <div className="text-5xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-200">30+</div>
                        <div className="text-indigo-200 font-medium uppercase tracking-wider text-sm">Довольных клиентов</div>
                    </div>
                    <div className="p-4">
                        <div className="text-5xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-200">5</div>
                        <div className="text-indigo-200 font-medium uppercase tracking-wider text-sm">Лет опыта</div>
                    </div>
                    <div className="p-4">
                        <div className="text-5xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-200">24/7</div>
                        <div className="text-indigo-200 font-medium uppercase tracking-wider text-sm">Поддержка</div>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
              {/* Background Shapes */}
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-purple-500 opacity-20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                  Готовы запустить свой <br /> следующий большой проект?
                </h2>
                <p className="text-indigo-100 text-xl max-w-2xl mx-auto mb-12 font-light">
                  Давайте обсудим вашу идею и найдем лучшее техническое решение. 
                  Первая консультация и оценка проекта — бесплатно.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <a
                    href="https://t.me/iljes222"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white text-indigo-600 px-10 py-5 rounded-full font-bold text-xl hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl"
                  >
                    Написать в Telegram <ArrowRight size={24} />
                  </a>

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
