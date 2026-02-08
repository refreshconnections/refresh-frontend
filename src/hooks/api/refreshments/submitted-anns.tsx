import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { annQueryKeys } from '../announcements-take-1/ann-query-keys';

const getSubmittedAnnouncementsPage = async (page: number = 1, includeHidden?: boolean) => {
  const response = await apiClient.get('/api/announcements/submitted/', {
    params: { page, include_hidden: includeHidden ? 1 : undefined },
  });
  return response.data;
};

export function useGetSubmittedAnnouncements(
  includeHidden?: boolean,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery({
    queryKey: [...annQueryKeys.submitted, includeHidden ? 'include_hidden' : 'no_hidden'],
    queryFn: ({ pageParam = 1 }) => getSubmittedAnnouncementsPage(pageParam, includeHidden),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.next ?? undefined,
    enabled: options?.enabled,
  });
}
