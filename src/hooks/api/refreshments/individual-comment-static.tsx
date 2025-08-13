import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { postQueryKeys } from './post-query-keys';

export function useGetStaticIndividualComment(comment_id: number) {

  const getStaticIndividualCommentFn = async () => {
    const response = await apiClient.get(`/api/refreshments/comment_static/${comment_id}`);
    return response.data;
  };

  return useQuery({
    queryKey: postQueryKeys.staticcomment(Number(comment_id)),
    queryFn: getStaticIndividualCommentFn,
    enabled: !!comment_id
  });
}