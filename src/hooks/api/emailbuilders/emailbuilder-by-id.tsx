import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { emailBuilderQueryKeys } from './emailbuilder-query-keys';


export const getEmailBuilderDetailsFn = async ({queryKey}) => {
  const response = await apiClient.get(`/api/emailbuilder/emailbuilder/${queryKey[2]}`);
  return response.data;
};


export function useEmailBuilderDetails(id: number) {
  

  return useQuery({
    queryKey: emailBuilderQueryKeys.detail(Number(id)),
    queryFn: getEmailBuilderDetailsFn,
    enabled: !!id
  });
}