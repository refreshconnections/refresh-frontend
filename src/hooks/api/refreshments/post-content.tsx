import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { postQueryKeys } from './post-query-keys';

export function useGetPostContent(id: number) {
  // const { id } = useParams<{ id: string }>();

  const getPostContentFn = async () => {
    const response = await apiClient.get(`/api/refreshments/${id}`);
    return response.data;
  };

  return useQuery({
    queryKey: postQueryKeys.postcontent(Number(id)),
    queryFn: getPostContentFn,
    retry: 1,
    staleTime: 30000,
    enabled: !!id
  });
}