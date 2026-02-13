import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type InvoiceType = 'one_time' | 'monthly';
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: InvoiceType;
  status: InvoiceStatus;
  createdAt: string;
  dueDate: string;
  description?: string;
}

interface BillingContextType {
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoicesByUserId: (userId: string) => Invoice[];
  loading: boolean;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchInvoices = async () => {
    if (!user) {
      setInvoices([]);
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch('/api/invoices', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Failed to fetch invoices', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(invoice)
    });

    if (res.ok) {
      const newInvoice = await res.json();
      setInvoices(prev => [newInvoice, ...prev]);
    } else {
      throw new Error('Failed to add invoice');
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });

    if (res.ok) {
      const updated = await res.json();
      setInvoices(prev => prev.map(inv => inv.id === id ? updated : inv));
    } else {
      throw new Error('Failed to update invoice');
    }
  };

  const deleteInvoice = async (id: string) => {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (res.ok) {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } else {
      throw new Error('Failed to delete invoice');
    }
  };

  const getInvoicesByUserId = (userId: string) => {
    return invoices.filter(inv => inv.userId === userId);
  };

  return (
    <BillingContext.Provider value={{ invoices, addInvoice, updateInvoice, deleteInvoice, getInvoicesByUserId, loading }}>
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};
