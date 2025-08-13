import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { pollQueryKeys } from './poll-query-keys';

export function useGetDynamicPoll(id: number) {

  const getDynamicPoll = async () => {
    const response = await apiClient.get(`/api/refreshments/poll/dynamic/${id}`);
    return response.data;
  };

  return useQuery({
    queryKey: pollQueryKeys.polldynamic(Number(id)),
    queryFn: getDynamicPoll,
    staleTime: 30000,
    enabled: !!id
  });
}