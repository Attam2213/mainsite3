﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { useState, useEffect, useRef } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import GameServerConfigurator, {
  type GameServerOrderPayload,
  type WebsiteOrderPayload,
  type PublicNode,
  MINECRAFT_CORE_OPTIONS,
  POPULAR_MINECRAFT_VERSIONS,
  CS16_BUILD_OPTIONS,
} from '../../components/GameServerConfigurator';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  MessageCircle,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
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
  Copy,
  Check,
  MessageSquare,
  Server,
  Folder,
  Home,
  Upload,
  Trash,
  Trash2,
  Ban,
  UserMinus,
  Clock,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Globe,
  Play,
  Square,
  RotateCcw,
  FileArchive,
  ShieldCheck,
  KeyRound,
  HardDrive,
  Database,
  Bot,
  Sparkles,
  Terminal as TerminalIcon,
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
}

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
  periodMonths?: number;
  gameServerId?: string | null;
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
  topic?: string;
  gameServerId?: string | null;
  service?: {
    title: string;
  };
}

interface HostingNode {
  id: string;
  name: string;
  ip: string;
  location?: string;
  maxSlots?: number;
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
  core?: string;
  mcVersion?: string;
  mcCustomJarUrl?: string;
  mcCustomJarName?: string;
  cs16Build?: string;
}

const formatDate = (date: string | Date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

const formatGameLabel = (game: string) => {
  if (game === 'minecraft') return 'Minecraft';
  if (game === 'cs2') return 'Counter-Strike 2';
  if (game === 'cs16') return 'Counter-Strike 1.6';
  return game;
};

const getGameServerStatusMeta = (status: string) => {
  if (status === 'running') {
    return {
      label: 'Активен',
      badgeClassName: 'bg-green-100 text-green-800',
      panelClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700'
    };
  }

  if (status === 'installing') {
    return {
      label: 'Установка',
      badgeClassName: 'bg-yellow-100 text-yellow-800',
      panelClassName: 'border-amber-200 bg-amber-50 text-amber-700'
    };
  }

  if (status === 'stopped') {
    return {
      label: 'Остановлен',
      badgeClassName: 'bg-red-100 text-red-800',
      panelClassName: 'border-rose-200 bg-rose-50 text-rose-700'
    };
  }

  if (status === 'suspended') {
    return {
      label: 'Не оплачен',
      badgeClassName: 'bg-red-100 text-red-800',
      panelClassName: 'border-rose-200 bg-rose-50 text-rose-700'
    };
  }

  if (status === 'pending_payment') {
    return {
      label: 'Ожидает оплаты',
      badgeClassName: 'bg-yellow-100 text-yellow-800',
      panelClassName: 'border-amber-200 bg-amber-50 text-amber-700'
    };
  }

  return {
    label: status,
    badgeClassName: 'bg-gray-100 text-gray-800',
    panelClassName: 'border-slate-200 bg-slate-50 text-slate-700'
  };
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshBalance } = useAuth();
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
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'billing' | 'leads' | 'requests' | 'game_servers' | 'websites' | 'balance'>('overview');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');

  // Wallet & Balance State
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txOffset, setTxOffset] = useState(0);
  const [txTotal, setTxTotal] = useState(0);
  const txLimit = 20;
  const QUICK_TOPUP_AMOUNTS = [100, 300, 500, 1000, 3000];

  // ============================================================
  // SCROLL SAVE (без restore (DOM PERMANENCE уже сам держит scroll стабильно!)
  // ============================================================
  type AnyHandler = ((...args: any[]) => any) | ((e?: any, ...rest: any[]) => any);
  const withScrollSave = <H extends AnyHandler>(fn: H): H => {
    return ((...args: any[]) => {
      return fn(...(args as any[]));
    }) as H;
  };
  
  // Game Hosting State
  const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState(false);
  const [initialConfiguratorTab, setInitialConfiguratorTab] = useState<'game' | 'website'>('game');
  const [configuratorMode, setConfiguratorMode] = useState<'both' | 'game-only' | 'website-only'>('both');
  const [isConsoleModalOpen, setIsConsoleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [isServerPanelOpen, setIsServerPanelOpen] = useState(false);
  const [currentPanelServer, setCurrentPanelServer] = useState<GameServer | null>(null);
  const [serverPanelTab, setServerPanelTab] = useState<'overview' | 'console' | 'files' | 'settings' | 'access' | 'players'>('overview');
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
  const [serverSearch, setServerSearch] = useState('');
  const [copiedValue, setCopiedValue] = useState('');
  const consoleLogsRef = useRef<HTMLDivElement | null>(null);
  const currentConsoleServerId = currentConsoleServer?.id;
  const [nodes, setNodes] = useState<HostingNode[]>([]);
  const [gameServers, setGameServers] = useState<GameServer[]>([]);
  const [playerCounts, setPlayerCounts] = useState<Record<string, { online: number; max: number }>>({});
  const [playersList, setPlayersList] = useState<Record<string, {
    players: Array<{ name: string; score?: number; durationSec?: number; ping?: number }>;
    countOnly?: boolean;
    online: number;
    max: number;
  }>>({});
  const [playersListLoading, setPlayersListLoading] = useState<Record<string, boolean>>({});
  const [sftpAccess, setSftpAccess] = useState<Record<string, { enabled: boolean; host?: string; port?: number | null; username?: string; password?: string; path?: string }>>({});
  const [sftpLoading, setSftpLoading] = useState<Record<string, boolean>>({});
  const [gsStatusFilter, setGsStatusFilter] = useState<string>('all');
  const [gsGameFilter, setGsGameFilter] = useState<string>('all');
  const [gsNodeFilter, setGsNodeFilter] = useState<string>('all');
  const [kickModal, setKickModal] = useState<{ open: boolean; serverId: string; name: string }>({ open: false, serverId: '', name: '' });
  const [banModal, setBanModal] = useState<{ open: boolean; serverId: string; name: string }>({ open: false, serverId: '', name: '' });
  const [kickReason, setKickReason] = useState('Нарушение правил');
  const [banMinutes, setBanMinutes] = useState(60);
  const [banReason, setBanReason] = useState('Нарушение правил');
  const [confirmPayOpen, setConfirmPayOpen] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState<string | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [ticketTopic, setTicketTopic] = useState('');
  const [ticketServerId, setTicketServerId] = useState<string>('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [sendingTicket, setSendingTicket] = useState(false);
  const gameOptions = [
    { id: 'minecraft', label: 'Minecraft (Java)' },
    { id: 'cs2', label: 'CS 2' },
    { id: 'cs16', label: 'CS 1.6' }
  ] as const;
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  // Web Hosting State
  const [webSites, setWebSites] = useState<any[]>([]);
  const [isWebSettingsOpen, setIsWebSettingsOpen] = useState(false);
  const [currentWebSite, setCurrentWebSite] = useState<any>(null);
  const [webSettingsTab, setWebSettingsTab] = useState<'overview' | 'files' | 'logs' | 'backups' | 'ssh' | 'database' | 'ai'>('overview');
  const [webFiles, setWebFiles] = useState<any[]>([]);
  const [webFilesPath, setWebFilesPath] = useState('/');
  const [webFilesLoading, setWebFilesLoading] = useState(false);
  const [webLogs, setWebLogs] = useState({ pm2: '', nginx: '' });
  const [webLogsLoading, setWebLogsLoading] = useState(false);
  const [webBackups, setWebBackups] = useState<any[]>([]);
  const [webBackupsLoading, setWebBackupsLoading] = useState(false);
  const [webSftpCreds, setWebSftpCreds] = useState<any>(null);
  const [webLoadingAction, setWebLoadingAction] = useState<string | null>(null);
  const [webDomainInput, setWebDomainInput] = useState('');
  const [webFileUploadFile, setWebFileUploadFile] = useState<File | null>(null);

  // Delete / toast UX states
  const [toast, setToast] = useState<{ id: number; type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const toastTimerRef = useRef<any>(null);
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), type, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 4200);
  };
  const [deletedGameServerIds, setDeletedGameServerIds] = useState<Record<string, 'deleting' | 'deleted'>>({});

  const getServerNode = (server?: GameServer | null) =>
    server ? nodes.find(n => n.id === server.node?.id || (server.node as any)?.id === n.id) : undefined;
  const openServerPanel = withScrollSave((
    server: GameServer,
    tab: 'overview' | 'console' | 'files' | 'settings' | 'access' = 'overview'
  ) => {
    setCurrentPanelServer(server);
    setServerPanelTab(tab);
    setIsServerPanelOpen(true);
  });
  const runningGameServersCount = gameServers.filter(gs => gs.status === 'running').length;
  const suspendedGameServersCount = gameServers.filter(gs => gs.status === 'suspended' || gs.status === 'pending_payment').length;
  const totalPlayersOnline = gameServers.reduce((sum, gs) => sum + (playerCounts[gs.id]?.online ?? 0), 0);
  const filteredGameServers = gameServers.filter((gs) => {
    const query = serverSearch.trim().toLowerCase();
    const node = getServerNode(gs);
    const haystack = [
      gs.name,
      formatGameLabel(gs.game),
      gs.game,
      gs.status,
      getGameServerStatusMeta(gs.status).label,
      String(gs.port),
      node?.name || '',
      node?.ip || ''
    ]
      .join(' ')
      .toLowerCase();
    if (query && !haystack.includes(query)) return false;
    if (gsStatusFilter !== 'all' && gs.status !== gsStatusFilter) return false;
    if (gsGameFilter !== 'all' && gs.game !== gsGameFilter) return false;
    if (gsNodeFilter !== 'all' && node?.id !== gsNodeFilter) return false;
    return true;
  });

  const copyToClipboard = async (value: string, successLabel: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const input = document.createElement('textarea');
        input.value = value;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }

      setCopiedValue(successLabel);
      window.setTimeout(() => {
        setCopiedValue(prev => (prev === successLabel ? '' : prev));
      }, 1800);
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Не удалось скопировать значение');
    }
  };

  const getGameServerActionState = (status: string) => {
    const isRunning = status === 'running';
    const isInstalling = status === 'installing';
    const isBlocked = status === 'suspended' || status === 'pending_payment';

    return {
      canStart: !isRunning && !isInstalling && !isBlocked,
      canStop: isRunning,
      canRestart: isRunning
    };
  };

  // Payment action
  const handlePayInvoice = async (invoiceId: string) => {
    setInvoiceToPay(invoiceId);
    setConfirmPayOpen(true);
  };

  const executePayInvoice = async () => {
    const invoiceId = invoiceToPay;
    if (!invoiceId) return;
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
        // If payment was deducted from balance immediately — refresh balance & data
        if (data?.paid || data?.balanceAfter !== undefined) {
          try { await refreshBalance(); } catch (e) {}
          await fetchData();
        }
        if (data.url) {
          window.location.href = data.url;
        } else if (!data?.paid) {
          alert('Оплата выполнена');
        }
      } else if (res.status === 402) {
        const err = await res.json().catch(() => ({}));
        setConfirmPayOpen(false);
        setInvoiceToPay(null);
        showInsufficientFundsAlert(err, 'Недостаточно средств для оплаты счета');
        return;
      } else {
        const error = await res.json().catch(() => ({}));
        alert(error.message || 'Ошибка создания платежа');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ошибка соединения с сервером');
    } finally {
      setConfirmPayOpen(false);
      setInvoiceToPay(null);
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
            // Renewal via balance paid immediately — refresh
            if (invoice?.status === 'paid') {
              try { await refreshBalance(); } catch (e) {}
              await fetchData();
              alert('Подписка успешно продлена');
            } else {
              handlePayInvoice(invoice.id);
            }
        } else if (res.status === 402) {
            const err = await res.json().catch(() => ({}));
            showInsufficientFundsAlert(err, 'Недостаточно средств для продления');
        } else {
            const err = await res.json().catch(() => ({}));
            alert(err.message || 'Ошибка создания счета');
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
        if (invoice?.status === 'paid') {
          try { await refreshBalance(); } catch (e) {}
          await fetchData();
          alert('Сервер успешно продлён');
        } else {
          handlePayInvoice(invoice.id);
        }
      } else if (res.status === 402) {
        const err = await res.json().catch(() => ({}));
        showInsufficientFundsAlert(err, 'Недостаточно средств для продления сервера');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Ошибка создания счета');
      }
    } catch (error) {
      console.error('Extend game server error:', error);
      alert('Ошибка соединения с сервером');
    }
  };

  const submitOrderFromConfiguratorModal = async (payload: GameServerOrderPayload) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/game-servers/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setIsCreateServerModalOpen(false);
        await fetchData();
        if (data?.invoice?.status === 'paid' || data?.gameServer?.id) {
          try { await refreshBalance(); } catch (e) {}
          await fetchData();
        }
        if (data?.invoice?.id && data?.invoice?.status !== 'paid') {
          handlePayInvoice(data.invoice.id);
        } else if (!data?.invoice && !data?.gameServer) {
          alert('Сервер создан, но счет не был сформирован автоматически');
        }
      } else if (res.status === 402) {
        const errorData = await res.json().catch(() => ({}));
        showInsufficientFundsAlert(errorData, 'Недостаточно средств для создания сервера');
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Order error response:', errorData);
        alert(`Ошибка: ${errorData.message || 'Не удалось создать сервер'}`);
      }
    } catch (e) {
      console.error('Order network error:', e);
      alert('Ошибка сети или сервера');
    }
  };

  const handleWebsiteOrderFromDashboard = async (payload: WebsiteOrderPayload) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sites/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setIsCreateServerModalOpen(false);
        if (data?.invoice?.status === 'paid' || data?.webSite?.id) {
          try { await refreshBalance(); } catch (e) {}
        }
        await fetchData();
        setActiveTab('websites');
        if (data?.invoice?.id && data?.invoice?.status !== 'paid') {
          handlePayInvoice(data.invoice.id);
        }
      } else if (res.status === 401) {
        localStorage.setItem('wexa_order_intent', JSON.stringify({ type: 'website', payload }));
        navigate('/login');
      } else if (res.status === 402) {
        const errorData = await res.json().catch(() => ({}));
        showInsufficientFundsAlert(errorData, 'Недостаточно средств для создания сайта');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Не удалось создать сайт');
      }
    } catch (e) {
      console.error('Website order error:', e);
      alert('Ошибка сети');
    }
  };

  const fetchPlayersList = async (serverId: string) => {
    try {
      setPlayersListLoading(prev => ({ ...prev, [serverId]: true }));
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/game-servers/${serverId}/players`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPlayersList(prev => ({
          ...prev,
          [serverId]: {
            players: Array.isArray(data?.players) ? data.players : [],
            countOnly: Boolean(data?.countOnly),
            online: Number(data?.online) || 0,
            max: Number(data?.max) || 0,
          }
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPlayersListLoading(prev => ({ ...prev, [serverId]: false }));
    }
  };

  const handleKickPlayer = async () => {
    if (!kickModal.serverId || !kickModal.name) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/game-servers/${kickModal.serverId}/players/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: kickModal.name, reason: kickReason })
      });
      if (res.ok) {
        alert(`Игрок ${kickModal.name} кикнут`);
        fetchPlayersList(kickModal.serverId);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Ошибка кика');
      }
    } catch (e) {
      alert('Ошибка соединения');
    } finally {
      setKickModal({ open: false, serverId: '', name: '' });
    }
  };

  const handleBanPlayer = async () => {
    if (!banModal.serverId || !banModal.name) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/game-servers/${banModal.serverId}/players/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: banModal.name, minutes: banMinutes, reason: banReason })
      });
      if (res.ok) {
        alert(`Игрок ${banModal.name} забанен на ${banMinutes} мин.`);
        fetchPlayersList(banModal.serverId);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Ошибка бана');
      }
    } catch (e) {
      alert('Ошибка соединения');
    } finally {
      setBanModal({ open: false, serverId: '', name: '' });
    }
  };

  const isPaidSoon = (paidUntil?: string) => {
    if (!paidUntil) return true;
    const d = new Date(paidUntil).getTime();
    const now = Date.now();
    const daysLeft = (d - now) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft <= 5;
  };
  const isOverdue = (paidUntil?: string, status?: string) => {
    if (status === 'suspended' || status === 'pending_payment') return true;
    if (!paidUntil) return false;
    return new Date(paidUntil).getTime() < Date.now();
  };
  const sftpEnabledCount = Object.values(sftpAccess).filter(v => v.enabled).length;

  const warningGameServers = gameServers.filter(gs => isPaidSoon(gs.paidUntil) || isOverdue(gs.paidUntil, gs.status));
  const overdueGameServers = gameServers.filter(gs => isOverdue(gs.paidUntil, gs.status));
  const pendingInvoices = invoices.filter(i => i.status === 'pending');
  const pendingSum = pendingInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  const paidLast30Sum = invoices.filter(i => {
    if (i.status !== 'paid') return false;
    const dt = new Date(i.createdAt || 0).getTime();
    return dt > Date.now() - 30 * 24 * 60 * 60 * 1000;
  }).reduce((s, i) => s + (i.amount || 0), 0);

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
    
    if ((serviceType === 'game' || serviceType === 'server') && nodes.length > 0) {
        setInitialConfiguratorTab('game');
        setIsCreateServerModalOpen(true);
        window.history.replaceState({}, '', '/dashboard');
    }
    if (serviceType === 'site' || serviceType === 'website') {
        setInitialConfiguratorTab('website');
        setIsCreateServerModalOpen(true);
        window.history.replaceState({}, '', '/dashboard');
    }
  }, [nodes, location]);

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
          fetch('/api/leads', { headers }),
          fetch('/api/sites/mine', { headers })
        ]);

        const invoicesRes = results[0].status === 'fulfilled' ? results[0].value : null;
        const projectRes = results[1].status === 'fulfilled' ? results[1].value : null;
        const ordersRes = results[2].status === 'fulfilled' ? results[2].value : null;
        const nodesRes = results[3].status === 'fulfilled' ? results[3].value : null;
        const gsRes = results[4].status === 'fulfilled' ? results[4].value : null;
        const leadsRes = results[5].status === 'fulfilled' ? results[5].value : null;
        const sitesRes = results[6].status === 'fulfilled' ? results[6].value : null;

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

        if (sitesRes?.ok) {
          const data = await sitesRes.json();
          if (data?.ok && Array.isArray(data.items)) setWebSites(data.items);
          else if (Array.isArray(data)) setWebSites(data);
          else setWebSites([]);
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
      const res = await fetch(`/api/game-servers/${serverId}/players-count`, {
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

  // ========== WALLET / BALANCE FUNCTIONS ==========
  const loadTransactions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setTxLoading(true);
      const res = await fetch(`/api/wallet/transactions?limit=${txLimit}&offset=${txOffset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.rows)) setTransactions(data.rows);
        if (typeof data?.count === 'number') setTxTotal(data.count);
      }
    } catch (e) {
      console.error('loadTransactions error:', e);
    } finally {
      setTxLoading(false);
    }
  };

  const showInsufficientFundsAlert = async (err: any, fallbackTitle = 'Недостаточно средств') => {
    const needed = Number(err?.needed);
    const balance = Number(err?.balance);
    const total = Number(err?.totalAmount);
    const neededShort = needed && Number.isFinite(needed) ? needed : (total - balance > 0 ? total - balance : null);
    const msg = neededShort
      ? `Недостаточно средств на балансе.\nТребуется ещё: ${Math.ceil(neededShort)} ₽\nТекущий баланс: ${Number(balance || 0).toFixed(2)} ₽`
      : (err?.message || fallbackTitle);
    const confirmed = window.confirm(`${msg}\n\nХотите пополнить баланс сейчас?`);
    if (confirmed) {
      if (neededShort && Number.isFinite(neededShort)) {
        setCustomAmount(String(Math.max(100, Math.ceil(neededShort))));
      }
      setIsTopupModalOpen(true);
    }
  };

  const handleCreateTopup = async (amountInput: number | string) => {
    const amount = Number(amountInput);
    if (!amount || amount < 100) {
      alert('Минимальная сумма пополнения: 100 ₽');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setTopupLoading(true);
      const res = await fetch('/api/wallet/deposit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.message || 'Ошибка создания платежа');
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert('Ссылка на оплату не получена');
      }
    } catch (e) {
      console.error('Topup create error:', e);
      alert('Ошибка соединения при создании платежа');
    } finally {
      setTopupLoading(false);
    }
  };

  const formatTxTypeBadge = (t: WalletTransactionItem) => {
    const amount = Number(t.amount) || 0;
    if (t.type === 'deposit') return { label: 'Пополнение', className: 'bg-emerald-100 text-emerald-800', sign: '+' };
    if (t.type === 'refund') return { label: 'Возврат', className: 'bg-emerald-100 text-emerald-800', sign: '+' };
    if (t.type === 'adjust') {
      const positive = amount >= 0;
      return {
        label: positive ? 'Начисление' : 'Списание',
        className: positive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800',
        sign: positive ? '+' : '-',
      };
    }
    // withdraw
    return { label: 'Списание', className: 'bg-rose-100 text-rose-800', sign: '-' };
  };

  const formatTxDescription = (t: WalletTransactionItem) => {
    if (t.description) return t.description;
    if (t.type === 'deposit') return 'Пополнение баланса';
    if (t.type === 'withdraw') return 'Оплата услуг';
    if (t.gameServerId) return `Операция по серверу #${t.gameServerId.slice(0, 8)}`;
    if (t.invoiceId) return `По счету #${t.invoiceId.slice(0, 8)}`;
    return '—';
  };

  // Load transactions when balance tab is selected or pagination changed
  useEffect(() => {
    if (activeTab === 'balance') {
      loadTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, txOffset]);

  // Detect return from Platega success page & refresh balance + reload data
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true' || params.get('topup') === 'ok') {
      (async () => {
        try {
          await refreshBalance();
          await fetchData();
          loadTransactions();
        } catch (e) { console.error(e); }
      })();
      // clear query params without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      url.searchParams.delete('topup');
      url.searchParams.delete('order_id');
      window.history.replaceState({}, '', url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

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
    const gs = gameServers.find(x => x.id === id);
    const name = gs?.name || `Сервер ${id.slice(0, 8)}`;
    try {
      // 1) Optimistic: mark as deleting UI state
      setDeletedGameServerIds(prev => ({ ...prev, [id]: 'deleting' }));

      const token = localStorage.getItem('token');
      const res = await fetch(`/api/game-servers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        // 2) Success → status deleted, fade out + toast
        setDeletedGameServerIds(prev => ({ ...prev, [id]: 'deleted' }));
        showToast('success', `✅ Сервер «${name}» удалён`);

        // 3) After 1.3s fade animation — remove from local array
        setTimeout(() => {
          setGameServers(prev => prev.filter(x => x.id !== id));
          setDeletedGameServerIds(prev => {
            const n = { ...prev }; delete n[id]; return n;
          });
          fetchData();
        }, 1300);
      } else {
        setDeletedGameServerIds(prev => {
          const n = { ...prev }; delete n[id]; return n;
        });
        let msg = 'Ошибка при удалении сервера';
        try { const d = await res.json(); if (d?.error) msg = d.error; else if (d?.message) msg = d.message; } catch {}
        showToast('error', `❌ ${msg}`);
        alert(msg);
      }
    } catch (error) {
      setDeletedGameServerIds(prev => {
        const n = { ...prev }; delete n[id]; return n;
      });
      console.error('Delete server error:', error);
      const msg = 'Сетевая ошибка при удалении сервера';
      showToast('error', `❌ ${msg}`);
      alert(msg);
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

  // ==================== Web sites helpers ====================
  const getWebSiteStatusMeta = (status?: string) => {
    switch (status) {
      case 'active': return { label: 'Работает', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' };
      case 'pending': return { label: 'Ожидает оплаты', color: 'bg-amber-100 text-amber-700 border border-amber-200', dot: 'bg-amber-500' };
      case 'provisioning': return { label: 'Разворачивается...', color: 'bg-indigo-100 text-indigo-700 border border-indigo-200', dot: 'bg-indigo-500 animate-pulse' };
      case 'suspended': return { label: 'Приостановлен', color: 'bg-rose-100 text-rose-700 border border-rose-200', dot: 'bg-rose-500' };
      case 'deleting': return { label: 'Удаляется...', color: 'bg-gray-200 text-gray-700 border border-gray-300', dot: 'bg-gray-500 animate-pulse' };
      case 'deleted': return { label: 'Удалён', color: 'bg-gray-100 text-gray-500 border border-gray-200', dot: 'bg-gray-400' };
      default: return { label: status || 'Неизвестно', color: 'bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400' };
    }
  };

  const getWebPlanLabel = (planId?: string): string => {
    const map: Record<string, string> = { landing: 'Landing', business: 'Business', premium: 'Premium' };
    return map[String(planId || 'landing')] ?? String(planId ?? 'Landing');
  };

  const handleControlWebSite = async (id: string, action: 'start' | 'stop' | 'restart') => {
    try {
      setWebLoadingAction(`${id}-${action}`);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sites/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Ошибка выполнения команды');
      } else {
        const data = await res.json().catch(() => ({}));
        if (data?.message) console.log(data.message);
      }
      fetchData();
    } catch (error) {
      console.error('Control website error', error);
      alert('Ошибка соединения');
    } finally {
      setWebLoadingAction(null);
    }
  };

  const openWebSettings = (site: any) => {
    setCurrentWebSite(site);
    setWebSettingsTab('overview');
    setWebFiles([]); setWebFilesPath('/');
    setWebLogs({ pm2: '', nginx: '' });
    setWebBackups([]);
    setWebSftpCreds(null);
    setWebDomainInput(site?.domain || '');
    setWebFileUploadFile(null);
    setIsWebSettingsOpen(true);
  };

  const loadWebSiteLogs = async (siteId: string) => {
    try {
      setWebLogsLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sites/${siteId}/logs`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setWebLogs({ pm2: String(data?.pm2 ?? ''), nginx: String(data?.nginx ?? '') });
      }
    } catch (e) { console.error(e); }
    finally { setWebLogsLoading(false); }
  };

  const loadWebSiteFiles = async (siteId: string, path: string = '/') => {
    try {
      setWebFilesLoading(true);
      const token = localStorage.getItem('token');
      const q = new URLSearchParams({ path });
      const res = await fetch(`/api/sites/${siteId}/files?${q}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data?.ok) {
          setWebFilesPath(data.path || path);
          setWebFiles(Array.isArray(data.items) ? data.items : []);
        }
      }
    } catch (e) { console.error(e); }
    finally { setWebFilesLoading(false); }
  };

  const loadWebSiteBackups = async (siteId: string) => {
    try {
      setWebBackupsLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sites/${siteId}/backups`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data?.ok) setWebBackups(Array.isArray(data.items) ? data.items : []);
      }
    } catch (e) { console.error(e); }
    finally { setWebBackupsLoading(false); }
  };

  const loadWebSftpCreds = async (siteId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sites/${siteId}/sftp-creds`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data?.ok) setWebSftpCreds(data);
      }
    } catch (e) { console.error(e); }
  };

  const triggerWebBackup = async (siteId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sites/${siteId}/backups/trigger`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) { alert('Бэкап создан'); loadWebSiteBackups(siteId); }
      else { const e = await res.json().catch(() => ({})); alert(e.message || 'Ошибка создания бэкапа'); }
    } catch (e) { alert('Ошибка соединения'); console.error(e); }
  };

  const restartWebSite = async (siteId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sites/${siteId}/restart`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.skipped) showToast('info', 'ℹ️ Статический сайт — перезапуск не требуется');
        else showToast('success', '✅ Сайт перезапущен (PM2 reload + nginx apply)');
      } else {
        const e = await res.json().catch(() => ({}));
        showToast('error', `❌ ${e.message || 'Ошибка перезапуска'}`);
      }
    } catch (e) { console.error(e); showToast('error', '❌ Ошибка соединения'); }
  };

  const resetSftpPasswordWebSite = async (siteId: string) => {
    try {
      if (!confirm('Сгенерировать новые SFTP + SSH пароли?\n\n⚠️ СТАРЫЕ пароли перестанут работать.\n\nБудут созданы 2 отдельных пользователя:\n• SFTP-only (для FileZilla/WinSCP редактирования файлов)\n• SSH shell (для PuTTY / bash / терминала)')) return;
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sites/${siteId}/sftp-password-reset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast('success', '✅ SFTP + SSH пароли сброшены! Новые доступы появятся ниже (2 пользователя).');
        setWebSftpCreds((prev: any) => ({
          ...(prev || {}),
          username: data?.sftp?.username || data?.username || '',
          user: data?.sftp?.username || data?.username || '',
          password: data?.sftp?.password || data?.password || '',
          passwordOnce: data?.sftp?.password || data?.password || '',
          sftp: data?.sftp || null,
          ssh: data?.ssh || null,
        }));
        loadWebSftpCreds(siteId);
      } else {
        const e = await res.json().catch(() => ({}));
        showToast('error', `❌ ${e.message || 'Ошибка сброса пароля'}`);
      }
    } catch (e) { console.error(e); showToast('error', '❌ Ошибка соединения'); }
  };

  const attachWebDomain = async (siteId: string, domain: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sites/${siteId}/domain/attach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ domain }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Домен ${domain} привязан!\n\n${data.instructions || ''}\nIP ноды: ${data.nodeIp || ''}`);
        fetchData();
        setCurrentWebSite((s: any) => s && res.ok ? { ...s, domain } : s);
      } else {
        const e = await res.json().catch(() => ({}));
        alert(e.message || 'Ошибка привязки домена');
      }
    } catch (e) { alert('Ошибка соединения'); console.error(e); }
  };

  const issueWebSsl = async (siteId: string) => {
    if (!confirm('Запустить выпуск SSL-сертификата Let\'s Encrypt? (домен должен уже указывать A-записью на IP ноды)')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sites/${siteId}/ssl/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const text = await res.text();
      alert(res.ok ? `SSL сертификат выпущен!\n\n${text.slice(0, 500)}` : `Ошибка выпуска SSL:\n${text.slice(0, 800)}`);
    } catch (e) { alert('Ошибка соединения'); console.error(e); }
  };

  const uploadWebFile = async (siteId: string, toPath: string, file: File) => {
    try {
      setWebFilesLoading(true);
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('file', file);
      form.append('path', toPath);
      const res = await fetch(`/api/sites/${siteId}/files/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form,
      });
      if (res.ok) {
        setWebFileUploadFile(null);
        loadWebSiteFiles(siteId, toPath);
      } else {
        const e = await res.json().catch(() => ({}));
        alert(e.message || 'Ошибка загрузки файла');
      }
    } catch (e) { alert('Ошибка соединения'); console.error(e); }
    finally { setWebFilesLoading(false); }
  };

  const deleteWebFile = async (siteId: string, path: string) => {
    if (!confirm(`Удалить ${path}? Это действие нельзя отменить.`)) return;
    try {
      setWebFilesLoading(true);
      const token = localStorage.getItem('token');
      const q = new URLSearchParams({ path });
      const res = await fetch(`/api/sites/${siteId}/files?${q}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        alert(e.message || 'Ошибка удаления');
      } else {
        const parent = path.split('/').slice(0, -1).join('/') || '/';
        loadWebSiteFiles(siteId, parent === '' ? '/' : parent);
      }
    } catch (e) { alert('Ошибка соединения'); console.error(e); }
    finally { setWebFilesLoading(false); }
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
    if (serverPanelTab === 'overview' || serverPanelTab === 'access') {
      fetchSftpAccess(currentPanelServer.id);
    }
    if (serverPanelTab === 'players') {
      fetchPlayersList(currentPanelServer.id);
    }
  }, [isServerPanelOpen, currentPanelServer?.id, serverPanelTab]);

  useEffect(() => {
    if (!isWebSettingsOpen || !currentWebSite) return;
    const id = currentWebSite.id;
    if (webSettingsTab === 'overview' || webSettingsTab === 'ssh' || webSettingsTab === 'database' || webSettingsTab === 'ai') {
      if (!webSftpCreds) loadWebSftpCreds(id);
    }
    if (webSettingsTab === 'logs') {
      if (!webLogs.pm2 && !webLogs.nginx) loadWebSiteLogs(id);
    }
    if (webSettingsTab === 'files') {
      if (webFiles.length === 0) loadWebSiteFiles(id, webFilesPath);
    }
    if (webSettingsTab === 'backups') {
      if (webBackups.length === 0) loadWebSiteBackups(id);
    }
  }, [isWebSettingsOpen, currentWebSite?.id, webSettingsTab]);

  useEffect(() => {
    const shouldPoll = isServerPanelOpen && serverPanelTab === 'players' && currentPanelServer;
    if (!shouldPoll) return;
    const id = currentPanelServer!.id;
    fetchPlayersList(id);
    const intervalId = setInterval(() => fetchPlayersList(id), 6000);
    return () => clearInterval(intervalId);
  }, [isServerPanelOpen, serverPanelTab, currentPanelServer?.id]);

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
          const res = await fetch(`/api/game-servers/${currentSettingsServer.id}/settings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(serverSettings)
          });

          if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              alert(`Ошибка: ${err?.message || `HTTP ${res.status}`}`);
              return;
          }

          const data = await res.json().catch(() => ({}));
          if (data?.reprovisioned) {
              alert('✅ Настройки сохранены. Сервер переустановлен с сохранением мира/данных и запущен.');
          } else {
              alert('✅ Настройки сохранены. Перезапустите сервер (если меняли server.properties) для применения.');
          }
          setIsSettingsModalOpen(false);
          await fetchData();
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

  const handleSubmitNewTicket = async () => {
    if (!ticketTopic.trim()) return alert('Укажите тему обращения');
    if (!ticketMessage.trim()) return alert('Напишите сообщение');

    try {
      setSendingTicket(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: null,
          topic: ticketTopic.trim(),
          gameServerId: ticketServerId || null,
          firstMessage: ticketMessage.trim()
        })
      });

      if (res.ok) {
        const newOrder = await res.json();
        await fetchData();
        setIsNewTicketOpen(false);
        setTicketTopic('');
        setTicketServerId('');
        setTicketMessage('');
        setSelectedOrder(newOrder);
        setIsChatOpen(true);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Ошибка создания обращения');
      }
    } catch (e) {
      console.error('Ticket submit error:', e);
      alert('Ошибка соединения');
    } finally {
      setSendingTicket(false);
    }
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Личный кабинет</h1>
            <p className="mt-1 text-gray-500">Отслеживайте прогресс вашего проекта и оплачивайте услуги</p>
          </div>

          {/* TOAST NOTIFICATION */}
          {toast && (
            <div
              key={toast.id}
              className={`fixed top-24 right-4 sm:right-8 z-[60] max-w-md rounded-2xl border px-5 py-4 shadow-2xl shadow-black/10 backdrop-blur-sm ${
                toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-sky-50 border-sky-200 text-sky-900'
              }`}
              style={{ animation: 'toast-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both' }}
            >
              <div className="flex items-start gap-3">
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  toast.type === 'success' ? 'bg-emerald-100 text-emerald-600'
                  : toast.type === 'error' ? 'bg-rose-100 text-rose-600'
                  : 'bg-sky-100 text-sky-600'
                }`}>
                  {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
                </div>
                <div className="text-sm font-semibold leading-snug">{toast.message}</div>
              </div>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3 dashboard-no-flash">
            
            {/* Main Content */}
            <div className="lg:col-span-2 flex flex-col gap-8 relative" style={{minHeight: '1400px'}}>

              {/* Overview Tab Content */}
              <div aria-hidden={activeTab !== 'overview'} style={{display: activeTab === 'overview' ? undefined : 'none', transition: 'none', animation: 'none'}} className="flex flex-col gap-8 flex flex-col gap-8">
                  {(() => {
                    const overdueWS = webSites.filter(ws => isOverdue(ws.paidUntil, ws.status));
                    const paidSoonWS = webSites.filter(ws => isPaidSoon(ws.paidUntil) && !isOverdue(ws.paidUntil, ws.status));
                    const warningExists = warningGameServers.length > 0 || overdueWS.length > 0 || paidSoonWS.length > 0 || pendingInvoices.length > 0;
                    if (!warningExists) return null;
                    return (
                    <div
                      className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm mb-6 flex flex-col gap-3"
                    >
                      {overdueGameServers.length > 0 && (
                        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-rose-500 p-2 text-white"><AlertCircle className="h-5 w-5" /></div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-rose-900">Требуется оплата серверов ({overdueGameServers.length})</div>
                              <div className="mt-1 text-xs text-rose-700">
                                У вас {overdueGameServers.length} серверов с просроченной оплатой или приостановлено.
                              </div>
                              <button onClick={withScrollSave(() => setActiveTab('billing'))} className="mt-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                                К оплате →
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {overdueWS.length > 0 && (
                        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-rose-500 p-2 text-white"><Globe className="h-5 w-5" /></div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-rose-900">Требуется оплата сайтов ({overdueWS.length})</div>
                              <div className="mt-1 text-xs text-rose-700">
                                У вас {overdueWS.length} сайтов с просроченной оплатой. Они будут удалены через 3 дня.
                              </div>
                              <button onClick={withScrollSave(() => setActiveTab('websites'))} className="mt-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                                К сайтам →
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {gameServers.filter(gs => isPaidSoon(gs.paidUntil) && !isOverdue(gs.paidUntil, gs.status)).length > 0 && (
                        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-amber-500 p-2 text-white"><Clock className="h-5 w-5" /></div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-amber-900">Скоро окончание оплаты серверов ({gameServers.filter(gs => isPaidSoon(gs.paidUntil) && !isOverdue(gs.paidUntil, gs.status)).length})</div>
                              <div className="mt-1 text-xs text-amber-700">
                                Срок оплаты истекает менее чем через 5 дней. Рекомендуем продлить заранее.
                              </div>
                              <button onClick={withScrollSave(() => setActiveTab('game_servers'))} className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
                                Продлить серверы →
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {paidSoonWS.length > 0 && (
                        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-amber-500 p-2 text-white"><Globe className="h-5 w-5" /></div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-amber-900">Скоро окончание оплаты сайтов ({paidSoonWS.length})</div>
                              <div className="mt-1 text-xs text-amber-700">
                                Срок оплаты сайтов истекает менее чем через 5 дней. Рекомендуем продлить заранее.
                              </div>
                              <button onClick={withScrollSave(() => setActiveTab('websites'))} className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
                                Продлить сайты →
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {pendingInvoices.length > 0 && (
                        <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-indigo-500 p-2 text-white"><CreditCard className="h-5 w-5" /></div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-indigo-900">Непогашенные счета ({pendingInvoices.length}) на сумму {pendingSum} ₽</div>
                              <div className="mt-1 text-xs text-indigo-700">Оплатите счета, чтобы серверы и сайты не были приостановлены.</div>
                              <button onClick={() => setActiveTab('billing')} className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">
                                Оплатить →
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {/* Game Servers Summary */}
                  <div 
                   
                    className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 mb-6"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">Игровые серверы</h2>
                      <button
                        onClick={withScrollSave(() => { setConfiguratorMode('both'); setInitialConfiguratorTab('game'); setIsCreateServerModalOpen(true); })}
                        className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Создать сервер
                      </button>
                    </div>

                    {gameServers.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center text-gray-500">
                        <Server className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                        <p>У вас пока нет игровых серверов</p>
                        <button
                          onClick={withScrollSave(() => setActiveTab('game_servers'))}
                          className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                          Перейти к управлению →
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-xs uppercase tracking-wide text-gray-500">Всего серверов</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-900">{gameServers.length}</div>
                          </div>
                          <div className="rounded-2xl bg-emerald-50 p-4">
                            <div className="text-xs uppercase tracking-wide text-emerald-700">Активны</div>
                            <div className="mt-1 text-2xl font-semibold text-emerald-900">{runningGameServersCount}</div>
                          </div>
                          <div className="rounded-2xl bg-rose-50 p-4">
                            <div className="text-xs uppercase tracking-wide text-rose-700">Приостановлено</div>
                            <div className="mt-1 text-2xl font-semibold text-rose-900">{suspendedGameServersCount}</div>
                          </div>
                          <div className="rounded-2xl bg-indigo-50 p-4">
                            <div className="text-xs uppercase tracking-wide text-indigo-700">SFTP доступ</div>
                            <div className="mt-1 text-2xl font-semibold text-indigo-900">{sftpEnabledCount}</div>
                          </div>
                          <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 cursor-pointer hover:shadow-md transition" onClick={withScrollSave(() => setActiveTab('balance'))}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs uppercase tracking-wide text-indigo-700">Баланс</div>
                                <div className="mt-1 text-2xl font-bold text-gray-900">{Number(user?.balance ?? 0).toFixed(2)} <span className="text-sm font-semibold text-indigo-700">₽</span></div>
                              </div>
                              <div className="rounded-xl bg-indigo-500 p-2 text-white shadow"><Wallet className="h-5 w-5" /></div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); withScrollSave(() => setIsTopupModalOpen(true))(); }} className="mt-2 w-full text-xs bg-indigo-600 text-white py-1.5 rounded-lg hover:bg-indigo-700 transition">
                              Пополнить
                            </button>
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {gameServers.slice(0, 4).map((gs) => {
                            const node = getServerNode(gs);
                            const pendingInv = gs.status === 'pending_payment'
                              ? invoices.find(i => i.status === 'pending' && ((i as any).gameServerId === gs.id || (i as any).serverId === gs.id))
                              : null;
                            const payBtn = pendingInv
                              ? (e: any) => { e.stopPropagation(); handlePayInvoice(pendingInv.id); }
                              : gs.status === 'pending_payment'
                                ? (e: any) => { e.stopPropagation(); setActiveTab('billing'); alert('Перейдите в раздел «Финансы», чтобы оплатить счёт за этот сервер'); }
                                : null;
                            return (
                              <div
                                key={gs.id}
                                className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                              >
                                <div className="cursor-pointer" onClick={() => openServerPanel(gs)}>
                                  <div className="mb-4 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="mb-2 flex items-center gap-2 flex-wrap">
                                        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                                          <Server className="h-4 w-4" />
                                        </div>
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getGameServerStatusMeta(gs.status).badgeClassName}`}>
                                          {getGameServerStatusMeta(gs.status).label}
                                        </span>
                                        {isPaidSoon(gs.paidUntil) && !isOverdue(gs.paidUntil, gs.status) && (
                                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Скоро окончание</span>
                                        )}
                                        {isOverdue(gs.paidUntil, gs.status) && (
                                          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800">Требуется оплата</span>
                                        )}
                                      </div>
                                      <h3 className="truncate text-base font-semibold text-gray-900">{gs.name}</h3>
                                      <p className="mt-1 text-sm text-gray-500">{formatGameLabel(gs.game)} · {node?.ip || 'IP не назначен'}:{gs.port}</p>
                                    </div>
                                    <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-gray-700">
                                      {playerCounts[gs.id]?.online ?? 0} / {playerCounts[gs.id]?.max ?? gs.slots}
                                    </span>
                                  </div>
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl bg-slate-50 px-3 py-3">
                                      <div className="text-xs uppercase tracking-wide text-gray-500">Слоты</div>
                                      <div className="mt-1 text-sm font-semibold text-gray-900">
                                        {playerCounts[gs.id]?.online ?? 0} / {playerCounts[gs.id]?.max ?? gs.slots}
                                      </div>
                                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200">
                                        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, (playerCounts[gs.id]?.online ?? 0) / Math.max(1, (playerCounts[gs.id]?.max ?? gs.slots)) * 100)}%` }} />
                                      </div>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 px-3 py-3">
                                      <div className="text-xs uppercase tracking-wide text-gray-500">Оплата до</div>
                                      <div className="mt-1 text-sm font-semibold text-gray-900">{gs.paidUntil ? formatDate(gs.paidUntil) : 'Не указано'}</div>
                                    </div>
                                  </div>
                                </div>
                                {gs.status === 'pending_payment' && (
                                  <div className="mt-4 rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-3.5">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                      <div>
                                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-1">⏳ Ожидает оплаты</div>
                                        <p className="text-xs text-amber-800">Будет удалён через 3 дня. Оплатите позже с баланса ЛК.</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={payBtn || undefined}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 px-3 py-1.5 text-xs font-bold text-white shadow-md transition hover:shadow-lg"
                                      >
                                        <CreditCard className="h-3.5 w-3.5" />
                                        💳 Оплатить
                                      </button>
                                    </div>
                                  </div>
                                )}
                                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 cursor-pointer" onClick={() => openServerPanel(gs)}>
                                  <span className="text-sm font-medium text-indigo-600">Открыть панель</span>
                                  <span className="text-xs text-gray-500">Файлы, консоль, доступ</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                  {/* Websites Summary (Overview only — combined view) */}
                  <div
                    className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 mb-6"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">Сайты</h2>
                      <button
                        onClick={withScrollSave(() => { setConfiguratorMode('both'); setInitialConfiguratorTab('website'); setIsCreateServerModalOpen(true); })}
                        className="flex items-center gap-2 text-sm bg-sky-600 text-white px-3 py-1.5 rounded-lg hover:bg-sky-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Заказать сайт
                      </button>
                    </div>

                    {webSites.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center text-gray-500">
                        <Globe className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                        <p>У вас пока нет сайтов</p>
                        <button
                          onClick={withScrollSave(() => setActiveTab('websites'))}
                          className="mt-4 text-sm font-semibold text-sky-600 hover:text-sky-700"
                        >
                          Перейти к управлению →
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-xs uppercase tracking-wide text-gray-500">Всего сайтов</div>
                            <div className="mt-1 text-2xl font-semibold text-gray-900">{webSites.length}</div>
                          </div>
                          <div className="rounded-2xl bg-emerald-50 p-4">
                            <div className="text-xs uppercase tracking-wide text-emerald-700">Активны</div>
                            <div className="mt-1 text-2xl font-semibold text-emerald-900">{webSites.filter(w => w.status === 'active').length}</div>
                          </div>
                          <div className="rounded-2xl bg-rose-50 p-4">
                            <div className="text-xs uppercase tracking-wide text-rose-700">Приостановлено</div>
                            <div className="mt-1 text-2xl font-semibold text-rose-900">{webSites.filter(w => ['suspended','pending_payment'].includes(String(w.status || ''))).length}</div>
                          </div>
                          <div className="rounded-2xl bg-sky-50 p-4">
                            <div className="text-xs uppercase tracking-wide text-sky-700">🎁 Поддомены wexa.su</div>
                            <div className="mt-1 text-2xl font-semibold text-sky-900">{webSites.filter(w => w.domainType === 'subdomain').length}</div>
                          </div>
                          <div className="rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4 cursor-pointer hover:shadow-md transition" onClick={withScrollSave(() => setActiveTab('balance'))}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs uppercase tracking-wide text-sky-700">Баланс</div>
                                <div className="mt-1 text-2xl font-bold text-gray-900">{Number(user?.balance ?? 0).toFixed(2)} <span className="text-sm font-semibold text-sky-700">₽</span></div>
                              </div>
                              <div className="rounded-xl bg-sky-500 p-2 text-white shadow"><Wallet className="h-5 w-5" /></div>
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {webSites.slice(0, 4).map((ws: any) => {
                            const meta = getWebSiteStatusMeta(ws.status);
                            const fullUrl = ws.domain ? `https://${ws.domain}` : (ws.node?.ip ? `http://${ws.node.ip}` : null);
                            const wsPendingInv = ws.status === 'pending_payment'
                              ? invoices.find(i => i.status === 'pending' && ((i as any).webSiteId === ws.id || (i as any).siteId === ws.id))
                              : null;
                            const wsPayBtn = wsPendingInv
                              ? (e: any) => { e.stopPropagation(); handlePayInvoice(wsPendingInv.id); }
                              : null;
                            return (
                              <div
                                key={ws.id}
                                className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                              >
                                <div className="cursor-pointer" onClick={() => openWebSettings(ws)}>
                                  <div className="mb-4 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="mb-2 flex items-center gap-2 flex-wrap">
                                        <div className="rounded-xl bg-sky-50 p-2 text-sky-600">
                                          <Globe className="h-4 w-4" />
                                        </div>
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.color}`}>
                                          {meta.label}
                                        </span>
                                        {isPaidSoon(ws.paidUntil) && !isOverdue(ws.paidUntil, ws.status) && (
                                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Скоро окончание</span>
                                        )}
                                        {isOverdue(ws.paidUntil, ws.status) && (
                                          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800">Требуется оплата</span>
                                        )}
                                        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-50 to-violet-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-100">
                                          {getWebPlanLabel(ws.plan)}
                                        </span>
                                      </div>
                                      <h3 className="truncate text-base font-semibold text-gray-900">{fullUrl ? (ws.domain || String(ws.id).slice(0, 8)) : `Сайт #${String(ws.id || '').slice(0, 8)}`}</h3>
                                      <p className="mt-1 text-sm text-gray-500">
                                        {fullUrl ? fullUrl : (ws.node?.name ? `Нода: ${ws.node.name}` : 'Разворачивается...')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl bg-slate-50 px-3 py-3">
                                      <div className="text-xs uppercase tracking-wide text-gray-500">Оплачено до</div>
                                      <div className="mt-1 text-sm font-semibold text-gray-900">{ws.paidUntil ? formatDate(ws.paidUntil) : 'Не указано'}</div>
                                    </div>
                                    {ws.domainType && (
                                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                                        <div className="text-xs uppercase tracking-wide text-gray-500">Домен</div>
                                        <div className="mt-1 text-sm font-semibold text-gray-900">
                                          {ws.domainType === 'subdomain' ? '🎁 Бесплатный' : '🌐 Свой'}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {ws.status === 'pending_payment' && (
                                  <div className="mt-4 rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-3.5">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                      <div>
                                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-1">⏳ Ожидает оплаты</div>
                                        <p className="text-xs text-amber-800">Будет удалён через 3 дня. Оплатите позже с баланса ЛК.</p>
                                      </div>
                                      {wsPayBtn && (
                                        <button
                                          type="button"
                                          onClick={wsPayBtn}
                                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 px-3 py-1.5 text-xs font-bold text-white shadow-md transition hover:shadow-lg"
                                        >
                                          <CreditCard className="h-3.5 w-3.5" />
                                          💳 Оплатить
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 cursor-pointer" onClick={() => openWebSettings(ws)}>
                                  <span className="text-sm font-medium text-sky-600">Открыть панель</span>
                                  <span className="text-xs text-gray-500">Файлы, домен, логи</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
              </div>

              {/* Projects Tab */}
              <div aria-hidden={activeTab !== 'projects'} style={{display: activeTab === 'projects' ? undefined : 'none', transition: 'none', animation: 'none'}} className="flex flex-col gap-6 flex flex-col gap-6">
                  <h2 className="text-xl font-bold text-gray-900">Мои проекты</h2>
                  {projects.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                      <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Нет активных проектов</h3>
                      <p className="mt-1 text-sm text-gray-500">Закажите услугу разработки, чтобы начать новый проект.</p>
                    </div>
                  ) : (
                    projects.map(project => (
                      <div 
                        key={project.id}
                       
                       
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
                      </div>
                    ))
                  )}
              </div>

              {/* Billing Tab */}
              <div aria-hidden={activeTab !== 'billing'} style={{display: activeTab === 'billing' ? undefined : 'none', transition: 'none', animation: 'none'}} className="flex flex-col gap-6 flex flex-col gap-6">
                  <h2 className="text-xl font-bold text-gray-900">Финансы</h2>
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-3xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-rose-700">К оплате</div>
                          <div className="mt-2 text-3xl font-black text-gray-900">{pendingSum} <span className="text-lg font-semibold text-rose-700">₽</span></div>
                        </div>
                        <div className="rounded-2xl bg-rose-500 p-3 text-white shadow-lg"><AlertCircle className="h-6 w-6" /></div>
                      </div>
                      <div className="mt-3 text-sm text-gray-500">{pendingInvoices.length} счёт(ов)</div>
                    </div>
                    <div className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Оплачено за 30 дней</div>
                          <div className="mt-2 text-3xl font-black text-gray-900">{paidLast30Sum} <span className="text-lg font-semibold text-emerald-700">₽</span></div>
                        </div>
                        <div className="rounded-2xl bg-emerald-500 p-3 text-white shadow-lg"><CheckCircle className="h-6 w-6" /></div>
                      </div>
                      <div className="mt-3 text-sm text-gray-500">Всего пополнений за месяц</div>
                    </div>
                    <div className="rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Всего счетов</div>
                          <div className="mt-2 text-3xl font-black text-gray-900">{invoices.length} <span className="text-lg font-semibold text-indigo-700">шт.</span></div>
                        </div>
                        <div className="rounded-2xl bg-indigo-500 p-3 text-white shadow-lg"><CreditCard className="h-6 w-6" /></div>
                      </div>
                      <div className="mt-3 text-sm text-gray-500">За всё время существования</div>
                    </div>
                  </div>

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
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Период</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Создан</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Срок</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действие</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map((invoice) => (
                              <tr key={invoice.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {invoice.title || invoice.service?.title || 'Счет'}
                                  {invoice.gameServerId && (
                                    <div className="mt-0.5 text-xs font-normal text-gray-500">#{invoice.gameServerId}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {invoice.periodMonths ? `${invoice.periodMonths} мес.` : '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {invoice.dueDate ? formatDate(invoice.dueDate) : '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  {invoice.status === 'pending' && (
                                    <button
                                      onClick={() => handlePayInvoice(invoice.id)}
                                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                                    >
                                      <CreditCard className="h-3.5 w-3.5" />
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

              {/* Balance Tab */}
              <div aria-hidden={activeTab !== 'balance'} style={{display: activeTab === 'balance' ? undefined : 'none', transition: 'none', animation: 'none'}} className="flex flex-col gap-6 flex flex-col gap-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-900">Баланс и операции</h2>
                  </div>

                  {/* Big Balance Widget */}
                  <div
                   
                    className="rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-8 text-white shadow-2xl"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-6">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                          Текущий баланс
                        </div>
                        <div className="mt-3 text-5xl font-black tracking-tight">
                          {Number(user?.balance ?? 0).toFixed(2)}
                          <span className="ml-2 text-2xl font-bold text-indigo-200">₽</span>
                        </div>
                        <p className="mt-3 max-w-md text-sm text-indigo-200">
                          Пополняйте баланс удобной суммой — при заказе или продлении сервера стоимость будет списана автоматически. Если средств не хватит — вы получите уведомление.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 sm:min-w-[240px]">
                        <button
                          onClick={() => { setCustomAmount(''); setIsTopupModalOpen(true); }}
                          className="rounded-2xl bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-xl transition hover:bg-indigo-50 hover:scale-[1.02]"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <Plus className="h-4 w-4" />
                            Пополнить баланс
                          </span>
                        </button>
                        <button
                          onClick={async () => { try { await refreshBalance(); loadTransactions(); alert('Баланс обновлён'); } catch(e){} }}
                          className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
                        >
                          Обновить баланс
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Top-up amounts */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {QUICK_TOPUP_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => handleCreateTopup(amt)}
                        disabled={topupLoading}
                        className="group relative rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md disabled:opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Быстрое пополнение</div>
                            <div className="mt-2 text-3xl font-black text-gray-900">{amt} <span className="text-base font-semibold text-indigo-600">₽</span></div>
                          </div>
                          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                            <Plus className="h-5 w-5" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Transactions History */}
                  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4 flex-wrap">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">История операций</h3>
                        <p className="mt-0.5 text-xs text-gray-500">
                          Всего записей: <span className="font-semibold text-gray-700">{txTotal}</span> · страница <span className="font-semibold text-gray-700">{Math.floor(txOffset / txLimit) + 1}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTxOffset((o) => Math.max(0, o - txLimit))}
                          disabled={txOffset === 0 || txLoading}
                          className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronLeft className="h-4 w-4" /> Назад
                        </button>
                        <button
                          onClick={() => setTxOffset((o) => o + txLimit)}
                          disabled={txOffset + txLimit >= txTotal || txLoading}
                          className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                          Вперёд <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {txLoading && !transactions.length ? (
                      <div className="p-16 text-center text-gray-500">
                        <Loader className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
                        <div className="mt-3 text-sm">Загрузка истории...</div>
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="p-16 text-center text-gray-500">
                        <Wallet className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-3 text-sm font-medium text-gray-900">Пока нет операций</h3>
                        <p className="mt-1 text-xs text-gray-500">Сделайте первое пополнение, и история появится здесь.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Дата</th>
                              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Тип</th>
                              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Описание</th>
                              <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">Сумма</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 bg-white">
                            {transactions.map((t) => {
                              const badge = formatTxTypeBadge(t);
                              const abs = Math.abs(Number(t.amount) || 0);
                              return (
                                <tr key={t.id} className="transition hover:bg-slate-50">
                                  <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-700">
                                    <div className="font-medium">{formatDate(t.createdAt)}</div>
                                    <div className="text-[11px] text-gray-400">{new Date(t.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                                  </td>
                                  <td className="whitespace-nowrap px-6 py-3.5">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}>
                                      {badge.label}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3.5 text-sm text-gray-700">
                                    <div className="font-medium">{formatTxDescription(t)}</div>
                                    {(t.invoiceId || t.gameServerId) && (
                                      <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-gray-400">
                                        {t.invoiceId && <span className="rounded-md bg-gray-50 px-2 py-0.5">Счёт #{t.invoiceId.slice(0, 8)}</span>}
                                        {t.gameServerId && <span className="rounded-md bg-gray-50 px-2 py-0.5">Сервер #{t.gameServerId.slice(0, 8)}</span>}
                                      </div>
                                    )}
                                  </td>
                                  <td className="whitespace-nowrap px-6 py-3.5 text-right">
                                    <span className={`text-sm font-bold ${(Number(t.amount) || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                      {(Number(t.amount) || 0) >= 0 ? badge.sign : badge.sign} {abs.toFixed(2)} ₽
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
              </div>

              {/* Leads Tab - Detailed View */}
              <div aria-hidden={activeTab !== 'leads'} style={{display: activeTab === 'leads' ? undefined : 'none', transition: 'none', animation: 'none'}} className="flex flex-col gap-6 flex flex-col gap-6">
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
              </div>

              {/* Support Tab */}
              <div aria-hidden={activeTab !== 'requests'} style={{display: activeTab === 'requests' ? undefined : 'none', transition: 'none', animation: 'none'}} className="flex flex-col gap-6 flex flex-col gap-6">
                  <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-sky-900 to-cyan-700 p-6 text-white shadow-lg">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="mb-3 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-cyan-100">
                          Поддержка
                        </div>
                        <h2 className="text-2xl font-semibold">Обращения в поддержку</h2>
                        <p className="mt-2 max-w-2xl text-sm text-cyan-100">
                          Напишите нам — среднее время ответа меньше часа. Привяжите игровой сервер, чтобы мы быстрее нашли причину проблемы.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsNewTicketOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-md transition hover:bg-slate-50"
                      >
                        <Plus className="h-4 w-4" />
                        Новое обращение
                      </button>
                    </div>
                  </div>

                  <div
                   
                    className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <div className="divide-y divide-gray-100">
                      {orders.length === 0 ? (
                        <div className="p-12 text-center">
                          <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                          <div className="text-gray-500 mb-4">У вас пока нет обращений</div>
                          <button
                            onClick={() => setIsNewTicketOpen(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                          >
                            <Plus className="h-4 w-4" />
                            Создать первое обращение
                          </button>
                        </div>
                      ) : (
                        orders.map((order) => {
                          const linkedServer = order.gameServerId
                            ? gameServers.find((g) => g.id === order.gameServerId)
                            : null;
                          const displayTitle =
                            order.topic || order.service?.title || 'Обращение без темы';
                          return (
                            <div
                              key={order.id}
                              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsChatOpen(true);
                              }}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-900">
                                      {displayTitle}
                                    </h3>
                                    {order.unreadCount ? (
                                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                        {order.unreadCount}
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                    <span className="inline-flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      от {formatDate(order.createdAt)}
                                    </span>
                                    {linkedServer && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">
                                        <Server className="h-3 w-3" />
                                        {linkedServer.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    order.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : order.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : order.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {order.status === 'pending'
                                    ? 'Ожидает'
                                    : order.status === 'in_progress'
                                    ? 'В работе'
                                    : order.status === 'completed'
                                    ? 'Выполнен'
                                    : 'Закрыт'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                    setIsChatOpen(true);
                                  }}
                                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                                >
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  Открыть чат
                                </button>
                                <div className="flex gap-2">
                                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOrderToCancel(order.id);
                                        setIsConfirmCancelOpen(true);
                                      }}
                                      className="text-xs text-gray-500 hover:text-red-600"
                                    >
                                      Закрыть
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
              </div>

              <div aria-hidden={activeTab !== 'game_servers'} style={{display: activeTab === 'game_servers' ? undefined : 'none', transition: 'none', animation: 'none'}} className="flex flex-col gap-6 flex flex-col gap-6">
                  <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-700 p-6 text-white shadow-lg">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="mb-3 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100">
                          Игровой хостинг
                        </div>
                        <h2 className="text-2xl font-semibold">Мои игровые серверы</h2>
                        <p className="mt-2 max-w-2xl text-sm text-indigo-100">
                          Управляйте серверами из единой панели: консоль, файлы, настройки, оплата и доступы собраны в одном месте.
                        </p>
                      </div>
                      <button
                        onClick={withScrollSave(() => { setConfiguratorMode('game-only'); setInitialConfiguratorTab('game'); setIsCreateServerModalOpen(true); })}
                        className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                      >
                        <Plus className="h-4 w-4" />
                        Создать сервер
                      </button>
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                        <div className="text-xs uppercase tracking-wide text-indigo-200">Всего серверов</div>
                        <div className="mt-1 text-2xl font-semibold">{gameServers.length}</div>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                        <div className="text-xs uppercase tracking-wide text-indigo-200">Активны</div>
                        <div className="mt-1 text-2xl font-semibold">{runningGameServersCount}</div>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                        <div className="text-xs uppercase tracking-wide text-indigo-200">Нуждаются во внимании</div>
                        <div className="mt-1 text-2xl font-semibold">{suspendedGameServersCount}</div>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                        <div className="text-xs uppercase tracking-wide text-indigo-200">Игроков онлайн</div>
                        <div className="mt-1 text-2xl font-semibold">{totalPlayersOnline}</div>
                      </div>
                    </div>
                  </div>

                  {gameServers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
                      <Server className="mx-auto mb-3 h-9 w-9 text-gray-400" />
                      <p className="text-base font-medium text-gray-700">У вас нет активных серверов</p>
                      <p className="mt-2 text-sm text-gray-500">Создайте первый сервер и панель управления появится здесь автоматически.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-stretch gap-3 flex-1 min-w-[260px]">
                          <div className="relative flex-1 min-w-[200px]">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={serverSearch}
                              onChange={(e) => setServerSearch(e.target.value)}
                              placeholder="Поиск по названию, игре, IP, порту..."
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-sm text-gray-900 outline-none transition focus:border-indigo-300 focus:bg-white"
                            />
                          </div>
                          <select
                            value={gsStatusFilter}
                            onChange={(e) => setGsStatusFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-gray-800 outline-none transition focus:border-indigo-300 focus:bg-white"
                          >
                            <option value="all">Все статусы</option>
                            <option value="running">Активны</option>
                            <option value="stopped">Остановлены</option>
                            <option value="installing">Установка</option>
                            <option value="suspended">Приостановлено</option>
                            <option value="pending_payment">Ожидают оплаты</option>
                          </select>
                          <select
                            value={gsGameFilter}
                            onChange={(e) => setGsGameFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-gray-800 outline-none transition focus:border-indigo-300 focus:bg-white"
                          >
                            <option value="all">Все игры</option>
                            {gameOptions.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                          </select>
                          <select
                            value={gsNodeFilter}
                            onChange={(e) => setGsNodeFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-gray-800 outline-none transition focus:border-indigo-300 focus:bg-white"
                          >
                            <option value="all">Все ноды</option>
                            {nodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.ip})</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="rounded-xl bg-slate-50 px-3 py-2 text-gray-600">
                            Найдено: <span className="font-semibold text-gray-900">{filteredGameServers.length}</span>
                          </div>
                          {copiedValue && (
                            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">
                              Скопировано: <span className="font-semibold">{copiedValue}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {filteredGameServers.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
                          Ничего не найдено по текущему запросу.
                        </div>
                      ) : (
                        <div className="grid gap-5 xl:grid-cols-2">
                      {filteredGameServers.map((gs) => {
                        const node = getServerNode(gs);
                        const deleteState = deletedGameServerIds[gs.id]; // 'deleting' | 'deleted' | undefined
                        const isDeletingOrDeleted = !!deleteState;
                        const statusMeta = deleteState === 'deleted'
                          ? { badgeClassName: 'bg-gray-100 text-gray-500 border border-gray-200', label: 'Удалён' }
                          : deleteState === 'deleting'
                          ? { badgeClassName: 'bg-orange-100 text-orange-700 border border-orange-200 animate-pulse', label: '🗑️ Удаляется...' }
                          : getGameServerStatusMeta(gs.status);
                        const actionState = getGameServerActionState(gs.status);
                        const connectionValue = `${node?.ip || 'IP не назначен'}:${gs.port}`;
                        const cardBaseClass = deleteState === 'deleted'
                          ? 'transition-all duration-[1300ms] ease-in-out opacity-0 scale-95 grayscale blur-[2px] translate-y-[-20px] overflow-hidden max-h-0 border-0 p-0 m-0 shadow-none'
                          : deleteState === 'deleting'
                          ? 'transition-all duration-500 grayscale opacity-60 saturate-50'
                          : 'transition hover:-translate-y-0.5 hover:shadow-lg';
                        return (
                          <div
                            key={gs.id}
                            className={`rounded-3xl border border-gray-100 bg-white p-5 shadow-sm relative overflow-hidden ${cardBaseClass}`}
                          >
                            {isDeletingOrDeleted && (
                              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 backdrop-blur-[1px] rounded-3xl pointer-events-none">
                                <div className="flex flex-col items-center gap-3 text-center px-6">
                                  {deleteState === 'deleting' ? (
                                    <>
                                      <div className="relative">
                                        <div className="w-14 h-14 rounded-full border-4 border-gray-200" />
                                        <div className="absolute top-0 left-0 w-14 h-14 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center text-xl">🗑️</div>
                                      </div>
                                      <div>
                                        <div className="font-bold text-gray-900 text-base">Сервер удаляется...</div>
                                        <div className="text-sm text-gray-500 mt-0.5">Очищаем ноду, бэкапы и базу</div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-2xl animate-bounce">
                                        ✅
                                      </div>
                                      <div>
                                        <div className="font-bold text-emerald-700 text-base">Готово!</div>
                                        <div className="text-sm text-gray-500 mt-0.5">Сервер успешно удалён</div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.badgeClassName}`}>
                                    {statusMeta.label}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                    {formatGameLabel(gs.game)}
                                  </span>
                                </div>
                                <h3 className="truncate text-xl font-semibold text-gray-900">{gs.name}</h3>
                                <p className="mt-2 text-sm text-gray-500">{node?.ip || 'IP не назначен'}:{gs.port}</p>
                              </div>
                              <button
                                onClick={() => openServerPanel(gs)}
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                              >
                                Открыть панель
                              </button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <div className="text-xs uppercase tracking-wide text-gray-500">Игроки</div>
                                <div className="mt-1 text-lg font-semibold text-gray-900">
                                  {playerCounts[gs.id]?.online ?? 0} / {playerCounts[gs.id]?.max ?? (gs.slots || 10)}
                                </div>
                              </div>
                              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <div className="text-xs uppercase tracking-wide text-gray-500">Слоты</div>
                                <div className="mt-1 text-lg font-semibold text-gray-900">{gs.slots}</div>
                              </div>
                              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <div className="text-xs uppercase tracking-wide text-gray-500">Оплата до</div>
                                <div className="mt-1 text-sm font-semibold text-gray-900">{gs.paidUntil ? formatDate(gs.paidUntil) : 'Не указано'}</div>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <div className="mb-3 text-sm font-medium text-gray-900">Подключение</div>
                                <div className="flex flex-col gap-2 text-sm text-gray-600">
                                  <div className="flex items-center justify-between gap-3">
                                    <span>Узел</span>
                                    <span className="font-medium text-gray-900">{node?.name || 'Не указан'}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span>Адрес</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-gray-900">{connectionValue}</span>
                                      {node?.ip && (
                                        <button
                                          onClick={() => copyToClipboard(connectionValue, 'IP сервера')}
                                          className="rounded-lg p-1 text-gray-400 transition hover:bg-white hover:text-indigo-600"
                                          title="Скопировать IP"
                                        >
                                          {copiedValue === 'IP сервера' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span>SFTP</span>
                                    <span className="font-medium text-gray-900">{sftpAccess[gs.id]?.enabled ? 'Включен' : 'Выключен'}</span>
                                  </div>
                                  {gs.rconPassword && (
                                    <div className="flex items-center justify-between gap-3">
                                      <span>RCON</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-gray-900">{gs.rconPassword}</span>
                                        <button
                                          onClick={() => copyToClipboard(gs.rconPassword || '', 'RCON')}
                                          className="rounded-lg p-1 text-gray-400 transition hover:bg-white hover:text-indigo-600"
                                          title="Скопировать RCON"
                                        >
                                          {copiedValue === 'RCON' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                                <div className="mb-3 text-sm font-medium text-gray-900">Быстрые действия</div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <button
                                    onClick={() => handleControlGameServer(gs.id, 'start')}
                                    disabled={!actionState.canStart}
                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                                  >
                                    Запустить
                                  </button>
                                  <button
                                    onClick={() => handleControlGameServer(gs.id, 'stop')}
                                    disabled={!actionState.canStop}
                                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                                  >
                                    Остановить
                                  </button>
                                  <button
                                    onClick={() => handleControlGameServer(gs.id, 'restart')}
                                    disabled={!actionState.canRestart}
                                    className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
                                  >
                                    Перезапуск
                                  </button>
                                  <button
                                    onClick={() => handleExtendGameServer(gs.id, 1)}
                                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                                  >
                                    Продлить
                                  </button>
                                  <button
                                    onClick={() => openServerPanel(gs, 'console')}
                                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                  >
                                    Консоль
                                  </button>
                                  <button
                                    onClick={() => openServerPanel(gs, 'files')}
                                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                  >
                                    Файлы
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                        </div>
                      )}
                    </div>
                  )}
              </div>

              <div aria-hidden={activeTab !== 'websites'} style={{display: activeTab === 'websites' ? undefined : 'none', transition: 'none', animation: 'none'}} className="flex flex-col gap-6 flex flex-col gap-6">
                  <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-sky-900 to-cyan-700 p-6 text-white shadow-lg">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="mb-3 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-sky-100">
                          <Globe className="mr-2 h-4 w-4" />
                          Хостинг сайтов
                        </div>
                        <h2 className="text-2xl font-bold sm:text-3xl">Мои сайты</h2>
                        <p className="mt-1 text-sm text-sky-100 sm:text-base">
                          Всего сайтов: {webSites.length} · Активных: {webSites.filter(w => w.status === 'active').length}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={withScrollSave(() => { setConfiguratorMode('website-only'); setInitialConfiguratorTab('website'); setIsCreateServerModalOpen(true); })}
                          className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-sky-50"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Заказать сайт
                        </button>
                      </div>
                    </div>
                  </div>

                  {webSites.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-12 text-center shadow-sm">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg">
                        <Globe size={32} />
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-gray-900">Пока нет сайтов</h3>
                      <p className="mb-1 mx-auto max-w-md text-sm text-gray-500 leading-relaxed">
                        Закажите хостинг сайта — статический Landing или Node.js Business/Premium с админ-панелью.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                      {webSites.map((ws: any) => {
                        const meta = getWebSiteStatusMeta(ws.status);
                        const node = ws.node || null;
                        const daysLeft = (() => {
                          try {
                            if (!ws.paidUntil) return null;
                            const d = Math.ceil((new Date(String(ws.paidUntil) + 'T00:00:00').getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                            return d;
                          } catch { return null; }
                        })();
                        const fullUrl = ws.domain ? `https://${ws.domain}` : node?.ip ? `http://${node.ip}` : null;
                        const loading = webLoadingAction?.startsWith(`${ws.id}-`);
                        return (
                          <div key={ws.id} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-slate-300">
                            <div className="flex items-start justify-between mb-4 gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.color}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                                    {meta.label}
                                  </span>
                                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-50 to-violet-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-100">
                                    {getWebPlanLabel(ws.plan)}
                                  </span>
                                  {ws.domainType === 'subdomain' ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                                      🎁 Бесплатный поддомен
                                    </span>
                                  ) : ws.domain ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 border border-slate-200">
                                      🌐 Свой домен
                                    </span>
                                  ) : null}
                                </div>
                                {fullUrl ? (
                                  <a
                                    href={fullUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group/link"
                                  >
                                    <h3 className="text-lg font-extrabold text-gray-900 truncate group-hover/link:text-indigo-600 transition">
                                      {ws.domain || `${String(ws.id || '').slice(0, 8)}.sites.wexa.su`}
                                    </h3>
                                    <p className="text-xs text-sky-600 mt-0.5 font-medium truncate">
                                      {fullUrl} ↗
                                    </p>
                                  </a>
                                ) : (
                                  <h3 className="text-lg font-extrabold text-gray-900 truncate">
                                    Сайт #{String(ws.id || '').slice(0, 8)}
                                  </h3>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-5 text-xs">
                              {node && (
                                <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Нода</div>
                                  <div className="font-semibold text-slate-700 truncate">{node.name || node.ip} <span className="text-slate-400">· {node.ip}</span></div>
                                </div>
                              )}
                              <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Тип</div>
                                <div className="font-semibold text-slate-700">
                                  {ws.coreTemplate === 'nodejs' ? 'Node.js + Express' : 'Static HTML'}
                                </div>
                              </div>
                              {daysLeft !== null && (
                                <div className={`rounded-lg px-3 py-2 border ${daysLeft < 3 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                                  <div className={`text-[10px] uppercase tracking-wider font-bold mb-0.5 ${daysLeft < 3 ? 'text-rose-400' : 'text-slate-400'}`}>Оплачено до</div>
                                  <div className={`font-semibold truncate ${daysLeft < 3 ? 'text-rose-700' : 'text-slate-700'}`}>
                                    {ws.paidUntil} · {daysLeft >= 0 ? `${daysLeft} дн.` : `просрочено ${-daysLeft} дн.`}
                                  </div>
                                </div>
                              )}
                              <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Цена</div>
                                <div className="font-semibold text-slate-700">{(ws.priceMonthly && ws.priceMonthly > 0) ? ws.priceMonthly : ({ landing: 149, business: 299, premium: 599 } as Record<string,number>)[String(ws.plan || 'landing')] ?? 149} ₽/мес</div>
                              </div>
                            </div>

                            {ws.status === 'pending' && (() => {
                              const pendingInv = invoices.find(i => i.status === 'pending' && (i as any).siteId === ws.id);
                              const onPay = pendingInv
                                ? () => handlePayInvoice(pendingInv.id)
                                : () => { setActiveTab('billing'); alert('Перейдите в раздел «Финансы», чтобы оплатить счёт за этот сайт'); };
                              return (
                                <div className="mb-5 rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
                                  <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <div>
                                      <div className="text-xs font-black uppercase tracking-wider text-amber-600 mb-1">⏳ Ожидает оплаты</div>
                                      <p className="text-sm text-amber-800">Сайт будет автоматически удалён через 3 дня, если счёт не оплачен. Можно оплатить позже с внутреннего баланса личного кабинета.</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={onPay}
                                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:shadow-lg"
                                    >
                                      <CreditCard className="h-4 w-4" />
                                      💳 Оплатить с баланса
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleControlWebSite(ws.id, 'start')}
                                disabled={loading || ws.status === 'active' || ws.status === 'provisioning' || ws.status === 'deleted'}
                                className="inline-flex items-center rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                              >
                                {loading ? <Loader className="mr-1.5 h-4 w-4 animate-spin" /> : <Play className="mr-1.5 h-4 w-4" />}
                                Старт
                              </button>
                              <button
                                onClick={() => handleControlWebSite(ws.id, 'stop')}
                                disabled={loading || ws.status === 'suspended' || ws.status === 'pending' || ws.status === 'deleted'}
                                className="inline-flex items-center rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                              >
                                {loading ? <Loader className="mr-1.5 h-4 w-4 animate-spin" /> : <Square className="mr-1.5 h-4 w-4" />}
                                Стоп
                              </button>
                              <button
                                onClick={() => handleControlWebSite(ws.id, 'restart')}
                                disabled={loading || ws.status === 'deleted'}
                                className="inline-flex items-center rounded-xl bg-sky-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
                              >
                                {loading ? <Loader className="mr-1.5 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1.5 h-4 w-4" />}
                                Рестарт
                              </button>
                              <button
                                onClick={() => openWebSettings(ws)}
                                className="ml-auto inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-700"
                              >
                                <Settings className="mr-1.5 h-4 w-4" />
                                Настройки
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>

            </div>

            {/* Sidebar - Navigation */}
            <div className="flex flex-col gap-6">
              <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                <nav className="p-2">
                  <button
                    onClick={withScrollSave(() => setActiveTab('overview'))}
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
                    onClick={withScrollSave(() => setActiveTab('game_servers'))}
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
                    onClick={withScrollSave(() => setActiveTab('websites'))}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-1 ${
                      activeTab === 'websites' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Globe className="mr-3 h-5 w-5" />
                    Сайты
                  </button>
                  <button
                    onClick={withScrollSave(() => setActiveTab('billing'))}
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
                    onClick={withScrollSave(() => setActiveTab('balance'))}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-1 ${
                      activeTab === 'balance' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Wallet className="mr-3 h-5 w-5" />
                    Баланс
                  </button>
                  <button
                    onClick={withScrollSave(() => setActiveTab('requests'))}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-1 ${
                      activeTab === 'requests' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <MessageSquare className="mr-3 h-5 w-5" />
                    Поддержка
                  </button>
                </nav>
              </div>

              {/* Sidebar - Support */}
              <div 
               
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
              </div>
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
              
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Заказать сервис</h3>
                    <button onClick={() => setIsCreateServerModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <GameServerConfigurator
                    key={configuratorMode + '-' + initialConfiguratorTab + '-' + String(isCreateServerModalOpen)}
                    compact={true}
                    initialConfiguratorTab={initialConfiguratorTab}
                    configuratorMode={configuratorMode}
                    showNameField={true}
                    nodes={nodes as PublicNode[]}
                    isAuthenticated={true}
                    onOrder={submitOrderFromConfiguratorModal}
                    onWebsiteOrder={handleWebsiteOrderFromDashboard}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Manager Modal */}
        {isFileManagerOpen && currentFileServer && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 py-6">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsFileManagerOpen(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              
              <div className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all">
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
                    
                    <div className="flex flex-col gap-4">
                        {/* Common Settings */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Описание (MOTD)</label>
                            <input type="text" className="w-full p-2 border rounded" value={serverSettings.motd || serverSettings.hostname || ''} onChange={e => setServerSettings({...serverSettings, motd: e.target.value, hostname: e.target.value})} />
                        </div>

                        {/* Minecraft Settings */}
                        {currentSettingsServer.game === 'minecraft' && (
                            <>
                                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-lg flex flex-col gap-3.5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">Версия и ядро</h4>
                                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                                            Переустановка с сохранением мира
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Версия Minecraft</label>
                                        <div className="flex gap-2">
                                            <select
                                                className="flex-1 p-2 border rounded text-sm"
                                                value={POPULAR_MINECRAFT_VERSIONS.includes(String(serverSettings.mcVersion || 'LATEST'))
                                                    ? String(serverSettings.mcVersion || 'LATEST')
                                                    : '__custom__'}
                                                onChange={e => {
                                                    const v = e.target.value;
                                                    if (v === '__custom__') return;
                                                    setServerSettings({...serverSettings, mcVersion: v});
                                                }}
                                            >
                                                {POPULAR_MINECRAFT_VERSIONS.map(v => (
                                                    <option key={v} value={v}>{v}</option>
                                                ))}
                                                <option value="__custom__">✎ Ввести вручную…</option>
                                            </select>
                                            <input
                                                type="text"
                                                className="w-32 p-2 border rounded text-sm font-mono"
                                                value={serverSettings.mcVersion || 'LATEST'}
                                                onChange={e => setServerSettings({...serverSettings, mcVersion: e.target.value})}
                                                placeholder="1.20.1"
                                            />
                                        </div>
                                        <p className="mt-1 text-[10px] text-gray-500 leading-snug">
                                            LATEST — последняя стабильная • SNAPSHOT — снапшоты • точная версия — сборка модов.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Тип ядра</label>
                                        <select
                                            className="w-full p-2 border rounded text-sm"
                                            value={serverSettings.mcCore || serverSettings.core || 'paper'}
                                            onChange={e => setServerSettings({...serverSettings, mcCore: e.target.value, core: e.target.value})}
                                        >
                                            {MINECRAFT_CORE_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        {(() => {
                                            const c = MINECRAFT_CORE_OPTIONS.find(o => o.value === (serverSettings.mcCore || serverSettings.core || 'paper'));
                                            return c?.hint ? (
                                                <p className="mt-1 text-[10px] text-gray-500 leading-snug">{c.hint}</p>
                                            ) : null;
                                        })()}
                                    </div>

                                    {((serverSettings.mcCore || serverSettings.core || 'paper') === 'custom') && (
                                        <div className="flex flex-col gap-2 p-3 bg-white border border-indigo-200 rounded">
                                            <div className="flex items-start gap-1.5">
                                                <span className="mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black">!</span>
                                                <p className="text-[11px] text-indigo-800 leading-snug font-semibold">
                                                    Укажите <u>либо</u> прямую HTTPS-ссылку на .jar, <u>либо</u> имя файла .jar, который вы загрузите по SFTP в корень /data.
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-indigo-900 mb-0.5">Ссылка на .jar (https://…/server.jar)</label>
                                                <input
                                                    type="url"
                                                    className="w-full p-2 border rounded text-xs font-mono"
                                                    value={serverSettings.mcCustomJarUrl || ''}
                                                    onChange={e => setServerSettings({...serverSettings, mcCustomJarUrl: e.target.value})}
                                                    placeholder="https://example.com/mods/mycore-1.20.1.jar"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-indigo-900 mb-0.5">или имя файла в /data (SFTP)</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded text-xs font-mono"
                                                    value={serverSettings.mcCustomJarName || ''}
                                                    onChange={e => setServerSettings({...serverSettings, mcCustomJarName: e.target.value})}
                                                    placeholder="my-server-1.20.jar"
                                                />
                                                <p className="mt-0.5 text-[9px] text-indigo-600/80 leading-snug">
                                                    Загрузите .jar в папку /data по SFTP и укажите точное имя.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

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

                        {/* CS 1.6 Build Selector */}
                        {currentSettingsServer.game === 'cs16' && (
                            <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-lg flex flex-col gap-3.5">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-700">Сборка CS 1.6</h4>
                                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                                        Переустановка с сохранением карт/плагинов
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Версия HLDS / ReHLDS</label>
                                    <select
                                        className="w-full p-2 border rounded text-sm"
                                        value={serverSettings.cs16Build || 'archont94_stable_2021'}
                                        onChange={e => setServerSettings({...serverSettings, cs16Build: e.target.value})}
                                    >
                                        {CS16_BUILD_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {(() => {
                                        const cur = serverSettings.cs16Build || 'archont94_stable_2021';
                                        const b = CS16_BUILD_OPTIONS.find(o => o.value === cur);
                                        return b?.desc ? (
                                            <p className="mt-1.5 text-[11px] text-gray-600 leading-snug bg-amber-50/50 border border-amber-100 rounded px-2.5 py-1.5">
                                                {b.desc}
                                            </p>
                                        ) : null;
                                    })()}
                                    {(serverSettings.cs16Build || 'archont94_stable_2021') === 'steamcmd_latest' && (
                                        <div className="mt-2 flex items-start gap-2 p-2.5 bg-yellow-50 border border-yellow-200 rounded">
                                            <span className="mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-yellow-500 text-white text-[9px] font-black flex-shrink-0">!</span>
                                            <p className="text-[11px] font-semibold text-yellow-900 leading-snug">
                                                Первая установка займёт 2–10 минут (скачивание HLDS через SteamCMD).
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
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
            <div className="flex min-h-screen items-center justify-center px-4 py-6">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsServerPanelOpen(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="relative w-full max-w-6xl transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-700 p-6 text-white shadow-lg">
                    <div className="mb-6 flex justify-between items-start gap-4">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getGameServerStatusMeta(currentPanelServer.status).panelClassName}`}>
                            {getGameServerStatusMeta(currentPanelServer.status).label}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100">
                            {formatGameLabel(currentPanelServer.game)}
                          </span>
                        </div>
                        <h3 className="text-2xl font-semibold leading-6">Панель: {currentPanelServer.name}</h3>
                        <p className="mt-2 text-sm text-indigo-100">
                          {getServerNode(currentPanelServer)?.ip || 'IP не назначен'}:{currentPanelServer.port}
                        </p>
                        <p className="mt-1 text-sm text-indigo-200">
                          Слоты: {currentPanelServer.slots}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setIsServerPanelOpen(false)} className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20">
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-indigo-200">
                          <Users className="h-4 w-4" />
                          Игроки
                        </div>
                        <div className="text-2xl font-semibold">
                          {playerCounts[currentPanelServer.id]?.online ?? 0}
                          <span className="ml-1 text-sm font-medium text-indigo-200">/ {playerCounts[currentPanelServer.id]?.max ?? currentPanelServer.slots ?? 0}</span>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-indigo-200">
                          <Server className="h-4 w-4" />
                          Статус
                        </div>
                        <div className="text-2xl font-semibold">{getGameServerStatusMeta(currentPanelServer.status).label}</div>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-indigo-200">
                          <CreditCard className="h-4 w-4" />
                          Оплата
                        </div>
                        <div className="text-lg font-semibold">
                          {currentPanelServer.paidUntil ? formatDate(currentPanelServer.paidUntil) : 'Не указано'}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-indigo-200">
                          <Settings className="h-4 w-4" />
                          Доступ
                        </div>
                        <div className="text-lg font-semibold">
                          {sftpAccess[currentPanelServer.id]?.enabled ? 'SFTP включен' : 'Только панель'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleControlGameServer(currentPanelServer.id, 'start')}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                    >
                      Запустить
                    </button>
                    <button
                      onClick={() => handleControlGameServer(currentPanelServer.id, 'stop')}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
                    >
                      Остановить
                    </button>
                    <button
                      onClick={() => handleControlGameServer(currentPanelServer.id, 'restart')}
                      className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
                    >
                      Перезагрузить
                    </button>
                    <button
                      onClick={() => setServerPanelTab('files')}
                      className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-200"
                    >
                      Открыть файлы
                    </button>
                    <button
                      onClick={() => setServerPanelTab('settings')}
                      className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-200"
                    >
                      Настройки
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Вы уверены, что хотите удалить сервер ${currentPanelServer.name}? Все данные будут утеряны.`)) {
                          setIsServerPanelOpen(false);
                          handleDeleteServer(currentPanelServer.id);
                        }
                      }}
                      className="flex items-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить
                    </button>
                  </div>

                  <div className="mb-6 flex flex-wrap gap-2 rounded-2xl bg-slate-50 p-2">
                    <button
                      onClick={() => setServerPanelTab('overview')}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${serverPanelTab === 'overview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-700 hover:bg-white'}`}
                    >
                      Обзор
                    </button>
                    <button
                      onClick={() => setServerPanelTab('console')}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${serverPanelTab === 'console' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-700 hover:bg-white'}`}
                    >
                      Консоль
                    </button>
                    <button
                      onClick={() => setServerPanelTab('players')}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${serverPanelTab === 'players' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-700 hover:bg-white'}`}
                    >
                      Игроки
                    </button>
                    <button
                      onClick={() => setServerPanelTab('files')}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${serverPanelTab === 'files' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-700 hover:bg-white'}`}
                    >
                      Файлы
                    </button>
                    <button
                      onClick={() => setServerPanelTab('settings')}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${serverPanelTab === 'settings' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-700 hover:bg-white'}`}
                    >
                      Настройки
                    </button>
                    <button
                      onClick={() => setServerPanelTab('access')}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${serverPanelTab === 'access' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-700 hover:bg-white'}`}
                    >
                      Доступ
                    </button>
                  </div>

                  {serverPanelTab === 'overview' && (
                    <div className="flex flex-col gap-6">
                      <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                              <Server className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">Подключение</div>
                              <div className="text-xs text-gray-500">Основные сетевые данные сервера</div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 text-sm text-gray-700">
                            <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3">
                              <span>IP и порт</span>
                              <span className="font-mono text-xs text-gray-900">{getServerNode(currentPanelServer)?.ip || 'не назначен'}:{currentPanelServer.port}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3">
                              <span>Игра</span>
                              <span className="font-medium text-gray-900">{formatGameLabel(currentPanelServer.game)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3">
                              <span>Узел</span>
                              <span className="font-medium text-gray-900">{getServerNode(currentPanelServer)?.name || 'Не указан'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                              <Users className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">Ресурсы</div>
                              <div className="text-xs text-gray-500">Текущая конфигурация сервера</div>
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl bg-gray-50 px-4 py-3">
                              <div className="text-xs uppercase tracking-wide text-gray-500">Слоты</div>
                              <div className="mt-1 text-lg font-semibold text-gray-900">{currentPanelServer.slots}</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 px-4 py-3">
                              <div className="text-xs uppercase tracking-wide text-gray-500">Игроки онлайн</div>
                              <div className="mt-1 text-lg font-semibold text-gray-900">{playerCounts[currentPanelServer.id]?.online ?? 0}</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 px-4 py-3">
                              <div className="text-xs uppercase tracking-wide text-gray-500">Лимит игроков</div>
                              <div className="mt-1 text-lg font-semibold text-gray-900">{playerCounts[currentPanelServer.id]?.max ?? currentPanelServer.slots}</div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                              <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">Подписка и доступ</div>
                              <div className="text-xs text-gray-500">Оплата, RCON и файл-доступ</div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 text-sm text-gray-700">
                            <div className="rounded-xl bg-gray-50 px-4 py-3">
                              <div className="text-xs uppercase tracking-wide text-gray-500">Оплачено до</div>
                              <div className="mt-1 font-semibold text-gray-900">{currentPanelServer.paidUntil ? formatDate(currentPanelServer.paidUntil) : 'Не указано'}</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 px-4 py-3">
                              <div className="text-xs uppercase tracking-wide text-gray-500">RCON</div>
                              <div className="mt-1 font-mono text-xs text-gray-900">{currentPanelServer.rconPassword || 'Не используется'}</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 px-4 py-3">
                              <div className="text-xs uppercase tracking-wide text-gray-500">SFTP</div>
                              <div className="mt-1 font-semibold text-gray-900">{sftpAccess[currentPanelServer.id]?.enabled ? 'Включен' : 'Выключен'}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <div className="mb-4">
                            <div className="text-sm font-medium text-gray-900">Быстрые действия</div>
                            <div className="text-xs text-gray-500">Все основные операции без переходов между вкладками</div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <button onClick={() => handleControlGameServer(currentPanelServer.id, 'start')} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-left transition hover:bg-emerald-100">
                              <div className="text-sm font-semibold text-emerald-800">Запустить</div>
                              <div className="mt-1 text-xs text-emerald-700">Поднимает контейнер сервера</div>
                            </button>
                            <button onClick={() => handleControlGameServer(currentPanelServer.id, 'restart')} className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-left transition hover:bg-sky-100">
                              <div className="text-sm font-semibold text-sky-800">Перезагрузить</div>
                              <div className="mt-1 text-xs text-sky-700">Перезапуск без перехода в консоль</div>
                            </button>
                            <button onClick={() => setServerPanelTab('console')} className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-4 text-left transition hover:bg-indigo-100">
                              <div className="text-sm font-semibold text-indigo-800">Открыть консоль</div>
                              <div className="mt-1 text-xs text-indigo-700">Логи и команды сервера</div>
                            </button>
                            <button onClick={() => setServerPanelTab('files')} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-left transition hover:bg-gray-100">
                              <div className="text-sm font-semibold text-gray-900">Файлы сервера</div>
                              <div className="mt-1 text-xs text-gray-600">Редактор и загрузка файлов</div>
                            </button>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <div className="mb-4 text-sm font-medium text-gray-900">Состояние доступа</div>
                          <div className="flex flex-col gap-3 text-sm text-gray-700">
                            <div className="rounded-xl bg-gray-50 px-4 py-3">
                              <div className="text-xs uppercase tracking-wide text-gray-500">Файлы</div>
                              <div className="mt-1">Управление через вкладку `Файлы`</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 px-4 py-3">
                              <div className="text-xs uppercase tracking-wide text-gray-500">SFTP</div>
                              <div className="mt-1">
                                {sftpAccess[currentPanelServer.id]?.enabled
                                  ? `${sftpAccess[currentPanelServer.id]?.host}:${sftpAccess[currentPanelServer.id]?.port}`
                                  : 'Не включен'}
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => setServerPanelTab('access')}
                                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
                              >
                                Открыть доступы
                              </button>
                              <button
                                onClick={() => setServerPanelTab('settings')}
                                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-200"
                              >
                                Изменить настройки
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {serverPanelTab === 'console' && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-inner">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-white">Консоль сервера</div>
                          <div className="text-xs text-slate-400">Логи обновляются автоматически, пока открыта вкладка</div>
                        </div>
                        <button
                          onClick={() => fetchConsoleLogs(currentPanelServer.id)}
                          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
                        >
                          Обновить логи
                        </button>
                      </div>
                      <div ref={consoleLogsRef} className="mb-4 h-96 overflow-y-auto whitespace-pre-wrap rounded border border-gray-700 bg-black p-4 font-mono text-sm text-green-400">
                        {consoleLogs || 'Нет логов для отображения'}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 rounded border border-gray-700 bg-black p-2 font-mono text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
                          placeholder="Введите команду..."
                          value={consoleCommand}
                          onChange={e => setConsoleCommand(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSendConsoleCommand()}
                        />
                        <button
                          onClick={handleSendConsoleCommand}
                          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          Отправить
                        </button>
                      </div>
                    </div>
                  )}

                  {serverPanelTab === 'players' && currentPanelServer && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Список игроков</div>
                          <div className="text-xs text-gray-500">
                            Всего онлайн: {playersList[currentPanelServer.id]?.online ?? playerCounts[currentPanelServer.id]?.online ?? 0}
                            {' / '}
                            {playersList[currentPanelServer.id]?.max ?? playerCounts[currentPanelServer.id]?.max ?? currentPanelServer.slots}
                            {playersList[currentPanelServer.id]?.countOnly && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                Подробный список временно недоступен
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fetchPlayersList(currentPanelServer.id)}
                            disabled={playersListLoading[currentPanelServer.id]}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-slate-50 disabled:opacity-60"
                          >
                            {playersListLoading[currentPanelServer.id] ? 'Загрузка...' : 'Обновить'}
                          </button>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                        {playersListLoading[currentPanelServer.id] && !playersList[currentPanelServer.id] ? (
                          <div className="p-12 text-center text-gray-500">
                            <Loader className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
                            <div className="mt-2 text-sm">Загрузка списка игроков...</div>
                          </div>
                        ) : !playersList[currentPanelServer.id]?.players?.length ? (
                          <div className="p-12 text-center text-gray-500">
                            <Users className="mx-auto h-10 w-10 text-gray-400" />
                            <div className="mt-2 text-sm font-medium text-gray-700">На сервере нет игроков</div>
                            <div className="mt-1 text-xs text-gray-500">Они появятся здесь сразу после подключения.</div>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">#</th>
                                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Ник</th>
                                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Score</th>
                                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Время на сервере</th>
                                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Ping</th>
                                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Действия</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {playersList[currentPanelServer.id].players.map((p, idx) => (
                                  <tr key={p.name + idx} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 whitespace-nowrap text-xs font-medium text-gray-400">{idx + 1}</td>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold">
                                          {p.name.slice(0, 1).toUpperCase()}
                                        </div>
                                        <span className="font-semibold text-gray-900">{p.name}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-800">
                                      {typeof p.score === 'number' ? p.score : '—'}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                                      {typeof p.durationSec === 'number'
                                        ? `${Math.floor(p.durationSec / 3600)}ч ${Math.floor((p.durationSec % 3600) / 60)}м ${p.durationSec % 60}с`
                                        : '—'}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                                      {typeof (p as any).ping === 'number' ? `${(p as any).ping} мс` : '—'}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-right">
                                      <div className="inline-flex items-center gap-2">
                                        <button
                                          onClick={() => {
                                            setKickModal({ open: true, serverId: currentPanelServer.id, name: p.name });
                                            setKickReason('Нарушение правил');
                                          }}
                                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                                          title="Кикнуть игрока"
                                        >
                                          <UserMinus className="h-3.5 w-3.5" />
                                          Кик
                                        </button>
                                        <button
                                          onClick={() => {
                                            setBanModal({ open: true, serverId: currentPanelServer.id, name: p.name });
                                            setBanMinutes(60);
                                            setBanReason('Нарушение правил');
                                          }}
                                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                                          title="Забанить игрока"
                                        >
                                          <Ban className="h-3.5 w-3.5" />
                                          Бан
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {serverPanelTab === 'files' && currentFileServer && (
                    <div className="flex h-[600px] flex-col gap-4">
                      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">Файловый менеджер</div>
                            <div className="text-xs text-gray-500">
                              Просмотр, загрузка и редактирование файлов сервера без выхода из панели
                            </div>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-gray-600">
                            Сервер: <span className="font-medium text-gray-900">{currentFileServer.name}</span>
                          </div>
                        </div>
                      </div>

                      {editorContent !== null ? (
                        <div className="flex flex-1 flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900">Редактор файла</div>
                              <div className="font-mono text-xs text-gray-500">{editingFile}</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditorContent(null);
                                  setEditingFile(null);
                                }}
                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                              >
                                Закрыть
                              </button>
                              <button
                                onClick={handleSaveFile}
                                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                              >
                                Сохранить
                              </button>
                            </div>
                          </div>
                          <textarea
                            className="min-h-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white"
                            value={editorContent}
                            onChange={e => setEditorContent(e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-1 flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-3">
                            <button
                              onClick={() => fetchFiles(currentFileServer.id, '/')}
                              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:text-indigo-600"
                            >
                              <Home className="h-4 w-4" />
                            </button>
                            <div className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 font-mono text-sm text-gray-700">
                              /{currentPath === '/' ? '' : currentPath.replace(/^\//, '')}
                            </div>
                            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100">
                              <Upload className="h-4 w-4" />
                              Загрузить файл
                              <input type="file" className="hidden" onChange={handleFileUpload} />
                            </label>
                            {currentPath !== '/' && (
                              <button
                                onClick={() => {
                                  const parts = currentPath.split('/').filter(Boolean);
                                  parts.pop();
                                  const newPath = parts.length > 0 ? '/' + parts.join('/') : '/';
                                  fetchFiles(currentFileServer.id, newPath);
                                }}
                                className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                              >
                                На уровень выше
                              </button>
                            )}
                          </div>

                          <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Имя</th>
                                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Размер / действия</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {serverFiles.map((file, idx) => (
                                  <tr
                                    key={idx}
                                    className="cursor-pointer transition hover:bg-slate-50"
                                    onClick={() => {
                                      const newPath = (currentPath === '/' ? '' : currentPath) + '/' + file.name;
                                      if (file.isDirectory || file.isDir) fetchFiles(currentFileServer.id, newPath);
                                      else fetchFileContent(currentFileServer.id, newPath);
                                    }}
                                  >
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                      <div className="flex items-center gap-3">
                                        <div className={`rounded-xl p-2 ${(file.isDirectory || file.isDir) ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                          {(file.isDirectory || file.isDir) ? <Folder className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                        </div>
                                        <div className="font-medium">{file.name}</div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                                      <div className="flex items-center justify-end gap-4">
                                        <span>{(file.isDirectory || file.isDir) ? '-' : (file.size / 1024).toFixed(1) + ' KB'}</span>
                                        <button
                                          onClick={(e) => handleDeleteFile(file.name, e)}
                                          className="rounded-lg p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                          title="Удалить"
                                        >
                                          <Trash className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                {serverFiles.length === 0 && (
                                  <tr>
                                    <td colSpan={2} className="px-6 py-10 text-center text-sm text-gray-500">
                                      В этой папке пока нет файлов
                                    </td>
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
                    <div className="flex flex-col gap-4">
                      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">Настройки сервера</div>
                            <div className="text-xs text-gray-500">
                              Изменения применяются через конфигурацию игры и сохраняются на сервере
                            </div>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-gray-600">
                            Игра: <span className="font-medium text-gray-900">{formatGameLabel(currentSettingsServer.game)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Описание (MOTD)</label>
                            <input
                              type="text"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-300 focus:bg-white"
                              value={serverSettings.motd || serverSettings.hostname || ''}
                              onChange={e => setServerSettings({ ...serverSettings, motd: e.target.value, hostname: e.target.value })}
                            />
                          </div>

                          {currentSettingsServer.game === 'minecraft' && (
                            <>
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <label className="mb-2 block text-sm font-medium text-gray-700">Режим игры</label>
                                  <select
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-300 focus:bg-white"
                                    value={serverSettings.gamemode || 'survival'}
                                    onChange={e => setServerSettings({ ...serverSettings, gamemode: e.target.value })}
                                  >
                                    <option value="survival">Выживание</option>
                                    <option value="creative">Творческий</option>
                                    <option value="adventure">Приключение</option>
                                    <option value="spectator">Наблюдатель</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-2 block text-sm font-medium text-gray-700">Сложность</label>
                                  <select
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-300 focus:bg-white"
                                    value={serverSettings.difficulty || 'easy'}
                                    onChange={e => setServerSettings({ ...serverSettings, difficulty: e.target.value })}
                                  >
                                    <option value="peaceful">Мирная</option>
                                    <option value="easy">Легкая</option>
                                    <option value="normal">Нормальная</option>
                                    <option value="hard">Сложная</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Ядро</label>
                                <input
                                  list="core-options-panel"
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-300 focus:bg-white"
                                  value={serverSettings.core || 'vanilla'}
                                  onChange={e => setServerSettings({ ...serverSettings, core: e.target.value })}
                                  placeholder="Выберите или введите название ядра"
                                />
                                <div className="mt-2 text-xs text-amber-600">Смена ядра может потребовать переустановку сервера.</div>
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
                              <div className="grid gap-3">
                                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={serverSettings.pvp === 'true'}
                                    onChange={e => setServerSettings({ ...serverSettings, pvp: e.target.checked ? 'true' : 'false' })}
                                  />
                                  <span className="text-sm font-medium text-gray-700">PvP включен</span>
                                </label>
                                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={serverSettings['online-mode'] === 'true'}
                                    onChange={e => setServerSettings({ ...serverSettings, 'online-mode': e.target.checked ? 'true' : 'false' })}
                                  />
                                  <span className="text-sm font-medium text-gray-700">Лицензионный режим (Online Mode)</span>
                                </label>
                                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={serverSettings['white-list'] === 'true'}
                                    onChange={e => setServerSettings({ ...serverSettings, 'white-list': e.target.checked ? 'true' : 'false' })}
                                  />
                                  <span className="text-sm font-medium text-gray-700">Белый список</span>
                                </label>
                              </div>
                            </>
                          )}

                          {(currentSettingsServer.game === 'cs2' || currentSettingsServer.game === 'cs16') && (
                            <div className="grid gap-4">
                              <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">RCON пароль</label>
                                <input
                                  type="text"
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-300 focus:bg-white"
                                  value={serverSettings.rcon_password || ''}
                                  onChange={e => setServerSettings({ ...serverSettings, rcon_password: e.target.value })}
                                  placeholder="Пароль для управления сервером"
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Карта при запуске</label>
                                <input
                                  type="text"
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-300 focus:bg-white"
                                  value={serverSettings.map || 'de_dust2'}
                                  onChange={e => setServerSettings({ ...serverSettings, map: e.target.value })}
                                  placeholder="de_dust2"
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Пароль на сервер</label>
                                <input
                                  type="text"
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-300 focus:bg-white"
                                  value={serverSettings.sv_password || ''}
                                  onChange={e => setServerSettings({ ...serverSettings, sv_password: e.target.value })}
                                  placeholder="Оставьте пустым для публичного входа"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-4">
                          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 text-sm font-medium text-gray-900">Что можно изменить</div>
                            <div className="flex flex-col gap-3 text-sm text-gray-600">
                              <div className="rounded-xl bg-slate-50 px-4 py-3">Описание сервера и основные игровые параметры</div>
                              <div className="rounded-xl bg-slate-50 px-4 py-3">Ядро и режим запуска для Minecraft</div>
                              <div className="rounded-xl bg-slate-50 px-4 py-3">RCON, карту и пароль для Counter-Strike</div>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                            <div className="text-sm font-medium text-indigo-900">Применение настроек</div>
                            <div className="mt-2 text-sm text-indigo-700">
                              После сохранения часть параметров может вступить в силу только после перезапуска сервера.
                            </div>
                            <button
                              onClick={handleUpdateSettings}
                              className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
                            >
                              Сохранить настройки
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {serverPanelTab === 'access' && (
                    <div className="flex flex-col gap-4">
                      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-sm">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-xl bg-white/10 p-3 text-indigo-200">
                              <Server className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">Данные подключения</div>
                              <div className="text-xs text-slate-400">Используйте эти данные для прямого доступа к серверу</div>
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                              <div className="text-xs uppercase tracking-wide text-slate-400">IP и порт</div>
                              <div className="mt-1 flex items-center gap-2">
                                <div className="font-mono text-sm text-white">
                                  {getServerNode(currentPanelServer)?.ip || 'не назначен'}:{currentPanelServer.port}
                                </div>
                                {getServerNode(currentPanelServer)?.ip && (
                                  <button
                                    onClick={() => copyToClipboard(`${getServerNode(currentPanelServer)?.ip}:${currentPanelServer.port}`, 'IP сервера')}
                                    className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                                    title="Скопировать IP"
                                  >
                                    {copiedValue === 'IP сервера' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                              <div className="text-xs uppercase tracking-wide text-slate-400">Узел</div>
                              <div className="mt-1 text-sm text-white">{getServerNode(currentPanelServer)?.name || 'Не указан'}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                              <div className="text-xs uppercase tracking-wide text-slate-400">Игра</div>
                              <div className="mt-1 text-sm text-white">{formatGameLabel(currentPanelServer.game)}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                              <div className="text-xs uppercase tracking-wide text-slate-400">Файлы</div>
                              <div className="mt-1 text-sm text-white">Через панель или SFTP</div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <div className="mb-3 text-sm font-medium text-gray-900">Рекомендации по доступу</div>
                          <div className="flex flex-col gap-3 text-sm text-gray-600">
                            <div className="rounded-xl bg-slate-50 px-4 py-3">Для быстрого редактирования конфигов используйте вкладку `Файлы`.</div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3">SFTP удобно подключать для крупных сборок, карт и модов.</div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3">После загрузки файлов при необходимости перезапустите сервер из верхней панели.</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">SFTP-доступ</div>
                            <div className="text-xs text-gray-500">Внешнее подключение к каталогу данных сервера</div>
                          </div>
                          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${sftpAccess[currentPanelServer.id]?.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {sftpAccess[currentPanelServer.id]?.enabled ? 'Активен' : 'Выключен'}
                          </div>
                        </div>

                        {sftpAccess[currentPanelServer.id]?.enabled ? (
                          <div className="flex flex-col gap-4">
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                              <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <div className="text-xs uppercase tracking-wide text-gray-500">Host</div>
                                <div className="mt-1 flex items-start justify-between gap-2">
                                  <div className="break-all font-mono text-sm text-gray-900">{sftpAccess[currentPanelServer.id]?.host}</div>
                                  <button
                                    onClick={() => copyToClipboard(sftpAccess[currentPanelServer.id]?.host || '', 'SFTP host')}
                                    className="rounded-lg p-1 text-gray-400 transition hover:bg-white hover:text-indigo-600"
                                    title="Скопировать host"
                                  >
                                    {copiedValue === 'SFTP host' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                              <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <div className="text-xs uppercase tracking-wide text-gray-500">Port</div>
                                <div className="mt-1 flex items-start justify-between gap-2">
                                  <div className="font-mono text-sm text-gray-900">{sftpAccess[currentPanelServer.id]?.port}</div>
                                  <button
                                    onClick={() => copyToClipboard(String(sftpAccess[currentPanelServer.id]?.port || ''), 'SFTP port')}
                                    className="rounded-lg p-1 text-gray-400 transition hover:bg-white hover:text-indigo-600"
                                    title="Скопировать port"
                                  >
                                    {copiedValue === 'SFTP port' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                              <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <div className="text-xs uppercase tracking-wide text-gray-500">User</div>
                                <div className="mt-1 flex items-start justify-between gap-2">
                                  <div className="break-all font-mono text-sm text-gray-900">{sftpAccess[currentPanelServer.id]?.username}</div>
                                  <button
                                    onClick={() => copyToClipboard(sftpAccess[currentPanelServer.id]?.username || '', 'SFTP user')}
                                    className="rounded-lg p-1 text-gray-400 transition hover:bg-white hover:text-indigo-600"
                                    title="Скопировать user"
                                  >
                                    {copiedValue === 'SFTP user' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                              <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <div className="text-xs uppercase tracking-wide text-gray-500">Pass</div>
                                <div className="mt-1 flex items-start justify-between gap-2">
                                  <div className="break-all font-mono text-sm text-gray-900">{sftpAccess[currentPanelServer.id]?.password}</div>
                                  <button
                                    onClick={() => copyToClipboard(sftpAccess[currentPanelServer.id]?.password || '', 'SFTP пароль')}
                                    className="rounded-lg p-1 text-gray-400 transition hover:bg-white hover:text-indigo-600"
                                    title="Скопировать пароль"
                                  >
                                    {copiedValue === 'SFTP пароль' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                              <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <div className="text-xs uppercase tracking-wide text-gray-500">Path</div>
                                <div className="mt-1 flex items-start justify-between gap-2">
                                  <div className="break-all font-mono text-sm text-gray-900">{sftpAccess[currentPanelServer.id]?.path || '/files'}</div>
                                  <button
                                    onClick={() => copyToClipboard(sftpAccess[currentPanelServer.id]?.path || '/files', 'SFTP путь')}
                                    className="rounded-lg p-1 text-gray-400 transition hover:bg-white hover:text-indigo-600"
                                    title="Скопировать путь"
                                  >
                                    {copiedValue === 'SFTP путь' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleDisableSftp(currentPanelServer.id)}
                                disabled={Boolean(sftpLoading[currentPanelServer.id])}
                                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Отключить SFTP
                              </button>
                              <button
                                onClick={() => setServerPanelTab('files')}
                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                              >
                                Открыть файлы
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
                            <div className="text-sm text-gray-700">
                              Включите SFTP, чтобы получить внешний доступ к `/data` вашего сервера через любой SFTP-клиент.
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                onClick={() => handleEnableSftp(currentPanelServer.id)}
                                disabled={Boolean(sftpLoading[currentPanelServer.id])}
                                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Включить SFTP
                              </button>
                              <button
                                onClick={() => setServerPanelTab('files')}
                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                              >
                                Перейти в файлы
                              </button>
                            </div>
                          </div>
                        )}
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


        {/* Confirm Pay Modal */}
        {confirmPayOpen && invoiceToPay && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
                onClick={() => { setConfirmPayOpen(false); setInvoiceToPay(null); }}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                      <CreditCard className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Оплата счета №{invoiceToPay.slice(0, 8)}
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Вы будете перенаправлены на страницу безопасной оплаты. После успешной оплаты сервис будет автоматически активирован или продлен.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={executePayInvoice}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Оплатить
                  </button>
                  <button
                    type="button"
                    onClick={() => { setConfirmPayOpen(false); setInvoiceToPay(null); }}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kick Player Modal */}
        {kickModal.open && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
                onClick={() => setKickModal({ open: false, serverId: '', name: '' })}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                      <UserMinus className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Кикнуть игрока {kickModal.name}
                      </h3>
                      <div className="mt-4 flex flex-col gap-3">
                        <p className="text-sm text-gray-500">
                          Игрок будет немедленно отключен от сервера. Укажите причину (отображается игроку).
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Причина кика</label>
                          <textarea
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            rows={3}
                            value={kickReason}
                            onChange={(e) => setKickReason(e.target.value)}
                            placeholder="Нарушение правил..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleKickPlayer}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Кикнуть
                  </button>
                  <button
                    type="button"
                    onClick={() => setKickModal({ open: false, serverId: '', name: '' })}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ban Player Modal */}
        {banModal.open && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
                onClick={() => setBanModal({ open: false, serverId: '', name: '' })}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <Ban className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Забанить игрока {banModal.name}
                      </h3>
                      <div className="mt-4 flex flex-col gap-3">
                        <p className="text-sm text-gray-500">
                          Игрок будет отключен и не сможет подключиться до окончания бана.
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Длительность бана (минут)</label>
                          <input
                            type="number"
                            step={10}
                            min={1}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            value={banMinutes}
                            onChange={(e) => setBanMinutes(Math.max(1, Number(e.target.value) || 1))}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            0 = перманентный бан (если поддерживается игрой)
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Причина бана</label>
                          <textarea
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            rows={3}
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            placeholder="Нарушение правил..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleBanPlayer}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Забанить на {banMinutes} мин
                  </button>
                  <button
                    type="button"
                    onClick={() => setBanModal({ open: false, serverId: '', name: '' })}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Support Ticket Modal */}
        {isNewTicketOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 py-6">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
                onClick={() => setIsNewTicketOpen(false)}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <div className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Новое обращение в поддержку</h3>
                    <button onClick={() => setIsNewTicketOpen(false)} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Тема обращения</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="Не работает сервер..."
                        value={ticketTopic}
                        onChange={(e) => setTicketTopic(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Связанный сервер (необязательно)</label>
                      <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={ticketServerId}
                        onChange={(e) => setTicketServerId(e.target.value)}
                      >
                        <option value="">Без привязки к серверу</option>
                        {gameServers.map((gs) => (
                          <option key={gs.id} value={gs.id}>
                            {gs.name} — {gs.game} [{gs.status}]
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Сообщение</label>
                      <textarea
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        rows={5}
                        placeholder="Опишите вашу проблему или вопрос..."
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleSubmitNewTicket}
                    disabled={sendingTicket || !ticketTopic.trim() || !ticketMessage.trim()}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingTicket ? 'Отправка...' : 'Отправить обращение'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewTicketOpen(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Web Site Settings Modal */}
        {isWebSettingsOpen && currentWebSite && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 py-6">
              <div className="fixed inset-0 transition-opacity" onClick={() => setIsWebSettingsOpen(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <div className="relative w-full max-w-7xl max-h-[90vh] transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all">
                <div className="flex flex-col h-full max-h-[90vh]">
                <div className="border-b border-slate-200 bg-slate-50/60 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <Globe className="h-5 w-5 text-sky-600" />
                        Настройки сайта
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${getWebSiteStatusMeta(currentWebSite.status).color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${getWebSiteStatusMeta(currentWebSite.status).dot}`} />
                          {getWebSiteStatusMeta(currentWebSite.status).label}
                        </span>
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {currentWebSite.domain ? (
                          <a href={`http://${currentWebSite.domain}`} target="_blank" rel="noreferrer" className="font-mono text-indigo-600 hover:underline">
                            {currentWebSite.domain} ↗
                          </a>
                        ) : (
                          <span className="font-mono text-slate-400">Домен не привязан</span>
                        )}
                        <span className="mx-2 text-slate-300">·</span>
                        Тариф <span className="font-medium text-slate-700">{getWebPlanLabel(currentWebSite.plan)}</span>
                      </p>
                    </div>
                    <button onClick={() => setIsWebSettingsOpen(false)} className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-sm">
                    {([
                      { id: 'overview', label: 'Общие', icon: ShieldCheck },
                      { id: 'files', label: 'Файлы', icon: HardDrive },
                      { id: 'ssh', label: 'SSH/SFTP', icon: KeyRound },
                      { id: 'database', label: 'База данных', icon: Database },
                      { id: 'ai', label: 'AI-Ассистент', icon: Sparkles },
                      { id: 'logs', label: 'Логи', icon: TerminalIcon },
                      { id: 'backups', label: 'Бэкапы', icon: FileArchive },
                    ] as const).map((t) => {
                      const Icon = t.icon;
                      const active = webSettingsTab === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setWebSettingsTab(t.id)}
                          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition flex-1 sm:flex-none ${
                            active
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{t.label}</span>
                          <span className="sm:hidden">{t.label.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white px-6 py-5 min-h-[520px] flex-1 overflow-y-auto">
                  {webSettingsTab === 'overview' && (
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="flex flex-col gap-5">
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-slate-900">Домен</h4>
                          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                            <label className="block text-xs font-medium text-slate-600">Ваш домен (например, mycompany.ru)</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={webDomainInput}
                                onChange={(e) => setWebDomainInput(e.target.value)}
                                placeholder="example.ru"
                                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                onClick={() => attachWebDomain(currentWebSite.id, webDomainInput.trim())}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                              >
                                Прикрепить
                              </button>
                            </div>
                            <button
                              onClick={() => issueWebSsl(currentWebSite.id)}
                              className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              <ShieldCheck className="h-4 w-4" />
                              Выпустить SSL-сертификат (Let's Encrypt)
                            </button>
                            {currentWebSite.node?.ip && (
                              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                <b>DNS настройка:</b> добавьте A-запись домена на IP <span className="font-mono font-semibold">{currentWebSite.node.ip}</span> перед выпуском SSL.
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-slate-900">Информация о тарифе</h4>
                          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                            {[
                              ['Тариф', getWebPlanLabel(currentWebSite.plan)],
                              ['Нода', currentWebSite.node?.name || currentWebSite.node?.ip || '—'],
                              ['IP ноды', currentWebSite.node?.ip || '—'],
                              ['Оплачено до', currentWebSite.paidUntil ? new Date(currentWebSite.paidUntil).toLocaleString('ru-RU') : '—'],
                              ['Стоимость', `${(currentWebSite.priceMonthly && currentWebSite.priceMonthly > 0) ? currentWebSite.priceMonthly : ({ landing: 149, business: 299, premium: 599 } as Record<string,number>)[String(currentWebSite.plan || 'landing')] ?? 149} ₽/мес`],
                            ].map(([k, v]) => (
                              <div key={k} className="flex items-center justify-between px-4 py-2.5 text-sm">
                                <span className="text-slate-500">{k}</span>
                                <span className="font-medium text-slate-900">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-5">
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-slate-900">Состояние сайта</h4>
                          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-4 flex flex-col gap-3">
                            {(() => {
                              const paidUntil = currentWebSite.paidUntil ? new Date(currentWebSite.paidUntil + 'T00:00:00').getTime() : 0;
                              const daysLeftRaw = paidUntil ? Math.ceil((paidUntil - Date.now()) / (24*60*60*1000)) : null;
                              const sslExp = (currentWebSite as any).sslExpiresAt ? new Date(String((currentWebSite as any).sslExpiresAt)).getTime() : 0;
                              const sslDaysLeft = sslExp ? Math.ceil((sslExp - Date.now())/(24*60*60*1000)) : null;
                              const status = String(currentWebSite.status || 'pending').toLowerCase();
                              const statusLabel: Record<string,string> = { active:'Работает ✅', suspended:'Приостановлен ⏸', pending:'Ожидает активации ⏳', provisioning:'Настраивается ⚙️', deleting:'Удаляется 🗑️', deleted:'Удалён ❌' };
                              const statusColor: Record<string,string> = { active:'bg-emerald-50 text-emerald-700 border-emerald-200', suspended:'bg-amber-50 text-amber-800 border-amber-200', pending:'bg-slate-50 text-slate-700 border-slate-200', provisioning:'bg-sky-50 text-sky-700 border-sky-200', deleting:'bg-rose-50 text-rose-700 border-rose-200', deleted:'bg-gray-100 text-gray-600 border-gray-200' };
                              const siteUrl = (currentWebSite.domain ? `https://${currentWebSite.domain}` : '');
                              return (
                                <>
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusColor[status] || statusColor.pending}`}>
                                      {status === 'active' ? <CheckCircle className="h-3.5 w-3.5"/> : <AlertCircle className="h-3.5 w-3.5"/>}
                                      {statusLabel[status] || status}
                                    </span>
                                    {siteUrl && (
                                      <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition">
                                        <Globe className="h-3.5 w-3.5"/> Открыть сайт →
                                      </a>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                                        <Wallet className="h-3 w-3"/> Оплата
                                      </div>
                                      {daysLeftRaw === null ? (
                                        <div className="text-sm font-semibold text-slate-500">—</div>
                                      ) : (
                                        <>
                                          <div className={`text-xl font-bold ${daysLeftRaw < 0 ? 'text-rose-600' : daysLeftRaw <= 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {daysLeftRaw >= 0 ? `+${daysLeftRaw} дн.` : `просрочено ${-daysLeftRaw} дн.`}
                                          </div>
                                          <div className="text-[11px] text-slate-500 font-medium">{currentWebSite.paidUntil}</div>
                                        </>
                                      )}
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                                        <ShieldCheck className="h-3 w-3"/> SSL
                                      </div>
                                      {sslDaysLeft === null ? (
                                        <div className="text-sm font-semibold text-slate-500">не выпущен</div>
                                      ) : sslDaysLeft <= 0 ? (
                                        <>
                                          <div className="text-xl font-bold text-rose-600">истёк</div>
                                          <div className="text-[11px] text-slate-500 font-medium">{(currentWebSite as any).sslExpiresAt}</div>
                                        </>
                                      ) : (
                                        <>
                                          <div className={`text-xl font-bold ${sslDaysLeft <= 14 ? 'text-amber-600' : 'text-emerald-600'}`}>+{sslDaysLeft} дн.</div>
                                          <div className="text-[11px] text-slate-500 font-medium">{(currentWebSite as any).sslExpiresAt}</div>
                                        </>
                                      )}
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                                        <HardDrive className="h-3 w-3"/> Шаблон
                                      </div>
                                      <div className="text-sm font-semibold text-slate-900">
                                        {currentWebSite.coreTemplate === 'nodejs' ? 'Node.js + Express' : currentWebSite.coreTemplate === 'wordpress' ? 'WordPress' : 'Static HTML / CSS'}
                                      </div>
                                      <div className="text-[11px] text-slate-500 font-medium">ID: {String(currentWebSite.id||'').slice(0,8)}</div>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                                        <Server className="h-3 w-3"/> Процесс
                                      </div>
                                      <div className="text-sm font-semibold text-slate-900 truncate">
                                        {currentWebSite.pm2ProcessName || (currentWebSite.coreTemplate==='nodejs' ? `wexa-site-${String(currentWebSite.id||'').slice(0,8)}` : 'Статика / nginx')}
                                      </div>
                                      <div className="text-[11px] text-slate-500 font-medium">
                                        {currentWebSite.coreTemplate==='nodejs' ? 'PM2 auto-restart' : 'Nginx serve'}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-slate-900">Быстрые действия</h4>
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 grid grid-cols-2 gap-2.5">
                            <button
                              onClick={() => restartWebSite(currentWebSite.id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-white hover:border-indigo-200 hover:text-indigo-700 hover:shadow-sm transition"
                            >
                              <RotateCcw className="h-4 w-4"/> Перезапустить
                            </button>
                            <button
                              onClick={() => triggerWebBackup(currentWebSite.id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-white hover:border-violet-200 hover:text-violet-700 hover:shadow-sm transition"
                            >
                              <FileArchive className="h-4 w-4"/> Бэкап сейчас
                            </button>
                            <button
                              onClick={() => resetSftpPasswordWebSite(currentWebSite.id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-white hover:border-amber-200 hover:text-amber-700 hover:shadow-sm transition"
                            >
                              <KeyRound className="h-4 w-4"/> Сбросить SFTP пароль
                            </button>
                            <button
                              onClick={() => setWebSettingsTab('ssh')}
                              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 hover:shadow-sm transition"
                            >
                              <KeyRound className="h-4 w-4"/> SSH/SFTP доступ →
                            </button>
                            <button
                              onClick={() => setWebSettingsTab('database')}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-white hover:border-emerald-200 hover:text-emerald-700 hover:shadow-sm transition"
                            >
                              <Database className="h-4 w-4"/> База данных
                            </button>
                            <button
                              onClick={() => setWebSettingsTab('ai')}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-white hover:border-fuchsia-200 hover:text-fuchsia-700 hover:shadow-sm transition"
                            >
                              <Sparkles className="h-4 w-4"/> AI-ассистент
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {webSettingsTab === 'files' && (
                    <div className="flex h-[520px] flex-col gap-3">
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <button
                          onClick={() => {
                            const parts = webFilesPath.split('/').filter(Boolean);
                            parts.pop();
                            loadWebSiteFiles(currentWebSite.id, parts.length ? '/' + parts.join('/') : '/');
                          }}
                          disabled={webFilesPath === '/' || webFilesLoading}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-indigo-600 disabled:opacity-40 transition"
                          title="Наверх"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <Home className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-300">/</span>
                        <div className="font-mono text-sm text-slate-700 truncate flex-1">
                          /public_html{webFilesPath === '/' ? '' : webFilesPath}
                        </div>

                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition">
                          <Upload className="h-3.5 w-3.5" />
                          Загрузить файл
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => setWebFileUploadFile(e.target.files?.[0] || null)}
                          />
                        </label>
                        {webFileUploadFile && (
                          <button
                            onClick={() => uploadWebFile(currentWebSite.id, webFilesPath, webFileUploadFile)}
                            disabled={webFilesLoading}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                          >
                            → {webFileUploadFile.name} ({(webFileUploadFile.size / 1024).toFixed(1)} KB)
                          </button>
                        )}
                        {webFilesLoading && <Loader className="h-4 w-4 animate-spin text-indigo-600" />}
                      </div>

                      <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full border-collapse text-sm">
                          <thead className="bg-slate-50/90 backdrop-blur sticky top-0 z-10">
                            <tr>
                              <th className="w-[60%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Имя</th>
                              <th className="w-[18%] px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Размер</th>
                              <th className="w-[22%] px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Действия</th>
                            </tr>
                          </thead>
                          <tbody>
                            {!webFilesLoading && webFiles.length === 0 && (
                              <tr>
                                <td colSpan={3} className="px-4 py-16 text-center text-sm text-slate-400 align-middle">
                                  <div className="flex flex-col items-center gap-2">
                                    <Folder className="h-10 w-10 text-slate-300" />
                                    {webFilesPath === '/' ? 'Загрузите файлы вашего сайта в /public_html' : 'Папка пуста'}
                                  </div>
                                </td>
                              </tr>
                            )}
                            {webFiles.map((f: any, idx: number) => (
                              <tr
                                key={`${String(f.name || 'f')}-${idx}`}
                                onDoubleClick={() => {
                                  if (f.isDir || f.isDirectory) {
                                    const np = (webFilesPath === '/' ? '' : webFilesPath) + '/' + String(f.name || '');
                                    loadWebSiteFiles(currentWebSite.id, np);
                                  }
                                }}
                                className="border-b border-slate-100 hover:bg-indigo-50/60 transition"
                                title={f.isDir || f.isDirectory ? 'Двойной клик — открыть папку' : undefined}
                              >
                                <td className="px-4 py-2.5 align-middle">
                                  <div className="flex min-w-0 items-center gap-2.5">
                                    {(f.isDir || f.isDirectory) ? (
                                      <Folder className="h-4.5 w-4.5 shrink-0 text-amber-500" />
                                    ) : (
                                      <FileText className="h-4.5 w-4.5 shrink-0 text-slate-400" />
                                    )}
                                    <span className="truncate font-medium text-slate-800" title={String(f.name || '')}>{f.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-right align-middle font-mono text-xs text-slate-500 whitespace-nowrap">
                                  {(f.isDir || f.isDirectory) ? '—' : `${(Number(f.size || 0) / 1024).toFixed(1)} KB`}
                                </td>
                                <td className="px-4 py-2.5 text-right align-middle whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1">
                                    {(f.isDir || f.isDirectory) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const np = (webFilesPath === '/' ? '' : webFilesPath) + '/' + String(f.name || '');
                                          loadWebSiteFiles(currentWebSite.id, np);
                                        }}
                                        className="rounded-md p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition"
                                        title="Открыть папку"
                                      >
                                        <ChevronRight className="h-4 w-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const full = (webFilesPath === '/' ? '' : webFilesPath) + '/' + String(f.name || '');
                                        deleteWebFile(currentWebSite.id, full);
                                      }}
                                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                      title="Удалить"
                                    >
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

                  {webSettingsTab === 'logs' && (
                    <div className="flex h-[520px] flex-col gap-3">
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          {webLogsLoading ? (
                            <><Loader className="h-4 w-4 animate-spin text-indigo-600" /> Загрузка логов...</>
                          ) : (
                            <><TerminalIcon className="h-4 w-4 text-slate-400" /> Логи сервера</>
                          )}
                        </div>
                        <button
                          onClick={() => loadWebSiteLogs(currentWebSite.id)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                        >
                          Обновить
                        </button>
                      </div>
                      <div className="grid flex-1 gap-3 md:grid-cols-1 md:grid-rows-2">
                        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2">
                            <span className="text-xs font-semibold text-slate-700">PM2 / App stdout-stderr</span>
                            <span className="text-[10px] text-slate-400">{(webLogs.pm2 || '').split('\n').length} строк</span>
                          </div>
                          <textarea
                            readOnly
                            value={webLogs.pm2 || '(логи пусты, приложение не запущено)'}
                            className="flex-1 min-h-[200px] w-full resize-none bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-emerald-200 focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2">
                            <span className="text-xs font-semibold text-slate-700">Nginx (access + error)</span>
                            <span className="text-[10px] text-slate-400">{(webLogs.nginx || '').split('\n').length} строк</span>
                          </div>
                          <textarea
                            readOnly
                            value={webLogs.nginx || '(логи Nginx пусты)'}
                            className="flex-1 min-h-[200px] w-full resize-none bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-amber-100 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {webSettingsTab === 'backups' && (
                    <div className="flex h-[520px] flex-col gap-3">
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                        <div className="text-sm text-slate-600">
                          <FileArchive className="inline mr-1.5 h-4 w-4 text-slate-400" />
                          Бэкапы создаются ежедневно в 04:05 MSK, хранятся 7 дней.
                        </div>
                        <button
                          onClick={() => triggerWebBackup(currentWebSite.id)}
                          disabled={webBackupsLoading}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Создать бэкап сейчас
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                        <table className="min-w-full divide-y divide-slate-100">
                          <thead className="bg-slate-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Дата</th>
                              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Тип</th>
                              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Размер</th>
                              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Скачать</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {!webBackupsLoading && webBackups.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-400">
                                  Бэкапы пока отсутствуют. Нажмите «Создать бэкап сейчас».
                                </td>
                              </tr>
                            )}
                            {webBackups.map((b: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50 transition">
                                <td className="px-4 py-2.5 text-sm text-slate-800 font-medium">
                                  {b.createdAt ? new Date(b.createdAt).toLocaleString('ru-RU') : b.date || '—'}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                    {b.kind === 'manual' ? 'Ручной' : 'Ежедневный'}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-xs text-slate-600">
                                  {typeof b.size === 'number' ? `${(b.size / 1024 / 1024).toFixed(2)} MB` : b.size || '—'}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {b.url || b.downloadUrl || b.fileName ? (
                                    <a
                                      href={b.url || b.downloadUrl || (b.fileName ? `/api/sites/${currentWebSite.id}/backups/download?file=${encodeURIComponent(b.fileName)}` : '#')}
                                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      Скачать
                                    </a>
                                  ) : (
                                    <button
                                      disabled
                                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-400 disabled:cursor-not-allowed"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      Скоро
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

                  {webSettingsTab === 'ssh' && (() => {
                    const s = webSftpCreds;
                    const ws = currentWebSite;
                    const id = String(ws?.id || '');
                    const shortId = id.slice(0, 8);
                    const hostPort = 3000 + Math.abs((id.charCodeAt(0) || 0) + (id.charCodeAt(7) || 0)) % 1000;
                    const fallbackSftpUser = shortId ? `wexa_site_${shortId}` : '';
                    const fallbackSshUser = shortId ? `wexa_ssh_${shortId}` : '';
                    const sshData = s?.ssh || ws?.sshUsername ? {
                      host: s?.ssh?.host || ws?.node?.ip || s?.host || '',
                      port: s?.ssh?.port || ws?.sshPort || 22,
                      username: s?.ssh?.username || ws?.sshUsername || fallbackSshUser,
                      user: s?.ssh?.user || ws?.sshUsername || fallbackSshUser,
                      password: s?.ssh?.password || ws?.sshPassword || '',
                      homeDir: s?.ssh?.homeDir || `/var/lib/wexa/sites/${id}`,
                      cli: s?.ssh?.cli || `ssh ${s?.ssh?.username || ws?.sshUsername || fallbackSshUser}@${ws?.node?.ip || s?.host || ''} -p ${s?.ssh?.port || ws?.sshPort || 22}`,
                      note: s?.ssh?.note || '',
                    } : null;
                    const sftpData = {
                      host: s?.sftp?.host || ws?.node?.ip || s?.host || '',
                      port: s?.sftp?.port || ws?.sftpPort || s?.port || 22,
                      username: s?.sftp?.username || s?.username || ws?.sftpUsername || fallbackSftpUser,
                      user: s?.sftp?.user || s?.user || ws?.sftpUsername || fallbackSftpUser,
                      password: s?.sftp?.password || s?.password || s?.passwordOnce || ws?.sftpPassword || '',
                      rootPath: s?.sftp?.rootPath || s?.rootPath || '/public_html',
                      cli: s?.sftp?.cli ||
                        `sftp -P ${s?.sftp?.port || ws?.sftpPort || s?.port || 22} ${s?.sftp?.username || s?.username || ws?.sftpUsername || fallbackSftpUser}@${s?.sftp?.host || ws?.node?.ip || s?.host || ''}`,
                      note: s?.sftp?.note || s?.note || '',
                    };
                    const sftpUrl = sftpData.host && sftpData.username
                      ? `sftp://${encodeURIComponent(sftpData.username)}@${sftpData.host}:${sftpData.port}${sftpData.rootPath || '/'}`
                      : '';
                    const sftpHasPassword = !!sftpData.password;
                    const sshHasPassword = sshData ? !!sshData.password : false;
                    return (
                      <div className="space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 via-white to-rose-50 p-4">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow">
                              <AlertTriangle className="h-5 w-5"/>
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-amber-900 text-sm">Важно! 2 разных пользователя для разных задач</h4>
                              <p className="text-xs text-amber-800 mt-0.5">
                                <strong>SFTP</strong> (файлы): пользователь <span className="font-mono bg-amber-100 px-1 rounded">wexa_site_XXXX</span> — PuTTY <strong>ЗАКРОЕТСЯ</strong> (ForceCommand internal-sftp). Только для FileZilla/WinSCP.
                              </p>
                              <p className="text-xs text-amber-800 mt-1">
                                <strong>SSH Terminal</strong> (bash / PuTTY): пользователь <span className="font-mono bg-rose-100 px-1 rounded">wexa_ssh_XXXX</span> — shell bash, HOME = корень сайта. <strong>В PuTTY вводи именно эти данные (карточка №2 справа ↓)</strong>
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => resetSftpPasswordWebSite(ws.id)}
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg hover:brightness-110 transition"
                            title="Сгенерировать/сбросить оба пароля сразу"
                          >
                            <KeyRound className="h-4 w-4"/>
                            Сгенерировать / сбросить оба пароля
                          </button>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2">
                          {/* ======== CARD 1: SFTP ONLY ======== */}
                          <div className="rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
                            <div className="flex items-center justify-between gap-2 mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                                  <KeyRound className="h-5 w-5"/>
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900">1️⃣ SFTP доступ (файлы)</h4>
                                  <p className="text-xs text-slate-500">FileZilla · WinSCP · ForkLift · VSCode Remote</p>
                                  <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[10px] font-bold">
                                    <Ban className="h-3 w-3"/>
                                    НЕ ДЛЯ PUTTY (закроется сразу)
                                  </div>
                                </div>
                              </div>
                            </div>
                            {s && s.ok !== false ? (
                              <div className="space-y-3">
                                {[
                                  { k: 'Хост / IP', v: sftpData.host, id: 'sftp-host', copyable: true },
                                  { k: 'Порт', v: String(sftpData.port), id: 'sftp-port', copyable: true },
                                  { k: 'Пользователь', v: sftpData.username, id: 'sftp-user', copyable: !!sftpData.username },
                                ].map((row) => (
                                  <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-200 px-3.5 py-2.5">
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{row.k}</div>
                                      <div className="font-mono text-sm truncate text-slate-900">{row.v || '—'}</div>
                                    </div>
                                    {row.copyable && row.v ? (
                                      <button
                                        onClick={() => copyToClipboard(row.v, row.k)}
                                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition shrink-0"
                                        title={`Скопировать ${row.k}`}
                                      >
                                        {copiedValue === row.k ? <Check className="h-4 w-4 text-emerald-600"/> : <Copy className="h-4 w-4"/>}
                                      </button>
                                    ) : null}
                                  </div>
                                ))}

                                {sftpHasPassword ? (
                                  <div className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-2 border-emerald-200 px-3.5 py-2.5">
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">Пароль SFTP (постоянный доступ)</div>
                                      <div className="font-mono text-sm tracking-[0.05em] text-slate-900 break-all">{sftpData.password}</div>
                                    </div>
                                    <button onClick={() => copyToClipboard(String(sftpData.password), 'Пароль SFTP')} className="shrink-0 rounded-lg border border-emerald-200 p-1.5 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition">
                                      {copiedValue === 'Пароль SFTP' ? <Check className="h-4 w-4"/> : <Copy className="h-4 w-4"/>}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 px-3.5 py-3 flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
                                    <div className="flex items-start gap-2 min-w-0">
                                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5"/>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-amber-800">SFTP пароль ещё не сгенерирован</div>
                                        <div className="text-[11px] text-amber-700/90">Нажми «Сгенерировать / сбросить оба пароля» вверху ↑ (создаст сразу и SFTP, и SSH пользователей).</div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => resetSftpPasswordWebSite(ws.id)}
                                      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow hover:shadow-md hover:from-amber-600 hover:to-orange-600 transition"
                                    >
                                      <KeyRound className="h-3.5 w-3.5"/> Сгенерировать
                                    </button>
                                  </div>
                                )}

                                <div className="flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-200 px-3.5 py-2.5">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Путь (Root Folder)</div>
                                    <div className="font-mono text-sm text-slate-900">{sftpData.rootPath || '/public_html'}</div>
                                  </div>
                                  <button onClick={() => copyToClipboard(sftpData.rootPath || '/public_html', 'Root Path')} className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition">
                                    {copiedValue === 'Root Path' ? <Check className="h-4 w-4 text-emerald-600"/> : <Copy className="h-4 w-4"/>}
                                  </button>
                                </div>

                                {sftpUrl && (
                                  <div className="flex items-center justify-between gap-3 rounded-xl bg-indigo-600/90 text-white px-3.5 py-2.5 mt-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[10px] uppercase tracking-wider text-indigo-100 font-bold">Ссылка для подключения (один клик)</div>
                                      <a href={sftpUrl} className="block font-mono text-xs truncate text-white hover:text-yellow-100">{sftpUrl}</a>
                                    </div>
                                    <button
                                      onClick={() => copyToClipboard(sftpUrl, 'SFTP URL')}
                                      className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30 transition shrink-0"
                                    >
                                      {copiedValue === 'SFTP URL' ? <Check className="h-4 w-4"/> : <Copy className="h-4 w-4"/>}
                                    </button>
                                  </div>
                                )}
                                <div className="rounded-xl bg-slate-950 text-indigo-100 font-mono text-[12px] p-3 overflow-x-auto mt-1">
                                  <div className="text-slate-500 mb-1"># Быстрый вход (WinSCP / CLI):</div>
                                  {sftpData.cli}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-6 text-slate-500">
                                <Loader className="h-5 w-5 animate-spin text-indigo-500"/>
                                Загрузка SFTP-данных...
                              </div>
                            )}
                          </div>

                          {/* ======== CARD 2: SSH TERMINAL (PuTTY) ======== */}
                          <div className="space-y-5">
                            <div className="rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                                    <TerminalIcon className="h-5 w-5"/>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-900">2️⃣ SSH Terminal (PuTTY / bash)</h4>
                                    <p className="text-xs text-slate-500">PuTTY · KiTTY · Termius · cmd ssh · bash</p>
                                    <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-bold">
                                      <Check className="h-3 w-3"/>
                                      ДЛЯ PUTTY — именно эти данные!
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {sshData || (s && s.ok !== false) ? (
                                <div className="space-y-2.5">
                                  {[
                                    { k: 'Хост SSH', v: sshData?.host || ws?.node?.ip || s?.host, id: 'ssh-host', copyable: true },
                                    { k: 'Порт SSH', v: String(sshData?.port || ws?.sshPort || s?.port || 22), id: 'ssh-port', copyable: true },
                                    { k: 'Пользователь SSH', v: sshData?.username || fallbackSshUser, id: 'ssh-user', copyable: !!(sshData?.username || fallbackSshUser) },
                                    { k: 'Домашняя директория (HOME)', v: sshData?.homeDir || `/var/lib/wexa/sites/${id}`, id: 'ssh-home', copyable: true },
                                  ].map((row) => (
                                    <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-200 px-3.5 py-2.5">
                                      <div className="min-w-0 flex-1">
                                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{row.k}</div>
                                        <div className="font-mono text-sm truncate">{row.v || '—'}</div>
                                      </div>
                                      {row.copyable && row.v ? (
                                        <button onClick={() => copyToClipboard(row.v, row.k)} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 shrink-0">
                                          {copiedValue === row.k ? <Check className="h-4 w-4 text-emerald-600"/> : <Copy className="h-4 w-4"/>}
                                        </button>
                                      ) : null}
                                    </div>
                                  ))}

                                  {sshHasPassword ? (
                                    <div className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-2 border-emerald-200 px-3.5 py-2.5">
                                      <div className="min-w-0 flex-1">
                                        <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">Пароль SSH (shell bash)</div>
                                        <div className="font-mono text-sm tracking-wider text-slate-900 break-all">{sshData!.password}</div>
                                      </div>
                                      <button onClick={() => copyToClipboard(String(sshData!.password), 'Пароль SSH')} className="shrink-0 rounded-lg border border-emerald-200 p-1.5 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition">
                                        {copiedValue === 'Пароль SSH' ? <Check className="h-4 w-4 text-emerald-600"/> : <Copy className="h-4 w-4"/>}
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => resetSftpPasswordWebSite(ws.id)}
                                      className="flex w-full flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 px-3.5 py-3 text-left hover:bg-emerald-100 transition"
                                    >
                                      <div className="flex items-start gap-2 min-w-0">
                                        <AlertCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5"/>
                                        <div className="min-w-0">
                                          <div className="text-xs font-bold text-emerald-800">SSH пароль ещё не сгенерирован</div>
                                          <div className="text-[11px] text-emerald-700/90">Нажми кнопку справа → создастся отдельный пользователь `{fallbackSshUser}` с shell /bin/bash, HOME = корень сайта.</div>
                                        </div>
                                      </div>
                                      <span className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700 transition">
                                        <KeyRound className="h-3 w-3"/> Сгенерировать
                                      </span>
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-6 text-slate-500">
                                  <Loader className="h-5 w-5 animate-spin text-emerald-500"/>
                                  Загрузка SSH-данных...
                                </div>
                              )}
                              <div className="mt-3 rounded-xl bg-slate-950 text-emerald-100 font-mono text-[12px] p-3 overflow-x-auto">
                                <div className="text-slate-500 mb-1"># PuTTY / Bash — вставь в терминал / команду:</div>
                                {sshData?.cli || `ssh ${fallbackSshUser}@${ws?.node?.ip || s?.host || 'HOST'} -p ${sshData?.port || 22}`}
                              </div>
                              <div className="mt-2 text-[11px] text-slate-500 leading-relaxed rounded-lg bg-white/60 border border-slate-200 px-2.5 py-2">
                                <p className="font-semibold text-slate-700">Что можно делать в SSH shell:</p>
                                <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                                  <li><code className="rounded bg-slate-100 px-1">pm2 status</code>, <code className="rounded bg-slate-100 px-1">pm2 logs</code>, <code className="rounded bg-slate-100 px-1">pm2 restart [name]</code> — sudoers NOPASSWD</li>
                                  <li><code className="rounded bg-slate-100 px-1">npm install</code>, <code className="rounded bg-slate-100 px-1">node -v</code>, <code className="rounded bg-slate-100 px-1">npm run build</code></li>
                                  <li><code className="rounded bg-slate-100 px-1">nginx -t</code>, <code className="rounded bg-slate-100 px-1">sudo systemctl reload nginx</code> — sudoers NOPASSWD</li>
                                  <li><code className="rounded bg-slate-100 px-1">ls -la ./public_html</code> — сразу в корне сайта после входа</li>
                                </ul>
                              </div>
                            </div>

                            <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
                              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500"/> Переменные окружения (env)</h4>
                              <p className="text-xs text-slate-500 mb-3">Используйте `process.env.NAME` в Node.js / EJS.</p>
                              <div className="space-y-2.5">
                                {[
                                  { k: 'PORT', v: String(hostPort), id: 'env-port' },
                                  { k: 'NODE_ENV', v: 'production', id: 'env-env' },
                                  { k: 'SITE_ID', v: id, id: 'env-siteid' },
                                  { k: 'SITE_DOMAIN', v: ws?.domain || '', id: 'env-domain' },
                                  { k: 'PUBLIC_PATH', v: `/var/lib/wexa/sites/${id}/public`, id: 'env-public' },
                                  { k: 'SITE_ROOT', v: `/var/lib/wexa/sites/${id}`, id: 'env-root' },
                                ].map((row) => (
                                  <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                    <div className="font-mono text-xs font-semibold text-slate-600">{row.k}=</div>
                                    <div className="flex items-center gap-2 flex-1 justify-end">
                                      <div className="font-mono text-xs text-slate-900 truncate">{row.v || '""'}</div>
                                      <button onClick={() => copyToClipboard(`${row.k}=${row.v || ''}`, row.k)} className="rounded p-1 text-slate-400 hover:text-indigo-600 shrink-0">
                                        {copiedValue === row.k ? <Check className="h-3.5 w-3.5 text-emerald-600"/> : <Copy className="h-3.5 w-3.5"/>}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {webSettingsTab === 'database' && (() => {
                    const ws = currentWebSite;
                    const id = String(ws?.id || '');
                    const sqlitePath = `/var/lib/wexa/sites/${id}/data/app.db`;
                    const sqliteUrl = `file:${sqlitePath}`;
                    return (
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                              <Database className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">SQLite (встроенная · по умолчанию)</h4>
                              <p className="text-xs text-slate-500">Без настроек · 0运维 · работает на любом тарифе</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {[
                              { k: 'Файл базы', v: sqlitePath, id: 'db-sqlite-path' },
                              { k: 'URL (better-sqlite3)', v: sqliteUrl, id: 'db-sqlite-url' },
                              { k: 'Журнал WAL', v: 'включён (по умолчанию)', id: 'db-wal' },
                              { k: 'Бэкапы БД', v: 'вместе с ежедневными бэкапами сайта', id: 'db-backup' },
                            ].map((row) => (
                              <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-200 px-3.5 py-2.5">
                                <div className="min-w-0 flex-1">
                                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{row.k}</div>
                                  <div className="font-mono text-sm text-slate-900 truncate">{row.v}</div>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(row.v, row.k)}
                                  className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 shrink-0"
                                >
                                  {copiedValue === row.k ? <Check className="h-4 w-4 text-emerald-600"/> : <Copy className="h-4 w-4"/>}
                                </button>
                              </div>
                            ))}
                            <div className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-600/90 text-white px-3.5 py-2.5">
                              <CheckCircle className="h-4 w-4 shrink-0"/>
                              <div className="text-xs flex-1">Уже работает. Создайте /data/ папку в корне сайта (или она будет создана при первом запросе). Откат — через ежедневные бэкапы.</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div className="rounded-2xl border-2 border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
                                <TerminalIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">Подключение (Node.js)</h4>
                                <p className="text-xs text-slate-500">better-sqlite3 · sqlite3 · knex · prisma · drizzle</p>
                              </div>
                            </div>
                            <div className="space-y-2.5">
                              <div className="rounded-xl bg-slate-950 text-emerald-200 font-mono text-[12px] p-3 overflow-x-auto leading-relaxed">
{`// ✅ package.json → npm i better-sqlite3
import Database from 'better-sqlite3';
import path from 'node:path';

const DB_PATH = process.env.DB_PATH
  || path.join(process.cwd(), 'data', 'app.db');

const db = new Database(DB_PATH, { readonly: false });
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;`}
                              </div>
                              <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-2">
                                <div className="text-xs font-semibold text-slate-700 mb-1.5">Переменные окружения для .env</div>
                                {[
                                  { k: 'DATABASE_URL', v: sqliteUrl },
                                  { k: 'DB_PATH', v: sqlitePath },
                                  { k: 'DB_ENGINE', v: 'sqlite' },
                                ].map((row) => (
                                  <div key={row.k} className="flex items-center justify-between gap-2">
                                    <code className="text-[12px] font-mono text-slate-800 bg-slate-50 border border-slate-100 rounded px-2 py-1 flex-1 truncate">{row.k}={row.v}</code>
                                    <button onClick={() => copyToClipboard(`${row.k}=${row.v}`, row.k)} className="rounded border border-slate-200 p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 shrink-0">
                                      {copiedValue === row.k ? <Check className="h-3.5 w-3.5 text-emerald-600"/> : <Copy className="h-3.5 w-3.5"/>}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
                            <h4 className="font-bold text-slate-900 mb-2">🚀 Скоро: PostgreSQL / Redis</h4>
                            <p className="text-sm text-slate-600 leading-relaxed mb-3">
                              На тарифах Премиум+ будет доступен managed Postgres 16 (отдельный кластер с PITR) + Redis 7 для кеша/сессий.
                            </p>
                            <button
                              type="button"
                              onClick={() => { showToast('info', 'ℹ️ Postgres/Redis beta — заявки в чат менеджеру, бесплатно 30 дней'); }}
                              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:from-slate-800 hover:to-slate-600 transition"
                            >
                              <MessageSquare className="h-4 w-4"/> Написать менеджеру →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {webSettingsTab === 'ai' && (() => {
                    const ws = currentWebSite;
                    const id = String(ws?.id || '');
                    const s = webSftpCreds;
                    const shortId = id.slice(0, 8);
                    const sftpUsername = s?.username || ws?.sftpUsername || (shortId ? `wexa_site_${shortId}` : '');
                    const sftpPassword = s?.password || s?.passwordOnce || '';
                    const planLabel = getWebPlanLabel(ws?.plan);
                    const domain = ws?.domain || `${id.slice(0, 8)}.wexa.su`;
                    const hostPort = 3000 + Math.abs((id.charCodeAt(0) || 0) + (id.charCodeAt(7) || 0)) % 1000;
                    const sqlitePath = `/var/lib/wexa/sites/${id}/data/app.db`;
                    const sshHost = s?.host || ws?.node?.ip || 'HOST';
                    const tech = ws?.coreTemplate === 'nodejs'
                      ? 'Node.js 20 LTS · Express · EJS (Server Side Render) · PM2 auto-restart'
                      : 'Static HTML/CSS/JS (nginx) — не требует сборки';
                    const markdownConfig = `# 🛠️ Wexa.su — AI Access to Project
## 🎯 ЗАДАЧА: Отредактируй сайт — пиши код, загружай через SFTP

---
## 📦 SFTP / SSH доступ
*   **Host / IP:** \`${sshHost}\`
*   **SFTP Port:** \`${s?.port || 22}\`
*   **SSH Port:** \`22\`
*   **User:** \`${sftpUsername}\`
*   **Password:** \`${sftpPassword || 'Запросить в панели управления wexa.su — вкладка SSH/SFTP'}\`
*   **Корень сайта (загружать СЮДА):** \`${s?.rootPath || '/public_html'}\`
*   **SFTP one-click URL:** \`sftp://${encodeURIComponent(sftpUsername)}@${sshHost}:${s?.port || 22}${s?.rootPath || '/'}\`

---
## 🌐 Ресурсы сайта
*   **Live URL:** [https://${domain}](https://${domain})
*   **Тариф:** ${planLabel} · ${ws?.priceMonthly || '?'} ₽/мес
*   **Технологии:** ${tech}
*   **Статус:** ${ws?.status || 'active'}

---
## ⚙️ process.env (переменные)
\`\`\`dotenv
PORT=${hostPort}
NODE_ENV=production
SITE_ID=${id}
SITE_DOMAIN=${domain}
SITE_ROOT="/var/lib/wexa/sites/${id}"
PUBLIC_PATH="/var/lib/wexa/sites/${id}/public"

DATABASE_URL="file:/var/lib/wexa/sites/${id}/data/app.db"
DB_PATH="${sqlitePath}"
DB_ENGINE="sqlite"
\`\`\`

---
## 💾 База данных SQLite
*   **Файл:** \`${sqlitePath}\`
*   **Журнал:** WAL mode ON
*   **Бэкапы:** ежедневно 04:05 MSK, 7 дней

---
## 📁 Структура /public_html
\`\`\`
/
├── server.js              # точка входа
├── package.json
├── public/                # статика nginx
│   ├── css/  js/  img/
├── views/                 # EJS шаблоны
├── routes/                # Express routes
├── data/
│   └── app.db             # SQLite
└── logs/
    ├── pm2.log
    └── nginx.access.log
\`\`\`

---
## 🔧 Команды (SSH bash)
\`\`\`bash
# подключение
ssh ${sftpUsername}@${sshHost} -p 22

# логи / рестарт
pm2 logs
pm2 restart all

# деплой package.json
cd /var/lib/wexa/sites/${id} && npm install --production --no-audit

# бэкап ручной
tar -czf /tmp/backup-$(date +%F).tar.gz /var/lib/wexa/sites/${id}
\`\`\`

---
## ✅ ПРАВИЛА AI
1.  ⚠️ **СНАЧАЛА — БЭКАП** сайта перед массовой правкой!
2.  Загружай файлы через SFTP. Не трогай \`node_modules/\`, \`data/app.db\`, логи.
3.  После npm install / крупных фич — **pm2 restart all**.
4.  После правок SQLite — делай \`VACUUM;\` + бэкап.
5.  **ВСЕГДА** проверяй https://${domain} на **200 OK** после деплоя!
`;
                    return (
                      <div className="grid gap-6 lg:grid-cols-5">
                        <div className="lg:col-span-3 rounded-2xl border-2 border-indigo-100 bg-white p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                            <div>
                              <h4 className="font-bold text-slate-900 flex items-center gap-2"><Sparkles className="h-5 w-5 text-indigo-500"/> 🤖 Конфиг для AI-агентов</h4>
                              <p className="text-sm text-slate-500 mt-1">Вставьте это <b>целиком</b> в чат <b>Trae</b> / <b>Cursor</b> / <b>Codex</b> — AI сам подключится по SFTP, напишет код, проверит онлайн.</p>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <button
                                onClick={() => copyToClipboard(markdownConfig, 'AI Config')}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition"
                              >
                                {copiedValue === 'AI Config' ? <Check className="h-4 w-4"/> : <Copy className="h-4 w-4"/>}
                                {copiedValue === 'AI Config' ? 'Скопировано!' : '📋 Копировать для AI'}
                              </button>
                              <button
                                onClick={() => {
                                  const blob = new Blob([markdownConfig], { type: 'text/markdown' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url; a.download = `wexa-ai-project-${domain.split('.')[0]}.md`;
                                  document.body.appendChild(a); a.click();
                                  document.body.removeChild(a); URL.revokeObjectURL(url);
                                  showToast('success', `✅ Скачан ${a.download}`);
                                }}
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                              >
                                <Download className="h-3.5 w-3.5"/> .MD файл
                              </button>
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed p-3.5 max-h-[580px] overflow-y-auto">
                            <pre className="whitespace-pre-wrap break-words">{markdownConfig}</pre>
                          </div>
                        </div>

                        <div className="lg:col-span-2 space-y-5">
                          <div className="rounded-2xl border-2 border-cyan-100 bg-gradient-to-br from-cyan-50 to-sky-50 p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-sm">
                                <Bot className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">🚀 Быстрые ссылки AI-IDE</h4>
                                <p className="text-[11px] text-slate-500">Открой IDE прямо с этим сайтом</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {[
                                { label: '🪄 Cursor.sh', desc: 'вставьте скопированный конфиг в чат', href: 'https://cursor.sh' },
                                { label: '💎 Trae IDE', desc: 'вставьте Markdown в «Agent Task»', href: 'https://trae.ai' },
                                { label: '🧠 Codex.codes', desc: 'приложите скачанный .md-файл', href: 'https://codex.codes' },
                                {
                                  label: '📟 VS Code Remote SSH',
                                  desc: 'подключение напрямую, редактируй и деплой',
                                  href: s && s.host && s.username
                                    ? `vscode://vscode-remote/ssh-remote+${s.username}@${s.host}:22/var/lib/wexa/sites/${id}`
                                    : '#',
                                },
                              ].map((x, i) => (
                                <a
                                  key={i}
                                  href={x.href}
                                  target={x.href.startsWith('http') ? '_blank' : undefined}
                                  rel="noreferrer"
                                  className="block rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 hover:bg-slate-50 hover:border-cyan-200 transition"
                                >
                                  <div className="text-sm font-bold text-slate-900">{x.label}</div>
                                  <div className="text-[11px] text-slate-500">{x.desc}</div>
                                </a>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-2xl border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 p-5">
                            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-600"/> Что может AI?
                            </h4>
                            <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                              <li>Сверстать новый landing page / раздел сайта</li>
                              <li>Поправить CSS / адаптив / баг на странице</li>
                              <li>Сделать админку (Express + EJS + SQLite CRUD)</li>
                              <li>Интегрировать Telegram-bot / оплаты СБП / Platega</li>
                              <li>Написать SEO meta, OG:image, карточку товара</li>
                              <li>Миграция Static → Node.js EJS dynamic</li>
                              <li>Формы в Telegram / email без backend-кода</li>
                            </ul>
                            <div className="mt-3 rounded-lg bg-white/80 border border-amber-200 px-3 py-2 text-[11px] text-amber-800">
                              💡 Pro tip: в конец скопированного Markdown добавь ТЗ текстом — например: <i>«сделай форму в footer, отправку в @my_bot, mobile-first, адаптив 390px»</i>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5 shrink-0">
                  <div className="mr-auto text-xs text-slate-500">
                    ID: <code className="rounded bg-white px-1.5 py-0.5 font-mono">{currentWebSite.id?.slice(0, 8)}</code>
                  </div>
                  <button
                    onClick={() => setIsWebSettingsOpen(false)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Закрыть
                  </button>
                </div>
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
                      <div className="flex flex-col gap-4">
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

        {/* Top-up Balance Modal */}
        {isTopupModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
                onClick={() => !topupLoading && setIsTopupModalOpen(false)}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
              <div className="inline-block transform overflow-hidden rounded-2xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-6 pt-6 pb-5 sm:p-7">
                  <div className="mb-6 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold leading-6 text-gray-900">Пополнить баланс</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Текущий баланс: <span className="font-semibold text-gray-900">{Number(user?.balance ?? 0).toFixed(2)} ₽</span>
                      </p>
                    </div>
                    <button
                      onClick={() => !topupLoading && setIsTopupModalOpen(false)}
                      disabled={topupLoading}
                      className="rounded-xl bg-gray-100 p-2 text-gray-500 transition hover:bg-gray-200 disabled:opacity-50"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="mb-6">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Быстрая сумма
                    </label>
                    <div className="grid gap-2 sm:grid-cols-5">
                      {QUICK_TOPUP_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setCustomAmount(String(amt))}
                          disabled={topupLoading}
                          className={`rounded-xl border-2 px-2 py-3 text-sm font-bold transition disabled:opacity-60 ${
                            customAmount === String(amt)
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/60'
                          }`}
                        >
                          {amt} ₽
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount */}
                  <div className="mb-6">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Или введите свою сумму <span className="text-rose-500">(минимум 100 ₽)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={100}
                        step={1}
                        disabled={topupLoading}
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 pr-14 text-lg font-bold text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50 disabled:opacity-70"
                        placeholder="500"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-lg font-bold text-indigo-600">
                        ₽
                      </div>
                    </div>
                    {customAmount && Number(customAmount) < 100 && (
                      <p className="mt-2 text-xs font-medium text-rose-600">
                        ⚠️ Минимальная сумма пополнения — 100 ₽
                      </p>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <div className="flex gap-3">
                      <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div className="text-left text-xs text-indigo-900/80">
                        <div className="mb-0.5 font-semibold text-indigo-900">Оплата через Platega</div>
                        <div>После оплаты средства поступят на ваш баланс в течение нескольких секунд. Вы будете перенаправлены на защищённую страницу банка/платёжной системы.</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 bg-gray-50 px-6 py-4 sm:px-7">
                  <button
                    type="button"
                    onClick={() => !topupLoading && setIsTopupModalOpen(false)}
                    disabled={topupLoading}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateTopup(customAmount || 0)}
                    disabled={topupLoading || !customAmount || Number(customAmount) < 100}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {topupLoading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Создаём платёж...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Пополнить на {Number(customAmount || 0).toFixed(0)} ₽
                      </>
                    )}
                  </button>
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
