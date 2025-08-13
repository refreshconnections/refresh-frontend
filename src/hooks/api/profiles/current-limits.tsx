import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';


export const getLimitsFn = async () => {
  const response = await apiClient.get('/api/profiles/limits/');
  return response.data;
};

export function useGetLimits() {
  return useQuery({
    queryKey: userQueryKeys.limits(),
    queryFn: getLimitsFn,
    enabled: !!localStorage.getItem('token')
  });
}