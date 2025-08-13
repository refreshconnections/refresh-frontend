import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { postQueryKeys } from './post-query-keys';

export function useGetCommentReplies(comment_id: number) {

  const getCommentRepliesFn = async () => {
    const response = await apiClient.get(`/api/refreshments/comment/${comment_id}/replies/`);
    return response.data;
  };

  return useQuery({
    queryKey: postQueryKeys.commentreplies(Number(comment_id)),
    queryFn: getCommentRepliesFn,
    enabled: !!comment_id
  });
}