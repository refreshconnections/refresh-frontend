import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';

export function usePushNotificationSettings(id: number | null) {
  // const { id } = useParams<{ id: string }>();

  const getPushNotificationSettingsFn = async () => {
    const response = await apiClient.get(`/api/profiles/push_notification_settings/${id ?? ''}`);
    return response.data
  };

  return useQuery({
    queryKey: userQueryKeys.push_notification_settings(Number(id)),
    queryFn: getPushNotificationSettingsFn
  });
}