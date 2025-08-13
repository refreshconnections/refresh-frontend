import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';


const getCurrentModerationFn = async () => {
  const response = await apiClient.get('/api/profiles/moderation_current/');
  return response.data;
};

export function useGetCurrentModeration() {
  return useQuery({
    queryKey: userQueryKeys.moderation(),
    queryFn: getCurrentModerationFn,
    enabled: !!localStorage.getItem('token')
  });
}