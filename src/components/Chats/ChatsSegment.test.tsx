import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const {
  filteredMutualsHook,
  chatGroupsHook,
  localChatsHook,
  hiddenChatsHook,
  filteredChatsHook,
  preferencesGet,
} = vi.hoisted(() => ({
  filteredMutualsHook: vi.fn(),
  chatGroupsHook: vi.fn(),
  localChatsHook: vi.fn(),
  hiddenChatsHook: vi.fn(),
  filteredChatsHook: vi.fn(),
  preferencesGet: vi.fn(),
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: { get: (...args: any[]) => preferencesGet(...args) },
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('../../hooks/api/profiles/mutual-connections-filtered', () => ({
  useGetMutualConnectionsFiltered: (...args: any[]) => filteredMutualsHook(...args),
}));

vi.mock('../../hooks/api/chats/chat-groups', () => ({
  useChatGroups: (...args: any[]) => chatGroupsHook(...args),
}));

vi.mock('../../hooks/api/chats/local-chats', () => ({
  useLocalChats: (...args: any[]) => localChatsHook(...args),
}));

vi.mock('../../hooks/api/chats/hidden-chats', () => ({
  useGetHiddenChats: (...args: any[]) => hiddenChatsHook(...args),
}));

vi.mock('../../hooks/api/chats/filtered-chats', () => ({
  useFilteredChats: (...args: any[]) => filteredChatsHook(...args),
}));

vi.mock('./OrganizeChatsModal', () => ({
  default: () => <div>organize-modal</div>,
}));

vi.mock('../../hooks/useUpsellAlert', () => ({
  useUpsellAlert: () => vi.fn(),
}));

vi.mock('./OngoingChats', () => ({
  default: ({ chatsList }: any) => <div>ongoing-chats-{chatsList?.length ?? 0}</div>,
}));

vi.mock('./NewChats', () => ({
  default: () => <div>new-chats</div>,
}));

vi.mock('./HiddenChatItem', () => ({
  default: ({ user }: any) => <div>hidden-chat-item-{user}</div>,
}));

vi.mock('./NewChatItem', () => ({
  default: ({ user }: any) => <div>searched-chat-{user}</div>,
}));

import ChatsSegment from './ChatsSegment';

const defaultGroups = {
  group1_name: null, group2_name: null, group3_name: null,
  group1_hidden: false, group2_hidden: false, group3_hidden: false,
  group1: [], group2: [], group3: [],
};

const renderSegment = (props: Partial<React.ComponentProps<typeof ChatsSegment>> = {}) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ChatsSegment
        mutualConnectionsList={[1, 2]}
        chats={[{ id: 11, other_user_id: '42', name: 'Alice', pic1_main: null }]}
        currentUserProfile={{ blocked_connections: [], subscription_level: 'free' }}
        showSearch={false}
        chatsHasNextPage={false}
        chatsIsFetchingNextPage={false}
        onLoadMoreChats={vi.fn()}
        {...props}
      />
    </QueryClientProvider>
  );
};

const ionSearchInput = async (el: HTMLIonSearchbarElement | null, value: string) => {
  if (!el) return;
  fireEvent(el, new CustomEvent('ionInput', { detail: { value }, bubbles: true }));
  const reactKey = Object.keys(el).find(k => k.startsWith('__reactProps'));
  const onIonInput = reactKey ? (el as any)[reactKey]?.onIonInput : undefined;
  if (typeof onIonInput === 'function') {
    await act(async () => { onIonInput({ detail: { value } }); });
  }
};

beforeEach(() => {
  vi.clearAllMocks();
  preferencesGet.mockResolvedValue({ value: null });
  filteredMutualsHook.mockReturnValue({ data: [7, 8] });
  chatGroupsHook.mockReturnValue({ data: defaultGroups });
  localChatsHook.mockReturnValue({ data: undefined, isFetchingNextPage: false, hasNextPage: false, fetchNextPage: vi.fn() });
  hiddenChatsHook.mockReturnValue({
    data: undefined,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
  });
  filteredChatsHook.mockReturnValue({ data: undefined, isFetching: false });
});

describe('ChatsSegment', () => {
  it('renders ongoing and new chats on the All tab', async () => {
    renderSegment();

    expect(await screen.findByText('ongoing-chats-1')).toBeInTheDocument();
    expect(screen.getByText('new-chats')).toBeInTheDocument();
  });

  it('shows the empty-state CTA when there are no mutual connections', async () => {
    renderSegment({ mutualConnectionsList: [] });

    expect(await screen.findByText('Connect with others in Discovery and Likes to start Chats!')).toBeInTheDocument();
  });

  it('renders search results when search is visible and a query is entered', async () => {
    const { container } = renderSegment({ showSearch: true });

    const searchbar = container.querySelector('ion-searchbar');
    await ionSearchInput(searchbar, 'al');

    expect(await screen.findByText('searched-chat-7')).toBeInTheDocument();
    expect(screen.getByText('searched-chat-8')).toBeInTheDocument();
  });

  it('shows the "could not find anyone" message when search returns no results', async () => {
    filteredMutualsHook.mockReturnValue({ data: [] });
    const { container } = renderSegment({ showSearch: true });

    const searchbar = container.querySelector('ion-searchbar');
    await ionSearchInput(searchbar, 'nobody');

    expect(await screen.findByText(/Couldn't find anyone/i)).toBeInTheDocument();
  });

  it('shows the blocked-user empty message when the only search result is blocked', async () => {
    filteredMutualsHook.mockReturnValue({ data: [8] });
    const { container } = renderSegment({
      showSearch: true,
      currentUserProfile: { blocked_connections: [8], subscription_level: 'free' },
    });

    const searchbar = container.querySelector('ion-searchbar');
    await ionSearchInput(searchbar, 'blocked');

    expect(await screen.findByText(/Couldn't find anyone/i)).toBeInTheDocument();
  });
});

describe('ChatsSegment tab system', () => {
  it('shows the All chip by default when chat_organizer preference is not set', async () => {
    renderSegment();

    expect(await screen.findByText('All')).toBeInTheDocument();
  });

  it('hides the chip row when chat_organizer preference is false', async () => {
    preferencesGet.mockResolvedValue({ value: 'false' });
    renderSegment();

    await waitFor(() => {
      expect(screen.queryByText('All')).not.toBeInTheDocument();
    });
  });

  it('hides the chip row in real time when chat_organizer_changed fires with false', async () => {
    renderSegment();

    expect(await screen.findByText('All')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent('chat_organizer_changed', { detail: false }));
    });

    await waitFor(() => {
      expect(screen.queryByText('All')).not.toBeInTheDocument();
    });
  });

  it('restores the chip row in real time when chat_organizer_changed fires with true', async () => {
    preferencesGet.mockResolvedValue({ value: 'false' });
    renderSegment();

    await waitFor(() => expect(screen.queryByText('All')).not.toBeInTheDocument());

    act(() => {
      window.dispatchEvent(new CustomEvent('chat_organizer_changed', { detail: true }));
    });

    expect(await screen.findByText('All')).toBeInTheDocument();
  });

  it('shows a Local chip when localChats has results', async () => {
    localChatsHook.mockReturnValue({ data: { pages: [{ count: 2, results: [] }] }, isFetchingNextPage: false, hasNextPage: false, fetchNextPage: vi.fn() });
    renderSegment();

    expect(await screen.findByText('Local')).toBeInTheDocument();
  });

  it('does not show a Local chip when localChats count is 0', async () => {
    localChatsHook.mockReturnValue({ data: { pages: [{ count: 0, results: [] }] }, isFetchingNextPage: false, hasNextPage: false, fetchNextPage: vi.fn() });
    renderSegment();

    await screen.findByText('All');
    expect(screen.queryByText('Local')).not.toBeInTheDocument();
  });

  it('does not show a Local chip when localChats data is not yet loaded', async () => {
    localChatsHook.mockReturnValue({ data: undefined, isFetchingNextPage: false, hasNextPage: false, fetchNextPage: vi.fn() });
    renderSegment();

    await screen.findByText('All');
    expect(screen.queryByText('Local')).not.toBeInTheDocument();
  });

  it('shows a custom list chip for personalplus users when the list has members and is not hidden', async () => {
    chatGroupsHook.mockReturnValue({
      data: {
        ...defaultGroups,
        group1_name: 'Close friends',
        group1: [{ id: 5, name: 'Bob', pic1_main: null }],
      },
    });
    renderSegment({ currentUserProfile: { blocked_connections: [], subscription_level: 'personalplus' } });

    expect(await screen.findByText('Close friends')).toBeInTheDocument();
  });

  it('shows "My List" as the chip label when the list has no name', async () => {
    chatGroupsHook.mockReturnValue({
      data: {
        ...defaultGroups,
        group1_name: null,
        group1: [{ id: 5, name: 'Bob', pic1_main: null }],
      },
    });
    renderSegment({ currentUserProfile: { blocked_connections: [], subscription_level: 'personalplus' } });

    expect(await screen.findByText('My List')).toBeInTheDocument();
  });

  it('does not show a custom list chip when the list is marked hidden', async () => {
    chatGroupsHook.mockReturnValue({
      data: {
        ...defaultGroups,
        group1_name: 'Secret',
        group1_hidden: true,
        group1: [{ id: 5, name: 'Bob', pic1_main: null }],
      },
    });
    renderSegment({ currentUserProfile: { blocked_connections: [], subscription_level: 'personalplus' } });

    await screen.findByText('All');
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });

  it('does not show a custom list chip when the list has no members', async () => {
    chatGroupsHook.mockReturnValue({
      data: { ...defaultGroups, group1_name: 'Empty list', group1: [] },
    });
    renderSegment({ currentUserProfile: { blocked_connections: [], subscription_level: 'personalplus' } });

    await screen.findByText('All');
    expect(screen.queryByText('Empty list')).not.toBeInTheDocument();
  });

  it('does not show custom list chips for non-personalplus users', async () => {
    chatGroupsHook.mockReturnValue({
      data: {
        ...defaultGroups,
        group1_name: 'My People',
        group1: [{ id: 5, name: 'Bob', pic1_main: null }],
      },
    });
    renderSegment({ currentUserProfile: { blocked_connections: [], subscription_level: 'free' } });

    await screen.findByText('All');
    expect(screen.queryByText('My People')).not.toBeInTheDocument();
  });
});
