import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';
import { useWarmCachedValue, WARM_CACHE_QUERY_OPTIONS } from '../../useWarmCachedValue';

const NO_DIALOG_MUTUALS_V3_WARM_CACHE_KEY = 'warm_mutuals_no_dialog_paginated_v3';
const NO_DIALOG_MUTUALS_V3_WARM_CACHE_TTL = 1000 * 60 * 10;

export type NoDialogMutualV3 = {
  user_id: number;
  opener: boolean;
  name: string;
  pic1_main: string | null;
};

const getMutualConnectionsNoDialogV3Fn = async ({ pageParam = 1 }) => {
  const response = await apiClient.get('/api/profiles/no_dialog_mutual_connections_v3/', {
    params: { page: pageParam },
  });
  return response.data;
};

export function useGetMutualConnectionsNoDialogV3() {
  const enabledWithToken = !!localStorage.getItem('token');
  const query = useInfiniteQuery({
    queryKey: userQueryKeys.mutuals_no_dialog_paginated_v3,
    queryFn: getMutualConnectionsNoDialogV3Fn,
    initialPageParam: 1,
    getNextPageParam: lastPage => lastPage?.next ?? undefined,
    enabled: enabledWithToken,
    ...WARM_CACHE_QUERY_OPTIONS,
  });

  const { cachedData } = useWarmCachedValue(
    NO_DIALOG_MUTUALS_V3_WARM_CACHE_KEY,
    query.data,
    NO_DIALOG_MUTUALS_V3_WARM_CACHE_TTL,
    enabledWithToken,
  );

  return {
    ...query,
    data: query.data ?? cachedData,
    isLoading: query.isLoading && !cachedData,
    isPending: query.isPending && !cachedData,
  };
}
