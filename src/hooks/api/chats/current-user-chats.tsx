import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';

export const getCurrentUserChatsFn = async () => {
  const response = await apiClient.get('/api/profiles/chats/dialogs_v2/');
  return response.data;
};

export function useGetCurrentUserChats() {
  return useQuery({
    queryKey: chatQueryKeys.all,
    queryFn: getCurrentUserChatsFn,
    enabled: !!localStorage.getItem('token'),
  });
}