import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp } from '@ionic/react';

const {
  recoverStreak,
  increaseStreak,
  invalidateQueries,
  mockPresentAlert,
  mockPresentModal,
  mockDismissModal,
  mockRouterPush,
} = vi.hoisted(() => ({
  recoverStreak: vi.fn(),
  increaseStreak: vi.fn(),
  invalidateQueries: vi.fn(),
  mockPresentAlert: vi.fn(),
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  mockRouterPush: vi.fn(),
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonApp: ({ children }: any) => <div>{children}</div>,
    useIonAlert: () => [mockPresentAlert, vi.fn()],
    useIonModal: () => [mockPresentModal, mockDismissModal],
    useIonRouter: () => ({ push: mockRouterPush, goBack: vi.fn() }),
  };
});

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: (...args: any[]) => invalidateQueries(...args) }),
  };
});

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('../../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/recent-notifications', () => ({
  useGetRecentNotifications: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/current-streak', () => ({
  useGetCurrentStreak: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/current-limits', () => ({
  useGetLimits: vi.fn(),
}));

vi.mock('../../hooks/api/refreshments/submitted-anns', () => ({
  useGetSubmittedAnnouncements: vi.fn(),
}));

vi.mock('../../hooks/api/refreshments/submission-summary', () => ({
  useGetSubmissionSummary: vi.fn(),
}));

vi.mock('../../hooks/api/submitted-events', () => ({
  useGetSubmittedEvents: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/global-app-current-profile', () => ({
  useGetGlobalAppCurrentProfile: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/my-comments', () => ({
  useGetMyComments: vi.fn(),
}));

vi.mock('../../hooks/utilities', () => ({
  recoverStreak: (...args: any[]) => recoverStreak(...args),
  increaseStreak: (...args: any[]) => increaseStreak(...args),
}));

vi.mock('../../components/CreatePostModal', () => ({
  default: () => <div>create-post-modal</div>,
}));

vi.mock('../../components/GuidelinesButton', () => ({
  default: () => <button>Guidelines</button>,
}));

import Activity from './index';
import { useGetCurrentProfile } from '../../hooks/api/profiles/current-profile';
import { useGetRecentNotifications } from '../../hooks/api/profiles/recent-notifications';
import { useGetCurrentStreak } from '../../hooks/api/profiles/current-streak';
import { useGetLimits } from '../../hooks/api/profiles/current-limits';
import { useGetSubmittedAnnouncements } from '../../hooks/api/refreshments/submitted-anns';
import { useGetSubmissionSummary } from '../../hooks/api/refreshments/submission-summary';
import { useGetSubmittedEvents } from '../../hooks/api/submitted-events';
import { useGetGlobalAppCurrentProfile } from '../../hooks/api/profiles/global-app-current-profile';
import { useGetMyComments } from '../../hooks/api/profiles/my-comments';

const mockCurrentProfile = vi.mocked(useGetCurrentProfile);
const mockRecentNotifications = vi.mocked(useGetRecentNotifications);
const mockCurrentStreak = vi.mocked(useGetCurrentStreak);
const mockLimits = vi.mocked(useGetLimits);
const mockSubmittedAnnouncements = vi.mocked(useGetSubmittedAnnouncements);
const mockSubmissionSummary = vi.mocked(useGetSubmissionSummary);
const mockSubmittedEvents = vi.mocked(useGetSubmittedEvents);
const mockGlobalProfile = vi.mocked(useGetGlobalAppCurrentProfile);
const mockMyComments = vi.mocked(useGetMyComments);

const baseProfile = {
  username: 'alex',
  name: 'Alex',
  subscription_level: 'none',
  settings_streak_tracker: true,
};

const baseStreak = {
  streak_count: 5,
  max_streak: 10,
  savers: 2,
  last_updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  streak_pre_break: null,
  break_date: null,
};

const renderActivity = () => {
  const queryClient = new QueryClient();
  return render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <Activity />
      </QueryClientProvider>
    </IonApp>
  );
};

const goToSegment = (label: 'Refreshments' | 'Streak') => {
  const result = renderActivity();
  fireEvent.click(screen.getByText(label));
  return result;
};

beforeEach(() => {
  vi.clearAllMocks();
  recoverStreak.mockResolvedValue(undefined);
  increaseStreak.mockResolvedValue(undefined);

  mockCurrentProfile.mockReturnValue({ data: baseProfile } as any);
  mockRecentNotifications.mockReturnValue({ data: [], isLoading: false } as any);
  mockCurrentStreak.mockReturnValue({ data: baseStreak, isLoading: false } as any);
  mockLimits.mockReturnValue({ data: { comments_removed: 1, chats_removed: 0 }, isLoading: false } as any);
  mockSubmittedAnnouncements.mockReturnValue({ data: { pages: [] }, isLoading: false } as any);
  mockSubmittedEvents.mockReturnValue({ data: { pages: [] }, isLoading: false } as any);
  mockSubmissionSummary.mockReturnValue({ data: null } as any);
  mockGlobalProfile.mockReturnValue({ data: null, isLoading: false } as any);
  mockMyComments.mockReturnValue({
    data: { pages: [] },
    isLoading: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
  } as any);
});

describe('Activity page', () => {
  describe('Recent segment (default)', () => {
    it('shows the Recent segment by default', () => {
      renderActivity();
      expect(screen.getByText('Recent happenings')).toBeInTheDocument();
    });

    it('shows a spinner while loading', () => {
      mockRecentNotifications.mockReturnValue({ data: undefined, isLoading: true } as any);
      mockGlobalProfile.mockReturnValue({ data: null, isLoading: true } as any);

      const { container } = renderActivity();

      expect(container.querySelector('ion-spinner')).toBeInTheDocument();
    });

    it('renders each notification message', () => {
      mockRecentNotifications.mockReturnValue({
        data: [
          { id: 1, notification_type: 'like', message: 'Alex liked your post', notif_datetime: new Date().toISOString() },
          { id: 2, notification_type: 'comment', message: 'Jamie commented on your post', notif_datetime: new Date().toISOString() },
        ],
        isLoading: false,
      } as any);

      renderActivity();

      expect(screen.getByText('Alex liked your post')).toBeInTheDocument();
      expect(screen.getByText('Jamie commented on your post')).toBeInTheDocument();
    });

    it('shows the join date card when fewer than 10 notifications exist and registrationDate is set', () => {
      mockGlobalProfile.mockReturnValue({
        data: { registrationDate: '2024-01-01T00:00:00Z' },
        isLoading: false,
      } as any);

      renderActivity();

      expect(screen.getByText(/You joined Refresh Connections/)).toBeInTheDocument();
    });

    it('shows today for the join date card when registrationDate is within 24 hours', () => {
      mockGlobalProfile.mockReturnValue({
        data: { registrationDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() },
        isLoading: false,
      } as any);

      renderActivity();

      expect(screen.getByText('You joined Refresh Connections today')).toBeInTheDocument();
    });

    it('shows usage limits for removed comments and unsent chats', () => {
      mockLimits.mockReturnValue({
        data: { comments_removed: 3, chats_removed: 2 },
        isLoading: false,
      } as any);

      renderActivity();

      expect(screen.getByText('Comments you removed this month: 3/5')).toBeInTheDocument();
      expect(screen.getByText('Chat messages you unsent this month: 2/5')).toBeInTheDocument();
    });
  });

  describe('Refreshments segment', () => {
    it('shows the refreshments header after switching to the segment', () => {
      goToSegment('Refreshments');
      expect(screen.getByText('My post and event submissions')).toBeInTheDocument();
    });

    it('shows a spinner while loading', () => {
      mockSubmittedAnnouncements.mockReturnValue({ data: { pages: [] }, isLoading: true } as any);

      const { container } = goToSegment('Refreshments');

      expect(container.querySelector('ion-spinner')).toBeInTheDocument();
    });

    it('shows a create post prompt when the user has no submissions', () => {
      goToSegment('Refreshments');

      expect(screen.getByText('Feel like submitting a post?')).toBeInTheDocument();
      expect(screen.getAllByText('Create a post').length).toBeGreaterThan(0);
    });

    it('opens the create post modal when the button is clicked', () => {
      goToSegment('Refreshments');

      fireEvent.click(screen.getAllByText('Create a post')[0]);

      expect(mockPresentModal).toHaveBeenCalledTimes(1);
    });

    it('shows a pending count callout when submissions await review', () => {
      mockSubmissionSummary.mockReturnValue({
        data: { totals: { approved: 0, pending: 2, needs_edit: 0, rejected: 0 } },
      } as any);

      goToSegment('Refreshments');

      expect(screen.getByText(/2 submissions awaiting moderator review/)).toBeInTheDocument();
    });

    it('shows a needs-edit callout when posts require changes', () => {
      mockSubmissionSummary.mockReturnValue({
        data: { totals: { approved: 0, pending: 0, needs_edit: 1, rejected: 0 } },
      } as any);

      goToSegment('Refreshments');

      expect(screen.getByText(/1 post needs your edit/)).toBeInTheDocument();
    });

    it('shows the My comments section when the user has comments', () => {
      mockMyComments.mockReturnValue({
        data: {
          pages: [{
            results: [{
              id: 10,
              item_type: 'comment',
              text: 'Great post!',
              announcement_title: 'My Post',
              announcement_id: 5,
              is_reply: false,
              removed: false,
              moderation_note: null,
              moderation_note_longer: null,
              latest_activity: new Date().toISOString(),
            }],
          }],
        },
        isLoading: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
      } as any);

      goToSegment('Refreshments');

      expect(screen.getByText('My comments')).toBeInTheDocument();
      expect(screen.getByText('Great post!')).toBeInTheDocument();
    });

    it('expands a comment when the chevron is clicked', () => {
      const longText = 'A'.repeat(80);
      mockMyComments.mockReturnValue({
        data: {
          pages: [{
            results: [{
              id: 11,
              item_type: 'comment',
              text: longText,
              announcement_title: 'Post Title',
              announcement_id: 6,
              is_reply: false,
              removed: false,
              moderation_note: null,
              moderation_note_longer: null,
              latest_activity: new Date().toISOString(),
            }],
          }],
        },
        isLoading: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
      } as any);

      const { container } = goToSegment('Refreshments');

      const chevron = container.querySelector('.comment-card-chevron') as HTMLElement;
      expect(container.querySelector('.comment-card-text.expanded')).toBeFalsy();
      fireEvent.click(chevron);
      expect(container.querySelector('.comment-card-text.expanded')).toBeTruthy();
    });

    describe('comment card variants', () => {
      const base = {
        id: 99,
        item_type: 'comment' as const,
        text: 'My comment text',
        announcement_title: 'Some Post',
        announcement_id: 1,
        is_reply: false,
        removed: false,
        removed_reason: null,
        moderation_note: null,
        moderation_note_longer: null,
        reply_to_text: null,
        reply_to_username: null,
        latest_activity: new Date().toISOString(),
      };

      const withComment = (overrides: Record<string, any>) => {
        mockMyComments.mockReturnValue({
          data: { pages: [{ results: [{ ...base, ...overrides }] }] },
          isLoading: false,
          hasNextPage: false,
          fetchNextPage: vi.fn(),
          isFetchingNextPage: false,
        } as any);
      };

      const expandFirstCard = (container: HTMLElement) => {
        fireEvent.click(container.querySelector('.comment-card-chevron') as HTMLElement);
      };

      it('shows a moderation note when expanded', () => {
        withComment({ moderation_note: 'Please review community guidelines.' });
        const { container } = goToSegment('Refreshments');
        expandFirstCard(container);
        const note = container.querySelector('.comment-card-moderation-note');
        expect(note?.textContent).toContain('Moderation note:');
        expect(note?.textContent).toContain('Please review community guidelines.');
      });

      it('shows the longer side note when expanded alongside the main moderation note', () => {
        withComment({
          moderation_note: 'Short note.',
          moderation_note_longer: 'This is the extended explanation for the moderator note.',
        });
        const { container } = goToSegment('Refreshments');
        expandFirstCard(container);
        const note = container.querySelector('.comment-card-moderation-note');
        expect(note?.textContent).toContain('Short note.');
        expect(note?.textContent).toContain('This is the extended explanation for the moderator note.');
      });

      it('shows the removal reason when expanded on a removed comment', () => {
        withComment({ removed: true, removed_reason: 'Violated community guidelines.' });
        const { container } = goToSegment('Refreshments');
        expandFirstCard(container);
        const removed = container.querySelector('.comment-card-removed-reason');
        expect(removed?.textContent).toContain('Removal reason: Violated community guidelines.');
      });

      it('shows "You removed a comment you left." without expansion when removed without a reason', () => {
        withComment({ removed: true, removed_reason: null });
        goToSegment('Refreshments');
        expect(screen.getByText(/You removed a comment you left\./)).toBeInTheDocument();
        // no chevron needed — text replaces the comment body directly
        expect(screen.queryByText('My comment text')).not.toBeInTheDocument();
      });

      it('shows both the removal reason and a moderation note when expanded', () => {
        withComment({
          removed: true,
          removed_reason: 'Off-topic post.',
          moderation_note: 'Staff reviewed this removal.',
        });
        const { container } = goToSegment('Refreshments');
        expandFirstCard(container);
        expect(container.querySelector('.comment-card-removed-reason')?.textContent).toContain('Removal reason: Off-topic post.');
        expect(container.querySelector('.comment-card-moderation-note')?.textContent).toContain('Staff reviewed this removal.');
      });

      it('shows the quoted original comment when a reply is expanded', () => {
        withComment({
          is_reply: true,
          reply_to_username: 'Jamie',
          reply_to_text: 'This is the original comment.',
        });
        const { container } = goToSegment('Refreshments');
        expandFirstCard(container);
        expect(screen.getByText('Jamie')).toBeInTheDocument();
        expect(screen.getByText('This is the original comment.')).toBeInTheDocument();
      });

      it('shows "replied to your comment" for a reply-type card', () => {
        withComment({
          id: 200,
          item_type: 'reply',
          replier_name: 'Jordan',
          parent_text: 'Your original comment here.',
          text: 'Jordan\'s reply text',
        });
        const { container } = goToSegment('Refreshments');
        expect(screen.getByText('Jordan')).toBeInTheDocument();
        expect(screen.getByText(/replied to your comment/)).toBeInTheDocument();
        // expand to see the quoted parent and the reply text
        expandFirstCard(container);
        expect(screen.getByText('Your original comment here.')).toBeInTheDocument();
        expect(screen.getByText('Jordan\'s reply text')).toBeInTheDocument();
      });

      it('shows "replied to a comment thread" for a sibling-reply-type card', () => {
        withComment({
          id: 201,
          item_type: 'sibling_reply',
          replier_name: 'Casey',
          text: 'Casey\'s reply text',
        });
        goToSegment('Refreshments');
        expect(screen.getByText('Casey')).toBeInTheDocument();
        expect(screen.getByText(/replied to a comment thread you also commented in/)).toBeInTheDocument();
      });
    });
  });

  describe('Streak segment', () => {
    it('renders nothing when the streak tracker is disabled', () => {
      mockCurrentProfile.mockReturnValue({
        data: { ...baseProfile, settings_streak_tracker: false },
      } as any);

      goToSegment('Streak');

      expect(screen.queryByText(/Streak count/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Streaks can be increased daily/)).not.toBeInTheDocument();
    });

    it('shows a spinner while the streak is loading', () => {
      mockCurrentStreak.mockReturnValue({ data: undefined, isLoading: true } as any);

      const { container } = goToSegment('Streak');

      expect(container.querySelector('ion-spinner')).toBeInTheDocument();
    });

    it('shows the current streak count', () => {
      goToSegment('Streak');

      expect(screen.getByText(/Streak count: 5/)).toBeInTheDocument();
    });

    it('shows "no streak yet" when streak count is 0 with no pre-break', () => {
      mockCurrentStreak.mockReturnValue({
        data: { ...baseStreak, streak_count: 0, streak_pre_break: null },
        isLoading: false,
      } as any);

      goToSegment('Streak');

      expect(screen.getByText(/You don't have a streak yet/)).toBeInTheDocument();
    });

    it('shows the streak-broke message when streak_pre_break is set', () => {
      mockCurrentStreak.mockReturnValue({
        data: { ...baseStreak, streak_count: 0, streak_pre_break: 12 },
        isLoading: false,
      } as any);

      goToSegment('Streak');

      expect(screen.getByText(/Your 12-day streak ended!/)).toBeInTheDocument();
    });

    it('shows personal best and saver count', () => {
      goToSegment('Streak');

      expect(screen.getByText(/Personal best: 10 days/)).toBeInTheDocument();
      expect(screen.getByText(/2 streak savers/)).toBeInTheDocument();
    });

    it('shows the pro-user streak note', () => {
      mockCurrentProfile.mockReturnValue({
        data: { ...baseProfile, subscription_level: 'pro' },
      } as any);

      goToSegment('Streak');

      expect(screen.getByText(/Remember, as a pro user, your streak is just for fun!/)).toBeInTheDocument();
    });

    it('calls recoverStreak and invalidates the streak query when the restore button is clicked', async () => {
      const breakDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      mockCurrentStreak.mockReturnValue({
        data: { ...baseStreak, streak_count: 0, streak_pre_break: 7, break_date: breakDate, savers: 2 },
        isLoading: false,
      } as any);

      goToSegment('Streak');

      fireEvent.click(screen.getByText('Restore (1 saver)'));

      await waitFor(() => {
        expect(recoverStreak).toHaveBeenCalledTimes(1);
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['streak'] });
      });
    });

    it('disables the restore button when the user cannot afford the cost', () => {
      const breakDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      mockCurrentStreak.mockReturnValue({
        data: { ...baseStreak, streak_count: 0, streak_pre_break: 7, break_date: breakDate, savers: 0 },
        isLoading: false,
      } as any);

      const { container } = goToSegment('Streak');

      expect(screen.getByText(/Not enough savers/)).toBeInTheDocument();
      const btn = container.querySelector('ion-button[disabled]');
      expect(btn).toBeTruthy();
    });

    it('shows the expired recovery window message when the break is older than 14 days', () => {
      const breakDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
      mockCurrentStreak.mockReturnValue({
        data: { ...baseStreak, streak_count: 0, streak_pre_break: 10, break_date: breakDate, savers: 5 },
        isLoading: false,
      } as any);

      goToSegment('Streak');

      expect(screen.getByText(/The recovery window for your 10-day streak has expired/)).toBeInTheDocument();
      expect(screen.queryByText(/Restore \(/)).not.toBeInTheDocument();
    });

    it('scales the recovery cost based on days missed', () => {
      const breakDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      mockCurrentStreak.mockReturnValue({
        data: { ...baseStreak, streak_count: 0, streak_pre_break: 14, break_date: breakDate, savers: 5 },
        isLoading: false,
      } as any);

      goToSegment('Streak');

      expect(screen.getByText(/Restore \(3 savers\)/)).toBeInTheDocument();
    });

    it('shows 0-savers message when the user has no streak savers', () => {
      mockCurrentStreak.mockReturnValue({
        data: { ...baseStreak, savers: 0 },
        isLoading: false,
      } as any);

      goToSegment('Streak');

      expect(screen.getByText(/You have no streak savers\. Earn 1 every 7 active days\./)).toBeInTheDocument();
    });

    it('shows the max-savers message when the user has 10 or more streak savers', () => {
      mockCurrentStreak.mockReturnValue({
        data: { ...baseStreak, savers: 10 },
        isLoading: false,
      } as any);

      goToSegment('Streak');

      expect(screen.getByText(/10 streak savers \(max\)/)).toBeInTheDocument();
    });

    it('displays the personal best', () => {
      mockCurrentStreak.mockReturnValue({
        data: { ...baseStreak, max_streak: 21 },
        isLoading: false,
      } as any);

      goToSegment('Streak');

      expect(screen.getByText(/Personal best: 21 days/)).toBeInTheDocument();
    });
  });
});
