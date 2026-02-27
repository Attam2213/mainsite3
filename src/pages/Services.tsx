import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { Code2, Monitor, Database, Shield, Check, Loader, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const iconMap: Record<string, React.ElementType> = {
  Monitor,
  Database,
  Code2,
  Shield,
  Activity
};

interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  features: string[];
  icon: string;
  color: string;
}

const Services = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderLoading, setOrderLoading] = useState<string | null>(null);

  const handleOrder = async (serviceId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setOrderLoading(serviceId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ serviceId })
      });

      if (response.ok) {
        alert('Заказ успешно создан! Переходим в личный кабинет.');
        navigate('/dashboard');
      } else {
        alert('Ошибка при создании заказа');
      }
    } catch (error) {
      console.error('Order error:', error);
      alert('Ошибка при создании заказа');
    } finally {
      setOrderLoading(null);
    }
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        const data = await response.json();
        setServices(data);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Не удалось загрузить услуги');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <Loader className="animate-spin text-blue-600" size={48} />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen text-red-600">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO 
        title="Услуги и Цены" 
        description="Разработка сайтов, интернет-магазинов, корпоративных порталов. Доступные цены и высокое качество." 
        keywords="цены на сайты, заказать сайт цена, стоимость разработки сайта, услуги веб-студии"
      />
      <div className="bg-gray-50 min-h-screen py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              Услуги и цены
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600"
            >
              Прозрачное ценообразование и четкие сроки. Выберите подходящий пакет для вашего бизнеса.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8">
            {services.map((service, index) => {
              const IconComponent = iconMap[service.icon] || Code2;
              
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col hover:shadow-xl transition-shadow duration-300"
                >
                  <div className={`p-6 ${service.color} text-white`}>
                    <IconComponent size={32} className="mb-4" />
                    <h3 className="text-2xl font-bold">{service.title}</h3>
                    <p className="text-white/80 mt-2 text-sm">{service.description}</p>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-3xl font-bold text-gray-900 mb-6">{service.price}</div>
                    <ul className="space-y-3 mb-8 flex-1">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-gray-600">
                          <Check size={18} className="text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => handleOrder(service.id)}
                      disabled={orderLoading === service.id}
                      className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {orderLoading === service.id ? 'Обработка...' : 'Заказать'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Services;
