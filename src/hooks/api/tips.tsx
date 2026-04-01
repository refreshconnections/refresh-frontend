import { useQuery } from '@tanstack/react-query';
import { apiClient } from './api-client';

export function useGetDailyTip() {
  return useQuery({
    queryKey: ['daily-tip'],
    queryFn: async () => {
      const response = await apiClient.get('/api/tips/daily/');
      return response.data as { id: number; title: string; description: string; link: string | null; link_name: string | null };
    },
    staleTime: 1000 * 60 * 60 * 3,
    retry: 2,
  });
}
