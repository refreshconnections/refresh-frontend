import React from 'react';
import {
  IonAvatar,
  IonButton,
  IonChip,
  IonIcon,
  IonLabel,
  IonRow,
  IonText,
} from '@ionic/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandWave } from '@fortawesome/pro-solid-svg-icons/faHandWave';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import type { RefreshEvent } from '../hooks/api/events';
import { onImgError } from '../hooks/utilities';

export const formatEventType = (value?: string | null) => {
  if (!value) return null;
  return value.replace(/_/g, ' ');
};

export const formatPrecautionLabel = (value: string) =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const ATTENDEE_PRECAUTION_LABELS: Record<string, string> = {
  precautions_only: 'Covid conscientious only',
  precautions_preferred: 'Covid conscientious preferred',
  open: 'Open to everyone',
};

export const ATTENDEE_PRECAUTION_COLORS: Record<string, string> = {
  precautions_only: 'warning',
  precautions_preferred: 'tertiary',
  open: 'success',
};

type AvatarDisplay = {
  className: string;
  hasImage: boolean;
  src?: string;
};

type RefreshmentsEventDetailsProps = {
  event: Partial<RefreshEvent> & {
    name?: string | null;
    description?: string | null;
    image?: string | null;
    external_link?: string | null;
    external_registration_required?: boolean;
    event_type?: string | null;
    in_person_precautions?: string[];
    attendee_precaution_preference?: string | null;
    can_answer_questions?: boolean;
    username?: string | null;
  };
  anonymous?: boolean;
  avatarDisplay?: AvatarDisplay;
  onProfilePresent?: () => void;
  onHostInfo?: (event: React.MouseEvent<HTMLElement>) => void;
  onExternalLinkClick?: () => void;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
};

const RefreshmentsEventDetails: React.FC<RefreshmentsEventDetailsProps> = ({
  event,
  anonymous = false,
  avatarDisplay,
  onProfilePresent,
  onHostInfo,
  onExternalLinkClick,
  actions,
  footer,
}) => {
  const eventType = formatEventType(event.event_type);

  return (
    <div className="calendar-event-card-details">
      {!anonymous && event.username && avatarDisplay ? (
        <IonRow className="calendar-event-byline" onClick={onProfilePresent}>
          <IonAvatar className={avatarDisplay.className}>
            <img src={avatarDisplay.src} onError={(e) => onImgError(e)} />
          </IonAvatar>
          <IonText>shared by {event.username}</IonText>
          {event.can_answer_questions && onHostInfo ? (
            <IonButton
              fill="clear"
              size="small"
              className="calendar-event-host-button"
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                onHostInfo(clickEvent);
              }}
            >
              <FontAwesomeIcon icon={faHandWave} />
            </IonButton>
          ) : null}
        </IonRow>
      ) : null}
      {eventType ? <p className="calendar-event-type">{eventType}</p> : null}
      {event.location ? (
        <IonText className="opened-post-event-line calendar-event-description">
          <strong>Location:</strong> {event.location}
        </IonText>
      ) : null}
      <IonText className="calendar-event-description">
        {event.description || 'No description provided.'}
      </IonText>
      {event.attendee_precaution_preference ? (
        <IonChip color={ATTENDEE_PRECAUTION_COLORS[event.attendee_precaution_preference] ?? 'medium'}>
          <IonLabel>
            {ATTENDEE_PRECAUTION_LABELS[event.attendee_precaution_preference] ?? event.attendee_precaution_preference}
          </IonLabel>
        </IonChip>
      ) : null}
      {event.in_person_precautions?.length ? (
        <div className="calendar-precautions">
          {event.in_person_precautions.map((precaution) => (
            <IonChip key={precaution} color="medium">
              <IonLabel>{formatPrecautionLabel(precaution)}</IonLabel>
            </IonChip>
          ))}
        </div>
      ) : null}
      {event.external_registration_required ? (
        <IonText color="secondary" className="calendar-event-registration">
          External registration required.
        </IonText>
      ) : null}
      {event.image ? (
        <PhotoProvider bannerVisible={false}>
          <PhotoView src={event.image}>
            <img src={event.image} alt={event.name ?? 'Event'} className="calendar-event-image" onError={(e) => onImgError(e)} />
          </PhotoView>
        </PhotoProvider>
      ) : null}
      {onExternalLinkClick || actions ? (
        <div className="calendar-event-actions">
          {onExternalLinkClick && event.external_link ? (
            <IonButton
              fill="outline"
              size="small"
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                onExternalLinkClick();
              }}
            >
              Learn more
            </IonButton>
          ) : null}
          {actions}
        </div>
      ) : null}
      {footer}
    </div>
  );
};

export default RefreshmentsEventDetails;
