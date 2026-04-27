import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, TrendingUp, Target, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const schema = yup.object({
  email: yup.string().email('E-mail inválido').required('Informe seu e-mail'),
  password: yup.string().min(6, 'Mínimo 6 caracteres').required('Informe a senha'),
});
type Form = yup.InferType<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: Form) => {
    try {
      await login(data.email, data.password, remember);
      toast.success('Bem-vindo de volta!');
      nav('/app/dashboard');
    } catch (e: any) {
      toast.error(e.message || 'Falha ao entrar');
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left illustration */}
      <div className="hidden lg:flex bg-auth-side relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-8 left-8"><Logo className="[&_span]:!text-white" /></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-purple/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-brand-green/20 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-md text-white"
        >
          <div className="chip bg-white/10 text-white border border-white/20 backdrop-blur mb-5">
            <Sparkles className="w-3.5 h-3.5" /> SaaS Premium
          </div>
          <h2 className="text-4xl font-display font-extrabold leading-tight">Seu dinheiro sob controle.</h2>
          <p className="mt-4 text-white/80">Organize gastos, economize mais e alcance seus objetivos com o Finix.</p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { icon: TrendingUp, label: 'Crescimento', value: '+18%' },
              { icon: Target, label: 'Metas ativas', value: '3' },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-4">
                <k.icon className="w-5 h-5 text-brand-green mb-2" />
                <div className="text-xs text-white/70">{k.label}</div>
                <div className="text-2xl font-bold">{k.value}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo /></div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Entrar</h1>
          <p className="text-slate-600 mt-1">Acesse sua conta Finix</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" data-testid="login-form">
            <div>
              <label className="text-sm font-medium text-slate-700">E-mail</label>
              <div className="relative mt-1.5">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  data-testid="login-email"
                  className="input pl-10"
                  placeholder="voce@email.com"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Senha</label>
              <div className="relative mt-1.5">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('password')}
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  data-testid="login-password"
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" data-testid="toggle-password">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-700">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={() => setRemember((prev) => !prev)}
                className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
              />
              <label htmlFor="remember" className="select-none">Lembre-se de mim</label>
            </div>

            <button type="submit" className="btn-primary w-full !py-3" disabled={isSubmitting} data-testid="login-submit">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Entrar <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700">
            <div className="font-semibold text-slate-900">Suporte Finix</div>
            <p className="mt-2">Se precisar de ajuda antes de entrar, fale com a equipe pelo WhatsApp ou por e-mail.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href="https://wa.me/5519994737425?text=Olá%20Finix" target="_blank" rel="noreferrer" className="btn-outline text-brand-blue">WhatsApp</a>
              <a href="mailto:cvdinizramos@gmail.com" className="btn-outline text-brand-blue">E-mail</a>
            </div>
          </div>

          <p className="mt-6 text-sm text-slate-600 text-center">
            Não tem conta?{' '}
            <Link to="/register" className="text-brand-blue font-semibold hover:underline" data-testid="goto-register">Cadastre-se grátis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
