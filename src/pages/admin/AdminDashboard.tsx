﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  FileText,
  Plus,
  Trash2,
  Edit2,
  X,
  CreditCard,
  CheckCircle,
  Send,
  Loader,
  Server,
  Terminal,
  RefreshCw,
  Settings,
  Zap,
  Clock,
  Globe,
  Search,
  UserCog,
  ChevronDown,
  ShieldAlert,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Minus,
} from 'lucide-react';

interface WalletTransactionItem {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'withdraw' | 'adjust' | 'refund';
  description: string | null;
  invoiceId: string | null;
  gameServerId: string | null;
  relatedId: string | null;
  metadata: any | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

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

const isCmsService = (service: Service) => service.title.includes('CMS');

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
  usedRam?: number;
  supportedGames?: string[];
  slotPrice?: number;
  slotPrices?: Record<string, number>;
  status: string;
  type?: 'game' | 'web' | 'both';
  capacityWebSites?: number;
  usedWebSites?: number;
  webSftpPortStart?: number;
  webSftpPortEnd?: number;
}

interface WebSiteItem {
  id: string;
  domain: string | null;
  domainType?: 'subdomain' | 'custom' | null;
  subdomainName?: string | null;
  plan: 'landing' | 'business' | 'premium';
  price: number;
  status: 'pending' | 'provisioning' | 'active' | 'suspended' | 'deleting' | 'deleted';
  paidUntil: string | null;
  userId: string;
  nodeId: string;
  coreTemplate?: string | null;
  user?: User;
  node?: HostingNode;
  createdAt?: string;
}

interface GameServerItem {
  id: string;
  name: string;
  game: string;
  port: number;
  ram?: number;
  slots?: number;
  monthlyPrice?: number;
  paidUntil?: string;
  status: string;
  userId: string;
  nodeId: string;
  user?: User;
  node?: HostingNode;
  createdAt?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  createdAt?: string;
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
  periodMonths?: number;
  gameServerId?: string | null;
  createdAt?: string;
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
  const { refreshBalance } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'portfolio' | 'users' | 'invoices' | 'projects' | 'orders' | 'discussions' | 'servers' | 'feedback' | 'hosting_nodes' | 'game_servers' | 'web_sites' | 'finances'>('dashboard');
  const [services, setServices] = useState<Service[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [hostingNodes, setHostingNodes] = useState<HostingNode[]>([]);
  const [gameServers, setGameServers] = useState<GameServerItem[]>([]);
  const [webSites, setWebSites] = useState<WebSiteItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [servers, setServers] = useState<ServerNode[]>([]);
  const [loading, setLoading] = useState(true);

  // ============== WALLET / BALANCE (ADMIN) ==============
  // Users filter
  const [userBalanceFilter, setUserBalanceFilter] = useState<'all' | 'positive' | 'zero'>('all');
  const [userSortByBalance, setUserSortByBalance] = useState<'none' | 'asc' | 'desc'>('desc');

  // Adjust modal (+- balance manually)
  const [adjustModal, setAdjustModal] = useState<{
    open: boolean;
    targetUserId: string;
    targetUserName: string;
    sign: '+' | '-';
    amount: string;
    description: string;
    loading: boolean;
  }>({
    open: false,
    targetUserId: '',
    targetUserName: '',
    sign: '+',
    amount: '',
    description: '',
    loading: false,
  });

  // All transactions (Finances Tab)
  const [allTransactions, setAllTransactions] = useState<WalletTransactionItem[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txOffset, setTxOffset] = useState(0);
  const [txTotal, setTxTotal] = useState(0);
  const txLimit = 20;
  const [txUserFilter, setTxUserFilter] = useState<string>('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'deposit' | 'withdraw' | 'adjust' | 'refund'>('all');

  // Helpers
  const formatTxTypeBadge = (t: WalletTransactionItem) => {
    const amount = Number(t.amount) || 0;
    if (t.type === 'deposit') return { label: 'Пополнение', className: 'bg-emerald-100 text-emerald-800', sign: '+' };
    if (t.type === 'refund') return { label: 'Возврат', className: 'bg-emerald-100 text-emerald-800', sign: '+' };
    if (t.type === 'adjust') {
      const positive = amount >= 0;
      return {
        label: positive ? 'Ручное начисление' : 'Ручное списание',
        className: positive ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800',
        sign: positive ? '+' : '-',
      };
    }
    return { label: 'Списание', className: 'bg-rose-100 text-rose-800', sign: '-' };
  };

  const formatTxDescription = (t: WalletTransactionItem) => {
    if (t.description) return t.description;
    if (t.type === 'deposit') return 'Пополнение баланса';
    if (t.type === 'withdraw') return 'Оплата услуг';
    const manualBy = t.metadata?.manualBy ? `(админ: ${String(t.metadata.manualBy).slice(0, 8)})` : '';
    let s = manualBy || '';
    if (t.gameServerId) s = `${s ? s + ' · ' : ''}Сервер #${t.gameServerId.slice(0, 8)}`;
    if (t.invoiceId) s = `${s ? s + ' · ' : ''}Счёт #${t.invoiceId.slice(0, 8)}`;
    return s || '—';
  };

  const loadAllTransactions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setTxLoading(true);
      let url = `/api/wallet/transactions?limit=${txLimit}&offset=${txOffset}`;
      if (txUserFilter) url += `&userId=${encodeURIComponent(txUserFilter)}`;
      if (txTypeFilter !== 'all') url += `&type=${txTypeFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.rows)) setAllTransactions(data.rows);
        if (typeof data?.count === 'number') setTxTotal(data.count);
      }
    } catch (e) {
      console.error('loadAllTransactions error:', e);
    } finally {
      setTxLoading(false);
    }
  };

  const openAdjustModal = (u: User, sign: '+' | '-') => {
    setAdjustModal({
      open: true,
      targetUserId: u.id,
      targetUserName: u.name || u.email,
      sign,
      amount: sign === '+' ? '500' : '100',
      description: '',
      loading: false,
    });
  };

  const submitAdjustBalance = async () => {
    const amount = Number(adjustModal.amount);
    if (!amount || amount <= 0) {
      alert('Введите положительную сумму');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token || !adjustModal.targetUserId) return;
    try {
      setAdjustModal((s) => ({ ...s, loading: true }));
      const res = await fetch('/api/wallet/admin/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: adjustModal.targetUserId,
          amount: adjustModal.sign === '+' ? Math.abs(amount) : -Math.abs(amount),
          description: adjustModal.description.trim() || (adjustModal.sign === '+' ? 'Ручное пополнение' : 'Ручное списание'),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.message || 'Ошибка изменения баланса');
        return;
      }
      setAdjustModal({ open: false, targetUserId: '', targetUserName: '', sign: '+', amount: '', description: '', loading: false });
      alert(`Баланс пользователя обновлён. Новый баланс: ${Number(data?.newBalance ?? '').toFixed(2)} ₽`);
      try { await refreshBalance(); } catch (e) {}
      fetchData();
      if (activeTab === 'finances') loadAllTransactions();
    } catch (e) {
      console.error(e);
      alert('Ошибка запроса');
    } finally {
      setAdjustModal((s) => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    if (activeTab === 'finances') {
      loadAllTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, txOffset, txUserFilter, txTypeFilter]);

  // Game Servers: Filters + Mass Selection
  const [selectedGameServerIds, setSelectedGameServerIds] = useState<Set<string>>(new Set());
  const [gsStatusFilter, setGsStatusFilter] = useState<string>('all');
  const [gsGameFilter, setGsGameFilter] = useState<string>('all');
  const [gsNodeFilter, setGsNodeFilter] = useState<string>('all');
  const [gsSearch, setGsSearch] = useState('');
  const [massActionMenuOpen, setMassActionMenuOpen] = useState(false);
  const [massActionLoading, setMassActionLoading] = useState(false);

  // Manual Invoice Modal
  const [isManualInvoiceOpen, setIsManualInvoiceOpen] = useState(false);
  const [manualInvoice, setManualInvoice] = useState<{
    userId: string;
    title: string;
    amount: number;
    periodMonths: number;
    gameServerId: string | undefined;
  }>({
    userId: '',
    title: 'Пополнение баланса / Услуги',
    amount: 100,
    periodMonths: 1,
    gameServerId: undefined,
  });

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

  // Web Sites admin
  const [selectedWebSiteIds, setSelectedWebSiteIds] = useState<Set<string>>(new Set());
  const [wsStatusFilter, setWsStatusFilter] = useState<string>('all');
  const [wsPlanFilter, setWsPlanFilter] = useState<string>('all');
  const [wsNodeFilter, setWsNodeFilter] = useState<string>('all');
  const [wsSearch, setWsSearch] = useState('');
  const [wsMassActionLoading, setWsMassActionLoading] = useState(false);
  const [isWebSiteModalOpen, setIsWebSiteModalOpen] = useState(false);
  const [currentWebSite, setCurrentWebSite] = useState<Partial<WebSiteItem> & { userId?: string; periodMonths?: number }>({
    plan: 'business',
    periodMonths: 1,
  });
  const [isWebSiteMigrateOpen, setIsWebSiteMigrateOpen] = useState(false);
  const [webSiteMigrate, setWebSiteMigrate] = useState<{ siteId: string; newNodeId: string }>({ siteId: '', newNodeId: '' });
  
  // User Profile Modal State
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<Partial<User> | null>(null);

  // Server Modal State
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [newServer, setNewServer] = useState({ name: '', ipAddress: '', capacity: 10 });
  const [showToken, setShowToken] = useState<string | null>(null);
  
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

      const [servicesRes, portfolioRes, usersRes, invoicesRes, projectsRes, ordersRes, serversRes, feedbacksRes, nodesRes, gameServersRes, webSitesRes] = await Promise.all([
        fetch('/api/services/admin', { headers }),
        fetch('/api/portfolio'),
        fetch('/api/users', { headers }),
        fetch('/api/invoices/all', { headers }),
        fetch('/api/projects', { headers }),
        fetch('/api/orders', { headers }),
        fetch('/api/servers', { headers }),
        fetch('/api/feedback', { headers }),
        fetch('/api/nodes', { headers }),
        fetch('/api/game-servers', { headers }),
        fetch('/api/sites/admin/all', { headers }).catch(() => ({ ok: false, json: async () => [] })),
      ]);
      
      const servicesData = servicesRes.ok ? await servicesRes.json() : [];
      const portfolioData = portfolioRes.ok ? await portfolioRes.json() : [];
      
      if (Array.isArray(servicesData)) setServices(servicesData.filter((service) => !isCmsService(service)));
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

      try {
        if (webSitesRes && typeof webSitesRes.ok !== 'undefined' && webSitesRes.ok) {
          const wsData = await (webSitesRes as any).json();
          const items: WebSiteItem[] = Array.isArray(wsData) ? wsData : Array.isArray(wsData?.items) ? wsData.items : [];
          setWebSites(items);
        }
      } catch (e) { console.warn('web sites fetch skipped', e); }

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
          slotPrice: Number.isFinite(Number(currentNode.slotPrice)) ? Number(currentNode.slotPrice) : 10,
          type: currentNode.type || 'game',
          capacityWebSites: Number.isFinite(Number(currentNode.capacityWebSites)) ? Number(currentNode.capacityWebSites) : 50,
          usedWebSites: Number.isFinite(Number(currentNode.usedWebSites)) ? Number(currentNode.usedWebSites) : 0,
          webSftpPortStart: currentNode.webSftpPortStart,
          webSftpPortEnd: currentNode.webSftpPortEnd,
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
        const safePayload = {
          ram: 1024,
          slots: 10,
          ...currentGameServer,
        };
        const res = await fetch('/api/game-servers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(safePayload)
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

  // =============== WEB SITES HELPERS ===============
  const handleControlWebSite = async (id: string, action: 'start' | 'stop' | 'restart' | 'delete') => {
    if (action === 'delete' && !confirm('Удалить сайт? Данные SFTP/PM2/Nginx будут удалены безвозвратно.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sites/admin/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        alert(e.message || 'Ошибка');
      }
      fetchData();
    } catch (error) { console.error(error); alert('Ошибка соединения'); }
  };

  const handleMigrateWebSite = async () => {
    if (!webSiteMigrate.siteId || !webSiteMigrate.newNodeId) { alert('Выберите сайт и ноду'); return; }
    if (!confirm(`Перенести сайт на новую ноду? (будет выполнен rsync, старая нода очищена)`)) return;
    try {
      setWsMassActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sites/admin/${webSiteMigrate.siteId}/migrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nodeId: webSiteMigrate.newNodeId }),
      });
      if (res.ok) {
        alert('Миграция запущена, результат в логах нод');
        setIsWebSiteMigrateOpen(false);
      } else {
        const e = await res.json().catch(() => ({}));
        alert(e.message || 'Ошибка миграции');
      }
    } catch (e) { console.error(e); alert('Ошибка соединения'); }
    finally { setWsMassActionLoading(false); fetchData(); }
  };

  const handleCreateWebSite = async () => {
    if (!currentWebSite.userId) { alert('Выберите пользователя'); return; }
    if (!currentWebSite.plan) { alert('Выберите тариф'); return; }
    try {
      setWsMassActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sites/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          userId: currentWebSite.userId,
          domain: currentWebSite.domain || null,
          plan: currentWebSite.plan || 'business',
          price: Number.isFinite(Number(currentWebSite.price)) ? Number(currentWebSite.price) : undefined,
          periodMonths: Number(currentWebSite.periodMonths || 1),
          nodeId: currentWebSite.nodeId || undefined,
          coreTemplate: currentWebSite.coreTemplate || undefined,
          autoPay: true,
        }),
      });
      if (res.ok) {
        alert('Сайт создан / счет выставлен');
        setIsWebSiteModalOpen(false);
      } else {
        const e = await res.json().catch(() => ({}));
        alert(e.message || 'Ошибка создания');
      }
    } catch (e) { console.error(e); alert('Ошибка соединения'); }
    finally { setWsMassActionLoading(false); fetchData(); }
  };

  const filteredWebSites = webSites.filter(ws => {
    if (wsSearch.trim()) {
      const q = wsSearch.toLowerCase();
      const hay = `${ws.id} ${ws.domain || ''} ${ws.user?.name || ''} ${ws.user?.email || ''} ${ws.node?.name || ''} ${ws.node?.ip || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (wsStatusFilter !== 'all' && ws.status !== wsStatusFilter) return false;
    if (wsPlanFilter !== 'all' && ws.plan !== wsPlanFilter) return false;
    if (wsNodeFilter !== 'all' && ws.nodeId !== wsNodeFilter) return false;
    return true;
  });

  const toggleWebSiteSelection = (id: string) => {
    setSelectedWebSiteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const clearWebSiteSelection = () => setSelectedWebSiteIds(new Set());

  const handleBulkWebSiteAction = async (action: 'start' | 'stop' | 'restart' | 'delete') => {
    const ids = Array.from(selectedWebSiteIds);
    if (ids.length === 0) return alert('Не выбрано ни одного сайта');
    if (!confirm(`Применить «${action}» к ${ids.length} сайтам?`)) return;
    try {
      setWsMassActionLoading(true);
      const token = localStorage.getItem('token');
      const CHUNK = 10;
      for (let i = 0; i < ids.length; i += CHUNK) {
        const chunk = ids.slice(i, i + CHUNK);
        await Promise.allSettled(chunk.map(id => fetch(`/api/sites/admin/${id}/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        }).catch(() => null)));
      }
      clearWebSiteSelection();
    } catch (e) { console.error(e); }
    finally { setWsMassActionLoading(false); fetchData(); }
  };

  // =============== GAME SERVERS FILTERS & SELECTION ===============
  const filteredGameServers = gameServers.filter(gs => {
    if (gsSearch.trim()) {
      const q = gsSearch.toLowerCase();
      const hay = `${gs.name} ${gs.game} ${gs.id} ${gs.userId} ${gs.port} ${gs.user?.name || ''} ${gs.user?.email || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (gsStatusFilter !== 'all' && gs.status !== gsStatusFilter) return false;
    if (gsGameFilter !== 'all' && gs.game !== gsGameFilter) return false;
    if (gsNodeFilter !== 'all' && gs.nodeId !== gsNodeFilter) return false;
    return true;
  });

  const toggleGameServerSelection = (id: string) => {
    setSelectedGameServerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearGameServerSelection = () => setSelectedGameServerIds(new Set());

  const handleMassAction = async (
    action: 'start' | 'stop' | 'restart' | 'extend_1' | 'delete'
  ) => {
    const ids = Array.from(selectedGameServerIds);
    if (ids.length === 0) {
      alert('Не выбрано ни одного сервера');
      return;
    }
    if (!confirm(`Применить «${action}» к ${ids.length} серверам?`)) return;

    try {
      setMassActionLoading(true);
      setMassActionMenuOpen(false);
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

      let succeeded = 0;
      let failed = 0;

      for (const chunk of chunks) {
        const tasks = chunk.map(async (id) => {
          try {
            if (action === 'delete') {
              const r = await fetch(`/api/game-servers/${id}`, { method: 'DELETE', headers });
              if (!r.ok) throw new Error('HTTP ' + r.status);
            } else if (action === 'extend_1') {
              const r = await fetch(`/api/game-servers/${id}/subscription`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ months: 1 })
              });
              if (!r.ok) throw new Error('HTTP ' + r.status);
            } else {
              const r = await fetch(`/api/game-servers/${id}/control`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ action })
              });
              if (!r.ok) throw new Error('HTTP ' + r.status);
            }
            return true;
          } catch (e) {
            console.error(`Failed ${action} on ${id}:`, e);
            return false;
          }
        });
        const results = await Promise.allSettled(tasks);
        results.forEach(r => {
          if (r.status === 'fulfilled' && r.value === true) succeeded++;
          else failed++;
        });
      }

      clearGameServerSelection();
      alert(`Массовая операция завершена: успешно ${succeeded}, ошибок ${failed}`);
      fetchData();
    } catch (e) {
      console.error('Mass action failed:', e);
      alert('Ошибка массовой операции');
    } finally {
      setMassActionLoading(false);
    }
  };

  // =============== USERS ROLE ===============
  const handlePromoteUser = async (userId: string) => {
    if (!confirm('Назначить пользователя администратором?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: 'admin' })
      });
      if (res.ok) fetchData();
      else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Ошибка назначения прав');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка соединения');
    }
  };

  const handleDemoteUser = async (userId: string) => {
    if (!confirm('Снять права администратора?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: 'client' })
      });
      if (res.ok) fetchData();
      else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Ошибка снятия прав');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка соединения');
    }
  };

  // =============== MANUAL INVOICE ===============
  const openManualInvoiceModal = (userId = '') => {
    setManualInvoice({
      userId: userId || (users[0]?.id || ''),
      title: 'Оплата услуг',
      amount: 500,
      periodMonths: 1,
      gameServerId: undefined,
    });
    setIsManualInvoiceOpen(true);
  };

  const handleSubmitManualInvoice = async () => {
    if (!manualInvoice.userId) return alert('Выберите клиента');
    if (!manualInvoice.title.trim()) return alert('Заполните название');
    const amount = Number(manualInvoice.amount);
    if (!Number.isFinite(amount) || amount <= 0) return alert('Неверная сумма');
    const periodMonths = Math.max(1, Number(manualInvoice.periodMonths) || 1);

    try {
      setMassActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/invoices/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          userId: manualInvoice.userId,
          title: manualInvoice.title.trim(),
          amount,
          periodMonths,
          gameServerId: manualInvoice.gameServerId || undefined,
        })
      });

      if (res.ok) {
        const inv = await res.json().catch(() => ({}));
        setIsManualInvoiceOpen(false);
        fetchData();
        alert(`Счет создан: #${inv.id?.slice(0, 8) || ''} на ${amount} ₽`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Ошибка создания счета');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка соединения');
    } finally {
      setMassActionLoading(false);
    }
  };

  const gameServersRunning = gameServers.filter(gs => gs.status === 'running').length;
  const gameServersSuspended = gameServers.filter(gs => gs.status === 'suspended').length;
  const revenue30d = invoices
    .filter((inv: any) => inv.status === 'paid' && inv.createdAt && new Date(inv.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0);

  const stats = [
    { title: 'Игровых серверов', value: gameServers.length, icon: Server, color: 'bg-indigo-500' },
    { title: 'Активных (RUNNING)', value: gameServersRunning, icon: Zap, color: 'bg-emerald-500' },
    { title: 'Приостановлено', value: gameServersSuspended, icon: Clock, color: 'bg-amber-500' },
    { title: 'Нод (локаций)', value: hostingNodes.length, icon: Globe, color: 'bg-blue-500' },
    { title: 'Пользователей', value: users.length, icon: Users, color: 'bg-green-500' },
    { title: 'Счетов всего', value: invoices.length, icon: FileText, color: 'bg-purple-500' },
    { title: 'Доход за 30 дней', value: `${revenue30d} ₽`, icon: CreditCard, color: 'bg-pink-500' },
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
                { id: 'users', label: 'Пользователи' },
                { id: 'finances', label: 'Финансы' },
                { id: 'invoices', label: 'Счета' },
                { id: 'hosting_nodes', label: 'Ноды (локации)' },
                { id: 'game_servers', label: 'Игровые серверы' },
                { id: 'web_sites', label: 'Сайты' },
                { id: 'orders', label: 'Заказы (услуги)' },
                { id: 'discussions', label: 'Обсуждения' },
                { id: 'feedback', label: 'Обратная связь' },
              ].map((tab) => {
                let badgeCount = 0;
                let badgeColor = 'bg-red-500';

                if (tab.id === 'orders') {
                  badgeCount = orders.filter(o => o.service && o.status === 'pending').length;
                } else if (tab.id === 'discussions') {
                  badgeCount = orders.filter(o => !o.service).reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);
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
            <div className="flex flex-col gap-8">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                   
                   
                   
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
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Last 5 Game Servers */}
                <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Последние игровые серверы</h3>
                      <p className="text-sm text-gray-500">Контроль статуса и быстрые действия</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('game_servers')}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Все серверы →
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase text-gray-500">
                          <th className="px-2 py-2">Название</th>
                          <th className="px-2 py-2">Игра</th>
                          <th className="px-2 py-2">Статус</th>
                          <th className="px-2 py-2">Клиент</th>
                          <th className="px-2 py-2 text-right">Управление</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {gameServers.slice(0, 5).map((gs) => (
                          <tr key={gs.id} className="hover:bg-gray-50">
                            <td className="px-2 py-3 font-medium text-gray-900">{gs.name}</td>
                            <td className="px-2 py-3 text-gray-600">{gs.game}</td>
                            <td className="px-2 py-3">
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                gs.status === 'running' ? 'bg-green-100 text-green-800'
                                : gs.status === 'pending_payment' || gs.status === 'suspended' ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}>
                                {gs.status}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-gray-600 truncate max-w-[140px]">
                              {gs.user?.name || gs.userId.slice(0, 8)}
                            </td>
                            <td className="px-2 py-3 text-right space-x-1 whitespace-nowrap">
                              <button onClick={() => handleControlGameServer(gs.id, 'start')} className="text-green-600 hover:text-green-900 px-2 py-1 text-xs">Start</button>
                              <button onClick={() => handleControlGameServer(gs.id, 'restart')} className="text-blue-600 hover:text-blue-900 px-2 py-1 text-xs">Restart</button>
                              <button onClick={() => handleControlGameServer(gs.id, 'stop')} className="text-red-600 hover:text-red-900 px-2 py-1 text-xs">Stop</button>
                            </td>
                          </tr>
                        ))}
                        {gameServers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-2 py-8 text-center text-gray-500">
                              Нет игровых серверов
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Last 5 Invoices */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Последние счета</h3>
                        <p className="text-sm text-gray-500">Оплата и история</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('invoices')}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Все счета →
                      </button>
                    </div>
                    <ul className="flex flex-col gap-3">
                      {invoices.slice(0, 5).map((inv) => {
                        const u = users.find(x => x.id === inv.userId);
                        return (
                          <li key={inv.id} className="flex items-start justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{inv.title}</div>
                              <div className="text-xs text-gray-500">
                                №{inv.id.slice(0, 6)} · {u?.name || '—'} · {formatDate(inv.dueDate || inv.createdAt || '')}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm font-semibold text-gray-900">{inv.amount} ₽</div>
                              <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                                inv.status === 'paid' ? 'bg-green-100 text-green-800'
                                : inv.status === 'cancelled' ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {inv.status === 'paid' ? 'Оплачен' : inv.status === 'cancelled' ? 'Отменен' : 'Ожидает'}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                      {invoices.length === 0 && (
                        <li className="py-6 text-center text-gray-500 text-sm">Счетов пока нет</li>
                      )}
                    </ul>
                  </div>

                  {/* Nodes RAM Summary */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Ноды — загрузка RAM</h3>
                      <p className="text-sm text-gray-500">Распределение по локациям</p>
                    </div>
                    <div className="flex flex-col gap-4">
                      {hostingNodes.length === 0 && (
                        <div className="py-6 text-center text-gray-500 text-sm">Ноды не добавлены</div>
                      )}
                      {hostingNodes.map((node) => {
                        const gsCount = gameServers.filter(g => g.nodeId === node.id).length;
                        const sitesCount = Number(node.usedWebSites || 0);
                        const total = Math.max(0, Number(node.totalRam) || 0);
                        const usedRamNum = Number(node.usedRam) || 0;
                        const estFromServers = gsCount > 0 ? gsCount * 2048 : 0;
                        const estFromSites = sitesCount > 0 ? sitesCount * 48 : 0;
                        const used = usedRamNum > 0 ? usedRamNum : Math.max(estFromServers, estFromSites);
                        const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                        const nodeType = node.type || 'game';
                        const labelPieces: string[] = [];
                        if (nodeType === 'game' || nodeType === 'both') labelPieces.push(`${gsCount} серверов`);
                        if (nodeType === 'web' || nodeType === 'both') labelPieces.push(`${sitesCount} сайтов`);
                        return (
                          <div key={node.id}>
                            <div className="flex items-center justify-between mb-1">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{node.name}</div>
                                <div className="text-xs text-gray-500">
                                  {node.ip} · {labelPieces.length ? labelPieces.join(' · ') : '—'} · статус {node.status}
                                </div>
                              </div>
                              <div className="text-right text-xs font-semibold text-gray-700">
                                {pct}%
                                <span className="font-normal text-gray-500 ml-1">
                                  {used >= 1024 ? `${(used/1024).toFixed(1)}/${(total/1024).toFixed(1)} ГБ` : `${used}/${total} МБ`}
                                </span>
                              </div>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
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
            <div className="flex flex-col gap-6">
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
                      <div className="flex flex-col gap-2 text-sm text-gray-600">
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
                <form onSubmit={handleAddServer} className="flex flex-col gap-4">
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

          {activeTab === 'users' && (
            (() => {
              // Filter + sort users for display
              const filteredUsers = users.filter((u) => {
                const b = Number(u.balance) || 0;
                if (userBalanceFilter === 'positive') return b > 0;
                if (userBalanceFilter === 'zero') return b === 0;
                return true;
              });
              const sortedUsers = [...filteredUsers].sort((a, b) => {
                if (userSortByBalance === 'asc') return (Number(a.balance) || 0) - (Number(b.balance) || 0);
                if (userSortByBalance === 'desc') return (Number(b.balance) || 0) - (Number(a.balance) || 0);
                return 0;
              });
              return (
                <div className="flex flex-col gap-4">
                  {/* Filters */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex flex-wrap items-center gap-4 justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Пользователи</h2>
                        <p className="mt-0.5 text-xs text-gray-500">Всего: {users.length} · после фильтра: {sortedUsers.length}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-1.5">
                          {[
                            { id: 'all', label: 'Все' },
                            { id: 'positive', label: 'Баланс > 0' },
                            { id: 'zero', label: 'Баланс = 0' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setUserBalanceFilter(opt.id as any)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                userBalanceFilter === opt.id
                                  ? 'bg-white shadow text-indigo-700 ring-1 ring-indigo-200'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            setUserSortByBalance((prev) =>
                              prev === 'desc' ? 'asc' : prev === 'asc' ? 'none' : 'desc'
                            );
                          }}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                            userSortByBalance !== 'none'
                              ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Wallet className="h-4 w-4" />
                          Сортировка по балансу
                          <span className="ml-0.5 rounded-full bg-white/80 px-2 py-0.5 text-[10px]">
                            {userSortByBalance === 'desc' ? '↓ Max' : userSortByBalance === 'asc' ? '↑ Min' : '—'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

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
                            <th
                              scope="col"
                              onClick={() =>
                                setUserSortByBalance((p) => (p === 'desc' ? 'asc' : p === 'asc' ? 'none' : 'desc'))
                              }
                              className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider cursor-pointer select-none transition hover:text-indigo-600"
                            >
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                Баланс, ₽
                                <span className="text-[10px] font-bold text-indigo-500">
                                  {userSortByBalance === 'desc' ? '↓' : userSortByBalance === 'asc' ? '↑' : '↕'}
                                </span>
                              </div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Действия
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedUsers.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                                <Users className="mx-auto h-10 w-10 text-gray-300" />
                                <div className="mt-3 text-sm font-medium text-gray-700">Нет пользователей по выбранному фильтру</div>
                              </td>
                            </tr>
                          ) : (
                            sortedUsers.map((u) => {
                              const balance = Number(u.balance) || 0;
                              return (
                                <tr key={u.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div
                                        className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-200"
                                        onClick={() => handleOpenUserProfile(u)}
                                      >
                                        <span className="text-indigo-600 font-medium text-sm">
                                          {u.name?.charAt?.(0)?.toUpperCase() || u.email.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="ml-4">
                                        <div
                                          className="text-sm font-medium text-gray-900 cursor-pointer hover:text-indigo-600"
                                          onClick={() => handleOpenUserProfile(u)}
                                        >
                                          {u.name}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                      }`}
                                    >
                                      {u.role === 'admin' ? 'Администратор' : 'Клиент'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div
                                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 ${
                                        balance > 0
                                          ? 'bg-emerald-50 text-emerald-800'
                                          : balance < 0
                                          ? 'bg-rose-50 text-rose-800'
                                          : 'bg-gray-50 text-gray-700'
                                      }`}
                                    >
                                      <Wallet className="h-4 w-4 opacity-70" />
                                      <span className="text-sm font-bold tabular-nums">{balance.toFixed(2)}</span>
                                      <span className="text-xs font-semibold opacity-80">₽</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => openAdjustModal(u, '+')}
                                        className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                                        title="Пополнить баланс пользователю"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                        Пополнить
                                      </button>
                                      <button
                                        onClick={() => openAdjustModal(u, '-')}
                                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                                        title="Списать средства с баланса пользователя"
                                      >
                                        <Minus className="h-3.5 w-3.5" />
                                        Списать
                                      </button>
                                      <span className="mx-1 h-4 w-px bg-gray-200" />
                                      {u.role !== 'admin' ? (
                                        <button
                                          onClick={() => handlePromoteUser(u.id)}
                                          className="text-purple-600 hover:text-purple-900 inline-flex items-center text-xs"
                                          title="Назначить администратором"
                                        >
                                          <ShieldAlert className="h-4 w-4 mr-1" />
                                          Админ
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleDemoteUser(u.id)}
                                          className="text-orange-600 hover:text-orange-900 inline-flex items-center text-xs"
                                          title="Снять права администратора"
                                        >
                                          <UserCog className="h-4 w-4 mr-1" />
                                          Клиент
                                        </button>
                                      )}
                                      <button
                                        onClick={() => openInvoiceModal(u)}
                                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center text-xs"
                                      >
                                        <CreditCard className="h-4 w-4 mr-1" />
                                        Счёт
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {activeTab === 'finances' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-indigo-600" />
                    Финансы: все транзакции пользователей
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">История начислений и списаний по всем пользователям системы</p>
                </div>
              </div>

              {(() => {
                const totalBalances = users.reduce((s, u) => s + (Number(u.balance) || 0), 0);
                const sumDeposits = allTransactions.reduce((s, t) => s + (t.type === 'deposit' ? (Number(t.amount) || 0) : 0), 0);
                const sumWithdraws = allTransactions.reduce((s, t) => s + (t.type === 'withdraw' || (t.type === 'adjust' && (Number(t.amount) || 0) < 0) ? Math.abs(Number(t.amount) || 0) : 0), 0);
                const stats = [
                  { label: 'Сумма балансов пользователей', value: totalBalances, icon: Wallet, color: 'from-indigo-500 to-indigo-600', sign: true },
                  { label: 'Сумма пополнений на странице', value: sumDeposits, icon: Wallet, color: 'from-emerald-500 to-emerald-600', sign: true },
                  { label: 'Сумма списаний на странице', value: sumWithdraws, icon: Wallet, color: 'from-rose-500 to-rose-600', sign: true },
                  { label: 'Всего транзакций', value: txTotal, icon: Wallet, color: 'from-amber-500 to-amber-600', sign: false },
                ];
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((s, i) => (
                      <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">
                              {s.sign ? `${s.value.toFixed(2)} ₽` : s.value}
                            </p>
                          </div>
                          <div className={`inline-flex items-center justify-center rounded-lg p-2.5 bg-gradient-to-br ${s.color} text-white shadow-md`}>
                            <s.icon className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Пользователь</label>
                    <select
                      value={txUserFilter}
                      onChange={(e) => { setTxUserFilter(e.target.value); setTxOffset(0); }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    >
                      <option value="">Все пользователи</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email}) — {(Number(u.balance) || 0).toFixed(2)} ₽</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Тип операции</label>
                    <select
                      value={txTypeFilter}
                      onChange={(e) => { setTxTypeFilter(e.target.value as any); setTxOffset(0); }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    >
                      <option value="all">Все типы</option>
                      <option value="deposit">Пополнения</option>
                      <option value="withdraw">Списания</option>
                      <option value="adjust">Ручные операции</option>
                      <option value="refund">Возвраты</option>
                    </select>
                  </div>
                  <div className="md:col-span-4 flex gap-2">
                    <button
                      onClick={() => {
                        setTxUserFilter(''); setTxTypeFilter('all'); setTxOffset(0);
                      }}
                      className="flex-1 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Сбросить
                    </button>
                    <button
                      onClick={() => { setTxOffset(0); loadAllTransactions(); }}
                      className="flex-1 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                      Обновить
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {txLoading ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center">
                            <div className="inline-flex items-center gap-3 text-gray-500">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                              Загрузка транзакций...
                            </div>
                          </td>
                        </tr>
                      ) : allTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-16 text-center">
                            <Wallet className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                            <p className="text-sm text-gray-500">Транзакций по заданным фильтрам не найдено</p>
                          </td>
                        </tr>
                      ) : (
                        allTransactions.map((t) => {
                          const badge = formatTxTypeBadge(t);
                          const amt = Number(t.amount) || 0;
                          const embeddedUser = t.user;
                          const lookupUser = users.find(u => u.id === t.userId);
                          const user = embeddedUser || lookupUser;
                          const userBalance = lookupUser
                            ? Number(lookupUser.balance) || 0
                            : (embeddedUser && typeof (embeddedUser as any).balance === 'number'
                                ? Number((embeddedUser as any).balance)
                                : 0);
                          return (
                            <tr key={t.id} className="hover:bg-gray-50">
                              <td className="px-5 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{new Date(t.createdAt).toLocaleDateString('ru-RU')}</div>
                                <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleTimeString('ru-RU')}</div>
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap">
                                {user ? (
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold">
                                      {String(user.name || user.email || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{user.name || '—'}</div>
                                      <div className="text-xs text-gray-500">{user.email} · {userBalance.toFixed(2)} ₽</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400">user #{t.userId?.slice(0, 8)}</div>
                                )}
                              </td>
                              <td className="px-5 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
                                  {badge.sign}{badge.label}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <div className="text-sm text-gray-900">{formatTxDescription(t)}</div>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {t.invoiceId && (
                                    <span className="inline-flex items-center rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                                      счёт #{t.invoiceId.slice(0, 8)}
                                    </span>
                                  )}
                                  {t.gameServerId && (
                                    <span className="inline-flex items-center rounded bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                                      сервер #{t.gameServerId.slice(0, 8)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className={`px-5 py-3 whitespace-nowrap text-right text-sm font-bold ${
                                amt >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {amt >= 0 ? '+' : ''}{amt.toFixed(2)} ₽
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {txTotal > 0 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                    <div className="text-xs text-gray-500">
                      Транзакции {txOffset + 1}–{Math.min(txOffset + txLimit, txTotal)} из {txTotal}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setTxOffset((o) => Math.max(0, o - txLimit)); }}
                        disabled={txOffset === 0 || txLoading}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Назад
                      </button>
                      <span className="text-xs text-gray-600 font-medium">
                        стр. {Math.floor(txOffset / txLimit) + 1} / {Math.max(1, Math.ceil(txTotal / txLimit))}
                      </span>
                      <button
                        onClick={() => { setTxOffset((o) => o + txLimit); }}
                        disabled={txOffset + txLimit >= txTotal || txLoading}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Вперёд <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div></div>
                <button
                  onClick={() => openManualInvoiceModal()}
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Создать ручной счёт
                </button>
              </div>
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
                <form onSubmit={handleSaveService} className="flex flex-col gap-4">
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
                
                <div className="p-6 flex flex-col gap-6">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SSH Port</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RAM</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ресурсы</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цена/слот</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hostingNodes.map((node) => {
                      const type = node.type || 'game';
                      const typeMeta: Record<string, { label: string; cls: string }> = {
                        game: { label: 'Игровая', cls: 'bg-indigo-100 text-indigo-700' },
                        web: { label: 'Веб-нода', cls: 'bg-sky-100 text-sky-700' },
                        both: { label: 'Универсальная', cls: 'bg-violet-100 text-violet-700' },
                      };
                      const usedSites = Number(node.usedWebSites || 0);
                      const capSites = Number(node.capacityWebSites || 0);
                      const gsOnNode = gameServers.filter(g => g.nodeId === node.id).length;
                      return (
                      <tr key={node.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{node.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeMeta[type]?.cls || 'bg-gray-100 text-gray-700'}`}>
                            {typeMeta[type]?.label || type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{node.ip}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{node.sshPort}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{node.totalRam} MB</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(type === 'web') ? (
                            <>
                              <span className="font-semibold text-slate-700">{usedSites}</span>
                              <span className="mx-1 text-slate-400">/</span>
                              <span className="text-slate-500">{capSites || 50} сайтов</span>
                              <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full bg-sky-500"
                                  style={{ width: `${capSites ? Math.min(100, (usedSites / capSites) * 100) : 0}%` }}
                                />
                              </div>
                            </>
                          ) : type === 'game' ? (
                            <>
                              <span className="font-semibold text-indigo-700">{gsOnNode}</span>
                              <span className="mx-1 text-slate-500">игровых серверов</span>
                              {gsOnNode > 0 && node.totalRam > 0 && (
                                <>
                                  <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className={`h-full ${gsOnNode * 2048 >= 0.9 * (node.totalRam || 1) ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                      style={{ width: `${Math.min(100, Math.round((gsOnNode * 2048 / Math.max(1, node.totalRam || 1)) * 100))}%` }}
                                    />
                                  </div>
                                  <div className="mt-0.5 text-[10px] text-slate-400">≈ {(gsOnNode * 2).toFixed(1)}/{((node.totalRam || 0) / 1024).toFixed(1)} ГБ</div>
                                </>
                              )}
                            </>
                          ) : (
                            <div className="space-y-2">
                              <div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Сайты: </span>
                                <span className="font-semibold text-sky-700">{usedSites}</span>
                                <span className="mx-1 text-slate-400">/</span>
                                <span className="text-slate-500">{capSites || 50}</span>
                                <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-slate-100">
                                  <div className="h-full bg-sky-500" style={{ width: `${capSites ? Math.min(100, (usedSites / capSites) * 100) : 0}%` }} />
                                </div>
                              </div>
                              <div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Серверов: </span>
                                <span className="font-semibold text-indigo-700">{gsOnNode}</span>
                                <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-slate-100">
                                  <div className="h-full bg-indigo-500" style={{ width: `${node.totalRam ? Math.min(100, (gsOnNode * 2048 / node.totalRam) * 100) : 0}%` }} />
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(type === 'game' || type === 'both') ? (
                            `MC:${Number.isFinite(Number(node.slotPrices?.minecraft)) ? Number(node.slotPrices?.minecraft) : (Number.isFinite(Number(node.slotPrice)) ? Number(node.slotPrice) : 10)} ₽ | CS2:${Number.isFinite(Number(node.slotPrices?.cs2)) ? Number(node.slotPrices?.cs2) : (Number.isFinite(Number(node.slotPrice)) ? Number(node.slotPrice) : 10)} ₽ | CS16:${Number.isFinite(Number(node.slotPrices?.cs16)) ? Number(node.slotPrices?.cs16) : (Number.isFinite(Number(node.slotPrice)) ? Number(node.slotPrice) : 10)} ₽`
                          ) : (
                            <span className="text-slate-400 text-xs">не для игр</span>
                          )}
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
                                  slotPrices: (node.slotPrices && typeof node.slotPrices === 'object') ? node.slotPrices : undefined,
                                  type: node.type || 'game',
                                  capacityWebSites: Number.isFinite(Number(node.capacityWebSites)) ? Number(node.capacityWebSites) : 50,
                                  usedWebSites: Number(node.usedWebSites || 0),
                                });
                                setIsNodeGamesModalOpen(true);
                              }}
                              className="text-gray-600 hover:text-gray-900"
                              title="Доступные игры / тип ноды"
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
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isNodeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Добавить Ноду</h2>
                <div className="flex flex-col gap-4">
                    <input type="text" placeholder="Название (MSK-1)" className="w-full p-2 border rounded" value={currentNode.name || ''} onChange={e => setCurrentNode({...currentNode, name: e.target.value})} />
                    <input type="text" placeholder="IP" className="w-full p-2 border rounded" value={currentNode.ip || ''} onChange={e => setCurrentNode({...currentNode, ip: e.target.value})} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" placeholder="SSH Port (22)" className="w-full p-2 border rounded" value={currentNode.sshPort || 22} onChange={e => setCurrentNode({...currentNode, sshPort: parseInt(e.target.value) || 22})} />
                      <input type="number" placeholder="Total RAM (MB)" className="w-full p-2 border rounded" value={currentNode.totalRam || 0} onChange={e => setCurrentNode({...currentNode, totalRam: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="SSH User (root)" className="w-full p-2 border rounded" value={currentNode.sshUser || 'root'} onChange={e => setCurrentNode({...currentNode, sshUser: e.target.value})} />
                      <input type="password" placeholder="SSH Password" className="w-full p-2 border rounded" value={currentNode.sshPassword || ''} onChange={e => setCurrentNode({...currentNode, sshPassword: e.target.value})} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Тип ноды</label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { id: 'game', label: 'Игровая', desc: 'Только сервера' },
                          { id: 'web', label: 'Веб', desc: 'Только сайты' },
                          { id: 'both', label: 'Универсал', desc: 'Сервера + сайты' },
                        ] as const).map(t => {
                          const active = (currentNode.type || 'game') === t.id;
                          return (
                            <label key={t.id} className={`cursor-pointer rounded-lg border-2 p-2.5 transition ${active ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                              <input
                                type="radio"
                                className="sr-only"
                                name="node-type"
                                checked={active}
                                onChange={() => setCurrentNode({ ...currentNode, type: t.id })}
                              />
                              <div className="text-sm font-semibold text-gray-900">{t.label}</div>
                              <div className="text-[11px] text-gray-500">{t.desc}</div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {((currentNode.type || 'game') !== 'game') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Макс. количество сайтов</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="50"
                          className="w-full p-2 border rounded"
                          value={Number.isFinite(Number(currentNode.capacityWebSites)) ? Number(currentNode.capacityWebSites) : 50}
                          onChange={e => setCurrentNode({ ...currentNode, capacityWebSites: Math.max(1, parseInt(e.target.value) || 50), usedWebSites: 0 })}
                        />
                      </div>
                    )}

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
              <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Параметры ноды</h2>
                  <button onClick={() => setIsNodeGamesModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Тип ноды</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: 'game', label: 'Игровая' },
                        { id: 'web', label: 'Веб' },
                        { id: 'both', label: 'Универсал' },
                      ] as const).map(t => {
                        const active = (currentNode.type || 'game') === t.id;
                        return (
                          <label key={t.id} className={`cursor-pointer rounded-lg border-2 p-2 text-center transition ${active ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input type="radio" className="sr-only" name="node-type-edit" checked={active} onChange={() => setCurrentNode({ ...currentNode, type: t.id })} />
                            <div className="text-sm font-semibold">{t.label}</div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  {((currentNode.type || 'game') !== 'game') && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Макс. сайтов</label>
                        <input type="number" min="1" className="w-full p-2 border rounded text-sm"
                          value={Number.isFinite(Number(currentNode.capacityWebSites)) ? Number(currentNode.capacityWebSites) : 50}
                          onChange={e => setCurrentNode({ ...currentNode, capacityWebSites: Math.max(1, parseInt(e.target.value) || 50) })} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Размещено (вручную)</label>
                        <input type="number" min="0" className="w-full p-2 border rounded text-sm"
                          value={Number.isFinite(Number(currentNode.usedWebSites)) ? Number(currentNode.usedWebSites) : 0}
                          onChange={e => setCurrentNode({ ...currentNode, usedWebSites: Math.max(0, parseInt(e.target.value) || 0) })} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Доступные игры</div>
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
                <div className="pt-5 flex flex-col gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Цены за слот</div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minecraft (₽)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full p-2 border rounded"
                      value={Number.isFinite(Number(currentNode.slotPrices?.minecraft)) ? Number(currentNode.slotPrices?.minecraft) : (Number.isFinite(Number(currentNode.slotPrice)) ? Number(currentNode.slotPrice) : 10)}
                      onChange={e => setCurrentNode({ ...currentNode, slotPrices: { ...(currentNode.slotPrices || {}), minecraft: Number(e.target.value) } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CS 2 (₽)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full p-2 border rounded"
                      value={Number.isFinite(Number(currentNode.slotPrices?.cs2)) ? Number(currentNode.slotPrices?.cs2) : (Number.isFinite(Number(currentNode.slotPrice)) ? Number(currentNode.slotPrice) : 10)}
                      onChange={e => setCurrentNode({ ...currentNode, slotPrices: { ...(currentNode.slotPrices || {}), cs2: Number(e.target.value) } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CS 1.6 (₽)</label>
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
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Поиск по названию..."
                        value={gsSearch}
                        onChange={(e) => setGsSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
                      />
                    </div>
                    <select
                      value={gsStatusFilter}
                      onChange={(e) => setGsStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="all">Все статусы</option>
                      <option value="running">Работает</option>
                      <option value="stopped">Остановлен</option>
                      <option value="pending_payment">Ожидает оплаты</option>
                      <option value="provisioning">Настройка</option>
                      <option value="suspended">Приостановлен</option>
                    </select>
                    <select
                      value={gsGameFilter}
                      onChange={(e) => setGsGameFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="all">Все игры</option>
                      {Array.from(new Set(gameServers.map((g) => g.game))).map((game) => (
                        <option key={game} value={game}>{game}</option>
                      ))}
                    </select>
                    <select
                      value={gsNodeFilter}
                      onChange={(e) => setGsNodeFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="all">Все ноды</option>
                      {hostingNodes.map((n) => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedGameServerIds.size > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setMassActionMenuOpen(!massActionMenuOpen)}
                          disabled={massActionLoading}
                          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Массовые действия ({selectedGameServerIds.size})
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </button>
                        {massActionMenuOpen && (
                          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => handleMassAction('start')}
                                disabled={massActionLoading}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              >
                                ▶ Запустить
                              </button>
                              <button
                                onClick={() => handleMassAction('stop')}
                                disabled={massActionLoading}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              >
                                ⏹ Остановить
                              </button>
                              <button
                                onClick={() => handleMassAction('restart')}
                                disabled={massActionLoading}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              >
                                🔄 Перезапустить
                              </button>
                              <button
                                onClick={() => handleMassAction('extend_1')}
                                disabled={massActionLoading}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              >
                                📅 Продлить на 1 мес
                              </button>
                              <button
                                onClick={() => handleMassAction('delete')}
                                disabled={massActionLoading}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                🗑 Удалить
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedGameServerIds.size > 0 && (
                      <button
                        onClick={clearGameServerSelection}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Снять выделение
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 w-12">
                          <input
                            type="checkbox"
                            checked={filteredGameServers.length > 0 && selectedGameServerIds.size === filteredGameServers.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                filteredGameServers.forEach((gs) => selectedGameServerIds.add(gs.id));
                                setSelectedGameServerIds(new Set(selectedGameServerIds));
                              } else {
                                clearGameServerSelection();
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Игра</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Слоты</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Порт</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Нода</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Оплачен до</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Управление</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredGameServers.map((gs) => (
                        <tr key={gs.id} className={selectedGameServerIds.has(gs.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedGameServerIds.has(gs.id)}
                              onChange={() => toggleGameServerSelection(gs.id)}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div>{gs.name}</div>
                            <div className="text-xs text-gray-500">{users.find(u => u.id === gs.userId)?.name || 'Unknown'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gs.game}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {gs.slots || '-'} слотов
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gs.port || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                gs.status === 'running' ? 'bg-green-100 text-green-800' :
                                gs.status === 'stopped' ? 'bg-gray-100 text-gray-800' :
                                gs.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                                gs.status === 'provisioning' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                              {gs.status === 'running' ? 'Работает' :
                               gs.status === 'stopped' ? 'Остановлен' :
                               gs.status === 'pending_payment' ? 'Ожидает оплаты' :
                               gs.status === 'provisioning' ? 'Настройка' :
                               gs.status === 'suspended' ? 'Приостановлен' : gs.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{gs.node?.name || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {gs.paidUntil ? formatDate(gs.paidUntil) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleControlGameServer(gs.id, 'start')} className="text-green-600 hover:text-green-900 mr-2">Start</button>
                            <button onClick={() => handleControlGameServer(gs.id, 'stop')} className="text-red-600 hover:text-red-900 mr-2">Stop</button>
                            <button onClick={() => handleControlGameServer(gs.id, 'restart')} className="text-blue-600 hover:text-blue-900">Restart</button>
                          </td>
                        </tr>
                      ))}
                      {filteredGameServers.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                            Нет игровых серверов
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'web_sites' && (
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" placeholder="Поиск (домен, пользователь, ID)..." value={wsSearch} onChange={e => setWsSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-72" />
                    </div>
                    <select value={wsStatusFilter} onChange={e => setWsStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
                      <option value="all">Все статусы</option>
                      <option value="pending">Ожидает</option>
                      <option value="provisioning">Разворачивается</option>
                      <option value="active">Работает</option>
                      <option value="suspended">Приостановлен</option>
                      <option value="deleted">Удалён</option>
                    </select>
                    <select value={wsPlanFilter} onChange={e => setWsPlanFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
                      <option value="all">Все тарифы</option>
                      <option value="landing">Landing (149₽)</option>
                      <option value="business">Business (299₽)</option>
                      <option value="premium">Premium (599₽)</option>
                    </select>
                    <select value={wsNodeFilter} onChange={e => setWsNodeFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300">
                      <option value="all">Все ноды</option>
                      {hostingNodes.filter(n => !n.type || n.type === 'web' || n.type === 'both').map(n => (
                        <option key={n.id} value={n.id}>{n.name} ({n.ip})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button disabled={selectedWebSiteIds.size === 0 || wsMassActionLoading}
                        onClick={() => document.getElementById('ws-bulk-menu')?.classList.toggle('hidden')}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                        {wsMassActionLoading ? <Loader className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                        Массовые ({selectedWebSiteIds.size})
                      </button>
                      <div id="ws-bulk-menu" className="hidden absolute right-0 mt-2 z-20 w-40 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                        {(['start', 'restart', 'stop', 'delete'] as const).map(a => (
                          <button key={a} onClick={() => { document.getElementById('ws-bulk-menu')?.classList.add('hidden'); handleBulkWebSiteAction(a); }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${a === 'delete' ? 'text-red-700' : 'text-gray-700'}`}>
                            {a === 'start' ? 'Запустить' : a === 'stop' ? 'Остановить' : a === 'restart' ? 'Рестарт' : 'Удалить'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => setIsWebSiteMigrateOpen(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    >
                      <ChevronRight className="h-4 w-4" /> Мигрировать
                    </button>
                    <button onClick={() => {
                      setCurrentWebSite({ plan: 'business', periodMonths: 1, price: 299 });
                      setIsWebSiteModalOpen(true);
                    }} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      <Plus className="h-5 w-5 mr-2" /> Создать сайт
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                            checked={filteredWebSites.length > 0 && filteredWebSites.every(ws => selectedWebSiteIds.has(ws.id))}
                            onChange={e => {
                              if (e.target.checked) setSelectedWebSiteIds(new Set(filteredWebSites.map(ws => ws.id)));
                              else clearWebSiteSelection();
                            }} />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Домен</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Клиент</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тариф</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Нода</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Оплачено до</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Управление</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredWebSites.map(ws => {
                        const statusMap: Record<string, { label: string; cls: string }> = {
                          pending: { label: 'Ожидает', cls: 'bg-amber-100 text-amber-800' },
                          provisioning: { label: 'Разворачивается', cls: 'bg-indigo-100 text-indigo-800' },
                          active: { label: 'Работает', cls: 'bg-green-100 text-green-800' },
                          suspended: { label: 'Приостановлен', cls: 'bg-rose-100 text-rose-800' },
                          deleting: { label: 'Удаляется', cls: 'bg-gray-100 text-gray-800' },
                          deleted: { label: 'Удалён', cls: 'bg-gray-100 text-gray-500' },
                        };
                        const planMap: Record<string, { label: string; cls: string }> = {
                          landing: { label: 'Landing 400₽', cls: 'bg-sky-100 text-sky-700' },
                          business: { label: 'Business 750₽', cls: 'bg-violet-100 text-violet-700' },
                          premium: { label: 'Premium 1200₽', cls: 'bg-amber-100 text-amber-800' },
                        };
                        const s = statusMap[ws.status] || { label: ws.status, cls: 'bg-gray-100 text-gray-700' };
                        const p = planMap[ws.plan] || { label: ws.plan, cls: 'bg-gray-100 text-gray-700' };
                        return (
                          <tr key={ws.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                                checked={selectedWebSiteIds.has(ws.id)}
                                onChange={() => toggleWebSiteSelection(ws.id)} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-mono text-sm font-semibold text-gray-900">
                                {ws.domain ? (
                                  <a href={`http://${ws.domain}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{ws.domain} ↗</a>
                                ) : <span className="text-gray-400 italic">домен не указан</span>}
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                {ws.domainType === 'subdomain' ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">🎁 Wexa Поддомен</span>
                                ) : ws.domain ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">🌐 Свой домен</span>
                                ) : null}
                                <span className="text-[11px] text-gray-400 font-mono">{ws.id?.slice(0, 10)}…</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900 font-medium">{ws.user?.name || ws.userId?.slice(0, 8)}</div>
                              <div className="text-xs text-gray-500">{ws.user?.email || ''}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.cls}`}>{p.label}</span>
                              {Number.isFinite(Number(ws.price)) && <div className="text-[11px] text-gray-500 mt-0.5">факт {Number(ws.price)} ₽/мес</div>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div className="font-medium">{ws.node?.name || '-'}</div>
                              <div className="text-[11px] text-gray-400 font-mono">{ws.node?.ip || ''}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                              {ws.paidUntil ? new Date(ws.paidUntil).toLocaleDateString('ru-RU') : '-'}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <button onClick={() => handleControlWebSite(ws.id, 'start')} className="text-green-700 hover:text-green-900 px-1.5 text-xs">Start</button>
                              <button onClick={() => handleControlWebSite(ws.id, 'restart')} className="text-blue-700 hover:text-blue-900 px-1.5 text-xs">Restart</button>
                              <button onClick={() => handleControlWebSite(ws.id, 'stop')} className="text-amber-700 hover:text-amber-900 px-1.5 text-xs">Stop</button>
                              <button onClick={() => handleControlWebSite(ws.id, 'delete')} className="text-red-700 hover:text-red-900 px-1.5 text-xs">Del</button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredWebSites.length === 0 && !loading && (
                        <tr>
                          <td colSpan={8} className="px-6 py-16 text-center">
                            <Globe className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                            <div className="text-sm text-slate-500">Сайтов пока нет. Нажмите «Создать сайт» или включите тариф через Configurator.</div>
                          </td>
                        </tr>
                      )}
                      {loading && webSites.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                            <Loader className="inline-block h-4 w-4 animate-spin mr-2" /> Загрузка...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {isGameServerModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Создать Сервер</h2>
                <div className="flex flex-col gap-4">
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
                <form onSubmit={handleSavePortfolio} className="flex flex-col gap-4">
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
                <form onSubmit={handleSaveInvoice} className="flex flex-col gap-4">
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

          {/* Manual Invoice Modal */}
          {isManualInvoiceOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Создать ручной счёт</h2>
                  <button onClick={() => setIsManualInvoiceOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleSubmitManualInvoice} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Клиент *</label>
                    <select
                      required
                      value={manualInvoice.userId}
                      onChange={(e) => setManualInvoice({ ...manualInvoice, userId: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    >
                      <option value="">Выберите клиента</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Название счёта *</label>
                    <input
                      type="text"
                      required
                      placeholder="Например: Подписка на сервер"
                      value={manualInvoice.title}
                      onChange={(e) => setManualInvoice({ ...manualInvoice, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Сумма (₽) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={manualInvoice.amount}
                        onChange={(e) => setManualInvoice({ ...manualInvoice, amount: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Период (месяцев) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={manualInvoice.periodMonths}
                        onChange={(e) => setManualInvoice({ ...manualInvoice, periodMonths: parseInt(e.target.value) || 1 })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Привязать к игровому серверу (необязательно)
                    </label>
                    <select
                      value={manualInvoice.gameServerId || ''}
                      onChange={(e) =>
                        setManualInvoice({
                          ...manualInvoice,
                          gameServerId: e.target.value ? e.target.value : undefined,
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    >
                      <option value="">Без привязки</option>
                      {gameServers
                        .filter((gs) => gs.userId === manualInvoice.userId || !manualInvoice.userId)
                        .map((gs) => (
                          <option key={gs.id} value={gs.id}>
                            {gs.name} ({gs.game}) — {users.find((u) => u.id === gs.userId)?.name || 'Unknown'}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsManualInvoiceOpen(false)}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                      Создать счёт
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
                <div className="flex flex-col gap-4">
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
                <form onSubmit={handleSaveProject} className="flex flex-col gap-4">
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
          <div 
           
           
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
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50">
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
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {adjustModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
          onClick={() => !adjustModal.loading && setAdjustModal((s) => ({ ...s, open: false }))}
        >
          <div
           
           
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className={`p-5 bg-gradient-to-br ${
              adjustModal.sign === '+'
                ? 'from-emerald-500 to-emerald-600'
                : 'from-rose-500 to-rose-600'
            } text-white`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    {adjustModal.sign === '+' ? 'Пополнить баланс' : 'Списать средства'}
                  </h3>
                  <p className="text-sm text-white/90 mt-1">Пользователь: {adjustModal.targetUserName}</p>
                </div>
                <button
                  onClick={() => !adjustModal.loading && setAdjustModal((s) => ({ ...s, open: false }))}
                  className="text-white/90 hover:text-white"
                  disabled={adjustModal.loading}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Сумма операции</label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-bold ${
                    adjustModal.sign === '+' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {adjustModal.sign}
                  </span>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={adjustModal.amount}
                    onChange={(e) => setAdjustModal((s) => ({ ...s, amount: e.target.value }))}
                    disabled={adjustModal.loading}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2.5 pl-9 text-lg font-semibold disabled:bg-gray-50"
                    placeholder="100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₽</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {adjustModal.sign === '+' ? (
                    [100, 500, 1000, 3000, 10000].map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAdjustModal((s) => ({ ...s, amount: String(a) }))}
                        disabled={adjustModal.loading}
                        className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        +{a} ₽
                      </button>
                    ))
                  ) : (
                    [100, 500, 1000, 3000].map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAdjustModal((s) => ({ ...s, amount: String(a) }))}
                        disabled={adjustModal.loading}
                        className="px-3 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 disabled:opacity-50"
                      >
                        -{a} ₽
                      </button>
                    ))
                  )}
                </div>
                {Number(adjustModal.amount) > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Изменение баланса:{' '}
                    <span className={`font-bold ${adjustModal.sign === '+' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {adjustModal.sign}{Number(adjustModal.amount).toFixed(2)} ₽
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Комментарий <span className="text-gray-400 font-normal">(причина)</span>
                </label>
                <textarea
                  rows={3}
                  value={adjustModal.description}
                  onChange={(e) => setAdjustModal((s) => ({ ...s, description: e.target.value }))}
                  disabled={adjustModal.loading}
                  placeholder={adjustModal.sign === '+' ? 'Бонус, акция, ручное пополнение...' : 'Штраф, отмена услуги...'}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 disabled:bg-gray-50 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setAdjustModal((s) => ({ ...s, open: false }))}
                disabled={adjustModal.loading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={submitAdjustBalance}
                disabled={adjustModal.loading || !Number(adjustModal.amount) || Number(adjustModal.amount) <= 0}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  adjustModal.sign === '+'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                    : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700'
                }`}
              >
                {adjustModal.loading && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {adjustModal.loading ? 'Выполняем...' : adjustModal.sign === '+' ? 'Пополнить' : 'Списать'}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Web Site Custom Create Modal */}
        {isWebSiteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">Создать сайт (админский)</h2>
                <button onClick={() => setIsWebSiteModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Пользователь-владелец *</label>
                  <select className="w-full p-2.5 border rounded-lg"
                    value={currentWebSite.userId || ''}
                    onChange={e => setCurrentWebSite({ ...currentWebSite, userId: e.target.value })}>
                    <option value="">Выберите пользователя…</option>
                    {users.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) · баланс {Number(u.balance || 0).toFixed(0)} ₽
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Домен</label>
                    <input type="text" placeholder="mycompany.ru" className="w-full p-2.5 border rounded-lg font-mono"
                      value={currentWebSite.domain || ''}
                      onChange={e => setCurrentWebSite({ ...currentWebSite, domain: e.target.value.trim() })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Тариф *</label>
                    <select className="w-full p-2.5 border rounded-lg"
                      value={currentWebSite.plan || 'business'}
                      onChange={e => setCurrentWebSite({ ...currentWebSite, plan: e.target.value as any })}>
                      <option value="landing">Landing (статика) · 399 ₽/мес</option>
                      <option value="business">Business (Node.js EJS · Ordlan template) · 799 ₽/мес</option>
                      <option value="premium">Premium (24/7 priority) · 1299 ₽/мес</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Период (месяцев)</label>
                    <select className="w-full p-2.5 border rounded-lg"
                      value={Number(currentWebSite.periodMonths || 1)}
                      onChange={e => setCurrentWebSite({ ...currentWebSite, periodMonths: Number(e.target.value) })}>
                      {[1, 3, 6, 12].map(m => (
                        <option key={m} value={m}>{m} мес {m === 3 ? '(-5%)' : m === 6 ? '(-10%)' : m === 12 ? '(-15%)' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Цена (кастом, ₽/мес)</label>
                    <input type="number" min="0" placeholder="по тарифу" className="w-full p-2.5 border rounded-lg"
                      value={Number.isFinite(Number(currentWebSite.price)) ? Number(currentWebSite.price) : ''}
                      onChange={e => setCurrentWebSite({ ...currentWebSite, price: e.target.value === '' ? undefined : Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Нода</label>
                    <select className="w-full p-2.5 border rounded-lg"
                      value={currentWebSite.nodeId || ''}
                      onChange={e => setCurrentWebSite({ ...currentWebSite, nodeId: e.target.value })}>
                      <option value="">Авто (любая web/both с местом)</option>
                      {hostingNodes.filter(n => !n.type || n.type === 'web' || n.type === 'both').map(n => {
                        const used = Number(n.usedWebSites || 0); const cap = Number(n.capacityWebSites || 50);
                        return <option key={n.id} value={n.id}>{n.name} ({n.ip}) · {used}/{cap}</option>;
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Шаблон / Core</label>
                  <select className="w-full p-2.5 border rounded-lg"
                    value={currentWebSite.coreTemplate || ''}
                    onChange={e => setCurrentWebSite({ ...currentWebSite, coreTemplate: e.target.value || undefined })}>
                    <option value="">По умолчанию (Landing → static, Business/Premium → Express Business)</option>
                    <option value="orlan-taxi-business">Express Business шаблон (Express/EJS + админка)</option>
                    <option value="static-blank">Static blank (empty public_html)</option>
                    <option value="node-blank">Node.js blank (package.json + server.js)</option>
                  </select>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <b>Списание:</b> при сохранении сумма (price × период со скидкой) будет списана с баланса пользователя автоматически (autoPay=true).
                  Если средств не хватит — сайт создастся в статусе pending, будет выставлен счёт.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-6 mt-4 border-t">
                <button onClick={() => setIsWebSiteModalOpen(false)} className="px-4 py-2 border rounded-lg">Отмена</button>
                <button onClick={handleCreateWebSite} disabled={wsMassActionLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {wsMassActionLoading && <Loader className="h-4 w-4 animate-spin" />}
                  Создать сайт
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Web Site Migrate Modal */}
        {isWebSiteMigrateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Миграция сайта на другую ноду</h2>
                <button onClick={() => setIsWebSiteMigrateOpen(false)} className="text-gray-400 hover:text-gray-500">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Сайт для миграции</label>
                  <select className="w-full p-2.5 border rounded-lg"
                    value={webSiteMigrate.siteId}
                    onChange={e => setWebSiteMigrate({ ...webSiteMigrate, siteId: e.target.value })}>
                    <option value="">Выберите сайт…</option>
                    {webSites.filter(ws => ws.status === 'active' || ws.status === 'suspended').map(ws => (
                      <option key={ws.id} value={ws.id}>
                        {ws.domain || ws.id?.slice(0, 10)} · {ws.user?.name || ws.userId?.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Целевая нода (web/both)</label>
                  <select className="w-full p-2.5 border rounded-lg"
                    value={webSiteMigrate.newNodeId}
                    onChange={e => setWebSiteMigrate({ ...webSiteMigrate, newNodeId: e.target.value })}>
                    <option value="">Выберите ноду…</option>
                    {hostingNodes
                      .filter(n => n.type === 'web' || n.type === 'both')
                      .filter(n => {
                        const used = Number(n.usedWebSites || 0);
                        const cap = Number(n.capacityWebSites || 50);
                        return cap - used > 0;
                      })
                      .map(n => (
                        <option key={n.id} value={n.id}>
                          {n.name} ({n.ip}) · {Number(n.usedWebSites || 0)}/{Number(n.capacityWebSites || 50)}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 flex flex-col gap-1">
                  <p>Будет выполнено: <code className="bg-white px-1.5 rounded">rsync</code> файлов сайта + бэкапов между нодами,</p>
                  <p>на старой ноде: umount bind, userdel, pm2 delete, nginx conf rm.</p>
                  <p>на новой ноде: useradd / SFTP / pm2 ecosystem / nginx virtual host (вся провиженинг).</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-5 mt-4 border-t">
                <button onClick={() => setIsWebSiteMigrateOpen(false)} className="px-4 py-2 border rounded-lg">Отмена</button>
                <button onClick={handleMigrateWebSite} disabled={wsMassActionLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {wsMassActionLoading && <Loader className="h-4 w-4 animate-spin" />}
                  Запустить миграцию
                </button>
              </div>
            </div>
          </div>
        )}

    </Layout>
  );
};

export default AdminDashboard;
