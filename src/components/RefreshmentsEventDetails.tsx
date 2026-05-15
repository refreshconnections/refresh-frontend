import React, { useState } from 'react';
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
import { faSubtitles } from '@fortawesome/pro-solid-svg-icons/faSubtitles';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import Linkify from 'react-linkify';
import type { RefreshEvent } from '../hooks/api/events';
import { onImgError, openExternalUrl } from '../hooks/utilities';

export const formatEventType = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.replace(/_/g, ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const formatPrecautionLabel = (value: string) =>
  {
    const normalized = value.replace(/_/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

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

export const ATTENDEE_PRECAUTION_CHIP_CLASSES: Record<string, string> = {
  precautions_only: 'calendar-event-chip--attendee-only',
  precautions_preferred: 'calendar-event-chip--attendee-preferred',
  open: 'calendar-event-chip--attendee-open',
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
    image_alt?: string | null;
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
  settingsAlt?: boolean;
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
  settingsAlt,
  actions,
  footer,
}) => {
  const eventType = formatEventType(event.event_type);
  const attendeePreference = event.attendee_precaution_preference === 'not_specified'
    ? null
    : event.attendee_precaution_preference;
  const [imageErrored, setImageErrored] = useState(false);
  const [altShow, setAltShow] = useState(false);
  const showAltButton = settingsAlt && !!event.image_alt && !imageErrored;

  return (
    <div className="calendar-event-card-details">
      {eventType || attendeePreference || event.in_person_precautions?.length ? (
        <div className="calendar-event-chips">
          {eventType ? (
            <IonChip className="calendar-event-chip calendar-event-chip--type">
              <IonLabel>{eventType}</IonLabel>
            </IonChip>
          ) : null}
          {attendeePreference ? (
            <IonChip
              className={`calendar-event-chip ${ATTENDEE_PRECAUTION_CHIP_CLASSES[attendeePreference] ?? ''}`.trim()}
              color={ATTENDEE_PRECAUTION_COLORS[attendeePreference] ?? 'medium'}
            >
              <IonLabel>
                {ATTENDEE_PRECAUTION_LABELS[attendeePreference] ?? attendeePreference}
              </IonLabel>
            </IonChip>
          ) : null}
          {event.in_person_precautions?.map((precaution) => (
            <IonChip key={precaution} className="calendar-event-chip calendar-event-chip--precaution" color="medium">
              <IonLabel>{formatPrecautionLabel(precaution)}</IonLabel>
            </IonChip>
          ))}
        </div>
      ) : null}
      {event.location ? (
        <IonText className="opened-post-event-line calendar-event-description">
          <strong>Location:</strong> {event.location}
        </IonText>
      ) : null}
      <IonText className="calendar-event-description" style={{ whiteSpace: 'pre-wrap' }}>
        <Linkify componentDecorator={(href, text, key) => (
          <a key={key} onClick={(e) => { e.preventDefault(); openExternalUrl(href); }} style={{ cursor: 'pointer' }}>{text}</a>
        )}>
          {event.description || 'No description provided.'}
        </Linkify>
      </IonText>
      {event.external_registration_required ? (
        <IonText color="secondary" className="calendar-event-registration">
          External registration required.
        </IonText>
      ) : null}
      {event.image && !imageErrored ? (
        <div style={{ position: 'relative' }}>
          {showAltButton && (
            <IonButton
              className="alt-coverPhoto-button"
              fill="clear"
              size="small"
              style={{ position: 'absolute', top: 16, right: 4, zIndex: 10 }}
              onClick={() => setAltShow((v) => !v)}
            >
              <FontAwesomeIcon icon={faSubtitles} />
            </IonButton>
          )}
          <PhotoProvider bannerVisible={false}>
            <PhotoView src={event.image}>
              <img
                src={event.image}
                alt={event.image_alt || event.name || 'Event image'}
                className="calendar-event-image"
                onError={() => setImageErrored(true)}
              />
            </PhotoView>
          </PhotoProvider>
          {altShow && event.image_alt && (
            <IonRow className="show-alt-coverPhoto">
              <IonText>{event.image_alt}</IonText>
            </IonRow>
          )}
        </div>
      ) : null}
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
