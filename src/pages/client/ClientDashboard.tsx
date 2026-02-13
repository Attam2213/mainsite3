import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjects, Project } from '../../context/ProjectContext';
import { useSupport, Ticket } from '../../context/SupportContext';
import { useBilling } from '../../context/BillingContext';
import { FolderGit2, Clock, CheckCircle, FileText, Paperclip, MessageSquare, Send, Plus, X, ChevronLeft, CreditCard } from 'lucide-react';

const ClientDashboard = () => {
  const { user } = useAuth();
  const { getProjectsByClientId, addComment } = useProjects();
  const { getTicketsByUserId, createTicket, addMessage } = useSupport();
  const { getInvoicesByUserId } = useBilling();
  
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [commentText, setCommentText] = useState<{ [projectId: string]: string }>({});
  const [activeTab, setActiveTab] = useState<'projects' | 'billing'>('projects');
  
  // Support Modal State
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportView, setSupportView] = useState<'list' | 'create' | 'chat'>('list');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const myTickets = user ? getTicketsByUserId(user.id) : [];

  useEffect(() => {
    if (selectedTicket && supportView === 'chat') {
        // Refresh selected ticket from myTickets to get new messages
        const updatedTicket = myTickets.find(t => t.id === selectedTicket.id);
        if (updatedTicket) setSelectedTicket(updatedTicket);
    }
  }, [myTickets, selectedTicket?.id, supportView]);

  useEffect(() => {
    if (supportView === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages, supportView]);

  useEffect(() => {
    if (user?.id) {
      setUserProjects(getProjectsByClientId(user.id));
    }
  }, [user, getProjectsByClientId, userProjects]); // Add userProjects to dependency to refresh on updates

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) return;
    
    createTicket(newTicketSubject, newTicketMessage);
    setNewTicketSubject('');
    setNewTicketMessage('');
    setSupportView('list');
  };

  const handleSendSupportMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !supportMessage.trim()) return;
    
    addMessage(selectedTicket.id, supportMessage);
    setSupportMessage('');
  };

  const handleSendComment = (projectId: string) => {
    if (!user || !commentText[projectId]?.trim()) return;

    addComment(projectId, {
      authorId: user.id,
      authorName: user.name,
      text: commentText[projectId]
    });

    setCommentText(prev => ({ ...prev, [projectId]: '' }));
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Завершен';
      case 'in_progress': return 'В работе';
      case 'pending': return 'Ожидает';
      case 'on_hold': return 'На паузе';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-400';
      case 'in_progress': return 'bg-indigo-500/10 text-indigo-400';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400';
      case 'on_hold': return 'bg-red-500/10 text-red-400';
      default: return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Личный кабинет</h1>
          <p className="text-zinc-400 mt-1">Добро пожаловать, {user?.name}!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex space-x-4 border-b border-zinc-800 pb-4 mb-4">
              <button
                onClick={() => setActiveTab('projects')}
                className={`text-lg font-bold pb-2 -mb-4 border-b-2 transition-colors ${
                  activeTab === 'projects' ? 'text-white border-indigo-500' : 'text-zinc-400 border-transparent hover:text-white'
                }`}
              >
                Мои проекты
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`text-lg font-bold pb-2 -mb-4 border-b-2 transition-colors ${
                  activeTab === 'billing' ? 'text-white border-indigo-500' : 'text-zinc-400 border-transparent hover:text-white'
                }`}
              >
                Счета и оплата
              </button>
            </div>
            
            {activeTab === 'projects' ? (
              userProjects.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                <FolderGit2 className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Нет активных проектов</h3>
                <p className="text-zinc-400">В данный момент у вас нет активных проектов. Свяжитесь с менеджером для начала работы.</p>
              </div>
            ) : (
              userProjects.map((project) => (
                <div key={project.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{project.name}</h3>
                      <p className="text-sm text-zinc-400 mt-1">Дедлайн: {project.deadline}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">Прогресс</span>
                      <span className="text-white">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          project.status === 'completed' ? 'bg-green-500' : 'bg-indigo-600'
                        }`} 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-zinc-400 text-sm mb-4 border-t border-zinc-800 pt-4">
                      {project.description}
                    </p>
                  )}

                  {/* Attachments Section */}
                  {(project.attachments && project.attachments.length > 0) && (
                    <div className="mb-4 border-t border-zinc-800 pt-4">
                      <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Файлы проекта
                      </h4>
                      <div className="space-y-2">
                        {project.attachments.map(att => (
                          <a 
                            key={att.id}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-indigo-400 hover:text-indigo-300 hover:underline pl-6"
                          >
                            {att.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comments Section */}
                  <div className="border-t border-zinc-800 pt-4">
                    <h4 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Комментарии
                    </h4>
                    
                    <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                        {(!project.comments || project.comments.length === 0) && (
                            <p className="text-zinc-500 text-xs pl-6">Нет комментариев</p>
                        )}
                        {project.comments?.map(comment => (
                            <div key={comment.id} className={`flex flex-col ${comment.authorId === user?.id ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[80%] rounded-lg p-3 ${comment.authorId === user?.id ? 'bg-indigo-900/20 text-right' : 'bg-zinc-800/50'}`}>
                                    <p className="text-xs text-zinc-400 mb-1">{comment.authorName}</p>
                                    <p className="text-sm text-white">{comment.text}</p>
                                </div>
                                <span className="text-[10px] text-zinc-600 mt-1">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Написать сообщение..."
                            value={commentText[project.id] || ''}
                            onChange={(e) => setCommentText(prev => ({ ...prev, [project.id]: e.target.value }))}
                            className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleSendComment(project.id)}
                        />
                        <button
                            onClick={() => handleSendComment(project.id)}
                            disabled={!commentText[project.id]?.trim()}
                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800 mt-4">
                    <div className="flex items-center text-zinc-400 text-sm">
                      <FileText className="h-4 w-4 mr-2" />
                      ID: {project.id.slice(0, 8)}
                    </div>
                    <span className="text-white font-medium">{project.cost}</span>
                  </div>
                </div>
              ))
            )
            ) : (
              <div className="space-y-4">
                {user && getInvoicesByUserId(user.id).length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                    <CreditCard className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Нет выставленных счетов</h3>
                    <p className="text-zinc-400">В данный момент у вас нет счетов к оплате.</p>
                  </div>
                ) : (
                  user && getInvoicesByUserId(user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(invoice => (
                    <div key={invoice.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-white">{invoice.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              invoice.type === 'monthly' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                            }`}>
                              {invoice.type === 'monthly' ? 'Ежемесячно' : 'Разово'}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400">
                            Выставлен: {new Date(invoice.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-zinc-400">
                            Оплатить до: <span className="text-white">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-2xl font-bold text-white">{invoice.amount.toLocaleString()} ₽</p>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              invoice.status === 'paid' ? 'bg-green-500/10 text-green-400' : 
                              invoice.status === 'cancelled' ? 'bg-red-500/10 text-red-400' : 
                              'bg-yellow-500/10 text-yellow-400'
                            }`}>
                              {invoice.status === 'paid' ? 'Оплачен' : invoice.status === 'cancelled' ? 'Отменен' : 'Ожидает оплаты'}
                            </span>
                            
                            {invoice.status === 'pending' && (
                              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                                Оплатить
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Quick Stats */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Статус аккаунта</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Тариф</span>
                  <span className="text-white font-medium">VIP Клиент</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Менеджер</span>
                  <span className="text-white font-medium">Александр</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Email</span>
                  <span className="text-white font-medium text-sm">{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Нужна помощь?</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Если у вас возникли вопросы по проекту, напишите нам в поддержку.
              </p>
              <button 
                onClick={() => setIsSupportModalOpen(true)}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Написать в поддержку
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full h-[600px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {supportView !== 'list' && (
                  <button 
                    onClick={() => setSupportView('list')}
                    className="mr-2 hover:text-indigo-400 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                {supportView === 'list' && 'Техническая поддержка'}
                {supportView === 'create' && 'Новый запрос'}
                {supportView === 'chat' && (selectedTicket?.subject || 'Чат')}
              </h3>
              <button 
                onClick={() => setIsSupportModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-zinc-900">
              {supportView === 'list' && (
                <div className="p-4 space-y-4">
                  <button 
                    onClick={() => setSupportView('create')}
                    className="w-full py-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-lg font-medium hover:bg-indigo-600/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Создать новый запрос
                  </button>

                  <div className="space-y-2">
                    {myTickets.length === 0 ? (
                      <p className="text-center text-zinc-500 py-8">У вас пока нет обращений</p>
                    ) : (
                      myTickets.map(ticket => (
                        <div 
                          key={ticket.id}
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setSupportView('chat');
                          }}
                          className="p-4 bg-black border border-zinc-800 rounded-lg hover:border-zinc-700 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-medium">{ticket.subject}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${ticket.status === 'open' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                              {ticket.status === 'open' ? 'Открыт' : 'Закрыт'}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400 truncate">
                            {ticket.messages[ticket.messages.length - 1]?.text}
                          </p>
                          <div className="mt-2 text-xs text-zinc-600 text-right">
                            {new Date(ticket.lastMessageAt).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {supportView === 'create' && (
                <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Тема обращения</label>
                    <input
                      type="text"
                      required
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Кратко опишите проблему..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Сообщение</label>
                    <textarea
                      required
                      value={newTicketMessage}
                      onChange={(e) => setNewTicketMessage(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none h-32 resize-none"
                      placeholder="Подробно опишите ваш вопрос..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Отправить запрос
                  </button>
                </form>
              )}

              {supportView === 'chat' && selectedTicket && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {selectedTicket.messages.map(msg => (
                      <div key={msg.id} className={`flex flex-col ${msg.senderId === user?.id ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          msg.senderId === user?.id 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-zinc-800 text-zinc-200'
                        }`}>
                          {!msg.isAdmin && msg.senderId !== user?.id && (
                             <p className="text-xs text-indigo-400 mb-1 font-bold">Поддержка</p>
                          )}
                           {msg.isAdmin && (
                             <p className="text-xs text-indigo-400 mb-1 font-bold">Поддержка</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-zinc-600 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <form onSubmit={handleSendSupportMessage} className="p-4 border-t border-zinc-800 bg-zinc-950">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        placeholder="Напишите сообщение..."
                        className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button 
                        type="submit"
                        disabled={!supportMessage.trim()}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
