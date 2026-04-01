import { Preferences } from '@capacitor/preferences';

const TRANSIENT_CACHE_KEYS = [
  'picks_with_filters',
  'last_shown_pick',
  'last_shown_pick_v2',
  'picks_and_profiles_with_filters',
  'chats',
  'radius',
  'local',
  'filters',
  'sort',
];

const TRANSIENT_CACHE_PREFIXES = [
  'warm_chats_',
  'warm_mutuals_',
  'warm_interested_posts_',
  'warm_interested_events_',
  'warm_megathreads_',
  'warm_daily_tip_',
  'warm_refreshments_',
];

// Function to set data with an expiry time
export const setWithExpiry = async (key, value, ttl) => {
  const expiryTime = Date.now() + ttl;

  console.log(`[🟢 setWithExpiry] key: ${key}`, {
    typeofValue: typeof value,
    isArray: Array.isArray(value),
    expiry: new Date(expiryTime).toISOString(),
    preview: Array.isArray(value) ? value.slice(0, 2) : value,
  });

  await Preferences.set({
    key,
    value: JSON.stringify({
      value,
      expiry: expiryTime,
    }),
  });
};

// Function to get data with an expiry check
export const getWithExpiry = async (key) => {
  const { value } = await Preferences.get({ key });

  if (!value) {
    console.warn(`[⚠️ getWithExpiry] key: ${key} — No value found`);
    return null;
  }

  try {
    const { value: storedData, expiry } = JSON.parse(value);

    const isExpired = Date.now() > expiry;
    console.log(`[🔵 getWithExpiry] key: ${key}`, {
      expiry: new Date(expiry).toISOString(),
      expired: isExpired,
      typeofStoredData: typeof storedData,
      isArray: Array.isArray(storedData),
      preview: Array.isArray(storedData) ? storedData.slice(0, 2) : storedData,
    });

    if (isExpired) {
      console.warn(`[⏰ EXPIRED] key: ${key} — removing`);
      await Preferences.remove({ key });
      return null;
    }

    // Optional: check if value is accidentally double-stringified
    if (typeof storedData === 'string') {
      try {
        const parsedAgain = JSON.parse(storedData);
        console.warn(`[🧨 DOUBLE ENCODED?] key: ${key}`, parsedAgain);
        return parsedAgain;
      } catch {
        // just return the string as-is
      }
    }

    return storedData;

  } catch (error) {
    console.error(`[❌ JSON parse error] key: ${key}`, error, value);
    return null;
  }
};

// Function to remove data
export const removeFromCapacitorLocalStorage = async (key) => {
  console.log(`[🗑️ removeFromCapacitorLocalStorage] key: ${key}`);
  await Preferences.remove({ key });
};

export const clearTransientAppStorage = async () => {
  for (const key of TRANSIENT_CACHE_KEYS) {
    await Preferences.remove({ key });
  }

  const { keys } = await Preferences.keys();
  const matchingWarmKeys = keys.filter((key) =>
    TRANSIENT_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix))
  );

  for (const key of matchingWarmKeys) {
    await Preferences.remove({ key });
  }
};
