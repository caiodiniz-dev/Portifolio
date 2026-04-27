import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, PieChart, Target, Shield, Zap, TrendingUp, BarChart3, Sparkles,
  Wallet, FileDown, RefreshCw, Brain, LineChart, Users, Star, Quote, ChevronRight, ChevronLeft, Play,
  ShieldCheck, Lock, Clock, MousePointer2, PiggyBank, Loader2
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function useCountUp(to: number, duration = 1.6, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000));
      setVal(Math.floor(to * (0.5 - Math.cos(Math.PI * p) / 2)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, start]);
  return val;
}

function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const n = useCountUp(value, 1.8, inView);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl sm:text-5xl font-display font-extrabold bg-gradient-to-br from-brand-blue via-brand-purple to-brand-green bg-clip-text text-transparent tabular-nums">
        {n.toLocaleString('pt-BR')}{suffix}
      </div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0.2]);
  const { user } = useAuth();
  const nav = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const API_BASE = import.meta.env.VITE_API_URL as string;

  const handleCheckout = async (planId: 'BASIC' | 'PRO') => {
    if (!user) {
      toast.error('Faça login para continuar');
      nav('/login');
      return;
    }

    try {
      setLoadingPlan(planId);
      const res = await fetch(`${API_BASE}/api/checkout/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('finix_token')}`,
        },
        body: JSON.stringify({
          plan_id: planId,
          origin_url: window.location.origin,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail || 'Erro ao criar sessão');
        return;
      }

      const data = await res.json();
      window.location.href = data.url;
    } catch (e: any) {
      toast.error(e.message || 'Erro ao processar pagamento');
    } finally {
      setLoadingPlan(null);
    }
  };

  const features = [
    { icon: BarChart3, title: 'Dashboard Inteligente', desc: 'Gráficos em tempo real com uma visão completa de suas finanças.', gradient: 'from-brand-blue to-cyan-500' },
    { icon: Brain, title: 'Insights com IA real', desc: 'Recomendações personalizadas para economizar mais e gastar melhor.', gradient: 'from-brand-purple to-pink-500' },
    { icon: Target, title: 'Metas Visuais', desc: 'Acompanhe seu progresso e transforme objetivos em resultados.', gradient: 'from-brand-green to-emerald-500' },
    { icon: Wallet, title: 'Orçamentos por categoria', desc: 'Defina limites e receba alertas antes de ultrapassar seus gastos.', gradient: 'from-amber-500 to-orange-500' },
    { icon: RefreshCw, title: 'Recorrências', desc: 'Automatize despesas mensais e saiba exatamente quando vai sair.', gradient: 'from-cyan-500 to-brand-blue' },
    { icon: FileDown, title: 'Exportação simples', desc: 'Relatórios bonitos em PDF e Excel com apenas um clique.', gradient: 'from-rose-500 to-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Top progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-blue via-brand-purple to-brand-green origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Logo />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-brand-blue transition">Recursos</a>
            <a href="#preview" className="hover:text-brand-blue transition">Preview</a>
            <a href="#testimonials" className="hover:text-brand-blue transition">Depoimentos</a>
            <a href="#pricing" className="hover:text-brand-blue transition">Preço</a>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost hidden sm:inline-flex" data-testid="nav-login">Entrar</Link>
            <Link to="/register" className="btn-primary" data-testid="nav-register">
              Começar grátis <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Ambient orbs */}
        <motion.div
          className="absolute -top-32 -left-32 w-[38rem] h-[38rem] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #2563EB, transparent 60%)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.35, 0.25] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-10 -right-32 w-[34rem] h-[34rem] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #7C3AED, transparent 60%)' }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.35, 0.25, 0.35] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, #22C55E, transparent 60%)' }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative max-w-7xl mx-auto px-6 pt-24 pb-32 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="chip bg-gradient-to-r from-brand-blue/10 to-brand-purple/10 text-brand-blue mb-5 border border-brand-blue/20 backdrop-blur"
            >
              <Sparkles className="w-3.5 h-3.5" /> Implantado Com I.A.
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-[1.05] tracking-tight"
            >
              Controle suas finanças como um{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-brand-blue via-brand-purple to-brand-green bg-clip-text text-transparent">PROFISSIONAL</span>
                <motion.span
                  initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: 0.8, duration: 0.6 }}
                  className="absolute -bottom-1 left-0 h-1 bg-gradient-to-r from-brand-blue via-brand-purple to-brand-green rounded-full"
                />
              </span>{' '}💰
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-5 text-lg text-slate-600 max-w-xl leading-relaxed"
            >
              Organize gastos, economize mais e alcance seus objetivos com um painel premium, insights inteligentes por IA e metas que realmente funcionam.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link to="/register" className="btn-primary !px-7 !py-3.5 text-base group" data-testid="hero-cta-register">
                Começar grátis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#preview" className="btn-outline !px-7 !py-3.5 text-base group">
                <Play className="w-4 h-4 group-hover:scale-110 transition" /> Ver demonstração
              </a>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8 flex flex-wrap items-center gap-5 text-sm text-slate-500">
              {[
                { icon: CheckCircle2, text: 'Sem cartão de crédito' },
                { icon: ShieldCheck, text: 'Criptografia bcrypt + JWT' },
                { icon: Clock, text: 'Configure em 1 minuto' },
              ].map((t) => (
                <div key={t.text} className="flex items-center gap-1.5"><t.icon className="w-4 h-4 text-brand-green" /> {t.text}</div>
              ))}
            </motion.div>

            {/* Avatars social proof */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {['#F59E0B', '#2563EB', '#7C3AED', '#22C55E', '#EC4899', '#FB7185', '#F97316'].map((c, i) => (
                  <div key={i} className="w-9 h-9 rounded-full ring-2 ring-white flex items-center justify-center text-white font-bold text-xs" style={{ background: c }}>
                    {['R', 'M', 'A', 'L', 'C', 'S', 'P'][i]}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="text-slate-600 font-medium">Muitas pessoas no controle</p>
              </div>
            </motion.div>
          </div>

          {/* Hero dashboard preview */}
          <HeroDashboard />
        </motion.div>
      </section>

      {/* Counters strip */}
      <section className="border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCounter value={100} label="Controle total das suas finanças" suffix="%" />
          <StatCounter value={100} label="Visualização clara dos seus gastos" suffix="%" />
          <StatCounter value={100} label="Acompanhe suas metas em tempo real" suffix="%" />
          <StatCounter value={100} label="nterface rápida e simples" suffix="%" />
        </div>
      </section>

      {/* Feature cards */}
      <section id="features" className="py-24 bg-gradient-to-b from-white via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="chip bg-brand-purple/10 text-brand-purple mb-3 mx-auto border border-brand-purple/20">Recursos</div>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight">
              Tudo que você precisa para <span className="text-brand-blue">dominar seu dinheiro</span>
            </h2>
            <p className="mt-4 text-slate-600 text-lg">Um painel premium com as ferramentas certas — sem complicação.</p>
          </motion.div>
          <div className="mt-16 overflow-hidden">
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
              className="flex gap-6"
            >
              {[...features, ...features].map((f, index) => (
                <div key={`${f.title}-${index}`} className="group relative card hover:shadow-glow transition-all min-w-[22rem] flex-shrink-0">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-md`}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-lg">{f.title}</h3>
                  <p className="text-slate-600 mt-2 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Product preview showcase */}
      <section id="preview" className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <div className="chip bg-brand-green/10 text-brand-green mb-3 mx-auto border border-brand-green/20">Preview</div>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight">Veja o Finix em ação</h2>
            <p className="mt-4 text-slate-600 text-lg">Cada pixel foi pensado pra você tomar decisões melhores.</p>
          </motion.div>

          <PreviewCard
            order={1}
            badge="Dashboard"
            title="Seu panorama financeiro em 1 olhada"
            desc="Saldo, receitas, despesas, economizado, insights e 3 gráficos com zoom nos últimos 6 meses."
            align="left"
            visual={<DashboardVisual />}
          />
          <PreviewCard
            order={2}
            badge="IA · Claude Sonnet 4.5"
            title="Análise personalizada em segundos"
            desc="Clique em 'Análise com IA' e receba 4-6 recomendações específicas com base nos seus números reais."
            align="right"
            visual={<AIInsightsVisual />}
          />
          <PreviewCard
            order={3}
            badge="Metas + Orçamentos"
            title="Transforme desejos em planos concretos"
            desc="Defina objetivos, acompanhe o progresso com barras animadas e limite gastos por categoria."
            align="left"
            visual={<GoalsVisual />}
          />
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <div className="chip bg-amber-100 text-amber-700 mb-3 mx-auto border border-amber-200">Depoimentos</div>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight">Pessoas que <span className="text-brand-green">economizaram de verdade</span></h2>
          </motion.div>

          <TestimonialCarousel />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="chip bg-brand-blue/10 text-brand-blue mb-3 mx-auto border border-brand-blue/20">Preço</div>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight">Grátis durante o lançamento</h2>
            <p className="mt-3 text-slate-600 text-lg">Todos os recursos sem limite. Para sempre na versão beta.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {/* Plano Grátis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="relative card hover:shadow-glow transition-all rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 h-full"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-green mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-center">Grátis</h3>
              <div className="text-4xl font-display font-extrabold text-center mt-4">R$ 0</div>
              <div className="text-slate-600 text-sm text-center mt-2">Para sempre</div>
              <ul className="mt-8 space-y-3 text-left">
                {['Até 100 transações/mês', 'Dashboard básico', '3 categorias', 'Gráficos simples', 'Sem IA'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-brand-green" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="w-full mt-8 inline-flex items-center justify-center gap-2 py-3 px-6 bg-brand-green text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                Iniciar <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Plano Pro - DESTAQUE NO MEIO */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="relative card hover:shadow-glow transition-all rounded-2xl border-2 border-brand-purple bg-gradient-to-br from-blue-50 via-purple-50 to-purple-100 scale-105 shadow-2xl h-full md:col-span-1"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-brand-blue to-brand-purple text-white px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">✨ MAIS POPULAR</span>
              </div>
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple mx-auto mb-4">
                <PiggyBank className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold text-center">Plano Pro</h3>
              <div className="text-5xl font-display font-extrabold text-center mt-4">R$ 35</div>
              <div className="text-slate-600 text-sm text-center mt-2">/mês</div>
              <ul className="mt-8 space-y-3 text-left">
                {['Transações ilimitadas', 'Dashboard completo', 'Análise com IA avançada', 'Exportação PDF + Excel', 'Metas ilimitadas', 'Suporte prioritário'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout('PRO')}
                disabled={loadingPlan === 'PRO'}
                className="w-full mt-8 inline-flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-brand-blue to-brand-purple text-white rounded-xl font-bold hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50"
              >
                {loadingPlan === 'PRO' ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Assinar agora <ArrowRight className="w-4 h-4" /></>}
              </button>
            </motion.div>

            {/* Plano Básico */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="relative card hover:shadow-glow transition-all rounded-2xl border-2 border-slate-200 bg-white h-full"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 mx-auto mb-4">
                <Wallet className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-xl font-display font-bold text-center">Plano Básico</h3>
              <div className="text-4xl font-display font-extrabold text-center mt-4">R$ 10</div>
              <div className="text-slate-600 text-sm text-center mt-2">/mês</div>
              <ul className="mt-8 space-y-3 text-left">
                {['Até 500 transações/mês', 'Dashboard completo', 'Análise com IA', 'Exportação PDF', 'Até 5 metas'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout('BASIC')}
                disabled={loadingPlan === 'BASIC'}
                className="w-full mt-8 inline-flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-brand-blue to-brand-purple text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loadingPlan === 'BASIC' ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Assinar agora <ArrowRight className="w-4 h-4" /></>}
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Big CTA */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden p-8 sm:p-16 text-white grid md:grid-cols-2 gap-12 items-center"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #22C55E 120%)' }}
          >
            {/* Left: Text */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <h2 className="text-4xl sm:text-5xl font-display font-extrabold leading-tight">
                Pare de perder dinheiro sem perceber.
              </h2>
              <p className="mt-6 text-white/90 text-lg leading-relaxed">
                Transforme seus gastos em resultados reais hoje mesmo — comece em menos de 1 minuto.
              </p>
              <Link to="/register" className="mt-8 inline-flex items-center gap-2 px-7 py-4 rounded-xl font-bold bg-white text-brand-dark hover:bg-slate-100 hover:scale-105 transition text-base shadow-lg" data-testid="cta-register">
                Começar grátis <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="mt-4 text-sm text-white/70 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Sem cartão de crédito necessário
              </div>
            </motion.div>

            {/* Right: Chart with green arrow */}
            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <svg viewBox="0 0 200 200" className="w-full h-auto max-w-xs">
                {/* Grid background */}
                <g stroke="rgba(255,255,255,0.1)" strokeWidth="1">
                  <line x1="0" y1="40" x2="200" y2="40" />
                  <line x1="0" y1="80" x2="200" y2="80" />
                  <line x1="0" y1="120" x2="200" y2="120" />
                  <line x1="0" y1="160" x2="200" y2="160" />
                  <line x1="40" y1="0" x2="40" y2="200" />
                  <line x1="80" y1="0" x2="80" y2="200" />
                  <line x1="120" y1="0" x2="120" y2="200" />
                  <line x1="160" y1="0" x2="160" y2="200" />
                </g>

                {/* Chart area */}
                <polyline
                  points="20,160 60,120 100,100 140,60 180,20"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Area under curve */}
                <polygon
                  points="20,160 60,120 100,100 140,60 180,20 180,200 20,200"
                  fill="rgba(34, 197, 94, 0.2)"
                />

                {/* Data points */}
                {[
                  { cx: 20, cy: 160 },
                  { cx: 60, cy: 120 },
                  { cx: 100, cy: 100 },
                  { cx: 140, cy: 60 },
                  { cx: 180, cy: 20 },
                ].map((point, i) => (
                  <circle
                    key={i}
                    cx={point.cx}
                    cy={point.cy}
                    r="4"
                    fill="#22C55E"
                  />
                ))}

                {/* Arrow at top */}
                <g>
                  <line x1="190" y1="25" x2="190" y2="0" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
                  <polyline points="185,10 190,0 195,10" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-6 -right-6 bg-white/95 backdrop-blur rounded-xl p-3 shadow-xl text-brand-dark text-xs font-bold"
              >
                +18% este mês ↑
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size={32} />
          <div className="text-sm text-slate-500 text-center sm:text-right">
            © 2026 Finix · Suas finanças, seu futuro. Feito com 💙 <a href="https://caiodiniz.dev.br" target="_blank" rel="noreferrer" className="text-brand-blue hover:underline">Caio Diniz</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ===== Visual components (animated mockups) ===== */

function TestimonialCarousel() {
  const testimonials = [
    {
      name: 'Rafael Mendes',
      role: 'Designer · SP',
      text: 'O Finix mudou meu jogo. Em 3 meses economizei R$ 4.200 só descobrindo para onde meu dinheiro ia.',
      color: '#2563EB',
    },
    {
      name: 'Marina Costa',
      role: 'Engenheira · RJ',
      text: 'A análise da IA foi impressionante. Identificou que eu gastava demais com delivery e me ajudou a cortar 40%.',
      color: '#7C3AED',
    },
    {
      name: 'Lucas Almeida',
      role: 'Dev · BH',
      text: 'Finalmente um app de finanças bonito e rápido. Os gráficos e as metas me mantêm motivado todo mês.',
      color: '#22C55E',
    },
    {
      name: 'Patrícia Soares',
      role: 'Empreendedora · RJ',
      text: 'A exportação em PDF e Excel salvou o meu relatório mensal e facilitou a apresentação ao meu contador.',
      color: '#F97316',
    },
    {
      name: 'Guilherme Rocha',
      role: 'Consultor · SP',
      text: 'O recurso de metas me fez economizar para uma viagem em apenas 4 meses. Recomendo demais.',
      color: '#EC4899',
    },
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [testimonials.length]);

  const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);

  return (
    <div className="relative max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={testimonials[current].name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45 }}
          className="card p-8 shadow-xl"
        >
          <Quote className="absolute top-6 right-6 w-10 h-10 text-slate-100 opacity-20" />
          <div className="flex items-center gap-2 text-amber-500 mb-4">
            {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="w-4 h-4 fill-current" />)}
          </div>
          <p className="text-lg sm:text-xl text-slate-700 leading-relaxed">"{testimonials[current].text}"</p>
          <div className="mt-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base" style={{ background: testimonials[current].color }}>
              {testimonials[current].name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-slate-900">{testimonials[current].name}</div>
              <div className="text-sm text-slate-500">{testimonials[current].role}</div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-8 flex items-center justify-between gap-3 text-slate-500">
        <button onClick={prev} className="btn-outline inline-flex items-center gap-2 px-4 py-2 rounded-full">
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>
        <div className="flex items-center gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-3 h-3 rounded-full ${index === current ? 'bg-brand-green' : 'bg-slate-300'}`}
              aria-label={`Depoimento ${index + 1}`}
            />
          ))}
        </div>
        <button onClick={next} className="btn-outline inline-flex items-center gap-2 px-4 py-2 rounded-full">
          Próximo <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function HeroDashboard() {
  const bars = [40, 62, 50, 78, 55, 84, 70, 92, 66, 88, 75, 95];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 70 }}
      className="relative"
    >
      {/* Glow */}
      <div className="absolute -inset-8 bg-gradient-to-br from-brand-blue/30 via-brand-purple/30 to-brand-green/30 blur-3xl rounded-full opacity-60" />

      {/* Floating side card 1 */}
      <motion.div
        initial={{ opacity: 0, x: 30, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute -left-8 top-44 z-20 card !p-4 w-56 bg-white/95 backdrop-blur"
        style={{ boxShadow: '0 20px 60px -20px rgba(37,99,235,0.4)' }}
      >
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-pink-500 flex items-center justify-center text-white">
              <Brain className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold">Insight da IA</div>
          </div>
          <p className="text-xs text-slate-600 mt-2 leading-snug">Você economizou <b className="text-brand-green">62%</b> da sua renda este mês! 🎉</p>
        </motion.div>
      </motion.div>

      {/* Floating side card 2 */}
      <motion.div
        initial={{ opacity: 0, x: -30, y: -10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute -right-6 -bottom-6 z-20 card !p-4 w-52 bg-white/95 backdrop-blur"
        style={{ boxShadow: '0 20px 60px -20px rgba(34,197,94,0.4)' }}
      >
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-green to-emerald-500 flex items-center justify-center text-white">
              <Target className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold">Meta atingível</div>
          </div>
          <div className="text-xs text-slate-600 mt-1.5">Notebook novo</div>
          <div className="h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: '69%' }} transition={{ delay: 1.2, duration: 1.2 }} className="h-full bg-gradient-to-r from-brand-green to-emerald-500" />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">R$ 5.500 / 8.000 · 69%</div>
        </motion.div>
      </motion.div>

      {/* Main dashboard card */}
      <div
        className="relative card !p-6 bg-white/95 backdrop-blur border border-white"
        style={{ boxShadow: '0 30px 80px -30px rgba(37,99,235,0.5)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo total</div>
            <div className="text-3xl font-display font-extrabold mt-1 tabular-nums">R$ 19.230,75</div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="chip bg-brand-green/10 text-brand-green border border-brand-green/30"
          >
            <TrendingUp className="w-3.5 h-3.5" /> +18%
          </motion.div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: 'Receitas', value: 'R$ 31,1k', color: 'from-green-500 to-emerald-500' },
            { label: 'Despesas', value: 'R$ 11,9k', color: 'from-rose-500 to-red-500' },
            { label: 'Metas', value: 'R$ 16,0k', color: 'from-brand-blue to-brand-purple' },
          ].map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }}
              className="rounded-xl bg-slate-50 p-3"
            >
              <div className={`h-1 rounded-full bg-gradient-to-r ${c.color} mb-2`} />
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{c.label}</div>
              <div className="font-bold text-sm">{c.value}</div>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 h-32 flex items-end gap-1.5">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }} animate={{ height: `${h}%` }}
              transition={{ delay: 0.3 + i * 0.04, duration: 0.6, ease: 'easeOut' }}
              className="flex-1 rounded-t-md bg-gradient-to-t from-brand-blue to-brand-purple"
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
          <span>Nov</span><span>Dez</span><span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span>
        </div>
      </div>
    </motion.div>
  );
}

function PreviewCard({ order, badge, title, desc, align, visual }: { order: number; badge: string; title: string; desc: string; align: 'left' | 'right'; visual: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }}
      className={`grid lg:grid-cols-2 gap-12 items-center mb-24 ${align === 'right' ? 'lg:[&>*:first-child]:order-2' : ''}`}
    >
      <div>
        <div className="chip bg-brand-blue/10 text-brand-blue border border-brand-blue/20 mb-3">#{order} · {badge}</div>
        <h3 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">{title}</h3>
        <p className="mt-4 text-slate-600 text-lg leading-relaxed">{desc}</p>
        <Link to="/register" className="inline-flex items-center gap-1 mt-5 text-brand-blue font-semibold hover:gap-2 transition-all">
          Experimente agora <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <motion.div whileHover={{ y: -4 }} className="relative">
        {visual}
      </motion.div>
    </motion.div>
  );
}

function DashboardVisual() {
  return (
    <div className="card !p-5 bg-white relative" style={{ boxShadow: '0 30px 60px -30px rgba(0,0,0,0.3)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="text-xs text-slate-400">finix.app/dashboard</div>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Saldo', v: 'R$ 19,2k', c: 'from-brand-blue to-brand-purple' },
          { label: 'Receitas', v: 'R$ 31,1k', c: 'from-green-500 to-emerald-500' },
          { label: 'Despesas', v: 'R$ 11,9k', c: 'from-rose-500 to-red-500' },
          { label: 'Economizado', v: 'R$ 16,0k', c: 'from-amber-500 to-orange-500' },
        ].map(k => (
          <div key={k.label} className="rounded-lg bg-slate-50 p-2">
            <div className={`h-0.5 rounded bg-gradient-to-r ${k.c} mb-1`} />
            <div className="text-[9px] uppercase text-slate-500">{k.label}</div>
            <div className="font-bold text-xs">{k.v}</div>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 400 120" className="w-full">
        <defs>
          <linearGradient id="gLine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rLine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          d="M0 80 C 50 70, 90 40, 150 45 S 250 20, 320 15 L 400 10 L 400 120 L 0 120 Z"
          fill="url(#gLine)" stroke="#22C55E" strokeWidth="2"
        />
        <motion.path
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.3 }}
          d="M0 100 C 60 95, 100 85, 170 88 S 270 70, 340 65 L 400 62 L 400 120 L 0 120 Z"
          fill="url(#rLine)" stroke="#EF4444" strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function AIInsightsVisual() {
  const items = [
    { t: 'success', title: 'Excelente controle! 🎉', msg: 'Você economizou 62% da sua renda. Continue assim!' },
    { t: 'warning', title: 'Atenção: Moradia', msg: 'Representa 67% dos gastos. Reavalie se possível.' },
    { t: 'info', title: 'Meta próxima 🎯', msg: 'Notebook 69% concluído. Faltam R$ 2.500.' },
    { t: 'success', title: 'Saldo saudável 💰', msg: 'R$ 19k é 62% da receita total. Ótima gestão.' },
  ];
  const colors: any = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };
  return (
    <div
      className="relative rounded-2xl p-5 border border-brand-purple/20"
      style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.12) 50%, rgba(34,197,94,0.08) 100%)', boxShadow: '0 30px 60px -30px rgba(124,58,237,0.4)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white shadow-glow">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-sm">Análise com IA</div>
          <div className="text-[10px] text-slate-500">Claude Sonnet 4.5 · gerado agora</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((i, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: idx * 0.15 }}
            className={`rounded-lg border p-2.5 ${colors[i.t]}`}
          >
            <div className="font-semibold text-[11px]">{i.title}</div>
            <div className="text-[10px] opacity-80 mt-0.5 leading-snug">{i.msg}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function GoalsVisual() {
  const goals = [
    { t: 'Reserva de emergência', pct: 41, cur: 'R$ 6.200', tgt: 'R$ 15.000', c: 'from-brand-blue to-brand-purple' },
    { t: 'Viagem Europa', pct: 17, cur: 'R$ 4.300', tgt: 'R$ 25.000', c: 'from-brand-purple to-pink-500' },
    { t: 'Notebook novo', pct: 69, cur: 'R$ 5.500', tgt: 'R$ 8.000', c: 'from-brand-green to-emerald-500' },
  ];
  return (
    <div className="card !p-5 space-y-3" style={{ boxShadow: '0 30px 60px -30px rgba(0,0,0,0.3)' }}>
      {goals.map((g, i) => (
        <motion.div
          key={g.t}
          initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          transition={{ delay: i * 0.15 }}
          className="rounded-xl border border-slate-100 p-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-blue" />
              <span className="font-semibold text-sm">{g.t}</span>
            </div>
            <span className="text-xs font-bold text-brand-blue">{g.pct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
            <motion.div
              initial={{ width: 0 }} whileInView={{ width: `${g.pct}%` }} viewport={{ once: true }}
              transition={{ duration: 1.2, delay: i * 0.15 }}
              className={`h-full rounded-full bg-gradient-to-r ${g.c}`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>{g.cur}</span><span>de {g.tgt}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
