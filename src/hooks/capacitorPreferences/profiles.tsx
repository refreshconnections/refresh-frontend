import { Preferences } from '@capacitor/preferences';
import { setWithExpiry } from './all';

// Constants
const MAX_PROFILES = 20;
const TTL = 1000 * 60 * 60 * 24; // 24 hours

// Utility functions

// Get all profile keys stored in Preferences
const getAllProfileKeys = async () => {
  const allKeys = await Preferences.keys();
  return allKeys.keys.filter((key: string) => key.startsWith('profile-'));
};

// Store profile data with expiration and manage the maximum number of profiles
export const storeProfileWithMaxLimit = async (storageKey, profileData) => {
  const profileKey = `${storageKey}`;

  // 1. Get existing profile keys
  const existingProfileKeys = await getAllProfileKeys();

  // 2. Store the new profile with expiration time (TTL)
  await setWithExpiry(profileKey, profileData, TTL);

  // 3. If there are already 20 profiles, remove the oldest
  if (existingProfileKeys.length >= MAX_PROFILES) {
    // Sort the existing profile keys by ID (assumes profiles are named profile-<ID>)
    existingProfileKeys.sort((a, b) => {
      const idA = parseInt(a.split('-')[1]);
      const idB = parseInt(b.split('-')[1]);
      return idA - idB;
    });

    // Remove the oldest profile (lowest ID)
    const oldestProfileKey = existingProfileKeys[0];
    await Preferences.remove({ key: oldestProfileKey });
  }
};
