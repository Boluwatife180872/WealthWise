import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from './useAuth';
import { Notification } from '@/types';

function mapNotification(n: any): Notification {
  return {
    id: n._id,
    user_id: n.userId,
    title: n.title,
    message: n.message,
    type: n.type || 'info',
    is_read: n.isRead ?? false,
    created_at: new Date(n._creationTime).toISOString(),
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const convex = useConvex();

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const result = await convex.query(api.notifications.list);

      return (result as any[]).map(mapNotification);
    },
    enabled: !!user?.id,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await convex.mutation(api.notifications.markAsRead, { id: id as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await convex.mutation(api.notifications.markAllAsRead);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      await convex.mutation(api.notifications.remove, { id: id as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
  };
}
