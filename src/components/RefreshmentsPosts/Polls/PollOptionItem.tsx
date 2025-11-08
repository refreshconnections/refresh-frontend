import React from 'react';
import { IonCol, IonContent, IonGrid, IonItem, IonLabel, IonRow, useIonPopover } from '@ionic/react';
import { motion } from 'motion/react';
import { faCheck } from '@fortawesome/pro-solid-svg-icons/faCheck';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/pro-solid-svg-icons';

type PollOptionItemProps = {
  showResults: boolean;
  optionText: string;
  votePercentage: number;
  isWinner: boolean,
  userVote: boolean
};

const VotedPopover: React.FC = () => (
  <IonContent className="ion-padding no-scroll">You voted for this one</IonContent>
);

const PollOptionItem: React.FC<PollOptionItemProps> = ({ showResults, optionText, votePercentage, isWinner, userVote }) => {

  const [presentPopover, dismissPopover] = useIonPopover(VotedPopover, {
    onDismiss: () => dismissPopover(),
  });

  return (
    <IonItem lines="none" style={{ position: 'relative', overflow: 'hidden', paddingInlineStart: 0 }} color={'blue'}>
      {showResults &&
        <motion.div
          animate={{ width: `${votePercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            height: '100%',
            top: 0,
            left: 0,
            backgroundColor: isWinner ? 'rgba(var(--ion-color-success-rgb), 0.5)' : 'rgba(var(--ion-color-primary-rgb), 0.4)',
            zIndex: 0,
          }}
        />}


      <IonLabel style={{ zIndex: 1 }} >
        <IonGrid>
          <IonRow className="ion-align-items-center">
            <IonCol size={showResults ? '10' : '12'} className="poll-option-text">
              {userVote && <FontAwesomeIcon icon={faCheckCircle} onClick={(e) => presentPopover({
                event: e.nativeEvent,
                showBackdrop: false,
              })} />} {optionText}
            </IonCol>
            {showResults && (
              <IonCol size="2" className="right-percentage">
                {votePercentage % 1 === 0
                  ? votePercentage.toFixed(0)
                  : votePercentage.toFixed(1)}%
              </IonCol>
            )}
          </IonRow>
        </IonGrid>
      </IonLabel>
    </IonItem>
  );
};

export default PollOptionItem;
