import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

type IncomingConnectionStatus = {
  is_incoming: boolean;
};

const getIncomingConnectionStatus = async (userId: number | string): Promise<IncomingConnectionStatus> => {
  const response = await apiClient.get(`/api/profiles/incoming_connection_status/${userId}/`);
  return response.data;
};

export function useGetIncomingConnectionStatus(userId?: number | string) {
  return useQuery<IncomingConnectionStatus>({
    queryKey: userQueryKeys.incoming_status(userId),
    queryFn: () => getIncomingConnectionStatus(userId as number | string),
    enabled: Boolean(userId),
  });
}
