import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';
import { useWarmCachedValue } from '../../useWarmCachedValue';

const MUTUALS_WARM_CACHE_KEY = 'warm_mutuals_v1';
const MUTUALS_WARM_CACHE_TTL = 1000 * 60 * 10;

const getMutualConnectionsFn = async () => {
    const response = await apiClient.get('/api/profiles/flat_mutual_connections/');
    return response.data;
  };
  
  export function useGetMutualConnections() {
    const query = useQuery({
      queryKey: userQueryKeys.mutuals,
      queryFn: getMutualConnectionsFn,
    });

    const { cachedData } = useWarmCachedValue(
      MUTUALS_WARM_CACHE_KEY,
      query.data,
      MUTUALS_WARM_CACHE_TTL,
      true,
    );

    return {
      ...query,
      data: query.data ?? cachedData,
      isLoading: query.isLoading && !cachedData,
    };
  }
