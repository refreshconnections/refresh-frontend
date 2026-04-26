import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { profileDetailsHook, modalProps } = vi.hoisted(() => ({
  profileDetailsHook: vi.fn(),
  modalProps: [] as any[],
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');

  return {
    ...actual,
    useIonModal: (_component: any, props: any) => {
      modalProps.push(props);
      return [vi.fn(), vi.fn()];
    },
  };
});

vi.mock('../../hooks/api/profiles/details', () => ({
  useProfileDetails: (...args: any[]) => profileDetailsHook(...args),
}));

vi.mock('../../hooks/utilities', () => ({
  isPersonalPlus: vi.fn(() => false),
  onImgError: vi.fn(),
}));

vi.mock('../TextModal', () => ({
  default: () => <div>text-modal</div>,
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

import NewChatItem from './NewChatItem';
import HiddenChatItem from './HiddenChatItem';

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

const currentUserProfile = {
  user: 7,
  subscription_level: 'free',
  settings_alt_text: true,
  hidden_dialogs: [],
  blocked_connections: [],
  name: 'Taylor',
};

beforeEach(() => {
  vi.clearAllMocks();
  modalProps.length = 0;
});

describe('chat row loading states', () => {
  it('does not render a new chat row while its profile is loading', () => {
    profileDetailsHook.mockReturnValue({
      data: null,
      isLoading: true,
    });

    renderWithProviders(
      <NewChatItem user={91} currentUserProfile={currentUserProfile} opener={false} />
    );

    expect(profileDetailsHook).toHaveBeenCalledWith(91, true);
    expect(screen.queryByText('User')).not.toBeInTheDocument();
  });

  it('does not render a hidden chat row while its profile is loading', () => {
    profileDetailsHook.mockReturnValue({
      data: null,
      isLoading: true,
    });

    renderWithProviders(
      <HiddenChatItem
        user={91}
        currentUserProfile={{ ...currentUserProfile, hidden_dialogs: [91] }}
        chat={{ id: 1, other_user_id: '91', unread_count: 0 }}
      />
    );

    expect(profileDetailsHook).toHaveBeenCalledWith(91, true);
    expect(screen.queryByText('User')).not.toBeInTheDocument();
  });

  it('renders the profile name once the new chat profile has loaded', () => {
    profileDetailsHook.mockReturnValue({
      data: {
        user: 91,
        name: 'Alex',
        pic1_main: null,
      },
      isLoading: false,
    });

    renderWithProviders(
      <NewChatItem user={91} currentUserProfile={currentUserProfile} opener={false} />
    );

    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('uses the user id for the new chat modal before profile details load', () => {
    profileDetailsHook.mockReturnValue({
      data: null,
      isLoading: false,
    });

    renderWithProviders(
      <NewChatItem
        user={91}
        currentUserProfile={currentUserProfile}
        opener={false}
        name="Alex"
        pic1_main={null}
      />
    );

    expect(profileDetailsHook).toHaveBeenCalledWith(91, false);
    expect(modalProps[0].textModalData.other_user_id).toBe('91');
  });
});
