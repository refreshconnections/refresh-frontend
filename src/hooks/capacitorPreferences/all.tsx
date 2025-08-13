import { Preferences } from '@capacitor/preferences';

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
