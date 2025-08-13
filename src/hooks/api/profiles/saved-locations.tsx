
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';


const getSavedLocationsFn = async () => {
  const response = await apiClient.get('/api/profiles/saved_locations/');
  return response.data;
};

export function useGetSavedLocations(hasFeature: boolean = false) {
  return useQuery({
    queryKey: userQueryKeys.saved_locations(),
    queryFn: getSavedLocationsFn,
    enabled: hasFeature && !!localStorage.getItem('token')
  });
}

