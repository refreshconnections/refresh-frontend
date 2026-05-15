import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';

const getHiddenChatsFn = async ({ pageParam = 1 }) => {
  const response = await apiClient.get('/api/profiles/hidden_chats_v2/', {
    params: { page: pageParam },
  });
  return response.data;
};

export function useGetHiddenChats(enabled = true) {
  return useInfiniteQuery({
    queryKey: chatQueryKeys.hidden,
    queryFn: getHiddenChatsFn,
    initialPageParam: 1,
    getNextPageParam: lastPage => lastPage?.next ?? undefined,
    enabled: enabled && !!localStorage.getItem('token'),
  });
}
