export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  blocked: boolean;
  createdAt: string;
  photo?: string;
  plan?: 'FREE' | 'BASIC' | 'PRO';
  transactionsUsed?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planExpiresAt?: string | null;
  hasCompletedOnboarding?: boolean;
  usageType?: string;
  companyName?: string;
  companyLogo?: string;
  businessPurpose?: string;
  primaryColor?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description?: string;
  date: string;
  recurring?: boolean;
  recurringFrequency?: 'monthly' | 'weekly' | 'yearly' | null;
  paymentMethod?: 'credito' | 'debito' | 'pix';
  installments?: number;
  installmentNumber?: number;
  totalInstallments?: number;
  totalAmount?: number;
  currency?: 'BRL' | 'USD' | 'EUR' | 'GBP';
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface Insight {
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
}

export interface DashboardData {
  balance: number;
  income: number;
  expense: number;
  saved: number;
  monthly: { month: string; income: number; expense: number }[];
  categories: { category: string; amount: number }[];
  recent: Transaction[];
  insights: Insight[];
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  spent: number;
  percentage: number;
  createdAt: string;
}
