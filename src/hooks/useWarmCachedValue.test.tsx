import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const getWithExpiry = vi.fn();
const setWithExpiry = vi.fn();

vi.mock('./capacitorPreferences/all', () => ({
  getWithExpiry: (...args: any[]) => getWithExpiry(...args),
  setWithExpiry: (...args: any[]) => setWithExpiry(...args),
}));

import { useWarmCachedValue } from './useWarmCachedValue';

describe('useWarmCachedValue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps warm cached data visible until fresh source data arrives', async () => {
    getWithExpiry.mockResolvedValue([{ id: 1, label: 'cached' }]);

    const { result, rerender } = renderHook(
      ({ sourceData }) => useWarmCachedValue('warm_key', sourceData, 1000 * 60),
      {
        initialProps: { sourceData: undefined as any[] | undefined },
      }
    );

    await waitFor(() => {
      expect(result.current.cacheLoaded).toBe(true);
      expect(result.current.cachedData).toEqual([{ id: 1, label: 'cached' }]);
    });

    rerender({ sourceData: undefined });

    expect(result.current.cachedData).toEqual([{ id: 1, label: 'cached' }]);

    rerender({ sourceData: [{ id: 2, label: 'fresh' }] });

    await waitFor(() => {
      expect(result.current.cachedData).toEqual([{ id: 2, label: 'fresh' }]);
    });

    expect(setWithExpiry).toHaveBeenCalledWith(
      'warm_key',
      [{ id: 2, label: 'fresh' }],
      1000 * 60,
    );
  });

  it('does not expose cached data when the warm cache is expired or missing', async () => {
    getWithExpiry.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useWarmCachedValue('warm_key', undefined, 1000 * 60)
    );

    await waitFor(() => {
      expect(result.current.cacheLoaded).toBe(true);
    });

    expect(result.current.cachedData).toBeUndefined();
    expect(setWithExpiry).not.toHaveBeenCalled();
  });
});
