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

import { useGetCurrentUserChats } from './current-user-chats';

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

describe('useGetCurrentUserChats warm cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  it('hydrates from warm cache and updates to fresh network data within 5 seconds', async () => {
    const network = deferred<{ data: any[] }>();
    getWithExpiry.mockResolvedValue([{ id: 1, other_user_id: '10' }]);
    apiGet.mockReturnValue(network.promise);

    const { result } = renderHook(() => useGetCurrentUserChats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 1, other_user_id: '10' }]);
    }, { timeout: 5000 });

    network.resolve({ data: [{ id: 2, other_user_id: '11' }] });

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 2, other_user_id: '11' }]);
    }, { timeout: 5000 });

    expect(setWithExpiry).toHaveBeenCalledWith(
      'warm_chats_v1',
      [{ id: 2, other_user_id: '11' }],
      1000 * 60 * 10,
    );
  });

  it('refetches on mount even when React Query still has in-memory data', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Infinity,
        },
      },
    });
    queryClient.setQueryData(['chats'], [{ id: 1, other_user_id: '10' }]);
    getWithExpiry.mockResolvedValue(null);
    apiGet.mockResolvedValue({ data: [{ id: 2, other_user_id: '11' }] });

    const { result } = renderHook(() => useGetCurrentUserChats(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.data).toEqual([{ id: 1, other_user_id: '10' }]);

    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('/api/profiles/chats/dialogs_v2/');
    }, { timeout: 5000 });

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 2, other_user_id: '11' }]);
    }, { timeout: 5000 });

    expect(setWithExpiry).toHaveBeenLastCalledWith(
      'warm_chats_v1',
      [{ id: 2, other_user_id: '11' }],
      1000 * 60 * 10,
    );
  });
});
