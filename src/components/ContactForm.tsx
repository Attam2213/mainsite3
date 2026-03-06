import { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    telegram: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ email: '', telegram: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Связаться с нами</h3>
      
      {status === 'success' ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h4 className="text-xl font-medium text-gray-900 mb-2">Сообщение отправлено!</h4>
          <p className="text-gray-500">Мы свяжемся с вами в ближайшее время.</p>
          <button 
            onClick={() => setStatus('idle')}
            className="mt-6 text-indigo-600 font-medium hover:text-indigo-500"
          >
            Отправить еще одно
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telegram (необязательно)</label>
            <input
              type="text"
              value={formData.telegram}
              onChange={e => setFormData({...formData, telegram: e.target.value})}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              placeholder="@username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Сообщение</label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              placeholder="Опишите ваш проект или вопрос..."
            />
          </div>

          {status === 'error' && (
            <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Ошибка отправки. Попробуйте позже.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-1"
          >
            {status === 'loading' ? 'Отправка...' : (
              <>
                Отправить <Send className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default ContactForm;
