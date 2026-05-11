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
let mockCurrentCommunityProfile: any;

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
  useGetCommunityProfile: (userId?: number | null | 'current') => ({
    data: userId == null || userId === 'current'
      ? (mockCurrentCommunityProfile ?? mockCommunityProfile)
      : mockCommunityProfile,
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
    mockCurrentCommunityProfile = null;
    mockUpdateBlockedConnections.mockResolvedValue(undefined);
    mockUpdateCommunityBlocked.mockResolvedValue(undefined);
    mockRemoveCommunityBlocked.mockResolvedValue(undefined);
  });

  it('shows the self preview branch with connect-from-refreshments note and personal profile card', async () => {
    mockCurrentProfile = { ...baseCurrentProfile, user: 42, username: 'self-alex', settings_community_profile: true, name: 'Alex' };

    renderModal({ userId: 42, selfPreview: true });

    expect(await screen.findByText(/If the other member also has Connect from Refreshments on/)).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.queryByText('Edit Refreshments Profile')).not.toBeInTheDocument();
  });

  it('shows the self edit branch without the preview explanation outside the self preview', async () => {
    mockCurrentProfile = { ...baseCurrentProfile, user: 42, username: 'self-alex', settings_community_profile: true, name: 'Alex' };

    renderModal({ userId: 42 });

    expect(await screen.findByText('This is you!')).toBeInTheDocument();
    expect(screen.getByText('Edit your Refreshments Profile')).toBeInTheDocument();
    expect(screen.queryByText(/If the other member also has Connect from Refreshments on/)).not.toBeInTheDocument();
  });

  it('opens the edit refreshments profile modal with its styling class from the self edit branch', async () => {
    mockCurrentProfile = { ...baseCurrentProfile, user: 42, username: 'self-alex', settings_community_profile: true, name: 'Alex' };

    renderModal({ userId: 42 });

    fireEvent.click(await screen.findByText('Edit your Refreshments Profile'));

    expect(mockPresentModal).toHaveBeenCalledWith(
      'EditCommunityProfileModal',
      expect.any(Object),
      expect.objectContaining({ cssClass: 'edit-community-profile-modal' })
    );
  });

  it('shows the self edit branch even when connect from refreshments is off outside the self preview', async () => {
    mockCurrentProfile = { ...baseCurrentProfile, user: 42, username: 'self-alex', settings_community_profile: false };

    renderModal({ userId: 42 });

    expect(await screen.findByText('This is you!')).toBeInTheDocument();
    expect(screen.queryByText(/If the other member also has Connect from Refreshments on/)).not.toBeInTheDocument();
    expect(screen.getByText('Edit your Refreshments Profile')).toBeInTheDocument();
  });

  it('uses ordered personal photos for the self refreshments preview when personal photo is enabled', async () => {
    mockCurrentProfile = {
      ...baseCurrentProfile,
      user: 42,
      username: 'self-alex',
      pic1_main: '/img/old-primary.jpg',
      pic2: '/img/new-primary.jpg',
      photo_order: ['pic2', 'pic1_main'],
    };
    mockCommunityProfile = {
      ...baseCommunityData,
      use_personal_profile_picture: true,
      community_profile_pic: null,
      display_photo: '/img/backend-stale-primary.jpg',
    };

    renderModal({ userId: 42 });

    const avatar = await screen.findByAltText('Refreshments Profile');
    expect(avatar).toHaveAttribute('src', '/img/new-primary.jpg');
  });

  it('does not use a personal photo for the self refreshments preview when personal photo is disabled', async () => {
    mockCurrentProfile = {
      ...baseCurrentProfile,
      user: 42,
      username: 'self-alex',
      pic1_main: '/img/old-primary.jpg',
      pic2: '/img/new-primary.jpg',
      photo_order: ['pic2', 'pic1_main'],
    };
    mockCommunityProfile = {
      ...baseCommunityData,
      use_personal_profile_picture: false,
      community_profile_pic: null,
      display_photo: '/img/backend-stale-personal.jpg',
    };

    renderModal({ userId: 42 });

    const avatar = await screen.findByAltText('Refreshments Profile');
    expect(avatar).toHaveAttribute('src', '../static/img/navynobordervector.png');
  });

  it('uses the current community profile setting for self preview when the public profile data is stale', async () => {
    mockCurrentProfile = {
      ...baseCurrentProfile,
      user: 42,
      username: 'self-alex',
      pic1_main: '/img/old-primary.jpg',
      pic2: '/img/new-primary.jpg',
      photo_order: ['pic2', 'pic1_main'],
    };
    mockCommunityProfile = {
      ...baseCommunityData,
      display_photo: '/img/backend-stale-personal.jpg',
    };
    mockCurrentCommunityProfile = {
      ...baseCommunityData,
      use_personal_profile_picture: false,
      community_profile_pic: null,
      display_photo: '/img/backend-stale-personal.jpg',
    };

    renderModal({ userId: 42, selfPreview: true });

    const avatar = await screen.findByAltText('Refreshments Profile');
    expect(avatar).toHaveAttribute('src', '../static/img/navynobordervector.png');
    expect(avatar).toHaveStyle({ filter: 'grayscale(1)' });
    expect(avatar.parentElement).toHaveStyle({ border: '2px solid var(--ion-color-primary)' });
  });

  it('preserves the comment default avatar instead of falling back to a stale display photo', async () => {
    mockCommunityProfile = {
      ...baseCommunityData,
      display_photo: '/img/stale-personal-from-public-profile.jpg',
      connect_enabled: true,
    };

    renderModal({ userId: 42, avatarUrl: null });

    const avatar = await screen.findByAltText('Refreshments Profile');
    expect(avatar).toHaveAttribute('src', '../static/img/navynobordervector.png');
    expect(avatar).toHaveStyle({ filter: 'grayscale(1)' });
    expect(avatar.parentElement).toHaveStyle({ border: '2px solid var(--ion-color-primary)' });
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

    const avatar = await screen.findByAltText('Refreshments Profile');
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
    expect(screen.queryByText('Edit Refreshments Profile')).not.toBeInTheDocument();
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

    const avatar = await screen.findByAltText('Refreshments Profile');
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

    expect(await screen.findByText(/Create an active Personal Profile and turn on your Connect from Refreshments/i)).toBeInTheDocument();
    expect(screen.queryByText(/You both have Connect from Refreshments turned on/i)).not.toBeInTheDocument();
  });

  it('shows the thread reply prompt when the other user has connect from refreshments off', async () => {
    mockCommunityProfile = { ...baseCommunityData, connect_enabled: false };

    renderModal();

    expect(await screen.findByText('Please reply to jordan in the thread.')).toBeInTheDocument();
    expect(screen.queryByText(/You both have Connect from Refreshments turned on/i)).not.toBeInTheDocument();
  });

  it('shows no connect options when the viewer has been personally blocked by the target', async () => {
    mockCurrentProfile = {
      ...baseCurrentProfile,
      blocked_by: [42],
    };

    renderModal();

    await screen.findByText('jordan');
    expect(screen.queryByText(/You both have Connect from Refreshments turned on/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Like.*back/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Continue your chat')).not.toBeInTheDocument();
  });

  it('shows no connect options when the viewer has personally blocked the target', async () => {
    mockCurrentProfile = {
      ...baseCurrentProfile,
      blocked_connections: [42],
    };

    renderModal();

    await screen.findByText('jordan');
    expect(screen.queryByText(/You both have Connect from Refreshments turned on/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Like.*back/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Continue your chat')).not.toBeInTheDocument();
  });

  it('shows the thread reply prompt when the connection has been unmatched', async () => {
    mockCurrentProfile = {
      ...baseCurrentProfile,
      unmatched_connections: [42],
    };

    renderModal();

    expect(await screen.findByText('Please reply to jordan in the thread.')).toBeInTheDocument();
    expect(screen.queryByText(/You both have Connect from Refreshments turned on/i)).not.toBeInTheDocument();
  });

  it('shows the restricted view when the target profile is deactivated', async () => {
    mockProfileDetails = { ...baseProfileDetails, deactivated_profile: true };

    renderModal();

    expect(await screen.findByText('Refresh member')).toBeInTheDocument();
    expect(screen.queryByText(/You both have Connect from Refreshments turned on/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Like.*back/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Edit your Refreshments Profile')).not.toBeInTheDocument();
  });

  it('omits the personal block button from the action menu when the viewer has already blocked the target', async () => {
    mockCurrentProfile = {
      ...baseCurrentProfile,
      blocked_connections: [42],
    };

    renderModal();

    await screen.findByText('jordan');
    fireEvent.click(document.querySelector('.community-profile-ellipsis') as HTMLElement);

    const sheetConfig = mockPresentActionSheet.mock.calls[0][0];
    const buttonTexts = sheetConfig.buttons.map((b: any) => b.text);
    expect(buttonTexts).not.toContain('Personal block');
    expect(buttonTexts).toContain('Full community block');
  });

  it('omits the full community block button from the action menu when the viewer has already community blocked the target', async () => {
    mockCurrentProfile = {
      ...baseCurrentProfile,
      community_blocked: [42],
    };

    renderModal();

    await screen.findByText('jordan');
    fireEvent.click(document.querySelector('.community-profile-ellipsis') as HTMLElement);

    const sheetConfig = mockPresentActionSheet.mock.calls[0][0];
    const buttonTexts = sheetConfig.buttons.map((b: any) => b.text);
    expect(buttonTexts).not.toContain('Full community block');
    expect(buttonTexts).toContain('Personal block');
  });

  it('shows start chat label when connected but no existing chat exists', async () => {
    mockCurrentProfile = {
      ...baseCurrentProfile,
      mutual_connections: [42],
    };
    mockChats = [];

    renderModal();

    expect(await screen.findByText('Start your chat with them')).toBeInTheDocument();
  });

  it('still shows the chat option when connected and the other user is paused', async () => {
    mockCurrentProfile = {
      ...baseCurrentProfile,
      mutual_connections: [42],
    };
    mockProfileDetails = { ...baseProfileDetails, paused_profile: true };
    mockChats = [{ id: 'chat-42', other_user_id: '42', unread_count: 0 }];

    renderModal();

    expect(await screen.findByText('Continue your chat')).toBeInTheDocument();
  });
});
