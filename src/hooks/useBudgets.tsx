import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from './useAuth';
import { Budget } from '@/types';
import { toast } from 'sonner';

function mapBudget(b: any): Budget {
  return {
    id: b._id,
    user_id: b.userId,
    category_id: b.categoryId,
    amount: b.amount,
    month: b.month,
    year: b.year,
    created_at: new Date(b._creationTime).toISOString(),
    category: b.category ? {
      id: b.category._id,
      user_id: b.category.userId,
      name: b.category.name,
      icon: b.category.icon || 'circle',
      color: b.category.color || '#6366f1',
      is_default: b.category.isDefault || false,
      type: b.category.type || null,
      created_at: new Date(b.category._creationTime).toISOString(),
    } : undefined,
    spent: 0,
  };
}

export function useBudgets(month?: number, year?: number) {
  const { user, sessionId } = useAuth();
  const queryClient = useQueryClient();
  const convex = useConvex();
  const now = new Date();
  const targetMonth = month ?? now.getMonth() + 1;
  const targetYear = year ?? now.getFullYear();

  const { data: budgets = [], isLoading, error } = useQuery({
    queryKey: ['budgets', user?.id, targetMonth, targetYear],
    queryFn: async () => {
      if (!sessionId) return [];

      const result = await convex.query(api.budgets.list, {
        sessionId: sessionId as any,
        month: targetMonth,
        year: targetYear,
      });

      return (result as any[]).map(mapBudget);
    },
    enabled: !!sessionId,
  });

  const addBudget = useMutation({
    mutationFn: async (budget: { category_id: string; amount: number; month: number; year: number }) => {
      if (!sessionId) throw new Error('Not authenticated');

      const result = await convex.mutation(api.budgets.create, {
        sessionId: sessionId as any,
        categoryId: budget.category_id as any,
        amount: budget.amount,
        month: budget.month,
        year: budget.year,
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Budget created');
    },
    onError: (error: any) => {
      if (error.message?.includes('already exists')) {
        toast.error('Budget already exists for this category');
      } else {
        toast.error('Failed to create budget');
      }
      console.error(error);
    },
  });

  const updateBudget = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const result = await convex.mutation(api.budgets.update, {
        sessionId: sessionId as any,
        id: id as any,
        amount,
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Budget updated');
    },
    onError: (error) => {
      toast.error('Failed to update budget');
      console.error(error);
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      await convex.mutation(api.budgets.remove, { sessionId: sessionId as any, id: id as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Budget deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete budget');
      console.error(error);
    },
  });

  return {
    budgets,
    isLoading,
    error,
    addBudget: addBudget.mutate,
    updateBudget: updateBudget.mutate,
    deleteBudget: deleteBudget.mutate,
    isAdding: addBudget.isPending,
    isUpdating: updateBudget.isPending,
    isDeleting: deleteBudget.isPending,
  };
}
