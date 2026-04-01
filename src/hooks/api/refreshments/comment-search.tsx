import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { postQueryKeys } from './post-query-keys';

export function useCommentSearch(postId: number, query: string) {
  return useInfiniteQuery({
    queryKey: postQueryKeys.commentSearch(postId, query),
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get(`/api/refreshments/comments/${postId}/search/`, {
        params: { q: query, page: pageParam },
      });
      return response.data;
    },
    initialPageParam: 1,
    enabled: !!postId && query.length > 0,
    retry: 1,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    placeholderData: (prev) => prev,
  });
}
