import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';
import { useWarmCachedValue, WARM_CACHE_QUERY_OPTIONS } from '../../useWarmCachedValue';

const LOCAL_MUTUAL_CONNECTIONS_WARM_CACHE_KEY = 'warm_chats_local_v1';
const LOCAL_MUTUAL_CONNECTIONS_WARM_CACHE_TTL = 1000 * 60 * 10;

export function useLocalMutualConnections() {
  const query = useQuery({
    queryKey: chatQueryKeys.local,
    queryFn: async () => {
      const response = await apiClient.get('/api/profiles/local_mutual_connections/');
      return response.data as number[] | null;
    },
    enabled: !!localStorage.getItem('token'),
    ...WARM_CACHE_QUERY_OPTIONS,
  });

  const { cachedData } = useWarmCachedValue(
    LOCAL_MUTUAL_CONNECTIONS_WARM_CACHE_KEY,
    query.data,
    LOCAL_MUTUAL_CONNECTIONS_WARM_CACHE_TTL,
    !!localStorage.getItem('token'),
  );

  return {
    ...query,
    data: query.data ?? cachedData,
    isLoading: query.isLoading && !cachedData,
  };
}
