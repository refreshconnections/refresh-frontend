import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

const getMutualConnectionsNoDialogFn = async () => {
    const response = await apiClient.get('/api/profiles/no_dialog_mutual_connections_with_opener_check/');
    return response.data;
  };
  
  export function useGetMutualConnectionsNoDialogWOpenerCheck() {
    return useQuery({
      queryKey: userQueryKeys.mutuals_no_dialog,
      queryFn: getMutualConnectionsNoDialogFn,
    });
  }