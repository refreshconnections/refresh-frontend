import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { emailBuilderQueryKeys } from './emailbuilder-query-keys';


  
  export function useGetEmailsByPurposes(purpose?: number) {

    const getEmailsbyPurposeFn = async () => {
    const response = await apiClient.get(`api/emailbuilder/emails/purpose/${purpose}`);
    return response.data;
  }; 

    return useQuery({
      queryKey: emailBuilderQueryKeys.emails_by_purpose(Number(purpose)),
      queryFn: getEmailsbyPurposeFn,
      enabled: !!purpose
    });
  }

