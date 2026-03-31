import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';

const {
  mockPresentAlert,
  mockPresentModal,
  mockDismissModal,
  mockInvalidateQueries,
  mockClearHiddenSomething,
  mockCommunityBlockMigration,
  mockRemoveFromHiddenDialogs,
  mockRemoveCommunityBlocked,
  mockApiGet,
  mockFetchNextPage,
  mockUseGetHiddenChats,
} = vi.hoisted(() => ({
  mockPresentAlert: vi.fn(),
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  mockInvalidateQueries: vi.fn(),
  mockClearHiddenSomething: vi.fn(),
  mockCommunityBlockMigration: vi.fn(),
  mockRemoveFromHiddenDialogs: vi.fn(),
  mockRemoveCommunityBlocked: vi.fn(),
  mockApiGet: vi.fn(),
  mockFetchNextPage: vi.fn(),
  mockUseGetHiddenChats: vi.fn(),
}));

let mockProfile: any = {
  hidden_dialogs: [1],
  hidden_announcements: [10, 11],
  hidden_authors: [12, 13],
  blocked_connections: [2, 3],
  community_blocked: [2, 4],
};
let mockHiddenChatsQuery: any;
let mockProfileDetailsById: Record<number, any> = {
  7: { name: 'Sam' },
  8: { name: 'Jamie' },
};

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    useIonAlert: () => [mockPresentAlert, vi.fn()],
    useIonModal: () => [mockPresentModal, mockDismissModal],
  };
});

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: (...args: any[]) => mockInvalidateQueries(...args),
    }),
  };
});

vi.mock('../hooks/utilities', () => ({
  clearHiddenSomething: (...args: any[]) => mockClearHiddenSomething(...args),
  communityBlockMigration: (...args: any[]) => mockCommunityBlockMigration(...args),
  removeFromHiddenDialogs: (...args: any[]) => mockRemoveFromHiddenDialogs(...args),
  removeCommunityBlocked: (...args: any[]) => mockRemoveCommunityBlocked(...args),
}));

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: () => ({ data: mockProfile }),
}));

vi.mock('../hooks/api/chats/hidden-chats', () => ({
  useGetHiddenChats: (...args: any[]) => {
    mockUseGetHiddenChats(...args);
    return mockHiddenChatsQuery ?? {
      data: {
        pages: [
          {
            results: [
              { id: 'chat-1', other_user_id: '7' },
              { id: 'chat-2', other_user_id: '8' },
            ],
          },
        ],
      },
      isLoading: false,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage: mockFetchNextPage,
    };
  },
}));

vi.mock('../hooks/api/profiles/details', () => ({
  useProfileDetails: (userId: number) => ({ data: mockProfileDetailsById[userId] }),
}));

vi.mock('../hooks/api/api-client', () => ({
  apiClient: {
    get: (...args: any[]) => mockApiGet(...args),
  },
}));

vi.mock('../components/BlockTypesExplainedModal', () => ({
  default: () => <div>block-types-modal</div>,
}));

import EditHiddenContentModal from './EditHiddenContentModal';

const renderModal = () => {
  const queryClient = new QueryClient();
  const onDismiss = vi.fn();
  return {
    onDismiss,
    ...render(
      <IonApp>
        <QueryClientProvider client={queryClient}>
          <EditHiddenContentModal onDismiss={onDismiss} />
        </QueryClientProvider>
      </IonApp>
    ),
  };
};

describe('EditHiddenContentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfile = {
      hidden_dialogs: [1],
      hidden_announcements: [10, 11],
      hidden_authors: [12, 13],
      blocked_connections: [2, 3],
      community_blocked: [2, 4],
    };
    mockHiddenChatsQuery = null;
    mockProfileDetailsById = {
      7: { name: 'Sam' },
      8: { name: 'Jamie' },
    };
    mockApiGet.mockResolvedValue({
      data: [
        { user_id: 44, username: 'blockeduser', name: 'Blocked User' },
      ],
    });
    mockClearHiddenSomething.mockResolvedValue(undefined);
    mockCommunityBlockMigration.mockResolvedValue(undefined);
    mockRemoveFromHiddenDialogs.mockResolvedValue(undefined);
    mockRemoveCommunityBlocked.mockResolvedValue(undefined);
  });

  it('keeps hidden chats query disabled until the accordion is opened', async () => {
    renderModal();

    expect(mockUseGetHiddenChats).toHaveBeenCalledWith(false);

    fireEvent(
      document.querySelector('ion-accordion-group') as Element,
      new CustomEvent('ionChange', { detail: { value: 'chats' }, bubbles: true })
    );

    await waitFor(() => {
      expect(mockUseGetHiddenChats).toHaveBeenLastCalledWith(true);
    });
  });

  it('renders hidden chat rows, supports searching, unhide, and load more', async () => {
    renderModal();

    fireEvent(
      document.querySelector('ion-accordion-group') as Element,
      new CustomEvent('ionChange', { detail: { value: 'chats' }, bubbles: true })
    );

    expect(await screen.findByText('Sam')).toBeInTheDocument();
    expect(screen.getByText('Jamie')).toBeInTheDocument();

    const searchInput = document.querySelector('ion-input[placeholder="Search by name"]') as HTMLElement;
    fireEvent(searchInput, new CustomEvent('ionInput', { detail: { value: 'jam' }, bubbles: true }));

    await waitFor(() => {
      expect(screen.queryByText('Sam')).not.toBeInTheDocument();
      expect(screen.getByText('Jamie')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Unhide'));
    await waitFor(() => {
      expect(mockRemoveFromHiddenDialogs).toHaveBeenCalled();
      expect(mockInvalidateQueries).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText('Load more'));
    expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('confirms clearing hidden posts, hidden authors, and upgrades personal blocks', async () => {
    renderModal();

    fireEvent.click(screen.getAllByText('Unhide all')[0]);
    const clearPostsConfig = mockPresentAlert.mock.calls[0][0];
    await act(async () => {
      await clearPostsConfig.buttons[1].handler();
    });
    expect(mockClearHiddenSomething).toHaveBeenCalledWith('posts');

    fireEvent.click(screen.getAllByText('Unhide all')[1]);
    const clearAuthorsConfig = mockPresentAlert.mock.calls[1][0];
    await act(async () => {
      await clearAuthorsConfig.buttons[1].handler();
    });
    expect(mockClearHiddenSomething).toHaveBeenCalledWith('authors');

    fireEvent.click(screen.getByText('Upgrade all'));
    const upgradeConfig = mockPresentAlert.mock.calls[2][0];
    expect(upgradeConfig.message).toContain('1 personal block');
    await act(async () => {
      await upgradeConfig.buttons[1].handler();
    });
    expect(mockCommunityBlockMigration).toHaveBeenCalledTimes(1);
  });

  it('searches and removes community blocks and opens the block types explainer', async () => {
    renderModal();

    const communityInput = document.querySelector('ion-input[placeholder="Search by username"]') as HTMLElement;
    fireEvent(communityInput, new CustomEvent('ionInput', { detail: { value: 'blocked' }, bubbles: true }));

    expect(await screen.findByText('@blockeduser')).toBeInTheDocument();
    expect(mockApiGet).toHaveBeenCalledWith('/api/profiles/community_blocked/search/', { params: { q: 'blocked' } });

    fireEvent.click(screen.getByText('Remove'));
    await waitFor(() => {
      expect(mockRemoveCommunityBlocked).toHaveBeenCalledWith(44);
    });

    fireEvent.click(screen.getByText('What is the difference between community and personal blocks?'));
    expect(mockPresentModal).toHaveBeenCalled();
  });

  it('shows the short-search helper for community blocks and still triggers the backend search', async () => {
    renderModal();

    const communityInput = document.querySelector('ion-input[placeholder="Search by username"]') as HTMLElement;
    fireEvent(communityInput, new CustomEvent('ionInput', { detail: { value: 'abc' }, bubbles: true }));

    expect(await screen.findByText('Enter at least 4 characters, or an exact match')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith('/api/profiles/community_blocked/search/', { params: { q: 'abc' } });
    });
  });
});
