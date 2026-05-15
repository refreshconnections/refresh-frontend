import React from 'react';
import { IonButton, IonCard, IonText } from '@ionic/react';

type SubmissionAgeGateCardProps = {
  noun: 'post' | 'event';
  onUpgrade: () => void;
};

const SubmissionAgeGateCard: React.FC<SubmissionAgeGateCardProps> = ({ noun, onUpgrade }) => {
  const article = noun === 'event' ? 'an' : 'a';
  return (
    <IonCard color="white" className="ion-padding ion-text-center">
      <IonText className="ion-text-center">
        <p>Your account needs to be at least 2 weeks old to submit {article} {noun}.</p>
        <p>Or become a Community+ or Pro member to submit {article} {noun} now.</p>
      </IonText>
      <IonButton onClick={onUpgrade}>Upgrade</IonButton>
    </IonCard>
  );
};

export default SubmissionAgeGateCard;
