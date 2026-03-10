import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

const getCommunityProfileFn = async () => {
  const response = await apiClient.get('/api/profiles/community_profile/');
  return response.data;
};

export function useGetCommunityProfile() {
  return useQuery({
    queryKey: userQueryKeys.community_profile,
    queryFn: getCommunityProfileFn,
    enabled: !!localStorage.getItem('token'),
  });
}
