import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { SavingsGoal } from '@/types';
import { toast } from 'sonner';

export function useSavingsGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading, error } = useQuery({
    queryKey: ['savings-goals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavingsGoal[];
    },
    enabled: !!user?.id,
  });

  const addGoal = useMutation({
    mutationFn: async (goal: { title: string; target_amount: number; deadline?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('savings_goals')
        .insert({
          ...goal,
          user_id: user.id,
          current_amount: 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      toast.success('Savings goal created');
    },
    onError: (error) => {
      toast.error('Failed to create savings goal');
      console.error(error);
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SavingsGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      toast.success('Savings goal updated');
    },
    onError: (error) => {
      toast.error('Failed to update savings goal');
      console.error(error);
    },
  });

  const addProgress = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const goal = goals.find(g => g.id === id);
      if (!goal) throw new Error('Goal not found');
      
      const newAmount = goal.current_amount + amount;
      
      const { data, error } = await supabase
        .from('savings_goals')
        .update({ current_amount: newAmount })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      toast.success('Progress added');
    },
    onError: (error) => {
      toast.error('Failed to add progress');
      console.error(error);
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      toast.success('Savings goal deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete savings goal');
      console.error(error);
    },
  });

  return {
    goals,
    isLoading,
    error,
    addGoal: addGoal.mutate,
    updateGoal: updateGoal.mutate,
    addProgress: addProgress.mutate,
    deleteGoal: deleteGoal.mutate,
    isAdding: addGoal.isPending,
    isUpdating: updateGoal.isPending,
    isDeleting: deleteGoal.isPending,
  };
}
