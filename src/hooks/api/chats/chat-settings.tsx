import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';

export function useChatSettings(id?: number) {
  // const { id } = useParams<{ id: string }>();

  const getChatSettingsFn = async () => {
    const response = await apiClient.get(`/api/profiles/chat_settings/${id ?? ''}`);
    return response.data
  };

  return useQuery({
    queryKey: chatQueryKeys.settings(Number(id)),
    queryFn: getChatSettingsFn,
    retry: 1,
    enabled: !!localStorage.getItem('token')
  });
}