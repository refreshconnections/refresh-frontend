import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';

const getCurrentUserChatsPaginatedFn = async ({ pageParam = 1 }) => {
  const response = await apiClient.get('/api/profiles/chats/dialogs_v3/', {
    params: { page: pageParam },
  });
  return response.data;
};

export function useGetCurrentUserChatsPaginated(enabled = true) {
  return useInfiniteQuery({
    queryKey: chatQueryKeys.paginated,
    queryFn: getCurrentUserChatsPaginatedFn,
    initialPageParam: 1,
    getNextPageParam: lastPage => lastPage?.next ?? undefined,
    enabled: enabled && !!localStorage.getItem('token'),
  });
}
