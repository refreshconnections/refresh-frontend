import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

const getMyCommentsFn = async (page: number = 1) => {
  const response = await apiClient.get('/api/profiles/my_comments/', { params: { page } });
  return response.data;
};

export function useGetMyComments(options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: userQueryKeys.my_comments,
    queryFn: ({ pageParam = 1 }) => getMyCommentsFn(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.next ?? undefined,
    enabled: !!localStorage.getItem('token') && (options?.enabled ?? true),
  });
}
