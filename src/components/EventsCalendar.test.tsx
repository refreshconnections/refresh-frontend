import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';

const {
  mockPresentModal,
  mockDismissModal,
  mockPresentPopover,
  mockDismissPopover,
  mockPush,
  mockInvalidateQueries,
  mockPresentActionSheet,
  mockPreferencesGet,
  mockPreferencesSet,
  mockSheetPresent,
  mockSheetDismiss,
  mockModalConfigs,
  mockPopoverConfigs,
} = vi.hoisted(() => ({
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  mockPresentPopover: vi.fn(),
  mockDismissPopover: vi.fn(),
  mockPush: vi.fn(),
  mockInvalidateQueries: vi.fn(),
  mockPresentActionSheet: vi.fn(),
  mockPreferencesGet: vi.fn(),
  mockPreferencesSet: vi.fn(),
  mockSheetPresent: vi.fn(),
  mockSheetDismiss: vi.fn(),
  mockModalConfigs: [] as any[],
  mockPopoverConfigs: [] as any[],
}));

let mockEventsLoading = false;
let mockProfile: any = {
  subscription_level: 'community_plus',
  settings_community_profile: true,
};
let mockEvents: any[] = [
  {
    id: 11,
    name: 'Clean air picnic',
    start_datetime: '2026-03-29T18:00:00.000Z',
    end_datetime: '2026-03-29T19:00:00.000Z',
    description: 'Bring filters and snacks.',
    event_type: 'in_person_only',
    username: 'alex',
    user: 12,
    can_answer_questions: true,
    settings_community_profile: true,
    in_person_precautions: ['masks_required'],
    attendee_precaution_preference: 'precautions_only',
    external_registration_required: true,
    external_link: 'https://example.com/event',
    post: 91,
    image: 'https://example.com/pic.jpg',
    local_only: true,
    profile_image: 'https://example.com/avatar.jpg',
    anonymous: false,
  },
];

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonModal: ({ isOpen, children, onDidDismiss }: any) => (isOpen ? <div data-testid="calendar-modal">{children}<button onClick={() => onDidDismiss?.()}>dismiss-modal</button></div> : null),
    useIonModal: (_component: any, props: any) => {
      mockModalConfigs.push(props);
      return [mockPresentModal, mockDismissModal];
    },
    useIonPopover: (_component: any, props: any) => {
      mockPopoverConfigs.push(props);
      return [mockPresentPopover, mockDismissPopover];
    },
    useIonActionSheet: () => [mockPresentActionSheet, vi.fn()],
    useIonRouter: () => ({ push: mockPush }),
  };
});

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: (...args: any[]) => mockInvalidateQueries(...args) }),
  };
});

vi.mock('../hooks/api/events', () => ({
  DEFAULT_EVENT_FILTERS: {
    eventTypes: ['all'],
    attendeePrecautionPreferences: ['all'],
    inPersonPrecautions: ['all'],
  },
  EVENT_FILTER_PREF_KEYS: {
    eventTypes: 'event-types',
    attendeePrecautionPreferences: 'attendee-precautions',
    inPersonPrecautions: 'in-person-precautions',
  },
  useGetEvents: () => ({ data: mockEvents, isLoading: mockEventsLoading }),
}));

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: () => ({ data: mockProfile }),
}));

vi.mock('../hooks/utilities', () => ({
  getAvatarDisplay: vi.fn(() => ({
    hasImage: true,
    src: 'https://example.com/avatar.jpg',
    className: 'avatar-ok',
  })),
  isCommunityPlus: vi.fn((level?: string) => level === 'community_plus' || level === 'pro'),
  onImgError: vi.fn(),
}));

vi.mock('../hooks/useSheetModal', () => ({
  useSheetModal: () => [mockSheetPresent, mockSheetDismiss],
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: (...args: any[]) => mockPreferencesGet(...args),
    set: (...args: any[]) => mockPreferencesSet(...args),
  },
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('./CreateEventModal', () => ({ default: () => <div>create-event-modal</div> }));
vi.mock('./CommunityProfileModal', () => ({ default: () => <div>community-profile-modal</div> }));
vi.mock('./EventReportModal', () => ({ default: () => <div>event-report-modal</div> }));
vi.mock('./EventFiltersModal', () => ({ default: () => <div>event-filters-modal</div> }));
vi.mock('react-photo-view', () => ({
  PhotoProvider: ({ children }: any) => <>{children}</>,
  PhotoView: ({ children }: any) => <>{children}</>,
}));

import EventsCalendar from './EventsCalendar';

const renderCalendar = (props?: Partial<React.ComponentProps<typeof EventsCalendar>>) => {
  const queryClient = new QueryClient();
  return render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <EventsCalendar {...props} />
      </QueryClientProvider>
    </IonApp>
  );
};

describe('EventsCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockModalConfigs.length = 0;
    mockPopoverConfigs.length = 0;
    mockEventsLoading = false;
    mockProfile = {
      subscription_level: 'community_plus',
      settings_community_profile: true,
    };
    mockEvents = [
      {
        id: 11,
        name: 'Clean air picnic',
        start_datetime: '2026-03-29T18:00:00.000Z',
        end_datetime: '2026-03-29T19:00:00.000Z',
        description: 'Bring filters and snacks.',
        event_type: 'in_person_only',
        username: 'alex',
        user: 12,
        can_answer_questions: true,
        settings_community_profile: true,
        in_person_precautions: ['masks_required'],
        attendee_precaution_preference: 'precautions_only',
        external_registration_required: true,
        external_link: 'https://example.com/event',
        post: 91,
        image: 'https://example.com/pic.jpg',
        local_only: true,
        profile_image: 'https://example.com/avatar.jpg',
        anonymous: false,
      },
    ];
    mockPreferencesGet.mockResolvedValue({ value: null });
    mockPreferencesSet.mockResolvedValue(undefined);
  });

  it('opens the calendar, loads saved filters, and renders selected event details', async () => {
    renderCalendar({ openOnLoad: true, initialDate: '2026-03-29', onAutoOpenHandled: vi.fn() });

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    expect(mockPreferencesGet).toHaveBeenCalledTimes(3);
    expect(screen.getAllByText('Clean air picnic').length).toBeGreaterThan(0);
    expect(screen.getByText('Bring filters and snacks.')).toBeInTheDocument();
    expect(screen.getByText('Masks Required')).toBeInTheDocument();
    expect(screen.getByText('Covid conscientious only')).toBeInTheDocument();
    expect(screen.getByText('External registration required.')).toBeInTheDocument();
  });

  it('opens the add-event and filters modals, and persists filters on dismiss', async () => {
    renderCalendar({ openOnLoad: true, initialDate: '2026-03-29' });

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Add an event'));
    expect(mockPresentModal).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Filters'));
    expect(mockPresentModal).toHaveBeenCalledTimes(2);

    const filtersConfig = mockModalConfigs[0];
    await act(async () => {
      await filtersConfig.onDismiss({
        eventTypes: ['virtual_only'],
        attendeePrecautionPreferences: ['open'],
        inPersonPrecautions: ['outdoors'],
      });
    });

    expect(mockPreferencesSet).toHaveBeenCalledTimes(3);
  });

  it('opens the host popover, profile sheet, report modal, and routes to the linked post', async () => {
    const { container } = renderCalendar({ openOnLoad: true, initialDate: '2026-03-29' });

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/shared by alex/i));
    expect(mockSheetPresent).toHaveBeenCalledWith({ cssClass: 'community-profile-modal' });

    fireEvent.click(screen.getByTestId('fa-icon'));
    expect(mockPresentPopover).toHaveBeenCalled();

    fireEvent.click(container.querySelector('.calendar-event-ellipsis-corner') as HTMLElement);
    expect(mockPresentActionSheet).toHaveBeenCalled();

    const reportConfig = mockPresentActionSheet.mock.calls.find(([cfg]) =>
      cfg?.buttons?.some?.((button: any) => button.text === 'Report event')
    );
    expect(reportConfig).toBeTruthy();
    const reportButton = reportConfig![0].buttons.find((button: any) => button.text === 'Report event');
    await act(async () => {
      reportButton.handler();
    });
    expect(mockPresentModal).toHaveBeenCalled();

    fireEvent.click(screen.getByText('View post'));
    expect(mockPush).toHaveBeenCalledWith('/community/91');
  });

  it('supports a custom trigger, opens with no events for that day, and closes cleanly', async () => {
    renderCalendar({
      renderTrigger: (open) => <button onClick={open}>Open custom calendar</button>,
    });

    fireEvent.click(screen.getByText('Open custom calendar'));

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    expect(screen.getByText('No events scheduled for this day.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close'));
    await waitFor(() => {
      expect(screen.queryByText('Community events')).not.toBeInTheDocument();
    });
  });

  it('opens the create-event modal and invalidates events only when the create flow reports a submission', async () => {
    renderCalendar({ openOnLoad: true, initialDate: '2026-03-29' });

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Add an event'));

    const createEventConfig = mockModalConfigs[1];
    await act(async () => {
      await createEventConfig.onDismiss({ submitted: false });
    });
    expect(mockInvalidateQueries).not.toHaveBeenCalled();

    await act(async () => {
      await createEventConfig.onDismiss({ submitted: true });
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['events'] });
  });

  it('supports week navigation and hides the byline row for anonymous events', async () => {
    mockEvents = [
      {
        ...mockEvents[0],
        anonymous: true,
        username: 'hidden-user',
        can_answer_questions: false,
      },
    ];

    renderCalendar({ openOnLoad: true, initialDate: '2026-03-29' });

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Week'));
    fireEvent.click(screen.getByText('›'));

    expect(screen.queryByText(/shared by/i)).not.toBeInTheDocument();
  });
});
