import { Preferences } from '@capacitor/preferences';

export const SHOW_EVENTS_THIS_WEEK_ROW_PREF_KEY = 'show_events_this_week_row';
export const SHOW_EVENTS_THIS_WEEK_ROW_CHANGED_EVENT = 'show_events_this_week_row_changed';

const parseBooleanPref = (value: string | null | undefined, fallback: boolean) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

export async function getShowEventsThisWeekRowPref() {
  const { value } = await Preferences.get({ key: SHOW_EVENTS_THIS_WEEK_ROW_PREF_KEY });
  return parseBooleanPref(value, true);
}

export async function setShowEventsThisWeekRowPref(value: boolean) {
  await Preferences.set({ key: SHOW_EVENTS_THIS_WEEK_ROW_PREF_KEY, value: String(value) });
}
