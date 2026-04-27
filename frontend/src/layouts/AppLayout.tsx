import React, { useState } from 'react';
import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ArrowLeftRight, Target, Shield, LogOut, Menu, X, Download, Sun, Moon, Wallet, User as UserIcon, Crown
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth, useAutoRefreshUser } from '../contexts/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  useAutoRefreshUser(30000);
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem('finix_theme') === 'dark');

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('finix_theme', dark ? 'dark' : 'light');
  }, [dark]);

  React.useEffect(() => {
    if (user.plan === 'PRO' && user.primaryColor) {
      document.documentElement.style.setProperty('--brand-primary', user.primaryColor);
    }
  }, [user.primaryColor, user.plan]);

  React.useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.plan === 'PRO' && !user.hasCompletedOnboarding) {
      nav('/onboarding', { replace: true });
    }
  }, [user?.plan, user?.hasCompletedOnboarding, user?.role, nav]);

  if (!user) return null;

  const links = [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard', testid: 'nav-dashboard' },
    { to: '/app/transactions', icon: ArrowLeftRight, label: 'Transações', testid: 'nav-transactions' },
    { to: '/app/budgets', icon: Wallet, label: 'Orçamentos', testid: 'nav-budgets' },
    { to: '/app/goals', icon: Target, label: 'Metas', testid: 'nav-goals' },
    { to: '/app/plans', icon: Crown, label: 'Planos', testid: 'nav-plans' },
    { to: '/app/profile', icon: UserIcon, label: 'Perfil', testid: 'nav-profile' },
  ];
  if (user.role === 'ADMIN') {
    links.push({ to: '/app/admin', icon: Shield, label: 'Admin', testid: 'nav-admin' });
  }

  const Sidebar = (
    <aside className="w-64 shrink-0 h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col">
      <div className="px-5 py-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <Logo
            src={user.plan === 'PRO' ? user.companyLogo : undefined}
            altText={user.plan === 'PRO' ? (user.companyName || "Logo") : undefined}
            showText={user.plan !== 'PRO'}
            size={52}
          />
          {user.plan === 'PRO' && user.companyName && (
            <div>
              <div className="text-base font-semibold text-slate-500 dark:text-slate-300">Empresa</div>
              <div className="text-xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
                {user.companyName}
              </div>
            </div>
          )}
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            data-testid={l.testid}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${isActive
                ? 'bg-gradient-to-r from-brand-blue/10 to-brand-purple/10 text-brand-blue border border-brand-blue/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`
            }
          >
            <l.icon className="w-5 h-5" /> {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800">
          {user.photo ? (
            <img src={user.photo} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{user.name}</div>
            <div className="text-xs text-slate-500 truncate">{user.email}</div>
            {user.plan && (
              <div className="mt-1">
                <span
                  data-testid="plan-badge"
                  className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${user.plan === 'PRO' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                    user.plan === 'BASIC' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                      'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                >
                  <Crown className="w-2.5 h-2.5" /> {user.plan}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            data-testid="theme-toggle"
            onClick={() => setDark(!dark)}
            className="btn-outline flex-1 !py-2"
            title="Alternar tema"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            data-testid="logout-btn"
            onClick={logout}
            className="btn-outline flex-1 !py-2 text-red-600 hover:!border-red-500 hover:!text-red-600"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{Sidebar}</div>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">{Sidebar}</div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <button data-testid="open-sidebar" onClick={() => setOpen(true)} className="btn-ghost !p-2">
            <Menu className="w-5 h-5" />
          </button>
          <Logo size={28} />
          <div className="w-10" />
        </header>

        <motion.main
          key={window.location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
