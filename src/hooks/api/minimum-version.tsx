import { useQuery } from '@tanstack/react-query';
import { apiClient } from './api-client';


const getMinimumVersionFn = async () => {
  const response = await apiClient.get('/api/minimum_version_requirement/');
  return response.data;
};

export function useGetMinimumVersion() {
  return useQuery({
    queryKey: ['min-version'],
    queryFn: getMinimumVersionFn
  });
}