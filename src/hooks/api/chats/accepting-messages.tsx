import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';

export function useAcceptingMessages(id: number) {
  // const { id } = useParams<{ id: string }>();

  const getAcceptingMessagesFn = async () => {
    const response = await apiClient.get(`/api/profiles/accepting_messages/` + id);
    if (response.data['accepting'] == "true") {
      return true
    }
    else {
      return false
    }
  };

  return useQuery({
    queryKey: chatQueryKeys.accepting(Number(id)),
    queryFn: getAcceptingMessagesFn,
    retry: 1,
    enabled: !!id
  });
}