import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonLabel,
  IonModal,
  IonRow,
  IonSpinner,
  IonText,
  IonToolbar,
  IonTitle,
  IonHeader,
  useIonActionSheet,
  useIonAlert,
  useIonPopover,
  useIonModal,
  useIonRouter,
} from '@ionic/react';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { calendarNumber, calendarOutline, filter as filterIcon, star, starOutline } from 'ionicons/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment, { type Moment } from 'moment';
import type { RefreshEvent } from '../hooks/api/events';
import { useGetEvents, DEFAULT_EVENT_FILTERS, EVENT_FILTER_PREF_KEYS, EventFilters } from '../hooks/api/events';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { getAvatarDisplay, isCommunityPlus, localTzAbbr, openExternalUrl } from '../hooks/utilities';
import { useSheetModal } from '../hooks/useSheetModal';
import { useUpsellAlert } from '../hooks/useUpsellAlert';

import EllipsisMenuButton from './EllipsisMenuButton';
import CreateEventModal from './CreateEventModal';
import CommunityProfileModal from './CommunityProfileModal';
import EventReportModal from './EventReportModal';
import EventFiltersModal from './EventFiltersModal';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import {
  getHideInterestedCountOnMySubmissionsPref,
  getShowInterestedCountPref,
  HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_CHANGED_EVENT,
  SHOW_INTERESTED_COUNT_CHANGED_EVENT,
} from '../hooks/capacitorPreferences/interested-counts';
import { useInterestEvent, useUninterestEvent } from '../hooks/api/interests';
import { useAddToCalendar } from '../hooks/useAddToCalendar';
import {
  getShowAddToCalendarPref,
  SHOW_ADD_TO_CALENDAR_CHANGED_EVENT,
} from '../hooks/capacitorPreferences/add-to-calendar';
import RefreshmentsEventDetails from './RefreshmentsEventDetails';

import './EventsCalendar.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


type ReminderOption = { text: string; minutes: number | null; free: boolean };
const REMINDER_OPTIONS: ReminderOption[] = [
  { text: 'No reminder',        minutes: null,  free: true  },
  { text: 'At time of event',   minutes: 0,     free: true  },
  { text: '15 minutes before',  minutes: -15,   free: false },
  { text: '30 minutes before',  minutes: -30,   free: false },
  { text: '1 hour before',      minutes: -60,   free: false },
  { text: '2 hours before',     minutes: -120,  free: true  },
  { text: '1 day before',       minutes: -1440, free: true  },
  { text: '2 days before',      minutes: -2880, free: false },
];

type CalendarDay = {
  iso: string;
  label: number;
  date: Date;
  isCurrentMonth: boolean;
};

const buildCalendarDays = (base: Moment): CalendarDay[] => {
  const start = base.clone().startOf('month').startOf('week');
  const end = base.clone().endOf('month').endOf('week');
  const totalDays = end.diff(start, 'days') + 1;
  const days: CalendarDay[] = [];

  for (let idx = 0; idx < totalDays; idx++) {
    const iter = start.clone().add(idx, 'days');
    days.push({
      iso: iter.format('YYYY-MM-DD'),
      label: iter.date(),
      date: iter.toDate(),
      isCurrentMonth: iter.month() === base.month(),
    });
  }

  return days;
};

const EVENTS_CALENDAR_VIEW_MODE_PREF_KEY = 'events_calendar_view_mode';

type EventsCalendarProps = {
  renderTrigger?: (open: () => void) => React.ReactNode;
  initialDate?: string;
  initialEventId?: number;
  openOnLoad?: boolean;
  onAutoOpenHandled?: () => void;
  local?: boolean;
  radius?: number | null;
  eventFilters?: EventFilters;
  onEventFiltersChange?: (filters: EventFilters) => void;
};

const EventsCalendar: React.FC<EventsCalendarProps> = ({
  renderTrigger,
  initialDate,
  initialEventId,
  openOnLoad,
  onAutoOpenHandled,
  local = false,
  radius = null,
  eventFilters: eventFiltersProp,
  onEventFiltersChange,
}) => {
  const profile = useGetCurrentProfile().data;
  const isPremium = isCommunityPlus(profile?.subscription_level);
  const today = moment();
  const earliest = isPremium ? today.clone().subtract(2, 'months') : today.clone().subtract(1, 'weeks');
  const latest = isPremium ? today.clone().add(3, 'months') : today.clone().add(1, 'months');

  const clampToRange = (candidate: Moment) => {
    const start = earliest.clone().startOf('day');
    const end = latest.clone().endOf('day');
    return moment.max(start, moment.min(end, candidate));
  };

  const queryClient = useQueryClient();
  const router = useIonRouter();
  const eventFilters = eventFiltersProp ?? DEFAULT_EVENT_FILTERS;
  const eventFiltersRef = useRef<EventFilters>(eventFilters);
  eventFiltersRef.current = eventFilters;
  const { data: eventsResponse, isLoading: eventsLoading } = useGetEvents(eventFilters, { local, radius });
  const events = eventsResponse ?? [];
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Moment>(clampToRange(today).clone().startOf('month'));
  const [selectedDate, setSelectedDate] = useState<Date>(clampToRange(today).toDate());
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEventInterested, setSelectedEventInterested] = useState(false);
  const [selectedEventInterestedCount, setSelectedEventInterestedCount] = useState(0);
  const [showInterestedCountPref, setShowInterestedCountPrefState] = useState(true);
  const [showAddToCalendarPref, setShowAddToCalendarPref] = useState(true);
  const [hideInterestedCountOnMySubmissions, setHideInterestedCountOnMySubmissions] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [viewModeLoaded, setViewModeLoaded] = useState(false);
  const [presentEventFiltersModal, dismissEventFiltersModal] = useIonModal(EventFiltersModal, {
    getInitialFilters: () => eventFiltersRef.current,
    onDismiss: async (filters?: EventFilters) => {
      dismissEventFiltersModal();
      if (filters) {
        onEventFiltersChange?.(filters);
        await Preferences.set({ key: EVENT_FILTER_PREF_KEYS.eventTypes, value: filters.eventTypes.join(',') });
        await Preferences.set({ key: EVENT_FILTER_PREF_KEYS.attendeePrecautionPreferences, value: filters.attendeePrecautionPreferences.join(',') });
        await Preferences.set({ key: EVENT_FILTER_PREF_KEYS.inPersonPrecautions, value: filters.inPersonPrecautions.join(',') });
      }
    },
  });

  const [presentCreateEventModal, dismissCreateEventModal] = useIonModal(CreateEventModal, {
    onDismiss: (data?: { submitted?: boolean; closeCalendar?: boolean }) => {
      if (data?.submitted) {
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['submitted-events'] });
      }
      if (data?.closeCalendar) {
        setIsCalendarOpen(false);
      }
      return dismissCreateEventModal();
    },
    selectedDate,
  });
  const [hostPopoverText, setHostPopoverText] = useState<string | null>(null);
  const HostPopover = () => (
    <IonContent className="ion-padding event-host-popover-content">{hostPopoverText}</IonContent>
  );
  const [presentHostPopover, dismissHostPopover] = useIonPopover(HostPopover, {
    onDismiss: () => dismissHostPopover(),
  });
  const interestEvent = useInterestEvent();
  const uninterestEvent = useUninterestEvent();
  const { addToCalendar, isAvailable: calendarAvailable } = useAddToCalendar();
  const [presentCalendarAlert] = useIonAlert();
  const [presentReminderAlert] = useIonAlert();
  const presentUpsellAlert = useUpsellAlert();

  const eventsByDay = useMemo(() => {
    const map = new Map<string, RefreshEvent[]>();

    events.forEach((event) => {
      if (!event.start_datetime) return;
      const key = moment(event.start_datetime).format('YYYY-MM-DD');
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, event]);
    });

    return map;
  }, [events]);

  const interestedEventsByDay = useMemo(() => {
    const set = new Set<string>();

    events.forEach((event) => {
      if (!event.start_datetime || !event.interested) return;
      set.add(moment(event.start_datetime).format('YYYY-MM-DD'));
    });

    return set;
  }, [events]);

  const selectedDayKey = moment(selectedDate).format('YYYY-MM-DD');
  const eventsForSelectedDate = eventsByDay.get(selectedDayKey) ?? [];
  const activeEventFilterCount = useMemo(() => {
    const groups = [
      eventFilters.eventTypes,
      eventFilters.attendeePrecautionPreferences,
      eventFilters.inPersonPrecautions,
    ];

    return groups.reduce((count, values) => {
      const hasSpecificFilter = Array.isArray(values)
        && values.length > 0
        && !values.includes('all');
      return count + (hasSpecificFilter ? 1 : 0);
    }, 0);
  }, [eventFilters]);
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const weekDays = useMemo(() => {
    const start = moment(selectedDate).clone().startOf('week');
    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const iter = start.clone().add(i, 'days');
      days.push({
        iso: iter.format('YYYY-MM-DD'),
        label: iter.date(),
        date: iter.toDate(),
        isCurrentMonth: iter.month() === calendarMonth.month(),
      });
    }
    return days;
  }, [selectedDate, calendarMonth]);

  useEffect(() => {
    if (!eventsForSelectedDate.length) {
      if (selectedEventId !== null) {
        setSelectedEventId(null);
      }

      return;
    }

    const selectedEventStillVisible = eventsForSelectedDate.some((event) => event.id === selectedEventId);
    if (!selectedEventStillVisible) {
      setSelectedEventId(null);
    }
  }, [eventsForSelectedDate, selectedEventId]);

  const selectedEvent = eventsForSelectedDate.find((event) => event.id === selectedEventId) ?? null;
  const normalizeInterestedCount = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };
  useEffect(() => {
    setSelectedEventInterested(Boolean(selectedEvent?.interested));
    setSelectedEventInterestedCount(normalizeInterestedCount(selectedEvent?.interested_count));
  }, [selectedEvent?.id, selectedEvent?.interested, selectedEvent?.interested_count]);

  useEffect(() => {
    let cancelled = false;

    const syncPrefs = async () => {
      const [showInterestedCount, hideOnMySubmissions, showAddToCalendar] = await Promise.all([
        getShowInterestedCountPref(),
        getHideInterestedCountOnMySubmissionsPref(),
        getShowAddToCalendarPref(),
      ]);
      if (cancelled) {
        return;
      }
      setShowInterestedCountPrefState(showInterestedCount);
      setHideInterestedCountOnMySubmissions(hideOnMySubmissions);
      setShowAddToCalendarPref(showAddToCalendar);
    };

    const handleShowInterestedCountChanged = (event: Event) => {
      setShowInterestedCountPrefState(Boolean((event as CustomEvent<boolean>).detail));
    };

    const handleHideOnMySubmissionsChanged = (event: Event) => {
      setHideInterestedCountOnMySubmissions(Boolean((event as CustomEvent<boolean>).detail));
    };

    const handleShowAddToCalendarChanged = (event: Event) => {
      setShowAddToCalendarPref(Boolean((event as CustomEvent<boolean>).detail));
    };

    syncPrefs();
    window.addEventListener(SHOW_INTERESTED_COUNT_CHANGED_EVENT, handleShowInterestedCountChanged);
    window.addEventListener(HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_CHANGED_EVENT, handleHideOnMySubmissionsChanged);
    window.addEventListener(SHOW_ADD_TO_CALENDAR_CHANGED_EVENT, handleShowAddToCalendarChanged);

    return () => {
      cancelled = true;
      window.removeEventListener(SHOW_INTERESTED_COUNT_CHANGED_EVENT, handleShowInterestedCountChanged);
      window.removeEventListener(HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_CHANGED_EVENT, handleHideOnMySubmissionsChanged);
      window.removeEventListener(SHOW_ADD_TO_CALENDAR_CHANGED_EVENT, handleShowAddToCalendarChanged);
    };
  }, []);
  const eventAnonymous = Boolean(selectedEvent?.anonymous);
  const eventAvatarDisplay = getAvatarDisplay({
    profileImage: selectedEvent?.profile_image,
    viewerConnect: profile?.settings_community_profile,
    authorConnect: selectedEvent?.settings_community_profile,
  });

  const [presentEventActionSheet] = useIonActionSheet();
  const [presentReminderSheet] = useIonActionSheet();
  const [presentEventReport, dismissEventReport] = useIonModal(EventReportModal, {
    eventId: selectedEvent?.id ?? 0,
    eventTitle: selectedEvent?.name ?? 'Event',
    onDismiss: () => dismissEventReport(),
  });
  const [eventProfilePresent, eventProfileDismiss] = useSheetModal(CommunityProfileModal, {
    userId: selectedEvent?.user ?? null,
    isAnonymous: eventAnonymous,
    avatarUrl: eventAvatarDisplay.hasImage ? eventAvatarDisplay.src : undefined,
    onDismiss: () => eventProfileDismiss(),
  });

  const clampMonth = (candidate: Moment) => {
    const start = earliest.clone().startOf('month');
    const end = latest.clone().startOf('month');
    return moment.max(start, moment.min(end, candidate));
  };

  const canGoPrevMonth = calendarMonth.clone().startOf('month').isAfter(earliest.clone().startOf('month'));
  const canGoNextMonth = calendarMonth.clone().endOf('month').isBefore(latest.clone().endOf('month'));
  const currentWeekStart = moment(selectedDate).startOf('week');
  const currentWeekEnd = currentWeekStart.clone().endOf('week');
  const canGoPrevWeek = currentWeekStart.isAfter(earliest.clone().startOf('day'));
  const canGoNextWeek = currentWeekEnd.isBefore(latest.clone().endOf('day'));

  const prevAtNonPremiumLimit = !isPremium && (viewMode === 'month' ? !canGoPrevMonth : !canGoPrevWeek);
  const nextAtNonPremiumLimit = !isPremium && (viewMode === 'month' ? !canGoNextMonth : !canGoNextWeek);

  const clampTarget = (candidate: Moment) => clampToRange(candidate);

  const openEventsCalendar = (dateOverride?: string, eventIdOverride?: number | null) => {
    const candidate = dateOverride ? moment(dateOverride) : today.clone();
    const clamped = clampTarget(candidate.isValid() ? candidate : today.clone());
    setSelectedDate(clamped.toDate());
    setCalendarMonth(clamped.clone().startOf('month'));
    setSelectedEventId(eventIdOverride ?? null);
    setIsCalendarOpen(true);
  };

  useEffect(() => {
    const load = async () => {
      const storedViewMode = await Preferences.get({ key: EVENTS_CALENDAR_VIEW_MODE_PREF_KEY });
      if (storedViewMode.value === 'week' || storedViewMode.value === 'month') {
        setViewMode(storedViewMode.value);
      }
      setViewModeLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!viewModeLoaded) return;
    Preferences.set({ key: EVENTS_CALENDAR_VIEW_MODE_PREF_KEY, value: viewMode });
  }, [viewMode, viewModeLoaded]);

  useEffect(() => {
    if (!openOnLoad || !initialDate) return;
    const candidate = moment(initialDate);
    if (!candidate.isValid()) return;
    openEventsCalendar(candidate.format('YYYY-MM-DD'), initialEventId ?? null);
    onAutoOpenHandled?.();
  }, [initialDate, initialEventId, onAutoOpenHandled, openOnLoad]);

  const handleSelectDay = (date: Date) => {
    const day = moment(date);
    if (!day.isBetween(earliest.clone().startOf('day'), latest.clone().endOf('day'), 'day', '[]')) {
      return;
    }
    if (!day.isSame(calendarMonth, 'month')) {
      setCalendarMonth(day.clone().startOf('month'));
    }
    setSelectedDate(date);
  };

  const changeMonth = (delta: number) => {
    setCalendarMonth((prev) => clampMonth(prev.clone().add(delta, 'month')));
  };

  const changeWeek = (delta: number) => {
    const candidate = moment(selectedDate).clone().add(delta, 'weeks');
    const clamped = clampTarget(candidate);
    setSelectedDate(clamped.toDate());
    setCalendarMonth(clamped.clone().startOf('month'));
  };

  const displayDays = viewMode === 'month' ? calendarDays : weekDays;
  const isWeekView = viewMode === 'week';

  const handleOpenCalendar = () => openEventsCalendar();
  const handleInterestEvent = async () => {
    if (!selectedEvent?.id) return;
    const previousInterested = selectedEventInterested;
    const previousCount = selectedEventInterestedCount;
    setSelectedEventInterested(true);
    if (!previousInterested) {
      setSelectedEventInterestedCount(previousCount + 1);
    }
    try {
      await interestEvent.mutateAsync(selectedEvent);
    } catch (error) {
      setSelectedEventInterested(previousInterested);
      setSelectedEventInterestedCount(previousCount);
    }
  };

  const handleUninterestEvent = async () => {
    if (!selectedEvent?.id) return;
    const previousInterested = selectedEventInterested;
    const previousCount = selectedEventInterestedCount;
    setSelectedEventInterested(false);
    if (previousInterested) {
      setSelectedEventInterestedCount(Math.max(0, previousCount - 1));
    }
    try {
      await uninterestEvent.mutateAsync(selectedEvent.id);
    } catch (error) {
      setSelectedEventInterested(previousInterested);
      setSelectedEventInterestedCount(previousCount);
    }
  };
  const triggerNode = renderTrigger ? renderTrigger(handleOpenCalendar) : (
    <IonRow className="events-calendar-trigger">
      <IonButton fill="outline" color="primary" onClick={handleOpenCalendar}>
        <IonIcon icon={calendarNumber} slot="start" />
        Events calendar
      </IonButton>
    </IonRow>
  );

  return (
    <>
      {triggerNode}
      <IonModal isOpen={isCalendarOpen} onDidDismiss={() => setIsCalendarOpen(false)}>
        <IonHeader>
          <IonToolbar className="events-calendar-toolbar">
            <IonTitle>Community events</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setIsCalendarOpen(false)}>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="refreshments-calendar-modal">
          <div className="calendar-mode-switch">
            <IonButton size="small" fill={viewMode === 'week' ? 'solid' : 'outline'} onClick={() => setViewMode('week')}>
              Week
            </IonButton>
            <IonButton size="small" fill={viewMode === 'month' ? 'solid' : 'outline'} onClick={() => setViewMode('month')}>
              Month
            </IonButton>
          </div>
          <div className="calendar-header">
            <IonButton
              fill="clear"
              color={prevAtNonPremiumLimit ? 'medium' : undefined}
              disabled={!isPremium ? false : (viewMode === 'month' ? !canGoPrevMonth : !canGoPrevWeek)}
              onClick={() => {
                if (viewMode === 'month') {
                  if (canGoPrevMonth) { changeMonth(-1); return; }
                } else {
                  if (canGoPrevWeek) { changeWeek(-1); return; }
                }
                if (!isPremium) {
                  presentUpsellAlert({
                    header: 'Get Community+ & Pro',
                    message: 'Browse up to 2 months back and 3 months ahead with a subscription.',
                    onSeePlans: () => setIsCalendarOpen(false),
                  });
                }
              }}
            >
              ‹
            </IonButton>
            <IonText className="calendar-month-label">
              {viewMode === 'month'
                ? calendarMonth.format('MMMM YYYY')
                : currentWeekStart.format('MMM D') + ' - ' + currentWeekEnd.format('MMM D')}
            </IonText>
            <IonButton
              fill="clear"
              color={nextAtNonPremiumLimit ? 'medium' : undefined}
              disabled={!isPremium ? false : (viewMode === 'month' ? !canGoNextMonth : !canGoNextWeek)}
              onClick={() => {
                if (viewMode === 'month') {
                  if (canGoNextMonth) { changeMonth(1); return; }
                } else {
                  if (canGoNextWeek) { changeWeek(1); return; }
                }
                if (!isPremium) {
                  presentUpsellAlert({
                    header: 'Get Community+ & Pro',
                    message: 'Browse up to 2 months back and 3 months ahead with a subscription.',
                    onSeePlans: () => setIsCalendarOpen(false),
                  });
                }
              }}
            >
              ›
            </IonButton>
          </div>
          <div className={`calendar-grid ${isWeekView ? 'calendar-grid--week' : ''}`}>
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className="calendar-weekday">
                {weekday}
              </span>
            ))}
            {displayDays.map((day) => {
              const hasEvents = eventsByDay.has(day.iso);
              const hasInterestedEvents = interestedEventsByDay.has(day.iso);
              const isSelected = day.iso === selectedDayKey;
              const isWithinAllowedRange = moment(day.date).isBetween(
                earliest.clone().startOf('day'),
                latest.clone().endOf('day'),
                'day',
                '[]'
              );
              const isDisabled = !isWithinAllowedRange;
              return (
                <button
                  key={day.iso}
                  type="button"
                  className={[
                    'calendar-day',
                    day.isCurrentMonth ? '' : 'calendar-day--not-current',
                    hasEvents ? 'calendar-day--has-event' : '',
                    isSelected ? 'calendar-day--selected' : '',
                    isDisabled ? 'calendar-day--disabled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => (isDisabled ? undefined : handleSelectDay(day.date))}
                  disabled={isDisabled}
                >
                  <span className="calendar-day-label">{day.label}</span>
                  {hasInterestedEvents ? (
                    <IonIcon className="calendar-day-interest-star" icon={star} />
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="calendar-event-cards">
            {eventsLoading ? (
              <IonRow className="ion-justify-content-center">
                <IonSpinner name="dots" />
              </IonRow>
            ) : eventsForSelectedDate.length ? (
              eventsForSelectedDate.map((event) => {
                const isExpanded = selectedEventId === event.id;
                const eventEndsAt = event.end_datetime ?? event.start_datetime;
                const isPastEvent = Boolean(
                  eventEndsAt &&
                  moment(eventEndsAt).isValid() &&
                  moment(eventEndsAt).isBefore(moment())
                );
                const eventIsInterested = isExpanded ? selectedEventInterested : Boolean(event.interested);
                const eventInterestedCount = isExpanded
                  ? selectedEventInterestedCount
                  : normalizeInterestedCount(event.interested_count);
                const isOwnSubmission = event.user != null && event.user === profile?.user;
                const showInterestedCount = isPremium
                  && eventInterestedCount > 3
                  && !(hideInterestedCountOnMySubmissions && isOwnSubmission);
                return (
                  <IonCard key={event.id} className={`calendar-event-card ${isExpanded ? 'calendar-event-card--expanded' : ''}`}>
                    <IonCardContent>
                      <div className="calendar-event-card-toggle-row">
                        <button
                          type="button"
                          className="calendar-event-card-toggle"
                          onClick={() => setSelectedEventId(event.id)}
                        >
                          <span className="calendar-event-card-name">{event.name}</span>
                          <span className="calendar-event-card-time">
                            {moment(event.start_datetime).format('MMM D, h:mm A')} – {moment(event.end_datetime).format('h:mm A')} {localTzAbbr(event.start_datetime)}
                          </span>
                        </button>
                        <div className="calendar-event-interest-meta">
                          {isPastEvent ? (
                            <span className="event-status-badge">Past event</span>
                          ) : null}
                          {showInterestedCount ? (
                            <span className="calendar-event-interest-count" data-testid={`event-interest-count-${event.id}`}>
                              {eventInterestedCount}
                            </span>
                          ) : null}
                          <IonButton
                            fill="clear"
                            size="small"
                            className="calendar-event-star"
                            onClick={isExpanded ? (eventIsInterested ? handleUninterestEvent : handleInterestEvent) : undefined}
                            disabled={interestEvent.isPending || uninterestEvent.isPending}
                          >
                            <IonIcon icon={eventIsInterested ? star : starOutline} color={eventIsInterested ? 'warning' : 'medium'} />
                          </IonButton>
                        </div>
                      </div>
                      {isExpanded && (
                        <RefreshmentsEventDetails
                          event={selectedEvent!}
                          anonymous={eventAnonymous}
                          avatarDisplay={eventAvatarDisplay}
                          settingsAlt={Boolean(profile?.settings_alt_text)}
                          onProfilePresent={() => eventProfilePresent({ cssClass: 'community-profile-modal' })}
                          onHostInfo={(e) => {
                            setHostPopoverText("I can answer questions about this event! (I'm the host or know the host)");
                            presentHostPopover({ event: e.nativeEvent as Event });
                          }}
                          onExternalLinkClick={selectedEvent?.external_link ? () => {
                            presentCalendarAlert({
                              header: 'Open link?',
                              message: selectedEvent.external_link!,
                              buttons: [
                                { text: 'Cancel', role: 'cancel' },
                                { text: 'Open', handler: () => openExternalUrl(selectedEvent.external_link!) },
                              ],
                            });
                          } : undefined}
                          actions={
                            <>
                              {selectedEvent!.post ? (
                                <IonButton fill="outline" size="small" onClick={() => { setIsCalendarOpen(false); router.push(`/community/${selectedEvent!.post}`); }}>
                                  View post
                                </IonButton>
                              ) : null}
                              {!isPastEvent && showAddToCalendarPref ? (
                                <IonButton
                                  fill="outline"
                                  size="small"
                                  onClick={async () => {
                                    if (!calendarAvailable) {
                                      presentCalendarAlert({
                                        header: 'Mobile only',
                                        message: 'Saving to calendar only works on the mobile app.',
                                        buttons: ['OK'],
                                      });
                                      return;
                                    }

                                    const saveWithAlerts = async (alerts: number[]) => {
                                      const result = await addToCalendar({
                                        title: selectedEvent!.name ?? 'Event',
                                        startDate: new Date(selectedEvent!.start_datetime!),
                                        endDate: new Date(selectedEvent!.end_datetime ?? selectedEvent!.start_datetime!),
                                        location: selectedEvent!.location,
                                        notes: selectedEvent!.description,
                                        alerts,
                                      });
                                      if (result === 'success') {
                                        presentCalendarAlert({
                                          header: 'Added to calendar',
                                          message: 'The event has been saved to your default calendar.',
                                          buttons: [
                                            { text: 'Open Calendar', handler: () => { window.open(Capacitor.getPlatform() === 'android' ? 'content://com.android.calendar/time/' : 'calshow://', '_system'); } },
                                            { text: 'Done', role: 'cancel' },
                                          ],
                                        });
                                      } else if (result === 'denied') {
                                        presentCalendarAlert({
                                          header: 'Calendar access',
                                          message: "Refresh doesn't have permission to access your calendar. You can enable it in your device settings.",
                                          buttons: ['OK'],
                                        });
                                      } else if (result === 'unavailable') {
                                        presentCalendarAlert({
                                          header: 'Could not save event',
                                          message: 'Something went wrong adding the event to your calendar. Please try again.',
                                          buttons: ['OK'],
                                        });
                                      }
                                    };

                                    if (Capacitor.getPlatform() === 'ios') {
                                      if (isPremium) {
                                        presentReminderAlert({
                                          header: 'Add reminders',
                                          subHeader: 'Choose up to 2',
                                          inputs: REMINDER_OPTIONS
                                            .filter(o => o.minutes !== null)
                                            .map(o => ({
                                              type: 'checkbox' as const,
                                              label: o.text,
                                              value: String(o.minutes),
                                            })),
                                          buttons: [
                                            { text: 'No reminder', role: 'cancel', handler: () => saveWithAlerts([]) },
                                            { text: 'Save', handler: (selected: string[]) => saveWithAlerts(selected.slice(0, 2).map(Number)) },
                                          ],
                                        });
                                      } else {
                                        presentReminderSheet({
                                          header: 'Add a reminder?',
                                          buttons: [
                                            ...REMINDER_OPTIONS
                                              .filter(o => o.free)
                                              .map(o => ({
                                                text: o.text,
                                                handler: () => saveWithAlerts(o.minutes === null ? [] : [o.minutes]),
                                              })),
                                            { text: 'Cancel', role: 'cancel' },
                                          ],
                                        });
                                      }
                                    } else {
                                      await saveWithAlerts([]);
                                    }
                                  }}
                                >
                                  <IonIcon icon={calendarOutline} slot="start" />
                                  Save to device calendar
                                </IonButton>
                              ) : null}
                            </>
                          }
                          footer={
                            <EllipsisMenuButton
                              className="calendar-event-ellipsis-corner"
                              onClick={() => presentEventActionSheet({
                                buttons: [
                                  { text: 'Report event', role: 'destructive', handler: () => presentEventReport() },
                                  { text: 'Cancel', role: 'cancel' },
                                ],
                              })}
                            />
                          }
                        />
                      )}
                    </IonCardContent>
                  </IonCard>
                );
              })
            ) : (
              <IonText color="medium">No events scheduled for this day.</IonText>
            )}
          </div>
          <IonRow className="calendar-add-event-row ion-justify-content-center">
            <IonButton color="navy" onClick={() => presentCreateEventModal()}>
              Add an event
            </IonButton>
            <IonButton fill="outline" onClick={() => presentEventFiltersModal()}>
              <IonIcon icon={filterIcon} slot="start" />
              Filters
              {activeEventFilterCount > 0 ? (
                <IonBadge className="events-calendar-filter-badge" color="primary">
                  {activeEventFilterCount}
                </IonBadge>
              ) : null}
            </IonButton>
          </IonRow>
        </IonContent>
      </IonModal>
    </>
  );
};

export default EventsCalendar;
