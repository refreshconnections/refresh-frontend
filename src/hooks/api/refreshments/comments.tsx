import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { postQueryKeys } from './post-query-keys';

export function useGetComments(announcement_id: number) {

  const getCommentsFn = async () => {
    const response = await apiClient.get(`/api/refreshments/${announcement_id}/comments/`);
    return response.data;
  };

  return useQuery({
    queryKey: postQueryKeys.comments(Number(announcement_id)),
    queryFn: getCommentsFn,
    enabled: !!announcement_id,
    staleTime: 10000,
  });
}

