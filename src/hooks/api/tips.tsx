import { useQuery } from '@tanstack/react-query';
import { apiClient } from './api-client';
import { useWarmCachedValue } from '../useWarmCachedValue';

export function useGetDailyTip() {
  const query = useQuery({
    queryKey: ['daily-tip'],
    queryFn: async () => {
      const response = await apiClient.get('/api/tips/daily/');
      return response.data as { id: number; title: string; description: string; link: string | null; link_name: string | null };
    },
    staleTime: 1000 * 60 * 60 * 3,
    retry: 2,
  });

  const { cachedData } = useWarmCachedValue(
    'warm_daily_tip_v1',
    query.data,
    1000 * 60 * 60 * 6,
    true,
  );

  return {
    ...query,
    data: query.data ?? cachedData,
    isLoading: query.isLoading && !cachedData,
  };
}
