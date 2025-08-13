import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

const getMutualConnectionsFn = async () => {
    const response = await apiClient.get('/api/profiles/flat_mutual_connections/');
    return response.data;
  };
  
  export function useGetMutualConnections() {
    return useQuery({
      queryKey: userQueryKeys.mutuals,
      queryFn: getMutualConnectionsFn,
    });
  }