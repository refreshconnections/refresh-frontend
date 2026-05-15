import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { chatQueryKeys } from './chat-query-keys';

export type LocalChatItem = {
  user_id: number;
  name: string;
  pic1_main: string | null;
  has_dialog: boolean;
  dialog_id: number | null;
  other_user_id: string | null;
  unread_count: number;
  time_last_message: string | null;
  keep_it_going: boolean;
  opener: boolean;
};

type LocalChatsPage = {
  count: number;
  next: number | null;
  previous: number | null;
  results: LocalChatItem[];
};

const getLocalChatsFn = async ({ pageParam = 1 }): Promise<LocalChatsPage> => {
  const response = await apiClient.get('/api/profiles/local_chats/', {
    params: { page: pageParam },
  });
  return response.data;
};

export function useLocalChats(enabled = true) {
  return useInfiniteQuery({
    queryKey: chatQueryKeys.localChats,
    queryFn: getLocalChatsFn,
    initialPageParam: 1,
    getNextPageParam: lastPage => lastPage?.next ?? undefined,
    enabled: enabled && !!localStorage.getItem('token'),
  });
}
