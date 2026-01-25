import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRow,
  IonSpinner,
  IonText,
  IonToolbar,
  IonTitle,
  IonHeader,
  IonChip,
  useIonModal,
  useIonRouter,
} from '@ionic/react';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { calendarNumber } from 'ionicons/icons';
import moment, { type Moment } from 'moment';
import type { RefreshEvent } from '../hooks/api/events';
import { useGetEvents } from '../hooks/api/events';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { isCommunityPlus } from '../hooks/utilities';
import { PhotoProvider, PhotoView } from 'react-photo-view';

import CreateEventModal from './CreateEventModal';

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

type EventsCalendarProps = {
  renderTrigger?: (open: () => void) => React.ReactNode;
};

const EventsCalendar: React.FC<EventsCalendarProps> = ({ renderTrigger }) => {
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
  const { data: eventsResponse, isLoading: eventsLoading } = useGetEvents();
  const events = eventsResponse ?? [];
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Moment>(clampToRange(today).clone().startOf('month'));
  const [selectedDate, setSelectedDate] = useState<Date>(clampToRange(today).toDate());
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [presentCreateEventModal, dismissCreateEventModal] = useIonModal(CreateEventModal, {
    onDismiss: (data?: { submitted?: boolean }) => {
      if (data?.submitted) {
        queryClient.invalidateQueries({ queryKey: ['events'] });
      }
      dismissCreateEventModal();
    },
  });

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
  const selectedEventType = selectedEvent?.event_type ? formatEventType(selectedEvent.event_type) : null;
  const safeExternalLink: string | undefined = selectedEvent?.external_link ?? undefined;

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

  const openEventsCalendar = () => {
    const clamped = clampTarget(today.clone());
    setSelectedDate(clamped.toDate());
    setCalendarMonth(clamped.clone().startOf('month'));
    setIsCalendarOpen(true);
  };

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

  const triggerNode = renderTrigger ? renderTrigger(openEventsCalendar) : (
    <IonRow className="events-calendar-trigger">
      <IonButton fill="outline" color="primary" onClick={openEventsCalendar}>
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
                  <span>{day.label}</span>
                </button>
              );
            })}
          </div>
          <div className="calendar-event-list">
            {eventsLoading ? (
              <IonRow className="ion-justify-content-center">
                <IonSpinner name="dots" />
              </IonRow>
            ) : eventsForSelectedDate.length ? (
              <IonList>
                {eventsForSelectedDate.map((event) => (
                  <IonItem
                    key={event.id}
                    button
                    detail
                    className={`calendar-event-item ${selectedEventId === event.id ? 'calendar-event-item--selected' : ''}`}
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    <IonLabel>
                      <h3>{event.name}</h3>
                      <p>{moment(event.start_datetime).format('MMM D, h:mm A')}</p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            ) : (
              <IonText color="medium">No events scheduled for this day.</IonText>
            )}
          </div>
          <IonRow className="calendar-add-event-row">
            <IonButton expand="full" fill="outline" onClick={() => presentCreateEventModal()}>
              Add an event
            </IonButton>
          </IonRow>
          {selectedEvent && (
            <IonCard className="calendar-event-detail">
              <IonCardContent>
                <IonCardTitle>{selectedEvent.name}</IonCardTitle>
                {selectedEventType && <IonCardSubtitle>{selectedEventType}</IonCardSubtitle>}
                <IonText color="medium">
                  {moment(selectedEvent.start_datetime).format('MMMM D, h:mm A')} –{' '}
                  {moment(selectedEvent.end_datetime).format('h:mm A')}
                </IonText>
                <IonText className="calendar-event-description">
                  {selectedEvent.description || 'No description provided.'}
                </IonText>
                {selectedEvent.in_person_precautions?.length ? (
                  <div className="calendar-precautions">
                    {selectedEvent.in_person_precautions.map((precaution) => (
                      <IonChip key={precaution}>
                        <IonLabel>{formatPrecautionLabel(precaution)}</IonLabel>
                      </IonChip>
                    ))}
                  </div>
                ) : null}
                {selectedEvent.external_registration_required && (
                  <IonText color="secondary">External registration required.</IonText>
                )}
                {safeExternalLink && (
                  <IonButton fill="outline" target="_blank" rel="noreferrer" href={safeExternalLink}>
                    Learn more
                  </IonButton>
                )}
                {selectedEvent.post && (
                  <IonButton
                    fill="outline"
                    size="small"
                    onClick={() => {
                      setIsCalendarOpen(false);
                      router.push(`/community/${selectedEvent.post}`);
                    }}
                  >
                    View post
                  </IonButton>
                )}
                {selectedEvent.image && (
                  <PhotoProvider bannerVisible={false}>
                    <PhotoView src={selectedEvent.image}>
                      <img src={selectedEvent.image} alt={selectedEvent.name} className="calendar-event-image" />
                    </PhotoView>
                  </PhotoProvider>
                )}
              </IonCardContent>
            </IonCard>
          )}
        </IonContent>
      </IonModal>
    </>
  );
};

export default EventsCalendar;
