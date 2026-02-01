import {
  IonBackButton,
  IonBadge,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonButton,
  IonNote,
  IonPage,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import React, { useMemo, useState } from 'react';
import { useGetSubmittedAnnouncements } from '../hooks/api/announcements-take-1/submitted-anns';
import { useGetSubmittedEvents } from '../hooks/api/submitted-events';
import { useHistory } from 'react-router-dom';
import './SubmittedPosts.css';

const statusLabelMap: Record<string, string> = {
  pending: 'Pending moderator review',
  approved: 'Approved',
  needs_edit: 'Needs your edit',
  rejected: 'Rejected',
};

const statusColorMap: Record<string, string> = {
  pending: 'medium',
  approved: 'success',
  needs_edit: 'warning',
  rejected: 'danger',
  cancelled: 'medium',
};

const eventStatusLabelMap: Record<string, string> = {
  pending: 'Pending moderator review',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const eventStatusColorMap: Record<string, string> = {
  pending: 'medium',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'medium',
};

const getLastEditedDate = (post: any) => {
  const candidate =
    post?.last_edited ||
    post?.last_edited_at ||
    post?.updated_at ||
    post?.last_updated ||
    post?.approvalDateTime ||
    post?.uploadDateTime;
  return candidate ? new Date(candidate) : null;
};

const getApprovedDate = (item: any) => (
  item?.approvalDateTime ||
  item?.approved_at ||
  item?.approvedAt ||
  item?.approval_date ||
  item?.approvedDateTime
);

const getSubmittedDate = (item: any) => (
  item?.uploadDateTime ||
  item?.submitted_at ||
  item?.submittedAt ||
  item?.created_at ||
  item?.createdAt
);

const formatShortDate = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const SubmittedPosts: React.FC = () => {
  const history = useHistory();
  const now = useMemo(() => new Date(), []);
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetSubmittedAnnouncements();
  const {
    data: eventsData,
    isLoading: eventsLoading,
    fetchNextPage: fetchNextEventsPage,
    hasNextPage: eventsHasNextPage,
    isFetchingNextPage: eventsIsFetchingNextPage,
  } = useGetSubmittedEvents();

  const submissions = useMemo(() => {
    const raw = data?.pages?.flatMap((page) => page?.results ?? []) ?? [];
    return raw.filter((post) => {
      const lastEditedAt = getLastEditedDate(post);
      if (!lastEditedAt || Number.isNaN(lastEditedAt.getTime())) {
        return true;
      }
      const daysSince = (now.getTime() - lastEditedAt.getTime()) / (1000 * 60 * 60 * 24);
      const rawStatus = post?.approval_status ?? (post?.approved ? 'approved' : 'pending');
      const status = rawStatus === 'needs_edit' && daysSince > 5
        ? 'rejected'
        : rawStatus;

      if (status === 'pending' || status === 'rejected') {
        return daysSince <= 14;
      }
      if (status === 'needs_edit') {
        return daysSince <= 5;
      }
      return true;
    });
  }, [data, now]);

  const submittedEvents = useMemo(() => {
    return eventsData?.pages?.flatMap((page) => page?.results ?? []) ?? [];
  }, [eventsData]);

  const [activeSegment, setActiveSegment] = useState<'posts' | 'events'>('posts');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);

  const formatEventDateTime = (event: any) => {
    if (!event?.start_datetime) return null;
    const start = new Date(event.start_datetime);
    if (Number.isNaN(start.getTime())) return null;
    const end = event?.end_datetime ? new Date(event.end_datetime) : null;
    const dateLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const startTime = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    if (end && !Number.isNaN(end.getTime())) {
      const endTime = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      return `${dateLabel} · ${startTime} - ${endTime}`;
    }
    return `${dateLabel} · ${startTime}`;
  };

  const handleEventClick = (event: any) => {
    const status = (event?.status ?? 'pending').toLowerCase();
    if (status === 'approved' && event?.start_datetime) {
      const dateKey = new Date(event.start_datetime).toISOString().slice(0, 10);
      history.push(`/community?calendarDate=${dateKey}`);
      return;
    }
    setSelectedEvent(event);
    setEventDetailOpen(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="modal-title">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/community" />
          </IonButtons>
          <IonTitle>My submissions</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding submitted-posts">
        <IonRow className="segments">
          <IonSegment value={activeSegment}>
            <IonSegmentButton value="posts" onClick={() => setActiveSegment('posts')}>
              <IonLabel>Posts</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="events" onClick={() => setActiveSegment('events')}>
              <IonLabel>Events</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonRow>

        {activeSegment === 'posts' && (
          <>
            {isLoading && (
              <IonRow class="ion-justify-content-center ion-padding">
                <IonSpinner name="dots" />
              </IonRow>
            )}

            {!isLoading && submissions.length === 0 && (
              <IonRow class="ion-justify-content-center ion-padding">
                <IonNote>No submitted posts yet.</IonNote>
              </IonRow>
            )}

            {submissions.length > 0 && submissions.map((post) => {
              const rawStatus =
                post?.approval_status ?? (post?.approved ? 'approved' : 'pending');
              const lastEditedAtDate = getLastEditedDate(post);
              const daysSince = lastEditedAtDate
                ? (now.getTime() - lastEditedAtDate.getTime()) / (1000 * 60 * 60 * 24)
                : 0;
              const status = rawStatus === 'needs_edit' && daysSince > 5
                ? 'rejected'
                : rawStatus;
              const statusLabel = statusLabelMap[status] ?? 'Pending moderator review';
              const statusColor = statusColorMap[status] ?? 'medium';
              const dateValue = status === 'approved'
                ? getApprovedDate(post) ?? getLastEditedDate(post)
                : getSubmittedDate(post) ?? getLastEditedDate(post);
              const dateLabel = formatShortDate(dateValue);

              return (
                <IonCard
                  key={post?.id}
                  color="white"
                  onClick={() =>
                    (status === 'approved'
                      ? history.push(`/community/${post?.id}`)
                      : history.push(`/community/submitted/${post?.id}`, { post })
                    )
                  }
                >
                  <IonCardContent>
                    <div className="submission-card-row">
                      <div className="submission-card-main">
                        <h2>{post?.title}</h2>
                        {dateLabel && <p>{dateLabel}</p>}
                      </div>
                      <div className="submission-card-badge">
                        <IonBadge color={statusColor}>{statusLabel}</IonBadge>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              );
            })}

            {hasNextPage && (
              <IonRow class="ion-justify-content-center ion-padding">
                <IonButton
                  color="navy"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'Loading...' : 'Show more'}
                </IonButton>
              </IonRow>
            )}
          </>
        )}

        {activeSegment === 'events' && (
          <>
            {eventsLoading && (
              <IonRow class="ion-justify-content-center ion-padding">
                <IonSpinner name="dots" />
              </IonRow>
            )}

            {!eventsLoading && submittedEvents.length === 0 && (
              <IonRow class="ion-justify-content-center ion-padding">
                <IonNote>No submitted events yet.</IonNote>
              </IonRow>
            )}

            {!eventsLoading && submittedEvents.length > 0 && submittedEvents.map((event) => {
              const status = (event?.status ?? 'pending').toLowerCase();
              const statusLabel = eventStatusLabelMap[status] ?? 'Pending moderator review';
              const statusColor = eventStatusColorMap[status] ?? 'medium';
              const dateValue = status === 'approved'
                ? getApprovedDate(event) ?? getLastEditedDate(event)
                : getSubmittedDate(event) ?? getLastEditedDate(event);
              const dateLabel = formatShortDate(dateValue);

              return (
                <IonCard key={`event-${event?.id}`} color="white">
                  <IonCardContent>
                    <div className="submission-card-row" onClick={() => handleEventClick(event)}>
                      <div className="submission-card-main">
                        <h2>{event?.name}</h2>
                        {dateLabel && <p>{dateLabel}</p>}
                      </div>
                      <div className="submission-card-badge">
                        <IonBadge color={statusColor}>{statusLabel}</IonBadge>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              );
            })}

            {eventsHasNextPage && (
              <IonRow class="ion-justify-content-center ion-padding">
                <IonButton
                  color="navy"
                  onClick={() => fetchNextEventsPage()}
                  disabled={eventsIsFetchingNextPage}
                >
                  {eventsIsFetchingNextPage ? 'Loading...' : 'Show more'}
                </IonButton>
              </IonRow>
            )}
          </>
        )}
        <IonModal isOpen={eventDetailOpen} onDidDismiss={() => setEventDetailOpen(false)}>
          <IonHeader>
            <IonToolbar className="modal-title">
              <IonButtons slot="start">
                <IonButton onClick={() => setEventDetailOpen(false)}>Back</IonButton>
              </IonButtons>
              <IonTitle>Event details</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding submitted-posts">
            <IonCard color="white" className="preview-card">
              <IonCardContent>
                <IonText color="dark">
                  <h2>{selectedEvent?.name}</h2>
                </IonText>
                <IonRow className="status-row">
                  <IonBadge color={eventStatusColorMap[(selectedEvent?.status ?? 'pending').toLowerCase()] ?? 'medium'}>
                    {eventStatusLabelMap[(selectedEvent?.status ?? 'pending').toLowerCase()] ?? 'Pending moderator review'}
                  </IonBadge>
                </IonRow>
                <IonText color="medium" className="detail-block">
                  {formatEventDateTime(selectedEvent) && (
                    <p><strong>Date:</strong> {formatEventDateTime(selectedEvent)}</p>
                  )}
                  {selectedEvent?.location && (
                    <p><strong>Location:</strong> {selectedEvent.location}</p>
                  )}
                  {selectedEvent?.external_link && (
                    <p><strong>Link:</strong> {selectedEvent.external_link}</p>
                  )}
                </IonText>
                {selectedEvent?.description && (
                  <IonText color="dark">
                    <p>{selectedEvent.description}</p>
                  </IonText>
                )}
              </IonCardContent>
            </IonCard>
            <IonRow class="ion-justify-content-center">
              <IonButton onClick={() => setEventDetailOpen(false)}>
                Close
              </IonButton>
            </IonRow>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default SubmittedPosts;
