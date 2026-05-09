import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const {
  authorSidenoteComment,
  editComment,
  invalidateQueries,
  likeComment,
  mockPresentModal,
  mockDismissModal,
  mockPresentAlert,
  removeComment,
  sidenoteComment,
  unlikeComment,
  communityProfilePresent,
  mockGetAvatarDisplay,
  mockPush,
  openExternalUrl,
} = vi.hoisted(() => ({
  authorSidenoteComment: vi.fn(),
  editComment: vi.fn(),
  invalidateQueries: vi.fn(),
  likeComment: vi.fn(),
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  mockPresentAlert: vi.fn(),
  removeComment: vi.fn(),
  sidenoteComment: vi.fn(),
  unlikeComment: vi.fn(),
  communityProfilePresent: vi.fn(),
  mockGetAvatarDisplay: vi.fn(({ profileImage, viewerConnect, authorConnect, allowDefaultConnectBorder }: any) => {
    const hasImage = Boolean(profileImage);
    const showConnectBorder = Boolean(viewerConnect && authorConnect && (hasImage || allowDefaultConnectBorder));
    return {
      className: showConnectBorder ? `connect-avatar${hasImage ? '' : ' refresh-avatar'}` : hasImage ? 'community-avatar' : 'refresh-avatar',
      src: profileImage ?? '../static/img/navynobordervector.png',
      hasImage,
      showConnectBorder,
    };
  }),
  mockPush: vi.fn(),
  openExternalUrl: vi.fn(),
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');

  return {
    ...actual,
    useIonModal: () => [mockPresentModal, mockDismissModal],
    useIonAlert: () => [mockPresentAlert, vi.fn()],
    useIonRouter: () => ({ push: mockPush }),
  };
});

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('../../hooks/utilities', () => ({
  authorSidenoteComment: (...args: any[]) => authorSidenoteComment(...args),
  editComment: (...args: any[]) => editComment(...args),
  getAvatarDisplay: (config: any) => mockGetAvatarDisplay(config),
  increaseStreak: vi.fn(),
  likeComment: (...args: any[]) => likeComment(...args),
  onImgError: vi.fn(),
  openExternalUrl: (...args: any[]) => openExternalUrl(...args),
  getInternalAppPath: vi.fn((url: string) => {
    if (!url) {
      return null;
    }
    if (url.startsWith('/')) {
      return url;
    }
    if (url.startsWith('https://refreshconnections.com/')) {
      return url.replace('https://refreshconnections.com', '');
    }
    return null;
  }),
  removeComment: (...args: any[]) => removeComment(...args),
  sidenoteComment: (...args: any[]) => sidenoteComment(...args),
  isPersonalPlus: vi.fn(() => false),
  unlikeComment: (...args: any[]) => unlikeComment(...args),
}));

vi.mock('../../hooks/useSheetModal', () => ({
  useSheetModal: () => [communityProfilePresent, vi.fn()],
}));

vi.mock('../../hooks/api/profiles/current-limits', () => ({
  useGetLimits: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/refreshments-current-profile', () => ({
  useGetRefreshmentsCurrentProfile: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/global-app-current-profile', () => ({
  useGetGlobalAppCurrentProfile: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/settings-current-profile', () => ({
  useGetSettingsCurrentProfile: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/outgoing-connections', () => ({
  useGetOutgoingConnections: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/mutual-connections', () => ({
  useGetMutualConnections: vi.fn(),
}));

vi.mock('../../hooks/api/refreshments/individual-comment', () => ({
  useGetIndividualComment: vi.fn(),
}));

vi.mock('../../hooks/api/refreshments/individual-comment-dynamic', () => ({
  useGetDynamicIndividualComment: vi.fn(),
}));

vi.mock('../../hooks/api/refreshments/individual-comment-static', () => ({
  useGetStaticIndividualComment: vi.fn(),
}));

vi.mock('./CommentReplies', () => ({
  default: () => <div>comment-replies</div>,
}));

vi.mock('../ReportModal', () => ({
  default: () => <div>report-modal</div>,
}));

vi.mock('../CommunityProfileModal', () => ({
  default: () => <div>community-profile-modal</div>,
}));

vi.mock('./ModerationNote', () => ({
  ModerationNote: () => null,
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');

  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries,
    }),
  };
});

import CommentItem from './CommentItem';
import { useGetLimits } from '../../hooks/api/profiles/current-limits';
import { useGetRefreshmentsCurrentProfile } from '../../hooks/api/profiles/refreshments-current-profile';
import { useGetGlobalAppCurrentProfile } from '../../hooks/api/profiles/global-app-current-profile';
import { useGetSettingsCurrentProfile } from '../../hooks/api/profiles/settings-current-profile';
import { useGetOutgoingConnections } from '../../hooks/api/profiles/outgoing-connections';
import { useGetMutualConnections } from '../../hooks/api/profiles/mutual-connections';

const mockLimits = vi.mocked(useGetLimits);
const mockRefreshmentsProfile = vi.mocked(useGetRefreshmentsCurrentProfile);
const mockGlobalProfile = vi.mocked(useGetGlobalAppCurrentProfile);
const mockSettingsProfile = vi.mocked(useGetSettingsCurrentProfile);
const mockOutgoingConnections = vi.mocked(useGetOutgoingConnections);
const mockMutualConnections = vi.mocked(useGetMutualConnections);

const setReplyTo = vi.fn();
const onLikeUnlike = vi.fn();

const baseComment = {
  id: 10,
  announcement: 42,
  user: 7,
  username: 'alex',
  profile_image: null,
  settings_community_profile: true,
  approved: true,
  removed: false,
  removed_reason: null,
  sidenoted: false,
  text: 'Original comment text',
  original_text: '',
  edited_at: '',
  uploadDateTime: new Date(Date.now() - 60_000).toISOString(),
  like_count: 0,
  reply_count: 0,
  moderation_note: '',
  moderation_note_longer: '',
  moderation_icon_only: false,
  post_author: 99,
};

const renderComment = (
  commentOverrides: Record<string, any> = {},
  propOverrides: Partial<React.ComponentProps<typeof CommentItem>> = {}
) => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <CommentItem
        comment={{ ...baseComment, ...commentOverrides }}
        showSidenotes={false}
        setReplyTo={setReplyTo}
        isAReply={false}
        onLikeUnlike={onLikeUnlike}
        forceShowReplies={false}
        {...propOverrides}
      />
    </QueryClientProvider>
  );
};

const getReactProps = (el: HTMLElement) => {
  const key = Object.keys(el).find((entry) => entry.startsWith('__reactProps'));
  return key ? (el as any)[key] : undefined;
};

const clickIonicElement = async (el: HTMLElement) => {
  fireEvent.click(el);
  const onClick = getReactProps(el)?.onClick;
  if (typeof onClick === 'function') {
    await act(async () => {
      await onClick({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      });
    });
  }
};

const updateTextControl = async (el: HTMLElement, value: string) => {
  fireEvent(el, new CustomEvent('ionInput', { detail: { value }, bubbles: true }));
  fireEvent.input(el, { target: { value } });
  fireEvent.change(el, { target: { value } });
  const onIonInput = getReactProps(el)?.onIonInput;
  if (typeof onIonInput === 'function') {
    await act(async () => {
      await onIonInput({ detail: { value } });
    });
  }
};

beforeEach(() => {
  vi.clearAllMocks();

  authorSidenoteComment.mockResolvedValue(undefined);
  editComment.mockResolvedValue(undefined);
  likeComment.mockResolvedValue(undefined);
  removeComment.mockResolvedValue(undefined);
  sidenoteComment.mockResolvedValue(undefined);
  unlikeComment.mockResolvedValue(undefined);

  Object.defineProperty(window.HTMLElement.prototype, 'closeOpened', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(window.HTMLElement.prototype, 'close', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });

  mockLimits.mockReturnValue({ data: { comments_removed: 0 } } as any);
  mockRefreshmentsProfile.mockReturnValue({
    data: { comment_likes: [], reported_comments: [], comment_sidenotes: [] },
    isLoading: false,
  } as any);
  mockGlobalProfile.mockReturnValue({
    data: { user: 7 },
    isLoading: false,
  } as any);
  mockSettingsProfile.mockReturnValue({
    data: { settings_community_profile: true },
    isLoading: false,
  } as any);
  mockOutgoingConnections.mockReturnValue({ data: [] } as any);
  mockMutualConnections.mockReturnValue({ data: [] } as any);
});

describe('CommentItem avatar display', () => {
  it('uses the connect avatar class for connected comments with the default image', () => {
    const { container } = renderComment({
      profile_image: null,
      settings_community_profile: true,
    });

    expect(container.querySelector('ion-avatar.connect-avatar')).toBeTruthy();
    expect(container.querySelector('ion-avatar.refresh-avatar')).toBeTruthy();
    expect(mockGetAvatarDisplay).toHaveBeenCalledWith(expect.objectContaining({
      profileImage: null,
      viewerConnect: true,
      authorConnect: true,
      allowDefaultConnectBorder: true,
    }));
  });

  it('does not add the default connect border for anonymous comments', () => {
    const { container } = renderComment({
      username: null,
      user: null,
      profile_image: null,
      settings_community_profile: true,
    });

    expect(container.querySelector('ion-avatar.refresh-avatar')).toBeTruthy();
    expect(container.querySelector('ion-avatar.connect-avatar')).toBeNull();
    expect(mockGetAvatarDisplay).toHaveBeenCalledWith(expect.objectContaining({
      allowDefaultConnectBorder: false,
    }));
  });
});

describe('CommentItem editing', () => {
  it('enters edit mode and saves an updated comment', async () => {
    const { container } = renderComment();

    const editButton = container.querySelector('ion-button[aria-label="Edit comment"]') as HTMLElement;
    expect(editButton).toBeTruthy();
    await clickIonicElement(editButton);

    const textarea = await waitFor(() =>
      container.querySelector(
        '.comment-edit-inline ion-textarea, .comment-edit-inline textarea'
      ) as HTMLElement | null
    );
    expect(textarea).toBeTruthy();
    await updateTextControl(textarea!, 'Updated comment text');

    const saveButton = container.querySelector('ion-button[aria-label="Save comment"]') as HTMLElement;
    expect(saveButton).toBeTruthy();
    await clickIonicElement(saveButton);

    await waitFor(() => {
      expect(editComment).toHaveBeenCalledWith(10, 'Updated comment text');
    });

    expect(await screen.findByText('Updated comment text')).toBeInTheDocument();
    expect(screen.getByText('edited')).toBeInTheDocument();
    expect(invalidateQueries).toHaveBeenCalledTimes(2);
  });

  it('cancels editing and restores the current comment text', async () => {
    const { container } = renderComment();

    await clickIonicElement(
      container.querySelector('ion-button[aria-label="Edit comment"]') as HTMLElement
    );

    const textarea = await waitFor(() =>
      container.querySelector(
        '.comment-edit-inline ion-textarea, .comment-edit-inline textarea'
      ) as HTMLElement | null
    );
    await updateTextControl(textarea!, 'Draft change');
    await clickIonicElement(
      container.querySelector('ion-button[aria-label="Cancel edit"]') as HTMLElement
    );

    expect(screen.getByText('Original comment text')).toBeInTheDocument();
    expect(container.querySelector('ion-textarea[aria-label="Edit comment text"]')).toBeNull();
  });

  it('does not save a blank edited comment', async () => {
    const { container } = renderComment();

    await clickIonicElement(
      container.querySelector('ion-button[aria-label="Edit comment"]') as HTMLElement
    );

    const textarea = await waitFor(() =>
      container.querySelector(
        '.comment-edit-inline ion-textarea, .comment-edit-inline textarea'
      ) as HTMLElement | null
    );
    await updateTextControl(textarea!, '   ');
    await clickIonicElement(
      container.querySelector('ion-button[aria-label="Save comment"]') as HTMLElement
    );

    await waitFor(() => {
      expect(editComment).not.toHaveBeenCalled();
    });
    expect(container.querySelector('.comment-edit-inline')).not.toBeNull();
  });
});

describe('CommentItem visibility states', () => {
  it('renders a sidenoted comment when sidenotes are explicitly shown', () => {
    renderComment(
      {
        sidenoted: true,
        text: 'This got moved aside',
      },
      {
        showSidenotes: true,
      }
    );

    expect(screen.getByText('This comment has been sidenoted.')).toBeInTheDocument();
    expect(screen.getByText('This got moved aside')).toBeInTheDocument();
  });

  it('lets the owner view the sidenote explanation for their own sidenoted comment', async () => {
    const { container } = renderComment(
      {
        sidenoted: true,
        text: 'This got moved aside',
      },
      {
        showSidenotes: true,
      }
    );

    const infoButton = container.querySelector('.ion-align-items-center ion-button') as HTMLElement;
    expect(infoButton).toBeTruthy();

    await clickIonicElement(infoButton);

    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        header: 'Comment has been sidenoted',
      })
    );
  });

  it('shows an owner their moderator-removed comment and reason without needing showSidenotes', async () => {
    renderComment({
      removed: true,
      removed_reason: 'Off-topic for this thread',
      text: 'Removed comment text',
    });

    expect(screen.getByText('Your removed comments are only visible to you.')).toBeInTheDocument();
    expect(screen.getByText('Removal reason: Off-topic for this thread')).toBeInTheDocument();

    const showButton = screen.getByText('Show removed comment');
    await act(async () => { fireEvent.click(showButton); });
    expect(screen.getByText('Removed comment text')).toBeInTheDocument();
  });

  it('hides an owners self-removed comment when there is no moderator reason', () => {
    renderComment({
      removed: true,
      removed_reason: null,
      text: 'Self removed comment text',
    });

    expect(screen.queryByText('Self removed comment text')).not.toBeInTheDocument();
    expect(screen.queryByText('Your removed comments are only visible to you.')).not.toBeInTheDocument();
  });

  it('hides a removed comment from other viewers', () => {
    mockGlobalProfile.mockReturnValue({
      data: { user: 99 },
      isLoading: false,
    } as any);

    renderComment({
      removed: true,
      removed_reason: 'Off-topic for this thread',
      text: 'Removed comment text',
    });

    expect(screen.queryByText('Removed comment text')).not.toBeInTheDocument();
    expect(screen.queryByText('This comment has been removed.')).not.toBeInTheDocument();
  });

  it('shows removed-comment placeholders to non-owners when sidenotes are enabled', () => {
    mockGlobalProfile.mockReturnValue({
      data: { user: 99 },
      isLoading: false,
    } as any);

    renderComment(
      {
        removed: true,
        removed_reason: 'Off-topic for this thread',
        text: 'Removed comment text',
      },
      {
        showSidenotes: true,
      }
    );

    expect(screen.getByText('This comment has been removed.')).toBeInTheDocument();
    expect(screen.getByText('Removal reason: Off-topic for this thread')).toBeInTheDocument();
    expect(screen.queryByText('Removed comment text')).not.toBeInTheDocument();
  });

  it('hides a comment the viewer has already reported', () => {
    mockRefreshmentsProfile.mockReturnValue({
      data: { comment_likes: [], reported_comments: [10], comment_sidenotes: [] },
      isLoading: false,
    } as any);

    renderComment();

    expect(screen.queryByText('Original comment text')).not.toBeInTheDocument();
  });

  it('shows the replies region when replies exist', () => {
    renderComment({
      reply_count: 2,
    });

    expect(screen.getByText('comment-replies')).toBeInTheDocument();
    expect(screen.getByText('2 replies')).toBeInTheDocument();
  });
});

describe('CommentItem interactions', () => {
  it('likes and then unlikes a comment', async () => {
    const { container } = renderComment();

    const buttons = container.querySelectorAll('ion-button');
    const heartButton = buttons[1] as HTMLElement;
    await clickIonicElement(heartButton);

    await waitFor(() => {
      expect(likeComment).toHaveBeenCalledWith(10);
    });
    expect(onLikeUnlike).toHaveBeenCalledWith(10);

    const unlikeButton = container.querySelectorAll('ion-button')[1] as HTMLElement;
    await clickIonicElement(unlikeButton);

    await waitFor(() => {
      expect(unlikeComment).toHaveBeenCalledWith(10);
    });
  });

  it('opens the community profile sheet when clicking a visible author name', async () => {
    renderComment();

    await clickIonicElement(screen.getByText('alex'));

    expect(communityProfilePresent).toHaveBeenCalledWith({ cssClass: 'community-profile-modal' });
  });

  it('sets reply target when the reply action is clicked', async () => {
    const { container } = renderComment();

    const replyButtons = Array.from(container.querySelectorAll('ion-button')).filter((button) =>
      !button.getAttribute('aria-label')
    );
    await clickIonicElement(replyButtons[0] as HTMLElement);

    expect(setReplyTo).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));
  });

  it('opens the original comment modal from the edited label', async () => {
    renderComment({
      original_text: 'First draft',
      edited_at: new Date().toISOString(),
      text: 'Updated text',
    });

    await clickIonicElement(screen.getByText('edited').closest('ion-button') as HTMLElement);

    expect(mockPresentModal).toHaveBeenCalledWith(
      expect.objectContaining({
        cssClass: 'comment-original-modal',
      })
    );
  });

  it('opens the report modal for non-owner comments', async () => {
    mockGlobalProfile.mockReturnValue({
      data: { user: 99 },
      isLoading: false,
    } as any);
    const { container } = renderComment();

    const reportButtons = container.querySelectorAll('ion-item-options ion-button');
    await clickIonicElement(reportButtons[0] as HTMLElement);

    expect(mockPresentModal).toHaveBeenCalled();
  });

  it('shows the sidenote confirmation alert for non-owner comments', async () => {
    mockGlobalProfile.mockReturnValue({
      data: { user: 99 },
      isLoading: false,
    } as any);
    const { container } = renderComment();

    const actionButtons = container.querySelectorAll('ion-item-options ion-button');
    await clickIonicElement(actionButtons[1] as HTMLElement);

    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        header: 'Is this comment off-topic?',
      })
    );
  });

  it('submits a sidenote report for non-owner comments after confirmation', async () => {
    mockGlobalProfile.mockReturnValue({
      data: { user: 99 },
      isLoading: false,
    } as any);
    const { container } = renderComment({
      post_author: 123,
    });

    const actionButtons = container.querySelectorAll('ion-item-options ion-button');
    await clickIonicElement(actionButtons[1] as HTMLElement);

    const alertConfig = mockPresentAlert.mock.calls.at(-1)?.[0];
    await act(async () => {
      await alertConfig.buttons[1].handler();
    });

    await waitFor(() => {
      expect(sidenoteComment).toHaveBeenCalledWith(10);
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['refreshments-current'] });
    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        header: 'Thank you!',
      })
    );
  });

  it('immediately hides an off-topic comment when the post author confirms a sidenote', async () => {
    mockGlobalProfile.mockReturnValue({
      data: { user: 99 },
      isLoading: false,
    } as any);
    const { container } = renderComment({
      post_author: 99,
    });

    const actionButtons = container.querySelectorAll('ion-item-options ion-button');
    await clickIonicElement(actionButtons[1] as HTMLElement);

    const alertConfig = mockPresentAlert.mock.calls[0][0];
    await act(async () => {
      await alertConfig.buttons[1].handler();
    });

    expect(authorSidenoteComment).toHaveBeenCalledWith(10);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['top-comments', 42],
      exact: false,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['posts', 'comment', 10] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['refreshments-current'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['notshown', 42] });
  });

  it('shows the remove-comment confirmation for a recently posted owner comment', async () => {
    const { container } = renderComment();

    const actionButtons = container.querySelectorAll('ion-item-options ion-button');
    await clickIonicElement(actionButtons[actionButtons.length - 1] as HTMLElement);

    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        header: 'Do you want to remove the comment you just posted?',
      })
    );
  });

  it('removes an owners recent comment after confirmation and invalidates the relevant queries', async () => {
    const { container } = renderComment();

    const actionButtons = container.querySelectorAll('ion-item-options ion-button');
    await clickIonicElement(actionButtons[actionButtons.length - 1] as HTMLElement);

    const alertConfig = mockPresentAlert.mock.calls[0][0];
    await act(async () => {
      await alertConfig.buttons[1].handler();
    });

    expect(removeComment).toHaveBeenCalledWith(10);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['posts', 'comment', 10] });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['top-comments', 42],
      exact: false,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['notshown', 42] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['limits'] });
  });

  it('does not open the profile sheet for anonymous comments', async () => {
    renderComment({
      username: null,
      user: null,
      settings_community_profile: false,
    });

    await clickIonicElement(screen.getByText('Anonymous'));

    expect(communityProfilePresent).not.toHaveBeenCalled();
  });

  it('routes internal links in comment text in-app', async () => {
    renderComment({
      text: 'See https://refreshconnections.com/community/123 for context',
    });

    fireEvent.click(await screen.findByText('https://refreshconnections.com/community/123'));

    expect(mockPush).toHaveBeenCalledWith('/community/123');
    expect(openExternalUrl).not.toHaveBeenCalled();
  });
});
