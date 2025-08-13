

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';


const getSettingsCurrentProfileFn = async () => {
  const response = await apiClient.get('/api/profiles/settings_current/');
  return response.data;
};

export function useGetSettingsCurrentProfile() {
  return useQuery({
    queryKey: userQueryKeys.settings_current,
    queryFn: getSettingsCurrentProfileFn,
    enabled: !!localStorage.getItem('token')
  });
}