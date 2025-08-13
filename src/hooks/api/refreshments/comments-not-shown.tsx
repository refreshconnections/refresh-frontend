import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { postQueryKeys } from './post-query-keys';

export function useGetCommentsNotShownCount(announcement_id: number) {

  const getCommentsNotShownCountFn = async () => {
    const response = await apiClient.get(`/api/refreshments/${announcement_id}/comments/not_shown_count/`);
    return response.data?.not_shown ?? 0;
  };

  return useQuery({
    queryKey: postQueryKeys.notshown(Number(announcement_id)),
    queryFn: getCommentsNotShownCountFn,
    enabled: !!announcement_id
  });
}