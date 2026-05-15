import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

const getCommunityProfileFn = async ({ queryKey }: { queryKey: ReturnType<typeof userQueryKeys.community_profile> }) => {
  const [, profileId] = queryKey;
  const url =
    profileId && profileId !== 'current'
      ? `/api/profiles/community_profile/${profileId}`
      : '/api/profiles/community_profile/';

  const response = await apiClient.get(url);
  return response.data;
};

export function useGetCommunityProfile(userId?: number | null, enabledSetting: boolean = true) {
  return useQuery({
    queryKey: userQueryKeys.community_profile(userId ?? 'current'),
    queryFn: getCommunityProfileFn,
    enabled: enabledSetting && !!localStorage.getItem('token') && (userId == null || !!userId),
    staleTime: 60000 * 10,
  });
}
