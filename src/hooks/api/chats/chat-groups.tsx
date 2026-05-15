import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';
import { useWarmCachedValue, WARM_CACHE_QUERY_OPTIONS } from '../../useWarmCachedValue';

const CHAT_GROUPS_WARM_CACHE_KEY = 'warm_chats_groups_v1';
const CHAT_GROUPS_WARM_CACHE_TTL = 1000 * 60 * 10;

export interface ChatGroupMember {
  id: number;
  name: string;
  pic1_main: string | null;
}

export interface ChatGroupsData {
  group1_name: string | null;
  group2_name: string | null;
  group3_name: string | null;
  group1_hidden: boolean;
  group2_hidden: boolean;
  group3_hidden: boolean;
  group1: ChatGroupMember[];
  group2: ChatGroupMember[];
  group3: ChatGroupMember[];
}

export function useChatGroups() {
  const query = useQuery({
    queryKey: chatQueryKeys.groups,
    queryFn: async () => {
      const response = await apiClient.get('/api/profiles/chat_groups/');
      return response.data as ChatGroupsData;
    },
    enabled: !!localStorage.getItem('token'),
    ...WARM_CACHE_QUERY_OPTIONS,
  });

  const { cachedData } = useWarmCachedValue(
    CHAT_GROUPS_WARM_CACHE_KEY,
    query.data,
    CHAT_GROUPS_WARM_CACHE_TTL,
    !!localStorage.getItem('token'),
  );

  return {
    ...query,
    data: query.data ?? cachedData,
    isLoading: query.isLoading && !cachedData,
  };
}

export function useUpdateChatGroups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ChatGroupsData>) => {
      await apiClient.patch('/api/profiles/chat_groups/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.groups });
    },
  });
}
