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
        'picks_with_filters',
        'last_shown_pick',
        'last_shown_pick_v2',
        'picks_and_profiles_with_filters',
        'chats',
        'warm_chats_v1',
        'warm_refreshments_all_none_local_any_recent_v1',
        'profile-123',
        'profile-456',
        'show_interested_count',
        'theme',
        'textzoom',
        'radius',
        'local',
        'filters',
        'sort',
        'event_filter_type',
        'EXPIRY',
        'unrelated_key',
      ],
    });
  });

  it('removes cache keys while preserving preferences and other saved local state', async () => {
    await clearTransientAppStorage();

    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'picks_with_filters' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'last_shown_pick' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'last_shown_pick_v2' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'picks_and_profiles_with_filters' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'chats' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'warm_chats_v1' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'warm_refreshments_all_none_local_any_recent_v1' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'profile-123' });
    expect(preferencesRemove).toHaveBeenCalledWith({ key: 'profile-456' });

    expect(preferencesRemove).not.toHaveBeenCalledWith({ key: 'EXPIRY' });
    expect(preferencesRemove).not.toHaveBeenCalledWith({ key: 'theme' });
    expect(preferencesRemove).not.toHaveBeenCalledWith({ key: 'textzoom' });
    expect(preferencesRemove).not.toHaveBeenCalledWith({ key: 'show_interested_count' });
    expect(preferencesRemove).not.toHaveBeenCalledWith({ key: 'radius' });
    expect(preferencesRemove).not.toHaveBeenCalledWith({ key: 'local' });
    expect(preferencesRemove).not.toHaveBeenCalledWith({ key: 'filters' });
    expect(preferencesRemove).not.toHaveBeenCalledWith({ key: 'sort' });
    expect(preferencesRemove).not.toHaveBeenCalledWith({ key: 'event_filter_type' });
    expect(preferencesRemove).not.toHaveBeenCalledWith({ key: 'unrelated_key' });
  });
});
