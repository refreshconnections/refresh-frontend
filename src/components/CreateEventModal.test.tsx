import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';

const {
  mockApiPost,
  mockEventUploadPhoto,
  mockPresentModal,
  mockDismissModal,
  mockPresentPopover,
  mockDismissPopover,
  mockPush,
  mockModalConfigs,
} = vi.hoisted(() => ({
  mockApiPost: vi.fn(),
  mockEventUploadPhoto: vi.fn(),
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  mockPresentPopover: vi.fn(),
  mockDismissPopover: vi.fn(),
  mockPush: vi.fn(),
  mockModalConfigs: [] as any[],
}));

let mockGlobalProfile: any = {
  registrationDate: '',
  username: 'alex',
  preferred_name: 'Alex',
  subscription_level: 'free',
};
let mockModeration: any = {
  paused_on_creation: false,
};

const daysAgoIso = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');

  return {
    ...actual,
    IonApp: ({ children }: any) => <div>{children}</div>,
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
    useIonPopover: () => [mockPresentPopover, mockDismissPopover],
    useIonRouter: () => ({ push: mockPush }),
  };
});

vi.mock('../hooks/api/api-client', () => ({
  apiClient: {
    post: (...args: any[]) => mockApiPost(...args),
  },
}));

vi.mock('../hooks/utilities', () => ({
  containsPii: vi.fn((value?: string) => /555-111-2222|test@example\.com|123 main street/i.test(value ?? '')),
  containsLinkShortener: vi.fn((value?: string) => /bit\.ly/i.test(value ?? '')),
  containsGoogleDocLink: vi.fn((value?: string) => /docs\.google\.com/i.test(value ?? '')),
  eventUploadPhoto: (...args: any[]) => mockEventUploadPhoto(...args),
  isCommunityPlus: vi.fn((level?: string) => level === 'community_plus'),
  isPro: vi.fn((level?: string) => level === 'pro'),
}));

vi.mock('../hooks/api/profiles/global-app-current-profile', () => ({
  useGetGlobalAppCurrentProfile: () => ({ data: mockGlobalProfile }),
}));

vi.mock('../hooks/api/profiles/current-moderation', () => ({
  useGetCurrentModeration: () => ({ data: mockModeration }),
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('./SubmissionAgeGateCard', () => ({
  default: ({ noun, onUpgrade }: { noun: string; onUpgrade: () => void }) => (
    <div>
      <div>{`age-gate-${noun}`}</div>
      <button onClick={onUpgrade}>Upgrade</button>
    </div>
  ),
}));

vi.mock('./CitySelectorModal', () => ({
  default: () => <div>city-selector-modal</div>,
}));

vi.mock('./CreatePostModal', () => ({
  default: () => <div>create-post-modal</div>,
}));

import CreateEventModal from './CreateEventModal';

const renderModal = (props?: Partial<React.ComponentProps<typeof CreateEventModal>>) => {
  const queryClient = new QueryClient();
  const onDismiss = vi.fn();

  const result = render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <CreateEventModal onDismiss={onDismiss} {...props} />
      </QueryClientProvider>
    </IonApp>
  );

  return { ...result, onDismiss };
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

const setIonInput = (element: HTMLElement, value: string, eventName: 'ionInput' | 'ionChange' = 'ionInput') => {
  fireEvent(
    element,
    new CustomEvent(eventName, {
      detail: { value },
      bubbles: true,
    })
  );
};

const setIonSelect = (element: HTMLElement, value: string) => {
  fireEvent(
    element,
    new CustomEvent('ionChange', {
      detail: { value },
      bubbles: true,
    })
  );
};

const getReactProps = (el: HTMLElement) => {
  const key = Object.keys(el).find((entry) => entry.startsWith('__reactProps'));
  return key ? (el as any)[key] : undefined;
};

const clickIonicElement = async (el: HTMLElement) => {
  fireEvent.click(el);
  const onClick = getReactProps(el)?.onClick;
  if (typeof onClick === 'function') {
    await act(async () => {
      await onClick({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        nativeEvent: new MouseEvent('click'),
      });
    });
  }
};

const fillRequiredEventFields = (container: HTMLElement, start: string, end: string) => {
  setIonInput(getItemControl(container, 'Event name', 'ion-input'), 'Masked picnic');
  setIonInput(getItemControl(container, 'Description', 'ion-textarea'), 'Bring your own snacks and air purifier.');
  setIonSelect(getItemControl(container, 'Event type', 'ion-select'), 'virtual_only');
  setIonInput(getItemControl(container, 'Start', 'ion-input'), start, 'ionChange');
  setIonInput(getItemControl(container, 'End', 'ion-input'), end, 'ionChange');
};

const setAnonymousPosting = (container: HTMLElement) => {
  setIonSelect(getItemControl(container, 'Post as', 'ion-select'), 'anonymous');
};

describe('CreateEventModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModalConfigs.length = 0;
    mockGlobalProfile = {
      registrationDate: daysAgoIso(30),
      username: 'alex',
      preferred_name: 'Alex',
      subscription_level: 'free',
    };
    mockModeration = { paused_on_creation: false };
    mockApiPost.mockResolvedValue({ data: { event_id: 77 } });
    mockEventUploadPhoto.mockResolvedValue(undefined);
  });

  it('shows the age gate for new accounts and routes to the store on upgrade', () => {
    mockGlobalProfile = {
      ...mockGlobalProfile,
      registrationDate: daysAgoIso(7),
    };

    renderModal();

    expect(screen.getByText('age-gate-event')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Upgrade'));
    expect(mockPush).toHaveBeenCalledWith('/store');
  });

  it('blocks event submission when moderation pauses posting and routes to activity', () => {
    mockModeration = {
      paused_on_creation: false,
      commenting_paused_until: '2099-07-20T18:00:00.000Z',
    };

    renderModal();

    expect(screen.getByText(/Your posting is temporarily paused until/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('View Activity'));
    expect(mockPush).toHaveBeenCalledWith('/activity');
  });

  it('dismisses without submitted state when cancel is clicked', () => {
    const { onDismiss } = renderModal();

    fireEvent.click(screen.getByText('Cancel'));

    expect(onDismiss).toHaveBeenCalledWith();
  });

  it('shows a required-fields error when the core event fields are empty', async () => {
    renderModal();

    fireEvent.click(screen.getByText('Submit event'));

    expect(await screen.findByText('Name, description, type, start, and end are required.')).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('blocks named posts until host and feed-highlight questions are answered', async () => {
    const { container } = renderModal();

    fillRequiredEventFields(container, '2099-07-20T18:00', '2099-07-20T19:00');
    setIonSelect(getItemControl(container, 'Post as', 'ion-select'), 'alex');

    fireEvent.click(screen.getByText('Submit event'));
    expect(await screen.findByText('Please choose whether you can answer questions about this event.')).toBeInTheDocument();

    setIonSelect(
      getItemControl(container, 'Are you the host or do you know the host, and can you answer questions about this event?', 'ion-select'),
      'yes'
    );
    fireEvent.click(screen.getByText('Submit event'));

    expect(
      await screen.findByText('Please choose whether this event can be highlighted in the Refreshments feed.')
    ).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('shows a recurring-date validation error for custom repeats with no extra dates', async () => {
    mockGlobalProfile = {
      ...mockGlobalProfile,
      subscription_level: 'community_plus',
    };
    const { container } = renderModal();

    fillRequiredEventFields(container, '2099-07-20T18:00', '2099-07-20T19:00');
    setAnonymousPosting(container);
    fireEvent(container.querySelector('ion-toggle')!, new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true }));
    setIonSelect(getItemControl(container, 'Repeat', 'ion-select'), 'custom');

    fireEvent.click(screen.getByText('Submit event'));

    expect(await screen.findByText('Add at least one additional date.')).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('shows the inline PII warning and disables submission when contact details are present', async () => {
    const { container } = renderModal();

    fillRequiredEventFields(container, '2099-07-20T18:00', '2099-07-20T19:00');
    setAnonymousPosting(container);
    setIonInput(getItemControl(container, 'Description', 'ion-textarea'), 'Text me at 555-111-2222.');

    expect(
      await screen.findByText(
        'Events cannot contain private personal contact information. Please remove phone numbers or emails.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Submit event')).toBeDisabled();
  });

  it('blocks link shorteners in the external link field', async () => {
    const { container } = renderModal();

    fillRequiredEventFields(container, '2099-07-20T18:00', '2099-07-20T19:00');
    setAnonymousPosting(container);
    setIonInput(getItemControl(container, 'External link', 'ion-input'), 'https://bit.ly/masked-meetup');

    expect(
      await screen.findByText(
        "Link shorteners aren't allowed. Please use the full link so members can see where they're clicking."
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Submit event')).toBeDisabled();
  });

  it('blocks Google Docs links in event descriptions', async () => {
    const { container } = renderModal();

    fillRequiredEventFields(container, '2099-07-20T18:00', '2099-07-20T19:00');
    setAnonymousPosting(container);
    setIonInput(
      getItemControl(container, 'Description', 'ion-textarea'),
      'Details are here: https://docs.google.com/document/d/example'
    );

    expect(
      await screen.findByText(
        'This link isn’t allowed. It may expose or track viewers or collect data in without a clear privacy policy.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Submit event')).toBeDisabled();
  });

  it('treats an address in the event body as blocked PII', async () => {
    const { container } = renderModal();

    fillRequiredEventFields(container, '2099-07-20T18:00', '2099-07-20T19:00');
    setAnonymousPosting(container);
    setIonInput(getItemControl(container, 'Description', 'ion-textarea'), 'Meet at 123 Main Street for setup.');

    expect(
      await screen.findByText(
        'Events cannot contain private personal contact information. Please remove phone numbers or emails.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Submit event')).toBeDisabled();
  });

  it('opens the city selector for in-person events and populates the selected city on dismiss', async () => {
    const { container } = renderModal();

    fillRequiredEventFields(container, '2099-07-20T18:00', '2099-07-20T19:00');
    setIonSelect(getItemControl(container, 'Event type', 'ion-select'), 'in_person_only');

    fireEvent.click(getItemControl(container, 'Nearby City', 'ion-input'));
    expect(mockPresentModal).toHaveBeenCalled();

    const citySelectorConfig = mockModalConfigs[1];
    await act(async () => {
      citySelectorConfig.onDismiss({ name: 'Brooklyn', lat: 40.6782, lng: -73.9442 });
    });

    await waitFor(() => {
      expect(getItemControl(container, 'Location label', 'ion-input')).toHaveAttribute('value', 'Brooklyn');
    });
  });

  it('allows an address in location label, then shows the pending-approval alert before dismissing', async () => {
    const { container, onDismiss } = renderModal();

    fillRequiredEventFields(container, '2099-07-20T18:00', '2099-07-20T19:00');
    setAnonymousPosting(container);
    setIonSelect(getItemControl(container, 'Event type', 'ion-select'), 'in_person_only');

    const citySelectorConfig = mockModalConfigs[1];
    await act(async () => {
      citySelectorConfig.onDismiss({ name: 'Brooklyn', lat: 40.6782, lng: -73.9442 });
    });
    await waitFor(() => {
      expect(getItemControl(container, 'Location label', 'ion-input')).toHaveAttribute('value', 'Brooklyn');
    });

    setIonInput(getItemControl(container, 'Location label', 'ion-input'), '123 Main Street, Brooklyn');
    fireEvent.click(screen.getByText('Submit event'));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/event/', expect.objectContaining({
        location: '123 Main Street, Brooklyn',
        location_point_lat: 40.6782,
        location_point_long: -73.9442,
        local_only: 'true',
      }));
    });
    expect(screen.queryByText('Events cannot contain private personal contact information. Please remove phone numbers or emails.')).not.toBeInTheDocument();
    expect(await screen.findByText('Your event has been submitted and is now pending approval!')).toBeInTheDocument();
    fireEvent.click(screen.getByText('OK'));
    expect(onDismiss).toHaveBeenCalledWith({ submitted: true });
  });

  it('shows generated recurring dates and converts an edited generated date into a custom recurrence', async () => {
    mockGlobalProfile = {
      ...mockGlobalProfile,
      subscription_level: 'community_plus',
    };
    const { container } = renderModal();

    fillRequiredEventFields(container, '2026-04-01T18:00', '2026-04-01T19:00');
    setAnonymousPosting(container);
    fireEvent(container.querySelector('ion-toggle')!, new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true }));
    setIonSelect(getItemControl(container, 'Repeat', 'ion-select'), 'weekly');

    expect(await screen.findByText('Dates (auto-generated) • Your time zone')).toBeInTheDocument();
    expect(screen.getByText('How many recurring dates?')).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Edit date')[0]);
    const recurrenceInputs = Array.from(container.querySelectorAll('ion-input')).filter((node) =>
      node.getAttribute('type') === 'datetime-local'
    );
    const editedGeneratedInput = recurrenceInputs[2] as unknown as HTMLElement;
    setIonInput(editedGeneratedInput, '2026-04-10T18:00', 'ionChange');

    await waitFor(() => {
      expect(screen.getByText('Add another date')).toBeInTheDocument();
    });
  });

  it('resets host and feed-highlight answers when switching back to anonymous posting', async () => {
    const { container } = renderModal();

    fillRequiredEventFields(container, '2099-07-20T18:00', '2099-07-20T19:00');
    setIonSelect(getItemControl(container, 'Post as', 'ion-select'), 'alex');
    setIonSelect(
      getItemControl(container, 'Are you the host or do you know the host, and can you answer questions about this event?', 'ion-select'),
      'yes'
    );
    setIonSelect(
      getItemControl(container, 'Is it okay to highlight this event in the Refreshments Bar feed', 'ion-select'),
      'yes'
    );
    setIonSelect(getItemControl(container, 'Post as', 'ion-select'), 'anonymous');

    fireEvent.click(screen.getByText('Submit event'));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/event/', expect.objectContaining({
        anonymous: 'true',
        can_answer_questions: 'false',
        allowed_as_post_in_feed: 'false',
      }));
    });
  });

  it('shows a recurring same-day end-time error for invalid custom dates', async () => {
    mockGlobalProfile = {
      ...mockGlobalProfile,
      subscription_level: 'community_plus',
    };
    const { container } = renderModal();

    fillRequiredEventFields(container, '2099-07-20T18:00', '2099-07-20T19:00');
    setAnonymousPosting(container);
    fireEvent(container.querySelector('ion-toggle')!, new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true }));
    setIonSelect(getItemControl(container, 'Repeat', 'ion-select'), 'custom');

    fireEvent.click(screen.getByText('Add another date'));

    const datetimeInputs = Array.from(container.querySelectorAll('ion-input')).filter((node) =>
      node.getAttribute('type') === 'datetime-local'
    );
    setIonInput(datetimeInputs[2] as unknown as HTMLElement, '2099-07-27T18:00', 'ionChange');
    setIonInput(datetimeInputs[3] as unknown as HTMLElement, '2099-07-28T18:00', 'ionChange');

    fireEvent.click(screen.getByText('Submit event'));

    expect(await screen.findByText("Recurring date end times can't be longer than 24 hours.")).toBeInTheDocument();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('submits named events with the host and feed-highlight answers included', async () => {
    const { container } = renderModal();

    fillRequiredEventFields(container, '2099-07-20T18:00', '2099-07-20T19:00');
    setIonSelect(getItemControl(container, 'Post as', 'ion-select'), 'alex');
    setIonSelect(
      getItemControl(container, 'Are you the host or do you know the host, and can you answer questions about this event?', 'ion-select'),
      'yes'
    );
    setIonSelect(
      getItemControl(container, 'Is it okay to highlight this event in the Refreshments Bar feed', 'ion-select'),
      'yes'
    );

    fireEvent.click(screen.getByText('Submit event'));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/event/', expect.objectContaining({
        anonymous: 'false',
        can_answer_questions: 'true',
        allowed_as_post_in_feed: 'true',
      }));
    });
  });

  it('submits a valid anonymous event payload and dismisses after the pending-approval alert closes', async () => {
    const { container, onDismiss } = renderModal();

    fillRequiredEventFields(container, '2099-07-20T18:00', '2099-07-20T19:00');
    setAnonymousPosting(container);

    fireEvent.click(screen.getByText('Submit event'));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/event/', expect.objectContaining({
        name: 'Masked picnic',
        description: 'Bring your own snacks and air purifier.',
        start_datetime: '2099-07-20T18:00',
        end_datetime: '2099-07-20T19:00',
        local_only: 'false',
        anonymous: 'true',
        event_type: 'virtual_only',
      }));
    });
    expect(await screen.findByText('Your event has been submitted and is now pending approval!')).toBeInTheDocument();
    fireEvent.click(screen.getByText('OK'));
    expect(onDismiss).toHaveBeenCalledWith({ submitted: true });
  });

  it('uploads an attached photo after creating the event and lets the user remove the preview before submitting', async () => {
    const fileReaderResult = 'data:image/png;base64,abc123';
    const originalFileReader = globalThis.FileReader;
    const readAsDataURL = vi.fn(function (this: any) {
      this.result = fileReaderResult;
      this.onload?.();
    });

    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: null | (() => void) = null;
      readAsDataURL = readAsDataURL;
    }

    vi.stubGlobal('FileReader', MockFileReader as any);

    try {
      const { container, onDismiss } = renderModal();
      fillRequiredEventFields(container, '2099-07-20T18:00', '2099-07-20T19:00');
      setAnonymousPosting(container);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const photo = new File(['img'], 'event.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [photo] } });
      await act(async () => { mockModalConfigs[2].onDismiss(fileReaderResult); });
      expect(await screen.findByText('Photo attached')).toBeInTheDocument();

      fireEvent.click(container.querySelector('ion-button[color="danger"]') as HTMLElement);
      expect(screen.queryByText('Photo attached')).not.toBeInTheDocument();

      fireEvent.change(fileInput, { target: { files: [photo] } });
      await act(async () => { mockModalConfigs[2].onDismiss(fileReaderResult); });
      expect(await screen.findByText('Photo attached')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Submit event'));

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledTimes(1);
      });
      expect(mockEventUploadPhoto).toHaveBeenCalledWith({ image: fileReaderResult }, 77);
      expect(await screen.findByText('Your event has been submitted and is now pending approval!')).toBeInTheDocument();
      fireEvent.click(screen.getByText('OK'));
      expect(onDismiss).toHaveBeenCalledWith({ submitted: true });
    } finally {
      vi.stubGlobal('FileReader', originalFileReader as any);
    }
  });

  it('shows a generic submission error when event creation fails', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('boom'));
    const { container } = renderModal();

    fillRequiredEventFields(container, '2099-07-20T18:00', '2099-07-20T19:00');
    setAnonymousPosting(container);
    fireEvent.click(screen.getByText('Submit event'));

    expect(await screen.findByText('Unable to submit event right now.')).toBeInTheDocument();
  });

  it('bypasses the age gate for pro users with accounts under 2 weeks old', () => {
    mockGlobalProfile = {
      ...mockGlobalProfile,
      registrationDate: daysAgoIso(7),
      subscription_level: 'pro',
    };

    renderModal();

    expect(screen.queryByText('age-gate-event')).not.toBeInTheDocument();
  });

  it('bypasses the age gate for community+ users with accounts under 2 weeks old', () => {
    mockGlobalProfile = {
      ...mockGlobalProfile,
      registrationDate: daysAgoIso(7),
      subscription_level: 'community_plus',
    };

    renderModal();

    expect(screen.queryByText('age-gate-event')).not.toBeInTheDocument();
  });
});
