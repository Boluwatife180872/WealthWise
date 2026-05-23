import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from './useAuth';
import { Category, TransactionType } from '@/types';
import { toast } from 'sonner';

export function useCategories() {
  const { user, sessionId } = useAuth();
  const queryClient = useQueryClient();
  const convex = useConvex();

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      if (!sessionId) return [];

      const result = await convex.query(api.categories.list, { sessionId: sessionId as any });

      return (result as any[]).map((c: any) => ({
        id: c._id,
        user_id: c.userId,
        name: c.name,
        icon: c.icon || 'circle',
        color: c.color || '#6366f1',
        is_default: c.isDefault || false,
        type: c.type || null,
        created_at: new Date(c._creationTime).toISOString(),
      })) as Category[];
    },
    enabled: !!sessionId,
  });

  const addCategory = useMutation({
    mutationFn: async (category: { name: string; icon: string; color: string; type: TransactionType | null }) => {
      if (!sessionId) throw new Error('Not authenticated');

      const result = await convex.mutation(api.categories.create, {
        sessionId: sessionId as any,
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      toast.success('Category created');
    },
    onError: (error) => {
      toast.error('Failed to create category');
      console.error(error);
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const result = await convex.mutation(api.categories.update, {
        sessionId: sessionId as any,
        id: id as any,
        name: updates.name,
        icon: updates.icon,
        color: updates.color,
        type: updates.type ?? undefined,
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      toast.success('Category updated');
    },
    onError: (error) => {
      toast.error('Failed to update category');
      console.error(error);
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      await convex.mutation(api.categories.remove, { sessionId: sessionId as any, id: id as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      toast.success('Category deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete category');
      console.error(error);
    },
  });

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return {
    categories,
    incomeCategories,
    expenseCategories,
    isLoading,
    error,
    addCategory: addCategory.mutate,
    updateCategory: updateCategory.mutate,
    deleteCategory: deleteCategory.mutate,
    isAdding: addCategory.isPending,
    isUpdating: updateCategory.isPending,
    isDeleting: deleteCategory.isPending,
  };
}
