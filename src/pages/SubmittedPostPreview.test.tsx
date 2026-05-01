import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp } from '@ionic/react';

const mockUseLocation = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '42' }),
    useLocation: () => mockUseLocation(),
  };
});

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('../hooks/api/refreshments/submitted-anns', () => ({
  useGetSubmittedAnnouncements: () => ({
    data: { pages: [{ results: [] }] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  }),
}));

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: () => ({ data: { username: 'alex' } }),
}));

vi.mock('../hooks/api/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

vi.mock('../components/GuidelinesButton', () => ({
  default: () => <div>guidelines-button</div>,
}));

vi.mock('../components/CitySelectorModal', () => ({
  default: () => <div>city-selector-modal</div>,
}));

import SubmittedPostPreview from './SubmittedPostPreview';

const renderPage = () => {
  const queryClient = new QueryClient();
  return render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <SubmittedPostPreview />
      </QueryClientProvider>
    </IonApp>
  );
};

describe('SubmittedPostPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({
      state: {
        post: {
          id: 42,
          title: 'Pending post',
          content: 'Body copy',
          byline: 'Alex',
          approval_status: 'pending',
          uploadDateTime: '2099-07-18T00:00:00.000Z',
          interested_count: 9,
        },
      },
    });
  });

  it('does not show interested count in the opened submission preview', async () => {
    renderPage();

    expect(await screen.findByText('Your Submission')).toBeInTheDocument();
    expect(screen.getByText('Interested count')).not.toBeInTheDocument();
    expect(screen.getByText('9')).not.toBeInTheDocument();
  });
});
