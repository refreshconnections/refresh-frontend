import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';

export function useNearbyMutualConnections() {
  return useQuery({
    queryKey: chatQueryKeys.nearby,
    queryFn: async () => {
      const response = await apiClient.get('/api/profiles/nearby_mutual_connections/');
      return response.data as number[] | null;
    },
    enabled: !!localStorage.getItem('token'),
  });
}
