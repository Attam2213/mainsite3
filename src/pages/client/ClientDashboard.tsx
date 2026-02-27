import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { motion } from 'framer-motion';
import { 
  FileText, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Download,
  CreditCard,
  Briefcase,
  Send,
  X,
  Loader
} from 'lucide-react';

interface Invoice {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  type: 'one_time' | 'monthly';
  dueDate: string;
  createdAt: string;
  service?: {
    id: string;
    title: string;
  };
}

interface Project {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  deadline: string;
  serverIp?: string;
  websiteUrl?: string;
  siteStatus?: 'up' | 'down' | 'unknown';
  lastChecked?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender?: {
    name: string;
    role: string;
  };
}

interface Order {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  unreadCount?: number;
  service?: {
    title: string;
  };
}

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeServices, setActiveServices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      // Mark messages as read locally when opening chat
      setOrders(prev => prev.map(o => 
        o.id === selectedOrder.id ? { ...o, unreadCount: 0 } : o
      ));
      
      fetchMessages(selectedOrder.id);
      const interval = setInterval(() => fetchMessages(selectedOrder.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedOrder]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Add timeout for requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const [invoicesRes, projectRes, ordersRes] = await Promise.all([
          fetch('/api/invoices/my', { headers, signal: controller.signal }),
          fetch('/api/projects/my', { headers, signal: controller.signal }),
          fetch('/api/orders', { headers, signal: controller.signal })
        ]);
        
        clearTimeout(timeoutId);

        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          if (Array.isArray(data)) {
            setInvoices(data);
            
            // Filter active services (paid services or pending monthly subscriptions)
            const active = data.filter((inv: Invoice) => 
              (inv.status === 'paid' && inv.type === 'monthly') || 
              (inv.status === 'paid' && inv.type === 'one_time' && new Date(inv.dueDate) > new Date())
            );
            setActiveServices(active);
          }
        }

        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setProjects(Array.isArray(projectData) ? projectData : []);
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (Array.isArray(ordersData)) {
            setOrders(ordersData);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.error('Request timed out');
        }
        throw err;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedOrder) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${selectedOrder.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newMessage
        })
      });

      if (res.ok) {
        setNewMessage('');
        fetchMessages(selectedOrder.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handlePay = (invoice: Invoice) => {
    alert(`Для оплаты счета "${invoice.title}" на сумму ${invoice.amount} ₽ свяжитесь с администратором.\n\nВ будущем здесь будет подключена платежная система.`);
  };

  const handleContactManager = async () => {
    // Check if there is already an active support chat (order without service)
    const supportOrder = orders.find(o => !o.service && o.status !== 'cancelled' && o.status !== 'completed');
    
    if (supportOrder) {
      setSelectedOrder(supportOrder);
      setIsChatOpen(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: null
        })
      });

      if (res.ok) {
        const newOrder = await res.json();
        // Refresh orders to show the new one
        fetchData();
        // We can't immediately select it because we need to wait for refresh or add it manually
        // But for simplicity, we can just alert or wait. 
        // Better: add it to state manually
        setOrders(prev => [newOrder, ...prev]);
        setSelectedOrder(newOrder);
        setIsChatOpen(true);
      }
    } catch (error) {
      console.error('Error creating support chat:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <Loader className="animate-spin text-indigo-600" size={48} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Личный кабинет</h1>
            <p className="mt-1 text-gray-500">Отслеживайте прогресс вашего проекта и оплачивайте услуги</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">

              {/* Orders */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Мои заказы</h2>
                  <Briefcase className="h-5 w-5 text-indigo-600" />
                </div>
                
                <div className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      У вас пока нет активных заказов
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {order.service?.title || 'Чат с менеджером'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              от {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status === 'pending' ? 'Ожидает' :
                             order.status === 'in_progress' ? 'В работе' :
                             order.status === 'completed' ? 'Выполнен' : 'Отменен'}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsChatOpen(true);
                          }}
                          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Открыть чат с администратором
                          {order.unreadCount ? (
                            <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                              {order.unreadCount}
                            </span>
                          ) : null}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
              
              {/* Active Services */}
              {activeServices.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Активные услуги</h2>
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {activeServices.map((service) => (
                      <div key={service.id} className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                        <h3 className="font-medium text-indigo-900">{service.title}</h3>
                        <p className="text-sm text-indigo-700 mt-1">
                          {service.type === 'monthly' ? 'Ежемесячная подписка' : 'Разовая услуга'}
                        </p>
                        <div className="mt-2 flex items-center text-xs text-indigo-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Активна до {new Date(service.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Active Projects */}
              {projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').map(project => (
                <motion.div 
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Текущий проект</h2>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                      project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status === 'pending' ? 'Ожидает' :
                       project.status === 'in_progress' ? 'В работе' : 'Отменен'}
                    </span>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex justify-between text-sm font-medium text-gray-900">
                        <span>Прогресс выполнения</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div 
                          className="h-full bg-indigo-600 transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="mr-2 h-4 w-4" />
                      <span>Дедлайн: {new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Websites Section */}
              {projects.filter(p => p.websiteUrl).length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Мои сайты</h2>
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                  </div>
                  
                  <div className="space-y-4">
                    {projects.filter(p => p.websiteUrl).map(project => (
                      <div key={project.id} className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                            <a 
                              href={project.websiteUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm mt-1 block"
                            >
                              {project.websiteUrl}
                            </a>
                            {project.serverIp && (
                              <p className="text-xs text-gray-500 mt-1">IP: {project.serverIp}</p>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${
                              project.siteStatus === 'up' ? 'bg-green-100 text-green-800' :
                              project.siteStatus === 'down' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {project.siteStatus === 'up' ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Работает
                                </>
                              ) : project.siteStatus === 'down' ? (
                                <>
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Не работает
                                </>
                              ) : (
                                'Проверка...'
                              )}
                            </span>
                            {project.lastChecked && (
                              <span className="text-xs text-gray-400">
                                Проверено: {new Date(project.lastChecked).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Invoices */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl bg-white shadow-sm border border-gray-100"
              >
                <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Счета и оплата</h3>
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <div className="divide-y divide-gray-100">
                  {invoices.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      У вас пока нет выставленных счетов
                    </div>
                  ) : (
                    invoices.map((invoice) => (
                      <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-gray-50 gap-4">
                        <div className="flex items-center">
                          <div className={`rounded-lg p-2 ${invoice.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <p className="font-medium text-gray-900">{invoice.title}</p>
                            <p className="text-sm text-gray-500">
                              от {new Date(invoice.createdAt).toLocaleDateString()} • Срок: {new Date(invoice.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-2 sm:mt-0">
                          <div className="text-right mr-4">
                            <p className="font-medium text-gray-900">{invoice.amount.toLocaleString('ru-RU')} ₽</p>
                            <span className={`inline-flex items-center text-xs font-medium ${
                              invoice.status === 'paid' ? 'text-green-600' : 
                              invoice.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {invoice.status === 'paid' ? (
                                <><CheckCircle className="mr-1 h-3 w-3" /> Оплачен</>
                              ) : invoice.status === 'cancelled' ? (
                                <><AlertCircle className="mr-1 h-3 w-3" /> Отменен</>
                              ) : (
                                <><Clock className="mr-1 h-3 w-3" /> Ожидает оплаты</>
                              )}
                            </span>
                          </div>
                          
                          {invoice.status === 'pending' && (
                            <button 
                              onClick={() => handlePay(invoice)}
                              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                            >
                              Оплатить
                            </button>
                          )}
                          
                          {invoice.status === 'paid' && (
                             <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                               <Download className="h-5 w-5" />
                             </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar - Support */}
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl bg-indigo-600 p-6 text-white shadow-lg"
              >
                <h3 className="mb-2 text-lg font-semibold">Нужна помощь?</h3>
                <p className="mb-6 text-indigo-100 text-sm">
                  Возникли вопросы по проекту или оплате? Напишите нам.
                </p>
                <button 
                  onClick={handleContactManager}
                  className="flex w-full items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Написать менеджеру
                </button>
              </motion.div>

              <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
                <h3 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Ваш менеджер</h3>
                <div className="flex items-center">
                  <img 
                    className="h-10 w-10 rounded-full bg-gray-300" 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                    alt="" 
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Александр</p>
                    <p className="text-xs text-gray-500">Senior Developer</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {isChatOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] h-[600px]"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedOrder.service?.title || 'Чат с менеджером'}
                </h3>
                <p className="text-xs text-gray-500">
                  ID: {selectedOrder.id}
                </p>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Нет сообщений. Напишите первое сообщение!
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender?.role === 'admin' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender?.role === 'admin' 
                        ? 'bg-white border border-gray-200 text-gray-800' 
                        : 'bg-indigo-600 text-white'
                    }`}>
                      <div className="flex justify-between items-center mb-1 gap-2">
                         <span className="text-xs font-semibold opacity-75">{msg.sender?.name}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 text-right ${
                        msg.sender?.role === 'admin' ? 'text-gray-400' : 'text-indigo-200'
                      }`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Введите сообщение..."
                  className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </Layout>
  );
};

export default ClientDashboard;
