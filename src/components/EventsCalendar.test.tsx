import React from 'react';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { star, starOutline } from 'ionicons/icons';

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
  mockGetShowInterestedCountPref,
  mockGetHideInterestedCountOnMySubmissionsPref,
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
  mockGetShowInterestedCountPref: vi.fn(),
  mockGetHideInterestedCountOnMySubmissionsPref: vi.fn(),
}));

let mockEventsLoading = false;
let mockProfile: any = {
  subscription_level: 'communityplus',
  settings_community_profile: true,
  settings_alt_text: true,
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
    image_alt: 'People sitting by a portable air filter.\nMasks are visible on the table.',
    local_only: true,
    profile_image: 'https://example.com/avatar.jpg',
    anonymous: false,
    interested: true,
    interested_count: 4,
  },
];

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonModal: ({ isOpen, children, onDidDismiss }: any) => (isOpen ? <div data-testid="calendar-modal">{children}<button onClick={() => onDidDismiss?.()}>dismiss-modal</button></div> : null),
    IonIcon: ({ icon, color, className, ...props }: any) => (
      <span
        data-testid="ion-icon"
        data-icon={String(icon)}
        data-color={color ?? ''}
        className={className}
        {...props}
      />
    ),
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
  isCommunityPlus: vi.fn((level?: string) => level === 'communityplus' || level === 'pro'),
  onImgError: vi.fn(),
  localTzAbbr: vi.fn(() => 'EST'),
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

vi.mock('../hooks/capacitorPreferences/interested-counts', () => ({
  getShowInterestedCountPref: (...args: any[]) => mockGetShowInterestedCountPref(...args),
  getHideInterestedCountOnMySubmissionsPref: (...args: any[]) => mockGetHideInterestedCountOnMySubmissionsPref(...args),
  SHOW_INTERESTED_COUNT_CHANGED_EVENT: 'show_interested_count_changed',
  HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_CHANGED_EVENT: 'hide_interested_count_on_my_submissions_changed',
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
  PhotoView: ({ children, overlay }: any) => (
    <>
      {children}
      {overlay ? <div data-testid="photo-view-overlay">{overlay}</div> : null}
    </>
  ),
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
  afterAll(() => {
    vi.clearAllTimers();
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-03-01T12:00:00Z'));
    vi.clearAllMocks();
    mockModalConfigs.length = 0;
    mockPopoverConfigs.length = 0;
    mockEventsLoading = false;
    mockProfile = {
      subscription_level: 'communityplus',
      settings_community_profile: true,
      settings_alt_text: true,
      user: 9,
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
        image_alt: 'People sitting by a portable air filter.\nMasks are visible on the table.',
        local_only: true,
        profile_image: 'https://example.com/avatar.jpg',
        anonymous: false,
        interested: true,
        interested_count: 4,
      },
    ];
    mockPreferencesGet.mockResolvedValue({ value: null });
    mockPreferencesSet.mockResolvedValue(undefined);
    mockGetShowInterestedCountPref.mockResolvedValue(true);
    mockGetHideInterestedCountOnMySubmissionsPref.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens the calendar, loads saved filters, and renders selected event details', async () => {
    renderCalendar({ openOnLoad: true, initialDate: '2026-03-29', onAutoOpenHandled: vi.fn() });

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    expect(mockPreferencesGet).toHaveBeenCalledWith({ key: 'events_calendar_view_mode' });
    expect(screen.getAllByText('Clean air picnic').length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByText('Clean air picnic')[0]);
    expect(screen.getByText('Bring filters and snacks.')).toBeInTheDocument();
    expect(screen.getByText('Masks required')).toBeInTheDocument();
    expect(screen.getByText('Covid conscientious only')).toBeInTheDocument();
    expect(screen.getByText('External registration required.')).toBeInTheDocument();
    expect(document.querySelector('.calendar-event-image')).toHaveAttribute(
      'alt',
      'People sitting by a portable air filter.\nMasks are visible on the table.'
    );
    expect(screen.getByTestId('photo-view-overlay')).toHaveTextContent('People sitting by a portable air filter. Masks are visible on the table.');
  });

  it('keeps event cards collapsed by default when a day has multiple events', async () => {
    mockEvents = [
      {
        ...mockEvents[0],
        id: 11,
        name: 'Clean air picnic',
        description: 'Bring filters and snacks.',
      },
      {
        ...mockEvents[0],
        id: 22,
        name: 'Fresh air walk',
        start_datetime: '2026-03-29T20:00:00.000Z',
        end_datetime: '2026-03-29T21:00:00.000Z',
        description: 'Sunset walk together.',
      },
    ];

    renderCalendar({ openOnLoad: true, initialDate: '2026-03-29', onAutoOpenHandled: vi.fn() });

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    expect(screen.getByText('Clean air picnic')).toBeInTheDocument();
    expect(screen.getByText('Fresh air walk')).toBeInTheDocument();
    expect(screen.queryByText('Bring filters and snacks.')).not.toBeInTheDocument();
    expect(screen.queryByText('Sunset walk together.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Fresh air walk'));

    expect(screen.getByText('Sunset walk together.')).toBeInTheDocument();
    expect(screen.queryByText('Bring filters and snacks.')).not.toBeInTheDocument();
  });

  it('keeps event cards collapsed by default when a day has one event', async () => {
    mockEvents = [
      {
        ...mockEvents[0],
        id: 11,
        name: 'Clean air picnic',
        description: 'Bring filters and snacks.',
      },
    ];

    renderCalendar({ openOnLoad: true, initialDate: '2026-03-29', onAutoOpenHandled: vi.fn() });

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    expect(screen.getByText('Clean air picnic')).toBeInTheDocument();
    expect(screen.queryByText('Bring filters and snacks.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Clean air picnic'));

    expect(screen.getByText('Bring filters and snacks.')).toBeInTheDocument();
  });

  it('loads the saved week view mode from Capacitor preferences', async () => {
    mockPreferencesGet.mockImplementation(({ key }: { key: string }) => {
      if (key === 'events_calendar_view_mode') {
        return Promise.resolve({ value: 'week' });
      }
      return Promise.resolve({ value: null });
    });

    renderCalendar({ openOnLoad: true, initialDate: '2026-03-29', onAutoOpenHandled: vi.fn() });

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    const weekButton = screen.getByText('Week').closest('ion-button');
    const monthButton = screen.getByText('Month').closest('ion-button');
    await waitFor(() => {
      expect(weekButton).toHaveAttribute('fill', 'solid');
      expect(monthButton).toHaveAttribute('fill', 'outline');
    });
  });

  it('preselects the requested event when auto-opened from another surface', async () => {
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
        settings_community_profile: true,
        anonymous: false,
      },
      {
        id: 22,
        name: 'Fresh air walk',
        start_datetime: '2026-03-29T20:00:00.000Z',
        end_datetime: '2026-03-29T21:00:00.000Z',
        description: 'Sunset walk together.',
        event_type: 'in_person_only',
        username: 'sam',
        user: 13,
        settings_community_profile: true,
        anonymous: false,
      },
    ];

    renderCalendar({ openOnLoad: true, initialDate: '2026-03-29', initialEventId: 22, onAutoOpenHandled: vi.fn() });

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    expect(screen.getByText('Sunset walk together.')).toBeInTheDocument();
    expect(screen.queryByText('Bring filters and snacks.')).not.toBeInTheDocument();
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

    expect(mockPreferencesSet).toHaveBeenCalledTimes(4);
    expect(mockPreferencesSet).toHaveBeenCalledWith({ key: 'events_calendar_view_mode', value: 'month' });
  });

  it('shows a filter-count badge only for groups narrowed away from Any', async () => {
    const { rerender } = render(
      <IonApp>
        <QueryClientProvider client={new QueryClient()}>
          <EventsCalendar
            openOnLoad
            initialDate="2026-03-29"
            eventFilters={{
              eventTypes: ['all'],
              attendeePrecautionPreferences: ['all'],
              inPersonPrecautions: ['all'],
            }}
          />
        </QueryClientProvider>
      </IonApp>
    );

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    expect(document.querySelector('.events-calendar-filter-badge')).toBeNull();

    rerender(
      <IonApp>
        <QueryClientProvider client={new QueryClient()}>
          <EventsCalendar
            openOnLoad
            initialDate="2026-03-29"
            eventFilters={{
              eventTypes: ['virtual_only'],
              attendeePrecautionPreferences: ['all'],
              inPersonPrecautions: ['outdoors'],
            }}
          />
        </QueryClientProvider>
      </IonApp>
    );

    expect(document.querySelector('.events-calendar-filter-badge')).toHaveTextContent('2');
  });

  it('opens the host popover, profile sheet, report modal, and routes to the linked post', async () => {
    const { container } = renderCalendar({ openOnLoad: true, initialDate: '2026-03-29' });

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    fireEvent.click(screen.getAllByText('Clean air picnic')[0]);
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

  it('renders the selected-day interested marker without a hardcoded warning color prop', async () => {
    mockEvents = [
      {
        ...mockEvents[0],
        id: 21,
        start_datetime: '2026-04-04T18:00:00.000Z',
        end_datetime: '2026-04-04T19:00:00.000Z',
        interested: true,
      },
    ];

    renderCalendar({ openOnLoad: true, initialDate: '2026-04-04' });

    expect(await screen.findByText('Community events')).toBeInTheDocument();

    const selectedDay = document.querySelector('.calendar-day--selected') as HTMLElement;
    expect(selectedDay).toBeTruthy();

    const selectedDayStar = selectedDay.querySelector('.calendar-day-interest-star') as HTMLElement;
    expect(selectedDayStar).toBeTruthy();
    expect(selectedDayStar).toHaveAttribute('data-icon', String(star));
    expect(selectedDayStar).toHaveAttribute('data-color', '');
  });

  it('shows filled yellow stars for interested events even when a different event card is expanded', async () => {
    mockEvents = [
      {
        ...mockEvents[0],
        id: 31,
        name: 'New post',
        start_datetime: '2026-04-04T09:28:00.000Z',
        end_datetime: '2026-04-04T10:28:00.000Z',
        interested: false,
      },
      {
        ...mockEvents[0],
        id: 32,
        name: 'Three events',
        start_datetime: '2026-04-04T16:00:00.000Z',
        end_datetime: '2026-04-04T18:00:00.000Z',
        interested: true,
      },
    ];

    renderCalendar({ openOnLoad: true, initialDate: '2026-04-04' });

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    expect(screen.getByText('Three events')).toBeInTheDocument();

    const eventCards = Array.from(document.querySelectorAll('.calendar-event-card'));
    expect(eventCards).toHaveLength(2);

    const firstStar = eventCards[0].querySelector('.calendar-event-star [data-testid="ion-icon"]') as HTMLElement;
    const secondStar = eventCards[1].querySelector('.calendar-event-star [data-testid="ion-icon"]') as HTMLElement;

    expect(firstStar).toHaveAttribute('data-icon', String(starOutline));
    expect(firstStar).toHaveAttribute('data-color', 'medium');
    expect(secondStar).toHaveAttribute('data-icon', String(star));
    expect(secondStar).toHaveAttribute('data-color', 'warning');
  });

  it('shows the interested count for Community+ users when more than three people are interested', async () => {
    renderCalendar({ openOnLoad: true, initialDate: '2026-03-29' });

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    expect(screen.getByTestId('event-interest-count-11')).toHaveTextContent('4');
  });

  it('hides the interested count for non-premium users', async () => {
    mockProfile = {
      subscription_level: 'none',
      settings_community_profile: true,
    };

    renderCalendar({ openOnLoad: true, initialDate: '2026-03-29' });

    expect(await screen.findByText('Community events')).toBeInTheDocument();
    expect(screen.queryByTestId('event-interest-count-11')).not.toBeInTheDocument();
  });

});
