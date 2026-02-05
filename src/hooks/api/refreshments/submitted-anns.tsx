import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { annQueryKeys } from '../announcements-take-1/ann-query-keys';

const getSubmittedAnnouncementsPage = async (page: number = 1) => {
  const response = await apiClient.get('/api/announcements/submitted/', {
    params: { page },
  });
  return response.data;
};

export function useGetSubmittedAnnouncements() {
  return useInfiniteQuery({
    queryKey: annQueryKeys.submitted,
    queryFn: ({ pageParam = 1 }) => getSubmittedAnnouncementsPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.next ?? undefined,
  });
}
