import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

import { useLocalMutualConnections } from './local-mutual-connections';

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

describe('useLocalMutualConnections warm cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  it('hydrates from warm cache and updates to fresh network data within 5 seconds', async () => {
    const network = deferred<{ data: number[] | null }>();
    getWithExpiry.mockResolvedValue([11, 22]);
    apiGet.mockReturnValue(network.promise);

    const { result } = renderHook(() => useLocalMutualConnections(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([11, 22]);
    }, { timeout: 5000 });

    network.resolve({ data: [33, 44] });

    await waitFor(() => {
      expect(result.current.data).toEqual([33, 44]);
    }, { timeout: 5000 });

    expect(setWithExpiry).toHaveBeenCalledWith(
      'warm_chats_local_v1',
      [33, 44],
      1000 * 60 * 10,
    );
  });
});
