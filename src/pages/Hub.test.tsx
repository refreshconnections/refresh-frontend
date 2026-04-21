import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { IonApp } from '@ionic/react';

const {
  mockPresentModal,
  mockDismissModal,
  mockHistoryPush,
} = vi.hoisted(() => ({
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  mockHistoryPush: vi.fn(),
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');

  return {
    ...actual,
    useIonModal: (component: any, modalProps: any) => [
      () => mockPresentModal(component?.name ?? 'AnonymousModal', modalProps),
      mockDismissModal,
    ],
  };
});

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('react-router', () => ({
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

vi.mock('../hooks/api/interests', () => ({
  useGetInterestedPosts: vi.fn(),
  useGetInterestedEvents: vi.fn(),
}));

vi.mock('../hooks/api/refreshments/megathreads', () => ({
  useGetMegathreads: vi.fn(),
}));

vi.mock('../hooks/api/tips', () => ({
  useGetDailyTip: vi.fn(),
}));

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: vi.fn(),
}));

vi.mock('../hooks/utilities', () => ({
  isCommunityPlus: vi.fn((level: string) => level === 'communityplus' || level === 'pro'),
}));

vi.mock('../components/PostSuggestionMini', () => ({
  default: ({ post }: { post: { title: string } }) => <div>{post.title}</div>,
}));

import Hub from './Hub';
import { useGetInterestedEvents, useGetInterestedPosts } from '../hooks/api/interests';
import { useGetMegathreads } from '../hooks/api/refreshments/megathreads';
import { useGetDailyTip } from '../hooks/api/tips';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';

const mockInterestedPosts = vi.mocked(useGetInterestedPosts);
const mockInterestedEvents = vi.mocked(useGetInterestedEvents);
const mockMegathreads = vi.mocked(useGetMegathreads);
const mockDailyTip = vi.mocked(useGetDailyTip);
const mockCurrentProfile = vi.mocked(useGetCurrentProfile);

const renderHub = () => render(
  <IonApp>
    <Hub />
  </IonApp>
);

describe('Hub page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-03T12:00:00Z'));
    vi.clearAllMocks();

    mockInterestedEvents.mockReturnValue({
      data: {
        next: 2,
        previous: null,
        count: 4,
        results: [
          { id: 1, name: 'Event One', start_datetime: '2026-04-03T18:00:00Z', end_datetime: '2026-04-03T19:00:00Z' },
          { id: 2, name: 'Event Two', start_datetime: '2026-04-04T18:00:00Z', end_datetime: '2026-04-04T19:00:00Z' },
          { id: 3, name: 'Event Three', start_datetime: '2026-04-05T18:00:00Z', end_datetime: '2026-04-05T19:00:00Z' },
          { id: 4, name: 'Event Four', start_datetime: '2026-04-06T18:00:00Z', end_datetime: '2026-04-06T19:00:00Z' },
        ],
      },
      isLoading: false,
      isFetching: false,
    } as any);

    mockInterestedPosts.mockReturnValue({
      data: {
        next: 2,
        previous: null,
        count: 4,
        results: [
          { id: 11, title: 'Post One', uploadDateTime: '2026-04-03T10:00:00Z', comment_count: 0 },
          { id: 12, title: 'Post Two', uploadDateTime: '2026-04-02T10:00:00Z', comment_count: 1 },
          { id: 13, title: 'Post Three', uploadDateTime: '2026-04-01T10:00:00Z', comment_count: 2 },
          { id: 14, title: 'Post Four', uploadDateTime: '2026-03-31T10:00:00Z', comment_count: 0 },
        ],
      },
      isLoading: false,
      isFetching: false,
    } as any);

    mockMegathreads.mockReturnValue({
      data: [
        { id: 21, title: 'Thread One', uploadDateTime: '2026-04-03T10:00:00Z' },
        { id: 22, title: 'Thread Two', uploadDateTime: '2026-04-02T10:00:00Z' },
        { id: 23, title: 'Thread Three', uploadDateTime: '2026-04-01T10:00:00Z' },
        { id: 24, title: 'Thread Four', uploadDateTime: '2026-03-31T10:00:00Z' },
      ],
    } as any);

    mockDailyTip.mockReturnValue({
      data: {
        title: 'Tip',
        description: 'Helpful tip copy',
      },
    } as any);

    mockCurrentProfile.mockReturnValue({
      data: {
        subscription_level: 'free',
      },
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps each Hub section compact and exposes see-all modal actions', () => {
    renderHub();

    expect(screen.getByText('Event One')).toBeInTheDocument();
    expect(screen.getByText('Event Two')).toBeInTheDocument();
    expect(screen.getByText('Event Three')).toBeInTheDocument();
    expect(screen.queryByText('Event Four')).not.toBeInTheDocument();

    expect(screen.getByText('Post One')).toBeInTheDocument();
    expect(screen.getByText('Post Two')).toBeInTheDocument();
    expect(screen.getByText('Post Three')).toBeInTheDocument();
    expect(screen.queryByText('Post Four')).not.toBeInTheDocument();

    expect(screen.getByText('Thread One')).toBeInTheDocument();
    expect(screen.getByText('Thread Two')).toBeInTheDocument();
    expect(screen.getByText('Thread Three')).toBeInTheDocument();
    expect(screen.queryByText('Thread Four')).not.toBeInTheDocument();

    expect(screen.getByText('See all events')).toBeInTheDocument();
    expect(screen.getByText('See all posts')).toBeInTheDocument();
    expect(screen.getByText('See all megathreads')).toBeInTheDocument();
  });

  it('opens the matching modal when a see-all button is pressed', () => {
    renderHub();

    fireEvent.click(screen.getByText('See all posts'));
    fireEvent.click(screen.getByText('See all events'));
    fireEvent.click(screen.getByText('See all megathreads'));

    expect(mockPresentModal).toHaveBeenNthCalledWith(
      1,
      'HubListModal',
      expect.objectContaining({ title: "Posts You're Interested In" })
    );
    expect(mockPresentModal).toHaveBeenNthCalledWith(
      2,
      'HubInterestedEventsModal',
      expect.objectContaining({ upcomingEvents: expect.any(Array) })
    );
    expect(mockPresentModal).toHaveBeenNthCalledWith(
      3,
      'HubListModal',
      expect.objectContaining({ title: 'Megathreads' })
    );
  });
});
