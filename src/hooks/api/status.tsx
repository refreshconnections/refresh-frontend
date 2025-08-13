import { useQuery } from '@tanstack/react-query';
import { apiClient } from './api-client';


const getStatusesFn = async () => {
  const response = await apiClient.get('/api/statuses/');
  return response.data;
};

export function useGetStatuses() {
  return useQuery({
    queryKey: ['statuses'],
    queryFn: getStatusesFn,
    retry: 3,
  });
}