import React from 'react';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@ionic/react', () => {
  const React = require('react');

  const createStub = () => (props: any) =>
    React.createElement('div', props, props.children);
  const createStubWithTestId = (testId: string) => (props: any) =>
    React.createElement(
      'div',
      { ...props, 'data-testid': props['data-testid'] ?? testId },
      props.children
    );

  const ionTestUtils: { handler?: (event: any) => void } = {};

  return {
    IonAlert: createStub(),
    IonButton: createStub(),
    IonCard: createStub(),
    IonCardTitle: createStub(),
    IonCol: createStub(),
    IonContent: createStub(),
    IonFab: createStub(),
    IonFabButton: createStub(),
    IonGrid: createStubWithTestId('ion-grid'),
    IonIcon: createStub(),
    IonInfiniteScroll: ({ onIonInfinite, children, ...rest }: any) => {
      ionTestUtils.handler = onIonInfinite;
      return React.createElement(
        'div',
        { 'data-testid': 'ion-infinite-scroll', ...rest },
        children
      );
    },
    IonInfiniteScrollContent: createStub(),
    IonNote: createStub(),
    IonPage: createStub(),
    IonRefresher: createStub(),
    IonRefresherContent: createStub(),
    IonRow: createStub(),
    IonSpinner: createStub(),
    IonText: createStub(),
    useIonModal: () => [vi.fn(), vi.fn()],
    __ionTestUtils: {
      triggerInfinite: (event: any) => ionTestUtils.handler?.(event),
    },
  };
});

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(() => ({ remove: vi.fn() })),
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
  default: () => null,
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
import * as IonicReact from '@ionic/react';

const renderLikes = () => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <Likes />
    </QueryClientProvider>
  );
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

    renderLikes();

    expect(
      screen.getByTestId('ion-infinite-scroll')
    ).toBeInTheDocument();
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

    renderLikes();

    expect(screen.queryByTestId('ion-infinite-scroll')).toBeNull();
  });

  it('invokes fetchNextPage when the infinite scroll event fires', () => {
    const fetchNextPage = vi.fn();
    mockIncomingHook.mockReturnValue({
      data: { pages: [{ results: [{ user: '1', name: 'Alex' }] }] },
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    } as any);

    renderLikes();

    const ionTestUtils = (IonicReact as any).__ionTestUtils;
    ionTestUtils.triggerInfinite({ target: { complete: vi.fn() } });

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

    renderLikes();

    const grid = screen.getByTestId('ion-grid');
    const scroll = screen.getByTestId('ion-infinite-scroll');

    expect(grid).toBeInTheDocument();
    expect(scroll).toBeInTheDocument();
    expect(grid.contains(scroll)).toBe(false);
  });
});
