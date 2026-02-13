import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Contact = () => {
  const { contactInfo, telegramConfig } = useSettings();
  const location = useLocation();
  const formRef = useRef<HTMLDivElement>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Разработка сайта',
    message: ''
  });
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (location.state?.scrollToForm && formRef.current) {
      // Scroll to form with a slight delay to ensure rendering
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setIsBlinking(true);
        // Stop blinking after 6 seconds (3 pulses)
        const timer = setTimeout(() => setIsBlinking(false), 6000);
        return () => clearTimeout(timer);
      }, 100);
    }
  }, [location.state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }
      
      setStatus('success');
      setFormData({ name: '', email: '', subject: 'Разработка сайта', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('error');
      setErrorMessage('Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте позже или свяжитесь с нами по телефону.');
    }
  };

  return (
    <div className="py-20 bg-black">
      <style>{`
        @keyframes green-pulse {
          0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); border-color: rgb(39 39 42); }
          50% { box-shadow: 0 0 30px 0 rgba(74, 222, 128, 0.3); border-color: rgba(74, 222, 128, 0.6); }
          100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); border-color: rgb(39 39 42); }
        }
        .animate-green-blink {
          animation: green-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Свяжитесь с нами</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Готовы начать проект? Напишите нам, и мы обсудим детали вашего будущего сайта.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800">
              <h3 className="text-2xl font-bold text-white mb-6">Контакты</h3>
              <div className="space-y-6">
                {contactInfo.showEmail && (
                  <div className="flex items-start space-x-4">
                    <div className="bg-indigo-500/10 p-3 rounded-lg">
                      <Mail className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Email</p>
                      <p className="text-lg text-white font-medium">{contactInfo.email}</p>
                    </div>
                  </div>
                )}
                
                {contactInfo.showPhone && (
                  <div className="flex items-start space-x-4">
                    <div className="bg-indigo-500/10 p-3 rounded-lg">
                      <Phone className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Телефон</p>
                      <p className="text-lg text-white font-medium">{contactInfo.phone}</p>
                    </div>
                  </div>
                )}

                {contactInfo.showAddress && (
                  <div className="flex items-start space-x-4">
                    <div className="bg-indigo-500/10 p-3 rounded-lg">
                      <MapPin className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Офис</p>
                      <p className="text-lg text-white font-medium">{contactInfo.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-8 rounded-2xl border border-indigo-500/20">
              <h4 className="text-xl font-bold text-white mb-2">Начните проект сегодня</h4>
              <p className="text-zinc-300 mb-6">
                Мы всегда открыты для новых идей и интересных задач. Давайте создадим что-то удивительное вместе!
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div 
            ref={formRef}
            className={`bg-zinc-900/50 p-8 rounded-2xl border transition-all duration-300 ${isBlinking ? 'animate-green-blink' : 'border-zinc-800'}`}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-6">Напишите нам</h3>
              
              {status === 'success' && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-center">
                  Спасибо! Ваше сообщение успешно отправлено. Мы свяжемся с вами в ближайшее время.
                </div>
              )}
              
              {status === 'error' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-2">
                    Ваше имя
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    placeholder="Иван Иванов"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    placeholder="ivan@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-zinc-400 mb-2">
                  Тема
                </label>
                <select
                  id="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  <option>Разработка сайта</option>
                  <option>Редизайн</option>
                  <option>Поддержка</option>
                  <option>Другое</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-zinc-400 mb-2">
                  Сообщение
                </label>
                <textarea
                  id="message"
                  rows={4}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Расскажите о вашем проекте..."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full inline-flex items-center justify-center px-6 py-4 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    Отправить сообщение
                    <Send className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
