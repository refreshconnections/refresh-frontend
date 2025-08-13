import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

export function useIncomingConnectionsInf() {
  const getConnectionsPage = async (page: number = 1) => {
    const response = await apiClient.get('/api/profiles/paginated_incoming_connections_with_openers/', {
      params: { page },
    });
    console.log("Fetched page:", page, "Response:", response.data);
    return response.data;
  };

  return useInfiniteQuery({
    queryKey: userQueryKeys.incoming_paginated,
    queryFn: ({ pageParam = 1 }) => getConnectionsPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage?.next ?? undefined;
    },
  });
}