import React, { useState, useRef, useEffect } from 'react';
import { useAuth, User } from '../../context/AuthContext';
import { useProjects, ProjectStatus, Project } from '../../context/ProjectContext';
import { usePortfolio, PortfolioItem } from '../../context/PortfolioContext';
import { useSupport, Ticket } from '../../context/SupportContext';
import { useSettings } from '../../context/SettingsContext';
import { useServices, Service } from '../../context/ServicesContext';
import { useBilling, InvoiceType } from '../../context/BillingContext';
import { UserPlus, Users, User as UserIcon, Plus, FolderGit2, Trash2, Edit2, Paperclip, MessageSquare, X, Layout, Globe, Headphones, Send, ChevronLeft, Save, Search, Smartphone, Shield, Zap, CreditCard, CheckCircle, XCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { users, registerUser, updateUser, deleteUser, user: currentUser } = useAuth();
  const { projects, addProject, updateProject, deleteProject, addComment, addAttachment, deleteAttachment } = useProjects();
  const { items: portfolioItems, addItem: addPortfolioItem, updateItem: updatePortfolioItem, deleteItem: deletePortfolioItem } = usePortfolio();
  const { getAllTickets, addMessage, closeTicket } = useSupport();
  const { contactInfo, telegramConfig, seoSettings, updateContactInfo, updateTelegramConfig, updateSeoSettings } = useSettings();
  const { services, addService, updateService, deleteService } = useServices();
  const { invoices, addInvoice, updateInvoice, deleteInvoice, getInvoicesByUserId } = useBilling();
  
  const [activeSection, setActiveSection] = useState<'users' | 'projects' | 'portfolio' | 'support' | 'settings' | 'services'>('users');

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingUser, setBillingUser] = useState<User | null>(null);

  // Billing State
  const [newInvoice, setNewInvoice] = useState({
    title: '',
    amount: '',
    type: 'one_time' as InvoiceType,
    dueDate: ''
  });
  
  // Support State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Settings State
  const [tempContactInfo, setTempContactInfo] = useState(contactInfo);
  const [tempTelegramConfig, setTempTelegramConfig] = useState(telegramConfig);
  const [tempSeoSettings, setTempSeoSettings] = useState(seoSettings);
  const [settingsMessage, setSettingsMessage] = useState('');

  // Services State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceIcon, setNewServiceIcon] = useState('Monitor');

  const iconOptions = [
    'Monitor', 'ShoppingBag', 'PenTool', 'Database', 'Search', 'Settings', 
    'Code', 'Globe', 'Smartphone', 'Shield', 'Zap', 'Layout'
  ];

  useEffect(() => {
    setTempContactInfo(contactInfo);
    setTempTelegramConfig(telegramConfig);
    setTempSeoSettings(seoSettings);
  }, [contactInfo, telegramConfig, seoSettings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateContactInfo(tempContactInfo);
    updateTelegramConfig(tempTelegramConfig);
    updateSeoSettings(tempSeoSettings);
    setSettingsMessage('Настройки успешно сохранены');
    setTimeout(() => setSettingsMessage(''), 3000);
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      updateService(editingService.id, {
        title: newServiceTitle,
        description: newServiceDescription,
        price: newServicePrice,
        iconName: newServiceIcon
      });
    } else {
      addService({
        title: newServiceTitle,
        description: newServiceDescription,
        price: newServicePrice,
        iconName: newServiceIcon
      });
    }
    setIsServiceModalOpen(false);
    setEditingService(null);
    setNewServiceTitle('');
    setNewServiceDescription('');
    setNewServicePrice('');
    setNewServiceIcon('Monitor');
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (billingUser && newInvoice.title && newInvoice.amount && newInvoice.dueDate) {
      addInvoice({
        userId: billingUser.id,
        title: newInvoice.title,
        amount: parseFloat(newInvoice.amount),
        type: newInvoice.type,
        status: 'pending',
        dueDate: newInvoice.dueDate,
        description: `Счет для пользователя ${billingUser.name}`
      });
      setNewInvoice({ title: '', amount: '', type: 'one_time', dueDate: '' });
    }
  };

  const openBilling = (user: User) => {
    setBillingUser(user);
    setIsBillingModalOpen(true);
  };

  const openEditServiceModal = (service: Service) => {
    setEditingService(service);
    setNewServiceTitle(service.title);
    setNewServiceDescription(service.description);
    setNewServicePrice(service.price);
    setNewServiceIcon(service.iconName);
    setIsServiceModalOpen(true);
  };
  
  const allTickets = getAllTickets();

  useEffect(() => {
    if (selectedTicket) {
      const updatedTicket = allTickets.find(t => t.id === selectedTicket.id);
      if (updatedTicket) setSelectedTicket(updatedTicket);
    }
  }, [allTickets, selectedTicket?.id]);

  useEffect(() => {
    if (selectedTicket) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  const handleSendSupportMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !supportMessage.trim()) return;
    
    addMessage(selectedTicket.id, supportMessage);
    setSupportMessage('');
  };
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<PortfolioItem | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'attachments' | 'comments'>('info');
  
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'user' | 'project' | 'portfolio';
    id: string | null;
  }>({ isOpen: false, type: 'user', id: null });

  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [newProject, setNewProject] = useState({
    clientId: '',
    name: '',
    status: 'pending' as ProjectStatus,
    progress: 0,
    deadline: '',
    cost: '',
    description: ''
  });

  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: '',
    category: '',
    image: '',
    description: '',
    projectUrl: ''
  });

  // State for new attachment/comment
  const [newAttachment, setNewAttachment] = useState({ name: '', url: '' });
  const [newComment, setNewComment] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
        await updateUser(editingUser.id, { name: newUser.name, email: newUser.email });
    } else {
        await registerUser({ ...newUser, role: 'client' });
    }
    setNewUser({ name: '', email: '', password: '' });
    setEditingUser(null);
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    setDeleteConfirmation({ isOpen: true, type: 'user', id });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.type === 'user' && deleteConfirmation.id) {
        await deleteUser(deleteConfirmation.id);
    } else if (deleteConfirmation.type === 'project' && deleteConfirmation.id) {
        deleteProject(deleteConfirmation.id);
    } else if (deleteConfirmation.type === 'portfolio' && deleteConfirmation.id) {
        deletePortfolioItem(deleteConfirmation.id);
    }
    setDeleteConfirmation({ isOpen: false, type: 'user', id: null });
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({ name: user.name, email: user.email, password: '' });
    setIsUserModalOpen(true);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
        updateProject(editingProject.id, newProject);
    } else {
        addProject(newProject);
    }
    resetProjectForm();
  };

  const resetProjectForm = () => {
    setNewProject({
      clientId: '',
      name: '',
      status: 'pending',
      progress: 0,
      deadline: '',
      cost: '',
      description: ''
    });
    setEditingProject(null);
    setIsProjectModalOpen(false);
    setActiveTab('info');
  };

  const openEditProject = (project: Project) => {
    setEditingProject(project);
    setNewProject({
        clientId: project.clientId,
        name: project.name,
        status: project.status,
        progress: project.progress,
        deadline: project.deadline,
        cost: project.cost,
        description: project.description || ''
    });
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = (id: string) => {
    setDeleteConfirmation({ isOpen: true, type: 'project', id });
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject && newAttachment.name && newAttachment.url) {
        addAttachment(editingProject.id, {
            name: newAttachment.name,
            url: newAttachment.url,
            type: 'link'
        });
        setNewAttachment({ name: '', url: '' });
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject && newComment && currentUser) {
        addComment(editingProject.id, {
            authorId: currentUser.id,
            authorName: currentUser.name,
            text: newComment
        });
        setNewComment('');
    }
  };

  const handleCreatePortfolioItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPortfolioItem) {
        updatePortfolioItem(editingPortfolioItem.id, newPortfolioItem);
    } else {
        addPortfolioItem(newPortfolioItem);
    }
    resetPortfolioForm();
  };

  const resetPortfolioForm = () => {
    setNewPortfolioItem({
        title: '',
        category: '',
        image: '',
        description: '',
        projectUrl: ''
    });
    setEditingPortfolioItem(null);
    setIsPortfolioModalOpen(false);
  };

  const openEditPortfolioItem = (item: PortfolioItem) => {
    setEditingPortfolioItem(item);
    setNewPortfolioItem({
        title: item.title,
        category: item.category,
        image: item.image,
        description: item.description,
        projectUrl: item.projectUrl || ''
    });
    setIsPortfolioModalOpen(true);
  };

  const handleDeletePortfolioItem = (id: string) => {
    setDeleteConfirmation({ isOpen: true, type: 'portfolio', id });
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Неизвестный';

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Админ-панель</h1>
            <div className="flex gap-4 mt-4 border-b border-zinc-800">
                <button
                    className={`pb-2 text-sm font-medium transition-colors ${activeSection === 'users' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-400 hover:text-white'}`}
                    onClick={() => setActiveSection('users')}
                >
                    Пользователи
                </button>
                <button
                    className={`pb-2 text-sm font-medium transition-colors ${activeSection === 'projects' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-400 hover:text-white'}`}
                    onClick={() => setActiveSection('projects')}
                >
                    Проекты
                </button>
                <button
                    className={`pb-2 text-sm font-medium transition-colors ${activeSection === 'portfolio' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-400 hover:text-white'}`}
                    onClick={() => setActiveSection('portfolio')}
                >
                    Портфолио
                </button>
                <button
                    className={`pb-2 text-sm font-medium transition-colors ${activeSection === 'support' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-400 hover:text-white'}`}
                    onClick={() => setActiveSection('support')}
                >
                    Техподдержка
                </button>
                <button
                    className={`pb-2 text-sm font-medium transition-colors ${activeSection === 'services' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-400 hover:text-white'}`}
                    onClick={() => setActiveSection('services')}
                >
                    Услуги
                </button>
                <button
                    className={`pb-2 text-sm font-medium transition-colors ${activeSection === 'settings' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-zinc-400 hover:text-white'}`}
                    onClick={() => setActiveSection('settings')}
                >
                    Настройки
                </button>
            </div>
          </div>
          <div className="flex gap-3">
            {activeSection === 'projects' && (
                <button
                onClick={() => setIsProjectModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700"
                >
                <Plus className="h-5 w-5 mr-2" />
                Создать проект
                </button>
            )}
            {activeSection === 'users' && (
                <button
                onClick={() => setIsUserModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                <UserPlus className="h-5 w-5 mr-2" />
                Добавить клиента
                </button>
            )}
            {activeSection === 'portfolio' && (
                <button
                onClick={() => setIsPortfolioModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                <Globe className="h-5 w-5 mr-2" />
                Добавить работу
                </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Всего пользователей</p>
                <p className="text-3xl font-bold text-white mt-1">{users.length}</p>
              </div>
              <div className="bg-indigo-500/10 p-3 rounded-lg">
                <Users className="h-6 w-6 text-indigo-400" />
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Активных проектов</p>
                <p className="text-3xl font-bold text-white mt-1">{projects.length}</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <FolderGit2 className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Работ в портфолио</p>
                <p className="text-3xl font-bold text-white mt-1">{portfolioItems.length}</p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <Layout className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Тикеты поддержки</p>
                <p className="text-3xl font-bold text-white mt-1">{allTickets.length}</p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-lg">
                <Headphones className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {activeSection === 'users' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h3 className="text-lg font-medium text-white">Список пользователей</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Имя</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Роль</th>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 text-white font-medium flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-indigo-400">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      {u.name} {currentUser?.id === u.id && <span className="text-zinc-500 text-xs">(Вы)</span>}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-400'
                      }`}>
                        {u.role === 'admin' ? 'Администратор' : 'Клиент'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{u.id}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openBilling(u)}
                          className="p-1 text-zinc-400 hover:text-green-400 transition-colors"
                          title="Счета и оплата"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => openEditUser(u)}
                          className="p-1 text-zinc-400 hover:text-white transition-colors"
                          title="Редактировать"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Projects Table */}
        {activeSection === 'projects' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h3 className="text-lg font-medium text-white">Все проекты</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Проект</th>
                  <th className="px-6 py-3">Клиент</th>
                  <th className="px-6 py-3">Статус</th>
                  <th className="px-6 py-3">Прогресс</th>
                  <th className="px-6 py-3">Стоимость</th>
                  <th className="px-6 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-zinc-300">{getUserName(p.clientId)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'completed' ? 'bg-green-500/10 text-green-400' : 
                        p.status === 'in_progress' ? 'bg-indigo-500/10 text-indigo-400' : 
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {p.status === 'completed' ? 'Завершен' : p.status === 'in_progress' ? 'В работе' : 'Ожидание'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">{p.progress}%</td>
                    <td className="px-6 py-4 text-zinc-300">{p.cost}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditProject(p)}
                          className="p-1 text-zinc-400 hover:text-white transition-colors"
                          title="Редактировать"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProject(p.id)}
                          className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      Проектов пока нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Portfolio Table */}
        {activeSection === 'portfolio' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h3 className="text-lg font-medium text-white">Портфолио</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Превью</th>
                  <th className="px-6 py-3">Название</th>
                  <th className="px-6 py-3">Категория</th>
                  <th className="px-6 py-3">Описание</th>
                  <th className="px-6 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {portfolioItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="w-16 h-10 rounded overflow-hidden bg-zinc-800">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{item.title}</td>
                    <td className="px-6 py-4 text-zinc-300">{item.category}</td>
                    <td className="px-6 py-4 text-zinc-500 max-w-xs truncate">{item.description}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditPortfolioItem(item)}
                          className="p-1 text-zinc-400 hover:text-white transition-colors"
                          title="Редактировать"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePortfolioItem(item.id)}
                          className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {portfolioItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      Работ пока нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Support Section */}
        {activeSection === 'support' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden h-[600px] flex flex-col">
          {!selectedTicket ? (
            <>
              <div className="px-6 py-4 border-b border-zinc-800">
                <h3 className="text-lg font-medium text-white">Запросы в техподдержку</h3>
              </div>
              <div className="overflow-auto flex-1">
                {allTickets.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">
                    Нет активных запросов
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs sticky top-0">
                      <tr>
                        <th className="px-6 py-3">Тема</th>
                        <th className="px-6 py-3">Пользователь</th>
                        <th className="px-6 py-3">Статус</th>
                        <th className="px-6 py-3">Последнее сообщение</th>
                        <th className="px-6 py-3 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {allTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                          <td className="px-6 py-4 text-white font-medium">{ticket.subject}</td>
                          <td className="px-6 py-4 text-zinc-300">{ticket.userName}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ticket.status === 'open' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-400'
                            }`}>
                              {ticket.status === 'open' ? 'Открыт' : 'Закрыт'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-zinc-400 text-sm">
                            {new Date(ticket.lastMessageAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicket(ticket);
                              }}
                              className="text-indigo-400 hover:text-indigo-300"
                            >
                              Открыть
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-zinc-400" />
                  </button>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedTicket.subject}</h3>
                    <p className="text-sm text-zinc-400">Пользователь: {selectedTicket.userName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   {selectedTicket.status === 'open' ? (
                      <button 
                        onClick={() => {
                            closeTicket(selectedTicket.id);
                            setSelectedTicket(prev => prev ? {...prev, status: 'closed'} : null);
                        }}
                        className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
                      >
                        Закрыть тикет
                      </button>
                   ) : (
                       <span className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-lg text-sm">Тикет закрыт</span>
                   )}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-900">
                {selectedTicket.messages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      msg.isAdmin
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-zinc-800 text-zinc-200'
                    }`}>
                      <p className="text-xs text-indigo-300 mb-1 font-bold">{msg.senderName} {msg.isAdmin && '(Вы)'}</p>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-zinc-600 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendSupportMessage} className="p-4 border-t border-zinc-800 bg-zinc-950">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Напишите ответ..."
                    className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    disabled={selectedTicket.status === 'closed'}
                  />
                  <button 
                    type="submit"
                    disabled={!supportMessage.trim() || selectedTicket.status === 'closed'}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        )}

        {/* Services Section */}
        {activeSection === 'services' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Управление услугами</h3>
              <button
                onClick={() => {
                  setEditingService(null);
                  setNewServiceTitle('');
                  setNewServiceDescription('');
                  setNewServicePrice('');
                  setNewServiceIcon('Monitor');
                  setIsServiceModalOpen(true);
                }}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить услугу
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-950/50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Иконка</th>
                    <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Название</th>
                    <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Описание</th>
                    <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Цена</th>
                    <th className="px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="bg-zinc-800 p-2 rounded-lg inline-block">
                          {/* Simplified icon rendering for admin */}
                          <span className="text-indigo-400 font-bold">{service.iconName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{service.title}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400 max-w-xs truncate" title={service.description}>
                        {service.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">{service.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => openEditServiceModal(service)}
                            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deleteService(service.id)}
                            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {services.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                        Список услуг пуст
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Настройки сайта</h3>
              {settingsMessage && (
                <span className="text-green-400 text-sm font-medium animate-fade-in">
                  {settingsMessage}
                </span>
              )}
            </div>
            
            <form onSubmit={handleSaveSettings} className="p-6 space-y-8">
              {/* Contact Information */}
              <div>
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-400" />
                  Контактная информация
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-zinc-400">Email</label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={tempContactInfo.showEmail}
                          onChange={(e) => setTempContactInfo({...tempContactInfo, showEmail: e.target.checked})}
                          className="mr-2 rounded border-zinc-800 bg-black text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-zinc-500">Показывать</span>
                      </div>
                    </div>
                    <input
                      type="email"
                      value={tempContactInfo.email}
                      onChange={(e) => setTempContactInfo({...tempContactInfo, email: e.target.value})}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-zinc-400">Телефон</label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={tempContactInfo.showPhone}
                          onChange={(e) => setTempContactInfo({...tempContactInfo, showPhone: e.target.checked})}
                          className="mr-2 rounded border-zinc-800 bg-black text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-zinc-500">Показывать</span>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={tempContactInfo.phone}
                      onChange={(e) => setTempContactInfo({...tempContactInfo, phone: e.target.value})}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-zinc-400">Адрес</label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={tempContactInfo.showAddress}
                          onChange={(e) => setTempContactInfo({...tempContactInfo, showAddress: e.target.checked})}
                          className="mr-2 rounded border-zinc-800 bg-black text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-zinc-500">Показывать</span>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={tempContactInfo.address}
                      onChange={(e) => setTempContactInfo({...tempContactInfo, address: e.target.value})}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-8">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Send className="h-5 w-5 text-indigo-400" />
                  Telegram Бот (для заявок)
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="tgEnabled"
                      checked={tempTelegramConfig.isEnabled}
                      onChange={(e) => setTempTelegramConfig({...tempTelegramConfig, isEnabled: e.target.checked})}
                      className="rounded border-zinc-800 bg-black text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="tgEnabled" className="text-zinc-300">Включить отправку заявок в Telegram</label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Bot Token</label>
                      <input
                        type="text"
                        value={tempTelegramConfig.botToken}
                        onChange={(e) => setTempTelegramConfig({...tempTelegramConfig, botToken: e.target.value})}
                        className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                        placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                      />
                      <p className="text-xs text-zinc-500 mt-1">Токен бота от @BotFather</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Chat ID</label>
                      <input
                        type="text"
                        value={tempTelegramConfig.chatId}
                        onChange={(e) => setTempTelegramConfig({...tempTelegramConfig, chatId: e.target.value})}
                        className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                        placeholder="-100123456789"
                      />
                      <p className="text-xs text-zinc-500 mt-1">ID чата или пользователя куда отправлять заявки</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-8">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Search className="h-5 w-5 text-indigo-400" />
                  SEO Настройки
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Title (Заголовок страницы)</label>
                    <input
                      type="text"
                      value={tempSeoSettings.title}
                      onChange={(e) => setTempSeoSettings({...tempSeoSettings, title: e.target.value})}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      placeholder="WEXA - Разработка сайтов"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Description (Описание)</label>
                    <textarea
                      rows={3}
                      value={tempSeoSettings.description}
                      onChange={(e) => setTempSeoSettings({...tempSeoSettings, description: e.target.value})}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Профессиональная разработка веб-сайтов и приложений..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Keywords (Ключевые слова)</label>
                    <input
                      type="text"
                      value={tempSeoSettings.keywords}
                      onChange={(e) => setTempSeoSettings({...tempSeoSettings, keywords: e.target.value})}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      placeholder="разработка сайтов, веб-дизайн, react, typescript"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Разделяйте ключевые слова запятыми</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Сохранить настройки
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingService ? 'Редактировать услугу' : 'Добавить услугу'}
              </h3>
              <button 
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>
            
            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Иконка</label>
                <select
                  value={newServiceIcon}
                  onChange={(e) => setNewServiceIcon(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  {iconOptions.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Название услуги</label>
                <input
                  type="text"
                  required
                  value={newServiceTitle}
                  onChange={(e) => setNewServiceTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Например, Корпоративный сайт"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Стоимость</label>
                <input
                  type="text"
                  required
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Например, от 50 000 ₽"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Описание</label>
                <textarea
                  required
                  rows={4}
                  value={newServiceDescription}
                  onChange={(e) => setNewServiceDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Краткое описание услуги..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingService ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Billing Modal */}
      {isBillingModalOpen && billingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-indigo-400" />
                  Управление счетами
                </h3>
                <p className="text-zinc-400 text-sm">Пользователь: {billingUser.name} ({billingUser.email})</p>
              </div>
              <button 
                onClick={() => setIsBillingModalOpen(false)}
                className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Create Invoice Form */}
              <div className="w-full md:w-1/3 border-r border-zinc-800 p-6 bg-zinc-900 overflow-y-auto">
                <h4 className="text-lg font-medium text-white mb-4">Выставить счет</h4>
                <form onSubmit={handleCreateInvoice} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Назначение платежа</label>
                    <input
                      type="text"
                      required
                      value={newInvoice.title}
                      onChange={(e) => setNewInvoice({ ...newInvoice, title: e.target.value })}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Например: Разработка сайта"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Сумма (₽)</label>
                    <input
                      type="number"
                      required
                      value={newInvoice.amount}
                      onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Тип платежа</label>
                    <select
                      value={newInvoice.type}
                      onChange={(e) => setNewInvoice({ ...newInvoice, type: e.target.value as InvoiceType })}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="one_time">Единоразовый</option>
                      <option value="monthly">Ежемесячный</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Оплатить до</label>
                    <input
                      type="date"
                      required
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mt-2"
                  >
                    Выставить счет
                  </button>
                </form>
              </div>

              {/* Invoices List */}
              <div className="w-full md:w-2/3 bg-black p-6 overflow-y-auto">
                <h4 className="text-lg font-medium text-white mb-4">История счетов</h4>
                <div className="space-y-3">
                  {getInvoicesByUserId(billingUser.id).length === 0 ? (
                    <p className="text-zinc-500 text-center py-8">Счетов пока нет</p>
                  ) : (
                    getInvoicesByUserId(billingUser.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(invoice => (
                      <div key={invoice.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-white font-medium">{invoice.title}</h5>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                invoice.type === 'monthly' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                              }`}>
                                {invoice.type === 'monthly' ? 'Ежемесячно' : 'Разово'}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-400 mt-1">
                              Выставлен: {new Date(invoice.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-zinc-400">
                              Оплатить до: {new Date(invoice.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-white">{invoice.amount.toLocaleString()} ₽</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                              invoice.status === 'paid' ? 'bg-green-500/10 text-green-400' : 
                              invoice.status === 'cancelled' ? 'bg-red-500/10 text-red-400' : 
                              'bg-yellow-500/10 text-yellow-400'
                            }`}>
                              {invoice.status === 'paid' ? 'Оплачен' : invoice.status === 'cancelled' ? 'Отменен' : 'Ожидает оплаты'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-zinc-800">
                          {invoice.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => updateInvoice(invoice.id, { status: 'paid' })}
                                className="flex items-center px-3 py-1.5 bg-green-600/10 text-green-400 hover:bg-green-600/20 rounded-lg text-sm transition-colors"
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                Оплачен
                              </button>
                              <button 
                                onClick={() => updateInvoice(invoice.id, { status: 'cancelled' })}
                                className="flex items-center px-3 py-1.5 bg-red-600/10 text-red-400 hover:bg-red-600/20 rounded-lg text-sm transition-colors"
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                Отменить
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => deleteInvoice(invoice.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                            title="Удалить запись"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding/editing user */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">
                {editingUser ? 'Редактировать клиента' : 'Добавить нового клиента'}
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Имя</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              {!editingUser && (
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Пароль</label>
                    <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setIsUserModalOpen(false); setEditingUser(null); }}
                  className="px-4 py-2 text-zinc-300 hover:text-white transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingUser ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for adding/editing project */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
                {editingProject ? 'Редактировать проект' : 'Создать проект'}
            </h3>

            {editingProject && (
                <div className="flex border-b border-zinc-800 mb-6">
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}
                        onClick={() => setActiveTab('info')}
                    >
                        Информация
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'attachments' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}
                        onClick={() => setActiveTab('attachments')}
                    >
                        Файлы
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'comments' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}
                        onClick={() => setActiveTab('comments')}
                    >
                        Комментарии
                    </button>
                </div>
            )}

            {activeTab === 'info' && (
                <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Название проекта</label>
                    <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Клиент</label>
                    <select
                    required
                    value={newProject.clientId}
                    onChange={(e) => setNewProject({ ...newProject, clientId: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                    <option value="">Выберите клиента</option>
                    {users.filter(u => u.role === 'client').map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Стоимость</label>
                    <input
                        type="text"
                        required
                        placeholder="50 000 ₽"
                        value={newProject.cost}
                        onChange={(e) => setNewProject({ ...newProject, cost: e.target.value })}
                        className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Дедлайн</label>
                    <input
                        type="date"
                        required
                        value={newProject.deadline}
                        onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                        className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Статус</label>
                    <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({ ...newProject, status: e.target.value as ProjectStatus })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                    <option value="pending">Ожидание</option>
                    <option value="in_progress">В работе</option>
                    <option value="completed">Завершен</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Описание</label>
                    <textarea
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none h-24 resize-none"
                    />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button
                    type="button"
                    onClick={resetProjectForm}
                    className="px-4 py-2 text-zinc-300 hover:text-white transition-colors"
                    >
                    Отмена
                    </button>
                    <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                    {editingProject ? 'Сохранить' : 'Создать'}
                    </button>
                </div>
                </form>
            )}

            {activeTab === 'attachments' && editingProject && (
                <div className="space-y-6">
                    <form onSubmit={handleAddAttachment} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Название файла"
                            value={newAttachment.name}
                            onChange={(e) => setNewAttachment({ ...newAttachment, name: e.target.value })}
                            className="flex-1 px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                        <input
                            type="text"
                            placeholder="Ссылка (URL)"
                            value={newAttachment.url}
                            onChange={(e) => setNewAttachment({ ...newAttachment, url: e.target.value })}
                            className="flex-1 px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!newAttachment.name || !newAttachment.url}
                            className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </form>

                    <div className="space-y-3">
                        {editingProject.attachments?.length === 0 && (
                            <p className="text-zinc-500 text-center py-4">Нет прикрепленных файлов</p>
                        )}
                        {editingProject.attachments?.map((attachment) => (
                            <div key={attachment.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <Paperclip className="h-4 w-4 text-zinc-400" />
                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                                        {attachment.name}
                                    </a>
                                </div>
                                <button
                                    onClick={() => deleteAttachment(editingProject.id, attachment.id)}
                                    className="text-zinc-500 hover:text-red-400"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'comments' && editingProject && (
                <div className="space-y-6">
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                        {editingProject.comments?.length === 0 && (
                            <p className="text-zinc-500 text-center py-4">Нет комментариев</p>
                        )}
                        {editingProject.comments?.map((comment) => (
                            <div key={comment.id} className={`p-3 rounded-lg ${comment.authorId === currentUser?.id ? 'bg-indigo-900/20 ml-8' : 'bg-zinc-800/50 mr-8'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-zinc-400">{comment.authorName}</span>
                                    <span className="text-xs text-zinc-600">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-white text-sm">{comment.text}</p>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleAddComment} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Напишите комментарий..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1 px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!newComment}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            <MessageSquare className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for adding/editing portfolio item */}
      {isPortfolioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
                {editingPortfolioItem ? 'Редактировать работу' : 'Добавить работу'}
            </h3>
            <form onSubmit={handleCreatePortfolioItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Название</label>
                  <input
                    type="text"
                    required
                    value={newPortfolioItem.title}
                    onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, title: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Категория</label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Интернет-магазин, Лендинг..."
                    value={newPortfolioItem.category}
                    onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, category: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Изображение (URL)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={newPortfolioItem.image}
                    onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, image: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Ссылка на проект (необязательно)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newPortfolioItem.projectUrl}
                    onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, projectUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Описание</label>
                  <textarea
                    required
                    value={newPortfolioItem.description}
                    onChange={(e) => setNewPortfolioItem({ ...newPortfolioItem, description: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none h-24 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={resetPortfolioForm}
                      className="px-4 py-2 text-zinc-300 hover:text-white transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      {editingPortfolioItem ? 'Сохранить' : 'Добавить'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold text-white mb-2">Подтверждение удаления</h3>
            <p className="text-zinc-400 mb-6">
              Вы уверены, что хотите удалить {deleteConfirmation.type === 'user' ? 'этого пользователя' : 'этот проект'}? 
              Это действие нельзя отменить.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
                className="px-4 py-2 text-zinc-300 hover:text-white transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
