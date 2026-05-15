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

import { useChatGroups } from './chat-groups';

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

describe('useChatGroups warm cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  it('hydrates from warm cache and updates to fresh network data within 5 seconds', async () => {
    const network = deferred<{ data: any }>();
    getWithExpiry.mockResolvedValue({
      group1_name: 'Cached group',
      group2_name: null,
      group3_name: null,
      group1_hidden: false,
      group2_hidden: false,
      group3_hidden: false,
      group1: [{ id: 1, name: 'Alice', pic1_main: null }],
      group2: [],
      group3: [],
    });
    apiGet.mockReturnValue(network.promise);

    const { result } = renderHook(() => useChatGroups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data?.group1_name).toBe('Cached group');
    }, { timeout: 5000 });

    network.resolve({
      data: {
        group1_name: 'Fresh group',
        group2_name: null,
        group3_name: null,
        group1_hidden: false,
        group2_hidden: false,
        group3_hidden: false,
        group1: [{ id: 2, name: 'Bob', pic1_main: null }],
        group2: [],
        group3: [],
      },
    });

    await waitFor(() => {
      expect(result.current.data?.group1_name).toBe('Fresh group');
    }, { timeout: 5000 });

    expect(setWithExpiry).toHaveBeenCalledWith(
      'warm_chats_groups_v1',
      expect.objectContaining({ group1_name: 'Fresh group' }),
      1000 * 60 * 10,
    );
  });
});
