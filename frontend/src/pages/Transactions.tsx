import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus, Search, Filter, Edit2, Trash2, X, Loader2, ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../services/api';
import { Budget, Transaction } from '../types';
import { currency, dateBR, dateISOForInput } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Saúde',
  'Salário',
  'Investimento',
  'Pagamento',
  'Lazer',
  'Educação',
  'Moradia',
  'Serviços',
];

const schema = yup.object({
  title: yup.string().min(1).required('Título obrigatório'),
  amount: yup.number().typeError('Valor inválido').positive('Valor deve ser positivo').required(),
  type: yup.string().oneOf(['INCOME', 'EXPENSE']).required(),
  category: yup.string().required('Categoria obrigatória'),
  description: yup.string().default(''),
  date: yup.string().required('Data obrigatória'),
  recurring: yup.boolean().default(false),
  recurringFrequency: yup.string().nullable().default(null),
  paymentMethod: yup.string().oneOf(['credito', 'debito', 'pix']).default('pix'),
  installments: yup.number().min(1).max(60).default(1),
  currency: yup.string().oneOf(['BRL', 'USD', 'EUR', 'GBP']).default('BRL'),
});
type Form = yup.InferType<typeof schema>;

export default function Transactions() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [q, setQ] = useState('');
  const [type, setType] = useState<'' | 'INCOME' | 'EXPENSE'>('');
  const [category, setCategory] = useState('');
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [userCategories, setUserCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  const effectiveCategories = user?.plan === 'PRO' ? userCategories : DEFAULT_CATEGORIES;

  const fetchBudgets = async () => setBudgets((await api.get('/api/budgets')).data);

  const fetchCategories = async () => {
    if (!user || user.plan !== 'PRO') {
      setUserCategories(DEFAULT_CATEGORIES);
      return;
    }

    try {
      const r = await api.get('/api/categories');
      if (r.data.length > 0) {
        setUserCategories(r.data.map((c: any) => c.name));
      } else {
        setUserCategories(DEFAULT_CATEGORIES);
      }
    } catch (e) {
      console.log('Erro ao buscar categorias:', e);
      setUserCategories(DEFAULT_CATEGORIES);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (q) params.search = q;
      if (type) params.type = type;
      if (category) params.category = category;
      const r = await api.get('/api/transactions', { params });
      setItems(r.data);
    } catch (e) {
      toast.error('Erro ao carregar transações');
      console.error('Erro ao carregar transações:', e);
    } finally {
      setLoading(false);
    }
  }, [q, type, category]);

  useEffect(() => { fetchData().catch(() => toast.error('Erro ao carregar')); }, [fetchData]);
  useEffect(() => { fetchBudgets().catch(() => toast.error('Erro ao carregar orçamentos')); }, []);
  useEffect(() => { fetchCategories(); }, [user]);
  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (t: Transaction) => { setEditing(t); setOpen(true); };

  const onDelete = async (t: Transaction) => {
    if (!window.confirm(`Excluir "${t.title}"?`)) return;
    try { await api.delete(`/api/transactions/${t.id}`); toast.success('Excluído'); fetchData(); }
    catch (e) { toast.error(apiErrorMessage(e)); }
  };

  return (
    <div className="space-y-6" data-testid="transactions-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Transações</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Organize seus ganhos e gastos</p>
        </div>
        <button onClick={openNew} className="btn-primary" data-testid="new-transaction-btn">
          <Plus className="w-4 h-4" /> Nova transação
        </button>
      </div>

      {/* Filters */}
      <div className="card !p-4">
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar por nome..." className="input pl-10" data-testid="search-input"
            />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="input" data-testid="filter-type">
            <option value="">Todos os tipos</option>
            <option value="INCOME">Receitas</option>
            <option value="EXPENSE">Despesas</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input" data-testid="filter-category">
            <option value="">Todas as categorias</option>
            {effectiveCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      {/* List */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-8"><div className="skeleton h-16" /></div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Filter className="w-10 h-10 mx-auto text-slate-300" />
            <p className="mt-3 font-semibold">Nenhuma transação encontrada</p>
            <p className="text-sm text-slate-500 mt-1">Clique em "Nova transação" para começar.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                data-testid={`tx-row-${t.id}`}
              >
                <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {t.type === 'INCOME' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate flex items-center gap-2">
                    {t.title}
                    {t.recurring && <span className="chip bg-brand-purple/10 text-brand-purple !py-0.5 text-[10px]"><RefreshCw className="w-3 h-3" /> {t.recurringFrequency || 'recorrente'}</span>}
                    {t.totalInstallments && t.totalInstallments > 1 && t.installmentNumber && (
                      <span className="chip bg-blue-100 text-blue-600 !py-0.5 text-[10px]">
                        Parcela {t.installmentNumber}/{t.totalInstallments}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="chip bg-slate-100 dark:bg-slate-700 !py-0.5 text-slate-600 dark:text-slate-300">{t.category}</span>
                    <span className="chip bg-slate-100 dark:bg-slate-700 !py-0.5 text-slate-600 dark:text-slate-300">{t.paymentMethod || 'pix'}</span>
                    {t.currency !== 'BRL' && <span className="chip bg-slate-100 dark:bg-slate-700 !py-0.5 text-slate-600 dark:text-slate-300">{t.currency}</span>}
                    {dateBR(t.date)}
                  </div>
                  {t.totalInstallments && t.totalInstallments > 1 && t.installmentNumber && t.installmentNumber < t.totalInstallments && (
                    <div className="text-xs text-amber-600 mt-1">
                      Faltam {t.totalInstallments - t.installmentNumber} parcelas de {currency(t.amount, t.currency)} cada
                      {t.totalAmount && ` (total: ${currency(t.totalAmount, t.currency)})`}
                    </div>
                  )}
                </div>
                <div className={`font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'INCOME' ? '+' : '-'}{currency(t.amount)}
                </div>
                <div className="flex gap-1">
                  <button className="btn-ghost !p-2" onClick={() => openEdit(t)} data-testid={`edit-${t.id}`} title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="btn-ghost !p-2 hover:!text-red-600" onClick={() => onDelete(t)} data-testid={`delete-${t.id}`} title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <TxModal
            key={editing?.id || 'new'}
            editing={editing}
            budgets={budgets}
            categories={effectiveCategories}
            onClose={() => setOpen(false)}
            onSaved={() => { setOpen(false); fetchData(); fetchBudgets(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TxModal({ editing, onClose, onSaved, budgets, categories }: { editing: Transaction | null; budgets: Budget[]; categories: string[]; onClose: () => void; onSaved: () => void }) {
  const categoryOptions = categories.length ? categories : DEFAULT_CATEGORIES;
  const transactionCategories = Array.from(new Set([...(categoryOptions || []), ...(editing ? [editing.category] : [])]));
  const defaultCategory = editing ? editing.category : (transactionCategories[0] || DEFAULT_CATEGORIES[0]);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: yupResolver(schema) as any,
    defaultValues: editing
      ? {
        title: editing.title,
        amount: editing.amount,
        type: editing.type,
        category: editing.category,
        description: editing.description || '',
        date: dateISOForInput(editing.date),
        recurring: editing.recurring || false,
        recurringFrequency: (editing.recurringFrequency as any) || null,
        paymentMethod: editing.paymentMethod || 'pix',
        installments: editing.installments || 1,
        currency: editing.currency || 'BRL',
      }
      : { type: 'EXPENSE', category: defaultCategory, date: dateISOForInput(), description: '', recurring: false, recurringFrequency: null, paymentMethod: 'pix', installments: 1, currency: 'BRL' } as any,
  });

  const recurring = (editing?.recurring) ?? false;
  const [isRec, setIsRec] = React.useState<boolean>(recurring);

  const watchedCategory = watch('category');
  const watchedAmount = Number(watch('amount') || 0);
  const watchedPaymentMethod = watch('paymentMethod');
  const watchedInstallments = Number(watch('installments') || 1);
  const watchedCurrency = watch('currency') || 'BRL';
  const selectedBudget = budgets.find((b) => b.category === watchedCategory);
  const currentSpent = selectedBudget
    ? selectedBudget.spent - (editing && editing.type === 'EXPENSE' && editing.category === selectedBudget.category ? editing.amount : 0)
    : 0;
  const overLimit = selectedBudget ? currentSpent + watchedAmount > selectedBudget.limit : false;

  const onSubmit = async (data: Form) => {
    try {
      const payload: any = {
        ...data,
        date: new Date(data.date).toISOString(),
        recurring: isRec,
      };
      if (isRec) {
        payload.recurringFrequency = data.recurringFrequency || 'monthly';
      }

      if (payload.type === 'EXPENSE' && selectedBudget) {
        if (currentSpent + payload.amount > selectedBudget.limit) {
          const confirmed = window.confirm(
            `Você já chegou ao seu limite de ${currency(selectedBudget.limit)} para ${selectedBudget.category}. Tem certeza disso?`
          );
          if (!confirmed) return;
        }
      }

      if (editing) await api.put(`/api/transactions/${editing.id}`, payload);
      else await api.post('/api/transactions', payload);
      toast.success(editing ? 'Atualizado' : 'Criado');
      onSaved();
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6"
        data-testid="tx-modal"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{editing ? 'Editar transação' : 'Nova transação'}</h2>
          <button onClick={onClose} className="btn-ghost !p-2"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3" data-testid="tx-form">
          <div>
            <label className="text-sm font-medium">Título</label>
            <input {...register('title')} className="input mt-1" data-testid="tx-title" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Valor (R$)</label>
              <input type="number" step="0.01" {...register('amount')} className="input mt-1" data-testid="tx-amount" />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Data</label>
              <input type="date" {...register('date')} className="input mt-1" data-testid="tx-date" />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <select {...register('type')} className="input mt-1" data-testid="tx-type">
                <option value="EXPENSE">Despesa</option>
                <option value="INCOME">Receita</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <select {...register('category')} className="input mt-1" data-testid="tx-category" disabled={transactionCategories.length === 0}>
                {transactionCategories.length === 0 ? (
                  <option value="">Configure categorias no onboarding</option>
                ) : (
                  transactionCategories.map((c) => <option key={c} value={c}>{c}</option>)
                )}
              </select>
              {selectedBudget && (
                <p className="text-xs mt-2 text-slate-500">
                  Orçamento: {currency(selectedBudget.limit)} · Gasto atual: {currency(currentSpent)}
                  {overLimit && ' · Ultrapassará o limite'}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Método de Pagamento</label>
              <select {...register('paymentMethod')} className="input mt-1" data-testid="tx-payment-method">
                <option value="pix">PIX</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Moeda</label>
              <select {...register('currency')} className="input mt-1" data-testid="tx-currency">
                <option value="BRL">Real (BRL)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">Libra (GBP)</option>
              </select>
            </div>
          </div>
          {watchedPaymentMethod === 'credito' && (
            <div>
              <label className="text-sm font-medium">Parcelas</label>
              <input type="number" min="1" max="60" {...register('installments')} className="input mt-1" data-testid="tx-installments" />
              {errors.installments && <p className="text-xs text-red-500 mt-1">{errors.installments.message}</p>}
            </div>
          )}
          {watchedPaymentMethod === 'credito' && watchedInstallments > 1 && (
            <div>
              <label className="text-sm font-medium">Valor Total</label>
              <input type="text" value={currency(watchedAmount * watchedInstallments, watchedCurrency)} readOnly className="input mt-1 bg-slate-50 dark:bg-slate-800" />
            </div>
          )}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRec}
                onChange={(e) => setIsRec(e.target.checked)}
                className="w-4 h-4 rounded accent-brand-blue"
                data-testid="tx-recurring"
              />
              <span className="text-sm font-medium">Transação recorrente</span>
              <RefreshCw className="w-4 h-4 text-brand-purple ml-auto" />
            </label>
            {isRec && (
              <div className="mt-2">
                <label className="text-xs text-slate-500">Frequência</label>
                <select {...register('recurringFrequency')} className="input mt-1" data-testid="tx-recurring-frequency" defaultValue={editing?.recurringFrequency || 'monthly'}>
                  <option value="monthly">Mensal</option>
                  <option value="weekly">Semanal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Descrição (opcional)</label>
            <textarea {...register('description')} rows={2} className="input mt-1" data-testid="tx-description" />
          </div>
          {editing && watchedPaymentMethod === 'credito' && watchedInstallments > 1 && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Faltam {watchedInstallments - 1} parcelas de {currency(watchedAmount / watchedInstallments, watchedCurrency)}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || transactionCategories.length === 0} data-testid="tx-save">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
