import { useQuery } from '@tanstack/react-query';
import { apiClient } from './api-client';


const getSiteSettingsFn = async () => {
  const response = await apiClient.get('/api/sitesettings/');
  return response.data;
};

export function useGetSiteSettings() {
  return useQuery({
    queryKey: ['sitesettings'],
    queryFn: getSiteSettingsFn
  });
}