import React from 'react';
import {
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardSubtitle,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonText,
  useIonRouter,
} from '@ionic/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePlus } from '@fortawesome/pro-solid-svg-icons/faCirclePlus';

type Props = {
  isProUser: boolean;
  onPremiumIconClick: () => void;
};

const SettingsSupportCard: React.FC<Props> = ({ isProUser, onPremiumIconClick }) => {
  const router = useIonRouter();

  return (
    <IonCard className="settings__support-card">
      <IonAccordionGroup>
        <IonAccordion value="support-pro">
          <IonItem slot="header" lines="none" className="settings__support-header">
            <img
              className="settings__support-logo"
              src="../static/img/freshypro.png"
              alt=""
            />
            <IonLabel className="ion-text-wrap">
              <IonCardTitle>
                {isProUser ? 'Thanks for supporting Refresh Connections with Pro' : 'Support with Pro'}
              </IonCardTitle>
              <IonCardSubtitle>Includes Community+, Personal+, and extra Pro tools</IonCardSubtitle>
            </IonLabel>
          </IonItem>
          <IonCardContent slot="content" className="settings__support-card-content">
            <IonText className="settings__support-copy">
              <p>
                Refresh Connections is member-supported, with paid levels that help sustain the app while adding extra control and organization across its community and personal sides.
              </p>
              <p>
                Settings marked with <button type="button" className="settings__premium-icon-button settings__premium-icon-button--inline" aria-label="See plans" onClick={(event) => {
                  event.stopPropagation();
                  onPremiumIconClick();
                }}><FontAwesomeIcon className="settings__premium-icon settings__premium-icon--inline" icon={faCirclePlus} aria-hidden="true" /></button> are available with a paid level. Tap the icon to learn more and see plans.
              </p>
            </IonText>
            <IonButton
              className="settings__support-button"
              onClick={() => router.push('/store')}
            >
              See plans
            </IonButton>
          </IonCardContent>
        </IonAccordion>
      </IonAccordionGroup>
    </IonCard>
  );
};

export default SettingsSupportCard;
