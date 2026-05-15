import { Preferences } from '@capacitor/preferences';

export const SHOW_ADD_TO_CALENDAR_PREF_KEY = 'show_add_to_calendar';
export const SHOW_ADD_TO_CALENDAR_CHANGED_EVENT = 'show_add_to_calendar_changed';

const parseBooleanPref = (value: string | null | undefined, fallback: boolean) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

export async function getShowAddToCalendarPref() {
  const { value } = await Preferences.get({ key: SHOW_ADD_TO_CALENDAR_PREF_KEY });
  return parseBooleanPref(value, true);
}

export async function setShowAddToCalendarPref(value: boolean) {
  await Preferences.set({ key: SHOW_ADD_TO_CALENDAR_PREF_KEY, value: String(value) });
}
