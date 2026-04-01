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

import { useGetMutualConnections } from './mutual-connections';

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

describe('useGetMutualConnections warm cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates mutuals from cache and then updates to fresh data within 5 seconds', async () => {
    const network = deferred<{ data: number[] }>();
    getWithExpiry.mockResolvedValue([101, 102]);
    apiGet.mockReturnValue(network.promise);

    const { result } = renderHook(() => useGetMutualConnections(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([101, 102]);
    }, { timeout: 5000 });

    network.resolve({ data: [201, 202, 203] });

    await waitFor(() => {
      expect(result.current.data).toEqual([201, 202, 203]);
    }, { timeout: 5000 });

    expect(setWithExpiry).toHaveBeenCalledWith(
      'warm_mutuals_v1',
      [201, 202, 203],
      1000 * 60 * 10,
    );
  });
});
