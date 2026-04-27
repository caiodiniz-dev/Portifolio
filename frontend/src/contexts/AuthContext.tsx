import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, apiErrorMessage } from '../services/api';
import { User } from '../types';

interface AuthCtx {
  user: User | null | undefined; // undefined = loading, null = not logged in
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const token = localStorage.getItem('finix_token') || sessionStorage.getItem('finix_token');
    if (!token) { setUser(null); return; }
    api.get('/api/auth/me').then((r) => setUser(r.data)).catch(() => {
      localStorage.removeItem('finix_token');
      sessionStorage.removeItem('finix_token');
      setUser(null);
    });
  }, []);

  const login = async (email: string, password: string, remember = true) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('finix_token', data.token);
      setUser(data.user);
    } catch (e) { throw new Error(apiErrorMessage(e)); }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { data } = await api.post('/api/auth/register', { name, email, password });
      localStorage.setItem('finix_token', data.token);
      setUser(data.user);
    } catch (e) { throw new Error(apiErrorMessage(e)); }
  };

  const logout = () => {
    localStorage.removeItem('finix_token');
    sessionStorage.removeItem('finix_token');
    setUser(null);
    window.location.href = '/';
  };

  return <Ctx.Provider value={{ user, login, register, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
