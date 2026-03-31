import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';

const getMegathreadsFn = async (search: string) => {
  const params = new URLSearchParams();
  if (search) {
    params.set('search', search);
  }
  const response = await apiClient.get(`/api/announcements/megathreads/?${params.toString()}`);
  return response.data;
};

export function useGetMegathreads(search: string) {
  return useQuery({
    queryKey: ['megathreads', search],
    queryFn: () => getMegathreadsFn(search),
  });
}
