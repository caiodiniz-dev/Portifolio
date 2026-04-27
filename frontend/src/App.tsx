import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Goals from './pages/Goals';
import Budgets from './pages/Budgets';
import Plans from './pages/Plans';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import AppLayout from './layouts/AppLayout';
import { Logo } from './components/Logo';

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <Logo />
      <div className="w-10 h-10 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
    </div>
  );
}

function OnboardingRequired({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user === undefined) return <FullScreenLoader />;
  if (user === null) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN' && user.plan === 'PRO' && !user.hasCompletedOnboarding) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function NeedsOnboarding({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user === undefined) return <FullScreenLoader />;
  if (user === null) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/app/dashboard" replace />;
  if (user.plan !== 'PRO') return <Navigate to="/app/dashboard" replace />;
  if (user.hasCompletedOnboarding) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

function ProtectedRoute({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const { user } = useAuth();
  if (user === undefined) return <FullScreenLoader />;
  if (user === null) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'ADMIN') return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user === undefined) return <FullScreenLoader />;
  if (user) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

function Home() {
  const { user } = useAuth();
  if (user === undefined) return <FullScreenLoader />;
  if (user) return <Navigate to="/app/dashboard" replace />;
  return <Landing />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: 12, padding: '12px 16px', fontFamily: 'Inter, sans-serif' },
          success: { iconTheme: { primary: '#22C55E', secondary: 'white' } },
        }} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/onboarding" element={<NeedsOnboarding><Onboarding /></NeedsOnboarding>} />
          <Route path="/app" element={<OnboardingRequired><AppLayout /></OnboardingRequired>}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="goals" element={<Goals />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="plans" element={<Plans />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin" element={<ProtectedRoute admin><Admin /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
