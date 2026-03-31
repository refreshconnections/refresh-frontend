import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp, IonContent } from '@ionic/react';

const { completeInfiniteScroll } = vi.hoisted(() => ({
  completeInfiniteScroll: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '42' }),
}));

vi.mock('./CommentItem', () => ({
  default: ({ comment }: { comment: { text: string } }) => <div>{comment.text}</div>,
}));

vi.mock('../../hooks/api/refreshments/dynamic-post-content', () => ({
  useGetDynamicPostContent: vi.fn(),
}));

vi.mock('../../hooks/api/refreshments/top-level-comments', () => ({
  useTopLevelCommentsInf: vi.fn(),
}));

import Comments from './Comments';
import { useGetDynamicPostContent } from '../../hooks/api/refreshments/dynamic-post-content';
import { useTopLevelCommentsInf } from '../../hooks/api/refreshments/top-level-comments';

const mockDynamicPostContent = vi.mocked(useGetDynamicPostContent);
const mockTopLevelCommentsInf = vi.mocked(useTopLevelCommentsInf);

const setReplyTo = vi.fn();
const setSortByRecentActivity = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  completeInfiniteScroll.mockReset();

  mockDynamicPostContent.mockReturnValue({
    data: { comment_count: 2 },
  } as any);

  mockTopLevelCommentsInf.mockReturnValue({
    data: {
      pages: [
        {
          results: [
            { id: 1, text: 'First comment' },
            { id: 2, text: 'Second comment' },
          ],
        },
      ],
    },
    fetchNextPage: vi.fn(),
    hasNextPage: true,
    isFetchingNextPage: false,
    isPending: false,
  } as any);
});

afterEach(() => {
  localStorage.clear();
});

const renderComments = (sortByRecentActivity = false) => {
  const queryClient = new QueryClient();

  return render(
    <IonApp>
      <IonContent>
        <QueryClientProvider client={queryClient}>
          <Comments
            showSidenotes={false}
            setReplyTo={setReplyTo}
            onLikeUnlike={vi.fn()}
            forceShowRepliesFor={new Set()}
            sortByRecentActivity={sortByRecentActivity}
            setSortByRecentActivity={setSortByRecentActivity}
          />
        </QueryClientProvider>
      </IonContent>
    </IonApp>
  );
};

const ionChange = (el: HTMLElement, value: string) => {
  fireEvent(el, new CustomEvent('ionChange', { detail: { value }, bubbles: true }));
};

describe('Comments', () => {
  it('renders top-level comments from every loaded page', () => {
    renderComments();

    expect(screen.getByText('First comment')).toBeInTheDocument();
    expect(screen.getByText('Second comment')).toBeInTheDocument();
    expect(screen.getByText('Sort comments by')).toBeInTheDocument();
  });

  it('updates the sort mode and persists it to localStorage', () => {
    const { container } = renderComments();

    const select = container.querySelector('ion-select') as HTMLElement;
    expect(select).toBeTruthy();
    ionChange(select, 'activity');

    expect(setSortByRecentActivity).toHaveBeenCalledWith(true);
    expect(localStorage.getItem('sortByRecentActivity')).toBe('true');
  });

  it('fetches the next page when infinite scroll fires', async () => {
    const fetchNextPage = vi.fn().mockResolvedValue(undefined);
    mockTopLevelCommentsInf.mockReturnValue({
      data: {
        pages: [{ results: [{ id: 1, text: 'First comment' }] }],
      },
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
      isPending: false,
    } as any);

    const { container } = renderComments();

    const infiniteScroll = container.querySelector('ion-infinite-scroll') as HTMLElement & {
      complete?: () => void;
    };
    expect(infiniteScroll).toBeTruthy();
    infiniteScroll.complete = completeInfiniteScroll;
    fireEvent(
      infiniteScroll,
      new CustomEvent('ionInfinite', { detail: {}, bubbles: true })
    );

    await waitFor(() => {
      expect(fetchNextPage).toHaveBeenCalledTimes(1);
    });
    expect(completeInfiniteScroll).toHaveBeenCalledTimes(1);
  });
});
