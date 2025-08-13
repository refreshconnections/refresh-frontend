import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

const getOutgoingConnectionsFn = async () => {
    const response = await apiClient.get('/api/profiles/outgoing_connections_ids/');
    return response.data;
  };
  
  export function useGetOutgoingConnections() {
    return useQuery({
      queryKey: userQueryKeys.outgoing,
      queryFn: getOutgoingConnectionsFn,
    });
  }