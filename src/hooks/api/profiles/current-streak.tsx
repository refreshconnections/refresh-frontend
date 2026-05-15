import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';


const getCurrentStreakFn = async () => {
  const response = await apiClient.get('/api/profiles/streak/');
  return response.data;
};

export function useGetCurrentStreak(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userQueryKeys.streak(),
    queryFn: getCurrentStreakFn,
    enabled: !!localStorage.getItem('token') && (options?.enabled ?? true),
  });
}