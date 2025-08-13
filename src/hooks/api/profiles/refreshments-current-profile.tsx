import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';


const getRefreshmentsCurrentProfileFn = async () => {
  const response = await apiClient.get('/api/profiles/refreshments_current/');
  return response.data;
};

export function useGetRefreshmentsCurrentProfile() {
  return useQuery({
    queryKey: userQueryKeys.refreshments_current,
    queryFn: getRefreshmentsCurrentProfileFn,
    enabled: !!localStorage.getItem('token')
  });
}