import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { postQueryKeys } from './post-query-keys';
import { useInfiniteQuery } from '@tanstack/react-query';

export function useTopLevelCommentsInf(postId: number, sortByRecentActivity: boolean = false) {
  const getTopCommentsFn = async (pageParam: number) => {
    let queryUrl = `/api/refreshments/comments/${postId}/top/`;
    if (sortByRecentActivity) {
        queryUrl += '?sort=recent_activity'
    }
    const response = await apiClient.get(queryUrl, {
      params: { page: pageParam },
    });
    return response.data;
  };

  return useInfiniteQuery({
    queryKey: postQueryKeys.topcomments(postId, sortByRecentActivity),
    queryFn: ({ pageParam }) => getTopCommentsFn(pageParam),
    initialPageParam: 1,
    enabled: !!postId,
    retry: 1,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    placeholderData: (prev) => prev,
  });
}