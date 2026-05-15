import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

type CommunityBlockedResult = {
  user_id: number;
  username: string | null;
  name: string;
};

const getCommunityBlockedSearchFn = async ({
  queryKey,
}: {
  queryKey: ReturnType<typeof userQueryKeys.community_blocked_search>;
}) => {
  const [, , query] = queryKey;
  const response = await apiClient.get('/api/profiles/community_blocked/search/', {
    params: { q: query },
  });
  return response.data as CommunityBlockedResult[];
};

export function useSearchCommunityBlocked(query: string, enabledSetting: boolean = true) {
  const trimmedQuery = query.trim();

  return useQuery({
    queryKey: userQueryKeys.community_blocked_search(trimmedQuery),
    queryFn: getCommunityBlockedSearchFn,
    enabled: enabledSetting && trimmedQuery.length > 0 && !!localStorage.getItem('token'),
    staleTime: 60000,
  });
}

export type { CommunityBlockedResult };
