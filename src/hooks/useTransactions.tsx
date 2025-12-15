import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Transaction, TransactionType } from '@/types';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  type?: TransactionType;
  categoryId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export function useTransactions(filters?: TransactionFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (filters?.startDate) {
        query = query.gte('date', format(filters.startDate, 'yyyy-MM-dd'));
      }
      if (filters?.endDate) {
        query = query.lte('date', format(filters.endDate, 'yyyy-MM-dd'));
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.minAmount !== undefined) {
        query = query.gte('amount', filters.minAmount);
      }
      if (filters?.maxAmount !== undefined) {
        query = query.lte('amount', filters.maxAmount);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user?.id,
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: {
      amount: number;
      type: TransactionType;
      category_id?: string;
      notes?: string;
      date?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          user_id: user.id,
          date: transaction.date || new Date().toISOString(),
        })
        .select(`
          *,
          category:categories(*)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Transaction added');
    },
    onError: (error) => {
      toast.error('Failed to add transaction');
      console.error(error);
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:categories(*)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Transaction updated');
    },
    onError: (error) => {
      toast.error('Failed to update transaction');
      console.error(error);
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
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
