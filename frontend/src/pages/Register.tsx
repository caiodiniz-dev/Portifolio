import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Loader2, Mail, Lock, User as UserIcon, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const schema = yup.object({
  name: yup.string().min(2, 'Nome muito curto').required('Informe seu nome'),
  email: yup.string().email('E-mail inválido').required('Informe seu e-mail'),
  password: yup.string().min(6, 'Mínimo 6 caracteres').required('Crie uma senha'),
});
type Form = yup.InferType<typeof schema>;

export default function Register() {
  const { register: signup } = useAuth();
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: Form) => {
    try {
      await signup(data.name, data.email, data.password);
      toast.success('Conta criada! Bem-vindo ao Finix 🚀');
      nav('/app/dashboard');
    } catch (e: any) {
      toast.error(e.message || 'Falha ao cadastrar');
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex bg-auth-side relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-8 left-8"><Logo className="[&_span]:!text-white" /></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-blue/30 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-brand-green/25 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative text-white max-w-md">
          <div className="chip bg-white/10 text-white border border-white/20 backdrop-blur mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Grátis para sempre
          </div>
          <h2 className="text-4xl font-display font-extrabold leading-tight">Transforme seus gastos em resultados.</h2>
          <p className="mt-4 text-white/80">Crie sua conta em segundos e tenha clareza total sobre seu dinheiro.</p>
          <ul className="mt-8 space-y-3 text-white/90">
            {['Dashboard completo com gráficos', 'Metas financeiras inteligentes', 'Exportação em PDF e Excel', 'Insights automáticos'].map((t) => (
              <li key={t} className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-brand-green" /> {t}</li>
            ))}
          </ul>
        </motion.div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo /></div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Criar conta</h1>
          <p className="text-slate-600 mt-1">Comece grátis — sem cartão de crédito.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" data-testid="register-form">
            <div>
              <label className="text-sm font-medium text-slate-700">Nome</label>
              <div className="relative mt-1.5">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input {...register('name')} data-testid="register-name" className="input pl-10" placeholder="Seu nome" />
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">E-mail</label>
              <div className="relative mt-1.5">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input {...register('email')} type="email" data-testid="register-email" className="input pl-10" placeholder="voce@email.com" />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Senha</label>
              <div className="relative mt-1.5">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input {...register('password')} type={show ? 'text' : 'password'} data-testid="register-password" className="input pl-10 pr-10" placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" className="btn-primary w-full !py-3" disabled={isSubmitting} data-testid="register-submit">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Criar conta <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600 text-center">
            Já tem conta?{' '}
            <Link to="/login" className="text-brand-blue font-semibold hover:underline" data-testid="goto-login">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
