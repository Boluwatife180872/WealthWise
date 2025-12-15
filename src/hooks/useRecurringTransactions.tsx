import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { RecurringTransaction, TransactionType, FrequencyType } from '@/types';
import { toast } from 'sonner';

export function useRecurringTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: recurringTransactions = [], isLoading, error } = useQuery({
    queryKey: ['recurring-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user.id)
        .order('next_run_date', { ascending: true });
      
      if (error) throw error;
      return data as RecurringTransaction[];
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
      
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({
          ...recurring,
          user_id: user.id,
          is_active: true,
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
      const { data, error } = await supabase
        .from('recurring_transactions')
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
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      toast.success(data.is_active ? 'Recurring transaction activated' : 'Recurring transaction paused');
    },
    onError: (error) => {
      toast.error('Failed to update recurring transaction');
      console.error(error);
    },
  });

  const deleteRecurring = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
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
