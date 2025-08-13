import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';


const getGlobalAppCurrentProfileFn = async () => {
  const response = await apiClient.get('/api/profiles/global_app_current/');
  return response.data;
};

export function useGetGlobalAppCurrentProfile() {
  return useQuery({
    queryKey: userQueryKeys.global_current,
    queryFn: getGlobalAppCurrentProfileFn,
    retry: 3,
    enabled: !!localStorage.getItem('token')
  });
}