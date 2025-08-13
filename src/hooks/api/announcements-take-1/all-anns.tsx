import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { annQueryKeys } from './ann-query-keys';

const getAllAnnouncementsTake1Fn = async () => {
    const response = await apiClient.get('/api/announcements/all/');
    return response.data;
  };
  
  export function useGetAllAnnouncementsTake1Fn() {
    return useQuery({
      queryKey: annQueryKeys.all,
      queryFn: getAllAnnouncementsTake1Fn,
    });
  }