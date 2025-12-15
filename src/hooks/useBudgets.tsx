import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Budget } from '@/types';
import { toast } from 'sonner';

export function useBudgets(month?: number, year?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const now = new Date();
  const targetMonth = month ?? now.getMonth() + 1;
  const targetYear = year ?? now.getFullYear();

  const { data: budgets = [], isLoading, error } = useQuery({
    queryKey: ['budgets', user?.id, targetMonth, targetYear],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user.id)
        .eq('month', targetMonth)
        .eq('year', targetYear);
      
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user?.id,
  });

  const addBudget = useMutation({
    mutationFn: async (budget: { category_id: string; amount: number; month: number; year: number }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          ...budget,
          user_id: user.id,
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
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget created');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Budget already exists for this category');
      } else {
        toast.error('Failed to create budget');
      }
      console.error(error);
    },
  });

  const updateBudget = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update({ amount })
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
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget updated');
    },
    onError: (error) => {
      toast.error('Failed to update budget');
      console.error(error);
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
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
