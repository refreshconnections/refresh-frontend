

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';

export function useMessageFile(file_id: string) {
  // const { id } = useParams<{ id: string }>();

  const getMessageFileFn = async () => {
    const response = await apiClient.get(`/api/profiles/chats/messages_v2/file/` + file_id + `/`);
    return response.data;
  };

  return useQuery({
    queryKey: chatQueryKeys.file(file_id),
    queryFn: getMessageFileFn,
    retry: 1,
    enabled: !!file_id
  });
}