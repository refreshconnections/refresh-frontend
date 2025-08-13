import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { postQueryKeys } from './post-query-keys';

export function useGetDynamicIndividualComment(comment_id: number) {

  const getDynamicIndividualCommentFn = async () => {
    const response = await apiClient.get(`/api/refreshments/comment_dynamic/${comment_id}`);
    return response.data;
  };

  return useQuery({
    queryKey: postQueryKeys.dynamiccomment(Number(comment_id)),
    queryFn: getDynamicIndividualCommentFn,
    enabled: !!comment_id
  });
}