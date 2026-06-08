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
  IonToggle,
  IonIcon,
  useIonPopover,
} from '@ionic/react';
import React, { useMemo, useState } from 'react';
import moment from 'moment';
import { useLocation } from 'react-router-dom';
import { useClearRefreshmentsAlertsOnMount } from '../hooks/api/profiles/recent-notifications';
import { useGetSubmittedAnnouncements } from '../hooks/api/refreshments/submitted-anns';
import { useGetSubmittedEvents } from '../hooks/api/submitted-events';
import { useHistory } from 'react-router-dom';
import { eyeOffOutline, informationCircleOutline } from 'ionicons/icons';
import './SubmittedPosts.css';
import { ModerationCopy } from '../enums/moderation';
import { openExternalUrl } from '../hooks/utilities';

const statusLabelMap: Record<string, string> = {
  draft: 'Unsubmitted draft',
  pending: 'Pending moderator review',
  approved: 'Approved',
  needs_edit: 'Needs your edit',
  rejected: 'Not Approved',
};

const statusColorMap: Record<string, string> = {
  draft: 'medium',
  pending: 'medium',
  approved: 'success',
  needs_edit: 'warning',
  rejected: 'danger',
  cancelled: 'medium',
};

const eventStatusLabelMap: Record<string, string> = {
  pending: 'Pending moderator review',
  approved: 'Approved',
  rejected: 'Not Approved',
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

const getExpiresAt = (item: any) => (
  item?.expires_at ||
  item?.expiresAt ||
  null
);

const formatEditableLabel = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const msLeft = date.getTime() - now.getTime();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  if (daysLeft === 1) {
    return 'Editable for 1 day';
  }
  if (daysLeft > 1) {
    return `Editable for ${daysLeft} days`;
  }
  return null;
};

const StatusInfoPopover: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <IonContent className="ion-padding">
    {ModerationCopy.MODERATION_INFO_POPOVER}
  </IonContent>
);

const SubmittedPosts: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const now = useMemo(() => new Date(), []);
  const [showHidden, setShowHidden] = useState(false);
  useClearRefreshmentsAlertsOnMount();
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetSubmittedAnnouncements(showHidden);
  const submissionsWithHiddenQuery = useGetSubmittedAnnouncements(true, { enabled: !showHidden });
  const {
    data: eventsData,
    isLoading: eventsLoading,
    fetchNextPage: fetchNextEventsPage,
    hasNextPage: eventsHasNextPage,
    isFetchingNextPage: eventsIsFetchingNextPage,
  } = useGetSubmittedEvents();

  const initialTab = new URLSearchParams(location.search).get('tab');
  const [activeSegment, setActiveSegment] = useState<'posts' | 'events'>(initialTab === 'events' ? 'events' : 'posts');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [presentEventStatusPopover, dismissEventStatusPopover] = useIonPopover(StatusInfoPopover, {
    onDismiss: () => dismissEventStatusPopover(),
  });

  const submissions = useMemo(() => {
    const raw = data?.pages?.flatMap((page) => page?.results ?? []) ?? [];
    return raw.filter((post) => {
      const expiresAt = getExpiresAt(post);
      if (expiresAt) {
        const expiry = new Date(expiresAt);
        if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < now.getTime()) {
          return false;
        }
      }
      const lastEditedAt = getLastEditedDate(post);
      if (!lastEditedAt || Number.isNaN(lastEditedAt.getTime())) {
        return true;
      }
      const daysSince = (now.getTime() - lastEditedAt.getTime()) / (1000 * 60 * 60 * 24);
      const rawStatus = post?.approval_status ?? (post?.approved ? 'approved' : 'pending');
      const status = rawStatus === 'needs_edit' && daysSince > 7
        ? 'rejected'
        : rawStatus;

      if (status === 'pending' || status === 'rejected') {
        return daysSince <= 7;
      }
      if (status === 'needs_edit') {
        return daysSince <= 7;
      }
      return true;
    });
  }, [data, now]);

  const submittedEvents = useMemo(() => {
    const raw = eventsData?.pages?.flatMap((page) => page?.results ?? []) ?? [];
    return raw.filter((event) => {
      const expiresAt = getExpiresAt(event);
      if (!expiresAt) {
        return true;
      }
      const expiry = new Date(expiresAt);
      if (Number.isNaN(expiry.getTime())) {
        return true;
      }
      return expiry.getTime() >= now.getTime();
    });
  }, [eventsData, now]);
  const submissionsCountSource = showHidden ? data : submissionsWithHiddenQuery.data;
  const postSubmissionsCount =
    submissionsCountSource?.pages?.[0]?.count ??
    submissionsCountSource?.pages?.[0]?.results?.length ??
    submissions.length;
  const eventSubmissionsCount =
    eventsData?.pages?.[0]?.count ??
    submittedEvents.length;
  const hasAnySubmissions = postSubmissionsCount > 0 || eventSubmissionsCount > 0;

  const formatEventDateTime = (event: any) => {
    if (!event?.start_datetime) return null;
    const start = moment(event.start_datetime);
    if (!start.isValid()) return null;
    const dateLabel = start.format('MMM D');
    const startTime = start.format('h:mm A');
    if (event?.end_datetime) {
      const end = moment(event.end_datetime);
      if (end.isValid()) {
        return `${dateLabel} · ${startTime} – ${end.format('h:mm A')}`;
      }
    }
    return `${dateLabel} · ${startTime}`;
  };

  const handleEventClick = (event: any) => {
    const status = (event?.status ?? 'pending').toLowerCase();
    if (status === 'approved' && event?.start_datetime) {
      const date = moment(event.start_datetime);
      if (!date.isValid()) return;
      history.push(`/community?calendarDate=${date.format('YYYY-MM-DD')}&calendarEventId=${event.id}`);
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
          <IonSegment value={activeSegment} mode="ios">
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
              const status = rawStatus === 'needs_edit' && daysSince > 7
                ? 'rejected'
                : rawStatus;
              const statusLabel = statusLabelMap[status] ?? 'Pending moderator review';
              const statusColor = statusColorMap[status] ?? 'medium';
              const dateValue = status === 'approved'
                ? getApprovedDate(post) ?? getLastEditedDate(post)
                : getSubmittedDate(post) ?? getLastEditedDate(post);
              const dateLabel = formatShortDate(dateValue);
              const editableLabel =
                status === 'needs_edit' || status === 'draft'
                  ? formatEditableLabel(getExpiresAt(post))
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
                    <div className="submission-card-row">
                      <div className="submission-card-main">
                        <h2>{post?.title}</h2>
                        {dateLabel && <p>{dateLabel}</p>}
                        {editableLabel && <IonNote>{editableLabel}</IonNote>}
                      </div>
                      <div className="submission-card-badge">
                        <IonBadge color={statusColor}>
                          {statusLabel}
                          {post?.hide_status_author === 'user' && (
                            <IonIcon icon={eyeOffOutline} className="submission-hidden-icon" />
                          )}
                        </IonBadge>
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

            {hasAnySubmissions && (
              <IonItem lines="none" className="submitted-toggle">
                <IonLabel>Show hidden submissions</IonLabel>
                <IonToggle
                  slot="end"
                  checked={showHidden}
                  onIonChange={(event) => setShowHidden(event.detail.checked)}
                />
              </IonItem>
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
            {hasAnySubmissions && (
              <IonItem lines="none" className="submitted-toggle">
                <IonLabel>Show hidden submissions</IonLabel>
                <IonToggle
                  slot="end"
                  checked={showHidden}
                  onIonChange={(event) => setShowHidden(event.detail.checked)}
                />
              </IonItem>
            )}
          </>
        )}
        <IonModal isOpen={eventDetailOpen} onDidDismiss={() => setEventDetailOpen(false)} style={{ '--height': '100%' }}>
          <IonHeader>
            <IonToolbar className="modal-title">
              <IonButtons slot="start">
                <IonButton onClick={() => setEventDetailOpen(false)}>Back</IonButton>
              </IonButtons>
              <IonTitle>Event details</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding submitted-posts">
            <IonCard color="white" className="section-card">
              <IonCardContent>
                <IonRow className="section-header">
                  <IonText color="dark" className="section-heading">
                    <h3>Status</h3>
                  </IonText>
                  {(selectedEvent?.status ?? 'pending').toLowerCase() === 'pending' && (
                    <IonButton
                      fill="clear"
                      size="small"
                      className="info-button"
                      onClick={(e) => presentEventStatusPopover({ event: e.nativeEvent })}
                    >
                      <IonIcon icon={informationCircleOutline} />
                    </IonButton>
                  )}
                </IonRow>
                <IonRow className="status-row">
                  <IonBadge color={eventStatusColorMap[(selectedEvent?.status ?? 'pending').toLowerCase()] ?? 'medium'}>
                    {eventStatusLabelMap[(selectedEvent?.status ?? 'pending').toLowerCase()] ?? 'Pending moderator review'}
                  </IonBadge>
                  {formatShortDate(
                    (selectedEvent?.status ?? 'pending').toLowerCase() === 'approved'
                      ? getApprovedDate(selectedEvent) ?? getLastEditedDate(selectedEvent)
                      : getSubmittedDate(selectedEvent) ?? getLastEditedDate(selectedEvent)
                  ) && (
                    <IonNote className="submitted-meta">
                      Submitted {formatShortDate(
                        (selectedEvent?.status ?? 'pending').toLowerCase() === 'approved'
                          ? getApprovedDate(selectedEvent) ?? getLastEditedDate(selectedEvent)
                          : getSubmittedDate(selectedEvent) ?? getLastEditedDate(selectedEvent)
                      )}
                    </IonNote>
                  )}
                </IonRow>
                {selectedEvent?.moderator_rejection_reason && (
                  <IonItem color="white" lines="none">
                    <IonLabel position="stacked">Moderator explanation</IonLabel>
                    <IonText className="preview-value">{selectedEvent.moderator_rejection_reason}</IonText>
                  </IonItem>
                )}
              </IonCardContent>
            </IonCard>
            <IonCard color="white" className="preview-card section-card">
              <IonCardContent className="preview-form">
                <IonItem color="white" lines="none">
                  <IonLabel position="stacked">Title*</IonLabel>
                  <IonText className="preview-value">{selectedEvent?.name || '-'}</IonText>
                </IonItem>
                {formatEventDateTime(selectedEvent) && (
                  <IonItem color="white" lines="none">
                    <IonLabel position="stacked">Date*</IonLabel>
                    <IonText className="preview-value">{formatEventDateTime(selectedEvent)}</IonText>
                  </IonItem>
                )}
                {selectedEvent?.local_only && (
                  <IonItem color="white" lines="none">
                    <IonLabel position="stacked">Local Event</IonLabel>
                    <IonText className="preview-value">Yes</IonText>
                  </IonItem>
                )}
                {selectedEvent?.location && (
                  <IonItem color="white" lines="none">
                    <IonLabel position="stacked">Location</IonLabel>
                    <IonText className="preview-value">{selectedEvent.location}</IonText>
                  </IonItem>
                )}
                {selectedEvent?.external_link && (
                  <IonItem color="white" lines="none">
                    <IonLabel position="stacked">Link</IonLabel>
                    <IonButton
                      fill="clear"
                      size="small"
                      className="preview-value"
                      onClick={() => openExternalUrl(selectedEvent!.external_link!)}
                    >
                      {selectedEvent.external_link}
                    </IonButton>
                  </IonItem>
                )}
                {selectedEvent?.description && (
                  <IonItem color="white" lines="none">
                    <IonLabel position="stacked">Description</IonLabel>
                    <IonText className="preview-value">{selectedEvent.description}</IonText>
                  </IonItem>
                )}
                {selectedEvent?.image && (
                  <IonItem color="white" lines="none">
                    <IonLabel position="stacked">Image</IonLabel>
                    <img
                      src={selectedEvent.image}
                      alt={selectedEvent.image_alt || selectedEvent.name || 'Event image'}
                      style={{ width: '100%', borderRadius: 8, marginTop: 6, marginBottom: 4 }}
                    />
                  </IonItem>
                )}
                {selectedEvent?.image_alt && (
                  <IonItem color="white" lines="none">
                    <IonLabel position="stacked">Image description</IonLabel>
                    <IonText className="preview-value">{selectedEvent.image_alt}</IonText>
                  </IonItem>
                )}
              </IonCardContent>
            </IonCard>
            <IonRow className="ion-justify-content-center">
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
