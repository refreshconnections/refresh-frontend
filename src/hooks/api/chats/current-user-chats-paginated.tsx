import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';
import { useWarmCachedValue, WARM_CACHE_QUERY_OPTIONS } from '../../useWarmCachedValue';

const CHATS_PAGINATED_WARM_CACHE_KEY = 'warm_chats_paginated_v1';
const CHATS_PAGINATED_WARM_CACHE_TTL = 1000 * 60 * 10;

const getCurrentUserChatsPaginatedFn = async ({ pageParam = 1 }) => {
  const response = await apiClient.get('/api/profiles/chats/dialogs_v3/', {
    params: { page: pageParam },
  });
  return response.data;
};

export function useGetCurrentUserChatsPaginated(enabled = true) {
  const enabledWithToken = enabled && !!localStorage.getItem('token');
  const query = useInfiniteQuery({
    queryKey: chatQueryKeys.paginated,
    queryFn: getCurrentUserChatsPaginatedFn,
    initialPageParam: 1,
    getNextPageParam: lastPage => lastPage?.next ?? undefined,
    enabled: enabledWithToken,
    ...WARM_CACHE_QUERY_OPTIONS,
  });

  const { cachedData } = useWarmCachedValue(
    CHATS_PAGINATED_WARM_CACHE_KEY,
    query.data,
    CHATS_PAGINATED_WARM_CACHE_TTL,
    enabledWithToken,
  );

  return {
    ...query,
    data: query.data ?? cachedData,
    isLoading: query.isLoading && !cachedData,
    isPending: query.isPending && !cachedData,
  };
}
