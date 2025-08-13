import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { postQueryKeys } from './post-query-keys';

export function useGetStaticPostContent(id: number) {

  const getStaticPostContentFn = async () => {
    const response = await apiClient.get(`/api/refreshments_static/${id}`);
    return response.data;
  };

  return useQuery({
    queryKey: postQueryKeys.staticpostcontent(Number(id)),
    queryFn: getStaticPostContentFn,
    retry: 1,
    staleTime: 30000,
    enabled: !!id
  });
}