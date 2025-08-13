import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

const getIncomingConnectionsFn = async () => {
    const response = await apiClient.get('/api/profiles/incoming_connections_with_openers/');
    return response.data;
  };
  
  export function useGetIncomingConnections() {
    return useQuery({
      queryKey: userQueryKeys.incoming,
      queryFn: getIncomingConnectionsFn,
    });
  }