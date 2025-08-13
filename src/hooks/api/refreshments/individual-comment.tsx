import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { postQueryKeys } from './post-query-keys';

export function useGetIndividualComment(comment_id: number) {

  const getIndividualCommentFn = async () => {
    const response = await apiClient.get(`/api/refreshments/comment/${comment_id}`);
    return response.data;
  };

  return useQuery({
    queryKey: postQueryKeys.comment(Number(comment_id)),
    queryFn: getIndividualCommentFn,
    enabled: !!comment_id
  });
}