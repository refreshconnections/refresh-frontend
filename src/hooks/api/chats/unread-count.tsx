import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';

export function useGetUnreadCount() {

  const getUnreadFn = async () => {
    const response = await apiClient.get('api/profiles/chats/unread/');
    console.log(" unread count response", response)
    return response?.data ?? 0;
  };

  return useQuery({
    queryKey: chatQueryKeys.unread,
    queryFn: getUnreadFn,
    enabled: !!localStorage.getItem('token')
  });
}