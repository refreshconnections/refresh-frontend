import React, { useState } from 'react';
import {
  IonContent, IonButton, IonItem, IonInput, IonCheckbox, IonLabel, IonText,
} from '@ionic/react';
import './BlockProfileModal.css';

type Props = {
  onDismiss: (confirmed: boolean, alsoCommunity: boolean) => void;
};

const BlockProfileModal: React.FC<Props> = ({ onDismiss }) => {
  const [confirmation, setConfirmation] = useState('');
  const [alsoCommunity, setAlsoCommunity] = useState(false);
  const [error, setError] = useState('');

  const handleBlock = () => {
    if (confirmation.toLowerCase() !== 'block') {
      setError('Type "block" exactly to confirm.');
      return;
    }
    onDismiss(true, alsoCommunity);
  };

  return (
    <IonContent className="ion-padding">
      <h4>Block this person?</h4>
      <p>Personal blocks are permanent and cannot be undone.</p>
      <IonItem className="block-profile-input-item">
        <IonInput
          placeholder='Type "block" to confirm'
          value={confirmation}
          onIonInput={(e) => {
            setConfirmation(e.detail.value || '');
            setError('');
          }}
        />
      </IonItem>
      {error && <IonText color="danger"><p className="ion-padding-horizontal">{error}</p></IonText>}
      <IonItem lines="none" className="ion-margin-top block-profile-checkbox-item">
        <IonCheckbox
          slot="start"
          checked={alsoCommunity}
          onIonChange={(e) => setAlsoCommunity(e.detail.checked)}
        />
        <IonLabel className="ion-text-wrap">
          Also hide their posts and comments in the Refreshments Bar (and yours from them)
        </IonLabel>
      </IonItem>
      <IonButton
        expand="block"
        color="danger"
        className="ion-margin-top"
        disabled={confirmation.toLowerCase() !== 'block'}
        onClick={handleBlock}
      >
        Block
      </IonButton>
      <IonButton expand="block" fill="clear" color="medium" onClick={() => onDismiss(false, false)}>
        Cancel
      </IonButton>
    </IonContent>
  );
};

export default BlockProfileModal;
