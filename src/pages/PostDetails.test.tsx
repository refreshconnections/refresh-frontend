import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';

const {
  mockGetAnnouncementDetails,
  mockAddComment,
  mockLikeComment,
  mockUnlikeComment,
  mockPresentModal,
  mockDismissModal,
  mockSheetPresent,
  mockSheetDismiss,
} = vi.hoisted(() => ({
  mockGetAnnouncementDetails: vi.fn(),
  mockAddComment: vi.fn(),
  mockLikeComment: vi.fn(),
  mockUnlikeComment: vi.fn(),
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  mockSheetPresent: vi.fn(),
  mockSheetDismiss: vi.fn(),
}));

let mockCurrentProfile: any = {
  user: 99,
  username: 'alex',
  settings_community_profile: true,
};

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    useIonModal: () => [mockPresentModal, mockDismissModal],
  };
});

vi.mock('../hooks/useSheetModal', () => ({
  useSheetModal: () => [mockSheetPresent, mockSheetDismiss],
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: () => ({ data: mockCurrentProfile }),
}));

vi.mock('../hooks/utilities', () => ({
  getAvatarDisplay: vi.fn(() => ({ src: 'https://example.com/avatar.jpg', className: 'avatar-ok' })),
  onImgError: vi.fn(),
  getAnnouncementDetails: (...args: any[]) => mockGetAnnouncementDetails(...args),
  addComment: (...args: any[]) => mockAddComment(...args),
  unlikeComment: (...args: any[]) => mockUnlikeComment(...args),
  likeComment: (...args: any[]) => mockLikeComment(...args),
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('../components/ReportModal', () => ({ default: () => <div>report-modal</div> }));
vi.mock('../components/CommunityProfileModal', () => ({ default: () => <div>community-profile-modal</div> }));
vi.mock('../components/ProfileCard', () => ({ default: () => <div>profile-card</div> }));

import PostDetails from './PostDetails';

const baseComments = [
  {
    id: 1,
    approved: true,
    text: 'First comment',
    username: 'sam',
    user: 3,
    profile_image: 'https://example.com/sam.jpg',
    settings_community_profile: true,
    liked_by: [],
    uploadDateTime: Date.now(),
  },
  {
    id: 2,
    approved: true,
    text: 'Second comment',
    username: 'alex',
    user: 99,
    profile_image: null,
    settings_community_profile: true,
    liked_by: [99],
    uploadDateTime: Date.now(),
  },
];

const renderPage = (comments = baseComments) => {
  const queryClient = new QueryClient();
  return render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <PostDetails comments={comments} announcement_id={77} />
      </QueryClientProvider>
    </IonApp>
  );
};

describe('PostDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentProfile = {
      user: 99,
      username: 'alex',
      settings_community_profile: true,
    };
    mockGetAnnouncementDetails.mockResolvedValue({
      closed: false,
      comments: baseComments,
    });
    mockAddComment.mockResolvedValue({});
    mockLikeComment.mockResolvedValue({});
    mockUnlikeComment.mockResolvedValue({});
  });

  it('renders approved comments and opens the community profile sheet for non-anonymous authors', async () => {
    renderPage();

    expect(await screen.findByText('First comment')).toBeInTheDocument();
    fireEvent.click(screen.getByText('sam'));

    await waitFor(() => {
      expect(mockSheetPresent).toHaveBeenCalledWith({ cssClass: 'community-profile-modal' });
    });
  });

  it('creates a comment and refreshes the details list', async () => {
    renderPage();

    await screen.findByText('First comment');
    const textarea = document.querySelector('ion-textarea') as HTMLElement;
    fireEvent(textarea, new CustomEvent('ionChange', { detail: { value: 'A new reply' }, bubbles: true }));
    fireEvent.click(document.querySelector('.send-button') as HTMLElement);

    await waitFor(() => {
      expect(mockAddComment).toHaveBeenCalledWith({ announcement: 77, text: 'A new reply' });
    });
    expect(mockGetAnnouncementDetails).toHaveBeenCalledWith(77);
  });

  it('likes and unlikes comments, refreshing details each time', async () => {
    renderPage();

    await screen.findByText('First comment');
    const buttons = Array.from(document.querySelectorAll('ion-item ion-button')) as HTMLElement[];
    fireEvent.click(buttons[0]);
    await waitFor(() => {
      expect(mockLikeComment).toHaveBeenCalledWith(1);
    });

    fireEvent.click(buttons[1]);
    await waitFor(() => {
      expect(mockUnlikeComment).toHaveBeenCalledWith(2);
    });
  });

  it('opens the report modal for another user comment', async () => {
    renderPage();

    await screen.findByText('First comment');
    const alertButtons = Array.from(document.querySelectorAll('ion-item-option ion-button')) as HTMLElement[];
    fireEvent.click(alertButtons[0]);

    await waitFor(() => {
      expect(mockPresentModal).toHaveBeenCalled();
    });
  });
});
