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
  IonText,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import React, { useMemo, useState } from 'react';
import { useGetSubmittedAnnouncements } from '../hooks/api/announcements-take-1/submitted-anns';
import { useGetSubmittedEvents } from '../hooks/api/submitted-events';
import { useHistory } from 'react-router-dom';

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

const SubmittedPosts: React.FC = () => {
  const history = useHistory();
  const now = useMemo(() => new Date(), []);
  const {
    data,
    isLoading,
  } = useGetSubmittedAnnouncements();
  const {
    data: eventsData,
    isLoading: eventsLoading,
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
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/community" />
          </IonButtons>
          <IonTitle>My Submitted Posts</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
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
              const submittedAt = lastEditedAtDate
                ? lastEditedAtDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : null;

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
                <IonRow class="ion-justify-content-between ion-align-items-center">
                  <div>
                    <h2>{post?.title}</h2>
                    {submittedAt && <p>Submitted {submittedAt}</p>}
                  </div>
                  <IonBadge color={statusColor}>{statusLabel}</IonBadge>
                </IonRow>
              </IonCardContent>
            </IonCard>
          );
        })}

        <IonRow class="ion-padding">
          <IonText>
            <h2>My Submitted Events</h2>
          </IonText>
        </IonRow>

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
          const eventDate = event?.start_datetime
            ? new Date(event.start_datetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : null;

          return (
            <IonCard key={`event-${event?.id}`} color="white">
              <IonCardContent>
                <IonRow class="ion-justify-content-between ion-align-items-center" onClick={() => handleEventClick(event)}>
                  <div>
                    <h2>{event?.name}</h2>
                    {eventDate && <p>Event {eventDate}</p>}
                  </div>
                  <IonBadge color={statusColor}>{statusLabel}</IonBadge>
                </IonRow>
              </IonCardContent>
            </IonCard>
          );
        })}
        <IonModal isOpen={eventDetailOpen} onDidDismiss={() => setEventDetailOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setEventDetailOpen(false)}>Back</IonButton>
              </IonButtons>
              <IonTitle>Event details</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonText>
              <h2>{selectedEvent?.name}</h2>
            </IonText>
            <IonBadge color={eventStatusColorMap[(selectedEvent?.status ?? 'pending').toLowerCase()] ?? 'medium'}>
              {eventStatusLabelMap[(selectedEvent?.status ?? 'pending').toLowerCase()] ?? 'Pending moderator review'}
            </IonBadge>
            <IonList>
              {formatEventDateTime(selectedEvent) && (
                <IonItem>
                  <IonLabel>Date</IonLabel>
                  <IonText>{formatEventDateTime(selectedEvent)}</IonText>
                </IonItem>
              )}
              {selectedEvent?.location && (
                <IonItem>
                  <IonLabel>Location</IonLabel>
                  <IonText>{selectedEvent.location}</IonText>
                </IonItem>
              )}
              {selectedEvent?.description && (
                <IonItem>
                  <IonLabel>Description</IonLabel>
                  <IonText>{selectedEvent.description}</IonText>
                </IonItem>
              )}
              {selectedEvent?.external_link && (
                <IonItem>
                  <IonLabel>Link</IonLabel>
                  <IonText>{selectedEvent.external_link}</IonText>
                </IonItem>
              )}
            </IonList>
            <IonButton expand="block" onClick={() => setEventDetailOpen(false)}>
              Close
            </IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default SubmittedPosts;
