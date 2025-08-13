import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';

export function useMessagesInf(id: number) {
  // const { id } = useParams<{ id: string }>();

  const getMessagesInfFn = async (pageParam: number) => {
    let queryUrl = `/api/profiles/chats/messages_v2/${id}/`


    const response = await apiClient.get(queryUrl, {
      params: { page: pageParam }
    });
    return response.data;
  };

  return useInfiniteQuery({
    queryKey: chatQueryKeys.messages(Number(id)),
    queryFn: ({ pageParam }) => getMessagesInfFn(pageParam),
    retry: 1,
    enabled: !!id,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.next,
  });
}