import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export function useGetCommentById(postId: number, commentId: number | null) {
  return useQuery({
    queryKey: ['comment-by-id', postId, commentId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/refreshments/comments/${postId}/by-id/${commentId}/`);
      return response.data;
    },
    enabled: !!postId && commentId !== null,
  });
}
