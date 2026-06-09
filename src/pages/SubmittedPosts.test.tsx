import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

let mockPostsLoading = false;
let mockEventsLoading = false;
let mockPostsQuery: any;
let mockEventsQuery: any;

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  const { createElement } = await import('react');
  const { flushSync } = await import('react-dom');
  const { createRoot } = await import('react-dom/client');
  return {
    ...actual,
    IonPopover: ({ isOpen, children }: any) => (isOpen ? <div>{children}</div> : null),
    IonModal: ({ isOpen, children }: any) => (isOpen ? <div>{children}</div> : null),
    useIonPopover: (Component: any, componentProps: any) => {
      const present = () => {
        const div = document.createElement('div');
        document.body.appendChild(div);
        flushSync(() => {
          createRoot(div).render(createElement(Component, { ...componentProps, onDismiss: () => {} }));
        });
      };
      return [present, vi.fn()];
    },
  };
});

vi.mock('../hooks/api/refreshments/submitted-anns', () => ({
  useGetSubmittedAnnouncements: (_showHidden?: any, opts?: any) => ({
    ...(mockPostsQuery ?? {
      data: {
        pages: [
          {
            count: 2,
            results: [
              {
                id: 1,
                title: 'Approved post',
                approval_status: 'approved',
                approvalDateTime: '2099-07-20T00:00:00.000Z',
                hide_status_author: 'user',
              },
              {
                id: 2,
                title: 'Needs edit post',
                approval_status: 'needs_edit',
                last_edited_at: '2099-07-20T00:00:00.000Z',
              },
            ],
          },
        ],
      },
      isLoading: mockPostsLoading,
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isFetchingNextPage: false,
    }),
    enabled: opts?.enabled,
  }),
}));

vi.mock('../hooks/api/submitted-events', () => ({
  useGetSubmittedEvents: () => mockEventsQuery ?? {
    data: {
      pages: [
        {
          count: 2,
          results: [
            {
              id: 21,
              name: 'Pending event',
              status: 'pending',
              interested_count: 7,
              start_datetime: '2099-07-20T18:00:00.000Z',
              end_datetime: '2099-07-20T19:00:00.000Z',
              description: 'Pending moderation',
              moderator_rejection_reason: 'Please include a public event link.\nhttps://example.com/event',
              location: 'Brooklyn',
              uploadDateTime: '2099-07-18T00:00:00.000Z',
            },
            {
              id: 22,
              name: 'Approved event',
              status: 'approved',
              start_datetime: '2099-07-21T18:00:00.000Z',
              end_datetime: '2099-07-21T19:00:00.000Z',
              approvalDateTime: '2099-07-18T00:00:00.000Z',
            },
          ],
        },
      ],
    },
    isLoading: mockEventsLoading,
    fetchNextPage: vi.fn(),
    hasNextPage: true,
    isFetchingNextPage: false,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({ push: mockPush }),
    useLocation: () => ({ pathname: '/submitted-posts', search: '', hash: '', state: null }),
  };
});

vi.mock('../enums/moderation', () => ({
  ModerationCopy: {
    MODERATION_INFO_POPOVER: 'Moderation can take up to 3 business days.',
  },
}));

vi.mock('../components/GuidelinesButton', () => ({
  default: () => <button type="button">Guidelines</button>,
}));

import SubmittedPosts from './SubmittedPosts';

const renderPage = () => {
  const queryClient = new QueryClient();
  const view = render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <SubmittedPosts />
      </QueryClientProvider>
    </IonApp>
  );
  return { ...view, queryClient };
};

describe('SubmittedPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPostsLoading = false;
    mockEventsLoading = false;
    mockPostsQuery = null;
    mockEventsQuery = null;
  });

  it('renders post submissions and routes approved vs editable posts correctly', async () => {
    renderPage();

    expect(await screen.findByText('Approved post')).toBeInTheDocument();
    expect(screen.getByText('Needs edit post')).toBeInTheDocument();
    expect(screen.getByText('Needs your edit')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Approved post'));
    expect(mockPush).toHaveBeenCalledWith('/community/1');

    fireEvent.click(screen.getByText('Needs edit post'));
    expect(mockPush).toHaveBeenCalledWith('/community/submitted/2', { post: expect.objectContaining({ id: 2 }) });
  });

  it('shows loading and pagination controls for posts', async () => {
    const fetchNextPage = vi.fn();
    mockPostsQuery = {
      data: { pages: [{ count: 1, results: [{ id: 1, title: 'Approved post', approval_status: 'approved', approvalDateTime: '2099-07-20T00:00:00.000Z' }] }] },
      isLoading: false,
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    };
    renderPage();

    fireEvent.click(await screen.findByText('Show more'));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('renders events, routes approved events to the calendar date, and opens pending event details', async () => {
    renderPage();

    fireEvent.click(screen.getByText('Events'));

    expect(await screen.findByText('Pending event')).toBeInTheDocument();
    expect(screen.queryByText('Interested count')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Approved event'));
    expect(mockPush).toHaveBeenCalledWith('/community?calendarDate=2099-07-21&calendarEventId=22');

    fireEvent.click(screen.getByText('Pending event'));
    expect(await screen.findByText('Event details')).toBeInTheDocument();
    expect(screen.queryByText('Interested count')).not.toBeInTheDocument();
    expect(screen.queryByText('7')).not.toBeInTheDocument();
    expect(screen.getByText('Moderator explanation')).toBeInTheDocument();
    const explanation = document.querySelector('.moderator-explanation-body') as HTMLElement;
    expect(explanation).toHaveTextContent('Please include a public event link. https://example.com/event');
    expect(explanation.textContent).toContain('\n');
    expect(screen.getByRole('button', { name: 'https://example.com/event' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guidelines' })).toBeInTheDocument();
    expect(screen.getByText(/Shown in your time zone/)).toBeInTheDocument();
    fireEvent.click(document.querySelector('.info-button') as HTMLElement);
    expect(screen.getByText('Moderation can take up to 3 business days.')).toBeInTheDocument();
  });

  it('pull-to-refresh invalidates post submissions while posts are selected', async () => {
    const { container, queryClient } = renderPage();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const complete = vi.fn();

    fireEvent(
      container.querySelector('ion-refresher') as HTMLElement,
      new CustomEvent('ionRefresh', {
        detail: { complete },
      })
    );

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['ann', 'submitted'],
        exact: false,
      });
    });
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('pull-to-refresh invalidates submitted events while events are selected', async () => {
    const { container, queryClient } = renderPage();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    fireEvent.click(screen.getByText('Events'));

    const complete = vi.fn();
    fireEvent(
      container.querySelector('ion-refresher') as HTMLElement,
      new CustomEvent('ionRefresh', {
        detail: { complete },
      })
    );

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['submitted-events'],
      });
    });
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('filters out expired and stale submissions, while keeping editable drafts with the correct label', async () => {
    const futureOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const staleDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

    mockPostsQuery = {
      data: {
        pages: [
          {
            count: 4,
            results: [
              { id: 1, title: 'Draft post', approval_status: 'draft', expires_at: futureOneDay },
              { id: 2, title: 'Needs edit stale', approval_status: 'needs_edit', last_edited_at: staleDate },
              { id: 3, title: 'Rejected stale', approval_status: 'rejected', last_edited_at: staleDate },
              { id: 4, title: 'Expired post', approval_status: 'approved', expires_at: '2000-01-01T00:00:00.000Z' },
            ],
          },
        ],
      },
      isLoading: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    };

    renderPage();

    expect(await screen.findByText('Draft post')).toBeInTheDocument();
    expect(screen.getByText('Unsubmitted draft')).toBeInTheDocument();
    expect(screen.getByText('Editable for 1 day')).toBeInTheDocument();
    expect(screen.queryByText('Needs edit stale')).not.toBeInTheDocument();
    expect(screen.queryByText('Rejected stale')).not.toBeInTheDocument();
    expect(screen.queryByText('Expired post')).not.toBeInTheDocument();
  });

  it('shows the empty states and hidden toggle behavior for posts and events', async () => {
    mockPostsQuery = {
      data: { pages: [{ count: 0, results: [] }] },
      isLoading: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    };
    mockEventsQuery = {
      data: { pages: [{ count: 0, results: [] }] },
      isLoading: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    };

    renderPage();

    expect(await screen.findByText('No submitted posts yet.')).toBeInTheDocument();
    expect(screen.queryByText('Show hidden submissions')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Events'));
    expect(await screen.findByText('No submitted events yet.')).toBeInTheDocument();
  });

  it('shows cancelled events and paginates the events list', async () => {
    const fetchNextEventsPage = vi.fn();
    mockEventsQuery = {
      data: {
        pages: [
          {
            count: 1,
            results: [
              {
                id: 30,
                name: 'Cancelled event',
                status: 'cancelled',
                start_datetime: '2099-07-22T18:00:00.000Z',
                end_datetime: '2099-07-22T19:00:00.000Z',
              },
            ],
          },
        ],
      },
      isLoading: false,
      fetchNextPage: fetchNextEventsPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    };

    renderPage();
    fireEvent.click(screen.getByText('Events'));

    expect(await screen.findByText('Cancelled event')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Show more'));
    expect(fetchNextEventsPage).toHaveBeenCalledTimes(1);
  });
});
