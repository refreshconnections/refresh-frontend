import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';


export function useGetChatDetails(id: number) {
  // const { id } = useParams<{ id: string }>();

  const getChatDetailsFn = async () => {
    const response = await apiClient.get(`/api/profiles/chats/dialogs_v2/` + id + `/`);
    return response.data;
  };

  return useQuery({
    queryKey: chatQueryKeys.details(Number(id)),
    queryFn: getChatDetailsFn,
    retry: 1,
    enabled: !!id
  });
}