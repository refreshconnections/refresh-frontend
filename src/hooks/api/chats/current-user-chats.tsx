import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';
import { useWarmCachedValue } from '../../useWarmCachedValue';

const CHATS_WARM_CACHE_KEY = 'warm_chats_v1';
const CHATS_WARM_CACHE_TTL = 1000 * 60 * 10;

export const getCurrentUserChatsFn = async () => {
  const response = await apiClient.get('/api/profiles/chats/dialogs_v2/');
  return response.data;
};

export function useGetCurrentUserChats() {
  const query = useQuery({
    queryKey: chatQueryKeys.all,
    queryFn: getCurrentUserChatsFn,
    enabled: !!localStorage.getItem('token'),
  });

  const { cachedData } = useWarmCachedValue(
    CHATS_WARM_CACHE_KEY,
    query.data,
    CHATS_WARM_CACHE_TTL,
    !!localStorage.getItem('token'),
  );

  return {
    ...query,
    data: query.data ?? cachedData,
    isLoading: query.isLoading && !cachedData,
  };
}
