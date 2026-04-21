import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp } from '@ionic/react';

const {
  routerPush,
  routerGoBack,
  routerCanGoBack,
  addComment,
  addToHiddenAuthors,
  addToHiddenPosts,
  containsPii,
  increaseStreak,
  likeAnnouncement,
  unlikeAnnouncement,
  openExternalUrl,
  mockPresentAlert,
  mockPresentModal,
  mockDismissModal,
  communityProfilePresent,
  invalidateQueries,
  mockGetShowInterestedCountPref,
  mockGetHideInterestedCountOnMySubmissionsPref,
} = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routerGoBack: vi.fn(),
  routerCanGoBack: vi.fn(() => true),
  addComment: vi.fn(),
  addToHiddenAuthors: vi.fn(),
  addToHiddenPosts: vi.fn(),
  containsPii: vi.fn(() => false),
  increaseStreak: vi.fn(),
  likeAnnouncement: vi.fn(),
  unlikeAnnouncement: vi.fn(),
  openExternalUrl: vi.fn(),
  mockPresentAlert: vi.fn(),
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  communityProfilePresent: vi.fn(),
  invalidateQueries: vi.fn(),
  mockGetShowInterestedCountPref: vi.fn(),
  mockGetHideInterestedCountOnMySubmissionsPref: vi.fn(),
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');

  return {
    ...actual,
    useIonAlert: () => [mockPresentAlert, vi.fn()],
    useIonModal: () => [mockPresentModal, mockDismissModal],
    useIonRouter: () => ({
      push: routerPush,
      goBack: routerGoBack,
      canGoBack: routerCanGoBack,
    }),
  };
});

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '42' }),
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: (...args: any[]) => invalidateQueries(...args),
      setQueryData: vi.fn(),
    }),
  };
});

vi.mock('../../hooks/useSheetModal', () => ({
  useSheetModal: () => [communityProfilePresent, vi.fn()],
}));

vi.mock('../../hooks/utilities', () => ({
  addComment: (...args: any[]) => addComment(...args),
  addCommentReply: vi.fn(),
  addToHiddenAuthors: (...args: any[]) => addToHiddenAuthors(...args),
  addToHiddenPosts: (...args: any[]) => addToHiddenPosts(...args),
  containsPii,
  getAvatarDisplay: vi.fn(() => ({
    src: '/avatar.png',
    hasImage: true,
    className: 'avatar',
  })),
  increaseStreak: (...args: any[]) => increaseStreak(...args),
  isCommunityPlus: vi.fn((level?: string) => level === 'communityplus' || level === 'pro'),
  likeAnnouncement: (...args: any[]) => likeAnnouncement(...args),
  onImgError: vi.fn(),
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
  openExternalUrl: (...args: any[]) => openExternalUrl(...args),
  unlikeAnnouncement: (...args: any[]) => unlikeAnnouncement(...args),
}));

vi.mock('../../hooks/api/refreshments/comments-not-shown', () => ({
  useGetCommentsNotShownCount: vi.fn(),
}));

vi.mock('../../hooks/api/refreshments/comments', () => ({
  useGetComments: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/refreshments-current-profile', () => ({
  useGetRefreshmentsCurrentProfile: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/settings-current-profile', () => ({
  useGetSettingsCurrentProfile: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/global-app-current-profile', () => ({
  useGetGlobalAppCurrentProfile: vi.fn(),
}));

vi.mock('../../hooks/api/refreshments/static-post-content', () => ({
  useGetStaticPostContent: vi.fn(),
}));

vi.mock('../../hooks/api/refreshments/dynamic-post-content', () => ({
  useGetDynamicPostContent: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/outgoing-connections', () => ({
  useGetOutgoingConnections: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/mutual-connections', () => ({
  useGetMutualConnections: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/current-moderation', () => ({
  useGetCurrentModeration: vi.fn(),
}));

vi.mock('./Comments', () => ({
  default: () => <div>comments-list</div>,
}));

vi.mock('../ReportModal', () => ({
  default: () => <div>report-modal</div>,
}));

vi.mock('../CommunityProfileModal', () => ({
  default: () => <div>community-profile-modal</div>,
}));

vi.mock('./Polls/Poll', () => ({
  default: () => <div>poll</div>,
}));

vi.mock('../ContactDetailsPopover', () => ({
  default: () => <div>contact-details-popover</div>,
}));

vi.mock('../../hooks/capacitorPreferences/interested-counts', () => ({
  getShowInterestedCountPref: (...args: any[]) => mockGetShowInterestedCountPref(...args),
  getHideInterestedCountOnMySubmissionsPref: (...args: any[]) => mockGetHideInterestedCountOnMySubmissionsPref(...args),
  SHOW_INTERESTED_COUNT_CHANGED_EVENT: 'show_interested_count_changed',
  HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_CHANGED_EVENT: 'hide_interested_count_on_my_submissions_changed',
}));

import OpenedPost from './OpenedPost';
import { useGetCommentsNotShownCount } from '../../hooks/api/refreshments/comments-not-shown';
import { useGetComments } from '../../hooks/api/refreshments/comments';
import { useGetRefreshmentsCurrentProfile } from '../../hooks/api/profiles/refreshments-current-profile';
import { useGetSettingsCurrentProfile } from '../../hooks/api/profiles/settings-current-profile';
import { useGetGlobalAppCurrentProfile } from '../../hooks/api/profiles/global-app-current-profile';
import { useGetStaticPostContent } from '../../hooks/api/refreshments/static-post-content';
import { useGetDynamicPostContent } from '../../hooks/api/refreshments/dynamic-post-content';
import { useGetOutgoingConnections } from '../../hooks/api/profiles/outgoing-connections';
import { useGetMutualConnections } from '../../hooks/api/profiles/mutual-connections';
import { useGetCurrentModeration } from '../../hooks/api/profiles/current-moderation';

const mockCommentsNotShownCount = vi.mocked(useGetCommentsNotShownCount);
const mockComments = vi.mocked(useGetComments);
const mockRefreshmentsProfile = vi.mocked(useGetRefreshmentsCurrentProfile);
const mockSettingsProfile = vi.mocked(useGetSettingsCurrentProfile);
const mockGlobalProfile = vi.mocked(useGetGlobalAppCurrentProfile);
const mockStaticPostContent = vi.mocked(useGetStaticPostContent);
const mockDynamicPostContent = vi.mocked(useGetDynamicPostContent);
const mockOutgoingConnections = vi.mocked(useGetOutgoingConnections);
const mockMutualConnections = vi.mocked(useGetMutualConnections);
const mockModeration = vi.mocked(useGetCurrentModeration);

const staticPost = {
  id: 42,
  title: 'Spring picnic',
  location: 'Brooklyn',
  local_only: false,
  coverPhoto: null,
  coverPhoto_alt: '',
  include_profile: true,
  byline: 'Morgan',
  username: 'morgan',
  user: 12,
  profile_image: null,
  settings_community_profile: true,
  uploadDate: 'Mar 28',
  sensitive: false,
  disclaimer: null,
  markdown: false,
  content: 'Bring snacks and a blanket.',
  poll: null,
  comment_instructions: null,
  comments_deactivated: false,
  closed: false,
  event: {
    name: 'Picnic meetup',
    start_datetime: '2099-04-10T17:30:00.000Z',
    end_datetime: '2099-04-10T19:00:00.000Z',
    location: 'Prospect Park',
    description: 'Come hang out.',
    external_link: 'https://example.com/event',
    anonymous: false,
    profile_image: null,
    settings_community_profile: true,
  },
};

const renderOpenedPost = () => {
  const queryClient = new QueryClient();

  return render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <OpenedPost />
      </QueryClientProvider>
    </IonApp>
  );
};

const ionInput = (el: HTMLElement, value: string) => {
  fireEvent(el, new CustomEvent('ionInput', { detail: { value }, bubbles: true }));
  fireEvent.input(el, { target: { value } });
  fireEvent.change(el, { target: { value } });
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();

  addComment.mockResolvedValue({ data: { comment_id: 777 } });
  addToHiddenAuthors.mockResolvedValue({});
  addToHiddenPosts.mockResolvedValue({});
  increaseStreak.mockResolvedValue(undefined);
  likeAnnouncement.mockResolvedValue({});
  unlikeAnnouncement.mockResolvedValue({});
  containsPii.mockReturnValue(false);

  mockCommentsNotShownCount.mockReturnValue({ data: 0 } as any);
  mockComments.mockReturnValue({ data: [], isPending: false } as any);
  mockRefreshmentsProfile.mockReturnValue({
    data: { likes: [], hidden_announcements: [], hidden_authors: [] },
    isLoading: false,
  } as any);
  mockSettingsProfile.mockReturnValue({
    data: { settings_alt_text: true, settings_community_profile: true },
    isLoading: false,
  } as any);
  mockGlobalProfile.mockReturnValue({
    data: { user: 9, username: 'alex', deactivated_profile: false, paused_profile: false, subscription_level: 'communityplus' },
    isLoading: false,
  } as any);
  mockGetShowInterestedCountPref.mockResolvedValue(true);
  mockGetHideInterestedCountOnMySubmissionsPref.mockResolvedValue(false);
  mockStaticPostContent.mockReturnValue({
    data: staticPost,
    isLoading: false,
  } as any);
  mockDynamicPostContent.mockReturnValue({
    data: { like_count: 0, comment_count: 2 },
  } as any);
  mockOutgoingConnections.mockReturnValue({ data: [] } as any);
  mockMutualConnections.mockReturnValue({ data: [] } as any);
  mockModeration.mockReturnValue({ data: { paused_on_creation: false } } as any);

  Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});

describe('OpenedPost', () => {
  it('renders event details and routes to the calendar date when selected', () => {
    const { container } = renderOpenedPost();

    expect(screen.getByText('Picnic meetup')).toBeInTheDocument();
    expect(screen.getByText('Apr 10, 5:30 PM – 7:00 PM')).toBeInTheDocument();
    expect(screen.getByText(/Prospect Park/)).toBeInTheDocument();

    fireEvent.click(container.querySelector('.opened-post-event') as HTMLElement);

    expect(routerPush).toHaveBeenCalledWith('/community?calendarDate=2099-04-10');
  });

  it('opens the external event link from the event card', async () => {
    renderOpenedPost();

    fireEvent.click(await screen.findByText('Learn more'));

    expect(openExternalUrl).toHaveBeenCalledWith('https://example.com/event');
  });

  it('routes internal markdown links inside the post body in-app', async () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...staticPost,
        markdown: true,
        content: '[Go to post](/community/123)',
      },
      isLoading: false,
    } as any);

    renderOpenedPost();

    fireEvent.click(await screen.findByText('Go to post'));

    expect(routerPush).toHaveBeenCalledWith('/community/123');
    expect(openExternalUrl).not.toHaveBeenCalled();
  });

  it('submits a new top-level comment and clears the composer', async () => {
    const { container } = renderOpenedPost();

    const textarea = container.querySelector('ion-textarea.comment-creator') as HTMLElement;
    expect(textarea).toBeTruthy();
    ionInput(textarea, 'Looking forward to it');

    const sendButton = container.querySelector('.send-button') as HTMLElement;
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(addComment).toHaveBeenCalledWith({
        announcement: '42',
        text: 'Looking forward to it',
      });
    });

    await waitFor(() => {
      expect(textarea.getAttribute('value')).toBeFalsy();
    });

    await waitFor(() => {
      expect(increaseStreak).toHaveBeenCalledTimes(1);
    }, { timeout: 1500 });
  });

  it('likes and then unlikes the post from the footer controls', async () => {
    const { container } = renderOpenedPost();

    const likeButtons = container.querySelectorAll('.post-likes ion-button');
    expect(likeButtons.length).toBeGreaterThan(0);

    fireEvent.click(likeButtons[0] as HTMLElement);

    await waitFor(() => {
      expect(likeAnnouncement).toHaveBeenCalledWith('42');
    });

    const likedCount = await screen.findByText('1');
    expect(likedCount).toBeInTheDocument();

    fireEvent.click(container.querySelector('.post-likes ion-button') as HTMLElement);

    await waitFor(() => {
      expect(unlikeAnnouncement).toHaveBeenCalledWith('42');
    });
  });

  it('shows the interested count on the opened post for Community+ users when more than three people are interested', () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...staticPost,
        interested_count: 5,
      },
      isLoading: false,
    } as any);

    renderOpenedPost();

    expect(screen.getByTestId('opened-post-interest-count')).toHaveTextContent('5');
  });

  it('hides the interested count on the opened post for non-premium users', () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...staticPost,
        interested_count: 5,
      },
      isLoading: false,
    } as any);
    mockGlobalProfile.mockReturnValue({
      data: { user: 9, username: 'alex', deactivated_profile: false, paused_profile: false, subscription_level: 'none' },
      isLoading: false,
    } as any);

    renderOpenedPost();

    expect(screen.queryByTestId('opened-post-interest-count')).not.toBeInTheDocument();
  });

  it('hides the interested count on your own submission when that local preference is on', async () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...staticPost,
        user: 9,
        interested_count: 5,
      },
      isLoading: false,
    } as any);
    mockGetHideInterestedCountOnMySubmissionsPref.mockResolvedValue(true);

    renderOpenedPost();

    await waitFor(() => {
      expect(screen.queryByTestId('opened-post-interest-count')).not.toBeInTheDocument();
    });
  });

  it('shows the hidden-comments alert when sidenoted comments exist', async () => {
    mockCommentsNotShownCount.mockReturnValue({ data: 2 } as any);

    renderOpenedPost();

    fireEvent.click(await screen.findByText(/Some comments are hidden/i));

    expect(mockPresentAlert).toHaveBeenCalledTimes(1);
    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        header: 'Some comments have been hidden to keep this thread on topic.',
      })
    );
  });

  it('blocks contact info in comments and shows the PII warning', async () => {
    containsPii.mockReturnValue(true);
    const { container } = renderOpenedPost();

    const textarea = container.querySelector('ion-textarea.comment-creator') as HTMLElement;
    ionInput(textarea, 'text me at 555-111-2222');

    expect(
      await screen.findByText('Comments cannot contain contact information like emails or phone numbers.')
    ).toBeInTheDocument();

    const sendButton = container.querySelector('.send-button') as HTMLButtonElement;
    expect(sendButton).toBeDisabled();
  });

  it('disables the composer and shows the closed-discussion placeholder when the post is closed', async () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...staticPost,
        closed: true,
      },
      isLoading: false,
    } as any);

    const { container } = renderOpenedPost();

    const textarea = container.querySelector('ion-textarea.comment-creator') as HTMLElement;
    expect(textarea).toHaveAttribute('placeholder', 'Discussion closed. Want to start a new one?');

    const sendButton = container.querySelector('.send-button') as HTMLButtonElement;
    expect(sendButton).toBeDisabled();
  });

  it('shows the review-needed placeholder when paused-on-creation moderation blocks commenting', async () => {
    mockGlobalProfile.mockReturnValue({
      data: { user: 9, username: 'alex', deactivated_profile: false, paused_profile: true },
      isLoading: false,
    } as any);
    mockModeration.mockReturnValue({ data: { paused_on_creation: true } } as any);

    const { container } = renderOpenedPost();

    const textarea = container.querySelector('ion-textarea.comment-creator') as HTMLElement;
    expect(textarea).toHaveAttribute('placeholder', 'Your account needs to be reviewed before you can comment.');

    const sendButton = container.querySelector('.send-button') as HTMLButtonElement;
    expect(sendButton).toBeDisabled();
  });

  it('links paused-on-creation moderation states to the activity page', async () => {
    mockGlobalProfile.mockReturnValue({
      data: { user: 9, username: 'alex', deactivated_profile: false, paused_profile: true },
      isLoading: false,
    } as any);
    mockModeration.mockReturnValue({ data: { paused_on_creation: true } } as any);

    renderOpenedPost();

    fireEvent.click(await screen.findByText('View Activity'));

    expect(routerPush).toHaveBeenCalledWith('/activity');
  });

  it('does not submit a comment when paused-on-creation moderation has disabled commenting', async () => {
    mockGlobalProfile.mockReturnValue({
      data: { user: 9, username: 'alex', deactivated_profile: false, paused_profile: true },
      isLoading: false,
    } as any);
    mockModeration.mockReturnValue({ data: { paused_on_creation: true } } as any);

    const { container } = renderOpenedPost();

    const textarea = container.querySelector('ion-textarea.comment-creator') as HTMLElement;
    ionInput(textarea, 'Trying to comment anyway');

    const sendButton = container.querySelector('.send-button') as HTMLButtonElement;
    expect(sendButton).toBeDisabled();

    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(addComment).not.toHaveBeenCalled();
      expect(increaseStreak).not.toHaveBeenCalled();
    });
  });

  it('hides the comments area entirely when comments are deactivated', () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...staticPost,
        comments_deactivated: true,
      },
      isLoading: false,
    } as any);

    const { container } = renderOpenedPost();

    expect(screen.queryByText('comments-list')).not.toBeInTheDocument();
    expect(container.querySelector('ion-footer.create-comment')).toBeNull();
  });

  it('shows onboarding CTA when the viewer has no community username', async () => {
    mockGlobalProfile.mockReturnValue({
      data: { user: 9, username: '', deactivated_profile: false, paused_profile: false },
      isLoading: false,
    } as any);

    renderOpenedPost();

    expect(
      await screen.findByText('Create a Refreshments profile to post a comment')
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Leave a comment')).not.toBeInTheDocument();
  });

  it('opens the community profile sheet from the author byline when the post is not anonymous', async () => {
    renderOpenedPost();

    fireEvent.click(await screen.findByText('by morgan'));

    expect(communityProfilePresent).toHaveBeenCalledWith({ cssClass: 'community-profile-modal' });
  });

  it('keeps disabled action-sheet hide handlers as no-ops', async () => {
    mockCommentsNotShownCount.mockReturnValue({ data: 0 } as any);
    mockGlobalProfile.mockReturnValue({
      data: { user: 12, username: 'alex', deactivated_profile: false, paused_profile: false },
      isLoading: false,
    } as any);
    mockRefreshmentsProfile.mockReturnValue({
      data: { likes: [], hidden_announcements: [42], hidden_authors: [] },
      isLoading: false,
    } as any);

    const { container } = renderOpenedPost();

    fireEvent.click(container.querySelector('ion-button[fill="clear"][size="small"]') as HTMLElement);

    const actionSheet = container.querySelector('ion-action-sheet') as any;
    const buttons = actionSheet.buttons as Array<any>;

    await buttons.find(button => button.text === 'Hide all posts by this author').handler();
    await buttons.find(button => button.text === 'Hide post').handler();
    await buttons.find(button => button.text === 'Show sidenotes').handler();

    expect(addToHiddenAuthors).not.toHaveBeenCalled();
    expect(addToHiddenPosts).not.toHaveBeenCalled();
  });

  it('opens the report modal and runs enabled hide actions from the post action sheet', async () => {
    const { container } = renderOpenedPost();

    fireEvent.click(container.querySelector('ion-button[fill="clear"][size="small"]') as HTMLElement);

    const actionSheet = container.querySelector('ion-action-sheet') as any;
    const buttons = actionSheet.buttons as Array<any>;

    await buttons.find(button => button.text === 'Report post').handler();
    expect(mockPresentModal).toHaveBeenCalled();

    await buttons.find(button => button.text === 'Hide all posts by this author').handler();
    await buttons.find(button => button.text === 'Hide post').handler();

    expect(addToHiddenAuthors).toHaveBeenCalledWith(42);
    expect(addToHiddenPosts).toHaveBeenCalledWith(42);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['refreshments-current'] });
  });

  it('refreshes the opened post queries and completes the refresher', async () => {
    vi.useFakeTimers();
    try {
      const { container } = renderOpenedPost();
      const refresher = container.querySelector('ion-refresher') as HTMLElement;
      const complete = vi.fn();

      fireEvent(
        refresher,
        new CustomEvent('ionRefresh', {
          detail: { complete },
        })
      );

      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['posts', 'postcontent', 'dynamic', 42],
      });
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['posts', 'postcontent', 'static', 42],
      });
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['posts', 'postcontent', 42, 'comments'],
      });
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['top-comments', 42],
        exact: false,
      });

      await vi.advanceTimersByTimeAsync(2000);
      expect(complete).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('toggles the cover-photo alt text when alt text is enabled', async () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...staticPost,
        coverPhoto: '/cover.jpg',
        coverPhoto_alt: 'A picnic blanket on the grass.',
      },
      isLoading: false,
    } as any);

    const { container } = renderOpenedPost();

    const altButton = container.querySelector('.alt-coverPhoto-button') as HTMLElement;
    fireEvent.click(altButton);

    expect(await screen.findByText('A picnic blanket on the grass.')).toBeInTheDocument();

    fireEvent.click(altButton);
    await waitFor(() => {
      expect(screen.queryByText('A picnic blanket on the grass.')).not.toBeInTheDocument();
    });
  });

  it('shows the deactivated-account placeholder when the viewer cannot comment', () => {
    mockGlobalProfile.mockReturnValue({
      data: { user: 9, username: 'alex', deactivated_profile: true, paused_profile: false },
      isLoading: false,
    } as any);

    const { container } = renderOpenedPost();

    const textarea = container.querySelector('ion-textarea.comment-creator') as HTMLElement;
    expect(textarea).toHaveAttribute('placeholder', 'You need an active account to comment.');

    const sendButton = container.querySelector('.send-button') as HTMLButtonElement;
    expect(sendButton).toBeDisabled();
  });

  it('blocks commenting when moderation marks the account as moderator-deactivated even without deactivated_profile', async () => {
    mockGlobalProfile.mockReturnValue({
      data: { user: 9, username: 'alex', deactivated_profile: false, paused_profile: false },
      isLoading: false,
    } as any);
    mockModeration.mockReturnValue({ data: { paused_on_creation: false, moderator_deactivated: true } } as any);

    const { container } = renderOpenedPost();

    const textarea = container.querySelector('ion-textarea.comment-creator') as HTMLElement;
    expect(textarea).toHaveAttribute('placeholder', 'Your account is currently suspended from commenting.');

    const sendButton = container.querySelector('.send-button') as HTMLButtonElement;
    expect(sendButton).toBeDisabled();

    fireEvent.click(screen.getByText('View Activity'));
    expect(routerPush).toHaveBeenCalledWith('/activity');
  });

  it('blocks commenting until commenting_paused_until and links to activity', async () => {
    mockModeration.mockReturnValue({
      data: {
        paused_on_creation: false,
        commenting_paused_until: '2099-07-20T18:00:00.000Z',
      },
    } as any);

    const { container } = renderOpenedPost();

    const textarea = container.querySelector('ion-textarea.comment-creator') as HTMLElement;
    expect(textarea.getAttribute('placeholder')).toContain('Your commenting is temporarily paused until');

    const sendButton = container.querySelector('.send-button') as HTMLButtonElement;
    expect(sendButton).toBeDisabled();

    fireEvent.click(screen.getByText('View Activity'));
    expect(routerPush).toHaveBeenCalledWith('/activity');
  });

  it('does not submit a comment when the viewer is deactivated', async () => {
    mockGlobalProfile.mockReturnValue({
      data: { user: 9, username: 'alex', deactivated_profile: true, paused_profile: false },
      isLoading: false,
    } as any);

    const { container } = renderOpenedPost();

    const textarea = container.querySelector('ion-textarea.comment-creator') as HTMLElement;
    ionInput(textarea, 'Trying to comment from a deactivated account');

    const sendButton = container.querySelector('.send-button') as HTMLButtonElement;
    expect(sendButton).toBeDisabled();

    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(addComment).not.toHaveBeenCalled();
      expect(increaseStreak).not.toHaveBeenCalled();
    });
  });

  it('opens the event calendar from keyboard interaction on the event card', () => {
    const { container } = renderOpenedPost();

    fireEvent.keyDown(container.querySelector('.opened-post-event') as HTMLElement, { key: 'Enter' });

    expect(routerPush).toHaveBeenCalledWith('/community?calendarDate=2099-04-10');
  });

  it('does not open the calendar for events that ended more than a week ago', () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...staticPost,
        event: {
          ...staticPost.event,
          start_datetime: '2000-04-01T17:30:00.000Z',
          end_datetime: '2000-04-01T19:00:00.000Z',
        },
      },
      isLoading: false,
    } as any);

    const { container } = renderOpenedPost();
    const eventCard = container.querySelector('.opened-post-event') as HTMLElement;

    fireEvent.click(eventCard);
    fireEvent.keyDown(eventCard, { key: 'Enter' });

    expect(routerPush).not.toHaveBeenCalled();
    expect(eventCard.getAttribute('role')).toBeNull();
    expect(eventCard.getAttribute('tabindex')).toBe('-1');
  });

  it('toggles sidenotes from the post action sheet when hidden comments exist', async () => {
    mockCommentsNotShownCount.mockReturnValue({ data: 2 } as any);

    const { container } = renderOpenedPost();

    fireEvent.click(container.querySelector('ion-button[fill="clear"][size="small"]') as HTMLElement);

    const actionSheet = container.querySelector('ion-action-sheet') as any;
    const buttons = actionSheet.buttons as Array<any>;

    await act(async () => {
      await buttons.find(button => button.text === 'Show sidenotes').handler();
    });

    expect(screen.getAllByText('Hide sidenotes').length).toBeGreaterThan(0);

    fireEvent.click(container.querySelector('ion-button[fill="clear"][size="small"]') as HTMLElement);
    const reopenedButtons = (container.querySelector('ion-action-sheet') as any).buttons as Array<any>;
    await act(async () => {
      await reopenedButtons.find(button => button.text === 'Hide sidenotes').handler();
    });

    await waitFor(() => {
      expect(screen.queryByText('Hide sidenotes')).not.toBeInTheDocument();
    });
  });

  it('hides the footer when navigating back to all posts', () => {
    const { container } = renderOpenedPost();

    const footer = container.querySelector('ion-footer') as HTMLElement;
    expect(footer.className).toContain('create-comment');

    fireEvent.click(container.querySelector('ion-fab-button') as HTMLElement);

    expect(footer.className).toContain('create-comment-hidden');
  });

  it('opens external links from disclaimer and comment instructions', async () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...staticPost,
        disclaimer: 'Read more at https://example.com/disclaimer',
        comment_instructions: 'Review https://example.com/rules before posting.',
      },
      isLoading: false,
    } as any);

    renderOpenedPost();

    fireEvent.click(await screen.findByText('https://example.com/disclaimer'));
    fireEvent.click(screen.getByText('https://example.com/rules'));

    expect(openExternalUrl).toHaveBeenCalledWith('https://example.com/disclaimer');
    expect(openExternalUrl).toHaveBeenCalledWith('https://example.com/rules');
  });

  it('calls router.goBack() when the back button is pressed and history exists', async () => {
    routerCanGoBack.mockReturnValue(true);
    const { container } = renderOpenedPost();

    await screen.findByText('Spring picnic');

    const backButton = container.querySelector('.very-top ion-fab-button') as HTMLElement;
    fireEvent.click(backButton);

    expect(routerGoBack).toHaveBeenCalledTimes(1);
    expect(routerPush).not.toHaveBeenCalledWith('/community', 'back');
  });

  it('falls back to /community when the back button is pressed with no history', async () => {
    routerCanGoBack.mockReturnValue(false);
    const { container } = renderOpenedPost();

    await screen.findByText('Spring picnic');

    const backButton = container.querySelector('.very-top ion-fab-button') as HTMLElement;
    fireEvent.click(backButton);

    expect(routerGoBack).not.toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith('/community', 'back');
  });
});
