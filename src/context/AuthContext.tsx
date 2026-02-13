import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  // password is not stored on client
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  registerUser: (newUser: any) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  users: User[];
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            localStorage.removeItem('token');
            setUser(null);
          }
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Fetch users if admin
  useEffect(() => {
    const fetchUsers = async () => {
      if (user?.role === 'admin') {
        try {
          const res = await fetch('/api/auth/users', {
            headers: getHeaders()
          });
          if (res.ok) {
            const data = await res.json();
            setUsers(data);
          }
        } catch (error) {
          console.error('Failed to fetch users', error);
        }
      }
    };
    fetchUsers();
  }, [user]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setUsers([]);
  };

  const registerUser = async (userData: any) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await res.json();
    // If admin is adding user, we add to list but don't switch user
    // However, currently register logs in the new user by returning token.
    // If we are already logged in as admin, we should just update the list.
    // But this endpoint is generic. 
    // In this app context, registerUser is called by Admin Dashboard.
    
    setUsers(prev => [...prev, data.user]);
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const res = await fetch(`/api/auth/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      throw new Error('Failed to update user');
    }

    const updatedUser = await res.json();
    setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
    
    if (user && user.id === id) {
      setUser(updatedUser);
    }
  };

  const deleteUser = async (id: string) => {
    const res = await fetch(`/api/auth/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!res.ok) {
      throw new Error('Failed to delete user');
    }

    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, registerUser, updateUser, deleteUser, users, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
