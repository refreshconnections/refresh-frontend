import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api-client';
import { postQueryKeys } from './refreshments/post-query-keys';
import type { RefreshEvent } from './events';

export const interestQueryKeys = {
  posts: ['interests', 'posts'] as const,
  postsPage: (page: number) => ['interests', 'posts', page] as const,
  events: ['interests', 'events'] as const,
  eventsPage: (page: number) => ['interests', 'events', page] as const,
};

export type InterestedPost = {
  id: number;
  title: string;
  content?: string;
  preview?: string;
  comment_count?: number;
  markdown?: boolean;
  category?: string;
  location?: string;
  uploadDateTime?: string;
  coverPhoto?: string | null;
};

type PaginatedResponse<T> = {
  next: number | null;
  previous: number | null;
  count: number;
  results: T[];
};

export function useGetInterestedPosts(page = 1) {
  return useQuery({
    queryKey: interestQueryKeys.postsPage(page),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<InterestedPost>>(`/api/profiles/interested_posts/?page=${page}`);
      return response.data;
    },
    enabled: !!localStorage.getItem('token'),
  });
}

export function useGetInterestedEvents(page = 1) {
  return useQuery({
    queryKey: interestQueryKeys.eventsPage(page),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<RefreshEvent>>(`/api/profiles/interested_events/?page=${page}`);
      return response.data;
    },
    enabled: !!localStorage.getItem('token'),
  });
}

export function useInterestPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (announcementId: number) => {
      const response = await apiClient.post('/api/refreshments/interest_post/', { announcement_id: announcementId });
      return response.data;
    },
    onSuccess: (_, announcementId) => {
      queryClient.invalidateQueries({ queryKey: interestQueryKeys.posts, exact: false });
      queryClient.invalidateQueries({ queryKey: postQueryKeys.dynamicpostcontent(announcementId) });
    },
  });
}

export function useUninterestPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (announcementId: number) => {
      const response = await apiClient.post('/api/refreshments/uninterest_post/', { announcement_id: announcementId });
      return response.data;
    },
    onSuccess: (_, announcementId) => {
      queryClient.invalidateQueries({ queryKey: interestQueryKeys.posts, exact: false });
      queryClient.invalidateQueries({ queryKey: postQueryKeys.dynamicpostcontent(announcementId) });
    },
  });
}

export function useInterestEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiClient.post('/api/refreshments/interest_event/', { event_id: eventId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interestQueryKeys.events, exact: false });
      queryClient.invalidateQueries({ queryKey: ['events'], exact: false });
    },
  });
}

export function useUninterestEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiClient.post('/api/refreshments/uninterest_event/', { event_id: eventId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interestQueryKeys.events, exact: false });
      queryClient.invalidateQueries({ queryKey: ['events'], exact: false });
    },
  });
}
