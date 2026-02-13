import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, ShoppingBag, PenTool, Database, Search, Settings, Code, Globe, Smartphone, Shield, Zap, Layout } from 'lucide-react';
import { useServices } from '../context/ServicesContext';

// Icon mapping
export const iconMap: Record<string, React.ReactNode> = {
  'Monitor': <Monitor className="h-10 w-10 text-indigo-400" />,
  'ShoppingBag': <ShoppingBag className="h-10 w-10 text-indigo-400" />,
  'PenTool': <PenTool className="h-10 w-10 text-indigo-400" />,
  'Database': <Database className="h-10 w-10 text-indigo-400" />,
  'Search': <Search className="h-10 w-10 text-indigo-400" />,
  'Settings': <Settings className="h-10 w-10 text-indigo-400" />,
  'Code': <Code className="h-10 w-10 text-indigo-400" />,
  'Globe': <Globe className="h-10 w-10 text-indigo-400" />,
  'Smartphone': <Smartphone className="h-10 w-10 text-indigo-400" />,
  'Shield': <Shield className="h-10 w-10 text-indigo-400" />,
  'Zap': <Zap className="h-10 w-10 text-indigo-400" />,
  'Layout': <Layout className="h-10 w-10 text-indigo-400" />,
};

const Services = () => {
  const { services } = useServices();
  const navigate = useNavigate();

  const handleOrder = () => {
    navigate('/contact', { state: { scrollToForm: true } });
  };

  return (
    <div className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Наши услуги</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Мы предлагаем полный спектр услуг по веб-разработке и продвижению.
            Выберите то, что подходит именно вам.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:bg-zinc-800/80 transition-all duration-300 group">
              <div className="mb-6 bg-zinc-950 w-16 h-16 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-zinc-800">
                {iconMap[service.iconName] || <Monitor className="h-10 w-10 text-indigo-400" />}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
              <p className="text-zinc-400 mb-6 line-clamp-3">
                {service.description}
              </p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-indigo-400 font-semibold">{service.price}</span>
                <button 
                  onClick={handleOrder}
                  className="text-sm text-white bg-zinc-800 hover:bg-indigo-600 px-4 py-2 rounded-lg transition-colors"
                >
                  Заказать
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
