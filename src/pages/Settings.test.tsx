import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp } from '@ionic/react';

const {
  preferencesGet,
  preferencesSet,
  preferencesRemove,
  preferencesClear,
  updateCurrentUserProfile,
  logoutAll,
  logoutCurrent,
  applyThemeFromPref,
  setThemePref,
  setFontSizePref,
  setTextZoom,
  clearStreak,
  removeAllProfilesFromCapacitorStorage,
  clearTransientAppStorage,
  invalidateQueries,
  mockPresentAlert,
  mockPresentModal,
  mockDismissModal,
  getReduceAnimations,
  setReduceAnimationsPref,
} = vi.hoisted(() => ({
  preferencesGet: vi.fn(),
  preferencesRemove: vi.fn(),
  preferencesClear: vi.fn(),
  updateCurrentUserProfile: vi.fn(),
  logoutAll: vi.fn(),
  logoutCurrent: vi.fn(),
  applyThemeFromPref: vi.fn(),
  setThemePref: vi.fn(),
  setFontSizePref: vi.fn(),
  setTextZoom: vi.fn(),
  clearStreak: vi.fn(),
  removeAllProfilesFromCapacitorStorage: vi.fn(),
  clearTransientAppStorage: vi.fn(),
  invalidateQueries: vi.fn(),
  mockPresentAlert: vi.fn(),
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  getReduceAnimations: vi.fn(),
  setReduceAnimationsPref: vi.fn(),
  preferencesSet: vi.fn(),
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');

  return {
    ...actual,
    useIonAlert: () => [mockPresentAlert, vi.fn()],
    useIonModal: () => [mockPresentModal, mockDismissModal],
  };
});

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: (...args: any[]) => preferencesGet(...args),
    set: (...args: any[]) => preferencesSet(...args),
    remove: (...args: any[]) => preferencesRemove(...args),
    clear: (...args: any[]) => preferencesClear(...args),
  },
}));

vi.mock('js-cookie', () => ({
  default: {
    remove: vi.fn(),
  },
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('onesignal-cordova-plugin', () => ({}));

vi.mock('../hooks/utilities', () => ({
  updateCurrentUserProfile: (...args: any[]) => updateCurrentUserProfile(...args),
  logoutAll: (...args: any[]) => logoutAll(...args),
  logoutCurrent: (...args: any[]) => logoutCurrent(...args),
  applyThemeFromPref: (...args: any[]) => applyThemeFromPref(...args),
  setThemePref: (...args: any[]) => setThemePref(...args),
  isMobile: vi.fn(() => false),
  setFontSizePref: (...args: any[]) => setFontSizePref(...args),
  setTextZoom: (...args: any[]) => setTextZoom(...args),
  clearStreak: (...args: any[]) => clearStreak(...args),
  removeAllProfilesFromCapacitorStorage: (...args: any[]) => removeAllProfilesFromCapacitorStorage(...args),
  getReduceAnimations: (...args: any[]) => getReduceAnimations(...args),
  setReduceAnimationsPref: (...args: any[]) => setReduceAnimationsPref(...args),
}));

vi.mock('../hooks/capacitorPreferences/all', () => ({
  clearTransientAppStorage: (...args: any[]) => clearTransientAppStorage(...args),
}));

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: vi.fn(),
}));

vi.mock('../hooks/api/profiles/current-moderation', () => ({
  useGetCurrentModeration: vi.fn(),
}));

vi.mock('../hooks/api/status', () => ({
  useGetStatuses: vi.fn(),
}));

vi.mock('../components/DeleteModal', () => ({
  default: () => <div>delete-modal</div>,
}));

vi.mock('../components/ChangePasswordModal', () => ({
  default: () => <div>change-password-modal</div>,
}));

vi.mock('../components/EditHiddenContentModal', () => ({
  default: () => <div>edit-hidden-content-modal</div>,
}));

vi.mock('../components/EditChatSettingsModal', () => ({
  default: () => <div>edit-chat-settings-modal</div>,
}));

vi.mock('../components/EditPushNotifications', () => ({
  default: () => <div>edit-push-notifications-modal</div>,
}));

vi.mock('../components/EmailSettingsModal', () => ({
  default: () => <div>email-settings-modal</div>,
}));

vi.mock('../components/StatusToast', () => ({
  default: ({ header, message }: { header?: string; message?: string }) => (
    <div>
      <div>status-toast</div>
      {header && <div>{header}</div>}
      {message && <div>{message}</div>}
    </div>
  ),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');

  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: (...args: any[]) => invalidateQueries(...args),
    }),
  };
});

import Settings from './Settings';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useGetCurrentModeration } from '../hooks/api/profiles/current-moderation';
import { useGetStatuses } from '../hooks/api/status';

const mockCurrentProfile = vi.mocked(useGetCurrentProfile);
const mockModeration = vi.mocked(useGetCurrentModeration);
const mockStatuses = vi.mocked(useGetStatuses);

const baseProfile = {
  subscription_level: 'pro',
  settings_new_message_count: true,
  initiate_mode: false,
  settings_profile_banner_bool: true,
  settings_chats_next_reminder: true,
  settings_show_sensitive_content: true,
  email_marketing: true,
  username: 'alex',
  settings_community_profile: true,
  paused_profile: false,
  deactivated_profile: false,
  settings_create_posts: true,
  settings_streak_tracker: true,
  settings_show_streak_increase: true,
  settings_alt_text: true,
  pic1_main: '1.jpg',
  pic2: '2.jpg',
  pic3: '3.jpg',
  bio: 'Hello world',
  looking_for: ['friends'],
  covid_precautions: ['careful'],
};

const renderSettings = () => {
  const queryClient = new QueryClient();

  return render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <Settings />
      </QueryClientProvider>
    </IonApp>
  );
};

beforeEach(() => {
  vi.clearAllMocks();

  preferencesGet.mockResolvedValue({ value: null });
  preferencesGet
    .mockResolvedValueOnce({ value: 'dark' })
    .mockResolvedValueOnce({ value: 'large' });
  preferencesSet.mockResolvedValue(undefined);
  preferencesRemove.mockResolvedValue(undefined);
  preferencesClear.mockResolvedValue(undefined);
  updateCurrentUserProfile.mockResolvedValue(undefined);
  logoutAll.mockResolvedValue(undefined);
  logoutCurrent.mockResolvedValue(undefined);
  clearStreak.mockResolvedValue(undefined);
  removeAllProfilesFromCapacitorStorage.mockResolvedValue(undefined);
  clearTransientAppStorage.mockResolvedValue(undefined);
  getReduceAnimations.mockResolvedValue(false);
  setReduceAnimationsPref.mockResolvedValue(undefined);

  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      href: 'http://localhost/settings',
      reload: vi.fn(),
    },
  });

  mockCurrentProfile.mockReturnValue({ data: baseProfile } as any);
  mockModeration.mockReturnValue({
    data: {
      moderator_paused_check_required: false,
      moderator_paused: false,
      moderator_deactivated: false,
    },
  } as any);
  mockStatuses.mockReturnValue({ data: [] } as any);
});

describe('Settings page', () => {
  it('loads saved theme and font preferences on mount', async () => {
    renderSettings();

    await screen.findByText('Pro Settings');

    expect(preferencesGet).toHaveBeenCalledWith({ key: 'theme' });
    expect(preferencesGet).toHaveBeenCalledWith({ key: 'textzoom' });
    await waitFor(() => {
      expect(setThemePref).toHaveBeenCalledWith('dark');
      expect(setFontSizePref).toHaveBeenCalledWith('large');
    });
  });

  it('reload app clears transient capacitor cache before reloading', async () => {
    renderSettings();
    await screen.findByText('Pro Settings');

    const reloadButton = screen.getByText('Reload app').closest('ion-item')?.querySelector('ion-button') as HTMLElement;
    fireEvent.click(reloadButton);

    await waitFor(() => {
      expect(clearTransientAppStorage).toHaveBeenCalled();
      expect(removeAllProfilesFromCapacitorStorage).toHaveBeenCalled();
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  it('updates a toggle-backed setting when changed', async () => {
    renderSettings();
    await screen.findByText('Pro Settings');

    const newMessageToggle = screen.getByText('New message count').closest('ion-item')?.querySelector('ion-toggle') as HTMLElement;
    fireEvent(
      newMessageToggle,
      new CustomEvent('ionChange', {
        detail: { checked: false },
        bubbles: true,
      })
    );

    await waitFor(() => {
      expect(updateCurrentUserProfile).toHaveBeenCalledWith({ settings_new_message_count: false });
    });
  });

  it('opens the hidden content, push notifications, chat settings, email, password, and delete modals', async () => {
    renderSettings();
    await screen.findByText('Pro Settings');

    fireEvent.click(screen.getAllByText('Edit')[0]);
    fireEvent.click(screen.getAllByText('Edit')[1]);
    fireEvent.click(screen.getAllByText('Edit')[2]);
    fireEvent.click(screen.getByText('Change/Add Email').closest('ion-item')!.querySelector('ion-button') as HTMLElement);
    fireEvent.click(screen.getByText('Change password').closest('ion-item')!.querySelector('ion-button') as HTMLElement);
    fireEvent.click(screen.getByText('Delete your account').closest('ion-item')!.querySelector('ion-button') as HTMLElement);

    expect(mockPresentModal).toHaveBeenCalledTimes(6);
  });

  it('prompts before clearing cached data and clears transient app storage on confirm', async () => {
    renderSettings();
    await screen.findByText('Clear cache');

    fireEvent.click(screen.getByText('Clear cache').closest('ion-item')!.querySelector('ion-button') as HTMLElement);

    const clearAlert = mockPresentAlert.mock.calls.at(-1)?.[0];
    expect(clearAlert.header).toContain('clear your cached data');

    await act(async () => {
      await clearAlert.buttons[1].handler();
    });

    expect(clearTransientAppStorage).toHaveBeenCalledTimes(1);
    expect(removeAllProfilesFromCapacitorStorage).toHaveBeenCalledTimes(1);
  });

  it('logs out only this device and clears local storage state', async () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
    const clearSpy = vi.spyOn(Storage.prototype, 'clear');

    renderSettings();
    await screen.findByText('Logout just this device');

    fireEvent.click(screen.getByText('Logout just this device').closest('ion-item')!.querySelector('ion-button') as HTMLElement);

    await waitFor(() => {
      expect(logoutCurrent).toHaveBeenCalledTimes(1);
      expect(preferencesRemove).toHaveBeenCalledWith({ key: 'EXPIRY' });
      expect(preferencesClear).toHaveBeenCalledTimes(1);
      expect(removeItemSpy).toHaveBeenCalledWith('token');
      expect(clearSpy).toHaveBeenCalled();
    });
  });

  it('logs out all devices and redirects', async () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
    const clearSpy = vi.spyOn(Storage.prototype, 'clear');

    renderSettings();
    await screen.findByText('Logout on all devices');

    fireEvent.click(screen.getByText('Logout on all devices').closest('ion-item')!.querySelector('ion-button') as HTMLElement);

    await waitFor(() => {
      expect(logoutAll).toHaveBeenCalledTimes(1);
      expect(preferencesRemove).toHaveBeenCalledWith({ key: 'EXPIRY' });
      expect(removeItemSpy).toHaveBeenCalledWith('token');
      expect(clearSpy).toHaveBeenCalled();
      expect(window.location.href).toBe('/');
    });
  });

  it('shows an unpause guard alert when required profile fields are missing', async () => {
    mockCurrentProfile.mockReturnValue({
      data: { ...baseProfile, paused_profile: true, pic1_main: null },
    } as any);

    renderSettings();
    await screen.findByText('Unpause profile');

    fireEvent.click(screen.getByText('Unpause profile').closest('ion-item')!.querySelector('ion-button') as HTMLElement);

    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        header: 'Uh oh. Your profile is not ready to be un-paused!',
        subHeader: 'Make sure you have uploaded your first three pictures.',
      })
    );
  });

  it('prompts before pausing a profile', async () => {
    renderSettings();
    await screen.findByText('Pause profile');

    fireEvent.click(screen.getByText('Pause profile').closest('ion-item')!.querySelector('ion-button') as HTMLElement);

    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        header: 'Are you sure you want to pause your profile?',
      })
    );
  });

  it('confirms and pauses a profile', async () => {
    renderSettings();
    await screen.findByText('Pause profile');

    fireEvent.click(screen.getByText('Pause profile').closest('ion-item')!.querySelector('ion-button') as HTMLElement);

    const pauseAlert = mockPresentAlert.mock.calls.at(-1)?.[0];

    await act(async () => {
      await pauseAlert.buttons[1].handler();
    });

    expect(updateCurrentUserProfile).toHaveBeenCalledWith({
      paused_profile: true,
      settings_community_profile: false,
    });
  });

  it('shows the moderator deactivation alert instead of reactivating immediately', async () => {
    mockCurrentProfile.mockReturnValue({
      data: { ...baseProfile, deactivated_profile: true },
    } as any);
    mockModeration.mockReturnValue({
      data: { moderator_deactivated: true },
    } as any);

    renderSettings();
    await screen.findByText('Reactivate profile');

    fireEvent.click(screen.getByText('Reactivate profile').closest('ion-item')!.querySelector('ion-button') as HTMLElement);

    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        header: 'Your account is under review and cannot be reactivated at this time.',
      })
    );
  });

  it('confirms and unpauses a ready profile', async () => {
    mockCurrentProfile.mockReturnValue({
      data: { ...baseProfile, paused_profile: true },
    } as any);

    renderSettings();
    await screen.findByText('Unpause profile');

    fireEvent.click(screen.getByText('Unpause profile').closest('ion-item')!.querySelector('ion-button') as HTMLElement);

    const unpauseAlert = mockPresentAlert.mock.calls.at(-1)?.[0];
    expect(unpauseAlert.header).toBe('Are you sure you want to unpause your profile?');

    await act(async () => {
      await unpauseAlert.buttons[1].handler();
    });

    expect(updateCurrentUserProfile).toHaveBeenCalledWith({ paused_profile: false });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['current'] });
  });

  it('confirms and reactivates a deactivated profile when moderation allows it', async () => {
    mockCurrentProfile.mockReturnValue({
      data: { ...baseProfile, deactivated_profile: true },
    } as any);
    mockModeration.mockReturnValue({
      data: { moderator_deactivated: false },
    } as any);

    renderSettings();
    await screen.findByText('Reactivate profile');

    fireEvent.click(screen.getByText('Reactivate profile').closest('ion-item')!.querySelector('ion-button') as HTMLElement);

    const reactivateAlert = mockPresentAlert.mock.calls.at(-1)?.[0];
    expect(reactivateAlert.header).toBe('Are you sure you want to reactivate your profile?');

    await act(async () => {
      await reactivateAlert.buttons[1].handler();
    });

    expect(updateCurrentUserProfile).toHaveBeenCalledWith({ deactivated_profile: false });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['current'] });
  });

  it('renders the settings status toast when there is an active settings status', async () => {
    mockStatuses.mockReturnValue({
      data: [
        {
          page: 'settings',
          active: true,
          header: 'Settings update',
          message: 'Some settings may take a moment to sync.',
          expirationDateTime: '2099-01-01T00:00:00.000Z',
        },
      ],
    } as any);

    renderSettings();

    expect(await screen.findByText('status-toast')).toBeInTheDocument();
    expect(screen.getByText('Settings update')).toBeInTheDocument();
    expect(screen.getByText('Some settings may take a moment to sync.')).toBeInTheDocument();
  });

  it('does not render the settings status toast when the status is expired', async () => {
    mockStatuses.mockReturnValue({
      data: [
        {
          page: 'settings',
          active: true,
          header: 'Expired',
          message: 'Old status',
          expirationDateTime: '2000-01-01T00:00:00.000Z',
        },
      ],
    } as any);

    renderSettings();
    await screen.findByText('Pro Settings');

    expect(screen.queryByText('status-toast')).not.toBeInTheDocument();
  });

  it('renders the loading shell before preference bootstrap completes', async () => {
    preferencesGet.mockReset();
    preferencesGet.mockImplementation(() => new Promise(() => {}));

    let rendered: ReturnType<typeof renderSettings>;
    await act(async () => {
      rendered = renderSettings();
      await Promise.resolve();
    });

    expect(rendered!.container.querySelector('.page-title img[alt="settings"]')).toBeTruthy();
    expect(screen.queryByText('Pro Settings')).not.toBeInTheDocument();
  });

  it('reads the reduce-animations preference on mount', async () => {
    getReduceAnimations.mockResolvedValue(true);

    const { container } = renderSettings();
    await screen.findByText('Pro Settings');

    await waitFor(() => {
      expect(getReduceAnimations).toHaveBeenCalled();
      const toggle = screen.getByText('Reduce animations').closest('ion-item')?.querySelector('ion-toggle') as any;
      expect(toggle.checked).toBe(true);
    });
  });

  it('saves the reduce-animations preference when the toggle is changed', async () => {
    renderSettings();
    await screen.findByText('Pro Settings');

    const toggle = screen.getByText('Reduce animations').closest('ion-item')?.querySelector('ion-toggle') as HTMLElement;
    fireEvent(toggle, new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true }));

    await waitFor(() => {
      expect(setReduceAnimationsPref).toHaveBeenCalledWith(true);
    });
  });

  it('updates theme and font size preferences when selects change', async () => {
    const { container } = renderSettings();
    await screen.findByText('Pro Settings');

    const selects = Array.from(container.querySelectorAll('ion-select')) as HTMLElement[];
    const themeSelect = selects.find((node) => node.getAttribute('label') === 'Theme') as HTMLElement;
    const fontSizeSelect = selects.find((node) => node.getAttribute('label') === 'Font Size') as HTMLElement;

    fireEvent(themeSelect, new CustomEvent('ionChange', { detail: { value: 'light' }, bubbles: true }));
    fireEvent(fontSizeSelect, new CustomEvent('ionChange', { detail: { value: 'xl' }, bubbles: true }));

    await waitFor(() => {
      expect(setThemePref).toHaveBeenCalledWith('light');
      expect(applyThemeFromPref).toHaveBeenCalled();
      expect(setFontSizePref).toHaveBeenCalledWith('xl');
      expect(setTextZoom).toHaveBeenCalled();
    });
  });

  it('turns on streak tracking immediately when it was previously off', async () => {
    mockCurrentProfile.mockReturnValue({
      data: { ...baseProfile, settings_streak_tracker: false },
    } as any);

    renderSettings();
    await screen.findByText('Track your streak');

    const toggle = screen.getByText('Track your streak').closest('ion-item')?.querySelector('ion-toggle') as HTMLElement;
    fireEvent(toggle, new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true }));

    await waitFor(() => {
      expect(updateCurrentUserProfile).toHaveBeenCalledWith({ settings_streak_tracker: true });
    });
  });

  it('chat organizer toggle is checked by default when preference is not set', async () => {
    renderSettings();
    await screen.findByText('Pro Settings');

    const toggle = screen.getByText('Chat organizer').closest('ion-item')?.querySelector('ion-toggle') as HTMLElement & { checked?: boolean };
    expect(toggle).toBeTruthy();
    // Default state is checked (true) since pref is null
    expect(toggle.checked).not.toBe(false);
  });

  it('chat organizer toggle is unchecked when preference is false', async () => {
    // Override: all Preferences.get calls return 'false' for chat_organizer
    preferencesGet.mockResolvedValue({ value: 'false' });

    renderSettings();
    await screen.findByText('Pro Settings');

    await waitFor(() => {
      const toggle = screen.getByText('Chat organizer').closest('ion-item')?.querySelector('ion-toggle') as HTMLElement & { checked?: boolean };
      expect(toggle.checked).toBe(false);
    });
  });

  it('chat organizer toggle writes to Preferences and dispatches event when changed', async () => {
    const dispatched: boolean[] = [];
    const handler = (e: Event) => dispatched.push((e as CustomEvent<boolean>).detail);
    window.addEventListener('chat_organizer_changed', handler);

    renderSettings();
    await screen.findByText('Pro Settings');

    const toggle = screen.getByText('Chat organizer').closest('ion-item')?.querySelector('ion-toggle') as HTMLElement;
    fireEvent(toggle, new CustomEvent('ionChange', { detail: { checked: false }, bubbles: true }));

    await waitFor(() => {
      expect(preferencesSet).toHaveBeenCalledWith({ key: 'chat_organizer', value: 'false' });
      expect(dispatched).toContain(false);
    });

    window.removeEventListener('chat_organizer_changed', handler);
  });
});
