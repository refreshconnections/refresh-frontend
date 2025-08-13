import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';


const getCurrentProfileFn = async () => {
  const response = await apiClient.get('/api/profiles/current/');
  return response.data;
};

export function useGetCurrentProfile() {
  return useQuery({
    queryKey: userQueryKeys.current,
    queryFn: getCurrentProfileFn,
    retry: 3,
    enabled: !!localStorage.getItem('token')
  });
}