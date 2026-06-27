import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { motion } from 'framer-motion';
import { 
  FileText, 
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Download,
  CreditCard,
  Briefcase,
  Send,
  X,
  Loader,
  Plus,
  Settings,
  Users,
  Search,
  MessageSquare,
  Server,
  Folder,
  Home,
  Upload,
  Trash,
  Trash2,
  Minus
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
  monthlyRate?: number;
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

interface HostingNode {
  id: string;
  name: string;
  ip: string;
  supportedGames?: string[];
  slotPrice?: number;
  slotPrices?: Record<string, number>;
}

interface GameServer {
  id: string;
  name: string;
  game: string;
  port: number;
  status: string;
  ram: number;
  slots: number;
  monthlyPrice?: number;
  paidUntil?: string;
  node?: HostingNode;
  containerId?: string;
  rconPassword?: string;
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
  const firstLoadRef = useRef(true);
  const fetchDataInFlightRef = useRef(false);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Debug projects
  console.log('Client Projects:', projects);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'billing' | 'leads' | 'requests' | 'game_servers'>('overview');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  
  // Game Hosting State
  const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState(false);
  const [isConsoleModalOpen, setIsConsoleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [isServerPanelOpen, setIsServerPanelOpen] = useState(false);
  const [currentPanelServer, setCurrentPanelServer] = useState<GameServer | null>(null);
  const [serverPanelTab, setServerPanelTab] = useState<'console' | 'files' | 'settings' | 'access'>('console');
  const [currentConsoleServer, setCurrentConsoleServer] = useState<GameServer | null>(null);
  const [currentSettingsServer, setCurrentSettingsServer] = useState<GameServer | null>(null);
  const [currentFileServer, setCurrentFileServer] = useState<GameServer | null>(null);
  const [serverSettings, setServerSettings] = useState<any>({});
  const [serverFiles, setServerFiles] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [editorContent, setEditorContent] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState('');
  const [consoleCommand, setConsoleCommand] = useState('');
  const consoleLogsRef = useRef<HTMLDivElement | null>(null);
  const currentConsoleServerId = currentConsoleServer?.id;
  const [nodes, setNodes] = useState<HostingNode[]>([]);
  const [gameServers, setGameServers] = useState<GameServer[]>([]);
  const [playerCounts, setPlayerCounts] = useState<Record<string, { online: number; max: number }>>({});
  const [sftpAccess, setSftpAccess] = useState<Record<string, { enabled: boolean; host?: string; port?: number | null; username?: string; password?: string; path?: string }>>({});
  const [sftpLoading, setSftpLoading] = useState<Record<string, boolean>>({});
  const [orderConfig, setOrderConfig] = useState({
      game: 'minecraft',
      nodeId: '',
      ram: 1024,
      slots: 10
  });
  const gameOptions = [
    { id: 'minecraft', label: 'Minecraft (Java)' },
    { id: 'cs2', label: 'CS 2' },
    { id: 'cs16', label: 'CS 1.6' }
  ] as const;
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  const selectedOrderNode = nodes.find(n => n.id === orderConfig.nodeId);
  const supportedGamesForOrderNode = Array.isArray(selectedOrderNode?.supportedGames)
    ? selectedOrderNode.supportedGames
    : gameOptions.map(g => g.id);
  const availableOrderGames = gameOptions.filter(g => supportedGamesForOrderNode.includes(g.id));
  const slotPricesForOrderNode = selectedOrderNode?.slotPrices && typeof selectedOrderNode.slotPrices === 'object' ? selectedOrderNode.slotPrices : null;
  const slotPriceForOrderNodeGame = Number.isFinite(Number(slotPricesForOrderNode?.[orderConfig.game]))
    ? Number(slotPricesForOrderNode?.[orderConfig.game])
    : (Number.isFinite(Number(selectedOrderNode?.slotPrice)) ? Number(selectedOrderNode?.slotPrice) : 10);
  const monthlyOrderPrice = Math.ceil(orderConfig.slots * slotPriceForOrderNodeGame);

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
        const error = await res.json().catch(() => ({}));
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

  const handleExtendGameServer = async (gameServerId: string, months: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/game-servers/${gameServerId}/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ months })
      });

      if (res.ok) {
        const invoice = await res.json();
        handlePayInvoice(invoice.id);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Ошибка создания счета');
      }
    } catch (error) {
      console.error('Extend game server error:', error);
      alert('Ошибка соединения с сервером');
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
    // Check for order parameters in URL (from Services page)
    const params = new URLSearchParams(location.search);
    const serviceType = params.get('service');
    
    if (serviceType === 'game' && nodes.length > 0) {
        const game = params.get('game') || 'minecraft';
        setOrderConfig({
            game: game,
            nodeId: nodes[0].id,
            ram: 1024,
            slots: 10
        });
        setIsCreateServerModalOpen(true);
        // Clear params
        window.history.replaceState({}, '', '/dashboard');
    }
  }, [nodes, location]);

  useEffect(() => {
    if (!orderConfig.nodeId) return;
    const node = nodes.find(n => n.id === orderConfig.nodeId);
    const supported = Array.isArray(node?.supportedGames) ? node.supportedGames : gameOptions.map(g => g.id);
    if (!supported.length) return;
    setOrderConfig(prev => (supported.includes(prev.game) ? prev : { ...prev, game: supported[0] }));
  }, [orderConfig.nodeId, nodes]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const gameServerIdsKey = gameServers.map(gs => gs.id).join('|');
  useEffect(() => {
    if (!gameServers.length) return;
    gameServers.forEach(gs => fetchPlayersCount(gs.id));
    const intervalId = setInterval(() => {
      gameServers.forEach(gs => fetchPlayersCount(gs.id));
    }, 5000);
    return () => clearInterval(intervalId);
  }, [gameServerIdsKey]);

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
      if (fetchDataInFlightRef.current) return;
      fetchDataInFlightRef.current = true;
      if (firstLoadRef.current) setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        fetchDataInFlightRef.current = false;
        if (firstLoadRef.current) setLoading(false);
        navigate('/login');
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const results = await Promise.allSettled([
          fetch('/api/invoices/my', { headers }),
          fetch('/api/projects/my', { headers }),
          fetch('/api/orders', { headers }),
          fetch('/api/nodes/public', { headers }),
          fetch('/api/game-servers', { headers }),
          fetch('/api/leads', { headers })
        ]);

        const invoicesRes = results[0].status === 'fulfilled' ? results[0].value : null;
        const projectRes = results[1].status === 'fulfilled' ? results[1].value : null;
        const ordersRes = results[2].status === 'fulfilled' ? results[2].value : null;
        const nodesRes = results[3].status === 'fulfilled' ? results[3].value : null;
        const gsRes = results[4].status === 'fulfilled' ? results[4].value : null;
        const leadsRes = results[5].status === 'fulfilled' ? results[5].value : null;

        if (invoicesRes?.ok) {
          const data = await invoicesRes.json();
          if (Array.isArray(data)) setInvoices(data);
        }

        if (projectRes?.ok) {
          const data = await projectRes.json();
          setProjects(Array.isArray(data) ? data : []);
        }

        if (ordersRes?.ok) {
          const data = await ordersRes.json();
          if (Array.isArray(data)) setOrders(data);
        }

        if (nodesRes?.ok) {
          const data = await nodesRes.json();
          if (Array.isArray(data)) setNodes(data);
        }

        if (gsRes?.ok) {
          const data = await gsRes.json();
          if (Array.isArray(data)) setGameServers(data);
        }

        if (leadsRes?.ok) {
          const data = await leadsRes.json();
          if (Array.isArray(data)) setLeads(data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (firstLoadRef.current) setLoading(false);
        firstLoadRef.current = false;
        fetchDataInFlightRef.current = false;
      }
    } catch (outerError) {
      console.error('Outer error in fetchData:', outerError);
      fetchDataInFlightRef.current = false;
    }
  };

  const fetchPlayersCount = async (serverId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/game-servers/${serverId}/players`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPlayerCounts(prev => ({
          ...prev,
          [serverId]: {
            online: Number(data?.online) || 0,
            max: Number(data?.max) || 0
          }
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSftpAccess = async (serverId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/game-servers/${serverId}/sftp`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSftpAccess(prev => ({
          ...prev,
          [serverId]: {
            enabled: Boolean(data?.enabled),
            host: data?.host,
            port: data?.port ?? null,
            username: data?.username,
            password: data?.password,
            path: data?.path
          }
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnableSftp = async (serverId: string) => {
    try {
      setSftpLoading(prev => ({ ...prev, [serverId]: true }));
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/game-servers/${serverId}/sftp/enable`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSftpAccess(prev => ({
          ...prev,
          [serverId]: {
            enabled: true,
            host: data?.host,
            port: data?.port ?? null,
            username: data?.username,
            password: data?.password,
            path: data?.path
          }
        }));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Ошибка SFTP: ${err.message || 'не удалось включить'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка SFTP: не удалось включить');
    } finally {
      setSftpLoading(prev => ({ ...prev, [serverId]: false }));
    }
  };

  const handleDisableSftp = async (serverId: string) => {
    try {
      setSftpLoading(prev => ({ ...prev, [serverId]: true }));
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/game-servers/${serverId}/sftp/disable`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSftpAccess(prev => ({
          ...prev,
          [serverId]: { enabled: false }
        }));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Ошибка SFTP: ${err.message || 'не удалось отключить'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка SFTP: не удалось отключить');
    } finally {
      setSftpLoading(prev => ({ ...prev, [serverId]: false }));
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

  const handleDeleteServer = async (id: string) => {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/game-servers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            fetchData();
        } else {
            alert('Ошибка при удалении сервера');
        }
    } catch (error) {
        console.error('Delete server error:', error);
        alert('Ошибка при удалении сервера');
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
        alert('Команда отправлена');
        fetchData();
    } catch (error) {
        console.error(error);
    }
  };

  const fetchConsoleLogs = async (id: string) => {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/game-servers/${id}/logs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setConsoleLogs(data.logs);
        }
    } catch (e) {
        console.error(e);
    }
  };

  useEffect(() => {
    const shouldPoll = isConsoleModalOpen || (isServerPanelOpen && serverPanelTab === 'console');
    if (!shouldPoll || !currentConsoleServerId) return;
    fetchConsoleLogs(currentConsoleServerId);
    const intervalId = setInterval(() => {
      fetchConsoleLogs(currentConsoleServerId);
    }, 2000);
    return () => clearInterval(intervalId);
  }, [isConsoleModalOpen, isServerPanelOpen, serverPanelTab, currentConsoleServerId]);

  useEffect(() => {
    const shouldScroll = isConsoleModalOpen || (isServerPanelOpen && serverPanelTab === 'console');
    if (!shouldScroll) return;
    const el = consoleLogsRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [consoleLogs, isConsoleModalOpen, isServerPanelOpen, serverPanelTab]);

  useEffect(() => {
    if (!isServerPanelOpen || !currentPanelServer) return;
    if (serverPanelTab === 'console') {
      setCurrentConsoleServer(currentPanelServer);
      if (!consoleLogs) setConsoleLogs('Загрузка логов...');
      fetchConsoleLogs(currentPanelServer.id);
    }
    if (serverPanelTab === 'files') {
      setCurrentFileServer(currentPanelServer);
      setEditorContent(null);
      setEditingFile(null);
      fetchFiles(currentPanelServer.id, '/');
    }
    if (serverPanelTab === 'settings') {
      setCurrentSettingsServer(currentPanelServer);
      fetchServerSettings(currentPanelServer.id);
    }
    if (serverPanelTab === 'access') {
      fetchSftpAccess(currentPanelServer.id);
    }
  }, [isServerPanelOpen, currentPanelServer?.id, serverPanelTab]);

  const handleSendConsoleCommand = async () => {
    if (!currentConsoleServer || !consoleCommand) return;
    try {
        const token = localStorage.getItem('token');
        await fetch(`/api/game-servers/${currentConsoleServer.id}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ command: consoleCommand })
        });
        setConsoleCommand('');
        fetchConsoleLogs(currentConsoleServer.id);
    } catch (e) {
        console.error(e);
    }
  };

  const fetchServerSettings = async (id: string) => {
      try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/game-servers/${id}/settings`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              setServerSettings(await res.json());
          }
      } catch (e) {
          console.error(e);
      }
  };

  const handleUpdateSettings = async () => {
      if (!currentSettingsServer) return;
      try {
          const token = localStorage.getItem('token');
          await fetch(`/api/game-servers/${currentSettingsServer.id}/settings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(serverSettings)
          });
          alert('Настройки сохранены. Перезагрузите сервер для применения изменений.');
          setIsSettingsModalOpen(false);
      } catch (e) {
          console.error(e);
          alert('Ошибка сохранения настроек');
      }
  };

  const fetchFiles = async (id: string, path: string = '/') => {
      try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/game-servers/${id}/files?path=${encodeURIComponent(path)}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              setServerFiles(await res.json());
              setCurrentPath(path);
          }
      } catch (e) {
          console.error(e);
      }
  };

  const fetchFileContent = async (id: string, path: string) => {
      try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/game-servers/${id}/files/content?path=${encodeURIComponent(path)}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              setEditorContent(data.content);
              setEditingFile(path);
          }
      } catch (e) {
          console.error(e);
      }
  };

  const handleSaveFile = async () => {
      if (!currentFileServer || !editingFile) return;
      try {
          const token = localStorage.getItem('token');
          await fetch(`/api/game-servers/${currentFileServer.id}/files/content?path=${encodeURIComponent(editingFile)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ content: editorContent })
          });
          alert('Файл сохранен');
          setEditorContent(null);
          setEditingFile(null);
      } catch (e) {
          console.error(e);
          alert('Ошибка сохранения файла');
      }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !currentFileServer) return;

      try {
          const token = localStorage.getItem('token');
          const path = (currentPath === '/' ? '' : currentPath) + '/' + file.name;
          
          const formData = new FormData();
          formData.append('file', file);

          await fetch(`/api/game-servers/${currentFileServer.id}/files/upload?path=${encodeURIComponent(path)}`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
          });
          alert('Файл загружен');
          fetchFiles(currentFileServer.id, currentPath);
      } catch (e) {
          console.error(e);
          alert('Ошибка загрузки');
      }
  };

  const handleDeleteFile = async (name: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentFileServer || !confirm(`Удалить ${name}?`)) return;
      try {
          const token = localStorage.getItem('token');
          const path = (currentPath === '/' ? '' : currentPath) + '/' + name;
          await fetch(`/api/game-servers/${currentFileServer.id}/files?path=${encodeURIComponent(path)}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          fetchFiles(currentFileServer.id, currentPath);
      } catch (e) {
          console.error(e);
          alert('Ошибка удаления');
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
                    <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center gap-4">
                      <h2 className="text-xl font-semibold text-gray-900">Активные заказы</h2>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => navigate('/services')}
                          className="inline-flex items-center rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                        >
                          Перейти к услугам
                        </button>
                        <Briefcase className="h-5 w-5 text-indigo-600" />
                      </div>
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

                  {/* Game Servers Summary */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 mb-6"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">Игровые серверы</h2>
                      <button
                        onClick={() => {
                          setOrderConfig({
                            game: 'minecraft',
                            nodeId: nodes.length > 0 ? nodes[0].id : '',
                            ram: 1024,
                            slots: 10
                          });
                          setIsCreateServerModalOpen(true);
                        }}
                        className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Создать сервер
                      </button>
                    </div>

                    {gameServers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <Server className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>У вас пока нет игровых серверов</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {gameServers.slice(0, 4).map((gs) => (
                          <div key={gs.id} className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-gray-900 flex items-center">
                                <Server className="w-4 h-4 mr-2 text-indigo-500" />
                                {gs.name}
                              </h3>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                gs.status === 'running' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {gs.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 mb-3">
                                {gs.game} | Port: {gs.port}
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end">
                              <button 
                                onClick={() => setActiveTab('game_servers')}
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
                            project.status === 'completed' ? 'bg-green-100 text-green-800' :
                            project.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {project.status === 'pending' ? 'Ожидает' :
                             project.status === 'in_progress' ? 'В работе' :
                             project.status === 'completed' ? 'Готов' : 'Отменен'}
                          </span>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
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

                        {(project.paidUntil || (project.monthlyRate && project.monthlyRate > 0)) && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-500">Оплачено до:</span>
                                    <span className={`font-medium ${project.paidUntil && new Date(project.paidUntil) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                                        {project.paidUntil ? formatDate(project.paidUntil) : 'Не оплачено'}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleExtend(project.id, 1)}
                                        className="flex-1 text-xs bg-indigo-50 text-indigo-700 py-2 rounded hover:bg-indigo-100 transition-colors"
                                    >
                                        Продлить (1 мес) - {project.monthlyRate || 0} ₽
                                    </button>
                                    <button 
                                        onClick={() => handleExtend(project.id, 3)}
                                        className="flex-1 text-xs bg-indigo-50 text-indigo-700 py-2 rounded hover:bg-indigo-100 transition-colors"
                                    >
                                        Продлить (3 мес) - {(project.monthlyRate || 0) * 3} ₽
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                  ))}
                </>
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
                            project.status === 'completed' ? 'bg-green-100 text-green-800' :
                            project.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {project.status === 'pending' ? 'Ожидает' :
                             project.status === 'in_progress' ? 'В работе' :
                             project.status === 'completed' ? 'Готов' : 'Отменен'}
                          </span>
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

                        {(project.paidUntil || (project.monthlyRate && project.monthlyRate > 0)) && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-500">Оплачено до:</span>
                                    <span className={`font-medium ${project.paidUntil && new Date(project.paidUntil) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                                        {project.paidUntil ? formatDate(project.paidUntil) : 'Не оплачено'}
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

              {activeTab === 'game_servers' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Мои игровые серверы</h2>
                    <button 
                        onClick={() => {
                          setOrderConfig({
                            game: 'minecraft',
                            nodeId: nodes.length > 0 ? nodes[0].id : '',
                            ram: 1024,
                            slots: 10
                          });
                          setIsCreateServerModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        Создать сервер
                    </button>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {gameServers.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            У вас нет активных серверов. Создайте свой первый сервер!
                        </div>
                    ) : (
                        gameServers.map(gs => (
                            <div
                              key={gs.id}
                              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => {
                                setCurrentPanelServer(gs);
                                setServerPanelTab('console');
                                setIsServerPanelOpen(true);
                              }}
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold">{gs.name}</h3>
                                        <p className="text-sm text-gray-500 mb-1">{gs.game} | Port: {gs.port}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-2">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded">Игроки: {playerCounts[gs.id]?.online ?? 0} / {playerCounts[gs.id]?.max ?? (gs.slots || 10)}</span>
                                            {gs.rconPassword && <span className="bg-gray-100 px-2 py-0.5 rounded">RCON: {gs.rconPassword}</span>}
                                            {gs.paidUntil && (
                                              <span className={`px-2 py-0.5 rounded ${new Date(gs.paidUntil) < new Date() ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                Оплачено до: {formatDate(gs.paidUntil)}
                                              </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                          gs.status === 'running' ? 'bg-green-100 text-green-800' : 
                                          gs.status === 'installing' ? 'bg-yellow-100 text-yellow-800' :
                                          gs.status === 'stopped' ? 'bg-red-100 text-red-800' :
                                          gs.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                          gs.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'
                                      }`}>
                                          {gs.status === 'running' ? 'Активен' : 
                                           gs.status === 'installing' ? 'Установка' :
                                           gs.status === 'stopped' ? 'Остановлен' :
                                           gs.status === 'suspended' ? 'Не оплачен' :
                                           gs.status === 'pending_payment' ? 'Ожидает оплаты' :
                                           gs.status}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCurrentPanelServer(gs);
                                          setServerPanelTab('console');
                                          setIsServerPanelOpen(true);
                                        }}
                                        className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                                        title="Открыть панель"
                                      >
                                        <Minus className="w-4 h-4" />
                                      </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleControlGameServer(gs.id, 'start');
                                        }}
                                        className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                                    >
                                        Запустить
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleControlGameServer(gs.id, 'stop');
                                        }}
                                        className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                                    >
                                        Остановить
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleControlGameServer(gs.id, 'restart');
                                        }}
                                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                                    >
                                        Перезагрузить
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleExtendGameServer(gs.id, 1);
                                      }}
                                      className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                                    >
                                      Продлить (1 мес)
                                    </button>
                                </div>
                                <div className="mt-4 p-4 bg-gray-900 text-gray-100 rounded text-sm font-mono">
                                    <p>IP: {nodes.find(n => n.id === gs.node?.id || (gs.node as any)?.id === n.id)?.ip}:{gs.port}</p>
                                    {gs.rconPassword && <p>RCON: {gs.rconPassword}</p>}
                                </div>
                            </div>
                        ))
                    )}
                  </div>
                </div>
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
                    onClick={() => setActiveTab('game_servers')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-1 ${
                      activeTab === 'game_servers' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Server className="mr-3 h-5 w-5" />
                    Игровые серверы
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
        
        {/* Create Server Modal */}
        {isCreateServerModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsCreateServerModalOpen(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Заказать игровой сервер</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Игра</label>
                            <select className="w-full p-3 border rounded-lg" value={orderConfig.game} onChange={e => setOrderConfig({...orderConfig, game: e.target.value})}>
                                {availableOrderGames.length === 0 ? (
                                  <option value="" disabled>Нет доступных игр</option>
                                ) : (
                                  availableOrderGames.map(g => (
                                    <option key={g.id} value={g.id}>{g.label}</option>
                                  ))
                                )}
                            </select>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Локация</label>
                                <button onClick={() => fetchData()} className="text-xs text-indigo-600 hover:text-indigo-800">Обновить список</button>
                            </div>
                            <select className="w-full p-3 border rounded-lg" value={orderConfig.nodeId} onChange={e => setOrderConfig({...orderConfig, nodeId: e.target.value})}>
                                <option value="">Выберите локацию</option>
                                {nodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.ip})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Слоты (мин. 10)</label>
                            <input 
                                type="number" 
                                className="w-full p-3 border rounded-lg" 
                                value={orderConfig.slots} 
                                onChange={e => {
                                    const slots = parseInt(e.target.value) || 0;
                                    setOrderConfig({...orderConfig, slots, ram: slots * 100});
                                }} 
                                onBlur={() => {
                                    if (orderConfig.slots < 10) {
                                        const slots = 10;
                                        setOrderConfig({...orderConfig, slots, ram: slots * 100});
                                    }
                                }}
                                min="10" 
                            />
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center mt-4">
                             <span className="text-gray-700 font-medium">Ежемесячный платеж:</span>
                             <span className="text-xl font-bold text-indigo-600">{monthlyOrderPrice} ₽</span>
                         </div>
                     </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button onClick={() => setIsCreateServerModalOpen(false)} className="px-4 py-2 border rounded">Отмена</button>
                        <button 
                            onClick={async () => {
                                if (!orderConfig.nodeId) return alert('Выберите локацию');
                                if (availableOrderGames.length === 0) return alert('На этой локации нет доступных игр');
                                if (orderConfig.slots < 10) return alert('Минимальное количество слотов: 10');
                                
                                try {
                                    const token = localStorage.getItem('token');
                                    console.log('Sending order request:', orderConfig);
                                    
                                    const res = await fetch('/api/game-servers/order', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                        body: JSON.stringify({ 
                                            ...orderConfig, 
                                            name: `${orderConfig.game} server`,
                                            slots: Number(orderConfig.slots), // Ensure number
                                            ram: Number(orderConfig.ram)      // Ensure number
                                        })
                                    });
                                    
                                    if (res.ok) {
                                        const data = await res.json().catch(() => ({}));
                                        if (data?.invoice?.id) {
                                          setIsCreateServerModalOpen(false);
                                          await fetchData();
                                          handlePayInvoice(data.invoice.id);
                                        } else {
                                          alert('Счет не создан, попробуйте еще раз');
                                        }
                                    } else {
                                        const errorData = await res.json().catch(() => ({}));
                                        console.error('Order error response:', errorData);
                                        alert(`Ошибка: ${errorData.message || 'Не удалось создать сервер'}`);
                                    }
                                } catch (e) { 
                                    console.error('Order network error:', e);
                                    alert('Ошибка сети или сервера');
                                }
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        >
                            Создать
                        </button>
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Manager Modal */}
        {isFileManagerOpen && currentFileServer && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsFileManagerOpen(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 h-[600px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                            Файлы: {currentFileServer.name}
                        </h3>
                        <button onClick={() => setIsFileManagerOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
                    </div>

                    {editorContent !== null ? (
                        <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-mono text-sm text-gray-600">{editingFile}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditorContent(null); setEditingFile(null); }} className="px-3 py-1 border rounded text-sm">Закрыть</button>
                                    <button onClick={handleSaveFile} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Сохранить</button>
                                </div>
                            </div>
                            <textarea 
                                className="flex-1 w-full p-2 border rounded font-mono text-sm resize-none bg-gray-50"
                                value={editorContent}
                                onChange={e => setEditorContent(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-4 p-2 bg-gray-100 rounded">
                                <button onClick={() => fetchFiles(currentFileServer.id, '/')} className="hover:text-indigo-600"><Home className="w-4 h-4" /></button>
                                <span className="text-gray-400">/</span>
                                <span className="font-mono text-sm text-gray-700">{currentPath === '/' ? '' : currentPath}</span>
                                <div className="ml-auto flex items-center gap-4">
                                    <label className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 hover:bg-gray-200 rounded transition-colors">
                                        <Upload className="w-4 h-4" /> Загрузить
                                        <input type="file" className="hidden" onChange={handleFileUpload} />
                                    </label>
                                    {currentPath !== '/' && (
                                        <button onClick={() => {
                                            const parts = currentPath.split('/').filter(Boolean);
                                            parts.pop();
                                            const newPath = parts.length > 0 ? '/' + parts.join('/') : '/';
                                            fetchFiles(currentFileServer.id, newPath);
                                        }} className="text-sm text-gray-600 hover:text-gray-900">.. Наверх</button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto border rounded">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Размер / Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {serverFiles.map((file, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                                                const newPath = (currentPath === '/' ? '' : currentPath) + '/' + file.name;
                                                if (file.isDirectory || file.isDir) fetchFiles(currentFileServer.id, newPath);
                                                else fetchFileContent(currentFileServer.id, newPath);
                                            }}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center gap-2">
                                                    {(file.isDirectory || file.isDir) ? <Folder className="w-4 h-4 text-yellow-500" /> : <FileText className="w-4 h-4 text-gray-400" />}
                                                    {file.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                    <div className="flex items-center justify-end gap-4">
                                                        <span>{(file.isDirectory || file.isDir) ? '-' : (file.size / 1024).toFixed(1) + ' KB'}</span>
                                                        <button 
                                                            onClick={(e) => handleDeleteFile(file.name, e)}
                                                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                            title="Удалить"
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {serverFiles.length === 0 && (
                                            <tr>
                                                <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">Нет файлов</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {isSettingsModalOpen && currentSettingsServer && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsSettingsModalOpen(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Настройки сервера</h3>
                        <button onClick={() => setIsSettingsModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Common Settings */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Описание (MOTD)</label>
                            <input type="text" className="w-full p-2 border rounded" value={serverSettings.motd || serverSettings.hostname || ''} onChange={e => setServerSettings({...serverSettings, motd: e.target.value, hostname: e.target.value})} />
                        </div>

                        {/* Minecraft Settings */}
                        {currentSettingsServer.game === 'minecraft' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Режим игры</label>
                                    <select className="w-full p-2 border rounded" value={serverSettings.gamemode || 'survival'} onChange={e => setServerSettings({...serverSettings, gamemode: e.target.value})}>
                                        <option value="survival">Выживание</option>
                                        <option value="creative">Творческий</option>
                                        <option value="adventure">Приключение</option>
                                        <option value="spectator">Наблюдатель</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Сложность</label>
                                    <select className="w-full p-2 border rounded" value={serverSettings.difficulty || 'easy'} onChange={e => setServerSettings({...serverSettings, difficulty: e.target.value})}>
                                        <option value="peaceful">Мирная</option>
                                        <option value="easy">Легкая</option>
                                        <option value="normal">Нормальная</option>
                                        <option value="hard">Сложная</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ядро (Требуется переустановка)</label>
                                    <input 
                                        list="core-options" 
                                        className="w-full p-2 border rounded" 
                                        value={serverSettings.core || 'vanilla'} 
                                        onChange={e => setServerSettings({...serverSettings, core: e.target.value})} 
                                        placeholder="Выберите или введите название ядра"
                                    />
                                    <datalist id="core-options">
                                        <option value="vanilla">Vanilla (Стандартное)</option>
                                        <option value="paper">Paper (Оптимизированное)</option>
                                        <option value="spigot">Spigot</option>
                                        <option value="forge">Forge (Моды)</option>
                                        <option value="fabric">Fabric (Моды)</option>
                                        <option value="velocity">Velocity</option>
                                        <option value="purpur">Purpur</option>
                                    </datalist>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={serverSettings.pvp === 'true'} onChange={e => setServerSettings({...serverSettings, pvp: e.target.checked ? 'true' : 'false'})} />
                                        <span className="text-sm font-medium text-gray-700">PvP (Бой между игроками)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={serverSettings['online-mode'] === 'true'} onChange={e => setServerSettings({...serverSettings, 'online-mode': e.target.checked ? 'true' : 'false'})} />
                                        <span className="text-sm font-medium text-gray-700">Лицензия (Online Mode)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={serverSettings['white-list'] === 'true'} onChange={e => setServerSettings({...serverSettings, 'white-list': e.target.checked ? 'true' : 'false'})} />
                                        <span className="text-sm font-medium text-gray-700">White List (Белый список)</span>
                                    </label>
                                </div>
                            </>
                        )}

                        {/* CS Settings (CS2 & CS 1.6) */}
                        {(currentSettingsServer.game === 'cs2' || currentSettingsServer.game === 'cs16') && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">RCON Пароль</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border rounded" 
                                        value={serverSettings.rcon_password || ''} 
                                        onChange={e => setServerSettings({...serverSettings, rcon_password: e.target.value})} 
                                        placeholder="Пароль для управления сервером"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Карта при запуске</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border rounded" 
                                        value={serverSettings.map || 'de_dust2'} 
                                        onChange={e => setServerSettings({...serverSettings, map: e.target.value})} 
                                        placeholder="de_dust2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Пароль на сервер (sv_password)</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border rounded" 
                                        value={serverSettings.sv_password || ''} 
                                        onChange={e => setServerSettings({...serverSettings, sv_password: e.target.value})} 
                                        placeholder="Оставьте пустым для публичного входа"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button onClick={() => setIsSettingsModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Отмена</button>
                        <button onClick={handleUpdateSettings} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Сохранить</button>
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isServerPanelOpen && currentPanelServer && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsServerPanelOpen(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Панель: {currentPanelServer.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{currentPanelServer.game} | Port: {currentPanelServer.port}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setIsServerPanelOpen(false)} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => handleControlGameServer(currentPanelServer.id, 'start')}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                    >
                      Запустить
                    </button>
                    <button
                      onClick={() => handleControlGameServer(currentPanelServer.id, 'stop')}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                    >
                      Остановить
                    </button>
                    <button
                      onClick={() => handleControlGameServer(currentPanelServer.id, 'restart')}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Перезагрузить
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Вы уверены, что хотите удалить сервер ${currentPanelServer.name}? Все данные будут утеряны.`)) {
                          setIsServerPanelOpen(false);
                          handleDeleteServer(currentPanelServer.id);
                        }
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <button
                      onClick={() => setServerPanelTab('console')}
                      className={`px-4 py-2 rounded text-sm font-medium ${serverPanelTab === 'console' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    >
                      Консоль
                    </button>
                    <button
                      onClick={() => setServerPanelTab('files')}
                      className={`px-4 py-2 rounded text-sm font-medium ${serverPanelTab === 'files' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    >
                      Файлы
                    </button>
                    <button
                      onClick={() => setServerPanelTab('settings')}
                      className={`px-4 py-2 rounded text-sm font-medium ${serverPanelTab === 'settings' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    >
                      Настройки
                    </button>
                    <button
                      onClick={() => setServerPanelTab('access')}
                      className={`px-4 py-2 rounded text-sm font-medium ${serverPanelTab === 'access' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    >
                      Доступ
                    </button>
                  </div>

                  {serverPanelTab === 'console' && (
                    <div className="rounded-lg bg-gray-900 border border-gray-700 p-4">
                      <div ref={consoleLogsRef} className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-sm text-green-400 mb-4 whitespace-pre-wrap border border-gray-700">
                        {consoleLogs || 'Нет логов для отображения'}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 bg-black text-gray-100 border border-gray-700 rounded p-2 font-mono text-sm focus:outline-none focus:border-indigo-500"
                          placeholder="Введите команду..."
                          value={consoleCommand}
                          onChange={e => setConsoleCommand(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSendConsoleCommand()}
                        />
                        <button
                          onClick={handleSendConsoleCommand}
                          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm font-medium"
                        >
                          Отправить
                        </button>
                      </div>
                    </div>
                  )}

                  {serverPanelTab === 'files' && currentFileServer && (
                    <div className="h-[600px] flex flex-col">
                      {editorContent !== null ? (
                        <div className="flex-1 flex flex-col">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-mono text-sm text-gray-600">{editingFile}</span>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditorContent(null); setEditingFile(null); }} className="px-3 py-1 border rounded text-sm">Закрыть</button>
                              <button onClick={handleSaveFile} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Сохранить</button>
                            </div>
                          </div>
                          <textarea
                            className="flex-1 w-full p-2 border rounded font-mono text-sm resize-none bg-gray-50"
                            value={editorContent}
                            onChange={e => setEditorContent(e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-4 p-2 bg-gray-100 rounded">
                            <button onClick={() => fetchFiles(currentFileServer.id, '/')} className="hover:text-indigo-600"><Home className="w-4 h-4" /></button>
                            <span className="text-gray-400">/</span>
                            <span className="font-mono text-sm text-gray-700">{currentPath === '/' ? '' : currentPath}</span>
                            <div className="ml-auto flex items-center gap-4">
                              <label className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 hover:bg-gray-200 rounded transition-colors">
                                <Upload className="w-4 h-4" /> Загрузить
                                <input type="file" className="hidden" onChange={handleFileUpload} />
                              </label>
                              {currentPath !== '/' && (
                                <button onClick={() => {
                                  const parts = currentPath.split('/').filter(Boolean);
                                  parts.pop();
                                  const newPath = parts.length > 0 ? '/' + parts.join('/') : '/';
                                  fetchFiles(currentFileServer.id, newPath);
                                }} className="text-sm text-gray-600 hover:text-gray-900">.. Наверх</button>
                              )}
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto border rounded">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Размер / Действия</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {serverFiles.map((file, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                                    const newPath = (currentPath === '/' ? '' : currentPath) + '/' + file.name;
                                    if (file.isDirectory || file.isDir) fetchFiles(currentFileServer.id, newPath);
                                    else fetchFileContent(currentFileServer.id, newPath);
                                  }}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center gap-2">
                                      {(file.isDirectory || file.isDir) ? <Folder className="w-4 h-4 text-yellow-500" /> : <FileText className="w-4 h-4 text-gray-400" />}
                                      {file.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                      <div className="flex items-center justify-end gap-4">
                                        <span>{(file.isDirectory || file.isDir) ? '-' : (file.size / 1024).toFixed(1) + ' KB'}</span>
                                        <button
                                          onClick={(e) => handleDeleteFile(file.name, e)}
                                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                          title="Удалить"
                                        >
                                          <Trash className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                {serverFiles.length === 0 && (
                                  <tr>
                                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">Нет файлов</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {serverPanelTab === 'settings' && currentSettingsServer && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Описание (MOTD)</label>
                        <input type="text" className="w-full p-2 border rounded" value={serverSettings.motd || serverSettings.hostname || ''} onChange={e => setServerSettings({ ...serverSettings, motd: e.target.value, hostname: e.target.value })} />
                      </div>

                      {currentSettingsServer.game === 'minecraft' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Режим игры</label>
                            <select className="w-full p-2 border rounded" value={serverSettings.gamemode || 'survival'} onChange={e => setServerSettings({ ...serverSettings, gamemode: e.target.value })}>
                              <option value="survival">Выживание</option>
                              <option value="creative">Творческий</option>
                              <option value="adventure">Приключение</option>
                              <option value="spectator">Наблюдатель</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Сложность</label>
                            <select className="w-full p-2 border rounded" value={serverSettings.difficulty || 'easy'} onChange={e => setServerSettings({ ...serverSettings, difficulty: e.target.value })}>
                              <option value="peaceful">Мирная</option>
                              <option value="easy">Легкая</option>
                              <option value="normal">Нормальная</option>
                              <option value="hard">Сложная</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Ядро (Требуется переустановка)</label>
                            <input
                              list="core-options-panel"
                              className="w-full p-2 border rounded"
                              value={serverSettings.core || 'vanilla'}
                              onChange={e => setServerSettings({ ...serverSettings, core: e.target.value })}
                              placeholder="Выберите или введите название ядра"
                            />
                            <datalist id="core-options-panel">
                              <option value="vanilla">Vanilla (Стандартное)</option>
                              <option value="paper">Paper (Оптимизированное)</option>
                              <option value="spigot">Spigot</option>
                              <option value="forge">Forge (Моды)</option>
                              <option value="fabric">Fabric (Моды)</option>
                              <option value="velocity">Velocity</option>
                              <option value="purpur">Purpur</option>
                            </datalist>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={serverSettings.pvp === 'true'} onChange={e => setServerSettings({ ...serverSettings, pvp: e.target.checked ? 'true' : 'false' })} />
                              <span className="text-sm font-medium text-gray-700">PvP (Бой между игроками)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={serverSettings['online-mode'] === 'true'} onChange={e => setServerSettings({ ...serverSettings, 'online-mode': e.target.checked ? 'true' : 'false' })} />
                              <span className="text-sm font-medium text-gray-700">Лицензия (Online Mode)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={serverSettings['white-list'] === 'true'} onChange={e => setServerSettings({ ...serverSettings, 'white-list': e.target.checked ? 'true' : 'false' })} />
                              <span className="text-sm font-medium text-gray-700">White List (Белый список)</span>
                            </label>
                          </div>
                        </>
                      )}

                      {(currentSettingsServer.game === 'cs2' || currentSettingsServer.game === 'cs16') && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">RCON Пароль</label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded"
                              value={serverSettings.rcon_password || ''}
                              onChange={e => setServerSettings({ ...serverSettings, rcon_password: e.target.value })}
                              placeholder="Пароль для управления сервером"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Карта при запуске</label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded"
                              value={serverSettings.map || 'de_dust2'}
                              onChange={e => setServerSettings({ ...serverSettings, map: e.target.value })}
                              placeholder="de_dust2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Пароль на сервер (sv_password)</label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded"
                              value={serverSettings.sv_password || ''}
                              onChange={e => setServerSettings({ ...serverSettings, sv_password: e.target.value })}
                              placeholder="Оставьте пустым для публичного входа"
                            />
                          </div>
                        </>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <button onClick={handleUpdateSettings} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Сохранить</button>
                      </div>
                    </div>
                  )}

                  {serverPanelTab === 'access' && (
                    <div className="space-y-3">
                      <div className="p-4 bg-gray-900 text-gray-100 rounded text-sm font-mono">
                        <p>IP: {nodes.find(n => n.id === currentPanelServer.node?.id || (currentPanelServer.node as any)?.id === n.id)?.ip}:{currentPanelServer.port}</p>
                      </div>
                      <div className="p-4 bg-gray-50 border rounded">
                        <div className="text-sm text-gray-700">
                          <div className="font-medium text-gray-900 mb-2">Доступ к файлам</div>
                          <div>Используйте вкладку "Файлы" в панели.</div>
                          <div className="font-medium text-gray-900 mt-4 mb-2">Доступ (FTP/SFTP)</div>
                          {sftpAccess[currentPanelServer.id]?.enabled ? (
                            <>
                              <div>SFTP Host: {sftpAccess[currentPanelServer.id]?.host}</div>
                              <div>SFTP Port: {sftpAccess[currentPanelServer.id]?.port}</div>
                              <div>User: {sftpAccess[currentPanelServer.id]?.username}</div>
                              <div>Pass: {sftpAccess[currentPanelServer.id]?.password}</div>
                              <div>Path: {sftpAccess[currentPanelServer.id]?.path || '/files'}</div>
                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={() => handleDisableSftp(currentPanelServer.id)}
                                  disabled={Boolean(sftpLoading[currentPanelServer.id])}
                                  className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                                >
                                  Отключить SFTP
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-xs text-gray-500">Нажмите кнопку, чтобы включить SFTP-доступ к /data вашего сервера.</div>
                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={() => handleEnableSftp(currentPanelServer.id)}
                                  disabled={Boolean(sftpLoading[currentPanelServer.id])}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                                >
                                  Включить SFTP
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Console Modal */}
        {isConsoleModalOpen && currentConsoleServer && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsConsoleModalOpen(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block transform overflow-hidden rounded-lg bg-gray-900 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle border border-gray-700">
                <div className="bg-gray-800 px-6 py-4 flex justify-between items-center border-b border-gray-700">
                    <h3 className="text-lg font-medium leading-6 text-gray-100">
                        Консоль: {currentConsoleServer.name}
                    </h3>
                    <button onClick={() => setIsConsoleModalOpen(false)} className="text-gray-400 hover:text-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    <div ref={consoleLogsRef} className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-sm text-green-400 mb-4 whitespace-pre-wrap border border-gray-700">
                        {consoleLogs || 'Нет логов для отображения'}
                    </div>
                    
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 bg-black text-gray-100 border border-gray-700 rounded p-2 font-mono text-sm focus:outline-none focus:border-indigo-500"
                            placeholder="Введите команду..."
                            value={consoleCommand}
                            onChange={e => setConsoleCommand(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendConsoleCommand()}
                        />
                        <button 
                            onClick={handleSendConsoleCommand}
                            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm font-medium"
                        >
                            Отправить
                        </button>
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
