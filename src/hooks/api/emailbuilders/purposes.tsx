import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { emailBuilderQueryKeys } from './emailbuilder-query-keys';

const getPurposesFn = async () => {
    const response = await apiClient.get('/api/emailbuilder/purposes/');
    return response.data;
  };
  
  export function useGetPurposes() {
    return useQuery({
      queryKey: emailBuilderQueryKeys.purposes,
      queryFn: getPurposesFn,
    });
  }

