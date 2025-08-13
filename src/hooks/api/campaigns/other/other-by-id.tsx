import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api-client';


export const getOtherDetailsFn = async ({queryKey}) => {
  const response = await apiClient.get(`/api/campaigns/other/${queryKey[2]}`);
  return response.data;
};


export function useOtherDetails(id: number) {
  

  return useQuery({
    queryKey: ['campaign', 'other', id],
    queryFn: getOtherDetailsFn,
    enabled: !!id
  });
}