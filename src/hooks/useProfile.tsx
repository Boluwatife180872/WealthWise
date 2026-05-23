import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from './useAuth';
import { Profile } from '@/types';
import { toast } from 'sonner';

function mapProfile(p: any): Profile {
  return {
    id: p._id,
    user_id: p.userId,
    full_name: p.fullName ?? null,
    monthly_income: p.monthlyIncome ?? 0,
    currency: p.currency ?? 'NGN',
    avatar_url: p.avatarUrl ?? null,
    created_at: new Date(p._creationTime).toISOString(),
    updated_at: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date(p._creationTime).toISOString(),
  };
}

export function useProfile() {
  const { user, sessionId } = useAuth();
  const queryClient = useQueryClient();
  const convex = useConvex();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!sessionId) return null;

      const result = await convex.query(api.users.getProfile, { sessionId: sessionId as any });

      return result ? mapProfile(result) : null;
    },
    enabled: !!sessionId,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!sessionId) throw new Error('Not authenticated');

      const result = await convex.mutation(api.users.updateProfile, {
        sessionId: sessionId as any,
        fullName: updates.full_name ?? undefined,
        monthlyIncome: updates.monthly_income ?? undefined,
        currency: updates.currency ?? undefined,
        avatarUrl: updates.avatar_url ?? undefined,
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile');
      console.error(error);
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
  };
}
