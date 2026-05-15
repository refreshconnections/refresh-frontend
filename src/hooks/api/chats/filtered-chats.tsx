import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';

export function useFilteredChats(userIds: number[], enabled: boolean) {
  return useQuery({
    queryKey: chatQueryKeys.filtered(userIds),
    queryFn: async () => {
      const response = await apiClient.get('/api/profiles/chats/dialogs_v3/', {
        params: { user_ids: userIds.join(',') },
      });
      return response.data as any[];
    },
    enabled: enabled && userIds.length > 0 && !!localStorage.getItem('token'),
  });
}
