import { useQuery } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from './useAuth';
import { DashboardStats, ChartData, TimeSeriesData } from '@/types';
import { startOfMonth, format } from 'date-fns';

export function useDashboardStats() {
  const { user, sessionId } = useAuth();
  const convex = useConvex();
  const now = new Date();
  const monthStart = startOfMonth(now);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats', user?.id, format(monthStart, 'yyyy-MM')],
    queryFn: async (): Promise<DashboardStats> => {
      if (!sessionId) {
        return {
          totalBalance: 0,
          totalIncome: 0,
          totalExpenses: 0,
          remainingBudget: 0,
          savingsRate: 0,
        };
      }

      const result = await convex.query(api.dashboard.getStats, { sessionId: sessionId as any });
      return result as DashboardStats;
    },
    enabled: !!sessionId,
  });

  return { stats: stats ?? {
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    remainingBudget: 0,
    savingsRate: 0,
  }, isLoading, error };
}

export function useExpensesByCategory() {
  const { user, sessionId } = useAuth();
  const convex = useConvex();
  const now = new Date();
  const monthStart = startOfMonth(now);

  return useQuery({
    queryKey: ['expenses-by-category', user?.id, format(monthStart, 'yyyy-MM')],
    queryFn: async (): Promise<ChartData[]> => {
      if (!sessionId) return [];

      const result = await convex.query(api.dashboard.getExpensesByCategory, { sessionId: sessionId as any });
      return result as ChartData[];
    },
    enabled: !!sessionId,
  });
}

export function useCashFlowData() {
  const { user, sessionId } = useAuth();
  const convex = useConvex();

  return useQuery({
    queryKey: ['cash-flow', user?.id],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      if (!sessionId) return [];

      const result = await convex.query(api.dashboard.getCashFlow, { sessionId: sessionId as any, months: 5 });
      return result as TimeSeriesData[];
    },
    enabled: !!sessionId,
  });
}
