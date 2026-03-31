import React from 'react';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp } from '@ionic/react';

const { profilePresent, profileDismiss, capturedProfileModalProps, mockAddListener } = vi.hoisted(() => ({
  profilePresent: vi.fn(),
  profileDismiss: vi.fn(),
  capturedProfileModalProps: { current: null as any },
  mockAddListener: vi.fn(),
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (...args: any[]) => mockAddListener(...args),
  },
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

vi.mock('../../components/ProfileModal', () => ({
  default: () => null,
}));

vi.mock('../../components/CantAccessCard', () => ({
  default: () => <div>cant-access</div>,
}));

vi.mock('../../components/LoadingCard', () => ({
  default: () => <div>loading-card</div>,
}));

vi.mock('../../components/StatusToast', () => ({
  default: ({ header, message }: { header?: string; message?: string }) => (
    <div>
      {header && <div>{header}</div>}
      {message && <div>{message}</div>}
    </div>
  ),
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');

  return {
    ...actual,
    useIonModal: (_component: any, modalProps: any) => {
      capturedProfileModalProps.current = modalProps;
      return [profilePresent, profileDismiss];
    },
  };
});

vi.mock('../../hooks/utilities', () => ({
  isPersonalPlus: (level?: string) => level === 'personalplus' || level === 'refreshpro',
  onImgError: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/incoming-connections-paginated', () => ({
  useIncomingConnectionsInf: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/current-streak', () => ({
  useGetCurrentStreak: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/mutuals-no-dialog', () => ({
  useGetMutualConnectionsNoDialogWOpenerCheck: vi.fn(),
}));

vi.mock('../../hooks/api/status', () => ({
  useGetStatuses: vi.fn(),
}));

import Likes from '../Likes';
import { useIncomingConnectionsInf } from '../../hooks/api/profiles/incoming-connections-paginated';
import { useGetCurrentProfile } from '../../hooks/api/profiles/current-profile';
import { useGetCurrentStreak } from '../../hooks/api/profiles/current-streak';
import { useGetMutualConnectionsNoDialogWOpenerCheck } from '../../hooks/api/profiles/mutuals-no-dialog';
import { useGetStatuses } from '../../hooks/api/status';

const renderLikes = () => {
  const queryClient = new QueryClient();

  return {
    queryClient,
    ...render(
      <IonApp>
        <QueryClientProvider client={queryClient}>
          <Likes />
        </QueryClientProvider>
      </IonApp>
    ),
  };
};

const baseProfile = (overrides = {}) => ({
  created_profile: true,
  deactivated_profile: false,
  paused_profile: false,
  subscription_level: 'personalplus',
  settings_show_alt: true,
  name: 'Test User',
  initiate_mode: false,
  ...overrides,
});

const mockIncomingHook = vi.mocked(useIncomingConnectionsInf);
const mockCurrentProfile = vi.mocked(useGetCurrentProfile);
const mockCurrentStreak = vi.mocked(useGetCurrentStreak);
const mockMutuals = vi.mocked(
  useGetMutualConnectionsNoDialogWOpenerCheck
);
const mockStatuses = vi.mocked(useGetStatuses);

beforeEach(() => {
  vi.clearAllMocks();
  capturedProfileModalProps.current = null;
  mockAddListener.mockReturnValue({ remove: vi.fn() });

  mockCurrentProfile.mockReturnValue({ data: baseProfile() } as any);
  mockCurrentStreak.mockReturnValue({ data: { streak_count: 0 } } as any);
  mockMutuals.mockReturnValue({ data: [] } as any);
  mockStatuses.mockReturnValue({ data: [] } as any);
  mockIncomingHook.mockReturnValue({
    data: { pages: [{ results: [], count: 0 }] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  } as any);
});

afterEach(() => {
  cleanup();
});

describe('Likes page infinite scroll behavior', () => {
  it('renders IonInfiniteScroll when premium users have visible likes', () => {
    mockIncomingHook.mockReturnValue({
      data: { pages: [{ results: [{ user: '1', name: 'Alex' }] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isFetchingNextPage: false,
    } as any);

    const { container } = renderLikes();

    expect(container.querySelector('ion-infinite-scroll')).toBeInTheDocument();
  });

  it('hides IonInfiniteScroll for users with subscription level "none"', () => {
    mockCurrentProfile.mockReturnValue(
      { data: baseProfile({ subscription_level: 'none' }) } as any
    );
    mockIncomingHook.mockReturnValue({
      data: { pages: [{ results: [{ user: '1', name: 'Alex' }] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isFetchingNextPage: false,
    } as any);

    const { container } = renderLikes();

    expect(container.querySelector('ion-infinite-scroll')).toBeNull();
  });

  it('invokes fetchNextPage when the infinite scroll event fires', () => {
    const fetchNextPage = vi.fn();
    mockIncomingHook.mockReturnValue({
      data: { pages: [{ results: [{ user: '1', name: 'Alex' }] }] },
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    } as any);

    const { container } = renderLikes();

    const scrollEl = container.querySelector('ion-infinite-scroll')!;
    // In jsdom, ion-infinite-scroll doesn't have a complete() method,
    // so we add one before dispatching the event.
    (scrollEl as any).complete = vi.fn();
    scrollEl.dispatchEvent(new CustomEvent('ionInfinite', { bubbles: true }));

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('renders cards from all five pages of results', () => {
    const names = ['Alex', 'Jamie', 'Taylor', 'Jordan', 'Sam'];
    mockIncomingHook.mockReturnValue({
      data: {
        pages: names.map((name, idx) => ({
          results: [{ user: String(idx + 1), name }],
        })),
      },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    renderLikes();

    names.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('keeps IonInfiniteScroll as a direct sibling of the grid (IonContent child)', () => {
    mockIncomingHook.mockReturnValue({
      data: {
        pages: [{ results: [{ user: '1', name: 'Alex' }] }],
      },
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isFetchingNextPage: false,
    } as any);

    const { container } = renderLikes();

    const grid = container.querySelector('ion-grid');
    const scroll = container.querySelector('ion-infinite-scroll');

    expect(grid).toBeInTheDocument();
    expect(scroll).toBeInTheDocument();
    expect(grid!.contains(scroll)).toBe(false);
  });

  it('opens the profile modal when a premium like card is clicked', () => {
    mockIncomingHook.mockReturnValue({
      data: { pages: [{ results: [{ user: '1', name: 'Alex' }] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    fireEvent.click(renderLikes().getByText('Alex'));

    expect(profilePresent).toHaveBeenCalledTimes(1);
  });

  it('passes a false settingsAlt value to the profile modal when alt text is turned off', () => {
    mockCurrentProfile.mockReturnValue(
      { data: baseProfile({ settings_show_alt: false }) } as any
    );
    mockIncomingHook.mockReturnValue({
      data: { pages: [{ results: [{ user: '1', name: 'Alex' }] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    fireEvent.click(renderLikes().getByText('Alex'));

    expect(profilePresent).toHaveBeenCalledTimes(1);
    expect(capturedProfileModalProps.current).toEqual(
      expect.objectContaining({
        settingsAlt: false,
      })
    );
  });

  it('removes an acted-on like from the cache when the profile modal reports ActionTaken', async () => {
    mockIncomingHook.mockReturnValue({
      data: { pages: [{ results: [{ user: '1', name: 'Alex' }, { user: '2', name: 'Jamie' }], count: 2 }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { queryClient } = renderLikes();
    queryClient.setQueryData(['incoming-paginated'], {
      pages: [{ results: [{ user: '1', name: 'Alex' }, { user: '2', name: 'Jamie' }], count: 2 }],
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    fireEvent.click(screen.getByText('Alex'));

    await actFlush(async () => {
      await capturedProfileModalProps.current.onActionDismiss('ActionTaken');
    });

    expect(queryClient.getQueryData(['incoming-paginated'])).toEqual({
      pages: [{ results: [{ user: '2', name: 'Jamie' }], count: 2 }],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['mutuals'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['mutuals-no-dialog-paginated'] });
    expect(profileDismiss).toHaveBeenCalledTimes(1);
  });

  it('invalidates likes on app resume', async () => {
    const { queryClient } = renderLikes();

    const resumeHandler = mockAddListener.mock.calls.find(call => call[0] === 'resume')?.[1];
    expect(resumeHandler).toBeTypeOf('function');

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    await resumeHandler();

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['incoming-paginated'] });
  });

  it('auto-fetches the next likes page for non-premium users when the first visible page is empty', async () => {
    const fetchNextPage = vi.fn();
    mockCurrentProfile.mockReturnValue(
      { data: baseProfile({ subscription_level: 'none' }) } as any
    );
    mockIncomingHook.mockReturnValue({
      data: { pages: [{ results: [], count: 6 }] },
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    } as any);

    renderLikes();

    await waitFor(() => {
      expect(fetchNextPage).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the teaser card and upgrade prompt for non-premium users with a visible like', async () => {
    mockCurrentProfile.mockReturnValue(
      { data: baseProfile({ subscription_level: 'none' }) } as any
    );
    mockIncomingHook.mockReturnValue({
      data: { pages: [{ results: [{ user: '1', name: 'Alex' }] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isFetchingNextPage: false,
    } as any);

    renderLikes();

    expect(await screen.findByText('Alex')).toBeInTheDocument();
    expect(screen.getByText(/more likes waiting for you/i)).toBeInTheDocument();
  });

  it('shows the initiate-mode empty state when there are no likes and initiate mode is enabled', async () => {
    mockCurrentProfile.mockReturnValue(
      { data: baseProfile({ subscription_level: 'none', initiate_mode: true }) } as any
    );
    mockIncomingHook.mockReturnValue({
      data: { pages: [{ results: [], count: 0 }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    renderLikes();

    expect(
      await screen.findByText(/You are in Initiate mode\. Turn this off in Settings/i)
    ).toBeInTheDocument();
  });

  it('shows the cant-access state when the personal profile is deactivated', async () => {
    mockCurrentProfile.mockReturnValue(
      { data: baseProfile({ deactivated_profile: true }) } as any
    );

    renderLikes();

    expect(await screen.findByText('cant-access')).toBeInTheDocument();
  });

  it('renders the status toast when there is an active likes status', async () => {
    mockStatuses.mockReturnValue({
      data: [
        {
          page: 'likes',
          active: true,
          header: 'Likes update',
          message: 'Premium likes are available today.',
          expirationDateTime: '2099-01-01T00:00:00.000Z',
        },
      ],
    } as any);

    renderLikes();

    expect(await screen.findByText('Likes update')).toBeInTheDocument();
    expect(screen.getByText('Premium likes are available today.')).toBeInTheDocument();
  });
});

async function actFlush(cb: () => Promise<void> | void) {
  await cb();
}
