import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { pollQueryKeys } from './poll-query-keys';

export function useGetStaticPoll(id: number) {

  const getStaticPoll = async () => {
    const response = await apiClient.get(`/api/refreshments/poll/static/${id}`);
    return response.data;
  };

  return useQuery({
    queryKey: pollQueryKeys.pollstatic(Number(id)),
    queryFn: getStaticPoll,
    staleTime: 30000,
    enabled: !!id
  });
}