import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp } from '@ionic/react';

const {
  hiddenChatsHook,
  mutualsNoDialogHook,
} = vi.hoisted(() => ({
  hiddenChatsHook: vi.fn(),
  mutualsNoDialogHook: vi.fn(),
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('./ChatItem', () => ({
  default: ({ user, chat }: any) => <div>chat-item-{user}-{chat.id}</div>,
}));

vi.mock('./NewChatItem', () => ({
  default: ({ user, opener }: any) => <div>new-chat-item-{user}-{String(opener)}</div>,
}));

vi.mock('./HiddenChatItem', () => ({
  default: ({ user, chat }: any) => <div>hidden-chat-item-{user}-{chat.id}</div>,
}));

vi.mock('../../hooks/api/profiles/mutuals-no-dialog-v3', () => ({
  useGetMutualConnectionsNoDialogV3: (...args: any[]) => mutualsNoDialogHook(...args),
}));

vi.mock('../../hooks/api/chats/hidden-chats', () => ({
  useGetHiddenChats: (...args: any[]) => hiddenChatsHook(...args),
}));

import OngoingChats from './OngoingChats';
import NewChats from './NewChats';

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient();

  return render(
    <IonApp>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </IonApp>
  );
};

const currentUserProfile = {
  user: 7,
  subscription_level: 'personalplus',
  settings_alt_text: true,
  hidden_dialogs: [50, 51],
  blocked_connections: [51],
};

beforeEach(() => {
  vi.clearAllMocks();

  Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });

  mutualsNoDialogHook.mockReturnValue({
    data: {
      pages: [
        {
          results: [
            { user_id: 91, opener: false },
            { user_id: 91, opener: true },
            { user_id: 92, opener: true },
          ],
        },
      ],
    },
    isLoading: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  });

  hiddenChatsHook.mockImplementation((enabled: boolean) => ({
    data: enabled
      ? {
          pages: [
            {
              results: [
                { id: 1, other_user_id: '50' },
                { id: 2, other_user_id: '51' },
              ],
            },
          ],
        }
      : undefined,
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
  }));
});

describe('OngoingChats', () => {
  it('renders chat items for each ongoing chat', async () => {
    renderWithProviders(
      <OngoingChats
        currentUserProfile={currentUserProfile}
        chatsList={[
          { id: 11, other_user_id: '42' },
          { id: 12, other_user_id: '43' },
        ]}
        hasNextPage={false}
        isFetchingNextPage={false}
        onLoadMore={vi.fn()}
      />
    );

    expect(await screen.findByText('chat-item-42-11')).toBeInTheDocument();
    expect(screen.getByText('chat-item-43-12')).toBeInTheDocument();
  });

  it('shows and triggers the load-more button when pagination is available', async () => {
    const onLoadMore = vi.fn();

    renderWithProviders(
      <OngoingChats
        currentUserProfile={currentUserProfile}
        chatsList={[{ id: 11, other_user_id: '42' }]}
        hasNextPage={true}
        isFetchingNextPage={false}
        onLoadMore={onLoadMore}
      />
    );

    fireEvent.click(await screen.findByText('Load more'));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('disables the load-more button while the next page is fetching', async () => {
    const { container } = renderWithProviders(
      <OngoingChats
        currentUserProfile={currentUserProfile}
        chatsList={[{ id: 11, other_user_id: '42' }]}
        hasNextPage={true}
        isFetchingNextPage={true}
        onLoadMore={vi.fn()}
      />
    );

    await screen.findByText('chat-item-42-11');
    expect(container.querySelector('ion-button')?.getAttribute('disabled')).toBe('');
  });
});

describe('NewChats', () => {
  it('deduplicates new connections before rendering chat items', async () => {
    renderWithProviders(
      <NewChats currentUserProfile={currentUserProfile} />
    );

    expect(await screen.findByText('Your new connections')).toBeInTheDocument();
    expect(screen.getByText('new-chat-item-91-false')).toBeInTheDocument();
    expect(screen.getByText('new-chat-item-92-true')).toBeInTheDocument();
    expect(screen.queryByText('new-chat-item-91-true')).not.toBeInTheDocument();
  });

  it('shows a loading spinner while new connections are loading', async () => {
    mutualsNoDialogHook.mockReturnValue({
      data: undefined,
      isLoading: true,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    const { container } = renderWithProviders(
      <NewChats currentUserProfile={currentUserProfile} />
    );

    expect(container.querySelector('ion-spinner')).toBeTruthy();
  });

  it('supports pagination for additional new connections', async () => {
    const fetchNextPage = vi.fn();
    mutualsNoDialogHook.mockReturnValue({
      data: {
        pages: [{ results: [{ user_id: 91, opener: false }] }],
      },
      isLoading: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    });

    renderWithProviders(
      <NewChats currentUserProfile={currentUserProfile} />
    );

    fireEvent.click(await screen.findByText('See more'));

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });
});

