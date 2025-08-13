import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { emailBuilderQueryKeys } from './emailbuilder-query-keys';


export const getPurposeByIdFn = async ({queryKey}) => {
  const response = await apiClient.get(`/api/emailbuilder/purpose/${queryKey[2]}`);
  return response.data;
};


export function usePurposeById(id: number) {
  

  return useQuery({
    queryKey: emailBuilderQueryKeys.purposes_by_id(Number(id)),
    queryFn: getPurposeByIdFn,
    enabled: !!id
  });
}