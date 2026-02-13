import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string; // From join
  sender?: {
    id: string;
    name: string;
  };
  text: string;
  createdAt: string;
  isAdmin: boolean;
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string; // From join
  user?: {
    id: string;
    name: string;
    email: string;
  };
  subject: string;
  status: 'open' | 'closed';
  createdAt: string;
  lastMessageAt: string;
  messages: Message[];
}

interface SupportContextType {
  tickets: Ticket[];
  createTicket: (subject: string, message: string) => Promise<void>;
  addMessage: (ticketId: string, text: string) => Promise<void>;
  closeTicket: (ticketId: string) => Promise<void>;
  getTicketsByUserId: (userId: string) => Ticket[];
  getAllTickets: () => Ticket[];
  loading: boolean;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export const useSupport = () => {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
};

export const SupportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchTickets = async () => {
    if (!user) {
      setTickets([]);
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch('/api/support', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        // Backend returns structured data, need to map if necessary
        // But let's assume direct mapping for now.
        // We might need to map sender.name to senderName manually if UI relies on flat structure.
        const mappedData = data.map((t: any) => ({
          ...t,
          userName: t.user?.name || 'Unknown',
          messages: t.messages?.map((m: any) => ({
            ...m,
            senderName: m.sender?.name || 'Unknown'
          }))
        }));
        setTickets(mappedData);
      }
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const createTicket = async (subject: string, initialMessage: string) => {
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ subject, initialMessage })
    });
    
    if (res.ok) {
      const newTicket = await res.json();
      // Map
      const mappedTicket = {
        ...newTicket,
        userName: newTicket.user?.name || 'Unknown',
        messages: newTicket.messages?.map((m: any) => ({
            ...m,
            senderName: m.sender?.name || 'Unknown'
        }))
      };
      setTickets(prev => [mappedTicket, ...prev]);
    } else {
      throw new Error('Failed to create ticket');
    }
  };

  const addMessage = async (ticketId: string, text: string) => {
    const res = await fetch(`/api/support/${ticketId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text })
    });

    if (res.ok) {
      const newMessage = await res.json();
      const mappedMessage = {
          ...newMessage,
          senderName: newMessage.sender?.name || 'Unknown'
      };

      setTickets(prev => prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            lastMessageAt: new Date().toISOString(), // Optimistic update or from backend response? 
            // Ideally backend returns updated ticket or we refresh.
            // But we only got the message.
            messages: [...(t.messages || []), mappedMessage]
          };
        }
        return t;
      }));
    } else {
      throw new Error('Failed to add message');
    }
  };

  const closeTicket = async (ticketId: string) => {
    const res = await fetch(`/api/support/${ticketId}/close`, {
      method: 'PUT',
      headers: getHeaders()
    });

    if (res.ok) {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t));
    } else {
      throw new Error('Failed to close ticket');
    }
  };

  const getTicketsByUserId = (userId: string) => {
    return tickets.filter(t => t.userId === userId);
  };

  const getAllTickets = () => {
    return tickets;
  };

  return (
    <SupportContext.Provider value={{ tickets, createTicket, addMessage, closeTicket, getTicketsByUserId, getAllTickets, loading }}>
      {children}
    </SupportContext.Provider>
  );
};
