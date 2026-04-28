import React, { useEffect, useState } from 'react';
import { Users, Search, Shield, Ban, Unlock, Trash2, Eye, X, TrendingUp, Target, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../services/api';
import { User, Transaction, Goal, Category } from '../types';
import { currency, dateBR } from '../utils/format';

interface AdminStats {
  totalUsers: number; totalAdmins: number; blockedUsers: number;
  totalTransactions: number; totalGoals: number;
  globalIncome: number; globalExpense: number;
  freeUsers: number; basicUsers: number; proUsers: number; totalRevenue: number;
}

export default function Admin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const loadAll = async () => {
    const [s, u] = await Promise.all([
      api.get('/api/admin/stats'),
      api.get('/api/users', { params: q ? { search: q } : {} }),
    ]);
    setStats(s.data); setUsers(u.data);
  };
  useEffect(() => { loadAll().catch((e) => toast.error(apiErrorMessage(e))); /* eslint-disable-next-line */ }, [q]);

  const toggleBlock = async (u: User) => {
    try {
      await api.put(`/api/users/${u.id}`, { blocked: !u.blocked });
      toast.success(!u.blocked ? 'Usuário bloqueado' : 'Usuário desbloqueado');
      loadAll();
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  const toggleRole = async (u: User) => {
    const newRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await api.put(`/api/users/${u.id}`, { role: newRole });
      toast.success(`Permissão alterada para ${newRole}`);
      loadAll();
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  const onDelete = async (u: User) => {
    if (!window.confirm(`Excluir usuário ${u.email}?`)) return;
    try { await api.delete(`/api/users/${u.id}`); toast.success('Excluído'); loadAll(); }
    catch (e) { toast.error(apiErrorMessage(e)); }
  };

  return (
    <div className="space-y-6" data-testid="admin-page">
      <div>
        <div className="chip bg-amber-100 text-amber-700 border border-amber-200 mb-2">
          <Shield className="w-3.5 h-3.5" /> Painel administrativo
        </div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">Gestão Global</h1>
        <p className="text-slate-500 mt-1">Gerencie usuários e visualize estatísticas</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Usuários', value: stats.totalUsers, icon: Users, color: 'from-brand-blue to-brand-purple' },
            { label: 'Admins', value: stats.totalAdmins, icon: Shield, color: 'from-amber-500 to-orange-500' },
            { label: 'Transações', value: stats.totalTransactions, icon: Activity, color: 'from-emerald-500 to-green-500' },
            { label: 'Metas', value: stats.totalGoals, icon: Target, color: 'from-brand-purple to-pink-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card relative overflow-hidden">
              <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${s.color} opacity-10 blur-xl`} />
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{s.label}</div>
              <div className="text-2xl font-display font-bold mt-1">{s.value}</div>
            </motion.div>
          ))}
        </div>
      )}
      {stats && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <div className="flex items-center gap-2 text-slate-500 text-sm"><TrendingUp className="w-4 h-4" /> Volume global — Receitas</div>
            <div className="text-3xl font-display font-bold text-emerald-600 mt-1">{currency(stats.globalIncome)}</div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 text-slate-500 text-sm"><TrendingUp className="w-4 h-4 rotate-180" /> Volume global — Despesas</div>
            <div className="text-3xl font-display font-bold text-rose-600 mt-1">{currency(stats.globalExpense)}</div>
          </div>
        </div>
      )}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Free', value: stats.freeUsers, icon: Users, color: 'from-slate-500 to-slate-700' },
            { label: 'Basic', value: stats.basicUsers, icon: Zap, color: 'from-blue-500 to-blue-600' },
            { label: 'Pro', value: stats.proUsers, icon: Shield, color: 'from-purple-500 to-pink-500' },
            { label: 'Receita', value: currency(stats.totalRevenue), icon: TrendingUp, color: 'from-emerald-500 to-green-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card relative overflow-hidden">
              <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${s.color} opacity-10 blur-xl`} />
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{s.label}</div>
              <div className="text-2xl font-display font-bold mt-1">{s.value}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="card !p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou e-mail..." className="input pl-10" data-testid="admin-search" />
        </div>
      </div>

      {/* Users table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-5 py-3 font-semibold">Usuário</th>
                <th className="px-5 py-3 font-semibold">E-mail</th>
                <th className="px-5 py-3 font-semibold">Papel</th>
                <th className="px-5 py-3 font-semibold">Plano</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Criado em</th>
                <th className="px-5 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users === null ? (
                <tr><td colSpan={7} className="p-6"><div className="skeleton h-8" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-slate-400">Nenhum usuário encontrado</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} data-testid={`user-row-${u.id}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`chip ${u.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`chip ${u.plan === 'PRO' ? 'bg-purple-100 text-purple-700' :
                      u.plan === 'BASIC' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>{u.plan || 'FREE'}</span>
                  </td>
                  <td className="px-5 py-3">
                    {u.blocked
                      ? <span className="chip bg-red-100 text-red-700">Bloqueado</span>
                      : <span className="chip bg-emerald-100 text-emerald-700">Ativo</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{dateBR(u.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="btn-ghost !p-2" title="Ver detalhes" onClick={() => setSelected(u.id)} data-testid={`view-${u.id}`}><Eye className="w-4 h-4" /></button>
                      <button className="btn-ghost !p-2" title="Alternar papel" onClick={() => toggleRole(u)} data-testid={`role-${u.id}`}><Shield className="w-4 h-4" /></button>
                      <button className="btn-ghost !p-2" title={u.blocked ? 'Desbloquear' : 'Bloquear'} onClick={() => toggleBlock(u)} data-testid={`block-${u.id}`}>
                        {u.blocked ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                      <button className="btn-ghost !p-2 hover:!text-red-600" title="Excluir" onClick={() => onDelete(u)} data-testid={`delete-user-${u.id}`}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selected && <UserDetail userId={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function UserDetail({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [data, setData] = useState<{ user: User; transactions: Transaction[]; goals: Goal[]; categories: Category[] } | null>(null);
  const [editingPlan, setEditingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'BASIC' | 'PRO' | null>(null);
  const [editingUser, setEditingUser] = useState(false);
  const [selectedRole, setSelectedRole] = useState<User['role']>('USER');
  const [blocked, setBlocked] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [usageType, setUsageType] = useState<'pessoal' | 'empresarial' | 'organizar'>('pessoal');
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [businessPurpose, setBusinessPurpose] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [categoriesInput, setCategoriesInput] = useState('');

  const parseCategories = (value: string) => Array.from(new Set(value.split(/[\n,]+/).map((name) => name.trim()).filter(Boolean)));

  useEffect(() => {
    api.get(`/api/users/${userId}`).then((r) => {
      setData(r.data);
      setSelectedPlan(r.data.user.plan || 'FREE');
      setSelectedRole(r.data.user.role);
      setBlocked(r.data.user.blocked);
      setHasCompletedOnboarding(!!r.data.user.hasCompletedOnboarding);
      setUsageType(r.data.user.usageType || 'pessoal');
      setCompanyName(r.data.user.companyName || '');
      setCompanyLogo(r.data.user.companyLogo || '');
      setBusinessPurpose(r.data.user.businessPurpose || '');
      setPrimaryColor(r.data.user.primaryColor || '');
      setCategoriesInput((r.data.categories || []).map((c: Category) => c.name).join('\n'));
    }).catch((e) => toast.error(apiErrorMessage(e)));
  }, [userId]);

  const savePlan = async () => {
    if (!selectedPlan || !data) return;
    try {
      const payload: any = { plan: selectedPlan };
      if (selectedPlan === 'PRO' && data.user.plan !== 'PRO') {
        payload.hasCompletedOnboarding = false;
      }
      await api.put(`/api/users/${userId}`, payload);
      toast.success('Plano alterado com sucesso');
      setData({ ...data, user: { ...data.user, plan: selectedPlan } });
      setEditingPlan(false);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const saveUserSettings = async () => {
    if (!data) return;
    try {
      await api.put(`/api/users/${userId}`, {
        role: selectedRole,
        blocked,
        hasCompletedOnboarding,
        usageType,
        companyName: companyName || null,
        companyLogo: companyLogo || null,
        businessPurpose: businessPurpose || null,
        primaryColor: primaryColor || null,
        categories: parseCategories(categoriesInput),
      });
      toast.success('Configurações salvas com sucesso');
      setEditingUser(false);
      const r = await api.get(`/api/users/${userId}`);
      setData(r.data);
      setSelectedPlan(r.data.user.plan || 'FREE');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const planColors = {
    FREE: 'from-slate-500 to-slate-600',
    BASIC: 'from-blue-500 to-blue-600',
    PRO: 'from-purple-500 to-purple-600',
  };

  const planDescriptions = {
    FREE: 'Até 100 transações/mês',
    BASIC: '500 transações/mês + IA',
    PRO: 'Ilimitado + IA avançada',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-auto p-6"
        onClick={(e) => e.stopPropagation()} data-testid="user-detail-modal">
        {!data ? (
          <div className="space-y-3"><div className="skeleton h-8 w-1/2" /><div className="skeleton h-40" /></div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white font-bold text-lg">
                  {data.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl">{data.user.name}</h2>
                  <p className="text-sm text-slate-500">{data.user.email} · {data.user.role}</p>
                </div>
              </div>
              <button onClick={onClose} className="btn-ghost !p-2"><X className="w-4 h-4" /></button>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="card !p-4">
                <div className="text-xs text-slate-500">Transações</div>
                <div className="text-xl font-bold">{data.transactions.length}</div>
              </div>
              <div className="card !p-4">
                <div className="text-xs text-slate-500">Metas</div>
                <div className="text-xl font-bold">{data.goals.length}</div>
              </div>
              <div className="card !p-4">
                <div className="text-xs text-slate-500">Saldo</div>
                <div className="text-xl font-bold">
                  {currency(
                    data.transactions.reduce((s, t) => s + (t.type === 'INCOME' ? t.amount : -t.amount), 0)
                  )}
                </div>
              </div>
            </div>

            {/* Plano Section */}
            <div className="mt-6 card !p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-lg">Plano</h3>
                </div>
                {!editingPlan && (
                  <button onClick={() => setEditingPlan(true)} className="btn-primary !py-1.5 !px-3 !text-sm">
                    Alterar
                  </button>
                )}
              </div>

              {editingPlan ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {(['FREE', 'BASIC', 'PRO'] as const).map((plan) => (
                      <button
                        key={plan}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-4 rounded-xl border-2 transition-all ${selectedPlan === plan
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                      >
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r ${planColors[plan]} mb-2`}>
                          {plan}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{planDescriptions[plan]}</p>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={savePlan} className="btn-primary flex-1">
                      Salvar
                    </button>
                    <button onClick={() => setEditingPlan(false)} className="btn-ghost flex-1">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r bg-slate-50 dark:bg-slate-800">
                  <div className={`inline-block px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r ${planColors[data.user.plan as 'FREE' | 'BASIC' | 'PRO' || 'FREE']}`}>
                    {data.user.plan || 'FREE'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {planDescriptions[data.user.plan as 'FREE' | 'BASIC' | 'PRO' || 'FREE']}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 card !p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-700" />
                  <h3 className="font-semibold text-lg">Configurações da conta</h3>
                </div>
                {!editingUser ? (
                  <button onClick={() => setEditingUser(true)} className="btn-primary !py-1.5 !px-3 !text-sm">
                    Editar conta
                  </button>
                ) : null}
              </div>

              {editingUser ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">Nome</label>
                      <input value={data.user.name} readOnly className="input w-full" />
                    </div>
                    <div>
                      <label className="label">Papel</label>
                      <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as User['role'])} className="input w-full">
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">Bloqueado</label>
                      <select value={blocked ? 'yes' : 'no'} onChange={(e) => setBlocked(e.target.value === 'yes')} className="input w-full">
                        <option value="no">Não</option>
                        <option value="yes">Sim</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Onboarding completo</label>
                      <select value={hasCompletedOnboarding ? 'yes' : 'no'} onChange={(e) => setHasCompletedOnboarding(e.target.value === 'yes')} className="input w-full">
                        <option value="yes">Sim</option>
                        <option value="no">Não</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">Uso</label>
                      <select value={usageType} onChange={(e) => setUsageType(e.target.value as 'pessoal' | 'empresarial' | 'organizar')} className="input w-full">
                        <option value="pessoal">Pessoal</option>
                        <option value="empresarial">Empresarial</option>
                        <option value="organizar">Organizar</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Cor principal</label>
                      <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#7C3AED" className="input w-full" />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">Nome da empresa</label>
                      <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input w-full" />
                    </div>
                    <div>
                      <label className="label">Logo da empresa (URL)</label>
                      <input value={companyLogo} onChange={(e) => setCompanyLogo(e.target.value)} className="input w-full" />
                    </div>
                  </div>

                  <div>
                    <label className="label">Finalidade</label>
                    <textarea value={businessPurpose} onChange={(e) => setBusinessPurpose(e.target.value)} className="input w-full min-h-[90px]" />
                  </div>

                  <div>
                    <label className="label">Categorias</label>
                    <textarea value={categoriesInput} onChange={(e) => setCategoriesInput(e.target.value)} className="input w-full min-h-[90px]" placeholder="Digite uma categoria por linha ou separadas por vírgula" />
                    <p className="text-xs text-slate-500 mt-1">As categorias serão atualizadas para este usuário.</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={saveUserSettings} className="btn-primary flex-1">Salvar conta</button>
                    <button onClick={() => setEditingUser(false)} className="btn-ghost flex-1">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Papel</div>
                      <div className="mt-2 font-semibold">{data.user.role}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Onboarding</div>
                      <div className="mt-2 font-semibold">{data.user.hasCompletedOnboarding ? 'Concluído' : 'Pendente'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Uso</div>
                      <div className="mt-2 font-semibold">{data.user.usageType || 'pessoal'}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Empresa</div>
                      <div className="mt-2 font-semibold">{data.user.companyName || 'Nenhuma'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Categoria principal</div>
                      <div className="mt-2 font-semibold">{data.categories.slice(0, 3).map((c) => c.name).join(', ') || 'Sem categorias'}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Cor</div>
                      <div className="mt-2 font-semibold">{data.user.primaryColor || 'Padrão'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Últimas transações</h3>
              <div className="space-y-1.5 max-h-60 overflow-auto">
                {data.transactions.slice(0, 20).map((t) => (
                  <div key={t.id} className="flex justify-between text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span>{t.title} <span className="text-slate-400 text-xs">· {t.category}</span></span>
                    <span className={t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}>
                      {t.type === 'INCOME' ? '+' : '-'}{currency(t.amount)}
                    </span>
                  </div>
                ))}
                {data.transactions.length === 0 && <p className="text-sm text-slate-400">Sem transações</p>}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-2">Metas</h3>
              <div className="space-y-2">
                {data.goals.map((g) => {
                  const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
                  return (
                    <div key={g.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>{g.title}</span><span>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-brand-blue to-brand-purple" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {data.goals.length === 0 && <p className="text-sm text-slate-400">Sem metas</p>}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
