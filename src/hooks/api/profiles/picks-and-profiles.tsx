import { useEffect, useState } from 'react';
import { useQuery }            from '@tanstack/react-query';
import { apiClient }           from '../api-client';
import { setWithExpiry, getWithExpiry } from '../../capacitorPreferences/all';
import { userQueryKeys }       from './user-query-keys';

/* ─────────────────────────────────────────────────────────────── */
const PICKS_CACHE_KEY = 'picks_and_profiles_with_filters';
const LAST_CACHE_KEY  = 'last_shown_pick_v2';
const LIST_TTL_MS = 1000 * 60 * 60 * 6;       // 6 h
/* ─────────────────────────────────────────────────────────────── */

export const getPicksAndProfilesWithFiltersFn = async () => {
  const { data } = await apiClient.get(
    'api/profiles/randomlist/get_picks_and_profiles_with_filters/',
  );

  await setWithExpiry(PICKS_CACHE_KEY, data, LIST_TTL_MS);

  console.log('network fetch →', data.length, 'profiles');
  return data;
};

/* ─────────────────────────────────────────────────────────────── */
export function usePicksAndProfilesWithFilters() {
  const [initialData, setInitialData] = useState<any[] | undefined>();

useEffect(() => {
  (async () => {
    const list = await getWithExpiry(PICKS_CACHE_KEY) as any[] | undefined;
    const last = await getWithExpiry(LAST_CACHE_KEY);

    console.log('[🧩 CACHE HYDRATION]');
    console.log('‣ Cached picks:', {
      type: typeof list,
      isArray: Array.isArray(list),
      preview: list?.slice?.(0, 2),
    });

    console.log('‣ Cached last_shown_pick_v2:', {
      type: typeof last,
      hasUser: last?.user,
      raw: last,
    });

    const lastId = last?.user ?? null;
    console.log('‣ Derived lastShownId:', lastId);

    if (list?.length) {
      setInitialData(list); // full cached list
      return;
    }

    if (last) {
      setInitialData([last]); // one-item fallback
    }
  })();
}, []);


  return useQuery({
    queryKey: userQueryKeys.picks_and_profiles,
    queryFn: async () => {
      const { data } = await apiClient.get(
        'api/profiles/randomlist/get_picks_and_profiles_with_filters/',
      );

      console.log(`[🌐 Network fetch] ${data.length} profiles`, {
        preview: data?.slice?.(0, 2),
        typeofData: typeof data,
        isArray: Array.isArray(data),
      });

      await setWithExpiry(PICKS_CACHE_KEY, data, LIST_TTL_MS);
      return data;
    },
    retry: 3,
    staleTime: 1000 * 60 * 30,
    initialData,
    placeholderData: prev => prev,
  });
}

