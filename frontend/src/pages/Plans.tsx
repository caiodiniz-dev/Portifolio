import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const PLANS = [
  {
    id: 'FREE',
    name: 'Grátis',
    price: 0,
    description: 'Perfeito para começar',
    features: [
      '100 transações/mês',
      '3 categorias',
      '2 metas',
      'Sem análise IA',
      'Sem exportação PDF/Excel',
    ],
    icon: Zap,
    highlighted: false,
  },
  {
    id: 'BASIC',
    name: 'Básico',
    price: 10,
    description: 'Para quem quer mais',
    features: [
      '500 transações/mês',
      'Categorias ilimitadas',
      '5 metas',
      'Análise IA simples',
      'Exportar PDF',
    ],
    icon: Crown,
    highlighted: false,
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 35,
    description: 'Máximo poder',
    features: [
      'Transações ilimitadas',
      'Categorias ilimitadas',
      'Metas ilimitadas',
      'Análise IA avançada',
      'Exportar PDF e Excel',
      'Prioridade em suporte',
    ],
    icon: Sparkles,
    highlighted: true,
  },
];

export default function Plans() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'FREE' || planId === user?.plan) {
      toast.error('Este plano não pode ser selecionado.');
      return;
    }

    setLoading(planId);
    try {
      const response = await axios.post(
        'http://localhost:8000/api/stripe/checkout',
        { plan_id: planId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Erro: Nenhuma URL de pagamento retornada');
      }
    } catch (err: any) {
      console.error('Erro ao processar upgrade:', err);
      toast.error(err.response?.data?.error || err.message || 'Erro ao processar o upgrade');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl"
      >
        <h1 className="text-4xl font-display font-extrabold">Planos e Preços</h1>
        <p className="mt-4 text-lg text-slate-600">
          Escolha o plano perfeito para suas necessidades. Você pode mudar a qualquer momento.
        </p>
        {user && (
          <div className="mt-6 inline-block px-4 py-2 rounded-xl bg-brand-blue/10 border border-brand-blue/20">
            <p className="text-sm font-medium">
              Plano atual: <span className="font-bold text-brand-blue">{user.plan || 'GRÁTIS'}</span>
            </p>
          </div>
        )}
      </motion.div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {PLANS.map((plan, idx) => {
          const Icon = plan.icon;
          const isCurrent = plan.id === user?.plan;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`card relative overflow-hidden transition-all ${plan.highlighted
                ? 'ring-2 ring-brand-purple shadow-glow md:scale-105'
                : 'hover:shadow-lg'
                }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-brand-purple to-pink-500 text-white text-xs font-bold rounded-bl-lg">
                  MELHOR OPÇÃO
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <div className={`p-2.5 rounded-lg ${plan.highlighted
                  ? 'bg-gradient-to-br from-brand-purple to-pink-500'
                  : 'bg-gradient-to-br from-brand-blue to-brand-purple'
                  } text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">{plan.name}</h3>
                  <p className="text-xs text-slate-500">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-slate-500">/mês</span>}
                </div>
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading === plan.id || isCurrent}
                className={`w-full py-3 rounded-lg font-semibold mb-8 transition-all ${isCurrent
                  ? 'bg-slate-100 text-slate-500 cursor-default'
                  : plan.highlighted
                    ? 'btn-primary w-full'
                    : 'btn-outline w-full'
                  } disabled:opacity-50`}
              >
                {isCurrent
                  ? '✓ Plano Atual'
                  : loading === plan.id
                    ? 'Processando...'
                    : 'Escolher'}
              </button>

              <div className="space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-brand-green mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-20 max-w-3xl"
      >
        <h2 className="text-2xl font-display font-bold mb-8">Dúvidas frequentes</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Posso mudar de plano depois?',
              a: 'Sim! Você pode fazer upgrade ou downgrade a qualquer momento. As mudanças são aplicadas imediatamente.',
            },
            {
              q: 'Há cobrança recorrente?',
              a: 'Sim, os planos Básico e Pro são cobrados mensalmente. Você pode cancelar quando quiser.',
            },
            {
              q: 'Preciso de cartão de crédito para testar?',
              a: 'Não! O plano Grátis não precisa de cartão. Para os pagos, usamos Stripe com segurança total.',
            },
            {
              q: 'Existe período de teste?',
              a: 'O plano Grátis é seu teste! Teste todas as funcionalidades básicas sem precisar de cartão.',
            },
          ].map((item, i) => (
            <details key={i} className="group card p-4 cursor-pointer">
              <summary className="font-semibold text-slate-700 group-open:text-brand-blue flex items-center gap-2">
                <span>+</span> {item.q}
              </summary>
              <p className="mt-3 text-slate-600 text-sm">{item.a}</p>
            </details>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
