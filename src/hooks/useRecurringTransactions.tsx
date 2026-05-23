import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from './useAuth';
import { RecurringTransaction, TransactionType, FrequencyType } from '@/types';
import { toast } from 'sonner';

function mapRecurring(r: any): RecurringTransaction {
  return {
    id: r._id,
    user_id: r.userId,
    title: r.title,
    amount: r.amount,
    type: r.type,
    category_id: r.categoryId || null,
    frequency: r.frequency,
    next_run_date: new Date(r.nextRunDate).toISOString(),
    is_active: r.isActive ?? true,
    created_at: new Date(r._creationTime).toISOString(),
    category: r.category ? {
      id: r.category._id,
      user_id: r.category.userId,
      name: r.category.name,
      icon: r.category.icon || 'circle',
      color: r.category.color || '#6366f1',
      is_default: r.category.isDefault || false,
      type: r.category.type || null,
      created_at: new Date(r.category._creationTime).toISOString(),
    } : undefined,
  };
}

export function useRecurringTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const convex = useConvex();

  const { data: recurringTransactions = [], isLoading, error } = useQuery({
    queryKey: ['recurring-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const result = await convex.query(api.recurringTransactions.list);

      return (result as any[]).map(mapRecurring);
    },
    enabled: !!user?.id,
  });

  const addRecurring = useMutation({
    mutationFn: async (recurring: {
      title: string;
      amount: number;
      type: TransactionType;
      category_id?: string;
      frequency: FrequencyType;
      next_run_date: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const result = await convex.mutation(api.recurringTransactions.create, {
        title: recurring.title,
        amount: recurring.amount,
        type: recurring.type,
        categoryId: recurring.category_id as any,
        frequency: recurring.frequency,
        nextRunDate: new Date(recurring.next_run_date).getTime(),
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      toast.success('Recurring transaction created');
    },
    onError: (error) => {
      toast.error('Failed to create recurring transaction');
      console.error(error);
    },
  });

  const updateRecurring = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecurringTransaction> & { id: string }) => {
      const result = await convex.mutation(api.recurringTransactions.update, {
        id: id as any,
        title: updates.title,
        amount: updates.amount,
        type: updates.type,
        categoryId: updates.category_id as any,
        frequency: updates.frequency,
        nextRunDate: updates.next_run_date ? new Date(updates.next_run_date).getTime() : undefined,
        isActive: updates.is_active,
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      toast.success('Recurring transaction updated');
    },
    onError: (error) => {
      toast.error('Failed to update recurring transaction');
      console.error(error);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const result = await convex.mutation(api.recurringTransactions.toggleActive, {
        id: id as any,
        isActive: is_active,
      });

      return result;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      toast.success(data?.isActive ? 'Recurring transaction activated' : 'Recurring transaction paused');
    },
    onError: (error) => {
      toast.error('Failed to update recurring transaction');
      console.error(error);
    },
  });

  const deleteRecurring = useMutation({
    mutationFn: async (id: string) => {
      await convex.mutation(api.recurringTransactions.remove, { id: id as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      toast.success('Recurring transaction deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete recurring transaction');
      console.error(error);
    },
  });

  return {
    recurringTransactions,
    isLoading,
    error,
    addRecurring: addRecurring.mutate,
    updateRecurring: updateRecurring.mutate,
    toggleActive: toggleActive.mutate,
    deleteRecurring: deleteRecurring.mutate,
    isAdding: addRecurring.isPending,
    isUpdating: updateRecurring.isPending,
    isDeleting: deleteRecurring.isPending,
  };
}
