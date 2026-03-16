import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { motion } from 'framer-motion';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  FileText,
  Plus,
  Trash2,
  Edit2,
  X,
  Image as ImageIcon,
  CreditCard,
  CheckCircle,
  Send,
  Loader,
  Server,
  Terminal,
  Globe,
  RefreshCw,
  MessageCircle,
  Settings
} from 'lucide-react';

interface ServerNode {
  id: string;
  name: string;
  ipAddress: string;
  status: 'active' | 'inactive' | 'provisioning';
  token: string;
  capacity: number;
  currentLoad: number;
  createdAt: string;
}

interface Site {
  id: string;
  domain: string;
  status: string;
  cmsVersion: string;
  createdAt: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  features: string[];
  icon: string;
  color: string;
  hidden?: boolean;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  github: string;
  category: string;
  tags: string[];
}

interface Feedback {
  id: string;
  email: string;
  telegram?: string;
  message: string;
  status: 'new' | 'read' | 'contacted';
  createdAt: string;
}

interface HostingNode {
  id: string;
  name: string;
  ip: string;
  sshPort: number;
  sshUser?: string;
  sshPassword?: string;
  totalRam: number;
  supportedGames?: string[];
  slotPrice?: number;
  slotPrices?: Record<string, number>;
  status: string;
}

interface GameServerItem {
  id: string;
  name: string;
  game: string;
  port: number;
  ram?: number;
  status: string;
  userId: string;
  nodeId: string;
  user?: User;
  node?: HostingNode;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Invoice {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  type: 'one_time' | 'monthly';
  dueDate: string;
  userId: string;
  serviceId?: string;
  user?: User;
  service?: Service;
}

interface Project {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  budget: number;
  deadline: string;
  progress: number;
  clientId: string;
  client?: User;
  serverIp?: string;
  websiteUrl?: string;
  siteStatus?: 'up' | 'down' | 'unknown';
  paidUntil?: string;
  monthlyRate?: number;
  sshUsername?: string;
  sshPassword?: string;
  pm2ProcessName?: string;
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
    price?: string;
  };
  user?: Partial<User>;
}

const formatDate = (date: string | Date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'portfolio' | 'users' | 'invoices' | 'projects' | 'orders' | 'discussions' | 'websites' | 'servers' | 'feedback' | 'hosting_nodes' | 'game_servers'>('dashboard');
  const [services, setServices] = useState<Service[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [hostingNodes, setHostingNodes] = useState<HostingNode[]>([]);
  const [gameServers, setGameServers] = useState<GameServerItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [servers, setServers] = useState<ServerNode[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Partial<Service>>({});
  
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [currentPortfolioItem, setCurrentPortfolioItem] = useState<Partial<PortfolioItem>>({});

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({
    type: 'one_time',
    status: 'pending'
  });
  
  const [isProjectInvoiceModalOpen, setIsProjectInvoiceModalOpen] = useState(false);
  const [invoicePeriod, setInvoicePeriod] = useState(1);
  const [selectedUserForInvoice, setSelectedUserForInvoice] = useState<User | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({
    status: 'pending',
    progress: 0,
    serverIp: '',
    websiteUrl: ''
  });

  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [isNodeGamesModalOpen, setIsNodeGamesModalOpen] = useState(false);
  const [isGameServerModalOpen, setIsGameServerModalOpen] = useState(false);
  const [currentNode, setCurrentNode] = useState<Partial<HostingNode>>({});
  const [currentGameServer, setCurrentGameServer] = useState<Partial<GameServerItem>>({});
  
  // User Profile Modal State
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<Partial<User> | null>(null);

  // Server Modal State
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [newServer, setNewServer] = useState({ name: '', ipAddress: '', capacity: 10 });
  const [showToken, setShowToken] = useState<string | null>(null);
  
  // Server Sites Modal
  const [viewServerSites, setViewServerSites] = useState<string | null>(null);
  const [serverSites, setServerSites] = useState<Site[]>([]);
  const [loadingServerSites, setLoadingServerSites] = useState(false);

  const fetchServerSites = async (serverId: string) => {
    try {
      setLoadingServerSites(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/servers/${serverId}/sites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setServerSites(data);
        setViewServerSites(serverId);
      }
    } catch (error) {
      console.error('Error fetching server sites:', error);
    } finally {
      setLoadingServerSites(false);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот сайт? Это действие нельзя отменить.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setServerSites(serverSites.filter(s => s.id !== siteId));
        // Update server load locally
        if (viewServerSites) {
            setServers(prev => prev.map(s => 
                s.id === viewServerSites 
                ? { ...s, currentLoad: Math.max(0, s.currentLoad - 1) } 
                : s
            ));
        }
      }
    } catch (error) {
      console.error('Error deleting site:', error);
    }
  };

  const [websiteFilters, setWebsiteFilters] = useState({
    status: 'all', // all, up, down
    payment: 'all' // all, paid, unpaid
  });

  const isUserPaid = (userId: string) => {
    return invoices.some(inv => 
      inv.userId === userId && 
      inv.type === 'monthly' && 
      inv.status === 'paid' && 
      new Date(inv.dueDate) > new Date()
    );
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedOrder && isChatOpen) {
      // Mark messages as read locally when opening chat
      setOrders(prev => prev.map(o => 
        o.id === selectedOrder.id ? { ...o, unreadCount: 0 } : o
      ));
      
      fetchMessages(selectedOrder.id);
      const interval = setInterval(() => fetchMessages(selectedOrder.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedOrder, isChatOpen]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };

      const [servicesRes, portfolioRes, usersRes, invoicesRes, projectsRes, ordersRes, serversRes, feedbacksRes, nodesRes, gameServersRes] = await Promise.all([
        fetch('/api/services/admin', { headers }),
        fetch('/api/portfolio'),
        fetch('/api/users', { headers }),
        fetch('/api/invoices/all', { headers }),
        fetch('/api/projects', { headers }),
        fetch('/api/orders', { headers }),
        fetch('/api/servers', { headers }),
        fetch('/api/feedback', { headers }),
        fetch('/api/nodes', { headers }),
        fetch('/api/game-servers', { headers })
      ]);
      
      const servicesData = servicesRes.ok ? await servicesRes.json() : [];
      const portfolioData = portfolioRes.ok ? await portfolioRes.json() : [];
      
      if (Array.isArray(servicesData)) setServices(servicesData);
      if (Array.isArray(portfolioData)) setPortfolioItems(portfolioData);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (Array.isArray(usersData)) setUsers(usersData);
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        if (Array.isArray(invoicesData)) setInvoices(invoicesData);
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        if (Array.isArray(projectsData)) setProjects(projectsData);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (Array.isArray(ordersData)) setOrders(ordersData);
      }

      if (serversRes.ok) {
        const serversData = await serversRes.json();
        if (Array.isArray(serversData)) setServers(serversData);
      }

      if (feedbacksRes.ok) {
        const feedbacksData = await feedbacksRes.json();
        if (Array.isArray(feedbacksData)) setFeedbacks(feedbacksData);
      }

      if (nodesRes.ok) {
          const nodesData = await nodesRes.json();
          if (Array.isArray(nodesData)) setHostingNodes(nodesData);
      }

      if (gameServersRes.ok) {
          const gsData = await gameServersRes.json();
          if (Array.isArray(gsData)) setGameServers(gsData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers,
        body: JSON.stringify(newServer),
      });

      if (response.ok) {
        const createdServer = await response.json();
        setServers([createdServer, ...servers]);
        setNewServer({ name: '', ipAddress: '', capacity: 10 });
        setIsServerModalOpen(false);
        setShowToken(createdServer.token);
      }
    } catch (error) {
      console.error('Error creating server:', error);
    }
  };

  const handleDeleteServer = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this server? This cannot be undone.')) return;
    try {
      const headers = getAuthHeaders();
      await fetch(`/api/servers/${id}`, {
        method: 'DELETE',
        headers,
      });
      setServers(servers.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting server:', error);
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

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        fetchData();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status });
        }
      } else {
        alert('Ошибка при обновлении статуса заказа');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Service Handlers
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = currentService.id ? `/api/services/${currentService.id}` : '/api/services';
      const method = currentService.id ? 'PUT' : 'POST';
      
      const serviceData = {
        ...currentService,
        features: Array.isArray(currentService.features) 
          ? currentService.features 
          : (currentService.features as unknown as string || '').split(',').map((f: string) => f.trim())
      };

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(serviceData)
      });

      if (res.ok) {
        setIsServiceModalOpen(false);
        fetchData();
        setCurrentService({});
      }
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту услугу?')) return;
    try {
      await fetch(`/api/services/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  // Portfolio Handlers
  const handleSavePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = currentPortfolioItem.id ? `/api/portfolio/${currentPortfolioItem.id}` : '/api/portfolio';
      const method = currentPortfolioItem.id ? 'PUT' : 'POST';
      
      const portfolioData = {
        ...currentPortfolioItem,
        tags: Array.isArray(currentPortfolioItem.tags)
          ? currentPortfolioItem.tags
          : (currentPortfolioItem.tags as unknown as string || '').split(',').map((t: string) => t.trim())
      };

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(portfolioData)
      });

      if (res.ok) {
        setIsPortfolioModalOpen(false);
        fetchData();
        setCurrentPortfolioItem({});
      }
    } catch (error) {
      console.error('Error saving portfolio item:', error);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту работу?')) return;
    try {
      await fetch(`/api/portfolio/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
    }
  };

  // Project Handlers
  const handleOpenUserProfile = (user: Partial<User>) => {
    setSelectedUserProfile(user);
    setIsUserProfileOpen(true);
  };
  
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = currentProject.id ? `/api/projects/${currentProject.id}` : '/api/projects';
      const method = currentProject.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(currentProject)
      });

      if (res.ok) {
        setIsProjectModalOpen(false);
        fetchData();
        setCurrentProject({ status: 'pending', progress: 0, serverIp: '', websiteUrl: '' });
      } else {
        alert('Ошибка при сохранении проекта');
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот проект?')) return;
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  // Invoice Handlers
  const openInvoiceModal = (user: User) => {
    setSelectedUserForInvoice(user);
    setCurrentInvoice({
      userId: user.id,
      type: 'one_time',
      status: 'pending',
      amount: 0,
      title: '',
      dueDate: new Date().toISOString().split('T')[0] // Today
    });
    setIsInvoiceModalOpen(true);
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForInvoice) return;

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...currentInvoice,
          userId: selectedUserForInvoice.id
        })
      });

      if (res.ok) {
        setIsInvoiceModalOpen(false);
        fetchData(); // Refresh data to show new invoice if needed (e.g. in user history)
        setCurrentInvoice({ type: 'one_time', status: 'pending' });
        setSelectedUserForInvoice(null);
        alert('Счет успешно создан');
      } else {
        const error = await res.json();
        alert(`Ошибка: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Ошибка при создании счета');
    }
  };

  const handleUpdateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        fetchData();
      } else {
        alert('Ошибка при обновлении статуса счета');
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот счет?')) return;
    try {
      await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const handleCreateProjectInvoice = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/invoices/subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ projectId: currentProject.id, months: invoicePeriod })
        });
        
        if (res.ok) {
            setIsProjectInvoiceModalOpen(false);
            alert('Счет успешно создан!');
        } else {
            alert('Ошибка создания счета');
        }
    } catch (error) {
        console.error(error);
        alert('Ошибка');
    }
  };

  const handleSaveNode = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/nodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(currentNode)
        });
        if (res.ok) {
            setIsNodeModalOpen(false);
            fetchData();
        }
    } catch (error) {
        console.error(error);
    }
  };

  const handleSaveNodeGames = async () => {
    if (!currentNode.id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/nodes/${currentNode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          supportedGames: currentNode.supportedGames || [],
          slotPrices: currentNode.slotPrices || {},
          slotPrice: Number.isFinite(Number(currentNode.slotPrice)) ? Number(currentNode.slotPrice) : 10
        })
      });
      if (res.ok) {
        setIsNodeGamesModalOpen(false);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error(error);
      alert('Ошибка сохранения');
    }
  };

  const handleSaveGameServer = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/game-servers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(currentGameServer)
        });
        if (res.ok) {
            setIsGameServerModalOpen(false);
            fetchData();
        } else {
            const err = await res.json();
            alert('Ошибка: ' + err.message);
        }
    } catch (error) {
        console.error(error);
    }
  };
  
  const handleControlGameServer = async (id: string, action: 'start' | 'stop' | 'restart') => {
      try {
          const token = localStorage.getItem('token');
          await fetch(`/api/game-servers/${id}/control`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ action })
          });
          fetchData();
      } catch (error) {
          console.error(error);
      }
  };

  const stats = [
    { title: 'Активные услуги', value: services.length, icon: Briefcase, color: 'bg-blue-500' },
    { title: 'Работы в портфолио', value: portfolioItems.length, icon: ImageIcon, color: 'bg-purple-500' },
    { title: 'Пользователи', value: users.length, icon: Users, color: 'bg-green-500' },
    { title: 'Заказы', value: orders.length, icon: CheckCircle, color: 'bg-indigo-500' },
    { title: 'Выставлено счетов', value: invoices.length, icon: FileText, color: 'bg-yellow-500' },
    { title: 'Активные проекты', value: projects.length, icon: TrendingUp, color: 'bg-red-500' },
    { title: 'Новые сообщения', value: feedbacks.filter(f => f.status === 'new').length, icon: MessageCircle, color: 'bg-pink-500' },
  ];

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
          
          {/* Header */}
          <div className="mb-8 flex flex-col justify-between sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Панель Администратора</h1>
              <p className="mt-1 text-gray-500">Управление контентом и статистика</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {[
                { id: 'dashboard', label: 'Обзор' },
                { id: 'services', label: 'Услуги' },
                { id: 'portfolio', label: 'Портфолио' },
                { id: 'orders', label: 'Заказы' },
                { id: 'discussions', label: 'Обсуждения' },
                { id: 'users', label: 'Пользователи' },
                { id: 'websites', label: 'Сайты' },
                { id: 'invoices', label: 'Счета' },
                { id: 'projects', label: 'Проекты' },
                { id: 'servers', label: 'Серверы' },
                { id: 'feedback', label: 'Обратная связь' },
                { id: 'hosting_nodes', label: 'Локации (VDS)' },
                { id: 'game_servers', label: 'Игровые серверы' }
              ].map((tab) => {
                let badgeCount = 0;
                let badgeColor = 'bg-red-500';

                if (tab.id === 'orders') {
                  badgeCount = orders.filter(o => o.service && o.status === 'pending').length;
                } else if (tab.id === 'discussions') {
                  badgeCount = orders.filter(o => !o.service).reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);
                } else if (tab.id === 'websites') {
                  badgeCount = projects.filter(p => p.siteStatus === 'down').length;
                } else if (tab.id === 'feedback') {
                  badgeCount = feedbacks.filter(f => f.status === 'new').length;
                }

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium relative flex items-center
                      ${activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                    `}
                  >
                    {tab.label}
                    {badgeCount > 0 && (
                      <span className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white rounded-full ${badgeColor}`}>
                        {badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          {activeTab === 'dashboard' && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center">
                    <div className={`rounded-lg ${stat.color} p-3 text-white`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'services' && (
            <div>
              <div className="mb-6 flex justify-end">
                <button
                  onClick={() => {
                    setCurrentService({});
                    setIsServiceModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить услугу
                </button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <div key={service.id} className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 relative group">
                    <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setCurrentService(service);
                          setIsServiceModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                    <p className="text-indigo-600 font-medium mt-1">{service.price}</p>
                    <p className="mt-2 text-gray-500 text-sm line-clamp-3">{service.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div>
              <div className="mb-6 flex justify-end">
                <button
                  onClick={() => {
                    setCurrentPortfolioItem({});
                    setIsPortfolioModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить работу
                </button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {portfolioItems.map((item) => (
                  <div key={item.id} className="rounded-xl bg-white overflow-hidden shadow-sm border border-gray-100 group relative">
                    <div className="aspect-video w-full overflow-hidden bg-gray-100">
                      <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg p-1 shadow-sm">
                      <button
                        onClick={() => {
                          setCurrentPortfolioItem(item);
                          setIsPortfolioModalOpen(true);
                        }}
                        className="p-2 text-gray-600 hover:text-indigo-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePortfolio(item.id)}
                        className="p-2 text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-indigo-600 mb-2">{item.category}</p>
                      <p className="text-gray-500 text-sm line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Дата</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Услуга</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.filter(order => order.service).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 cursor-pointer hover:text-indigo-600" onClick={() => order.user && handleOpenUserProfile(order.user)}>
                            {order.id.slice(0, 8)}...
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 cursor-pointer hover:text-indigo-600" onClick={() => order.user && handleOpenUserProfile(order.user)}>
                            {order.user?.name}
                          </div>
                          <div className="text-sm text-gray-500">{order.user?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.service?.title || 'Услуга удалена'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                            className={`rounded-full px-2 py-1 text-xs font-semibold leading-5 border-none focus:ring-0 cursor-pointer ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            <option value="pending">Ожидает</option>
                            <option value="in_progress">В работе</option>
                            <option value="completed">Выполнен</option>
                            <option value="cancelled">Отменен</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsChatOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 relative mr-4"
                          >
                            Чат
                            {order.unreadCount ? (
                              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                                {order.unreadCount}
                              </span>
                            ) : null}
                          </button>
                          
                          {order.status !== 'pending' && (
                            <button
                              onClick={() => {
                                setCurrentProject({
                                  title: `Проект: ${order.service?.title || 'Новый проект'}`,
                                  clientId: order.user?.id || '',
                                  budget: order.service?.price ? parseFloat(order.service.price) : 0,
                                  status: 'pending',
                                  progress: 0
                                });
                                setIsProjectModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              Создать проект
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'discussions' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Дата</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.filter(order => !order.service).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 cursor-pointer hover:text-indigo-600" onClick={() => order.user && handleOpenUserProfile(order.user)}>
                            {order.id.slice(0, 8)}...
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 cursor-pointer hover:text-indigo-600" onClick={() => order.user && handleOpenUserProfile(order.user)}>
                            {order.user?.name}
                          </div>
                          <div className="text-sm text-gray-500">{order.user?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status === 'pending' ? 'Открыт' :
                             order.status === 'in_progress' ? 'В работе' :
                             order.status === 'completed' ? 'Закрыт' : 'Отменен'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsChatOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 relative"
                          >
                            Чат
                            {order.unreadCount ? (
                              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                                {order.unreadCount}
                              </span>
                            ) : null}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {orders.filter(order => !order.service).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                          Нет активных обсуждений
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}



          {activeTab === 'servers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Управление VDS серверами</h2>
                <div className="flex gap-2">
                  <button
                    onClick={fetchData}
                    className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Обновить данные"
                  >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsServerModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Добавить сервер
                  </button>
                </div>
              </div>
              
              {showToken && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-green-800">Токен сервера создан!</h3>
                      <p className="mt-1 text-sm text-green-700">
                        Сохраните этот токен. Он показывается только один раз.
                      </p>
                      <code className="mt-2 block bg-white px-3 py-1 rounded border border-green-200 font-mono text-sm">
                        {showToken}
                      </code>
                    </div>
                    <button onClick={() => setShowToken(null)} className="text-green-600 hover:text-green-800">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {servers.map((server) => (
                  <div key={server.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Server className="h-6 w-6 text-indigo-600 mr-2" />
                          <h3 className="text-lg leading-6 font-medium text-gray-900">{server.name}</h3>
                        </div>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          server.status === 'active' ? 'bg-green-100 text-green-800' :
                          server.status === 'provisioning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {server.status === 'active' ? 'Активен' : 
                           server.status === 'provisioning' ? 'Настройка' : 'Неактивен'}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>IP Адрес:</span>
                          <span className="font-mono">{server.ipAddress || 'Ожидание...'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Нагрузка:</span>
                          <span>{server.currentLoad} / {server.capacity} сайтов</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Создан:</span>
                          <span>{formatDate(server.createdAt)}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <button
                          onClick={() => setShowToken(server.token)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center"
                        >
                          <Terminal className="w-4 h-4 mr-1" />
                          Токен настройки
                        </button>
                        <button
                          onClick={() => fetchServerSites(server.id)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center"
                        >
                          <Globe className="w-4 h-4 mr-1" />
                          Сайты
                        </button>
                        <button
                          onClick={() => handleDeleteServer(server.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {servers.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Server className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Нет серверов</h3>
                    <p className="mt-1 text-sm text-gray-500">Добавьте первый VDS сервер для начала работы.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setIsServerModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Добавить сервер
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Server Modal */}
          {isServerModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Добавить VDS сервер</h2>
                  <button onClick={() => setIsServerModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleAddServer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Название сервера</label>
                    <input
                      type="text"
                      required
                      value={newServer.name}
                      onChange={e => setNewServer({...newServer, name: e.target.value})}
                      placeholder="My VDS 1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700">IP Адрес (необязательно)</label>
                    <input
                      type="text"
                      value={newServer.ipAddress}
                      onChange={e => setNewServer({...newServer, ipAddress: e.target.value})}
                      placeholder="192.168.1.1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Вместимость (сайтов)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newServer.capacity}
                      onChange={e => setNewServer({...newServer, capacity: parseInt(e.target.value)})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsServerModalOpen(false)}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                      Добавить
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Server Sites Modal */}
          {viewServerSites && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[80vh] flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Сайты на сервере</h2>
                  <button onClick={() => setViewServerSites(null)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {loadingServerSites ? (
                    <div className="flex justify-center py-10">
                      <Loader className="animate-spin text-indigo-600 h-8 w-8" />
                    </div>
                  ) : serverSites.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      На этом сервере нет сайтов.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {serverSites.map(site => (
                        <div key={site.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div>
                            <h3 className="font-medium text-gray-900">{site.domain}</h3>
                            <p className="text-xs text-gray-500">Создан: {formatDate(site.createdAt)}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              site.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {site.status === 'active' ? 'Активен' : 'Настройка'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteSite(site.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition-colors"
                            title="Удалить сайт"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Пользователь
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Роль
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-200" onClick={() => handleOpenUserProfile(user)}>
                              <span className="text-indigo-600 font-medium text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 cursor-pointer hover:text-indigo-600" onClick={() => handleOpenUserProfile(user)}>
                                {user.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role === 'admin' ? 'Администратор' : 'Клиент'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openInvoiceModal(user)}
                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Выставить счет
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'websites' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Статус сайта</label>
                  <select
                    value={websiteFilters.status}
                    onChange={(e) => setWebsiteFilters({...websiteFilters, status: e.target.value})}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  >
                    <option value="all">Все</option>
                    <option value="up">Работает</option>
                    <option value="down">Не работает</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Оплата</label>
                  <select
                    value={websiteFilters.payment}
                    onChange={(e) => setWebsiteFilters({...websiteFilters, payment: e.target.value})}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                  >
                    <option value="all">Все</option>
                    <option value="paid">Оплачено</option>
                    <option value="unpaid">Не оплачено</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сайт</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус сайта</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Оплата</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects
                        .filter(p => p.websiteUrl)
                        .filter(p => {
                          if (websiteFilters.status === 'up' && p.siteStatus !== 'up') return false;
                          if (websiteFilters.status === 'down' && p.siteStatus !== 'down') return false;
                          
                          const paid = isUserPaid(p.clientId);
                          if (websiteFilters.payment === 'paid' && !paid) return false;
                          if (websiteFilters.payment === 'unpaid' && paid) return false;
                          
                          return true;
                        })
                        .map(project => {
                          const client = users.find(u => u.id === project.clientId);
                          const paid = isUserPaid(project.clientId);
                          return (
                            <tr key={project.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{client?.name || 'Unknown'}</div>
                                <div className="text-xs text-gray-500">{client?.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-900">
                                  {project.websiteUrl}
                                </a>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  project.siteStatus === 'up' ? 'bg-green-100 text-green-800' : 
                                  project.siteStatus === 'down' ? 'bg-red-100 text-red-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {project.siteStatus === 'up' ? 'Работает' : 
                                   project.siteStatus === 'down' ? 'Не работает' : 'Неизвестно'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {paid ? 'Оплачено' : 'Не оплачено'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Название
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Клиент
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Сумма
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{invoice.title}</div>
                          <div className="text-xs text-gray-500">{invoice.type === 'monthly' ? 'Подписка' : 'Разовый'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{users.find(u => u.id === invoice.userId)?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{users.find(u => u.id === invoice.userId)?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{invoice.amount} ₽</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={invoice.status}
                            onChange={(e) => handleUpdateInvoiceStatus(invoice.id, e.target.value as any)}
                            className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${
                              invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                              invoice.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            <option value="pending">Ожидает</option>
                            <option value="paid">Оплачен</option>
                            <option value="cancelled">Отменен</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div>
              <div className="mb-6 flex justify-end">
                <button
                  onClick={() => {
                    setCurrentProject({ status: 'pending', progress: 0 });
                    setIsProjectModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Создать проект
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Проект</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Бюджет</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Оплата</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{project.title}</div>
                            <div className="text-xs text-gray-500">До: {formatDate(project.deadline)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {project.client?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {project.budget} ₽
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {project.paidUntil ? (
                                <span className={new Date(project.paidUntil) < new Date() ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                                {new Date(project.paidUntil).toLocaleDateString('ru-RU')}
                                </span>
                            ) : (
                                <span className="text-gray-400">Не оплачено</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              project.status === 'completed' ? 'bg-green-100 text-green-800' :
                              project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              project.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {project.status === 'pending' ? 'Ожидает' :
                               project.status === 'in_progress' ? 'В работе' :
                               project.status === 'completed' ? 'Готов' : 'Отменен'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setCurrentProject(project);
                                setInvoicePeriod(1);
                                setIsProjectInvoiceModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-900 mr-3"
                              title="Выставить счет"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setCurrentProject(project);
                                setIsProjectModalOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Service Modal */}
          {isServiceModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {currentService.id ? 'Редактировать услугу' : 'Новая услуга'}
                  </h2>
                  <button onClick={() => setIsServiceModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleSaveService} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Название</label>
                    <input
                      type="text"
                      required
                      value={currentService.title || ''}
                      onChange={e => setCurrentService({...currentService, title: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Цена</label>
                    <input
                      type="text"
                      required
                      value={currentService.price || ''}
                      onChange={e => setCurrentService({...currentService, price: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Описание</label>
                    <textarea
                      required
                      rows={3}
                      value={currentService.description || ''}
                      onChange={e => setCurrentService({...currentService, description: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Особенности (через запятую)</label>
                    <input
                      type="text"
                      value={Array.isArray(currentService.features) ? currentService.features.join(', ') : currentService.features || ''}
                      onChange={e => setCurrentService({...currentService, features: e.target.value.split(',').map(s => s.trim())})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Иконка (Lucide React name)</label>
                    <input
                      type="text"
                      required
                      value={currentService.icon || ''}
                      onChange={e => setCurrentService({...currentService, icon: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Цвет (Tailwind класс, например bg-indigo-500)</label>
                    <input
                      type="text"
                      value={currentService.color || 'bg-indigo-500'}
                      onChange={e => setCurrentService({...currentService, color: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="service-hidden"
                      type="checkbox"
                      checked={Boolean(currentService.hidden)}
                      onChange={e => setCurrentService({ ...currentService, hidden: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="service-hidden" className="text-sm font-medium text-gray-700">
                      Скрыть услугу
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4 col-span-2">
                    <button
                      type="button"
                      onClick={() => setIsServiceModalOpen(false)}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                      Сохранить
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* User Profile Modal */}
          {isUserProfileOpen && selectedUserProfile && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-900">
                    Профиль пользователя: {selectedUserProfile.name}
                  </h3>
                  <button 
                    onClick={() => setIsUserProfileOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-lg text-gray-900">{selectedUserProfile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Роль</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedUserProfile.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedUserProfile.role === 'admin' ? 'Администратор' : 'Клиент'}
                      </span>
                    </div>
                  </div>

                  {/* User Orders */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Заказы</h4>
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">ID / Дата</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Услуга</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Статус</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {orders.filter(o => o.user?.email === selectedUserProfile.email).length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">Нет заказов</td>
                            </tr>
                          ) : (
                            orders.filter(o => o.user?.email === selectedUserProfile.email).map((order) => (
                              <tr key={order.id}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                  {order.id.slice(0, 8)}... <br/>
                                  <span className="text-gray-500 font-normal">{formatDate(order.createdAt)}</span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  {order.service?.title || 'Чат с менеджером'}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {order.status === 'pending' ? 'Открыт' :
                                     order.status === 'in_progress' ? 'В работе' :
                                     order.status === 'completed' ? 'Закрыт' : 'Отменен'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* User Projects */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Проекты</h4>
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Название</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Статус</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Прогресс</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {projects.filter(p => p.client?.email === selectedUserProfile.email).length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">Нет проектов</td>
                            </tr>
                          ) : (
                            projects.filter(p => p.client?.email === selectedUserProfile.email).map((project) => (
                              <tr key={project.id}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                  {project.title}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    project.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    project.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {project.status === 'pending' ? 'Ожидает' :
                                     project.status === 'in_progress' ? 'В работе' :
                                     project.status === 'completed' ? 'Готов' : 'Отменен'}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5 w-24">
                                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                                  </div>
                                  <span className="text-xs text-gray-500 mt-1">{project.progress}%</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telegram</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сообщение</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {feedbacks.map((feedback) => (
                      <tr key={feedback.id} className={feedback.status === 'new' ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(feedback.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {feedback.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {feedback.telegram || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={feedback.message}>
                          {feedback.message}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            feedback.status === 'new' ? 'bg-green-100 text-green-800' :
                            feedback.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {feedback.status === 'new' ? 'Новое' :
                             feedback.status === 'contacted' ? 'Связались' : 'Прочитано'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {feedback.status === 'new' && (
                            <button
                              onClick={async () => {
                                const token = localStorage.getItem('token');
                                await fetch(`/api/feedback/${feedback.id}`, {
                                    method: 'PUT',
                                    headers: { 
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}` 
                                    },
                                    body: JSON.stringify({ status: 'read' })
                                });
                                setFeedbacks(feedbacks.map(f => f.id === feedback.id ? { ...f, status: 'read' } : f));
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                              title="Отметить как прочитанное"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={async () => {
                                if (!confirm('Удалить?')) return;
                                const token = localStorage.getItem('token');
                                await fetch(`/api/feedback/${feedback.id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                setFeedbacks(feedbacks.filter(f => f.id !== feedback.id));
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'hosting_nodes' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">VDS Ноды</h2>
                <button
                  onClick={() => {
                    setCurrentNode({});
                    setIsNodeModalOpen(true);
                  }}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Добавить ноду
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SSH Port</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RAM</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цена/слот</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hostingNodes.map((node) => (
                      <tr key={node.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{node.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{node.ip}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{node.sshPort}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{node.totalRam} MB</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {`MC:${Number.isFinite(Number(node.slotPrices?.minecraft)) ? Number(node.slotPrices?.minecraft) : (Number.isFinite(Number(node.slotPrice)) ? Number(node.slotPrice) : 10)} ₽ | CS2:${Number.isFinite(Number(node.slotPrices?.cs2)) ? Number(node.slotPrices?.cs2) : (Number.isFinite(Number(node.slotPrice)) ? Number(node.slotPrice) : 10)} ₽ | CS16:${Number.isFinite(Number(node.slotPrices?.cs16)) ? Number(node.slotPrices?.cs16) : (Number.isFinite(Number(node.slotPrice)) ? Number(node.slotPrice) : 10)} ₽`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {node.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center gap-3">
                            <button
                              onClick={() => {
                                setCurrentNode({
                                  ...node,
                                  supportedGames: Array.isArray(node.supportedGames) ? node.supportedGames : ['minecraft', 'cs2', 'cs16'],
                                  slotPrice: Number.isFinite(Number(node.slotPrice)) ? Number(node.slotPrice) : 10,
                                  slotPrices: (node.slotPrices && typeof node.slotPrices === 'object') ? node.slotPrices : undefined
                                });
                                setIsNodeGamesModalOpen(true);
                              }}
                              className="text-gray-600 hover:text-gray-900"
                              title="Доступные игры"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                            <button onClick={async () => {
                                if(confirm('Удалить?')) {
                                    const token = localStorage.getItem('token');
                                    await fetch(`/api/nodes/${node.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                                    fetchData();
                                }
                            }} className="text-red-600 hover:text-red-900">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isNodeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Добавить Ноду</h2>
                <div className="space-y-4">
                    <input type="text" placeholder="Название (MSK-1)" className="w-full p-2 border rounded" value={currentNode.name || ''} onChange={e => setCurrentNode({...currentNode, name: e.target.value})} />
                    <input type="text" placeholder="IP" className="w-full p-2 border rounded" value={currentNode.ip || ''} onChange={e => setCurrentNode({...currentNode, ip: e.target.value})} />
                    <input type="number" placeholder="SSH Port (22)" className="w-full p-2 border rounded" value={currentNode.sshPort || 22} onChange={e => setCurrentNode({...currentNode, sshPort: parseInt(e.target.value)})} />
                    <input type="text" placeholder="SSH User (root)" className="w-full p-2 border rounded" value={currentNode.sshUser || 'root'} onChange={e => setCurrentNode({...currentNode, sshUser: e.target.value})} />
                    <input type="password" placeholder="SSH Password" className="w-full p-2 border rounded" value={currentNode.sshPassword || ''} onChange={e => setCurrentNode({...currentNode, sshPassword: e.target.value})} />
                    <input type="number" placeholder="Total RAM (MB)" className="w-full p-2 border rounded" value={currentNode.totalRam || 0} onChange={e => setCurrentNode({...currentNode, totalRam: parseInt(e.target.value)})} />
                    
                    <div className="flex justify-end gap-2 pt-4">
                        <button onClick={() => setIsNodeModalOpen(false)} className="px-4 py-2 border rounded">Отмена</button>
                        <button onClick={handleSaveNode} className="px-4 py-2 bg-indigo-600 text-white rounded">Сохранить</button>
                    </div>
                </div>
              </div>
            </div>
          )}

          {isNodeGamesModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Доступные игры</h2>
                  <button onClick={() => setIsNodeGamesModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    { id: 'minecraft', label: 'Minecraft (Java)' },
                    { id: 'cs2', label: 'CS 2' },
                    { id: 'cs16', label: 'CS 1.6' }
                  ].map(g => (
                    <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Array.isArray(currentNode.supportedGames) ? currentNode.supportedGames.includes(g.id) : false}
                        onChange={(e) => {
                          const current = Array.isArray(currentNode.supportedGames) ? currentNode.supportedGames : [];
                          const next = e.target.checked ? Array.from(new Set([...current, g.id])) : current.filter(x => x !== g.id);
                          setCurrentNode({ ...currentNode, supportedGames: next });
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{g.label}</span>
                    </label>
                  ))}
                </div>
                <div className="pt-5 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Цена за слот: Minecraft (₽)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full p-2 border rounded"
                      value={Number.isFinite(Number(currentNode.slotPrices?.minecraft)) ? Number(currentNode.slotPrices?.minecraft) : (Number.isFinite(Number(currentNode.slotPrice)) ? Number(currentNode.slotPrice) : 10)}
                      onChange={e => setCurrentNode({ ...currentNode, slotPrices: { ...(currentNode.slotPrices || {}), minecraft: Number(e.target.value) } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Цена за слот: CS 2 (₽)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full p-2 border rounded"
                      value={Number.isFinite(Number(currentNode.slotPrices?.cs2)) ? Number(currentNode.slotPrices?.cs2) : (Number.isFinite(Number(currentNode.slotPrice)) ? Number(currentNode.slotPrice) : 10)}
                      onChange={e => setCurrentNode({ ...currentNode, slotPrices: { ...(currentNode.slotPrices || {}), cs2: Number(e.target.value) } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Цена за слот: CS 1.6 (₽)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full p-2 border rounded"
                      value={Number.isFinite(Number(currentNode.slotPrices?.cs16)) ? Number(currentNode.slotPrices?.cs16) : (Number.isFinite(Number(currentNode.slotPrice)) ? Number(currentNode.slotPrice) : 10)}
                      onChange={e => setCurrentNode({ ...currentNode, slotPrices: { ...(currentNode.slotPrices || {}), cs16: Number(e.target.value) } })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-6">
                  <button onClick={() => setIsNodeGamesModalOpen(false)} className="px-4 py-2 border rounded">Отмена</button>
                  <button onClick={handleSaveNodeGames} className="px-4 py-2 bg-indigo-600 text-white rounded">Сохранить</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'game_servers' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Игровые серверы (Все клиенты)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Игра</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Порт</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Нода</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Управление</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {gameServers.map((gs) => (
                      <tr key={gs.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{gs.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gs.game}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gs.port}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              gs.status === 'running' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {gs.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gs.node?.name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleControlGameServer(gs.id, 'start')} className="text-green-600 hover:text-green-900 mr-2">Start</button>
                          <button onClick={() => handleControlGameServer(gs.id, 'stop')} className="text-red-600 hover:text-red-900 mr-2">Stop</button>
                          <button onClick={() => handleControlGameServer(gs.id, 'restart')} className="text-blue-600 hover:text-blue-900">Restart</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isGameServerModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Создать Сервер</h2>
                <div className="space-y-4">
                    <input type="text" placeholder="Название" className="w-full p-2 border rounded" value={currentGameServer.name || ''} onChange={e => setCurrentGameServer({...currentGameServer, name: e.target.value})} />
                    
                    <select className="w-full p-2 border rounded" value={currentGameServer.game || ''} onChange={e => setCurrentGameServer({...currentGameServer, game: e.target.value})}>
                        <option value="">Выберите игру</option>
                        <option value="minecraft">Minecraft (Java)</option>
                        <option value="cs2">Counter-Strike 2</option>
                    </select>

                    <select className="w-full p-2 border rounded" value={currentGameServer.nodeId || ''} onChange={e => setCurrentGameServer({...currentGameServer, nodeId: e.target.value})}>
                        <option value="">Выберите ноду</option>
                        {hostingNodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.ip})</option>)}
                    </select>

                    <select className="w-full p-2 border rounded" value={currentGameServer.userId || ''} onChange={e => setCurrentGameServer({...currentGameServer, userId: e.target.value})}>
                        <option value="">Выберите владельца</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                    </select>

                    <input type="number" placeholder="RAM (MB)" className="w-full p-2 border rounded" value={currentGameServer.ram || 1024} onChange={e => setCurrentGameServer({...currentGameServer, ram: parseInt(e.target.value)})} />
                    
                    <div className="flex justify-end gap-2 pt-4">
                        <button onClick={() => setIsGameServerModalOpen(false)} className="px-4 py-2 border rounded">Отмена</button>
                        <button onClick={handleSaveGameServer} className="px-4 py-2 bg-indigo-600 text-white rounded">Создать</button>
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Modal */}
          {isPortfolioModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {currentPortfolioItem.id ? 'Редактировать работу' : 'Новая работа'}
                  </h2>
                  <button onClick={() => setIsPortfolioModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleSavePortfolio} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Название</label>
                    <input
                      type="text"
                      required
                      value={currentPortfolioItem.title || ''}
                      onChange={e => setCurrentPortfolioItem({...currentPortfolioItem, title: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Категория (landing, shop, app)</label>
                    <select
                      required
                      value={currentPortfolioItem.category || 'landing'}
                      onChange={e => setCurrentPortfolioItem({...currentPortfolioItem, category: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    >
                      <option value="landing">Landing Page</option>
                      <option value="shop">Интернет-магазин</option>
                      <option value="app">Веб-приложение</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Описание</label>
                    <textarea
                      required
                      rows={3}
                      value={currentPortfolioItem.description || ''}
                      onChange={e => setCurrentPortfolioItem({...currentPortfolioItem, description: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">URL изображения</label>
                    <input
                      type="text"
                      required
                      value={currentPortfolioItem.imageUrl || ''}
                      onChange={e => setCurrentPortfolioItem({...currentPortfolioItem, imageUrl: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Теги (через запятую)</label>
                    <input
                      type="text"
                      value={Array.isArray(currentPortfolioItem.tags) ? currentPortfolioItem.tags.join(', ') : currentPortfolioItem.tags || ''}
                      onChange={e => setCurrentPortfolioItem({...currentPortfolioItem, tags: e.target.value.split(',').map(t => t.trim())})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ссылка на проект</label>
                    <input
                      type="text"
                      value={currentPortfolioItem.link || ''}
                      onChange={e => setCurrentPortfolioItem({...currentPortfolioItem, link: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsPortfolioModalOpen(false)}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                      Сохранить
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Invoice Modal */}
          {isInvoiceModalOpen && selectedUserForInvoice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Выставить счет для {selectedUserForInvoice.name}
                  </h2>
                  <button onClick={() => setIsInvoiceModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleSaveInvoice} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Название счета</label>
                    <input
                      type="text"
                      required
                      placeholder="Например: Разработка сайта"
                      value={currentInvoice.title || ''}
                      onChange={e => setCurrentInvoice({...currentInvoice, title: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Сумма (₽)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={currentInvoice.amount || ''}
                      onChange={e => setCurrentInvoice({...currentInvoice, amount: parseFloat(e.target.value)})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Тип платежа</label>
                    <select
                      value={currentInvoice.type || 'one_time'}
                      onChange={e => setCurrentInvoice({...currentInvoice, type: e.target.value as 'one_time' | 'monthly'})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    >
                      <option value="one_time">Разовый платеж</option>
                      <option value="monthly">Ежемесячная подписка</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Срок оплаты</label>
                    <input
                      type="date"
                      required
                      value={currentInvoice.dueDate ? currentInvoice.dueDate.toString().split('T')[0] : ''}
                      onChange={e => setCurrentInvoice({...currentInvoice, dueDate: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Связанная услуга (необязательно)</label>
                    <select
                      value={currentInvoice.serviceId || ''}
                      onChange={e => setCurrentInvoice({...currentInvoice, serviceId: e.target.value || undefined})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    >
                      <option value="">Без услуги</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.title} ({service.price})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsInvoiceModalOpen(false)}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                      Выставить счет
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Project Invoice Modal */}
          {isProjectInvoiceModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Выставить счет</h2>
                  <button onClick={() => setIsProjectInvoiceModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="space-y-4">
                     <p>Проект: <strong>{currentProject.title}</strong></p>
                     <p>Тариф: {currentProject.monthlyRate || currentProject.budget} ₽ / мес</p>
                     
                     <div>
                         <label className="block text-sm font-medium text-gray-700">Период (месяцев)</label>
                        <select 
                            value={invoicePeriod}
                            onChange={(e) => setInvoicePeriod(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        >
                            <option value={1}>1 месяц</option>
                            <option value={3}>3 месяца</option>
                            <option value={6}>6 месяцев</option>
                            <option value={12}>12 месяцев</option>
                        </select>
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-2">
                        <button
                            onClick={() => setIsProjectInvoiceModalOpen(false)}
                            className="px-4 py-2 border rounded hover:bg-gray-50"
                        >
                            Отмена
                        </button>
                        <button
                             onClick={handleCreateProjectInvoice}
                             className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                         >
                             Создать счет на {((currentProject.monthlyRate || currentProject.budget) || 0) * invoicePeriod} ₽
                         </button>
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* Project Modal */}
          {isProjectModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {currentProject.id ? 'Редактировать проект' : 'Новый проект'}
                  </h2>
                  <button onClick={() => setIsProjectModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleSaveProject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Название проекта</label>
                    <input
                      type="text"
                      required
                      value={currentProject.title || ''}
                      onChange={e => setCurrentProject({...currentProject, title: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Клиент</label>
                    <select
                      required
                      value={currentProject.clientId || ''}
                      onChange={e => setCurrentProject({...currentProject, clientId: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    >
                      <option value="">Выберите клиента</option>
                      {users.filter(u => u.role === 'client').map(user => (
                        <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Бюджет (разовый)</label>
                    <input
                      type="number"
                      value={currentProject.budget || ''}
                      onChange={e => setCurrentProject({...currentProject, budget: parseFloat(e.target.value)})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ежемесячный платеж</label>
                    <input
                      type="number"
                      value={currentProject.monthlyRate || ''}
                      onChange={e => setCurrentProject({...currentProject, monthlyRate: parseFloat(e.target.value)})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Оплачено до</label>
                    <input
                      type="date"
                      value={currentProject.paidUntil ? new Date(currentProject.paidUntil).toISOString().split('T')[0] : ''}
                      onChange={e => setCurrentProject({...currentProject, paidUntil: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>



                  <div>
                    <label className="block text-sm font-medium text-gray-700">Статус</label>
                    <select
                      value={currentProject.status || 'pending'}
                      onChange={e => setCurrentProject({...currentProject, status: e.target.value as any})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    >
                      <option value="pending">Ожидает</option>
                      <option value="in_progress">В работе</option>
                      <option value="completed">Готов</option>
                      <option value="cancelled">Отменен</option>
                    </select>
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ссылка на сайт</label>
                    <input
                      type="url"
                      value={currentProject.websiteUrl || ''}
                      onChange={e => setCurrentProject({...currentProject, websiteUrl: e.target.value})}
                      placeholder="https://example.com"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">IP адрес сервера</label>
                    <input
                      type="text"
                      value={currentProject.serverIp || ''}
                      onChange={e => setCurrentProject({...currentProject, serverIp: e.target.value})}
                      placeholder="192.168.1.1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mt-4 mb-2">Настройки сервера (PM2)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SSH User</label>
                            <input
                                type="text"
                                value={currentProject.sshUsername || ''}
                                onChange={e => setCurrentProject({...currentProject, sshUsername: e.target.value})}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                placeholder="root"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SSH Password</label>
                            <input
                                type="password"
                                value={currentProject.sshPassword || ''}
                                onChange={e => setCurrentProject({...currentProject, sshPassword: e.target.value})}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                placeholder="******"
                            />
                        </div>
                    </div>
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">PM2 Process Name</label>
                        <input
                            type="text"
                            value={currentProject.pm2ProcessName || ''}
                            onChange={e => setCurrentProject({...currentProject, pm2ProcessName: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            placeholder="my-app"
                        />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsProjectModalOpen(false)}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                      Сохранить
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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
                  Чат с клиентом: {selectedOrder.user?.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedOrder.service ? `Заказ: ${selectedOrder.service.title}` : 'Чат с менеджером'} ({selectedOrder.status})
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
                  Нет сообщений.
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender?.role === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender?.role === 'admin' 
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}>
                      <div className="flex justify-between items-center mb-1 gap-2">
                         <span className="text-xs font-semibold opacity-75">{msg.sender?.name}</span>
                         <span className="text-xs opacity-75">{msg.sender?.role}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 text-right ${
                        msg.sender?.role === 'admin' ? 'text-indigo-200' : 'text-gray-400'
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

export default AdminDashboard;
