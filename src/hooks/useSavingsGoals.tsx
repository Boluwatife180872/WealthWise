import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from './useAuth';
import { SavingsGoal } from '@/types';
import { toast } from 'sonner';

function mapGoal(g: any): SavingsGoal {
  return {
    id: g._id,
    user_id: g.userId,
    title: g.title,
    target_amount: g.targetAmount,
    current_amount: g.currentAmount ?? 0,
    deadline: g.deadline ? new Date(g.deadline).toISOString() : null,
    created_at: new Date(g._creationTime).toISOString(),
  };
}

export function useSavingsGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const convex = useConvex();

  const { data: goals = [], isLoading, error } = useQuery({
    queryKey: ['savings-goals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const result = await convex.query(api.savingsGoals.list);

      return (result as any[]).map(mapGoal);
    },
    enabled: !!user?.id,
  });

  const addGoal = useMutation({
    mutationFn: async (goal: { title: string; target_amount: number; deadline?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const result = await convex.mutation(api.savingsGoals.create, {
        title: goal.title,
        targetAmount: goal.target_amount,
        deadline: goal.deadline ? new Date(goal.deadline).getTime() : undefined,
      });

      return result;
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
      const result = await convex.mutation(api.savingsGoals.update, {
        id: id as any,
        title: updates.title,
        targetAmount: updates.target_amount,
        currentAmount: updates.current_amount,
        deadline: updates.deadline ? new Date(updates.deadline).getTime() : undefined,
      });

      return result;
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
      const result = await convex.mutation(api.savingsGoals.addProgress, {
        id: id as any,
        amount,
      });

      return result;
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
      await convex.mutation(api.savingsGoals.remove, { id: id as any });
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
