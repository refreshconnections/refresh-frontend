import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp } from '@ionic/react';

const {
  mockPresentModal,
  mockDismissModal,
  mockPresentAlert,
  mockPresentActionSheet,
  mockInvalidateQueries,
  mockUpdateBlockedConnections,
  mockUpdateCommunityBlocked,
  mockRemoveCommunityBlocked,
  mockBlockProfile,
} = vi.hoisted(() => ({
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  mockPresentAlert: vi.fn(),
  mockPresentActionSheet: vi.fn(),
  mockInvalidateQueries: vi.fn(),
  mockUpdateBlockedConnections: vi.fn(),
  mockUpdateCommunityBlocked: vi.fn(),
  mockRemoveCommunityBlocked: vi.fn(),
  mockBlockProfile: vi.fn(),
}));

let mockCurrentProfile: any;
let mockProfileDetails: any;
let mockIncomingStatus: any;
let mockChats: any[];
let mockCommunityProfile: any;

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonApp: ({ children }: any) => <div>{children}</div>,
    useIonAlert: () => [mockPresentAlert, vi.fn()],
    useIonActionSheet: () => [mockPresentActionSheet, vi.fn()],
    useIonModal: (component: any, modalProps: any) => [
      (...args: any[]) => mockPresentModal(component?.name ?? 'AnonymousModal', modalProps, ...args),
      (...args: any[]) => mockDismissModal(...args),
    ],
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

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: () => ({ data: mockCurrentProfile }),
}));

vi.mock('../hooks/api/profiles/community-profile', () => ({
  useGetCommunityProfile: () => ({
    data: mockCommunityProfile,
    isLoading: false,
  }),
}));

vi.mock('../hooks/api/profiles/details', () => ({
  useProfileDetails: () => ({ data: mockProfileDetails }),
}));

vi.mock('../hooks/api/profiles/incoming-connection-status', () => ({
  useGetIncomingConnectionStatus: () => ({ data: mockIncomingStatus }),
}));

vi.mock('../hooks/api/chats/current-user-chats', () => ({
  useGetCurrentUserChats: () => ({ data: mockChats }),
}));

vi.mock('../hooks/useBlockProfile', () => ({
  useBlockProfile: () => mockBlockProfile,
}));

vi.mock('../hooks/utilities', () => ({
  getPrimaryOrderedPhoto: (profile: any) => {
    if (!profile) return null;
    const keys = ['pic1_main', 'pic2', 'pic3', 'pic4', 'pic5', 'pic6', 'pic7', 'pic8', 'pic9'];
    const preferredOrder = Array.isArray(profile.photo_order) && profile.photo_order.length > 0
      ? profile.photo_order
      : keys;
    const existing = keys.filter((key) => Boolean(profile[key]));
    const ordered = [
      ...preferredOrder.filter((key: string) => existing.includes(key)),
      ...existing.filter((key) => !preferredOrder.includes(key)),
    ];
    return ordered[0] ? profile[ordered[0]] : null;
  },
  getAvatarDisplay: vi.fn(({ profileImage }: any) => ({
    className: profileImage ? 'community-avatar' : 'refresh-avatar',
    src: profileImage ?? '../static/img/navynobordervector.png',
    hasImage: Boolean(profileImage),
    showConnectBorder: false,
  })),
  isPersonalPlus: (subscriptionLevel: string) => subscriptionLevel === 'pro' || subscriptionLevel === 'plus',
  normalizeLocalMediaUrl: (value: string | null | undefined) => value ?? undefined,
  onImgError: vi.fn(),
  updateBlockedConnections: (...args: any[]) => mockUpdateBlockedConnections(...args),
  updateCommunityBlocked: (...args: any[]) => mockUpdateCommunityBlocked(...args),
  removeCommunityBlocked: (...args: any[]) => mockRemoveCommunityBlocked(...args),
}));

vi.mock('./ProfileModal', () => ({ default: function ProfileModal() { return <div>profile-modal</div>; } }));
vi.mock('./TextModal', () => ({ default: function TextModal() { return <div>text-modal</div>; } }));
vi.mock('./ReportModal', () => ({ default: function ReportModal() { return <div>report-modal</div>; } }));
vi.mock('./CommunityProfileSection', () => ({ default: () => <div>community-profile-section</div> }));
vi.mock('./BlockTypesExplainedModal', () => ({ default: function BlockTypesExplainedModal() { return <div>block-types-modal</div>; } }));

import CommunityProfileModal from './CommunityProfileModal';

const baseCurrentProfile = {
  user: 99,
  username: 'alex',
  name: 'Alex',
  subscription_level: 'pro',
  settings_alt_text: false,
  settings_community_profile: true,
  mutual_connections: [],
  outgoing_connections: [],
  blocked_connections: [],
  blocked_by: [],
  community_blocked: [],
  unmatched_connections: [],
  created_profile: true,
  deactivated_profile: false,
  paused_profile: false,
};

const baseCommunityData = {
  user_id: 42,
  username: 'jordan',
  has_community_profile: true,
  community_bio: 'Love outdoor hangs.',
  location: 'Brooklyn',
  age_display: 31,
  connect_enabled: true,
  display_photo: '/img/community.jpg',
  community_profile_pic: null,
  personal_photo: '/img/personal.jpg',
};

const baseProfileDetails = {
  user: 42,
  name: 'Jordan',
  deactivated_profile: false,
  paused_profile: false,
  pic1_main: '/img/old-primary.jpg',
  pic2: '/img/new-primary.jpg',
  photo_order: ['pic2', 'pic1_main'],
};

const renderModal = (props: Partial<React.ComponentProps<typeof CommunityProfileModal>> = {}) => {
  const queryClient = new QueryClient();
  const onDismiss = vi.fn();
  return {
    onDismiss,
    ...render(
      <IonApp>
        <QueryClientProvider client={queryClient}>
          <CommunityProfileModal userId={42} onDismiss={onDismiss} {...props} />
        </QueryClientProvider>
      </IonApp>
    ),
  };
};

describe('CommunityProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentProfile = { ...baseCurrentProfile };
    mockProfileDetails = { ...baseProfileDetails };
    mockIncomingStatus = { is_incoming: false };
    mockChats = [];
    mockCommunityProfile = { ...baseCommunityData };
    mockUpdateBlockedConnections.mockResolvedValue(undefined);
    mockUpdateCommunityBlocked.mockResolvedValue(undefined);
    mockRemoveCommunityBlocked.mockResolvedValue(undefined);
  });

  it('shows the self branch and opens the community profile editor', async () => {
    mockCurrentProfile = { ...baseCurrentProfile, user: 42, username: 'self-alex' };

    renderModal({ userId: 42 });

    expect(await screen.findByText('This is you!')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Edit Refreshments profile'));
    expect(mockPresentModal).toHaveBeenCalledWith(
      'EditCommunityProfileModal',
      expect.objectContaining({
        onDismiss: expect.any(Function),
      })
    );
  });

  it('capitalizes the connect guidance correctly when the viewer already has an active personal profile', async () => {
    mockCurrentProfile = {
      ...baseCurrentProfile,
      settings_community_profile: false,
      created_profile: true,
    };
    mockCommunityProfile = {
      ...baseCommunityData,
      connect_enabled: false,
    };

    renderModal();

    expect(
      await screen.findByText(/Want to connect 1:1 with people you meet in the comments\? Turn on your Connect from Refreshments in your Me tab > Settings\./i)
    ).toBeInTheDocument();
  });

  it('does not show a personal-profile-derived refreshments avatar when the owner is paused and has no refreshments photo', async () => {
    mockProfileDetails = {
      ...baseProfileDetails,
      paused_profile: true,
    };
    mockCommunityProfile = {
      ...baseCommunityData,
      display_photo: '/img/personal-derived.jpg',
      community_profile_pic: null,
    };

    renderModal();

    const avatar = await screen.findByAltText('Refreshments profile');
    expect(avatar).toHaveAttribute('src', '../static/img/navynobordervector.png');
  });

  it('shows the connected chat branch and invalidates chat queries when the chat modal closes', async () => {
    mockCurrentProfile = {
      ...baseCurrentProfile,
      mutual_connections: [42],
    };
    mockChats = [{ id: 'chat-42', other_user_id: '42', unread_count: 2 }];

    renderModal();

    const chatButton = await screen.findByText('Continue your chat');
    fireEvent.click(chatButton.closest('ion-item') as HTMLElement);

    const chatCall = mockPresentModal.mock.calls.find(call => call[0] === 'TextModal');
    expect(chatCall?.[1]).toEqual(
      expect.objectContaining({
        textModalData: expect.objectContaining({ id: 'chat-42', other_user_id: '42' }),
        settingsAlt: false,
      })
    );

    await act(async () => {
      await chatCall?.[1]?.onDismiss();
    });

    expect(mockInvalidateQueries).toHaveBeenCalled();
  });

  it('shows the like-back branch and opens the like-back profile modal', async () => {
    mockIncomingStatus = { is_incoming: true };

    renderModal();

    const likeBack = await screen.findByText('Like Jordan back');
    fireEvent.click(likeBack.closest('ion-item') as HTMLElement);

    expect(mockPresentModal).toHaveBeenCalledWith(
      'ProfileModal',
      expect.objectContaining({
        profiletype: 'unconnected',
        cardData: mockProfileDetails,
        settingsAlt: false,
      })
    );
  });

  it('refreshes incoming-like queries when the like-back modal action dismisses', async () => {
    mockIncomingStatus = { is_incoming: true };

    renderModal();

    const likeBack = await screen.findByText('Like Jordan back');
    fireEvent.click(likeBack.closest('ion-item') as HTMLElement);

    const likeBackCall = mockPresentModal.mock.calls.find(call => call[0] === 'ProfileModal');
    expect(likeBackCall?.[1]).toEqual(
      expect.objectContaining({
        profiletype: 'unconnected',
        onActionDismiss: expect.any(Function),
      })
    );

    await act(async () => {
      await likeBackCall?.[1]?.onActionDismiss();
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['incoming-status', 42] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['incoming'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['incoming-paginated'] });
    expect(mockDismissModal).toHaveBeenCalled();
  });

  it('shows the community connect entry when both people can connect but no incoming like exists', async () => {
    renderModal();

    expect(await screen.findByText(/You both have Connect from Refreshments turned on!/)).toBeInTheDocument();
    expect(screen.getByAltText('Profile')).toHaveAttribute('src', '/img/new-primary.jpg');

    fireEvent.click(document.querySelector('.community-profile-profile-item') as HTMLElement);

    expect(mockPresentModal).toHaveBeenCalledWith(
      'ProfileModal',
      expect.objectContaining({
        profiletype: 'unconnected-nodismiss',
        cardData: mockProfileDetails,
        settingsAlt: false,
      })
    );
  });

  it('does not show the community connect entry after you already sent an outgoing like', async () => {
    mockCurrentProfile = {
      ...baseCurrentProfile,
      outgoing_connections: [42],
    };

    renderModal();

    expect(await screen.findByText('Please reply to jordan in the thread.')).toBeInTheDocument();
    expect(screen.queryByText(/You both have Connect from Refreshments turned on!/)).not.toBeInTheDocument();
    expect(screen.queryByText('Jordan')).not.toBeInTheDocument();
  });

  it('shows the restricted anonymous view without connect controls', async () => {
    renderModal({ isAnonymous: true });

    expect(await screen.findByText('Refresh member')).toBeInTheDocument();
    expect(screen.queryByText('Edit Refreshments profile')).not.toBeInTheDocument();
    expect(screen.queryByText(/You both have Connect from Refreshments turned on!/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Like Jordan back/)).not.toBeInTheDocument();
  });

  it('uses the grey Refreshments fallback when there is no community-facing photo', async () => {
    mockCommunityProfile = {
      ...baseCommunityData,
      display_photo: null,
      personal_photo: '/img/personal.jpg',
    };

    renderModal({ avatarUrl: null });

    const avatar = await screen.findByAltText('Refreshments profile');
    expect(avatar).toHaveAttribute('src', '../static/img/navynobordervector.png');
  });

  it('opens the action menu, enforces exact full community block confirmation, and shows the block types modal', async () => {
    renderModal();

    await screen.findByText('jordan');
    fireEvent.click(document.querySelector('.community-profile-ellipsis') as HTMLElement);

    const sheetConfig = mockPresentActionSheet.mock.calls[0][0];
    expect(sheetConfig.header).toContain(`Don't want to see any more of this member?`);

    sheetConfig.buttons.find((button: any) => button.text === `What's the difference?`).handler();
    expect(mockPresentModal).toHaveBeenCalledWith(
      'BlockTypesExplainedModal',
      expect.objectContaining({
        onDismiss: expect.any(Function),
      })
    );

    await act(async () => {
      await sheetConfig.buttons.find((button: any) => button.text === 'Full community block').handler();
    });

    const blockAlert = mockPresentAlert.mock.calls[0][0];
    expect(blockAlert.header).toBe('Full community block?');

    await act(async () => {
      await blockAlert.buttons[1].handler({ confirmation: 'nope' });
    });

    expect(mockPresentAlert).toHaveBeenCalledTimes(2);
    expect(mockPresentAlert.mock.calls[1][0].header).toBe('Block not confirmed.');
    expect(mockUpdateCommunityBlocked).not.toHaveBeenCalled();
  });

  it('runs the personal block flow from the action menu', async () => {
    renderModal();

    await screen.findByText('jordan');
    fireEvent.click(document.querySelector('.community-profile-ellipsis') as HTMLElement);

    const sheetConfig = mockPresentActionSheet.mock.calls[0][0];
    sheetConfig.buttons.find((button: any) => button.text === 'Personal block').handler();

    expect(mockBlockProfile).toHaveBeenCalledWith(42, expect.any(Function));
  });

  it('reports and blocks the member when the report modal dismisses after report-and-block', async () => {
    const { onDismiss } = renderModal();

    await screen.findByText('jordan');
    fireEvent.click(document.querySelector('.community-profile-ellipsis') as HTMLElement);

    const sheetConfig = mockPresentActionSheet.mock.calls[0][0];
    await act(async () => {
      await sheetConfig.buttons.find((button: any) => button.text === 'Report and block').handler();
    });

    const reportCall = mockPresentModal.mock.calls.find(call => call[0] === 'ReportModal');
    expect(reportCall?.[1]).toEqual(
      expect.objectContaining({
        onDismiss: expect.any(Function),
      })
    );

    await act(async () => {
      await reportCall?.[1]?.onDismiss('done', 'confirm');
    });

    expect(mockUpdateBlockedConnections).toHaveBeenCalledWith(42);
    expect(mockUpdateCommunityBlocked).toHaveBeenCalledWith(42);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('shows the viewer-settings guidance when the viewer has community connect turned off', async () => {
    mockCurrentProfile = {
      ...baseCurrentProfile,
      settings_community_profile: false,
      created_profile: false,
    };

    renderModal();

    expect(await screen.findByText(/Create an active personal profile and turn on your Connect from Refreshments/i)).toBeInTheDocument();
    expect(screen.queryByText(/You both have Connect from Refreshments turned on/i)).not.toBeInTheDocument();
  });
});
