import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api-client';
import { postQueryKeys } from './refreshments/post-query-keys';
import type { RefreshEvent } from './events';
import { useWarmCachedValue, WARM_CACHE_QUERY_OPTIONS } from '../useWarmCachedValue';

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

type EventInterestTarget = number | RefreshEvent;

const getEventInterestId = (target: EventInterestTarget) => (
  typeof target === 'number' ? target : target.id
);

const isEventPage = (data: PaginatedResponse<RefreshEvent> | undefined): data is PaginatedResponse<RefreshEvent> => {
  if (!data || !Array.isArray(data.results)) return false;
  return data.results.every((event) => (
    typeof event?.id === 'number' &&
    typeof event?.name === 'string' &&
    typeof event?.start_datetime === 'string'
  ));
};

export function useGetInterestedPosts(page = 1) {
  const query = useQuery({
    queryKey: interestQueryKeys.postsPage(page),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<InterestedPost>>(`/api/profiles/interested_posts/?page=${page}`);
      return response.data;
    },
    enabled: !!localStorage.getItem('token'),
    ...WARM_CACHE_QUERY_OPTIONS,
  });

  const { cachedData } = useWarmCachedValue(
    `warm_interested_posts_page_${page}_v1`,
    query.data,
    1000 * 60 * 10,
    !!localStorage.getItem('token'),
  );

  return {
    ...query,
    data: query.data ?? cachedData,
    isLoading: query.isLoading && !cachedData,
  };
}

export function useGetInterestedEvents(page = 1) {
  const query = useQuery({
    queryKey: interestQueryKeys.eventsPage(page),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<RefreshEvent>>(`/api/profiles/interested_events/?page=${page}`);
      return response.data;
    },
    enabled: !!localStorage.getItem('token'),
    ...WARM_CACHE_QUERY_OPTIONS,
  });

  const { cachedData } = useWarmCachedValue(
    `warm_interested_events_page_${page}_v2`,
    query.data,
    1000 * 60 * 10,
    !!localStorage.getItem('token'),
  );

  const validCachedData = isEventPage(cachedData) ? cachedData : undefined;

  return {
    ...query,
    data: query.data ?? validCachedData,
    isLoading: query.isLoading && !validCachedData,
  };
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
    mutationFn: async (target: EventInterestTarget) => {
      const eventId = getEventInterestId(target);
      const response = await apiClient.post('/api/refreshments/interest_event/', { event_id: eventId });
      return response.data;
    },
    onSuccess: (_, target) => {
      if (typeof target !== 'number') {
        queryClient.setQueryData<PaginatedResponse<RefreshEvent>>(interestQueryKeys.eventsPage(1), (current) => {
          if (!current || current.results.some((event) => event.id === target.id)) {
            return current;
          }
          return {
            ...current,
            count: current.count + 1,
            results: [{ ...target, interested: true }, ...current.results],
          };
        });
      }
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
    onSuccess: (_, eventId) => {
      queryClient.setQueriesData<PaginatedResponse<RefreshEvent>>({ queryKey: interestQueryKeys.events, exact: false }, (current) => {
        if (!current) return current;
        const nextResults = current.results.filter((event) => event.id !== eventId);
        if (nextResults.length === current.results.length) return current;
        return {
          ...current,
          count: Math.max(0, current.count - (current.results.length - nextResults.length)),
          results: nextResults,
        };
      });
      queryClient.invalidateQueries({ queryKey: interestQueryKeys.events, exact: false });
      queryClient.invalidateQueries({ queryKey: ['events'], exact: false });
    },
  });
}
