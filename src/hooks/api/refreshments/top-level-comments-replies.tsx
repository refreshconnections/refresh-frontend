import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { postQueryKeys } from './post-query-keys';

export function useTopLevelCommentRepliesInf(commentId: number) {
  const getRepliesFn = async (pageParam: number) => {
    const queryUrl = `/api/refreshments/comments/${commentId}/replies/`;
    const response = await apiClient.get(queryUrl, {
      params: { page: pageParam },
    });
    return response.data;
  };

  return useInfiniteQuery({
    queryKey: postQueryKeys.topcommentReplies(commentId),
    queryFn: ({ pageParam }) => getRepliesFn(pageParam),
    initialPageParam: 1,
    enabled: !!commentId,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    placeholderData: (prev) => prev,
  });
}
