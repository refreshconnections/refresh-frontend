import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

const getWithExpiry = vi.fn();
const setWithExpiry = vi.fn();
const apiGet = vi.fn();

vi.mock('./api-client', () => ({
  apiClient: {
    get: (...args: any[]) => apiGet(...args),
    post: vi.fn(),
  },
}));

vi.mock('../capacitorPreferences/all', () => ({
  getWithExpiry: (...args: any[]) => getWithExpiry(...args),
  setWithExpiry: (...args: any[]) => setWithExpiry(...args),
}));

import { useGetInterestedEvents, useGetInterestedPosts } from './interests';

const createWrapper = () => {
  const queryClient = new QueryClient();
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
});
