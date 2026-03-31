import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp } from '@ionic/react';

const {
  likeAnnouncement,
  unlikeAnnouncement,
  increaseStreak,
} = vi.hoisted(() => ({
  likeAnnouncement: vi.fn(),
  unlikeAnnouncement: vi.fn(),
  increaseStreak: vi.fn(),
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

vi.mock('../../hooks/utilities', () => ({
  increaseStreak: (...args: any[]) => increaseStreak(...args),
  likeAnnouncement: (...args: any[]) => likeAnnouncement(...args),
  unlikeAnnouncement: (...args: any[]) => unlikeAnnouncement(...args),
  onImgError: vi.fn(),
}));

vi.mock('../../hooks/api/refreshments/comments-not-shown', () => ({
  useGetCommentsNotShownCount: vi.fn(),
}));

vi.mock('../../hooks/api/refreshments/static-post-content', () => ({
  useGetStaticPostContent: vi.fn(),
}));

vi.mock('../../hooks/api/refreshments/dynamic-post-content', () => ({
  useGetDynamicPostContent: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/settings-current-profile', () => ({
  useGetSettingsCurrentProfile: vi.fn(),
}));

vi.mock('../../hooks/api/profiles/refreshments-current-profile', () => ({
  useGetRefreshmentsCurrentProfile: vi.fn(),
}));

vi.mock('./Polls/Poll', () => ({
  default: () => <div>poll</div>,
}));

import RefreshmentsPost from './RefreshmentsPost';
import { useGetCommentsNotShownCount } from '../../hooks/api/refreshments/comments-not-shown';
import { useGetStaticPostContent } from '../../hooks/api/refreshments/static-post-content';
import { useGetDynamicPostContent } from '../../hooks/api/refreshments/dynamic-post-content';
import { useGetSettingsCurrentProfile } from '../../hooks/api/profiles/settings-current-profile';
import { useGetRefreshmentsCurrentProfile } from '../../hooks/api/profiles/refreshments-current-profile';

const mockCommentsNotShownCount = vi.mocked(useGetCommentsNotShownCount);
const mockStaticPostContent = vi.mocked(useGetStaticPostContent);
const mockDynamicPostContent = vi.mocked(useGetDynamicPostContent);
const mockSettingsProfile = vi.mocked(useGetSettingsCurrentProfile);
const mockRefreshmentsProfile = vi.mocked(useGetRefreshmentsCurrentProfile);

const baseStaticPost = {
  id: 42,
  category: 'events',
  pinned: true,
  location: 'Brooklyn',
  local_only: true,
  title: 'Spring picnic',
  markdown: false,
  preview: '',
  content: 'Bring a blanket.',
  coverPhoto: null,
  coverPhoto_alt: '',
  user: 12,
  sensitive: false,
  sensitive_description: '',
  poll: null,
};

const renderPost = () => {
  const queryClient = new QueryClient();

  return render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <RefreshmentsPost post_id={42} />
      </QueryClientProvider>
    </IonApp>
  );
};

const expectCategoryLabel = (
  category: string | null | undefined,
  label: string,
  color: string,
) => {
  mockStaticPostContent.mockReturnValue({
    data: {
      ...baseStaticPost,
      category,
    },
  } as any);

  const { container } = renderPost();
  const categoryLabel = container.querySelector('.refreshments-category-label');
  const categoryMarker = container.querySelector('.refreshments-category');

  expect(categoryLabel).toHaveTextContent(label);
  expect(categoryLabel).toHaveAttribute('color', color);
  expect(categoryMarker).toHaveAttribute('color', color);
};

beforeEach(() => {
  vi.clearAllMocks();

  likeAnnouncement.mockResolvedValue(undefined);
  unlikeAnnouncement.mockResolvedValue(undefined);
  increaseStreak.mockResolvedValue(undefined);

  mockCommentsNotShownCount.mockReturnValue({ data: 1 } as any);
  mockStaticPostContent.mockReturnValue({ data: baseStaticPost } as any);
  mockDynamicPostContent.mockReturnValue({ data: { like_count: 2, comment_count: 4 } } as any);
  mockSettingsProfile.mockReturnValue({
    data: { settings_show_sensitive_content: true },
    isLoading: false,
  } as any);
  mockRefreshmentsProfile.mockReturnValue({
    data: { likes: [], hidden_announcements: [], hidden_authors: [] },
    isLoading: false,
  } as any);
});

describe('RefreshmentsPost', () => {
  it('renders the post summary and visible comment count', () => {
    renderPost();

    expect(screen.getByText('Spring picnic')).toBeInTheDocument();
    expect(screen.getByText('Bring a blanket.')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /spring picnic/i })).toHaveAttribute('href', '/community/42');
  });

  it('shows the hidden-post state and suppresses the like/comment footer when the post or author is hidden', () => {
    mockRefreshmentsProfile.mockReturnValue({
      data: { likes: [], hidden_announcements: [42], hidden_authors: [] },
      isLoading: false,
    } as any);

    const { container } = renderPost();

    expect(screen.getByText('You have hidden this post or author.')).toBeInTheDocument();
    expect(screen.getByText('Show anyway')).toBeInTheDocument();
    expect(container.querySelector('ion-button[aria-label="Like post"]')).toBeNull();
  });

  it('shows the hidden-post state when the author is hidden even if the post itself is not', () => {
    mockRefreshmentsProfile.mockReturnValue({
      data: { likes: [], hidden_announcements: [], hidden_authors: [12] },
      isLoading: false,
    } as any);

    const { container } = renderPost();

    expect(screen.getByText('You have hidden this post or author.')).toBeInTheDocument();
    expect(container.querySelector('.post-likes ion-text')).toBeNull();
  });

  it('shows the sensitive-content gate when the viewer has it disabled', () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...baseStaticPost,
        sensitive: true,
        sensitive_description: 'CW: medical discussion',
      },
    } as any);
    mockSettingsProfile.mockReturnValue({
      data: { settings_show_sensitive_content: false },
      isLoading: false,
    } as any);

    renderPost();

    expect(screen.getByText('This post contains sensitive content.')).toBeInTheDocument();
    expect(screen.getByText('CW: medical discussion')).toBeInTheDocument();
    expect(screen.queryByText('Bring a blanket.')).not.toBeInTheDocument();
  });

  it('hides the optional sensitive description when one is not provided', () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...baseStaticPost,
        sensitive: true,
        sensitive_description: '',
      },
    } as any);
    mockSettingsProfile.mockReturnValue({
      data: { settings_show_sensitive_content: false },
      isLoading: false,
    } as any);

    renderPost();

    expect(screen.getByText('This post contains sensitive content.')).toBeInTheDocument();
    expect(screen.queryByText('CW: medical discussion')).not.toBeInTheDocument();
  });

  it('likes the post when the heart button is pressed', async () => {
    const { container } = renderPost();

    const likeButton = container.querySelector('ion-button[aria-label="Like post"]') as HTMLElement;
    expect(likeButton).toBeTruthy();
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(likeAnnouncement).toHaveBeenCalledTimes(1);
      expect(likeAnnouncement).toHaveBeenCalledWith(42);
    });
    expect(increaseStreak).toHaveBeenCalledTimes(1);
  });

  it('unlikes the post when it is already liked by the viewer', async () => {
    mockRefreshmentsProfile.mockReturnValue({
      data: { likes: [42], hidden_announcements: [], hidden_authors: [] },
      isLoading: false,
    } as any);

    const { container } = renderPost();

    const unlikeButton = container.querySelector('ion-button[aria-label="Unlike post"]') as HTMLElement;
    expect(unlikeButton).toBeTruthy();
    fireEvent.click(unlikeButton);

    await waitFor(() => {
      expect(unlikeAnnouncement).toHaveBeenCalledWith(42);
    });
  });

  it('still renders the post as liked after reopening with refreshed likes data', async () => {
    const firstRender = renderPost();

    const likeButton = firstRender.container.querySelector(
      'ion-button[aria-label="Like post"]'
    ) as HTMLElement;
    expect(likeButton).toBeTruthy();

    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(likeAnnouncement).toHaveBeenCalledWith(42);
    });

    firstRender.unmount();

    mockRefreshmentsProfile.mockReturnValue({
      data: { likes: [42], hidden_announcements: [], hidden_authors: [] },
      isLoading: false,
    } as any);

    const reopened = renderPost();

    expect(
      reopened.container.querySelector('ion-button[aria-label="Unlike post"]')
    ).toBeTruthy();
    expect(
      reopened.container.querySelector('ion-button[aria-label="Like post"]')
    ).toBeNull();
  });

  it('renders markdown preview text instead of full content for markdown posts', () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...baseStaticPost,
        markdown: true,
        preview: 'Preview snippet',
        content: 'Full markdown body',
      },
    } as any);

    renderPost();

    expect(screen.getByText('Preview snippet')).toBeInTheDocument();
    expect(screen.queryByText('Full markdown body')).not.toBeInTheDocument();
  });

  it('renders the cover photo branch and hides zero counts in the footer', () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...baseStaticPost,
        coverPhoto: 'https://example.com/cover.jpg',
        coverPhoto_alt: 'Picnic table',
      },
    } as any);
    mockDynamicPostContent.mockReturnValue({ data: { like_count: 0, comment_count: 1 } } as any);
    mockCommentsNotShownCount.mockReturnValue({ data: 1 } as any);

    const { container } = renderPost();

    expect(screen.getByAltText('Picnic table')).toBeInTheDocument();
    expect(container.querySelector('.post-likes ion-text')).toBeNull();
  });

  it('renders the poll component when the post has a poll', () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...baseStaticPost,
        poll: 88,
      },
    } as any);

    renderPost();

    expect(screen.getByText('poll')).toBeInTheDocument();
  });

  it('omits the pinned and local badges when those flags are false', () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...baseStaticPost,
        pinned: false,
        local_only: false,
      },
    } as any);

    const { container } = renderPost();

    expect(container.querySelector('[title="pinned post"]')).toBeNull();
    expect(container.querySelector('[title="local"]')).toBeNull();
  });

  it('falls back to an empty preview string for markdown posts without a preview', () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...baseStaticPost,
        markdown: true,
        preview: null,
      },
    } as any);

    renderPost();

    expect(screen.getByText('Spring picnic')).toBeInTheDocument();
    expect(screen.queryByText('Bring a blanket.')).not.toBeInTheDocument();
  });

  it('falls back to the default cover photo alt text when none is provided', () => {
    mockStaticPostContent.mockReturnValue({
      data: {
        ...baseStaticPost,
        coverPhoto: 'https://example.com/cover.jpg',
        coverPhoto_alt: '',
      },
    } as any);

    renderPost();

    expect(screen.getByAltText('Cover Photo')).toBeInTheDocument();
  });

  it('maps supported categories to their visible labels', () => {
    expectCategoryLabel('science', 'STEAM', 'tertiary');
  });

  it('maps families category to its label', () => {
    expectCategoryLabel('families', 'Families', 'families');
  });

  it('maps pop category to its label', () => {
    expectCategoryLabel('pop', 'Pop', 'pop');
  });

  it('maps mingle category to its label', () => {
    expectCategoryLabel('mingle', 'Mingle', 'secondary');
  });

  it('maps change category to its label', () => {
    expectCategoryLabel('change', 'Change', 'change');
  });

  it('maps long covid category to its label', () => {
    expectCategoryLabel('longcovid', 'Long Covid', 'longcovid');
  });

  it('maps newcomers category to its label', () => {
    expectCategoryLabel('newcomers', 'Newcomers', 'newcomers');
  });

  it('maps book category to its label', () => {
    expectCategoryLabel('book', 'Book Club', 'pop');
  });

  it('maps housing category to its label', () => {
    expectCategoryLabel('housing', 'Housing', 'secondary');
  });

  it('maps recommendations category to its label', () => {
    expectCategoryLabel('recommendations', 'Recommendations', 'secondary');
  });

  it('maps events category to its label', () => {
    expectCategoryLabel('events', 'Events', 'secondary');
  });

  it('falls back to refreshments for unknown categories', () => {
    expectCategoryLabel('unknown', 'Refreshments', 'primary');
  });
});
