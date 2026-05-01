import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp } from '@ionic/react';

const {
  preferencesGet,
  preferencesSet,
  picksRefetch,
  getWithExpiry,
  setWithExpiry,
  removeFromCapacitorLocalStorage,
  queryInvalidate,
  queryPrefetch,
  updateOutgoingConnections,
  updateDismissedConnections,
  updateBlockedConnections,
  increaseStreak,
  sendAnOpener,
  blockProfile,
  mockPresentAlert,
  mockPresentModal,
  mockDismissModal,
  mockIonModalCalls,
  mockRouterPush,
  getReduceAnimations,
} = vi.hoisted(() => ({
  preferencesGet: vi.fn(),
  preferencesSet: vi.fn(),
  picksRefetch: vi.fn(),
  getWithExpiry: vi.fn(),
  setWithExpiry: vi.fn(),
  removeFromCapacitorLocalStorage: vi.fn(),
  queryInvalidate: vi.fn(),
  queryPrefetch: vi.fn(),
  updateOutgoingConnections: vi.fn().mockResolvedValue(undefined),
  updateDismissedConnections: vi.fn().mockResolvedValue(undefined),
  updateBlockedConnections: vi.fn().mockResolvedValue(undefined),
  increaseStreak: vi.fn().mockResolvedValue(undefined),
  sendAnOpener: vi.fn().mockResolvedValue(undefined),
  blockProfile: vi.fn(),
  mockPresentAlert: vi.fn(),
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  mockIonModalCalls: [] as Array<{ component: any; props: any }>,
  mockRouterPush: vi.fn(),
  getReduceAnimations: vi.fn(),
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');

  return {
    ...actual,
    IonApp: ({ children }: any) => <div>{children}</div>,
    useIonAlert: () => [mockPresentAlert, vi.fn()],
    useIonModal: (component: any, props: any) => {
      mockIonModalCalls.push({ component, props });
      return [mockPresentModal, mockDismissModal];
    },
    useIonRouter: () => ({
      push: mockRouterPush,
      goBack: vi.fn(),
      canGoBack: vi.fn(() => true),
    }),
  };
});

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: preferencesGet,
    set: preferencesSet,
  },
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');

  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: queryInvalidate,
      prefetchQuery: queryPrefetch,
    }),
  };
});

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: vi.fn(),
}));

vi.mock('../hooks/api/profiles/picks-and-profiles', () => ({
  usePicksAndProfilesWithFilters: vi.fn(),
  getPicksAndProfilesWithFiltersFn: vi.fn(),
}));

vi.mock('../hooks/api/status', () => ({
  useGetStatuses: vi.fn(),
}));

vi.mock('../hooks/utilities', () => ({
  updateOutgoingConnections: (...args: any[]) => updateOutgoingConnections(...args),
  updateDismissedConnections: (...args: any[]) => updateDismissedConnections(...args),
  updateBlockedConnections: (...args: any[]) => updateBlockedConnections(...args),
  increaseStreak: (...args: any[]) => increaseStreak(...args),
  isPersonalPlus: vi.fn(() => false),
  sendAnOpener: (...args: any[]) => sendAnOpener(...args),
  getReduceAnimations: (...args: any[]) => getReduceAnimations(...args),
}));

vi.mock('../hooks/useBlockProfile', () => ({
  useBlockProfile: () => blockProfile,
}));

vi.mock('../hooks/capacitorPreferences/all', () => ({
  getWithExpiry: (...args: any[]) => getWithExpiry(...args),
  setWithExpiry: (...args: any[]) => setWithExpiry(...args),
  removeFromCapacitorLocalStorage: (...args: any[]) => removeFromCapacitorLocalStorage(...args),
}));

vi.mock('../components/ProfileCard', () => ({
  default: ({ cardData }: any) => <div>profile-card-{cardData.user}</div>,
}));

vi.mock('../components/LoadingCard', () => ({
  default: () => <div>loading-card</div>,
}));

vi.mock('../components/CantAccessCard', () => ({
  default: ({ tabName }: { tabName: string }) => <div>cant-access-{tabName}</div>,
}));

vi.mock('../components/AdvancedFilterModal', () => ({
  default: () => <div>advanced-filter-modal</div>,
}));

vi.mock('../components/ReportModal', () => ({
  default: () => <div>report-modal</div>,
}));

vi.mock('./LikeMessageAlertModal', () => ({
  LikeMessageAlertModal: () => <div>like-message-alert-modal</div>,
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

vi.mock('../components/IconPop', () => ({
  IconPop: () => null,
}));

vi.mock('./Tips', () => ({
  default: () => <div>tips-modal</div>,
}));

vi.mock('./PersonalProfile', () => ({
  default: () => <div>personal-profile-modal</div>,
}));

import Picksv2 from './Picksv2';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { usePicksAndProfilesWithFilters } from '../hooks/api/profiles/picks-and-profiles';
import { useGetStatuses } from '../hooks/api/status';
import { LikeMessageAlertModal } from './LikeMessageAlertModal';
import ReportModal from '../components/ReportModal';

const mockCurrentProfile = vi.mocked(useGetCurrentProfile);
const mockPicks = vi.mocked(usePicksAndProfilesWithFilters);
const mockStatuses = vi.mocked(useGetStatuses);

const baseProfile = {
  user: 7,
  created_profile: true,
  deactivated_profile: false,
  paused_profile: false,
  subscription_level: 'none',
  settings_alt_text: true,
  settings_streak_tracker: true,
  filter_lc: [],
  filter_gender_sexuality: [],
  filter_gender_sexuality_not: false,
  filter_lived_experiences: [],
  filter_age_gt: null,
  filter_age_lt: null,
  filter_distance: null,
  filter_keyword: '',
  filter_looking_for_single_selection: null,
  filter_precautions_single_selection: null,
  filter_precautions_include_or_not: 'none',
};

const renderPicks = () => {
  const queryClient = new QueryClient();

  return render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <Picksv2 />
      </QueryClientProvider>
    </IonApp>
  );
};

const getButtonByText = (label: string) => {
  const node = screen.getByText(label);
  return node.closest('ion-button') as HTMLElement | null;
};

const getFabButtonByLabel = (container: HTMLElement, label: string) =>
  container.querySelector(`ion-fab-button[data-label="${label}"]`) as HTMLElement | null;

beforeEach(() => {
  vi.clearAllMocks();
  mockIonModalCalls.length = 0;

  Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });

  preferencesGet.mockResolvedValue({ value: 'true' });
  preferencesSet.mockResolvedValue(undefined);
  getReduceAnimations.mockResolvedValue(false);
  getWithExpiry.mockResolvedValue(null);
  setWithExpiry.mockResolvedValue(undefined);
  removeFromCapacitorLocalStorage.mockResolvedValue(undefined);
  picksRefetch.mockResolvedValue({ data: [] });

  mockCurrentProfile.mockReturnValue({ data: baseProfile, isLoading: false } as any);
  mockPicks.mockReturnValue({
    data: [{ user: 21, name: 'Jamie' }],
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: picksRefetch,
  } as any);
  mockStatuses.mockReturnValue({ data: [] } as any);
});

const getIonModalProps = (component: any) => {
  const match = [...mockIonModalCalls].reverse().find((entry) => entry.component === component);
  return match?.props;
};

describe('Picksv2', () => {
  it('shows a loading card while the profile gate is still loading', async () => {
    mockCurrentProfile.mockReturnValue({ data: null, isLoading: true } as any);

    renderPicks();

    expect(await screen.findByText('loading-card')).toBeInTheDocument();
  });

  it('prompts the user to create a personal profile before browsing discovery', async () => {
    mockCurrentProfile.mockReturnValue({
      data: { ...baseProfile, created_profile: false },
      isLoading: false,
    } as any);

    renderPicks();

    expect(
      await screen.findByText('You’ll need a Personal Profile before browsing Discovery.')
    ).toBeInTheDocument();
    expect(screen.getByText('Create Personal Profile')).toBeInTheDocument();
  });

  it('shows the access card when the personal profile is paused or deactivated', async () => {
    mockCurrentProfile.mockReturnValue({
      data: { ...baseProfile, paused_profile: true },
      isLoading: false,
    } as any);

    renderPicks();

    expect(await screen.findByText('cant-access-Discovery')).toBeInTheDocument();
  });

  it('shows an error state and retries picks fetching', async () => {
    mockPicks.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch: picksRefetch,
    } as any);

    renderPicks();

    expect(screen.getByText('Couldn’t load Discovery')).toBeInTheDocument();

    fireEvent.click(getButtonByText('Try again') ?? screen.getByText('Try again'));

    await waitFor(() => {
      expect(picksRefetch).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the empty-picks state and refresh action when no profiles are available', async () => {
    mockPicks.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: picksRefetch,
    } as any);

    renderPicks();

    expect(await screen.findByText('No new Profiles to view!')).toBeInTheDocument();
    expect(screen.getByText('Adjust Your Filters')).toBeInTheDocument();

    fireEvent.click(
      getButtonByText('Discover new connections') ?? screen.getByText('Discover new connections')
    );

    await waitFor(() => {
      expect(picksRefetch).toHaveBeenCalledTimes(1);
    });
  });

  it('renders the active profile card when picks are available', async () => {
    renderPicks();

    expect(await screen.findByText('profile-card-21')).toBeInTheDocument();
    expect(screen.getAllByText('Filters').length).toBeGreaterThan(0);
  });

  it('shows the filter tip dialog when no filters are active and the tip flag is not set to true', async () => {
    mockCurrentProfile.mockReturnValue({
      data: {
        ...baseProfile,
        filter_lc: [],
        filter_gender_sexuality: [],
        filter_gender_sexuality_not: false,
        filter_lived_experiences: [],
        filter_age_gt: null,
        filter_age_lt: null,
        filter_distance: null,
        filter_keyword: '',
        filter_looking_for_single_selection: null,
        filter_precautions_single_selection: null,
        filter_precautions_include_or_not: 'none',
      },
      isLoading: false,
    } as any);
    preferencesGet.mockResolvedValue({ value: null });

    renderPicks();

    expect(await screen.findByText('Filter anytime.')).toBeInTheDocument();
    expect(screen.getByText('Add filters now')).toBeInTheDocument();
    expect(screen.getByText('Maybe later')).toBeInTheDocument();
  });

  it('does not show the filter tip dialog when the user already has active filters', async () => {
    mockCurrentProfile.mockReturnValue({
      data: {
        ...baseProfile,
        filter_lc: ['long_covid'],
      },
      isLoading: false,
    } as any);
    preferencesGet.mockResolvedValue({ value: null });

    renderPicks();

    expect(await screen.findByText('profile-card-21')).toBeInTheDocument();
    expect(screen.queryByText('Filter anytime.')).not.toBeInTheDocument();
    expect(screen.queryByText('Add filters now')).not.toBeInTheDocument();
    expect(screen.queryByText('Maybe later')).not.toBeInTheDocument();
  });

  it('opens the advanced filter modal from the empty state action', async () => {
    mockPicks.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: picksRefetch,
    } as any);

    renderPicks();

    fireEvent.click(await screen.findByText('Adjust Your Filters'));

    expect(mockPresentModal).toHaveBeenCalledTimes(1);
  });

  it('opens the like message modal from the floating heart action', async () => {
    const { container } = renderPicks();

    expect(await screen.findByText('profile-card-21')).toBeInTheDocument();

    const fabButtons = container.querySelectorAll('ion-fab-button');
    fireEvent.click(fabButtons[0] as HTMLElement);

    expect(mockPresentModal).toHaveBeenCalledWith({ cssClass: 'like-message-alert-modal' });
  });

  it('likes a profile from the modal and advances to the next card', async () => {
    mockPicks.mockReturnValue({
      data: [{ user: 21, name: 'Jamie' }, { user: 22, name: 'Alex' }],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: picksRefetch,
    } as any);

    const { container } = renderPicks();
    expect(await screen.findByText('profile-card-21')).toBeInTheDocument();

    const fabButtons = container.querySelectorAll('ion-fab-button');
    fireEvent.click(fabButtons[0] as HTMLElement);

    const likeModalProps = getIonModalProps(LikeMessageAlertModal);
    await act(async () => {
      await likeModalProps.onSendLike();
    });

    expect(updateOutgoingConnections).toHaveBeenCalledWith(21);
    expect(increaseStreak).toHaveBeenCalledTimes(1);
    expect(queryInvalidate).toHaveBeenCalledWith({ queryKey: ['streak'] });
    await waitFor(() => {
      expect(screen.getByText('profile-card-22')).toBeInTheDocument();
    });
  });

  it('sends a like with message from the modal', async () => {
    const { container } = renderPicks();
    expect(await screen.findByText('profile-card-21')).toBeInTheDocument();

    const fabButtons = container.querySelectorAll('ion-fab-button');
    fireEvent.click(fabButtons[0] as HTMLElement);

    const likeModalProps = getIonModalProps(LikeMessageAlertModal);
    await act(async () => {
      await likeModalProps.onSendWithMessage('hey there');
    });

    expect(sendAnOpener).toHaveBeenCalledWith(21, 'hey there');
    expect(updateOutgoingConnections).toHaveBeenCalledWith(21);
  });

  it('ignores a profile for now from the action fab', async () => {
    mockPicks.mockReturnValue({
      data: [{ user: 21, name: 'Jamie' }, { user: 22, name: 'Alex' }],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: picksRefetch,
    } as any);

    const { container } = renderPicks();
    expect(await screen.findByText('profile-card-21')).toBeInTheDocument();

    fireEvent.click(getFabButtonByLabel(container, 'Ignore for now') as HTMLElement);

    await waitFor(() => {
      expect(updateDismissedConnections).toHaveBeenCalledWith(21);
    });
    await waitFor(() => {
      expect(screen.getByText('profile-card-22')).toBeInTheDocument();
    });
  });

  it('blocks a profile through the block helper callback', async () => {
    const { container } = renderPicks();
    expect(await screen.findByText('profile-card-21')).toBeInTheDocument();

    fireEvent.click(getFabButtonByLabel(container, 'Block') as HTMLElement);

    expect(blockProfile).toHaveBeenCalledTimes(1);
    const unblockCallback = blockProfile.mock.calls[0][1];
    await act(async () => {
      await unblockCallback();
    });

    expect(updateBlockedConnections).toHaveBeenCalledWith(21);
  });

  it('opens the report modal from the action fab', async () => {
    const { container } = renderPicks();
    expect(await screen.findByText('profile-card-21')).toBeInTheDocument();

    fireEvent.click(getFabButtonByLabel(container, 'Report') as HTMLElement);

    const reportModalProps = getIonModalProps(ReportModal);
    expect(reportModalProps.offender).toBe('user');
    expect(reportModalProps.text).toBe('Jamie');
    expect(reportModalProps.id).toBe(21);
  });

  it('renders the picks status toast when there is an active unexpired status', async () => {
    mockStatuses.mockReturnValue({
      data: [
        {
          page: 'picks',
          active: true,
          header: 'Discovery update',
          message: 'Fresh matches are available now.',
          expirationDateTime: '2099-01-01T00:00:00.000Z',
        },
      ],
    } as any);

    renderPicks();

    expect(await screen.findByText('status-toast')).toBeInTheDocument();
    expect(screen.getByText('Discovery update')).toBeInTheDocument();
    expect(screen.getByText('Fresh matches are available now.')).toBeInTheDocument();
  });

  it('adds the no-animation class to the profile card when reduce animations is on', async () => {
    getReduceAnimations.mockResolvedValue(true);
    const { container } = renderPicks();

    await screen.findByText('profile-card-21');

    await waitFor(() => {
      expect(container.querySelector('.profile-card-container.no-animation')).toBeTruthy();
    });
  });

  it('does not add the no-animation class to the profile card when reduce animations is off', async () => {
    getReduceAnimations.mockResolvedValue(false);
    const { container } = renderPicks();

    await screen.findByText('profile-card-21');

    await waitFor(() => {
      expect(container.querySelector('.profile-card-container')).toBeTruthy();
      expect(container.querySelector('.profile-card-container.no-animation')).toBeFalsy();
    });
  });
});
