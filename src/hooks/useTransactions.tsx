import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from './useAuth';
import { Transaction, TransactionType } from '@/types';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth } from 'date-fns';

interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  type?: TransactionType;
  categoryId?: string;
  minAmount?: number;
  maxAmount?: number;
}

function mapTransaction(t: any): Transaction {
  return {
    id: t._id,
    user_id: t.userId,
    amount: t.amount,
    type: t.type,
    category_id: t.categoryId ?? null,
    notes: t.notes ?? null,
    date: new Date(t.date).toISOString(),
    created_at: new Date(t._creationTime).toISOString(),
    category: t.category ? {
      id: t.category._id,
      user_id: t.category.userId,
      name: t.category.name,
      icon: t.category.icon,
      color: t.category.color,
      is_default: t.category.isDefault || false,
      type: t.category.type || null,
      created_at: new Date(t.category._creationTime).toISOString(),
    } : undefined
  };
}

export function useTransactions(filters?: TransactionFilters) {
  const { user, sessionId } = useAuth();
  const queryClient = useQueryClient();
  const convex = useConvex();

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions', user?.id, filters],
    queryFn: async () => {
      if (!sessionId) return [];

      const result = await convex.query(api.transactions.list, {
        sessionId: sessionId as any,
        startDate: filters?.startDate?.getTime(),
        endDate: filters?.endDate?.getTime(),
        type: filters?.type,
        categoryId: filters?.categoryId,
        minAmount: filters?.minAmount,
        maxAmount: filters?.maxAmount,
      });

      return (result as any[]).map(mapTransaction);
    },
    enabled: !!sessionId,
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: {
      amount: number;
      type: TransactionType;
      category_id?: string;
      notes?: string;
      date?: string;
    }) => {
      if (!sessionId) throw new Error('Not authenticated');

      const result = await convex.mutation(api.transactions.create, {
        sessionId: sessionId as any,
        amount: transaction.amount,
        type: transaction.type,
        categoryId: transaction.category_id as any,
        notes: transaction.notes,
        date: transaction.date ? new Date(transaction.date).getTime() : Date.now(),
      });

      return mapTransaction(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      toast.success('Transaction added');
    },
    onError: (error) => {
      toast.error('Failed to add transaction');
      console.error(error);
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const result = await convex.mutation(api.transactions.update, {
        sessionId: sessionId as any,
        id: id as any,
        amount: updates.amount,
        type: updates.type,
        categoryId: updates.category_id as any,
        notes: updates.notes,
        date: updates.date ? new Date(updates.date).getTime() : undefined,
      });

      return mapTransaction(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      toast.success('Transaction updated');
    },
    onError: (error) => {
      toast.error('Failed to update transaction');
      console.error(error);
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      await convex.mutation(api.transactions.remove, { sessionId: sessionId as any, id: id as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      toast.success('Transaction deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete transaction');
      console.error(error);
    },
  });

  return {
    transactions,
    isLoading,
    error,
    addTransaction: addTransaction.mutate,
    updateTransaction: updateTransaction.mutate,
    deleteTransaction: deleteTransaction.mutate,
    isAdding: addTransaction.isPending,
    isUpdating: updateTransaction.isPending,
    isDeleting: deleteTransaction.isPending,
  };
}

export function useMonthlyTransactions(month?: number, year?: number) {
  const now = new Date();
  const targetMonth = month ?? now.getMonth() + 1;
  const targetYear = year ?? now.getFullYear();

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = endOfMonth(startDate);

  return useTransactions({
    startDate,
    endDate,
  });
}
