import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  iconName: string;
}

interface ServicesContextType {
  services: Service[];
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  loading: boolean;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
};

export const ServicesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          setServices(data);
        }
      } catch (error) {
        console.error('Failed to fetch services', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const addService = async (service: Omit<Service, 'id'>) => {
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(service)
    });
    
    if (res.ok) {
      const newService = await res.json();
      setServices(prev => [...prev, newService]);
    } else {
        throw new Error('Failed to add service');
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    const res = await fetch(`/api/services/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });

    if (res.ok) {
      const updatedService = await res.json();
      setServices(prev => prev.map(s => s.id === id ? updatedService : s));
    } else {
        throw new Error('Failed to update service');
    }
  };

  const deleteService = async (id: string) => {
    const res = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (res.ok) {
      setServices(prev => prev.filter(s => s.id !== id));
    } else {
        throw new Error('Failed to delete service');
    }
  };

  return (
    <ServicesContext.Provider value={{ services, addService, updateService, deleteService, loading }}>
      {children}
    </ServicesContext.Provider>
  );
};
