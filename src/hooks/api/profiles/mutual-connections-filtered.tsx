import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

const getMutualConnectionsFilteredFn = async ({queryKey}) => {
  let url = '/api/profiles/searched_mutual_connections/?'
  if (queryKey[1]) {
    url += `search=${queryKey[1]}`
  }
  const response = await apiClient.get(url);
  return response.data;
  };
  
  export function useGetMutualConnectionsFiltered(searched_name: string) {
    return useQuery({
      queryKey: userQueryKeys.searched(searched_name),
      queryFn: getMutualConnectionsFilteredFn,
    });
  }