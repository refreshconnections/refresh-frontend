import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { postQueryKeys } from './post-query-keys';

export function useGetDynamicPostContent(id: number) {

  const getDynamicPostContentFn = async () => {
    const response = await apiClient.get(`/api/refreshments_dynamic/${id}`);
    return response.data;
  };

  return useQuery({
    queryKey: postQueryKeys.dynamicpostcontent(Number(id)),
    queryFn: getDynamicPostContentFn,
    retry: 1,
    staleTime: 30000,
    enabled: !!id
  });
}