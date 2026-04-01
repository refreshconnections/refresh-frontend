import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { useWarmCachedValue } from '../../useWarmCachedValue';

const getMegathreadsFn = async (search: string) => {
  const params = new URLSearchParams();
  if (search) {
    params.set('search', search);
  }
  const response = await apiClient.get(`/api/announcements/megathreads/?${params.toString()}`);
  return response.data;
};

export function useGetMegathreads(search: string) {
  const query = useQuery({
    queryKey: ['megathreads', search],
    queryFn: () => getMegathreadsFn(search),
  });

  const { cachedData } = useWarmCachedValue(
    `warm_megathreads_${search || 'all'}_v1`,
    query.data,
    1000 * 60 * 10,
    true,
  );

  return {
    ...query,
    data: query.data ?? cachedData,
    isLoading: query.isLoading && !cachedData,
  };
}
