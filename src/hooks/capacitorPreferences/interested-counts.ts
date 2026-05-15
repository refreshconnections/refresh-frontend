import { Preferences } from '@capacitor/preferences';

export const SHOW_INTERESTED_COUNT_PREF_KEY = 'show_interested_count';
export const HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_PREF_KEY = 'hide_interested_count_on_my_submissions';

export const SHOW_INTERESTED_COUNT_CHANGED_EVENT = 'show_interested_count_changed';
export const HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_CHANGED_EVENT = 'hide_interested_count_on_my_submissions_changed';

const parseBooleanPref = (value: string | null | undefined, fallback: boolean) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
};

export async function getShowInterestedCountPref() {
  const { value } = await Preferences.get({ key: SHOW_INTERESTED_COUNT_PREF_KEY });
  return parseBooleanPref(value, true);
}

export async function setShowInterestedCountPref(value: boolean) {
  await Preferences.set({ key: SHOW_INTERESTED_COUNT_PREF_KEY, value: String(value) });
}

export async function getHideInterestedCountOnMySubmissionsPref() {
  const { value } = await Preferences.get({ key: HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_PREF_KEY });
  return parseBooleanPref(value, false);
}

export async function setHideInterestedCountOnMySubmissionsPref(value: boolean) {
  await Preferences.set({ key: HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_PREF_KEY, value: String(value) });
}
