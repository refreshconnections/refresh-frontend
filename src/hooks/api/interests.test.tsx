import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

const getWithExpiry = vi.fn();
const setWithExpiry = vi.fn();
const apiGet = vi.fn();
const apiPost = vi.fn();

vi.mock('./api-client', () => ({
  apiClient: {
    get: (...args: any[]) => apiGet(...args),
    post: (...args: any[]) => apiPost(...args),
  },
}));

vi.mock('../capacitorPreferences/all', () => ({
  getWithExpiry: (...args: any[]) => getWithExpiry(...args),
  setWithExpiry: (...args: any[]) => setWithExpiry(...args),
}));

import { interestQueryKeys, useGetInterestedEvents, useGetInterestedPosts, useInterestEvent, useUninterestEvent } from './interests';

const createWrapper = (queryClient = new QueryClient()) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe('interest hooks warm cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
    apiPost.mockResolvedValue({ data: {} });
  });

  it('hydrates interested posts from cache and then updates with fresh data within 5 seconds', async () => {
    const network = deferred<{ data: any }>();
    getWithExpiry.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{ id: 1, title: 'Cached post' }],
    });
    apiGet.mockReturnValue(network.promise);

    const { result } = renderHook(() => useGetInterestedPosts(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data?.results).toEqual([{ id: 1, title: 'Cached post' }]);
    }, { timeout: 5000 });

    network.resolve({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [{ id: 2, title: 'Fresh post' }],
      },
    });

    await waitFor(() => {
      expect(result.current.data?.results).toEqual([{ id: 2, title: 'Fresh post' }]);
    }, { timeout: 5000 });
  });

  it('hydrates interested events from cache and then updates with fresh data within 5 seconds', async () => {
    const network = deferred<{ data: any }>();
    getWithExpiry.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{ id: 11, name: 'Cached event', start_datetime: '2026-04-01T18:00:00.000Z' }],
    });
    apiGet.mockReturnValue(network.promise);

    const { result } = renderHook(() => useGetInterestedEvents(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data?.results).toEqual([{ id: 11, name: 'Cached event', start_datetime: '2026-04-01T18:00:00.000Z' }]);
    }, { timeout: 5000 });

    network.resolve({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [{ id: 12, name: 'Fresh event', start_datetime: '2026-04-02T18:00:00.000Z' }],
      },
    });

    await waitFor(() => {
      expect(result.current.data?.results).toEqual([{ id: 12, name: 'Fresh event', start_datetime: '2026-04-02T18:00:00.000Z' }]);
    }, { timeout: 5000 });
  });

  it('ignores warm interested events cache entries that are not event-shaped', async () => {
    const network = deferred<{ data: any }>();
    getWithExpiry.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{ id: 36, username: 'amandagreen', profile_image: '/media/debug/profiles/4/pic1_main.jpg' }],
    });
    apiGet.mockReturnValue(network.promise);

    const { result } = renderHook(() => useGetInterestedEvents(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    }, { timeout: 5000 });

    network.resolve({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [{ id: 12, name: 'Fresh event', start_datetime: '2026-04-02T18:00:00.000Z' }],
      },
    });

    await waitFor(() => {
      expect(result.current.data?.results).toEqual([{ id: 12, name: 'Fresh event', start_datetime: '2026-04-02T18:00:00.000Z' }]);
    }, { timeout: 5000 });
  });

  it('adds interested event details to the interested events cache', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(interestQueryKeys.eventsPage(1), {
      count: 1,
      next: null,
      previous: null,
      results: [{ id: 11, name: 'Existing event', start_datetime: '2026-04-01T18:00:00.000Z' }],
    });

    const { result } = renderHook(() => useInterestEvent(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({
      id: 12,
      name: 'New event',
      start_datetime: '2026-04-02T18:00:00.000Z',
      end_datetime: '2026-04-02T19:00:00.000Z',
    });

    expect(apiPost).toHaveBeenCalledWith('/api/refreshments/interest_event/', { event_id: 12 });
    expect(queryClient.getQueryData<any>(interestQueryKeys.eventsPage(1))).toEqual({
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          id: 12,
          name: 'New event',
          start_datetime: '2026-04-02T18:00:00.000Z',
          end_datetime: '2026-04-02T19:00:00.000Z',
          interested: true,
        },
        { id: 11, name: 'Existing event', start_datetime: '2026-04-01T18:00:00.000Z' },
      ],
    });
  });

  it('removes uninterested events from the interested events cache', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(interestQueryKeys.eventsPage(1), {
      count: 2,
      next: null,
      previous: null,
      results: [
        { id: 11, name: 'Existing event', start_datetime: '2026-04-01T18:00:00.000Z' },
        { id: 12, name: 'New event', start_datetime: '2026-04-02T18:00:00.000Z' },
      ],
    });

    const { result } = renderHook(() => useUninterestEvent(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync(12);

    expect(apiPost).toHaveBeenCalledWith('/api/refreshments/uninterest_event/', { event_id: 12 });
    expect(queryClient.getQueryData<any>(interestQueryKeys.eventsPage(1))).toEqual({
      count: 1,
      next: null,
      previous: null,
      results: [
        { id: 11, name: 'Existing event', start_datetime: '2026-04-01T18:00:00.000Z' },
      ],
    });
  });
});
