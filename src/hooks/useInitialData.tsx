import { useState, useEffect, useCallback } from 'react';
import { getWithExpiry } from './capacitorPreferences/all';

// A hook for fetching initial data from Capacitor storage
export function useInitialData({ preferencesStorageKey, enabledSetting = true }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Function to manually refetch the data
  const refetch = useCallback(async () => {
    setIsFetching(true);
    try {
      // Await the async call to get data with expiry
      const storedData = await getWithExpiry(preferencesStorageKey);
      if (storedData) {
        setData(storedData);
      } else {
        setData(null); // Handle case where no data is returned
      }
    } catch (e) {
      setError(e); // Handle errors if fetching fails
    } finally {
        setIsFetching(false);
    }
  }, [preferencesStorageKey]); // refetch depends on preferencesStorageKey and expiryTime

  // Always call the hook unconditionally with async data fetch
  useEffect(() => {
    const loadData = async () => {
      if (preferencesStorageKey && enabledSetting) {
        try {
          const storedData = await getWithExpiry(preferencesStorageKey);
          if (storedData) {
            setData(storedData);
          } else {
            setData(null); // If no data, set as null or handle as needed
          }
        } catch (e) {
          setError("initialData error"); // Handle errors
        } finally {
          setIsLoading(false); // Set loading to false when done
        }
      } else {
        setIsLoading(false); // Set loading to false if no key is provided
      }
    };

    loadData(); // Call the async function to load data
  }, [preferencesStorageKey]); // Dependencies for effect

  return { data, isLoading, error, refetch, isFetching };
}
