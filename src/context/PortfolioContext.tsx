import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  projectUrl?: string;
}

interface PortfolioContextType {
  items: PortfolioItem[];
  addItem: (item: Omit<PortfolioItem, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<PortfolioItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  loading: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio items', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const addItem = async (item: Omit<PortfolioItem, 'id'>) => {
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(item)
    });

    if (res.ok) {
      const newItem = await res.json();
      setItems(prev => [newItem, ...prev]);
    } else {
      throw new Error('Failed to add portfolio item');
    }
  };

  const updateItem = async (id: string, updates: Partial<PortfolioItem>) => {
    const res = await fetch(`/api/portfolio/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });

    if (res.ok) {
      const updatedItem = await res.json();
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
    } else {
      throw new Error('Failed to update portfolio item');
    }
  };

  const deleteItem = async (id: string) => {
    const res = await fetch(`/api/portfolio/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (res.ok) {
      setItems(prev => prev.filter(item => item.id !== id));
    } else {
      throw new Error('Failed to delete portfolio item');
    }
  };

  return (
    <PortfolioContext.Provider value={{ 
      items, 
      addItem, 
      updateItem, 
      deleteItem,
      loading
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};
