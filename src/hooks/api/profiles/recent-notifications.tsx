import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

const getRecentNotificationsFn = async (type?: string) => {
  const response = await apiClient.get('/api/profiles/notifications/', {
    params: type ? { type } : undefined,
  });
  return response.data;
};

export function useGetRecentNotifications(type?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...userQueryKeys.notifications, type ?? 'all'],
    queryFn: () => getRecentNotificationsFn(type),
    enabled: options?.enabled,
  });
}

export const dismissNotification = async (notificationId: number, surface?: 'refreshments' | 'activity') => {
  await apiClient.patch(`/api/profiles/notifications/${notificationId}/dismiss/`, {
    surface,
  });
};
