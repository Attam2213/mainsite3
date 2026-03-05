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
  Loader,
  Globe,
  Plus,
  Settings,
  Users,
  Search,
  MessageSquare
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: string;
  createdAt: string;
  site?: {
    domain: string;
  };
}

interface Site {
  id: string;
  domain: string;
  status: 'pending' | 'active' | 'suspended';
  server?: {
    name: string;
    ipAddress: string;
  };
  cmsVersion: string;
  createdAt: string;
}

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
  paidUntil?: string;
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

const formatDate = (date: string | Date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Debug projects
  console.log('Client Projects:', projects);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'sites' | 'billing' | 'leads' | 'requests'>('overview');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [isCreateSiteModalOpen, setIsCreateSiteModalOpen] = useState(false);
  const [createSiteStep, setCreateSiteStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState('empty');
  const [newSiteDomain, setNewSiteDomain] = useState('');
  const [registerDomain, setRegisterDomain] = useState(false);
  const [skipDomain, setSkipDomain] = useState(false);
  const [useSubdomain, setUseSubdomain] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  const [templates, setTemplates] = useState<any[]>([]);

  // Payment action
  const handlePayInvoice = async (invoiceId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ invoiceId })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Ошибка получения ссылки на оплату');
        }
      } else {
        const error = await res.json();
        alert(error.message || 'Ошибка создания платежа');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ошибка соединения с сервером');
    }
  };

  const handleExtend = async (projectId: string, months: number) => {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/invoices/subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ projectId, months })
        });
        
        if (res.ok) {
            const invoice = await res.json();
            handlePayInvoice(invoice.id);
        } else {
            alert('Ошибка создания счета');
        }
    } catch (error) {
        console.error('Extend error:', error);
    }
  };

  // Lead actions
  const updateLeadStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/leads/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setLeads(leads.map(lead => lead.id === id ? { ...lead, status } : lead));
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту заявку?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setLeads(leads.filter(lead => lead.id !== id));
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const exportLeads = () => {
    if (leads.length === 0) return;

    // Define CSV headers
    const headers = ['Дата', 'Время', 'Имя', 'Email', 'Телефон', 'Сообщение', 'Сайт', 'Статус'];
    
    // Map leads data to CSV format
    const csvData = leads.map(lead => [
      formatDate(lead.createdAt),
      new Date(lead.createdAt).toLocaleTimeString(),
      `"${lead.name.replace(/"/g, '""')}"`, // Escape quotes
      lead.email,
      lead.phone || '',
      `"${lead.message.replace(/"/g, '""')}"`, // Escape quotes and wrap in quotes
      lead.site?.domain || '',
      lead.status === 'new' ? 'Новая' : lead.status === 'contacted' ? 'В работе' : 'Закрыта'
    ]);

    // Combine headers and data
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    // Create blob and download link
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
      lead.email.toLowerCase().includes(leadSearch.toLowerCase()) ||
      (lead.phone && lead.phone.includes(leadSearch));
    
    const matchesStatus = leadStatusFilter === 'all' || lead.status === leadStatusFilter;

    return matchesSearch && matchesStatus;
  });

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
        const [invoicesRes, projectRes, ordersRes, sitesRes] = await Promise.all([
          fetch('/api/invoices/my', { headers, signal: controller.signal }),
          fetch('/api/projects/my', { headers, signal: controller.signal }),
          fetch('/api/orders', { headers, signal: controller.signal }),
          fetch('/api/sites', { headers, signal: controller.signal })
        ]);
        
        clearTimeout(timeoutId);

        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          if (Array.isArray(data)) {
            setInvoices(data);
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

        if (sitesRes.ok) {
          const sitesData = await sitesRes.json();
          if (Array.isArray(sitesData)) {
            setSites(sitesData);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.error('Request timed out');
        }
        throw err;
      }

      // Fetch leads
      const leadsRes = await fetch('/api/leads', { headers: { 'Authorization': `Bearer ${token}` } });
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData);
      }

      // Fetch templates
      const templatesRes = await fetch('/api/sites/templates', { headers: { 'Authorization': `Bearer ${token}` } });
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData);
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

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skipDomain && !newSiteDomain.trim()) return;

    let finalDomain = newSiteDomain;
    if (useSubdomain) {
      finalDomain = `${newSiteDomain.toLowerCase()}.wexa.su`;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          domain: skipDomain ? undefined : finalDomain,
          registerDomain: registerDomain,
          skipDomain: skipDomain,
          template: selectedTemplate
        })
      });

      if (res.ok) {
        const siteData = await res.json();
        setNewSiteDomain('');
        setRegisterDomain(false);
        setSkipDomain(false);
        setUseSubdomain(false);
        setIsCreateSiteModalOpen(false);
        setCreateSiteStep(1); // Reset step
        fetchData();
        
        if (useSubdomain) {
          alert(`Сайт успешно создан! Доступен по адресу: ${siteData.domain}`);
        } else if (!skipDomain && !registerDomain && siteData.server?.ipAddress) {
          alert(`Сайт успешно создан!\n\nВАЖНО: Пожалуйста, направьте A-запись вашего домена ${siteData.domain} на IP-адрес сервера: ${siteData.server.ipAddress}\n\nКак только DNS обновятся, сайт станет доступен.`);
        } else if (skipDomain) {
          alert(`Сайт успешно создан! Ему присвоен временный адрес: ${siteData.domain}\n\nВы сможете привязать свой домен позже в настройках.`);
        } else {
          alert('Сайт успешно создан! Идет настройка VDS...');
        }
      } else {
        const error = await res.json();
        alert(`Ошибка: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating site:', error);
      alert('Ошибка при создании сайта');
    }
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
        setOrders(prev => [newOrder, ...prev]);
        setSelectedOrder(newOrder);
        setIsChatOpen(true);
      }
    } catch (error) {
      console.error('Error creating support chat:', error);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    setOrderToCancel(orderId);
    setIsConfirmCancelOpen(true);
  };

  const confirmCancel = async () => {
    if (!orderToCancel) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderToCancel}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setOrders(orders.map(o => o.id === orderToCancel ? { ...o, status: 'cancelled' } : o));
        setIsConfirmCancelOpen(false);
        setOrderToCancel(null);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
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

  // Filter orders for Overview tab (only active ones)
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

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

              {/* Overview Tab Content */}
              {activeTab === 'overview' && (
                <>
                  {/* Orders (Active Only) */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden mb-6"
                  >
                    <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900">Активные заказы</h2>
                      <Briefcase className="h-5 w-5 text-indigo-600" />
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                      {activeOrders.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          У вас пока нет активных заказов
                        </div>
                      ) : (
                        activeOrders.map((order) => (
                          <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {order.service?.title || 'Чат с менеджером'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                от {formatDate(order.createdAt)}
                              </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {order.status === 'pending' ? 'Ожидает' : 'В работе'}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelOrder(order.id);
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                  title="Закрыть обращение"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
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

                  {/* CMS Sites Summary */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 mb-6"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">Мои CMS Сайты</h2>
                      <button
                        onClick={() => setIsCreateSiteModalOpen(true)}
                        className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Создать сайт
                      </button>
                    </div>

                    {sites.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <Globe className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>У вас пока нет созданных сайтов</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {sites.slice(0, 4).map((site) => (
                          <div key={site.id} className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-gray-900 flex items-center">
                                <Globe className="w-4 h-4 mr-2 text-indigo-500" />
                                {site.domain}
                              </h3>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                site.status === 'active' ? 'bg-green-100 text-green-800' :
                                site.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {site.status === 'active' ? 'Активен' : 
                                 site.status === 'pending' ? 'Настройка' : 'Остановлен'}
                              </span>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                               <button 
                                 onClick={() => navigate(`/cms/${site.id}`)}
                                 className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                               >
                                 <Settings className="w-3 h-3 mr-1" />
                                 Управление
                               </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* Active Projects Summary */}
                  {projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').map(project => (
                    <motion.div 
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 mb-6"
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
                          <span>Дедлайн: {formatDate(project.deadline)}</span>
                        </div>
                      </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                          {project.serverIp && (
                            <div>
                              <span className="block text-gray-400 text-xs">IP Сервера</span>
                              <span className="font-mono">{project.serverIp}</span>
                            </div>
                          )}
                          {project.websiteUrl && (
                            <div>
                              <span className="block text-gray-400 text-xs">Домен</span>
                              <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                {project.websiteUrl}
                              </a>
                            </div>
                          )}
                          {project.siteStatus && (
                            <div>
                              <span className="block text-gray-400 text-xs">Статус сайта</span>
                              <span className={`font-medium ${
                                project.siteStatus === 'up' ? 'text-green-600' : 
                                project.siteStatus === 'down' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {project.siteStatus === 'up' ? 'Работает' : 
                                 project.siteStatus === 'down' ? 'Не работает' : 'Неизвестно'}
                              </span>
                            </div>
                          )}
                        </div>

                        {project.paidUntil && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-500">Оплачено до:</span>
                                    <span className={`font-medium ${new Date(project.paidUntil) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatDate(project.paidUntil)}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleExtend(project.id, 1)}
                                        className="flex-1 text-xs bg-indigo-50 text-indigo-700 py-2 rounded hover:bg-indigo-100 transition-colors"
                                    >
                                        Продлить (1 мес)
                                    </button>
                                    <button 
                                        onClick={() => handleExtend(project.id, 3)}
                                        className="flex-1 text-xs bg-indigo-50 text-indigo-700 py-2 rounded hover:bg-indigo-100 transition-colors"
                                    >
                                        Продлить (3 мес)
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                  ))}
                </>
              )}

              {/* Sites Tab */}
              {activeTab === 'sites' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Все сайты</h2>
                    <button
                      onClick={() => setIsCreateSiteModalOpen(true)}
                      className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Создать сайт
                    </button>
                  </div>

                  {sites.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">У вас нет сайтов</p>
                      <p className="text-sm">Создайте свой первый сайт прямо сейчас!</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {sites.map((site) => (
                        <div key={site.id} className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-all duration-200">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                              <Globe className="w-5 h-5 mr-2 text-indigo-500" />
                              {site.domain}
                            </h3>
                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                              site.status === 'active' ? 'bg-green-100 text-green-800' :
                              site.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {site.status === 'active' ? 'Активен' : 
                               site.status === 'pending' ? 'Настройка' : 'Остановлен'}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-500 space-y-2 mb-6">
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                              <span>Сервер</span>
                              <span className="font-mono text-gray-700">{site.server?.name || 'VDS-1'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                              <span>IP Адрес</span>
                              <span className="font-mono text-gray-700">{site.server?.ipAddress || '192.168.1.1'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Версия CMS</span>
                              <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{site.cmsVersion}</span>
                            </div>
                          </div>

                          <div className="flex gap-3">
                             <button 
                               onClick={() => navigate(`/cms/${site.id}`)}
                               className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                             >
                               <Settings className="w-4 h-4 mr-2" />
                               Редактор
                             </button>
                             <a 
                               href={`http://localhost:5174/preview/${site.id}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                             >
                               <Globe className="w-4 h-4 mr-2" />
                               Просмотр
                             </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Projects Tab */}
              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Мои проекты</h2>
                  {projects.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                      <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Нет активных проектов</h3>
                      <p className="mt-1 text-sm text-gray-500">Закажите услугу разработки, чтобы начать новый проект.</p>
                    </div>
                  ) : (
                    projects.map(project => (
                      <motion.div 
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                            project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            project.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {project.status === 'pending' ? 'Ожидает' :
                             project.status === 'in_progress' ? 'В работе' : 'Отменен'}
                          </span>
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
                            <span>Дедлайн: {formatDate(project.deadline)}</span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                          {project.serverIp && (
                            <div>
                              <span className="block text-gray-400 text-xs">IP Сервера</span>
                              <span className="font-mono">{project.serverIp}</span>
                            </div>
                          )}
                          {project.websiteUrl && (
                            <div>
                              <span className="block text-gray-400 text-xs">Домен</span>
                              <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                {project.websiteUrl}
                              </a>
                            </div>
                          )}
                          {project.siteStatus && (
                            <div>
                              <span className="block text-gray-400 text-xs">Статус сайта</span>
                              <span className={`font-medium ${
                                project.siteStatus === 'up' ? 'text-green-600' : 
                                project.siteStatus === 'down' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {project.siteStatus === 'up' ? 'Работает' : 
                                 project.siteStatus === 'down' ? 'Не работает' : 'Неизвестно'}
                              </span>
                            </div>
                          )}
                        </div>

                        {project.paidUntil && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-500">Оплачено до:</span>
                                    <span className={`font-medium ${new Date(project.paidUntil) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatDate(project.paidUntil)}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleExtend(project.id, 1)}
                                        className="flex-1 text-xs bg-indigo-50 text-indigo-700 py-2 rounded hover:bg-indigo-100 transition-colors"
                                    >
                                        Продлить (1 мес)
                                    </button>
                                    <button 
                                        onClick={() => handleExtend(project.id, 3)}
                                        className="flex-1 text-xs bg-indigo-50 text-indigo-700 py-2 rounded hover:bg-indigo-100 transition-colors"
                                    >
                                        Продлить (3 мес)
                                    </button>
                                </div>
                            </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Финансы</h2>
                  {invoices.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                      <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Нет счетов</h3>
                      <p className="mt-1 text-sm text-gray-500">У вас пока нет выставленных счетов.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Услуга</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действие</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map((invoice) => (
                              <tr key={invoice.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {invoice.title || invoice.service?.title || 'Счет'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {invoice.amount} ₽
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                                    invoice.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : 
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {invoice.status === 'paid' ? 'Оплачен' : 
                                     invoice.status === 'cancelled' ? 'Отменен' : 'Ожидает оплаты'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(invoice.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  {invoice.status === 'pending' && (
                                    <button
                                      onClick={() => handlePayInvoice(invoice.id)}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      Оплатить
                                    </button>
                                  )}
                                  {invoice.status === 'paid' && (
                                    <span className="text-green-600 flex items-center justify-end">
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Оплачено
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Leads Tab - Detailed View */}
              {activeTab === 'leads' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-lg font-medium text-gray-900">Заявки с сайтов</h2>
                    <div className="flex flex-1 w-full md:w-auto gap-2 items-center">
                      <div className="relative flex-1 md:max-w-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Поиск по имени, email..."
                          value={leadSearch}
                          onChange={(e) => setLeadSearch(e.target.value)}
                        />
                      </div>
                      <select
                        value={leadStatusFilter}
                        onChange={(e) => setLeadStatusFilter(e.target.value)}
                        className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="all">Все статусы</option>
                        <option value="new">Новые</option>
                        <option value="contacted">В работе</option>
                        <option value="closed">Закрытые</option>
                      </select>
                      <button 
                        onClick={exportLeads}
                        disabled={leads.length === 0}
                        className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Экспорт в CSV"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {filteredLeads.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                        <Users className="h-full w-full" />
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Заявки не найдены</h3>
                      <p className="mt-1 text-sm text-gray-500">Попробуйте изменить параметры поиска или фильтры.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Контакты</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сообщение</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сайт</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredLeads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(lead.createdAt)} <span className="text-xs text-gray-400">{new Date(lead.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{lead.email}</div>
                                {lead.phone && <div className="text-sm text-gray-500">{lead.phone}</div>}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate" title={lead.message}>{lead.message}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {lead.site?.domain || 'Неизвестно'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  value={lead.status}
                                  onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                  className={`block w-full pl-3 pr-10 py-1 text-xs font-semibold rounded-full border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-xs ${
                                    lead.status === 'new' ? 'bg-green-100 text-green-800' : 
                                    lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' : 
                                    'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  <option value="new">Новая</option>
                                  <option value="contacted">В работе</option>
                                  <option value="closed">Закрыта</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => deleteLead(lead.id)} className="text-red-600 hover:text-red-900">
                                  Удалить
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Requests Tab (All Orders) */}
              {activeTab === 'requests' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Все обращения</h2>
                    <MessageSquare className="h-5 w-5 text-indigo-600" />
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    {orders.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        У вас пока нет обращений
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
                                от {formatDate(order.createdAt)}
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
                               order.status === 'completed' ? 'Выполнен' : 'Закрыт'}
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
              )}

            </div>

            {/* Sidebar - Navigation */}
            <div className="space-y-6">
              <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                <nav className="p-2">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-1 ${
                      activeTab === 'overview' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Briefcase className="mr-3 h-5 w-5" />
                    Обзор
                  </button>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-1 ${
                      activeTab === 'projects' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="mr-3 h-5 w-5" />
                    Проекты
                  </button>
                  <button
                    onClick={() => setActiveTab('sites')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-1 ${
                      activeTab === 'sites' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Globe className="mr-3 h-5 w-5" />
                    Сайты
                  </button>
                  <button
                    onClick={() => setActiveTab('billing')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-1 ${
                      activeTab === 'billing' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard className="mr-3 h-5 w-5" />
                    Финансы
                  </button>
                  <button
                    onClick={() => setActiveTab('leads')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-1 ${
                      activeTab === 'leads' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Users className="mr-3 h-5 w-5" />
                    Заявки
                  </button>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-1 ${
                      activeTab === 'requests' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <MessageSquare className="mr-3 h-5 w-5" />
                    Обращения
                  </button>
                </nav>
              </div>

              {/* Sidebar - Support */}
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
            </div>
          </div>
        </div>
        
        {/* Confirm Cancel Modal */}
        {isConfirmCancelOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity" 
                aria-hidden="true"
                onClick={() => setIsConfirmCancelOpen(false)}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Закрыть обращение
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Вы уверены, что хотите закрыть это обращение? Это действие нельзя будет отменить.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={confirmCancel}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Закрыть обращение
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmCancelOpen(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Site Modal */}
        {isCreateSiteModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 transition-opacity" 
                aria-hidden="true"
                onClick={() => setIsCreateSiteModalOpen(false)}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                      <Globe className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        {createSiteStep === 1 ? 'Создание нового сайта - Шаг 1: Домен' : 'Создание нового сайта - Шаг 2: Шаблон'}
                      </h3>
                      
                      {createSiteStep === 1 && (
                        <div className="mt-4 space-y-4">
                          <p className="text-sm text-gray-500">
                            Введите доменное имя для вашего нового сайта. Вы сможете настроить DNS позже.
                          </p>
                          
                          {!skipDomain && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Домен</label>
                              <div className="mt-1 flex rounded-md shadow-sm">
                                <input
                                  type="text"
                                  value={newSiteDomain}
                                  onChange={(e) => setNewSiteDomain(e.target.value)}
                                  className="block w-full min-w-0 flex-1 rounded-none rounded-l-md border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border"
                                  placeholder={useSubdomain ? "mysite" : "example.com"}
                                />
                                {useSubdomain && (
                                  <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                    .wexa.su
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input
                                id="use-subdomain"
                                type="checkbox"
                                checked={useSubdomain}
                                onChange={(e) => {
                                  setUseSubdomain(e.target.checked);
                                  if (e.target.checked) {
                                    setSkipDomain(false);
                                    setRegisterDomain(false);
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <label htmlFor="use-subdomain" className="ml-2 block text-sm text-gray-900">
                                Использовать бесплатный поддомен (.wexa.su)
                              </label>
                            </div>

                            <div className="flex items-center">
                              <input
                                id="skip-domain"
                                type="checkbox"
                                checked={skipDomain}
                                onChange={(e) => {
                                  setSkipDomain(e.target.checked);
                                  if (e.target.checked) {
                                    setUseSubdomain(false);
                                    setRegisterDomain(false);
                                    setNewSiteDomain('');
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <label htmlFor="skip-domain" className="ml-2 block text-sm text-gray-900">
                                Настроить домен позже
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {createSiteStep === 2 && (
                        <div className="mt-4">
                           <p className="text-sm text-gray-500 mb-4">
                            Выберите шаблон для вашего сайта. Вы сможете изменить содержимое позже.
                          </p>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto pr-2">
                            {templates.map(template => (
                              <div 
                                key={template.id}
                                onClick={() => setSelectedTemplate(template.id)}
                                className={`cursor-pointer rounded-lg border p-4 hover:shadow-md transition-all ${selectedTemplate === template.id ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
                              >
                                <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded mb-3 overflow-hidden flex items-center justify-center">
                                  {template.preview ? (
                                    <img src={template.preview} alt={template.title} className="object-cover w-full h-32" />
                                  ) : (
                                    <span className="text-gray-400">Нет превью</span>
                                  )}
                                </div>
                                <h4 className="font-medium text-gray-900">{template.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  {createSiteStep === 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!skipDomain && !newSiteDomain.trim()) return;
                        setCreateSiteStep(2);
                      }}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Далее
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreateSite}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Создать сайт
                    </button>
                  )}
                  
                  {createSiteStep === 2 && (
                     <button
                       type="button"
                       onClick={() => setCreateSiteStep(1)}
                       className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                     >
                       Назад
                     </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateSiteModalOpen(false);
                      setCreateSiteStep(1);
                    }}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {isChatOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div 
                className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                onClick={() => setIsChatOpen(false)}
              ></div>
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="bg-indigo-700 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-white">
                          {selectedOrder.service?.title || 'Чат с поддержкой'}
                        </h2>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                            onClick={() => setIsChatOpen(false)}
                          >
                            <span className="sr-only">Close panel</span>
                            <X className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-indigo-300">
                          Заказ #{selectedOrder.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50" id="messages-container">
                      <div className="space-y-4">
                        {messages.length === 0 ? (
                          <div className="text-center text-gray-500 py-10">
                            <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                            <p>Напишите первое сообщение</p>
                          </div>
                        ) : (
                          messages.map((msg) => (
                            <div 
                              key={msg.id} 
                              className={`flex flex-col ${msg.sender?.role === 'admin' ? 'items-start' : 'items-end'}`}
                            >
                              <div 
                                className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                                  msg.sender?.role === 'admin' 
                                    ? 'bg-white border border-gray-200 text-gray-900' 
                                    : 'bg-indigo-600 text-white'
                                }`}
                              >
                                <p>{msg.content}</p>
                              </div>
                              <span className="text-xs text-gray-400 mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                      <form onSubmit={handleSendMessage} className="flex gap-x-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                          placeholder="Введите сообщение..."
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </Layout>
  );
};

export default ClientDashboard;
