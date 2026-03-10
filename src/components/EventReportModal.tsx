import React, { useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { sendAnEmail } from '../hooks/utilities';

type EventReportModalProps = {
  eventId: number;
  eventTitle: string;
  onDismiss: () => void;
};

const EventReportModal: React.FC<EventReportModalProps> = ({ eventId, eventTitle, onDismiss }) => {
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const handleSubmit = async () => {
    if (sending) return;
    setSending(true);
    const subject = `[Event Report] ${eventTitle} (${eventId})`;
    const body = `Event title: ${eventTitle}\nEvent id: ${eventId}\n\nDetails:\n${details || 'No additional details provided.'}`;
    await sendAnEmail('report@refreshconnections.com', subject, body);
    setSending(false);
    setShowAlert(true);
  };

  return (
    <>
      <IonHeader>
        <IonToolbar className="modal-title">
          <IonTitle>Report event</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>Cancel</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => {
            setShowAlert(false);
            onDismiss();
          }}
          header="Thanks for the report."
          subHeader="The Refresh team will check this out."
          buttons={['OK']}
        />
        <IonTextarea
          value={details}
          onIonInput={(event) => setDetails(event.detail.value ?? '')}
          placeholder="Tell us what’s wrong with this event (optional)."
          autoGrow
          rows={6}
        />
        <IonButton
          expand="block"
          className="ion-margin-top"
          onClick={handleSubmit}
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Submit report'}
        </IonButton>
      </IonContent>
    </>
  );
};

export default EventReportModal;
