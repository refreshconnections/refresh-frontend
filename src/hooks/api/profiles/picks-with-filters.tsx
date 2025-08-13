import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { setWithExpiry } from '../../capacitorPreferences/all';
import { useInitialData } from '../../useInitialData';
import { useEffect } from 'react';

const TTL = 1000 * 60 * 60 * 24; // 24 hours

// // Function to generate a random delay between 1 and 5 seconds
// const randomDelay = () => {
//   const min = 1000; // 1 second
//   const max = 5000; // 5 seconds
//   return Math.floor(Math.random() * (max - min + 1)) + min; // Random number between 1000 and 5000ms
// };

// const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getPicksWithFiltersFlatFn = async () => {
  const preferencesStorageKey = 'picks_with_filters';

  const response = await apiClient.get('api/profiles/randomlist/get_flat_picks/');

  console.log("response.data", response.data)

  const responseData = response.data
  await setWithExpiry(preferencesStorageKey, responseData, TTL);

  return responseData;
};

// The custom hook with localStorage expiry
export function usePicksWithFiltersFlat() {
  const preferencesStorageKey = 'picks_with_filters';

  // Call the useInitialData hook unconditionally
  const {
    data: initialData,
    isLoading: initialLoading,
    error: initialError,
    refetch: initialRefetch,
    isFetching: initialIsFetching,
  } = useInitialData({
    preferencesStorageKey,
  });

  const queryResult = useQuery({
    queryKey: ['picks_with_filters'],
    initialData: initialData,
    queryFn: getPicksWithFiltersFlatFn,
    retry: 3, // Optionally, you can set retry attempts in case of failure,
    staleTime: 60000 * 30, // 30 min stale time
  });

  // Manually trigger the refetch when the component mounts
  useEffect(() => {
    if (initialData || (initialData == null && !initialLoading)) {
      queryResult.refetch();
    }
  }, [initialData, queryResult.refetch, initialLoading]);

  // If initial data is still loading, show loading state
  if (initialLoading) {
    return {
      data: initialData ?? null, // Show initialData or null if not available
      isLoading: true,
      error: null,
      isFetching: true,
      refetch: initialRefetch,
    };
  }

  // If there's an error loading the initial data, show error state
  if (initialError) {
    return {
      data: initialData ?? null, // Show initialData or null if not available
      isLoading: false,
      error: initialError,
      isFetching: false,
      refetch: initialRefetch,
    };
  }

  // Normal case: Data loaded, no errors
  return {
    data: queryResult.data ?? initialData ?? null, // Show queryResult data or initialData if not available
    isLoading: queryResult.isLoading || initialLoading, // Loading if either the query or initial data is loading
    error: queryResult.error || initialError, // Show error from either the query or initial load
    isFetching: queryResult.isFetching || initialIsFetching, // Fetching if either is fetching
    refetch: queryResult.refetch,
  };

}

