import React, { useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { apiClient } from '../hooks/api/api-client';
import BoxedStackedInput from './BoxedStackedInput';

type EventLinkOnlySubmissionModalProps = {
  onDismiss: (data?: { submitted?: boolean }) => void;
};

const EventLinkOnlySubmissionModal: React.FC<EventLinkOnlySubmissionModalProps> = ({ onDismiss }) => {
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedLink = link.trim();
    if (!trimmedLink) {
      setError('Add a public event link.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSubmitted(false);

    try {
      await apiClient.post('/api/event/link_submission/', { link: trimmedLink });
      setLink('');
      setSubmitted(true);
    } catch (err) {
      console.error('Unable to submit event link', err);
      setError('Unable to send this right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="modal-title">
          <IonTitle>Event link</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => onDismiss({ submitted })}>Done</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText color="dark">
          <h2>Quick Covid Conscientious event share</h2>
        </IonText>
        <IonText color="medium">
          <p>
            Share a public event posting link and we'll find out the rest. If it becomes an event,
            it will be posted anonymously and won't be connected to your account.
          </p>
          <p>If you do have all the details, we'd love for you to submit the full event instead.</p>
        </IonText>
        <BoxedStackedInput
          label="Public event link"
          value={link}
          name="event_link"
          placeholder="https://"
          type="url"
          onIonInput={(event) => setLink(event.detail.value ?? '')}
        />
        {error ? (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        ) : null}
        {submitted ? (
          <IonText color="success">
            <p>Thanks, we got it.</p>
          </IonText>
        ) : null}
        <IonButton expand="block" disabled={submitting} onClick={handleSubmit}>
          {submitting ? 'Sending...' : 'Send link'}
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default EventLinkOnlySubmissionModal;
