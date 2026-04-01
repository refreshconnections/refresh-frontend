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

describe('ChatItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    modalProps.length = 0;
  });

  it('does not invalidate the full chats lists when dismissing an existing chat modal', () => {
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
    expect(invalidateQueries).not.toHaveBeenCalledWith({
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
});
