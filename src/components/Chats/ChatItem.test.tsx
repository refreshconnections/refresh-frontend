import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp } from '@ionic/react';

const {
  invalidateQueries,
  presentModal,
  dismissModal,
  modalProps,
} = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  presentModal: vi.fn(),
  dismissModal: vi.fn(),
  modalProps: [] as any[],
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    useIonModal: (_component: any, props: any) => {
      modalProps.push(props);
      return [presentModal, dismissModal];
    },
  };
});

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: (...args: any[]) => invalidateQueries(...args),
    }),
  };
});

vi.mock('../../hooks/api/profiles/details', () => ({
  useProfileDetails: () => ({
    data: { user: 42, deactivated_profile: false },
  }),
}));

vi.mock('../../hooks/utilities', () => ({
  isPersonalPlus: vi.fn(() => true),
  onImgError: vi.fn(),
  getPrimaryPhoto: vi.fn(() => null),
}));

vi.mock('../TextModal', () => ({
  default: () => <div>text-modal</div>,
}));

import ChatItem from './ChatItem';

const renderChatItem = () => {
  const queryClient = new QueryClient();
  return render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <ChatItem
          user={42}
          currentUserProfile={{
            subscription_level: 'personalplus',
            settings_alt_text: true,
            settings_new_message_count: true,
            hidden_dialogs: [],
            blocked_connections: [],
            name: 'Alex',
          }}
          chat={{
            id: 11,
            other_user_id: '42',
            unread_count: 2,
            pic1_main: 'https://example.com/a.jpg',
            name: 'Sam',
          }}
        />
      </QueryClientProvider>
    </IonApp>
  );
};

const renderChatItemWithChat = (chat: any) => {
  const queryClient = new QueryClient();
  const currentUserProfile = {
    subscription_level: 'personalplus',
    settings_alt_text: true,
    settings_new_message_count: true,
    settings_chats_next_reminder: true,
    hidden_dialogs: [],
    blocked_connections: [],
    name: 'Alex',
  };

  const view = (nextChat: any) => (
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <ChatItem
          user={42}
          currentUserProfile={currentUserProfile}
          chat={nextChat}
        />
      </QueryClientProvider>
    </IonApp>
  );

  return {
    ...render(view(chat)),
    rerenderChat: (nextChat: any) => view(nextChat),
  };
};

describe('ChatItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    modalProps.length = 0;
  });

  it('keeps the full chats query stable when dismissing an existing chat modal without new activity', () => {
    renderChatItem();

    act(() => {
      fireEvent.click(screen.getByText('Sam'));
    });
    expect(presentModal).toHaveBeenCalled();

    act(() => {
      modalProps[0].onDismiss();
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['unread'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['chats', 'details', 11],
    });
    expect(invalidateQueries).not.toHaveBeenCalledWith({
      queryKey: ['chats'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['chats', 'paginated'],
    });
  });

  it('refreshes the chats lists on dismiss when the open modal reports new chat activity', () => {
    renderChatItem();

    act(() => {
      fireEvent.click(screen.getByText('Sam'));
    });
    expect(presentModal).toHaveBeenCalled();

    act(() => {
      modalProps[0].onDismiss({ refreshChatList: true });
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['unread'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['chats', 'details', 11],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['chats'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['chats', 'paginated'],
    });
  });

  it('shows the unread badge when a previously opened chat goes from zero to one unread message', async () => {
    const initialChat = {
      id: 11,
      other_user_id: '42',
      unread_count: 0,
      keep_it_going: true,
      pic1_main: 'https://example.com/a.jpg',
      name: 'Sam',
    };
    const { rerender, rerenderChat } = renderChatItemWithChat(initialChat);

    act(() => {
      fireEvent.click(screen.getByText('Sam'));
    });

    rerender(rerenderChat({
      ...initialChat,
      unread_count: 1,
    }));

    expect(await screen.findByText('1 new')).toBeInTheDocument();
    expect(screen.queryByText('Keep it going!')).not.toBeInTheDocument();
  });
});
