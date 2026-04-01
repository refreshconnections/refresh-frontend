import { beforeEach, describe, expect, it, vi } from 'vitest';

const preferencesRemove = vi.fn();
const preferencesKeys = vi.fn();

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    remove: (...args: any[]) => preferencesRemove(...args),
    keys: (...args: any[]) => preferencesKeys(...args),
    get: vi.fn(),
    set: vi.fn(),
  },
}));

import { clearTransientAppStorage } from './all';

describe('clearTransientAppStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    preferencesKeys.mockResolvedValue({
      keys: [
        'warm_chats_v1',
        'warm_mutuals_v1',
        'warm_interested_posts_page_1_v1',
        'warm_interested_events_page_1_v1',
        'warm_megathreads_all_v1',
        'warm_daily_tip_v1',
        'warm_refreshments_all_none_local_any_recent_v1',
        'unrelated_key',
      ],
    });
  });

  it('removes known transient keys and all warm-cache-prefixed keys', async () => {
    await clearTransientAppStorage();

    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'picks_with_filters' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'last_shown_pick' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'last_shown_pick_v2' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'picks_and_profiles_with_filters' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'chats' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'radius' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'local' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'filters' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'sort' });

    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'warm_chats_v1' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'warm_mutuals_v1' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'warm_interested_posts_page_1_v1' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'warm_interested_events_page_1_v1' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'warm_megathreads_all_v1' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'warm_daily_tip_v1' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'warm_refreshments_all_none_local_any_recent_v1' });
    expect(preferencesRemove).not.toHaveBeenCalledWith({ key: 'unrelated_key' });
  });
});
