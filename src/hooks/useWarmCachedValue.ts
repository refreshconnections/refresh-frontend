import { useEffect, useState } from 'react';
import { getWithExpiry, setWithExpiry } from './capacitorPreferences/all';

export const WARM_CACHE_QUERY_OPTIONS = {
  staleTime: 0,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
};

export function useWarmCachedValue<T>(
  key: string,
  sourceData: T | undefined,
  ttl: number,
  enabled: boolean = true,
) {
  const [cachedData, setCachedData] = useState<T | undefined>(undefined);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setCachedData(undefined);
      setCacheLoaded(true);
      return;
    }

    setCacheLoaded(false);

    const hydrate = async () => {
      const cached = await getWithExpiry(key);
      if (cancelled) return;
      if (cached !== null && cached !== undefined) {
        setCachedData(cached as T);
      }
      setCacheLoaded(true);
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [enabled, key]);

  useEffect(() => {
    if (!enabled || sourceData === undefined) return;
    setCachedData(sourceData);
    void setWithExpiry(key, sourceData, ttl);
  }, [enabled, key, sourceData, ttl]);

  return { cachedData, cacheLoaded };
}
