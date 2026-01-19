import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

const getMutualConnectionsNoDialogFn = async ({ pageParam = 1 }) => {
  const response = await apiClient.get('/api/profiles/no_dialog_mutual_connections_with_opener_check_v2/', {
    params: { page: pageParam },
  });
  return response.data;
};

export function useGetMutualConnectionsNoDialogWOpenerCheck() {
  return useInfiniteQuery({
    queryKey: userQueryKeys.mutuals_no_dialog_paginated,
    queryFn: getMutualConnectionsNoDialogFn,
    initialPageParam: 1,
    getNextPageParam: lastPage => lastPage?.next ?? undefined,
    enabled: !!localStorage.getItem('token'),
  });
}
