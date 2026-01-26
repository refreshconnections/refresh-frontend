import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from './api-client';
import type { RefreshEvent } from './events';

type SubmittedEventsResponse = {
  next?: number | null;
  previous?: number | null;
  count?: number;
  results?: RefreshEvent[];
};

const getSubmittedEventsPage = async (page: number = 1) => {
  const response = await apiClient.get('/api/events/submitted/', {
    params: { page },
  });
  return response.data as SubmittedEventsResponse;
};

export function useGetSubmittedEvents() {
  return useInfiniteQuery({
    queryKey: ['submitted-events'],
    queryFn: ({ pageParam = 1 }) => getSubmittedEventsPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.next ?? undefined,
  });
}
