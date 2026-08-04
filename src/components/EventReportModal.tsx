import React, { useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
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
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const detailsPlaceholder =
    reason === 'Correction'
      ? "Add specifics for the moderation team to check out. If there's an updated link with corrected information, please include that."
      : 'Add specifics for the moderation team to check out.';

  const handleSubmit = async () => {
    if (sending) return;
    setSending(true);
    const subject = `[Event Report] ${eventTitle} (${eventId})`;
    const body = `Event title: ${eventTitle}\nEvent id: ${eventId}\nReason: ${reason}\n\nDetails:\n${details}`;
    await sendAnEmail('report@refreshconnections.com', subject, body);
    setSending(false);
    setShowAlert(true);
  };

  return (
    <>
      <IonHeader>
        <IonToolbar color="danger" className="modal-title">
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
          header="Thanks for helping our community."
          subHeader="The Refresh team will check this out ASAP!"
          buttons={['OK']}
        />
        <IonItem>
          <IonLabel position="stacked">Reason</IonLabel>
          <IonSelect
            aria-label="Reason"
            placeholder="What's wrong with this event?"
            onIonChange={(e) => setReason(e.detail.value)}
          >
            <IonSelectOption value="Correction">Correction</IonSelectOption>
            <IonSelectOption value="Covid Minimizing">Covid minimizing</IonSelectOption>
            <IonSelectOption value="Safety Shaming">Safety shaming</IonSelectOption>
            <IonSelectOption value="Disinformation">Disinformation</IonSelectOption>
            <IonSelectOption value="Hate/harassment">Hate/harassment</IonSelectOption>
            <IonSelectOption value="Scams">Scams</IonSelectOption>
            <IonSelectOption value="Offensive material">Offensive material</IonSelectOption>
            <IonSelectOption value="Other">Other</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Details</IonLabel>
          <IonTextarea
            value={details}
            onIonInput={(e) => setDetails(e.detail.value ?? '')}
            placeholder={detailsPlaceholder}
            autoGrow
            autocapitalize="sentences"
            rows={5}
          />
        </IonItem>
        <IonButton
          expand="block"
          className="ion-margin-top"
          onClick={handleSubmit}
          disabled={!reason || !details.trim() || sending}
        >
          {sending ? 'Sending...' : 'Submit report'}
        </IonButton>
      </IonContent>
    </>
  );
};

export default EventReportModal;
