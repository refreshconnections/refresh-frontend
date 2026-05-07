import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const {
  appAddListener,
  getGroupChats,
  getGroupChatInvites,
  invalidateQueries,
  ensureQueryData,
  getQueryData,
  addWsListener,
} = vi.hoisted(() => ({
  appAddListener: vi.fn(),
  getGroupChats: vi.fn(),
  getGroupChatInvites: vi.fn(),
  invalidateQueries: vi.fn(),
  ensureQueryData: vi.fn(),
  getQueryData: vi.fn(),
  addWsListener: vi.fn(),
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (...args: any[]) => appAddListener(...args),
  },
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('../hooks/utilities', () => ({
  getGroupChats: (...args: any[]) => getGroupChats(...args),
  getGroupChatInvites: (...args: any[]) => getGroupChatInvites(...args),
  getWebsocketUrl: vi.fn(),
  isPersonalPlus: vi.fn(() => false),
}));

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: vi.fn(),
}));

vi.mock('../hooks/api/chats/current-user-chats', () => ({
  useGetCurrentUserChats: vi.fn(),
}));

vi.mock('../hooks/api/chats/current-user-chats-paginated', () => ({
  useGetCurrentUserChatsPaginated: vi.fn(),
}));

vi.mock('../hooks/api/profiles/mutual-connections', () => ({
  useGetMutualConnections: vi.fn(),
}));

vi.mock('../hooks/api/status', () => ({
  useGetStatuses: vi.fn(),
}));

vi.mock('../hooks/api/profiles/incoming-connections-paginated', () => ({
  useIncomingConnectionsInf: vi.fn(),
}));

vi.mock('../components/WebsocketContext', () => ({
  useWebSocketContext: () => ({
    addListener: (...args: any[]) => addWsListener(...args),
  }),
}));

vi.mock('../components/CantAccessCard', () => ({
  default: ({ tabName }: { tabName: string }) => <div>cant-access-{tabName}</div>,
}));

vi.mock('../components/LoadingCard', () => ({
  default: () => <div>loading-card</div>,
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

vi.mock('../components/Chats/ChatsSegment', () => ({
  default: ({
    mutualConnectionsList,
    chats,
    showSearch,
    chatsHasNextPage,
    chatsIsFetchingNextPage,
  }: any) => (
    <div>
      <div>chats-segment</div>
      <div>show-search-{String(showSearch)}</div>
      <div>mutual-count-{mutualConnectionsList?.length ?? 0}</div>
      <div>chat-count-{chats?.length ?? 0}</div>
      <div>has-next-{String(chatsHasNextPage)}</div>
      <div>fetching-next-{String(chatsIsFetchingNextPage)}</div>
    </div>
  ),
}));

vi.mock('../components/GroupChats/GroupChatsSegment', () => ({
  default: ({ groupChats, groupChatInvites }: any) => (
    <div>
      <div>group-chats-segment</div>
      <div>group-count-{groupChats?.data?.length ?? 0}</div>
      <div>invite-count-{groupChatInvites?.data?.length ?? 0}</div>
    </div>
  ),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');

  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: (...args: any[]) => invalidateQueries(...args),
      ensureQueryData: (...args: any[]) => ensureQueryData(...args),
      getQueryData: (...args: any[]) => getQueryData(...args),
    }),
  };
});

import Chats from './Chats';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useGetCurrentUserChats } from '../hooks/api/chats/current-user-chats';
import { useGetCurrentUserChatsPaginated } from '../hooks/api/chats/current-user-chats-paginated';
import { useGetMutualConnections } from '../hooks/api/profiles/mutual-connections';
import { useGetStatuses } from '../hooks/api/status';
import { useIncomingConnectionsInf } from '../hooks/api/profiles/incoming-connections-paginated';

const mockCurrentProfile = vi.mocked(useGetCurrentProfile);
const mockCurrentUserChats = vi.mocked(useGetCurrentUserChats);
const mockPaginatedChats = vi.mocked(useGetCurrentUserChatsPaginated);
const mockMutualConnections = vi.mocked(useGetMutualConnections);
const mockStatuses = vi.mocked(useGetStatuses);
const mockIncomingConnections = vi.mocked(useIncomingConnectionsInf);

const baseProfile = {
  user: 7,
  created_profile: true,
  deactivated_profile: false,
};

const baseChats = [
  { id: 11, other_user_id: '42' },
  { id: 12, other_user_id: '43' },
  { id: 13, other_user_id: '44' },
  { id: 14, other_user_id: '45' },
];

const renderChats = () => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <Chats />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();

  appAddListener.mockReturnValue({ remove: vi.fn() });
  addWsListener.mockReturnValue(vi.fn());
  getGroupChats.mockResolvedValue({ data: [{ id: 1, group_name: 'Book Club' }] });
  getGroupChatInvites.mockResolvedValue({ data: [{ id: 2, group_name: 'Event Squad' }] });
  ensureQueryData.mockResolvedValue(undefined);
  getQueryData.mockReturnValue(baseChats);

  mockCurrentProfile.mockReturnValue({
    data: baseProfile,
    isLoading: false,
  } as any);
  mockCurrentUserChats.mockReturnValue({
    data: baseChats,
    isLoading: false,
    isFetching: false,
  } as any);
  mockPaginatedChats.mockReturnValue({
    data: { pages: [{ results: [{ id: 11 }, { id: 12 }] }] },
    hasNextPage: true,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  } as any);
  mockMutualConnections.mockReturnValue({
    data: [101, 102],
    isFetching: false,
  } as any);
  mockStatuses.mockReturnValue({ data: [] } as any);
  mockIncomingConnections.mockReturnValue({
    data: { pages: [{ count: 7 }] },
  } as any);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Chats page', () => {
  it('renders the active chats segment from AppV2 with paginated chat props', async () => {
    renderChats();

    expect(await screen.findByText('chats-segment')).toBeInTheDocument();
    expect(screen.getByText('show-search-false')).toBeInTheDocument();
    expect(screen.getByText('mutual-count-2')).toBeInTheDocument();
    expect(screen.getByText('chat-count-2')).toBeInTheDocument();
    expect(screen.getByText('has-next-true')).toBeInTheDocument();
  });

  it('falls back to the warmed chat list when paginated chats have not loaded yet', async () => {
    mockPaginatedChats.mockReturnValue({
      data: undefined,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    } as any);

    renderChats();

    expect(await screen.findByText('chats-segment')).toBeInTheDocument();
    expect(screen.getByText('chat-count-4')).toBeInTheDocument();
    expect(screen.getByText('has-next-false')).toBeInTheDocument();
  });

  it('shows a small refreshing indicator while fresh chats are loading over warmed data', async () => {
    mockCurrentUserChats.mockReturnValue({
      data: baseChats,
      isLoading: false,
      isFetching: true,
    } as any);

    const { container } = renderChats();

    await waitFor(() => {
      expect(screen.getByTestId('warm-cache-refresh-indicator')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="warm-cache-refresh-indicator"] ion-spinner[name="dots"]')).toBeTruthy();
    });
  });

  it('keeps the warmed chats segment visible and does not flash the loading card while fresh chats are fetching', async () => {
    mockCurrentUserChats.mockReturnValue({
      data: baseChats,
      isLoading: false,
      isFetching: true,
    } as any);

    renderChats();

    expect(await screen.findByText('chats-segment')).toBeInTheDocument();
    expect(screen.getByText('chat-count-2')).toBeInTheDocument();
    expect(screen.queryByText('loading-card')).not.toBeInTheDocument();
  });

  it('toggles search mode when the search button is pressed and mutuals exist', async () => {
    const { container } = renderChats();

    expect(await screen.findByText('show-search-false')).toBeInTheDocument();

    const buttons = container.querySelectorAll('ion-button');
    fireEvent.click(buttons[0] as HTMLElement);

    expect(await screen.findByText('show-search-true')).toBeInTheDocument();
  });

  it('disables the search button when there are no mutual connections', async () => {
    mockMutualConnections.mockReturnValue({
      data: [],
    } as any);

    const { container } = renderChats();

    await screen.findByText('chats-segment');
    expect(container.querySelector('.segments ion-button')?.getAttribute('disabled')).toBe('');
  });

  it('shows a capped likes badge when incoming likes exceed five', async () => {
    renderChats();

    expect(await screen.findByText('5+')).toBeInTheDocument();
  });

  it('switches to groups and fetches group chat data', async () => {
    renderChats();

    fireEvent.click(await screen.findByText('Groups'));

    await waitFor(() => {
      expect(getGroupChats).toHaveBeenCalledTimes(1);
      expect(getGroupChatInvites).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('group-chats-segment')).toBeInTheDocument();
    expect(screen.getByText('group-count-1')).toBeInTheDocument();
    expect(screen.getByText('invite-count-1')).toBeInTheDocument();
  });

  it('refreshes group data and mutual queries from the pull-to-refresh handler', async () => {
    vi.useFakeTimers();
    const { container } = renderChats();

    const refresher = container.querySelector('ion-refresher') as HTMLElement;
    const complete = vi.fn();
    fireEvent(
      refresher,
      new CustomEvent('ionRefresh', {
        detail: { complete },
        bubbles: true,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(getGroupChats).toHaveBeenCalled();
    expect(getGroupChatInvites).toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['mutuals'] })
    );
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('invalidates chat detail, chat lists, and unread count on websocket msg_type 9', async () => {
    renderChats();

    const listener = addWsListener.mock.calls[0][0];

    await act(async () => {
      listener({ msg_type: 9, sender: '42' });
    });

    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['chats', 'details', 11] })
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['chats'] })
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['chats', 'paginated'] })
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['unread'] })
    );
  });

  it('still runs all invalidations on msg_type 9 when allChats has not yet loaded', async () => {
    mockCurrentUserChats.mockReturnValue({ data: undefined, isLoading: true, isFetching: false } as any);
    renderChats();

    const listener = addWsListener.mock.calls[0][0];

    await act(async () => {
      listener({ msg_type: 9, sender: '99' });
    });

    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['chats'] })
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['chats', 'paginated'] })
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['unread'] })
    );
    expect(invalidateQueries).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['details']) })
    );
  });

  it('refreshes chat data and top three details on app resume', async () => {
    renderChats();

    const resumeHandler = appAddListener.mock.calls[0][1];

    await act(async () => {
      await resumeHandler();
    });

    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['mutuals'] })
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['mutuals-no-dialog'] })
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['chats'] })
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['chats', 'paginated'] })
    );
    expect(ensureQueryData).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['chats'] })
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['chats', 'details', 11] })
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['chats', 'details', 12] })
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['chats', 'details', 13] })
    );
  });

  it('renders the chats status toast when there is an active, unexpired chats status', async () => {
    mockStatuses.mockReturnValue({
      data: [
        {
          page: 'chats',
          active: true,
          header: 'Chats update',
          message: 'Unread messages may take a second to sync.',
          expirationDateTime: '2099-01-01T00:00:00.000Z',
        },
      ],
    } as any);

    renderChats();

    expect(await screen.findByText('status-toast')).toBeInTheDocument();
    expect(screen.getByText('Chats update')).toBeInTheDocument();
    expect(screen.getByText('Unread messages may take a second to sync.')).toBeInTheDocument();
  });

  it('shows a loading card while profile access is still loading', async () => {
    mockCurrentProfile.mockReturnValue({
      data: null,
      isLoading: true,
    } as any);
    mockCurrentUserChats.mockReturnValue({
      data: null,
      isLoading: true,
    } as any);

    renderChats();

    expect((await screen.findAllByTestId('chat-skeleton-item')).length).toBe(5);
    expect(screen.getAllByText('User')).toHaveLength(5);
  });

  it('shows the cant-access card when the user cannot access chats', async () => {
    mockCurrentProfile.mockReturnValue({
      data: { ...baseProfile, deactivated_profile: true },
      isLoading: false,
    } as any);

    renderChats();

    expect(await screen.findByText('cant-access-Chats')).toBeInTheDocument();
  });
});
