import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

const getWithExpiry = vi.fn();
const setWithExpiry = vi.fn();
const apiGet = vi.fn();

vi.mock('../api-client', () => ({
  apiClient: {
    get: (...args: any[]) => apiGet(...args),
  },
}));

vi.mock('../../capacitorPreferences/all', () => ({
  getWithExpiry: (...args: any[]) => getWithExpiry(...args),
  setWithExpiry: (...args: any[]) => setWithExpiry(...args),
}));

import { useGetPosts } from './posts';

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

describe('useGetPosts warm cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates the refreshments bar from cache and then updates with fresh posts within 5 seconds', async () => {
    const network = deferred<{ data: any[] }>();
    getWithExpiry.mockResolvedValue([{ id: 1, title: 'Cached refreshments post' }]);
    apiGet.mockReturnValue(network.promise);

    const { result } = renderHook(() => useGetPosts('all', null, true, null, 'recent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 1, title: 'Cached refreshments post' }]);
    }, { timeout: 5000 });

    network.resolve({ data: [{ id: 2, title: 'Fresh refreshments post' }] });

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 2, title: 'Fresh refreshments post' }]);
    }, { timeout: 5000 });

    expect(setWithExpiry).toHaveBeenCalledWith(
      'warm_refreshments_all_none_local_any_recent_v1',
      [{ id: 2, title: 'Fresh refreshments post' }],
      1000 * 60 * 10,
    );
  });
});
