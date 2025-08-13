import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';

export function useMessages(id: number) {
  // const { id } = useParams<{ id: string }>();

  const getMessagesFn = async () => {
    const response = await apiClient.get(`/api/profiles/chats/messages_v2/` + id + `/`);
    return response.data;
  };

  return useQuery({
    queryKey: chatQueryKeys.messages(Number(id)),
    queryFn: getMessagesFn,
    retry: 1,
    enabled: !!id
  });
}