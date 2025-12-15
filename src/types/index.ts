export type TransactionType = 'income' | 'expense';
export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  monthly_income: number;
  currency: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  type: TransactionType | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  notes: string | null;
  date: string;
  created_at: string;
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  category?: Category;
  spent?: number;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  frequency: FrequencyType;
  next_run_date: string;
  is_active: boolean;
  created_at: string;
  category?: Category;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  remainingBudget: number;
  savingsRate: number;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  income: number;
  expenses: number;
}
