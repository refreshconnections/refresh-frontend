import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

const getRecentNotificationsFn = async () => {
    const response = await apiClient.get('/api/profiles/notifications/');
    return response.data;
  };
  
  export function useGetRecentNotifications() {
    return useQuery({
      queryKey: userQueryKeys.notifications,
      queryFn: getRecentNotificationsFn,
    });
  }