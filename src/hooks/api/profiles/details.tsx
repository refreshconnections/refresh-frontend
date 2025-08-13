import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { userQueryKeys } from './user-query-keys';
import { useInitialData } from '../../useInitialData';
import { storeProfileWithMaxLimit } from '../../capacitorPreferences/profiles';
import { useEffect } from 'react';


// Function to generate a random delay between 1 and 5 seconds
// const randomDelay = () => {
//   const min = 1000; // 1 second
//   const max = 5000; // 5 seconds
//   return Math.floor(Math.random() * (max - min + 1)) + min; // Random number between 1000 and 5000ms
// };

// const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


export const getProfileDetailsFn = async ({ queryKey }) => {

  const response = await apiClient.get(`/api/profiles/${queryKey[2]}`);
  const preferencesStorageKey = queryKey[2] ? `profile-${queryKey[2]}` : null;

  const responseData = response.data
  if (!!preferencesStorageKey) {
    await storeProfileWithMaxLimit(preferencesStorageKey, responseData);
  }

  // console.log("calling over here", response.data)

  return response.data;
};

export function useProfileDetails(id: number, enabledSetting: boolean = true) {


  const preferencesStorageKey = id ? `profile-${id}` : '';

  // Call the useInitialData hook unconditionally
  const {
    data: initialData,
    isLoading: initialLoading,
    error: initialError,
    refetch: initialRefetch,
    isFetching: initialIsFetching,
  } = useInitialData({
    preferencesStorageKey,
    enabledSetting
  });

  // Use useQuery hook unconditionally
  const queryResult = useQuery({
    queryKey: userQueryKeys.detail(Number(id)),
    queryFn: getProfileDetailsFn,
    initialData,  // Initial data if available
    retry: 4,
    enabled: enabledSetting && !!id && !initialLoading,  // Enable based on options and id,
    staleTime: 60000 * 60, // 30 min stale time
  });


  // Manually trigger the refetch when the component mounts
  useEffect(() => {
    if (
      !!id && 
      enabledSetting && 
      initialData == null &&  // Only refetch if initialData is null
      queryResult.data === undefined && 
      !queryResult.isFetching // Only refetch if it's not already fetching
    ) {
      queryResult.refetch();
    }

  }, [id, initialData, queryResult.refetch, initialLoading, enabledSetting, queryResult.isFetching]);

    // Manually trigger the refetch when the component mounts
    useEffect(() => {

      if (!!id && queryResult.data === null && enabledSetting) {
        queryResult.refetch();
      }
  
    }, [queryResult.data, enabledSetting]);

  // Handle the case where initial data is still loading
  if (initialLoading) {
    return {
      data: null,
      isLoading: true,
      error: null,
      isFetching: queryResult.isFetching,
      refetch: initialRefetch,
    };
  }

  // Handle the case where initial data is still loading
  if (initialData && queryResult.isLoading) {
    return {
      data: initialData, // Show initial data while loading
      isLoading: true,
      error: null,
      isFetching: queryResult.isFetching,
      refetch: initialRefetch,
    };
  }

  // Handle the case where there is an error loading initial data
  if (initialError) {
    return {
      data: null,
      isLoading: false,
      error: initialError,
      isFetching: queryResult.isFetching,
      refetch: initialRefetch,
    };
  }

  // Normal case: Data loaded, no errors
  return { 
    data: queryResult.data ?? initialData ?? null,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    isFetching: queryResult.isFetching,
    refetch: queryResult.refetch,
  };
}

