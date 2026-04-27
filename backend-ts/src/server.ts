import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

dotenv.config();
process.env.DATABASE_URL ||= 'file:./dev.db';

const app = express();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

const JWT_SECRET = process.env.JWT_SECRET || 'finix-dev-secret';
const JWT_EXPIRES_IN = '7d';
app.use(cors({
  origin: [
    "https://finixxapp.vercel.app",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ============================================================================
// PLANS CONFIGURATION
// ============================================================================
export const PLANS: Record<string, {
  id: string; name: string; price: number; currency: string;
  transactionsLimit: number; categoriesLimit: number; goalsLimit: number;
  hasAI: boolean; hasAdvancedAI: boolean; hasPDF: boolean; hasExcel: boolean;
  hasPrioritySupport: boolean;
}> = {
  FREE: {
    id: 'FREE', name: 'Grátis', price: 0, currency: 'BRL',
    transactionsLimit: 100, categoriesLimit: 3, goalsLimit: 2,
    hasAI: false, hasAdvancedAI: false, hasPDF: false, hasExcel: false,
    hasPrioritySupport: false,
  },
  BASIC: {
    id: 'BASIC', name: 'Básico', price: 10, currency: 'BRL',
    transactionsLimit: 500, categoriesLimit: 999, goalsLimit: 5,
    hasAI: true, hasAdvancedAI: false, hasPDF: true, hasExcel: false,
    hasPrioritySupport: false,
  },
  PRO: {
    id: 'PRO', name: 'Pro', price: 35, currency: 'BRL',
    transactionsLimit: -1, categoriesLimit: 999, goalsLimit: -1,
    hasAI: true, hasAdvancedAI: true, hasPDF: true, hasExcel: true,
    hasPrioritySupport: true,
  },
};

const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Reset monthly counter if month changed
const resetMonthlyIfNeeded = async (userId: string, currentMonth: string) => {
  const mk = currentMonthKey();
  if (currentMonth !== mk) {
    await prisma.user.update({
      where: { id: userId },
      data: { transactionsUsed: 0, transactionsMonth: mk },
    });
    return 0;
  }
  return null;
};

// ============================================================================
// MIDDLEWARE
// ============================================================================
const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  const token = auth.substring(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.blocked) {
      return res.status(401).json({ error: 'Usuário não encontrado ou bloqueado' });
    }
    // Auto-reset monthly counter if month changed
    const reset = await resetMonthlyIfNeeded(user.id, user.transactionsMonth);
    if (reset !== null) {
      user.transactionsUsed = 0;
      user.transactionsMonth = currentMonthKey();
    }
    (req as any).user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado (admin)' });
  }
  next();
};

// Require specific feature gated by plan
const requireFeature = (feature: 'hasAI' | 'hasAdvancedAI' | 'hasPDF' | 'hasExcel') =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    const plan = PLANS[user.plan] || PLANS.FREE;
    if (!plan[feature]) {
      return res.status(403).json({
        error: 'Recurso não disponível no seu plano',
        requiredFeature: feature,
        currentPlan: user.plan,
        upgrade: true,
      });
    }
    next();
  };

// ============================================================================
// SCHEMAS
// ============================================================================
const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const transactionSchema = z.object({
  title: z.string().min(1).max(120),
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string(),
  description: z.string().optional(),
  date: z.string().transform((str) => new Date(str)),
  recurring: z.boolean().optional().default(false),
  recurringFrequency: z.enum(['monthly', 'weekly', 'yearly']).optional().nullable(),
  paymentMethod: z.enum(['credito', 'debito', 'pix']).optional().default('pix'),
  installments: z.number().min(1).max(60).optional().default(1),
  currency: z.enum(['BRL', 'USD', 'EUR', 'GBP']).optional().default('BRL'),
});

const goalSchema = z.object({
  title: z.string().min(1).max(120),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).optional().default(0),
  deadline: z.string().transform((str) => new Date(str)),
});

const budgetSchema = z.object({
  category: z.string(),
  limit: z.number().positive(),
});

const profileUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).max(128).optional(),
  photo: z.string().optional(),
});

const userUpdateSchema = z.object({
  name: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  blocked: z.boolean().optional(),
  plan: z.enum(['FREE', 'BASIC', 'PRO']).optional(),
});

// ============================================================================
// HELPERS
// ============================================================================
const userPublic = (u: any) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, blocked: u.blocked,
  photo: u.photo, plan: u.plan, transactionsUsed: u.transactionsUsed,
  stripeCustomerId: u.stripeCustomerId, stripeSubscriptionId: u.stripeSubscriptionId,
  planExpiresAt: u.planExpiresAt, createdAt: u.createdAt,
});

// ============================================================================
// AUTH
// ============================================================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        name: data.name.trim(),
        email: data.email.toLowerCase(),
        passwordHash: await bcrypt.hash(data.password, 10),
        plan: 'FREE',
        transactionsMonth: currentMonthKey(),
      },
    });
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ user: userPublic(user), token });
  } catch (err: any) {
    console.error('Register error:', err);
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    res.status(500).json({ error: err.message || 'Erro ao criar conta' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash)) || user.blocked) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ user: userPublic(user), token });
  } catch (err: any) {
    console.error('Login error:', err);
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    res.status(500).json({ error: err.message || 'Erro ao fazer login' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = (req as any).user;
  const plan = PLANS[user.plan] || PLANS.FREE;
  res.json({ ...userPublic(user), planDetails: plan });
});

// ============================================================================
// PLANS
// ============================================================================
app.get('/api/plans', (req, res) => {
  res.json(Object.values(PLANS));
});

app.get('/api/plans/me', authenticate, (req, res) => {
  const user = (req as any).user;
  const plan = PLANS[user.plan] || PLANS.FREE;
  res.json({
    plan: user.plan,
    planDetails: plan,
    transactionsUsed: user.transactionsUsed,
    transactionsMonth: user.transactionsMonth,
    stripeSubscriptionId: user.stripeSubscriptionId,
    planExpiresAt: user.planExpiresAt,
  });
});

// ============================================================================
// TRANSACTIONS (with plan gate)
// ============================================================================
app.get('/api/transactions', authenticate, async (req, res) => {
  const user = (req as any).user;
  const { type, category, search, startDate, endDate } = req.query;
  const where: any = { userId: user.id };
  if (type) where.type = type;
  if (category) where.category = category;
  if (search) where.title = { contains: search as string };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }
  const transactions = await prisma.transaction.findMany({ where, orderBy: { date: 'desc' } });
  res.json(transactions);
});

app.post('/api/transactions', authenticate, async (req, res) => {
  const user = (req as any).user;
  const data = transactionSchema.parse(req.body);
  const plan = PLANS[user.plan] || PLANS.FREE;

  // Enforce transaction limit (monthly)
  if (plan.transactionsLimit !== -1 && user.transactionsUsed >= plan.transactionsLimit) {
    return res.status(403).json({
      error: `Limite mensal de ${plan.transactionsLimit} transações atingido. Faça upgrade do seu plano.`,
      upgrade: true,
      currentPlan: user.plan,
      limit: plan.transactionsLimit,
      used: user.transactionsUsed,
    });
  }

  // Enforce categories limit (FREE only)
  if (plan.categoriesLimit !== 999) {
    const distinctCats = await prisma.transaction.findMany({
      where: { userId: user.id },
      select: { category: true },
      distinct: ['category'],
    });
    const existingCats = new Set(distinctCats.map(c => c.category));
    if (!existingCats.has(data.category) && existingCats.size >= plan.categoriesLimit) {
      return res.status(403).json({
        error: `Plano ${plan.name} permite até ${plan.categoriesLimit} categorias. Faça upgrade para criar mais.`,
        upgrade: true,
      });
    }
  }

  let transaction;
  if (data.installments > 1) {
    const totalAmount = data.amount * data.installments;
    const pricePerInstallment = data.amount;
    const formattedTitle = `${data.title} (Total: R$ ${totalAmount.toFixed(2)} - ${data.installments}x de R$ ${pricePerInstallment.toFixed(2)})`;
    transaction = await prisma.transaction.create({
      data: {
        ...data,
        id: uuidv4(),
        userId: user.id,
        title: formattedTitle,
        amount: pricePerInstallment,
        totalInstallments: data.installments,
        totalAmount,
      },
    });
  } else {
    transaction = await prisma.transaction.create({
      data: { ...data, id: uuidv4(), userId: user.id },
    });
  }

  // Increment counter
  await prisma.user.update({
    where: { id: user.id },
    data: { transactionsUsed: { increment: 1 } },
  });

  res.json(transaction);
});

app.put('/api/transactions/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  const data = transactionSchema.parse(req.body);
  const transaction = await prisma.transaction.updateMany({
    where: { id: String(req.params.id), userId: user.id },
    data,
  });
  if (transaction.count === 0) return res.status(404).json({ error: 'Transação não encontrada' });
  const updated = await prisma.transaction.findUnique({ where: { id: String(req.params.id) } });
  res.json(updated);
});

app.delete('/api/transactions/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  const deleted = await prisma.transaction.deleteMany({ where: { id: String(req.params.id), userId: user.id } });
  if (deleted.count === 0) return res.status(404).json({ error: 'Transação não encontrada' });
  res.json({ ok: true });
});

// ============================================================================
// GOALS (with plan gate)
// ============================================================================
app.get('/api/goals', authenticate, async (req, res) => {
  const user = (req as any).user;
  const goals = await prisma.goal.findMany({ where: { userId: user.id }, orderBy: { deadline: 'asc' } });
  res.json(goals);
});

app.post('/api/goals', authenticate, async (req, res) => {
  const user = (req as any).user;
  const data = goalSchema.parse(req.body);
  const plan = PLANS[user.plan] || PLANS.FREE;

  if (plan.goalsLimit !== -1) {
    const count = await prisma.goal.count({ where: { userId: user.id } });
    if (count >= plan.goalsLimit) {
      return res.status(403).json({
        error: `Plano ${plan.name} permite até ${plan.goalsLimit} metas. Faça upgrade.`,
        upgrade: true,
      });
    }
  }

  const goal = await prisma.goal.create({ data: { ...data, id: uuidv4(), userId: user.id } });
  res.json(goal);
});

app.put('/api/goals/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  const data = goalSchema.parse(req.body);
  const goal = await prisma.goal.updateMany({
    where: { id: String(req.params.id), userId: user.id },
    data,
  });
  if (goal.count === 0) return res.status(404).json({ error: 'Meta não encontrada' });
  const updated = await prisma.goal.findUnique({ where: { id: String(req.params.id) } });
  res.json(updated);
});

app.delete('/api/goals/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  const deleted = await prisma.goal.deleteMany({ where: { id: String(req.params.id), userId: user.id } });
  if (deleted.count === 0) return res.status(404).json({ error: 'Meta não encontrada' });
  res.json({ ok: true });
});

// ============================================================================
// BUDGETS
// ============================================================================
app.get('/api/budgets', authenticate, async (req, res) => {
  const user = (req as any).user;
  const budgets = await prisma.budget.findMany({ where: { userId: user.id } });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id, type: 'EXPENSE', date: { gte: monthStart } },
  });
  const spentByCategory: Record<string, number> = {};
  transactions.forEach(t => {
    spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
  });
  const result = budgets.map(b => ({
    ...b,
    spent: spentByCategory[b.category] || 0,
    percentage: b.limit > 0 ? ((spentByCategory[b.category] || 0) / b.limit) * 100 : 0,
  }));
  res.json(result);
});

app.post('/api/budgets', authenticate, async (req, res) => {
  const user = (req as any).user;
  const data = budgetSchema.parse(req.body);
  try {
    const budget = await prisma.budget.create({ data: { ...data, id: uuidv4(), userId: user.id } });
    res.json(budget);
  } catch {
    res.status(400).json({ error: 'Já existe um orçamento para esta categoria' });
  }
});

app.put('/api/budgets/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  const data = budgetSchema.parse(req.body);
  const budget = await prisma.budget.updateMany({
    where: { id: String(req.params.id), userId: user.id },
    data,
  });
  if (budget.count === 0) return res.status(404).json({ error: 'Orçamento não encontrado' });
  const updated = await prisma.budget.findUnique({ where: { id: String(req.params.id) } });
  res.json(updated);
});

app.delete('/api/budgets/:id', authenticate, async (req, res) => {
  const user = (req as any).user;
  const deleted = await prisma.budget.deleteMany({ where: { id: String(req.params.id), userId: user.id } });
  if (deleted.count === 0) return res.status(404).json({ error: 'Orçamento não encontrado' });
  res.json({ ok: true });
});

// ============================================================================
// PROFILE
// ============================================================================
app.put('/api/profile', authenticate, async (req, res) => {
  const user = (req as any).user;
  const data = profileUpdateSchema.parse(req.body);
  const updates: any = {};
  if (data.name) updates.name = data.name.trim();
  if (data.photo) updates.photo = data.photo;
  if (data.newPassword) {
    if (!data.currentPassword || !(await bcrypt.compare(data.currentPassword, user.passwordHash))) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }
    updates.passwordHash = await bcrypt.hash(data.newPassword, 10);
  }
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nada para atualizar' });
  const updatedUser = await prisma.user.update({ where: { id: user.id }, data: updates });
  res.json(userPublic(updatedUser));
});

// ============================================================================
// DASHBOARD
// ============================================================================
app.get('/api/dashboard', authenticate, async (req, res) => {
  const user = (req as any).user;
  const transactions = await prisma.transaction.findMany({ where: { userId: user.id } });
  const goals = await prisma.goal.findMany({ where: { userId: user.id } });

  const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const saved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const balance = income - expense - saved;

  const now = new Date();
  const months: Date[] = [];
  for (let i = 5; i >= 0; i--) {
    const y = now.getFullYear();
    const m = now.getMonth() - i;
    const d = new Date(y, m < 0 ? m + 12 : m, 1);
    if (m < 0) d.setFullYear(y - 1);
    months.push(d);
  }
  const monthly = months.map(start => {
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const inc = transactions.filter(t => t.type === 'INCOME' && t.date >= start && t.date < end).reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'EXPENSE' && t.date >= start && t.date < end).reduce((s, t) => s + t.amount, 0);
    return { month: start.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), income: inc, expense: exp };
  });

  const byCat: Record<string, number> = {};
  transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  });
  const categories = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([category, amount]) => ({ category, amount }));

  const insights: any[] = [];
  if (monthly.length >= 2) {
    const cur = monthly[monthly.length - 1].expense;
    const prev = monthly[monthly.length - 2].expense;
    if (prev > 0) {
      const diff = ((cur - prev) / prev) * 100;
      if (diff > 10) insights.push({ type: 'warning', title: 'Gastos aumentaram', message: `Você gastou ${diff.toFixed(0)}% a mais este mês.` });
      else if (diff < -10) insights.push({ type: 'success', title: 'Ótimo controle', message: `Você economizou ${Math.abs(diff).toFixed(0)}% em relação ao mês passado.` });
    }
  }
  if (categories.length > 0) {
    const top = categories[0];
    if (expense > 0 && top.amount / expense > 0.4) insights.push({ type: 'info', title: 'Categoria dominante', message: `${top.category} representa ${(top.amount / expense * 100).toFixed(0)}% dos seus gastos.` });
  }
  if (balance < 0) insights.push({ type: 'warning', title: 'Atenção ao saldo', message: 'Suas despesas superam as receitas.' });
  else if (income > 0 && balance / income > 0.3) insights.push({ type: 'success', title: 'Você está no caminho certo', message: `Economizou ${(balance / income * 100).toFixed(0)}% da sua renda.` });

  const recent = transactions.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  res.json({ balance, income, expense, saved, monthly, categories, recent, insights });
});

// ============================================================================
// ADMIN
// ============================================================================
app.get('/api/users', authenticate, requireAdmin, async (req, res) => {
  const { search } = req.query;
  const where: any = {};
  if (search) where.OR = [{ name: { contains: search as string } }, { email: { contains: search as string } }];
  const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(users.map(userPublic));
});

app.get('/api/users/:id', authenticate, requireAdmin, async (req, res) => {
  const userId = String(req.params.id);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  const transactions = await prisma.transaction.findMany({ where: { userId } });
  const goals = await prisma.goal.findMany({ where: { userId } });
  res.json({ user: userPublic(user), transactions, goals });
});

app.put('/api/users/:id', authenticate, requireAdmin, async (req, res) => {
  const data = userUpdateSchema.parse(req.body);
  const userId = String(req.params.id);
  const updated = await prisma.user.update({ where: { id: userId }, data });
  res.json(userPublic(updated));
});

app.delete('/api/users/:id', authenticate, requireAdmin, async (req, res) => {
  const admin = (req as any).user;
  if (req.params.id === admin.id) return res.status(400).json({ error: 'Não é possível deletar a si mesmo' });
  await prisma.user.delete({ where: { id: String(req.params.id) } });
  res.json({ ok: true });
});

app.get('/api/admin/stats', authenticate, requireAdmin, async (req, res) => {
  const totalUsers = await prisma.user.count();
  const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
  const totalBlocked = await prisma.user.count({ where: { blocked: true } });
  const totalTx = await prisma.transaction.count();
  const totalGoals = await prisma.goal.count();
  const freeUsers = await prisma.user.count({ where: { plan: 'FREE' } });
  const basicUsers = await prisma.user.count({ where: { plan: 'BASIC' } });
  const proUsers = await prisma.user.count({ where: { plan: 'PRO' } });
  const paidTxs = await prisma.paymentTransaction.findMany({ where: { paymentStatus: 'paid' } });
  const totalRevenue = paidTxs.reduce((s, t) => s + t.amount, 0);
  const agg = await prisma.transaction.groupBy({ by: ['type'], _sum: { amount: true } });
  const income = agg.find(a => a.type === 'INCOME')?._sum.amount || 0;
  const expense = agg.find(a => a.type === 'EXPENSE')?._sum.amount || 0;
  res.json({
    totalUsers, totalAdmins, blockedUsers: totalBlocked,
    totalTransactions: totalTx, totalGoals,
    globalIncome: income, globalExpense: expense,
    freeUsers, basicUsers, proUsers, totalRevenue,
  });
});

// ============================================================================
// AI INSIGHTS (gated by plan)
// ============================================================================
app.post('/api/insights/ai', authenticate, requireFeature('hasAI'), async (req, res) => {
  const user = (req as any).user;
  const plan = PLANS[user.plan];
  const transactions = await prisma.transaction.findMany({ where: { userId: user.id }, orderBy: { date: 'desc' } });
  const goals = await prisma.goal.findMany({ where: { userId: user.id } });

  if (transactions.length === 0) {
    return res.json({ insights: [{ type: 'info', title: 'Sem dados suficientes', message: 'Adicione algumas transações para receber análises personalizadas.' }] });
  }

  try {
    const apiKey = process.env.EMERGENT_LLM_KEY;
    if (!apiKey) {
      const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
      const balance = income - expense;
      return res.json({
        insights: [
          { type: 'success', title: 'Análise dos seus gastos', message: `Renda total: R$ ${income.toFixed(2)} | Despesas: R$ ${expense.toFixed(2)} | Saldo: R$ ${balance.toFixed(2)}` },
        ],
      });
    }

    const summary = transactions.slice(0, 15).map(t => `${t.title}: R$ ${t.amount} (${t.type}/${t.category})`).join(', ');
    const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const advanced = plan.hasAdvancedAI ? 'avançada, com recomendações específicas de investimento, economia e planejamento' : 'básica, com observações gerais';

    const prompt = `Analise as finanças dessa pessoa e forneça ${plan.hasAdvancedAI ? 5 : 3} insights úteis (${advanced}).
Renda total: R$ ${income.toFixed(2)}
Despesas totais: R$ ${expense.toFixed(2)}
Metas: ${goals.length}
Últimas transações: ${summary}

Responda APENAS com um JSON válido no formato:
{ "insights": [{ "type": "success|warning|info", "title": "...", "message": "..." }] }
Seja conciso, prático e em português.`;

    const response = await fetch('https://integrations.emergentagent.com/llm/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json() as any;
    let insights: any[] = [{ type: 'success', title: 'Análise de IA', message: 'Análise concluída.' }];
    if (data.content && data.content[0]) {
      try {
        const text = data.content[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) insights = JSON.parse(jsonMatch[0]).insights || insights;
      } catch { }
    }
    res.json({ insights });
  } catch (err) {
    console.error('AI Error:', err);
    res.json({ insights: [{ type: 'info', title: 'Análise indisponível', message: 'Não foi possível gerar análise de IA no momento.' }] });
  }
});

// ============================================================================
// EXPORTS (gated by plan)
// ============================================================================
app.get('/api/export/pdf', authenticate, requireFeature('hasPDF'), async (req, res) => {
  const user = (req as any).user;
  const transactions = await prisma.transaction.findMany({ where: { userId: user.id }, orderBy: { date: 'desc' } });

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  doc.on('end', () => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="finix-relatorio.pdf"');
    res.send(Buffer.concat(chunks));
  });

  doc.fontSize(22).fillColor('#1f2937').text('Relatório Finix - Transações', { align: 'left' });
  doc.moveDown();
  doc.fontSize(10).fillColor('#4b5563').text(`Usuário: ${user.name} (${user.email})`);
  doc.text(`Plano: ${PLANS[user.plan]?.name || user.plan}`);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
  doc.moveDown();

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

  doc.fontSize(12).fillColor('#111827').text('Resumo', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Total de transações: ${transactions.length}`);
  doc.text(`Receitas: R$ ${totalIncome.toFixed(2)}`);
  doc.text(`Despesas: R$ ${totalExpense.toFixed(2)}`);
  doc.moveDown();

  doc.fontSize(12).text('Transações', { underline: true });
  doc.moveDown(0.5);
  const tableTop = doc.y;
  doc.fontSize(10).fillColor('#111827');
  doc.text('Data', 40, tableTop, { width: 80, continued: true });
  doc.text('Título', 130, tableTop, { width: 150, continued: true });
  doc.text('Tipo', 290, tableTop, { width: 80, continued: true });
  doc.text('Categoria', 370, tableTop, { width: 120, continued: true });
  doc.text('Valor', 490, tableTop, { width: 90, align: 'right' });
  doc.moveDown(0.5);

  transactions.forEach((t) => {
    const y = doc.y;
    doc.text(new Date(t.date).toLocaleDateString('pt-BR'), 40, y, { width: 80, continued: true });
    doc.text(t.title, 130, y, { width: 150, continued: true });
    doc.text(t.type, 290, y, { width: 80, continued: true });
    doc.text(t.category, 370, y, { width: 120, continued: true });
    doc.text(`R$ ${t.amount.toFixed(2)}`, 490, y, { width: 90, align: 'right' });
    doc.moveDown(0.5);
    if (doc.y > 720) doc.addPage();
  });
  doc.end();
});

app.get('/api/export/excel', authenticate, requireFeature('hasExcel'), async (req, res) => {
  const user = (req as any).user;
  const transactions = await prisma.transaction.findMany({ where: { userId: user.id }, orderBy: { date: 'desc' } });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Transações');
  sheet.columns = [
    { header: 'Data', key: 'date', width: 15 },
    { header: 'Título', key: 'title', width: 35 },
    { header: 'Tipo', key: 'type', width: 12 },
    { header: 'Categoria', key: 'category', width: 18 },
    { header: 'Valor', key: 'amount', width: 14 },
  ];
  sheet.addRows(transactions.map((t) => ({
    date: new Date(t.date).toLocaleDateString('pt-BR'),
    title: t.title, type: t.type, category: t.category, amount: t.amount,
  })));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="finix-transacoes.xlsx"');
  res.send(Buffer.from(buffer));
});

// ============================================================================
// INTERNAL API (called by Python proxy after Stripe webhook)
// Protected by a shared secret
// ============================================================================
const INTERNAL_SECRET = process.env.JWT_SECRET || 'finix-dev-secret';

app.post('/internal/update-user-plan', async (req, res) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== INTERNAL_SECRET) return res.status(401).json({ error: 'unauthorized' });
  const { userId, plan, stripeCustomerId, stripeSubscriptionId, planExpiresAt } = req.body;
  const updates: any = {};
  if (plan) updates.plan = plan;
  if (stripeCustomerId !== undefined) updates.stripeCustomerId = stripeCustomerId;
  if (stripeSubscriptionId !== undefined) updates.stripeSubscriptionId = stripeSubscriptionId;
  if (planExpiresAt !== undefined) updates.planExpiresAt = planExpiresAt ? new Date(planExpiresAt) : null;
  const user = await prisma.user.update({ where: { id: userId }, data: updates });
  res.json(userPublic(user));
});

app.post('/internal/create-payment-tx', async (req, res) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== INTERNAL_SECRET) return res.status(401).json({ error: 'unauthorized' });
  const { userId, userEmail, sessionId, amount, currency, plan, metadata } = req.body;
  const tx = await prisma.paymentTransaction.create({
    data: {
      id: uuidv4(), userId, userEmail, sessionId, amount, currency: currency || 'brl', plan,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
  res.json(tx);
});

app.post('/internal/update-payment-tx', async (req, res) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== INTERNAL_SECRET) return res.status(401).json({ error: 'unauthorized' });
  const { sessionId, paymentStatus, status, stripePaymentId } = req.body;
  const existing = await prisma.paymentTransaction.findUnique({ where: { sessionId } });
  if (!existing) return res.status(404).json({ error: 'not found' });
  const tx = await prisma.paymentTransaction.update({
    where: { sessionId },
    data: {
      paymentStatus: paymentStatus || existing.paymentStatus,
      status: status || existing.status,
      stripePaymentId: stripePaymentId || existing.stripePaymentId,
    },
  });
  res.json({ ...tx, previousStatus: existing.paymentStatus });
});

app.get('/internal/user-by-id/:id', async (req, res) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== INTERNAL_SECRET) return res.status(401).json({ error: 'unauthorized' });
  const user = await prisma.user.findUnique({ where: { id: String(req.params.id) } });
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(userPublic(user));
});

app.get('/internal/payment-tx/:sessionId', async (req, res) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== INTERNAL_SECRET) return res.status(401).json({ error: 'unauthorized' });
  const tx = await prisma.paymentTransaction.findUnique({ where: { sessionId: String(req.params.sessionId) } });
  if (!tx) return res.status(404).json({ error: 'not found' });
  res.json(tx);
});

// ============================================================================
// STRIPE CHECKOUT (MOCK - sem Stripe SDK)
// ============================================================================
app.post('/api/stripe/checkout', authenticate, async (req, res) => {
  try {
    const { plan_id } = req.body;
    const user = (req as any).user;

    if (!['BASIC', 'PRO'].includes(plan_id)) {
      return res.status(400).json({ error: 'Plano inválido' });
    }

    // Create payment transaction record
    const sessionId = uuidv4();
    const plan = PLANS[plan_id as keyof typeof PLANS];

    await prisma.paymentTransaction.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        sessionId,
        amount: plan.price,
        currency: 'BRL',
        plan: plan_id,
        paymentStatus: 'pending',
      },
    });

    // For now, return a mock stripe URL
    // In production, would use Stripe SDK to create actual session
    const mockUrl = `https://checkout.stripe.com/pay/cs_test_${sessionId}`;
    res.json({ url: mockUrl, sessionId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao criar checkout' });
  }
});

// ============================================================================
// HEALTH
// ============================================================================
app.get('/', (req, res) => {
  res.json({ app: 'Finix TS', status: 'ok', version: '2.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler for zod/other
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
  }
  res.status(500).json({ error: err.message || 'Erro interno' });
});

// ============================================================================
// SEED
// ============================================================================
const seedData = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@finix.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    await prisma.user.create({
      data: {
        id: uuidv4(),
        name: 'Administrador Finix',
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 10),
        role: 'ADMIN',
        plan: 'PRO',
        transactionsMonth: currentMonthKey(),
      },
    });
    console.log(`✅ Admin criado: ${adminEmail} / Admin@123`);
  } else {
    // Ensure admin has ADMIN role and PRO plan
    if (admin.role !== 'ADMIN' || admin.plan !== 'PRO') {
      await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'ADMIN', plan: 'PRO' },
      });
      console.log(`✅ Admin atualizado: ${adminEmail}`);
    } else {
      console.log(`✅ Admin já existe: ${adminEmail}`);
    }
  }
};

const PORT = Number(process.env.PORT) || 8000;
app.listen(PORT, async () => {
  console.log(`Finix TS backend rodando na porta ${PORT}`);
  await seedData();
});
