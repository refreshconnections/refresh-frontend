import {
  IonButton,
  IonButtons,
  IonCard, IonCardContent, IonCardTitle, IonContent, IonHeader, IonPage, IonText, IonTitle, IonToolbar, 
} from '@ionic/react';
import React from 'react'



import './CantAccessCard.css';
import './OnboardingCard.css';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';



type Props = {
  onDismiss: () => void;
};


const AttachmentsInfoModal: React.FC<Props> =  (props) => {
 const { onDismiss } = props
 const currentUserProfile = useGetCurrentProfile().data;

  return (
  <IonPage>
    <IonHeader>
        <IonToolbar className="modal-title">
            <IonTitle className="ion-text-wrap">Attachments info</IonTitle>
            <IonButtons slot="start">
                <IonButton onClick={onDismiss}>Back</IonButton>
            </IonButtons>
        </IonToolbar>
    </IonHeader>
    <IonContent className="create-post">
    <IonCard  className="onboarding-slide">
      <IonCardContent>
        <IonCardTitle className="ion-justify-content-start ion-padding">
          Images
        </IonCardTitle>
          <IonText>
            <h2>Images are available for 7 days after they were sent.</h2>
            <h2>For Personal+ users, images are available for 1 month. </h2>
            <h2>For Pro users, images are available for 6 months.</h2>
            </IonText>
          <IonCardTitle className="ion-justify-content-start ion-padding">
          Audio messages
        </IonCardTitle>
        <IonText>
          <h2>Audio messages are available for 3 days after they were sent. </h2>
          <h2>For Personal+ users, audio messages will be available for 1 week.</h2>
          <h2>For Pro users, audio messages will be available for 2 weeks.</h2>
        </IonText>
        {!(currentUserProfile?.subscription_level === "pro") &&
        <IonButton style={{width: "50%", alignSelf: "center"}} href="/store">Upgrade/subscribe</IonButton>
        }
        <IonCardTitle className="ion-justify-content-start ion-text-left ion-padding" style={{paddingTop: "40pt"}}>
          Why can't I add attachments to my messages with this person?
        </IonCardTitle>
        <IonText>
          <h2>You might be trying to send an attachment to a member who hasn't updated to the latest version.</h2>
          <br/>
          <h2>Also, all members have the option to choose whether they would like to receive attachments. Head to your Settings if you would like to update these settings for yourself.</h2>
        </IonText>
        
        <IonText color="navy" style={{paddingTop: "40pt"}}>
          <h2>Attachments sent in private chats are subject to our Terms and Member Guidelines.</h2>
        </IonText>
      </IonCardContent>
    </IonCard>
    </IonContent>
</IonPage>
    
  )
};
export default AttachmentsInfoModal;