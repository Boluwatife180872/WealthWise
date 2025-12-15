import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { DashboardStats, ChartData, TimeSeriesData } from '@/types';
import { startOfMonth, endOfMonth, format, subMonths, eachDayOfInterval } from 'date-fns';

export function useDashboardStats() {
  const { user } = useAuth();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats', user?.id, format(monthStart, 'yyyy-MM')],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user?.id) {
        return {
          totalBalance: 0,
          totalIncome: 0,
          totalExpenses: 0,
          remainingBudget: 0,
          savingsRate: 0,
        };
      }

      // Get all transactions for the month
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      if (txError) throw txError;

      const totalIncome = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const totalExpenses = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get all-time balance
      const { data: allTransactions, error: allTxError } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id);

      if (allTxError) throw allTxError;

      const allTimeIncome = allTransactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const allTimeExpenses = allTransactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const totalBalance = allTimeIncome - allTimeExpenses;

      // Get budgets for the month
      const { data: budgets, error: budgetError } = await supabase
        .from('budgets')
        .select('amount')
        .eq('user_id', user.id)
        .eq('month', now.getMonth() + 1)
        .eq('year', now.getFullYear());

      if (budgetError) throw budgetError;

      const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;
      const remainingBudget = totalBudget - totalExpenses;

      const savingsRate = totalIncome > 0 
        ? ((totalIncome - totalExpenses) / totalIncome) * 100 
        : 0;

      return {
        totalBalance,
        totalIncome,
        totalExpenses,
        remainingBudget,
        savingsRate,
      };
    },
    enabled: !!user?.id,
  });

  return { stats, isLoading, error };
}

export function useExpensesByCategory() {
  const { user } = useAuth();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  return useQuery({
    queryKey: ['expenses-by-category', user?.id, format(monthStart, 'yyyy-MM')],
    queryFn: async (): Promise<ChartData[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          amount,
          category:categories(name, color)
        `)
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      // Group by category
      const grouped: Record<string, { value: number; color: string }> = {};
      
      data?.forEach((t: any) => {
        const name = t.category?.name || 'Uncategorized';
        const color = t.category?.color || '#64748b';
        
        if (!grouped[name]) {
          grouped[name] = { value: 0, color };
        }
        grouped[name].value += Number(t.amount);
      });

      return Object.entries(grouped).map(([name, { value, color }]) => ({
        name,
        value,
        color,
      }));
    },
    enabled: !!user?.id,
  });
}

export function useCashFlowData() {
  const { user } = useAuth();
  const now = new Date();
  const sixMonthsAgo = subMonths(now, 5);

  return useQuery({
    queryKey: ['cash-flow', user?.id],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, type, date')
        .eq('user_id', user.id)
        .gte('date', format(startOfMonth(sixMonthsAgo), 'yyyy-MM-dd'))
        .lte('date', format(endOfMonth(now), 'yyyy-MM-dd'))
        .order('date');

      if (error) throw error;

      // Group by month
      const monthly: Record<string, { income: number; expenses: number }> = {};

      for (let i = 0; i <= 5; i++) {
        const month = subMonths(now, 5 - i);
        const key = format(month, 'MMM yyyy');
        monthly[key] = { income: 0, expenses: 0 };
      }

      data?.forEach(t => {
        const key = format(new Date(t.date), 'MMM yyyy');
        if (monthly[key]) {
          if (t.type === 'income') {
            monthly[key].income += Number(t.amount);
          } else {
            monthly[key].expenses += Number(t.amount);
          }
        }
      });

      return Object.entries(monthly).map(([date, values]) => ({
        date,
        ...values,
      }));
    },
    enabled: !!user?.id,
  });
}
