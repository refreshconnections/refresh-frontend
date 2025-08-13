import { Preferences } from "@capacitor/preferences";

// Function to remove a selected pick from Capacitor Preferences
export const removePickFromCapacitorLocalStorage = async (pickId) => {
    // Retrieve the cached picks data from Capacitor Preferences
    const { value } = await Preferences.get({ key: 'picks_with_filters' });
  
    // Check if there is cached data
    if (value) {
      const cachedData = JSON.parse(value);
      const { value: pickList, expiry } = cachedData;
  
      if (pickList) {
        // Filter out the pickId from the pick list
        const updatedData = pickList.filter((pick) => pick !== pickId);
  
        // Save the updated picks back to Preferences with the same expiry time
        await Preferences.set({
          key: 'picks_with_filters',
          value: JSON.stringify({ value: updatedData, expiry }),
        });
      }
    }
  };