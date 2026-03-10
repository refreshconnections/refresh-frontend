import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';

const getAnnouncementSuggestions = async (query: string) => {
  const params = new URLSearchParams();
  if (query) {
    params.set('q', query);
  }
  const response = await apiClient.get(`/api/announcements/suggestions/?${params.toString()}`);
  return response.data;
};

export function useGetAnnouncementSuggestions(query: string) {
  return useQuery({
    queryKey: ['announcement-suggestions', query],
    queryFn: () => getAnnouncementSuggestions(query),
    enabled: query.length >= 3,
  });
}
