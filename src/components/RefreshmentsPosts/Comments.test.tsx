import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp, IonContent } from '@ionic/react';

const { completeInfiniteScroll } = vi.hoisted(() => ({
  completeInfiniteScroll: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '42' }),
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonSearchbar: ({ value, onIonInput, ...props }: any) => (
      <input
        data-testid="comment-searchbar"
        value={value ?? ''}
        onInput={(e: any) => onIonInput?.({ detail: { value: e.target.value } })}
        {...props}
      />
    ),
    IonInfiniteScroll: ({ onIonInfinite, children, disabled }: any) => (
      <button
        data-testid="comments-infinite-scroll"
        type="button"
        disabled={disabled}
        onClick={() => onIonInfinite?.({ target: { complete: completeInfiniteScroll } })}
      >
        {children}
      </button>
    ),
    IonInfiniteScrollContent: ({ children }: any) => <>{children}</>,
  };
});

vi.mock('./CommentItem', () => ({
  default: ({ comment }: { comment: { text: string } }) => <div>{comment.text}</div>,
}));

vi.mock('../../hooks/api/refreshments/dynamic-post-content', () => ({
  useGetDynamicPostContent: vi.fn(),
}));

vi.mock('../../hooks/api/refreshments/top-level-comments', () => ({
  useTopLevelCommentsInf: vi.fn(),
}));

vi.mock('../../hooks/api/refreshments/comment-search', () => ({
  useCommentSearch: vi.fn(),
}));

import Comments from './Comments';
import { useGetDynamicPostContent } from '../../hooks/api/refreshments/dynamic-post-content';
import { useTopLevelCommentsInf } from '../../hooks/api/refreshments/top-level-comments';
import { useCommentSearch } from '../../hooks/api/refreshments/comment-search';

const mockDynamicPostContent = vi.mocked(useGetDynamicPostContent);
const mockTopLevelCommentsInf = vi.mocked(useTopLevelCommentsInf);
const mockCommentSearch = vi.mocked(useCommentSearch);

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

  mockCommentSearch.mockReturnValue({
    data: undefined,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetching: false,
  } as any);
});

afterEach(() => {
  localStorage.clear();
});

const renderComments = (sortByRecentActivity = false, isMegathread = true) => {
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
            onViewThread={vi.fn()}
            isMegathread={isMegathread}
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

  it('hides the search bar when comment_count is below 5', () => {
    mockDynamicPostContent.mockReturnValue({ data: { comment_count: 4 } } as any);
    const { container } = renderComments();

    expect(container.querySelector('ion-searchbar')).toBeNull();
  });

  it('hides the search bar when not a megathread', () => {
    mockDynamicPostContent.mockReturnValue({ data: { comment_count: 10 } } as any);
    const { container } = renderComments(false, false);

    expect(container.querySelector('ion-searchbar')).toBeNull();
  });

  it('shows the search bar when comment_count is 5 or more on a megathread', () => {
    mockDynamicPostContent.mockReturnValue({ data: { comment_count: 5 } } as any);
    renderComments();

    expect(screen.getByTestId('comment-searchbar')).toBeInTheDocument();
  });

  it('switches to search results and hides the sort row after debounce', async () => {
    vi.useFakeTimers();
    mockDynamicPostContent.mockReturnValue({ data: { comment_count: 10 } } as any);
    mockCommentSearch.mockReturnValue({
      data: { pages: [{ results: [{ id: 9, text: 'Matching comment' }] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetching: false,
    } as any);

    renderComments();

    await act(async () => {
      fireEvent.input(screen.getByTestId('comment-searchbar'), { target: { value: 'Matching' } });
      vi.advanceTimersByTime(400);
    });

    expect(mockCommentSearch).toHaveBeenLastCalledWith(42, 'Matching');
    expect(screen.getByText('Matching comment')).toBeInTheDocument();
    expect(screen.queryByText('Sort comments by')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('shows the no-results message when search returns empty', async () => {
    vi.useFakeTimers();
    mockDynamicPostContent.mockReturnValue({ data: { comment_count: 10 } } as any);
    mockCommentSearch.mockReturnValue({
      data: { pages: [{ results: [] }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetching: false,
    } as any);

    renderComments();

    await act(async () => {
      fireEvent.input(screen.getByTestId('comment-searchbar'), { target: { value: 'nothing' } });
      vi.advanceTimersByTime(400);
    });

    expect(mockCommentSearch).toHaveBeenLastCalledWith(42, 'nothing');
    expect(screen.getByText(/No comments match/i)).toBeInTheDocument();

    vi.useRealTimers();
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

    renderComments();

    await act(async () => {
      fireEvent.click(screen.getByTestId('comments-infinite-scroll'));
    });

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(completeInfiniteScroll).toHaveBeenCalledTimes(1);
  });
});
