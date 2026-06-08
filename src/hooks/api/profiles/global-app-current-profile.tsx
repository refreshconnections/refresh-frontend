import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';


const getGlobalAppCurrentProfileFn = async () => {
  const response = await apiClient.get('/api/profiles/global_app_current/');
  return response.data;
};

export function useGetGlobalAppCurrentProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userQueryKeys.global_current,
    queryFn: getGlobalAppCurrentProfileFn,
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;
      if (status && status < 500) return false;
      return failureCount < 3;
    },
    enabled: !!localStorage.getItem('token') && (options?.enabled ?? true),
  });
}
