﻿﻿﻿import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, User } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const user = await login(email, password);

      if (user.role !== 'admin') {
        const rawIntent = localStorage.getItem('wexa_order_intent');
        if (rawIntent) {
          try {
            const intent = JSON.parse(rawIntent);
            const token = localStorage.getItem('token');
            const res = await fetch('/api/game-servers/order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(intent),
            });
            if (res.ok) {
              localStorage.removeItem('wexa_order_intent');
              navigate('/dashboard?tab=game_servers');
              setLoading(false);
              return;
            }
          } catch (intentErr) {
            console.warn('Failed to process order intent after login:', intentErr);
          }
          localStorage.removeItem('wexa_order_intent');
        }
      }

      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
      setLoading(false);
      return;
    }
  };

  return (
    <Layout>
      <SEO 
        title="Вход" 
        description="Wexa.su — вход в личный кабинет для управления игровыми серверами, финансами и поддержкой." 
      />
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div 
         
         
         
          className="w-full max-w-md flex flex-col gap-8 bg-white p-10 shadow-2xl rounded-2xl border border-gray-100"
        >
          <div className="text-center">
            <div
             
             
             
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100"
            >
              <User className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Вход в систему
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Войдите, чтобы управлять проектами
            </p>
          </div>

          <form className="mt-8 flex flex-col gap-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border-0 py-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Email адрес"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Пароль</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border-0 py-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Пароль"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
               
               
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <ArrowRight className="h-5 w-5 text-indigo-300 group-hover:text-indigo-100" aria-hidden="true" />
                </span>
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </div>
            
            <div className="text-center text-sm">
              <span className="text-gray-500">Нет аккаунта? </span>
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Зарегистрироваться
              </Link>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
