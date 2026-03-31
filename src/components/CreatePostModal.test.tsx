import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';

const {
  mockCreateAnnouncement,
  mockAnnouncementUploadPhoto,
  mockApiPost,
  mockInvalidateQueries,
  mockPresentModal,
  mockDismissModal,
  mockModalConfigs,
} = vi.hoisted(() => ({
  mockCreateAnnouncement: vi.fn(),
  mockAnnouncementUploadPhoto: vi.fn(),
  mockApiPost: vi.fn(),
  mockInvalidateQueries: vi.fn(),
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  mockModalConfigs: [] as any[],
}));

let mockGlobalProfile: any = {
  registrationDate: '2020-01-01T00:00:00.000Z',
  username: 'alex',
  preferred_name: 'Alex',
  subscription_level: 'free',
};
let mockModeration: any = {
  paused_on_creation: false,
};
let mockLimits: any = { posts_submitted: 0 };
let mockSiteSettings: any = {
  allow_free_users_to_submit_posts: true,
  settings_community_profile: true,
};
let mockCurrentStreak: any = { streak_count: 0 };
let mockSubmissionSummary: any = {
  totals: {
    approved: 0,
    pending: 0,
    needs_edit: 0,
  },
};
let mockSuggestions: any[] = [];

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');

  return {
    ...actual,
    IonAlert: ({ isOpen, header, subHeader, message, buttons, onDidDismiss }: any) =>
      isOpen ? (
        <div data-testid="ion-alert">
          {header && <div>{header}</div>}
          {subHeader && <div>{subHeader}</div>}
          {message && <div>{message}</div>}
          {(buttons ?? []).map((button: any, index: number) => {
            if (typeof button === 'string') {
              return (
                <button key={`${button}-${index}`} onClick={() => onDidDismiss?.()}>
                  {button}
                </button>
              );
            }
            return (
              <button
                key={`${button.text}-${index}`}
                onClick={async () => {
                  await button.handler?.();
                  onDidDismiss?.();
                }}
              >
                {button.text}
              </button>
            );
          })}
        </div>
      ) : null,
    useIonModal: (_component: any, props: any) => {
      mockModalConfigs.push(props);
      return [mockPresentModal, mockDismissModal];
    },
  };
});

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: (...args: any[]) => mockInvalidateQueries(...args),
    }),
  };
});

vi.mock('../hooks/api/api-client', () => ({
  apiClient: {
    post: (...args: any[]) => mockApiPost(...args),
  },
}));

vi.mock('../hooks/utilities', () => ({
  announcementUploadPhoto: (...args: any[]) => mockAnnouncementUploadPhoto(...args),
  containsPii: vi.fn((value?: string) => /555-111-2222|test@example\.com|123 main street/i.test(value ?? '')),
  containsLinkShortener: vi.fn((value?: string) => /bit\.ly/i.test(value ?? '')),
  containsGoogleDocLink: vi.fn((value?: string) => /docs\.google\.com/i.test(value ?? '')),
  createAnnouncement: (...args: any[]) => mockCreateAnnouncement(...args),
  isCommunityPlus: vi.fn((level?: string) => level === 'community_plus'),
  isPro: vi.fn((level?: string) => level === 'pro'),
}));

vi.mock('../hooks/api/profiles/current-limits', () => ({
  useGetLimits: () => ({ data: mockLimits }),
}));

vi.mock('../hooks/api/sitesettings', () => ({
  useGetSiteSettings: () => ({ data: mockSiteSettings }),
}));

vi.mock('../hooks/api/profiles/global-app-current-profile', () => ({
  useGetGlobalAppCurrentProfile: () => ({ data: mockGlobalProfile, isLoading: false }),
}));

vi.mock('../hooks/api/profiles/current-moderation', () => ({
  useGetCurrentModeration: () => ({ data: mockModeration }),
}));

vi.mock('../hooks/api/refreshments/submission-summary', () => ({
  useGetSubmissionSummary: () => ({ data: mockSubmissionSummary }),
}));

vi.mock('../hooks/api/refreshments/announcement-suggestions', () => ({
  useGetAnnouncementSuggestions: () => ({ data: mockSuggestions, isLoading: false }),
}));

vi.mock('../hooks/api/profiles/current-streak', () => ({
  useGetCurrentStreak: () => ({ data: mockCurrentStreak }),
}));

vi.mock('./CitySelectorModal', () => ({
  default: () => <div>city-selector-modal</div>,
}));

vi.mock('./CroppedPostImageModal', () => ({
  default: () => <div>cropped-post-image-modal</div>,
}));

vi.mock('./ContactDetailsPopover', () => ({
  default: () => <span>contact-details-popover</span>,
}));

vi.mock('./SubmissionAgeGateCard', () => ({
  default: ({ noun, onUpgrade }: { noun: string; onUpgrade: () => void }) => (
    <div>
      <div>{`age-gate-${noun}`}</div>
      <button onClick={onUpgrade}>Upgrade</button>
    </div>
  ),
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: vi.fn() },
  CameraResultType: { Base64: 'base64' },
}));

vi.mock('base64-arraybuffer', () => ({
  decode: vi.fn(() => new ArrayBuffer(0)),
}));

vi.mock('react-image-file-resizer', () => ({
  default: { imageFileResizer: vi.fn() },
}));

import CreatePostModal from './CreatePostModal';
import { annQueryKeys } from '../hooks/api/announcements-take-1/ann-query-keys';

const renderModal = (props?: Partial<React.ComponentProps<typeof CreatePostModal>>) => {
  const queryClient = new QueryClient();
  const onDismiss = vi.fn();
  const onGoToSubmissions = vi.fn();

  const result = render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <CreatePostModal
          preferred_name="Alex"
          username="alex"
          onDismiss={onDismiss}
          onGoToSubmissions={onGoToSubmissions}
          {...props}
        />
      </QueryClientProvider>
    </IonApp>
  );

  return { ...result, onDismiss, onGoToSubmissions };
};

const getItemControl = (container: HTMLElement, labelText: string, selector: string) => {
  const item = Array.from(container.querySelectorAll('ion-item')).find((node) =>
    node.textContent?.includes(labelText)
  );

  if (!item) {
    throw new Error(`Unable to find ion-item for label: ${labelText}`);
  }

  const control = item.querySelector(selector) as HTMLElement | null;
  if (!control) {
    throw new Error(`Unable to find ${selector} for label: ${labelText}`);
  }

  return control;
};

const setIonInput = async (
  element: HTMLElement,
  value: string,
  eventName: 'ionInput' | 'ionChange' = 'ionInput'
) => {
  await act(async () => {
    fireEvent(
      element,
      new CustomEvent(eventName, {
        detail: { value },
        bubbles: true,
      })
    );
  });
};

const setIonSelect = async (element: HTMLElement, value: string) => {
  await act(async () => {
    fireEvent(
      element,
      new CustomEvent('ionChange', {
        detail: { value },
        bubbles: true,
      })
    );
  });
};

const setIonCheckbox = async (element: HTMLElement, checked: boolean) => {
  await act(async () => {
    fireEvent(
      element,
      new CustomEvent('ionChange', {
        detail: { checked },
        bubbles: true,
      })
    );
  });
};

const flushSuggestionTimer = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
  });
};

const fillBasicPostFields = async (container: HTMLElement, category = 'mingle', title = 'Mask swap meetup') => {
  await setIonInput(getItemControl(container, 'Title*', 'ion-input'), title);
  await flushSuggestionTimer();
  await setIonSelect(getItemControl(container, 'Category*', 'ion-select'), category);
  await setIonInput(getItemControl(container, 'Post Content*', 'ion-textarea'), 'Sharing details with the community.');
};

describe('CreatePostModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModalConfigs.length = 0;
    mockGlobalProfile = {
      registrationDate: '2020-01-01T00:00:00.000Z',
      username: 'alex',
      preferred_name: 'Alex',
      subscription_level: 'free',
    };
    mockModeration = { paused_on_creation: false };
    mockLimits = { posts_submitted: 0 };
    mockSiteSettings = {
      allow_free_users_to_submit_posts: true,
      settings_community_profile: true,
    };
    mockCurrentStreak = { streak_count: 0 };
    mockSubmissionSummary = {
      totals: { approved: 0, pending: 0, needs_edit: 0 },
    };
    mockSuggestions = [];
    mockCreateAnnouncement.mockResolvedValue({ data: { announcement_id: 42 } });
    mockAnnouncementUploadPhoto.mockResolvedValue(undefined);
    mockApiPost.mockResolvedValue({ data: { event_id: 9 } });
  });

  it('shows the age gate for new accounts', () => {
    mockGlobalProfile = {
      ...mockGlobalProfile,
      registrationDate: '2026-03-25T00:00:00.000Z',
    };

    renderModal();

    expect(screen.getByText('age-gate-post')).toBeInTheDocument();
  });

  it('blocks post submission when moderation suspends posting and routes to activity', () => {
    mockModeration = {
      paused_on_creation: false,
      moderator_deactivated: true,
    };

    renderModal();

    expect(screen.getByText('Your account is currently suspended from posting.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('View Activity'));
    expect(window.location.pathname).toBe('/activity');
  });

  it('submits a regular post and dismisses after the success alert closes', async () => {
    const { container, onDismiss } = renderModal();

    await fillBasicPostFields(container, 'mingle');
    await setIonCheckbox(getItemControl(container, 'I understand.', 'ion-checkbox'), true);

    fireEvent.click(screen.getByText('Submit Post'));

    await waitFor(() => {
      expect(mockCreateAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Mask swap meetup',
          category: 'mingle',
          content: 'Sharing details with the community.',
          include_profile: 'true',
        })
      );
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: annQueryKeys.submitted });
    expect(await screen.findByText('Your post has been submitted and is now pending approval!')).toBeInTheDocument();

    fireEvent.click(screen.getByText('OK'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('saves a draft for Community+ users', async () => {
    mockGlobalProfile = {
      ...mockGlobalProfile,
      subscription_level: 'community_plus',
    };
    const { container } = renderModal();

    await fillBasicPostFields(container, 'mingle');

    fireEvent.click(screen.getByText('Save draft'));

    await waitFor(() => {
      expect(mockCreateAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Mask swap meetup',
          category: 'mingle',
          draft: 'true',
        })
      );
    });
    expect(await screen.findByText('Draft saved!')).toBeInTheDocument();
  });

  it('shows existing-post suggestions and routes to the selected post after confirmation', async () => {
    mockSuggestions = [
      { id: 88, title: 'Mask swap meetup', like_count: 3, comment_count: 1, category: 'mingle' },
    ];
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const { container, onDismiss } = renderModal();

    await setIonInput(getItemControl(container, 'Title*', 'ion-input'), 'Mask swap meetup');
    await flushSuggestionTimer();

    fireEvent.click(await screen.findByText('Mask swap meetup'));
    expect(await screen.findByText('Open this post?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Go to post'));

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/community/88');
      expect(dispatchSpy).toHaveBeenCalled();
    });
  });

  it('shows the previous-submissions shortcut when submission history exists', async () => {
    mockSubmissionSummary = {
      totals: { approved: 1, pending: 0, needs_edit: 0 },
    };
    const { onGoToSubmissions } = renderModal();

    fireEvent.click(await screen.findByText('View my previous submissions'));

    await waitFor(() => {
      expect(onGoToSubmissions).toHaveBeenCalled();
    });
  });

  it('closes the suggestion confirm without navigating when cancelled', async () => {
    mockSuggestions = [
      { id: 88, title: 'Mask swap meetup', like_count: 3, comment_count: 1, category: 'mingle' },
    ];
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const { container, onDismiss } = renderModal();

    await setIonInput(getItemControl(container, 'Title*', 'ion-input'), 'Mask swap meetup');
    await flushSuggestionTimer();

    fireEvent.click(await screen.findByText('Mask swap meetup'));
    expect(await screen.findByText('Open this post?')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Keep editing'));
    });

    expect(screen.queryByText('Open this post?')).not.toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it('warns before submitting an event-category post without full event details and can continue without creating a calendar entry', async () => {
    const { container } = renderModal();

    await fillBasicPostFields(container, 'events');
    await setIonCheckbox(getItemControl(container, 'I understand.', 'ion-checkbox'), true);

    fireEvent.click(screen.getByText('Submit Post'));

    expect(await screen.findByText('Incomplete event details')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Submit post anyway'));

    await waitFor(() => {
      expect(mockCreateAnnouncement).toHaveBeenCalledTimes(1);
    });
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('lets the user continue editing when the incomplete event warning is cancelled', async () => {
    const { container } = renderModal();

    await fillBasicPostFields(container, 'events');
    await setIonCheckbox(getItemControl(container, 'I understand.', 'ion-checkbox'), true);

    fireEvent.click(screen.getByText('Submit Post'));

    expect(await screen.findByText('Incomplete event details')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getAllByText('Cancel').at(-1)!);
    });

    expect(screen.queryByText('Incomplete event details')).not.toBeInTheDocument();
    expect(mockCreateAnnouncement).not.toHaveBeenCalled();
  });

  it('submits the linked event payload when an event post has complete event details', async () => {
    const { container } = renderModal();

    await fillBasicPostFields(container, 'events');
    await setIonSelect(getItemControl(container, 'Event type', 'ion-select'), 'virtual_only');
    await setIonInput(getItemControl(container, 'Event start', 'ion-input'), '2099-07-20T18:00');
    await setIonInput(getItemControl(container, 'Event end', 'ion-input'), '2099-07-20T19:00');
    await setIonCheckbox(getItemControl(container, 'I understand.', 'ion-checkbox'), true);

    fireEvent.click(screen.getByText('Submit Post'));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/event/', expect.objectContaining({
        name: 'Mask swap meetup',
        description: 'Sharing details with the community.',
        start_datetime: '2099-07-20T18:00',
        end_datetime: '2099-07-20T19:00',
        event_type: 'virtual_only',
        post: 42,
      }));
    });
  });

  it('shows inline date validation errors for invalid event timing', async () => {
    const { container } = renderModal();

    await fillBasicPostFields(container, 'events');
    await setIonSelect(getItemControl(container, 'Event type', 'ion-select'), 'virtual_only');
    await setIonInput(getItemControl(container, 'Event start', 'ion-input'), '2099-07-20T19:00');
    await setIonInput(getItemControl(container, 'Event end', 'ion-input'), '2099-07-20T18:00');
    await setIonCheckbox(getItemControl(container, 'I understand.', 'ion-checkbox'), true);

    fireEvent.click(screen.getByText('Submit Post'));

    expect(await screen.findByText('End date can’t be before the start date.')).toBeInTheDocument();
    expect(mockCreateAnnouncement).not.toHaveBeenCalled();
  });

  it('shows the recurring-upgrade alert for free users on event posts', async () => {
    const { container } = renderModal();

    await fillBasicPostFields(container, 'events');
    await setIonSelect(getItemControl(container, 'Repeat', 'ion-select'), 'weekly');

    expect(await screen.findByText('Recurring events')).toBeInTheDocument();
    expect(screen.getByText('Join Community+ or Pro to post recurring events.')).toBeInTheDocument();
  });

  it('preselects the initial category when one is provided', () => {
    const { container } = renderModal({ initialCategory: 'science' });

    expect(getItemControl(container, 'Category*', 'ion-select')).toHaveAttribute('value', 'science');
  });

  it('shows the housing rule warning and keeps submit disabled for anonymous housing posts', async () => {
    const { container } = renderModal();

    await setIonCheckbox(getItemControl(container, 'Local Post', 'ion-checkbox'), true);
    await fillBasicPostFields(container, 'housing');
    await setIonSelect(getItemControl(container, 'Byline*', 'ion-select'), 'Anonymous');
    await setIonCheckbox(getItemControl(container, 'I understand.', 'ion-checkbox'), true);

    expect(
      await screen.findByText('For Housing posts, Byline cannot be "Anonymous" and "Show Profile" must be enabled.')
    ).toBeInTheDocument();
    expect(screen.getByText('Submit Post')).toBeDisabled();
  });

  it('shows the inline contact warning and disables submit when PII is present', async () => {
    const { container } = renderModal();

    await fillBasicPostFields(container, 'mingle');
    await setIonInput(getItemControl(container, 'Post Content*', 'ion-textarea'), 'Email me at test@example.com.');
    await setIonCheckbox(getItemControl(container, 'I understand.', 'ion-checkbox'), true);

    expect(
      await screen.findByText(
        'Posts cannot contain private personal contact information. Please remove details like phone numbers or emails before submitting.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Submit Post')).toBeDisabled();
  });

  it('blocks link shorteners in the optional link field', async () => {
    const { container } = renderModal();

    await fillBasicPostFields(container, 'mingle');
    await setIonInput(getItemControl(container, 'Link (optional)', 'ion-input'), 'https://bit.ly/mask-swap');
    await setIonCheckbox(getItemControl(container, 'I understand.', 'ion-checkbox'), true);

    expect(
      await screen.findByText(
        "Link shorteners aren't allowed. Please use the full link so members can see where they're clicking."
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Submit Post')).toBeDisabled();
  });

  it('blocks Google Docs links in post content', async () => {
    const { container } = renderModal();

    await fillBasicPostFields(container, 'mingle');
    await setIonInput(
      getItemControl(container, 'Post Content*', 'ion-textarea'),
      'Read the details here: https://docs.google.com/document/d/example'
    );
    await setIonCheckbox(getItemControl(container, 'I understand.', 'ion-checkbox'), true);

    expect(
      await screen.findByText(
        'This link isn’t allowed. It may expose or track viewers or collect data in without a clear privacy policy.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Submit Post')).toBeDisabled();
  });

  it('treats an address in the post body as blocked PII', async () => {
    const { container } = renderModal();

    await fillBasicPostFields(container, 'mingle');
    await setIonInput(getItemControl(container, 'Post Content*', 'ion-textarea'), 'Meet me at 123 Main Street.');
    await setIonCheckbox(getItemControl(container, 'I understand.', 'ion-checkbox'), true);

    expect(
      await screen.findByText(
        'Posts cannot contain private personal contact information. Please remove details like phone numbers or emails before submitting.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Submit Post')).toBeDisabled();
  });

  it('opens the city selector for local posts and populates the selected city on dismiss', async () => {
    const { container } = renderModal();

    await setIonCheckbox(getItemControl(container, 'Local Post', 'ion-checkbox'), true);
    fireEvent.click(getItemControl(container, 'Nearby City', 'ion-input'));
    expect(mockPresentModal).toHaveBeenCalled();

    const citySelectorConfig = mockModalConfigs[0];
    await act(async () => {
      citySelectorConfig.onDismiss({ name: 'Queens', lat: 40.7282, lng: -73.7949 });
    });

    await waitFor(() => {
      expect(getItemControl(container, 'Location label', 'ion-input')).toHaveAttribute('value', 'Queens');
    });
  });

  it('allows an address in location label and submits it as the local post location', async () => {
    const { container } = renderModal();

    await setIonCheckbox(getItemControl(container, 'Local Post', 'ion-checkbox'), true);
    const citySelectorConfig = mockModalConfigs[0];
    await act(async () => {
      citySelectorConfig.onDismiss({ name: 'Queens', lat: 40.7282, lng: -73.7949 });
    });

    await fillBasicPostFields(container, 'mingle');
    await setIonInput(getItemControl(container, 'Location label', 'ion-input'), '123 Main Street, Queens');
    await setIonCheckbox(getItemControl(container, 'I understand.', 'ion-checkbox'), true);

    fireEvent.click(screen.getByText('Submit Post'));

    await waitFor(() => {
      expect(mockCreateAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({
          local_only: 'true',
          location: '123 Main Street, Queens',
          location_point_lat: 40.7282,
          location_point_long: -73.7949,
        })
      );
    });
    expect(screen.queryByText('Posts cannot contain private personal contact information. Please remove details like phone numbers or emails before submitting.')).not.toBeInTheDocument();
  });

  it('adds supportive comment instructions for family posts when requested', async () => {
    const { container } = renderModal();

    await fillBasicPostFields(container, 'families', 'Family masking meetup');
    await setIonCheckbox(getItemControl(container, 'Request Supportive Comments Only', 'ion-checkbox'), true);
    await setIonCheckbox(getItemControl(container, 'I understand.', 'ion-checkbox'), true);

    fireEvent.click(screen.getByText('Submit Post'));

    await waitFor(() => {
      expect(mockCreateAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'families',
          comment_instructions: 'Supportive comments only please!',
        })
      );
    });
  });

  it('shows the profile-settings note in the success alert when show profile is enabled but hidden in settings', async () => {
    mockSiteSettings = {
      ...mockSiteSettings,
      settings_community_profile: false,
    };
    const { container } = renderModal();

    await fillBasicPostFields(container, 'mingle');
    await setIonCheckbox(getItemControl(container, 'I understand.', 'ion-checkbox'), true);

    fireEvent.click(screen.getByText('Submit Post'));

    expect(
      await screen.findByText(
        'Note: You chose “Show Profile,” but your post won\'t show until you turn on Connect from Refreshments in your Me tab > Settings.'
      )
    ).toBeInTheDocument();
  });

  it('shows a draft save error when saving a draft fails', async () => {
    mockGlobalProfile = {
      ...mockGlobalProfile,
      subscription_level: 'community_plus',
    };
    mockCreateAnnouncement.mockRejectedValueOnce(new Error('draft failed'));
    const { container } = renderModal();

    await fillBasicPostFields(container, 'mingle');

    fireEvent.click(screen.getByText('Save draft'));

    expect(await screen.findByText('Could not save draft.')).toBeInTheDocument();
  });

  it('shows a recurring same-day end-time error for invalid custom event dates', async () => {
    mockGlobalProfile = {
      ...mockGlobalProfile,
      subscription_level: 'community_plus',
    };
    const { container } = renderModal();

    await fillBasicPostFields(container, 'events');
    await setIonSelect(getItemControl(container, 'Event type', 'ion-select'), 'virtual_only');
    await setIonInput(getItemControl(container, 'Event start', 'ion-input'), '2099-07-20T18:00');
    await setIonInput(getItemControl(container, 'Event end', 'ion-input'), '2099-07-20T19:00');
    await setIonSelect(getItemControl(container, 'Repeat', 'ion-select'), 'custom');

    fireEvent.click(screen.getByText('Add another date'));

    const datetimeInputs = Array.from(container.querySelectorAll('ion-input')).filter((node) =>
      node.getAttribute('type') === 'datetime-local'
    );
    await setIonInput(datetimeInputs[2] as unknown as HTMLElement, '2099-07-27T18:00');
    await setIonInput(datetimeInputs[3] as unknown as HTMLElement, '2099-07-28T18:00');
    await setIonCheckbox(getItemControl(container, 'I understand.', 'ion-checkbox'), true);

    fireEvent.click(screen.getByText('Submit Post'));

    expect(await screen.findByText('Recurring date end times must be on the same day.')).toBeInTheDocument();
    expect(mockCreateAnnouncement).not.toHaveBeenCalled();
  });

  it('falls back to the submitted posts route when no submissions callback is provided', async () => {
    mockSubmissionSummary = {
      totals: { approved: 1, pending: 1, needs_edit: 0 },
    };
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const { onDismiss } = renderModal({ onGoToSubmissions: undefined as any });

    fireEvent.click(await screen.findByText('View my previous submissions'));

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/community/submitted');
      expect(dispatchSpy).toHaveBeenCalled();
    });
  });

  it('opens the age-gate upgrade flow for new accounts', () => {
    mockGlobalProfile = {
      ...mockGlobalProfile,
      registrationDate: '2026-03-25T00:00:00.000Z',
    };

    renderModal();

    fireEvent.click(screen.getByText('Upgrade'));

    expect(window.location.pathname).toBe('/store');
  });
});
