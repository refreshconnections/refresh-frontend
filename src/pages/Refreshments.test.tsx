import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp } from '@ionic/react';

const {
  dismissNotification,
  preferencesGet,
  preferencesSet,
  queryInvalidate,
  historyReplace,
  mockRouterPush,
  mockPresentModal,
  mockDismissModal,
  presentUpsellAlert,
} = vi.hoisted(() => ({
  dismissNotification: vi.fn(),
  preferencesGet: vi.fn(),
  preferencesSet: vi.fn(),
  queryInvalidate: vi.fn(),
  historyReplace: vi.fn(),
  mockRouterPush: vi.fn(),
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  presentUpsellAlert: vi.fn(),
}));

let mockEvents: any[] = [];

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');

  return {
    ...actual,
    useIonModal: () => [mockPresentModal, mockDismissModal],
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
    }),
  };
});

vi.mock('../hooks/api/refreshments/posts', () => ({
  useGetPosts: vi.fn(),
}));

vi.mock('../hooks/api/events', () => ({
  DEFAULT_EVENT_FILTERS: {
    eventTypes: ['all'],
    attendeePrecautionPreferences: ['all'],
    inPersonPrecautions: ['all'],
  },
  EVENT_FILTER_PREF_KEYS: {
    eventTypes: 'event_types',
    attendeePrecautionPreferences: 'attendee_precaution_preferences',
    inPersonPrecautions: 'in_person_precautions',
  },
  useGetEvents: vi.fn(() => ({ data: mockEvents })),
}));

vi.mock('../hooks/api/status', () => ({
  useGetStatuses: vi.fn(),
}));

vi.mock('../hooks/api/profiles/current-streak', () => ({
  useGetCurrentStreak: vi.fn(),
}));

vi.mock('../hooks/api/profiles/global-app-current-profile', () => ({
  useGetGlobalAppCurrentProfile: vi.fn(),
}));

vi.mock('../hooks/api/profiles/settings-current-profile', () => ({
  useGetSettingsCurrentProfile: vi.fn(),
}));

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: vi.fn(),
}));

vi.mock('../hooks/api/sitesettings', () => ({
  useGetSiteSettings: vi.fn(),
}));

vi.mock('../hooks/api/profiles/recent-notifications', () => ({
  useGetRecentNotifications: vi.fn(),
  dismissNotification: (...args: any[]) => dismissNotification(...args),
}));

vi.mock('../hooks/utilities', () => ({
  isCommunityPlus: vi.fn((level: string) => level === 'communityplus' || level === 'pro'),
}));

vi.mock('../hooks/useUpsellAlert', () => ({
  useUpsellAlert: () => presentUpsellAlert,
}));

vi.mock('../components/CreatePostModal', () => ({
  default: () => <div>create-post-modal</div>,
}));

vi.mock('../components/RefreshmentsFiltersModal', () => ({
  default: () => <div>refreshments-filters-modal</div>,
}));

vi.mock('../components/RefreshmentsFilters', () => ({
  default: ({ search }: { search: string }) => <div>filters-row-{search}</div>,
}));

vi.mock('../components/StatusToast', () => ({
  default: () => <div>status-toast</div>,
}));

vi.mock('../components/EventsCalendar', () => ({
  default: ({ initialDate, initialEventId, openOnLoad, onAutoOpenHandled, renderTrigger }: any) => (
    <div>
      {renderTrigger(() => onAutoOpenHandled?.())}
      <div>calendar:{initialDate ?? 'none'}:{String(initialEventId ?? 'none')}:{String(openOnLoad)}</div>
    </div>
  ),
}));

vi.mock('../components/RefreshmentsPosts/RefreshmentsPost', () => ({
  default: ({ post_id }: { post_id: number }) => <div>post-card-{post_id}</div>,
}));

vi.mock('../components/CommunityBlockMigrationModal', () => ({
  default: ({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) => (
    isOpen ? <button onClick={onDismiss}>migration-modal-open</button> : null
  ),
}));

vi.mock('../components/RefreshmentsEventsThisWeekRow', () => ({
  default: ({ events, onSelectEvent }: { events: Array<{ id: number; name: string }>; onSelectEvent: (event: any) => void }) => (
    <div>
      {events.map((event) => (
        <button key={event.id} onClick={() => onSelectEvent(event)}>
          {event.name}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../hooks/capacitorPreferences/events-this-week-row', () => ({
  SHOW_EVENTS_THIS_WEEK_ROW_CHANGED_EVENT: 'show-events-this-week-row-changed',
  getShowEventsThisWeekRowPref: vi.fn(async () => true),
}));

vi.mock('react-router-dom', () => ({
  useHistory: () => ({
    replace: historyReplace,
  }),
  useLocation: () => ({
    pathname: '/refreshments',
    search: '?calendarDate=2026-04-10',
  }),
}));

import Refreshments from './Refreshments';
import { useGetPosts } from '../hooks/api/refreshments/posts';
import { useGetStatuses } from '../hooks/api/status';
import { useGetCurrentStreak } from '../hooks/api/profiles/current-streak';
import { useGetGlobalAppCurrentProfile } from '../hooks/api/profiles/global-app-current-profile';
import { useGetSettingsCurrentProfile } from '../hooks/api/profiles/settings-current-profile';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useGetSiteSettings } from '../hooks/api/sitesettings';
import { useGetRecentNotifications } from '../hooks/api/profiles/recent-notifications';
import { useGetEvents } from '../hooks/api/events';

const mockPosts = vi.mocked(useGetPosts);
const mockStatuses = vi.mocked(useGetStatuses);
const mockCurrentStreak = vi.mocked(useGetCurrentStreak);
const mockGlobalProfile = vi.mocked(useGetGlobalAppCurrentProfile);
const mockSettingsProfile = vi.mocked(useGetSettingsCurrentProfile);
const mockCurrentProfile = vi.mocked(useGetCurrentProfile);
const mockSiteSettings = vi.mocked(useGetSiteSettings);
const mockNotifications = vi.mocked(useGetRecentNotifications);
const mockUseGetEvents = vi.mocked(useGetEvents);
const futureEventDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
const futureEventDateIso = futureEventDate.toISOString();
const futureEventDateParam = futureEventDateIso.slice(0, 10);

const renderRefreshments = () => {
  const queryClient = new QueryClient();

  return render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <Refreshments />
      </QueryClientProvider>
    </IonApp>
  );
};

const getButtonByText = (label: string) => {
  const node = screen.getByText(label);
  return node.closest('ion-button') as HTMLElement | null;
};

beforeEach(() => {
  vi.clearAllMocks();

  Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });

  preferencesGet.mockResolvedValue({ value: null });
  preferencesSet.mockResolvedValue(undefined);

  mockPosts.mockReturnValue({
    data: [11, 12, 13, 14, 15, 16],
    isLoading: false,
    isFetching: false,
  } as any);
  mockStatuses.mockReturnValue({ data: [] } as any);
  mockCurrentStreak.mockReturnValue({ data: { streak_count: 3 } } as any);
  mockGlobalProfile.mockReturnValue({
    data: { subscription_level: 'none', name: 'Alex', username: 'alex' },
    isLoading: false,
  } as any);
  mockSettingsProfile.mockReturnValue({
    data: { settings_create_posts: true },
    isLoading: false,
  } as any);
  mockCurrentProfile.mockReturnValue({
    data: { location_point_lat: 40.7, location_point_long: -73.9, blocked_connections: [], community_blocked: [] },
  } as any);
  mockSiteSettings.mockReturnValue({
    data: { allow_free_users_to_submit_posts: false },
  } as any);
  mockNotifications.mockReturnValue({ data: [] } as any);
  mockEvents = [];
  mockUseGetEvents.mockReturnValue({ data: mockEvents } as any);
});

describe('Refreshments page', () => {
  it('renders the first five posts and loads more when "See more" is clicked', async () => {
    renderRefreshments();

    expect(screen.getByText('post-card-11')).toBeInTheDocument();
    expect(screen.getByText('post-card-15')).toBeInTheDocument();
    expect(screen.queryByText('post-card-16')).not.toBeInTheDocument();

    fireEvent.click(getButtonByText('See more') ?? screen.getByText('See more'));

    expect(await screen.findByText('post-card-16')).toBeInTheDocument();
  });

  it('opens the create-post paywall alert for ineligible users', async () => {
    const { container } = renderRefreshments();

    const postButtons = Array.from(
      container.querySelectorAll('.refreshments-control-button')
    ) as HTMLElement[];

    fireEvent.click(postButtons[postButtons.length - 1]);

    await waitFor(() => {
      expect(presentUpsellAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          header: 'You need a 5 day streak to create your own post.',
          message: 'Or get Community+ or Refresh Pro to post now!',
          extraButtons: [
            expect.objectContaining({
              text: 'What is my streak?',
            }),
          ],
        })
      );
    });
  });

  it('shows a small refreshing indicator while fresh posts are loading over warmed data', async () => {
    mockPosts.mockReturnValue({
      data: [11, 12, 13, 14, 15, 16],
      isLoading: false,
      isFetching: true,
    } as any);

    const { container } = renderRefreshments();

    await waitFor(() => {
      expect(screen.getByTestId('warm-cache-refresh-indicator')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="warm-cache-refresh-indicator"] ion-spinner[name="dots"]')).toBeTruthy();
    });
  });

  it('keeps warmed posts visible and does not flash the empty state while fresh posts are fetching', async () => {
    mockPosts.mockReturnValue({
      data: [11, 12, 13, 14, 15, 16],
      isLoading: false,
      isFetching: true,
    } as any);

    renderRefreshments();

    expect(await screen.findByText('post-card-11')).toBeInTheDocument();
    expect(screen.getByText('post-card-15')).toBeInTheDocument();
    expect(screen.queryByText(/Nothing here yet/)).not.toBeInTheDocument();
  });

  it('renders and dismisses the active refreshments alert', async () => {
    mockNotifications.mockReturnValue({
      data: [
        { id: 91, message: 'Heads up: event posting is delayed.', show_refreshments: true },
      ],
    } as any);

    renderRefreshments();

    expect(
      screen.getByText('Heads up: event posting is delayed.')
    ).toBeInTheDocument();

    const dismissButton = document.querySelector(
      'ion-button[aria-label="Dismiss alert"]'
    ) as HTMLElement | null;
    expect(dismissButton).not.toBeNull();

    fireEvent.click(dismissButton!);

    await waitFor(() => {
      expect(dismissNotification).toHaveBeenCalledWith(91, 'refreshments');
    });
    expect(queryInvalidate).toHaveBeenCalled();
  });

  it('pull-to-refresh invalidates current post queries and events, then completes the refresher', async () => {
    const { container } = renderRefreshments();

    const refresher = container.querySelector('ion-refresher') as HTMLElement | null;
    expect(refresher).not.toBeNull();

    const complete = vi.fn();

    await act(async () => {
      fireEvent(
        refresher!,
        new CustomEvent('ionRefresh', {
          detail: { complete },
        })
      );
    });

    expect(queryInvalidate).toHaveBeenCalledWith({
      queryKey: ['filteredposts'],
      exact: false,
    });
    expect(queryInvalidate).toHaveBeenCalledWith({
      queryKey: ['events'],
    });
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('passes the selected event id into the calendar when an events-row card is clicked', async () => {
    mockEvents = [
      {
        id: 77,
        name: 'Masked meetup',
        start_datetime: futureEventDateIso,
        end_datetime: futureEventDateIso,
        interested: false,
      },
    ];
    mockUseGetEvents.mockReturnValue({ data: mockEvents } as any);

    renderRefreshments();

    fireEvent.click(await screen.findByText('Masked meetup'));

    expect(historyReplace).toHaveBeenCalledWith({
      pathname: '/refreshments',
      search: `calendarDate=${futureEventDateParam}&calendarEventId=77`,
    });
    expect(screen.getByText(`calendar:${futureEventDateParam}:77:true`)).toBeInTheDocument();
  });

  it('shows the community block migration popup on the active page when eligible', async () => {
    mockCurrentProfile.mockReturnValue({
      data: {
        location_point_lat: 40.7,
        location_point_long: -73.9,
        blocked_connections: [2],
        community_blocked: [],
      },
    } as any);

    renderRefreshments();

    expect(await screen.findByText('migration-modal-open')).toBeInTheDocument();

    fireEvent.click(screen.getByText('migration-modal-open'));

    await waitFor(() => {
      expect(preferencesSet).toHaveBeenCalledWith({
        key: 'community_block_migration_shown',
        value: 'true',
      });
    });
  });
});
