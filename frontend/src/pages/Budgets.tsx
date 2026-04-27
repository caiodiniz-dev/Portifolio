import React, { useEffect, useState } from 'react';
import { Plus, Wallet, Edit2, Trash2, X, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../services/api';
import { Budget } from '../types';
import { currency, CATEGORIES, CATEGORY_COLORS } from '../utils/format';

const schema = yup.object({
  category: yup.string().required(),
  limit: yup.number().typeError('Valor inválido').positive().required(),
});
type Form = yup.InferType<typeof schema>;

export default function Budgets() {
  const [items, setItems] = useState<Budget[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);

  const fetchData = async () => setItems((await api.get('/api/budgets')).data);
  useEffect(() => { fetchData().catch(() => toast.error('Erro')); }, []);

  const onDelete = async (b: Budget) => {
    if (!window.confirm(`Excluir orçamento de ${b.category}?`)) return;
    try { await api.delete(`/api/budgets/${b.id}`); toast.success('Excluído'); fetchData(); }
    catch (e) { toast.error(apiErrorMessage(e)); }
  };

  return (
    <div className="space-y-6" data-testid="budgets-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Orçamentos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Defina limites mensais por categoria</p>
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="btn-primary" data-testid="new-budget-btn">
          <Plus className="w-4 h-4" /> Novo orçamento
        </button>
      </div>

      {items === null ? (
        <div className="grid sm:grid-cols-2 gap-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-32" />)}</div>
      ) : items.length === 0 ? (
        <div className="card text-center py-14">
          <Wallet className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 font-semibold text-lg">Nenhum orçamento definido</p>
          <p className="text-sm text-slate-500 mt-1">Crie limites mensais para dominar seus gastos.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((b, i) => {
            const pct = Math.min(100, b.percentage);
            const exceeded = b.percentage > 100;
            const warning = b.percentage >= 80 && !exceeded;
            const color = exceeded ? 'from-red-500 to-rose-500' : warning ? 'from-amber-400 to-orange-500' : 'from-brand-blue to-brand-purple';
            const catColor = CATEGORY_COLORS[b.category] || '#64748B';
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="card relative overflow-hidden"
                data-testid={`budget-card-${b.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${catColor}22` }}>
                      <Wallet className="w-5 h-5" style={{ color: catColor }} />
                    </div>
                    <div>
                      <h3 className="font-bold">{b.category}</h3>
                      <p className="text-xs text-slate-500">Limite mensal</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn-ghost !p-2" onClick={() => { setEditing(b); setOpen(true); }} data-testid={`edit-budget-${b.id}`}><Edit2 className="w-4 h-4" /></button>
                    <button className="btn-ghost !p-2 hover:!text-red-600" onClick={() => onDelete(b)} data-testid={`delete-budget-${b.id}`}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xl font-display font-bold">{currency(b.spent)}</span>
                    <span className="text-sm text-slate-500">de {currency(b.limit)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${color}`}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className={`font-bold ${exceeded ? 'text-red-600' : warning ? 'text-amber-600' : 'text-brand-blue'}`}>
                      {b.percentage.toFixed(0)}%
                    </span>
                    {exceeded ? (
                      <span className="flex items-center gap-1 text-red-600 font-semibold"><AlertTriangle className="w-3 h-3" /> Limite ultrapassado</span>
                    ) : warning ? (
                      <span className="flex items-center gap-1 text-amber-600 font-semibold"><AlertTriangle className="w-3 h-3" /> Atenção</span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold"><TrendingUp className="w-3 h-3" /> No ritmo certo</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {open && <BudgetModal key={editing?.id || 'new'} editing={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); fetchData(); }} />}
      </AnimatePresence>
    </div>
  );
}

function BudgetModal({ editing, onClose, onSaved }: { editing: Budget | null; onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: yupResolver(schema) as any,
    defaultValues: editing ? { category: editing.category, limit: editing.limit } : { category: 'Alimentação' } as any,
  });
  const onSubmit = async (data: Form) => {
    try {
      if (editing) await api.put(`/api/budgets/${editing.id}`, data);
      else await api.post('/api/budgets', data);
      toast.success(editing ? 'Atualizado' : 'Criado');
      onSaved();
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()} data-testid="budget-modal">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{editing ? 'Editar orçamento' : 'Novo orçamento'}</h2>
          <button onClick={onClose} className="btn-ghost !p-2"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3" data-testid="budget-form">
          <div>
            <label className="text-sm font-medium">Categoria</label>
            <select {...register('category')} className="input mt-1" disabled={!!editing} data-testid="budget-category">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Limite mensal (R$)</label>
            <input type="number" step="0.01" {...register('limit')} className="input mt-1" data-testid="budget-limit" />
            {errors.limit && <p className="text-xs text-red-500 mt-1">{errors.limit.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting} data-testid="budget-save">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
