import {
  IonButton,
  IonButtons,
  IonAvatar,
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
  IonChip,
  useIonActionSheet,
  useIonPopover,
  useIonModal,
  useIonRouter,
} from '@ionic/react';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { calendarNumber, filter as filterIcon, star, starOutline } from 'ionicons/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandWave } from '@fortawesome/pro-solid-svg-icons/faHandWave';
import moment, { type Moment } from 'moment';
import type { RefreshEvent } from '../hooks/api/events';
import { useGetEvents, DEFAULT_EVENT_FILTERS, EVENT_FILTER_PREF_KEYS, EventFilters } from '../hooks/api/events';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { getAvatarDisplay, isCommunityPlus, onImgError } from '../hooks/utilities';
import { useSheetModal } from '../hooks/useSheetModal';
import { PhotoProvider, PhotoView } from 'react-photo-view';

import EllipsisMenuButton from './EllipsisMenuButton';
import CreateEventModal from './CreateEventModal';
import CommunityProfileModal from './CommunityProfileModal';
import EventReportModal from './EventReportModal';
import EventFiltersModal from './EventFiltersModal';
import { Preferences } from '@capacitor/preferences';
import { useInterestEvent, useUninterestEvent } from '../hooks/api/interests';

import './EventsCalendar.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

const formatEventType = (value?: string) => {
  if (!value) return null;
  return value.replace(/_/g, ' ');
};

const formatPrecautionLabel = (value: string) =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const ATTENDEE_PRECAUTION_LABELS: Record<string, string> = {
  precautions_only: 'Covid conscientious only',
  precautions_preferred: 'Covid conscientious preferred',
  open: 'Open to everyone',
};

const ATTENDEE_PRECAUTION_COLORS: Record<string, string> = {
  precautions_only: 'warning',
  precautions_preferred: 'tertiary',
  open: 'success',
};

type EventsCalendarProps = {
  renderTrigger?: (open: () => void) => React.ReactNode;
  initialDate?: string;
  openOnLoad?: boolean;
  onAutoOpenHandled?: () => void;
};

const EventsCalendar: React.FC<EventsCalendarProps> = ({
  renderTrigger,
  initialDate,
  openOnLoad,
  onAutoOpenHandled,
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
  const [eventFilters, setEventFilters] = useState<EventFilters>(DEFAULT_EVENT_FILTERS);
  const eventFiltersRef = useRef<EventFilters>(eventFilters);
  eventFiltersRef.current = eventFilters;
  const { data: eventsResponse, isLoading: eventsLoading } = useGetEvents(eventFilters);
  const events = eventsResponse ?? [];
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Moment>(clampToRange(today).clone().startOf('month'));
  const [selectedDate, setSelectedDate] = useState<Date>(clampToRange(today).toDate());
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEventInterested, setSelectedEventInterested] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [presentEventFiltersModal, dismissEventFiltersModal] = useIonModal(EventFiltersModal, {
    getInitialFilters: () => eventFiltersRef.current,
    onDismiss: async (filters?: EventFilters) => {
      dismissEventFiltersModal();
      if (filters) {
        setEventFilters(filters);
        await Preferences.set({ key: EVENT_FILTER_PREF_KEYS.eventTypes, value: filters.eventTypes.join(',') });
        await Preferences.set({ key: EVENT_FILTER_PREF_KEYS.attendeePrecautionPreferences, value: filters.attendeePrecautionPreferences.join(',') });
        await Preferences.set({ key: EVENT_FILTER_PREF_KEYS.inPersonPrecautions, value: filters.inPersonPrecautions.join(',') });
      }
    },
  });

  const [presentCreateEventModal, dismissCreateEventModal] = useIonModal(CreateEventModal, {
    onDismiss: (data?: { submitted?: boolean }) => {
      if (data?.submitted) {
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['submitted-events'] });
      }
      dismissCreateEventModal();
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

    if (!eventsForSelectedDate.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(eventsForSelectedDate[0].id);
    }
  }, [eventsForSelectedDate, selectedEventId]);

  const selectedEvent = eventsForSelectedDate.find((event) => event.id === selectedEventId) ?? null;
  useEffect(() => {
    setSelectedEventInterested(Boolean(selectedEvent?.interested));
  }, [selectedEvent?.id, selectedEvent?.interested]);
  const selectedEventType = selectedEvent?.event_type ? formatEventType(selectedEvent.event_type) : null;
  const safeExternalLink: string | undefined = selectedEvent?.external_link ?? undefined;
  const eventAnonymous = Boolean(selectedEvent?.anonymous);
  const eventAvatarDisplay = getAvatarDisplay({
    profileImage: selectedEvent?.profile_image,
    viewerConnect: profile?.settings_community_profile,
    authorConnect: selectedEvent?.settings_community_profile,
  });

  const [presentEventActionSheet] = useIonActionSheet();
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

  const clampTarget = (candidate: Moment) => clampToRange(candidate);

  const openEventsCalendar = (dateOverride?: string) => {
    const candidate = dateOverride ? moment(dateOverride) : today.clone();
    const clamped = clampTarget(candidate.isValid() ? candidate : today.clone());
    setSelectedDate(clamped.toDate());
    setCalendarMonth(clamped.clone().startOf('month'));
    setIsCalendarOpen(true);
  };

  useEffect(() => {
    const load = async () => {
      const [types, attendee, precautions] = await Promise.all([
        Preferences.get({ key: EVENT_FILTER_PREF_KEYS.eventTypes }),
        Preferences.get({ key: EVENT_FILTER_PREF_KEYS.attendeePrecautionPreferences }),
        Preferences.get({ key: EVENT_FILTER_PREF_KEYS.inPersonPrecautions }),
      ]);
      setEventFilters({
        eventTypes: types.value ? types.value.split(',') : ['all'],
        attendeePrecautionPreferences: attendee.value ? attendee.value.split(',') : ['all'],
        inPersonPrecautions: precautions.value ? precautions.value.split(',') : ['all'],
      });
    };
    load();
  }, []);

  useEffect(() => {
    if (!openOnLoad || !initialDate) return;
    const candidate = moment(initialDate);
    if (!candidate.isValid()) return;
    openEventsCalendar(candidate.format('YYYY-MM-DD'));
    onAutoOpenHandled?.();
  }, [initialDate, onAutoOpenHandled, openOnLoad]);

  const handleSelectDay = (date: Date) => {
    const day = moment(date);
    if (viewMode === 'week' && !day.isBetween(earliest.clone().startOf('day'), latest.clone().endOf('day'), 'day', '[]')) {
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
    setSelectedEventInterested(true);
    try {
      await interestEvent.mutateAsync(selectedEvent.id);
    } catch (error) {
      setSelectedEventInterested(false);
    }
  };

  const handleUninterestEvent = async () => {
    if (!selectedEvent?.id) return;
    setSelectedEventInterested(false);
    try {
      await uninterestEvent.mutateAsync(selectedEvent.id);
    } catch (error) {
      setSelectedEventInterested(true);
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
              size="small"
              disabled={(viewMode === 'month' ? !canGoPrevMonth : !canGoPrevWeek)}
              onClick={() => {
                if (viewMode === 'month') {
                  if (!canGoPrevMonth) return;
                  changeMonth(-1);
                } else {
                  if (!canGoPrevWeek) return;
                  changeWeek(-1);
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
              size="small"
              disabled={(viewMode === 'month' ? !canGoNextMonth : !canGoNextWeek)}
              onClick={() => {
                if (viewMode === 'month') {
                  if (!canGoNextMonth) return;
                  changeMonth(1);
                } else {
                  if (!canGoNextWeek) return;
                  changeWeek(1);
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
              const isAllowedWeek = moment(day.date).isBetween(
                earliest.clone().startOf('day'),
                latest.clone().endOf('day'),
                'day',
                '[]'
              );
              const isDisabled = viewMode === 'week' && !isAllowedWeek;
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
                const eventIsInterested = isExpanded ? selectedEventInterested : Boolean(event.interested);
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
                            {moment(event.start_datetime).format('MMM D, h:mm A')} – {moment(event.end_datetime).format('h:mm A')}
                          </span>
                        </button>
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
                      {isExpanded && (
                        <div className="calendar-event-card-details">
                          {!eventAnonymous && selectedEvent?.username && (
                            <IonRow
                              className="calendar-event-byline"
                              onClick={() => eventProfilePresent({ cssClass: 'community-profile-modal' })}
                            >
                              <IonAvatar className={eventAvatarDisplay.className}>
                                <img src={eventAvatarDisplay.src} onError={(e) => onImgError(e)} />
                              </IonAvatar>
                              <IonText>shared by {selectedEvent.username}</IonText>
                              {selectedEvent?.can_answer_questions && (
                                <IonButton
                                  fill="clear"
                                  size="small"
                                  className="calendar-event-host-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHostPopoverText("I can answer questions about this event! (I'm the host or know the host)");
                                    presentHostPopover({ event: e.nativeEvent as Event });
                                  }}
                                >
                                  <FontAwesomeIcon icon={faHandWave} />
                                </IonButton>
                              )}
                            </IonRow>
                          )}
                          {selectedEventType && <p className="calendar-event-type">{selectedEventType}</p>}
                          <IonText className="calendar-event-description">
                            {selectedEvent!.description || 'No description provided.'}
                          </IonText>
                          {selectedEvent!.attendee_precaution_preference ? (
                            <IonChip color={ATTENDEE_PRECAUTION_COLORS[selectedEvent!.attendee_precaution_preference] ?? 'medium'}>
                              <IonLabel>{ATTENDEE_PRECAUTION_LABELS[selectedEvent!.attendee_precaution_preference] ?? selectedEvent!.attendee_precaution_preference}</IonLabel>
                            </IonChip>
                          ) : null}
                          {selectedEvent!.in_person_precautions?.length ? (
                            <div className="calendar-precautions">
                              {selectedEvent!.in_person_precautions.map((precaution) => (
                                <IonChip key={precaution} color="medium">
                                  <IonLabel>{formatPrecautionLabel(precaution)}</IonLabel>
                                </IonChip>
                              ))}
                            </div>
                          ) : null}
                          {selectedEvent!.external_registration_required && (
                            <IonText color="secondary" className="calendar-event-registration">External registration required.</IonText>
                          )}
                          {selectedEvent!.image && (
                            <PhotoProvider bannerVisible={false}>
                              <PhotoView src={selectedEvent!.image}>
                                <img src={selectedEvent!.image} alt={selectedEvent!.name} className="calendar-event-image" onError={(e) => onImgError(e)} />
                              </PhotoView>
                            </PhotoProvider>
                          )}
                          <div className="calendar-event-actions">
                            {safeExternalLink && (
                              <IonButton fill="outline" size="small" target="_blank" rel="noreferrer" href={safeExternalLink}>
                                Learn more
                              </IonButton>
                            )}
                            {selectedEvent!.post && (
                              <IonButton fill="outline" size="small" onClick={() => { setIsCalendarOpen(false); router.push(`/community/${selectedEvent!.post}`); }}>
                                View post
                              </IonButton>
                            )}
                          </div>
                          <EllipsisMenuButton
                            className="calendar-event-ellipsis-corner"
                            onClick={() => presentEventActionSheet({
                              buttons: [
                                { text: 'Report event', role: 'destructive', handler: () => presentEventReport() },
                                { text: 'Cancel', role: 'cancel' },
                              ],
                            })}
                          />
                        </div>
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
            </IonButton>
          </IonRow>
        </IonContent>
      </IonModal>
    </>
  );
};

export default EventsCalendar;
