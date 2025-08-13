import {
  IonButton,
  IonButtons,
  IonCard, IonCardContent, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonNote, IonPage, IonRow, IonSelect, IonSelectOption, IonText, IonTitle, IonToggle, IonToolbar, useIonAlert,
} from '@ionic/react';
import React, { useEffect, useState } from 'react'

import { updateCurrentUserProfile, updateUsername } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useQueryClient } from '@tanstack/react-query';

type Props = {
  onDismiss: () => void;
};


const EditUsernameModal: React.FC<Props> =  (props) => {

  const [username, setUsername] = useState<string | null>(null);
  const { onDismiss } = props;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  // tanstack query
  const currentUserProfile = useGetCurrentProfile().data;
  const queryClient = useQueryClient()


  const updateUsernameHandler = async (e: any) => {
    if (username !== null) {

      const response = await updateUsername({ username: username })
      if (response['status'] === 204) {
        queryClient.invalidateQueries({ queryKey: ['current'] })
        queryClient.invalidateQueries({ queryKey: ['global-current'] })

      }
      else {
        setError("This username is already taken -- try something else!")
      }

    }
  }

  const updateConnectSettings = async (checked: any) => {

    const response = await updateCurrentUserProfile({ "settings_community_profile": checked })
    queryClient.invalidateQueries({ queryKey: ['current'] })
    queryClient.invalidateQueries({ queryKey: ['global-current'] })
      
  }

  

  const greaterThanThirtyDays= (changed) => {
    if (changed == null) return true
    const nowDate = new Date()
    const lastChangedDate = new Date(changed)
    const milliseconds = Math.abs(nowDate.getTime() - lastChangedDate.getTime());
    const days = milliseconds / 86400000

    if (days >= 60) {return true }
    else {return false}
      

  }



  useEffect(() => {

    setLoading(true); // set loading to true

    const fetchData = async () => {
        setError(null);
        setLoading(true);
        try {            
            setLoading(false);
        } catch (error: any) {
            setError(error.message);
            setLoading(false)
            console.log("error", error)
        }

    }

    fetchData();
}, []);


  return (
  <IonPage>
    <IonHeader>
        <IonToolbar className="modal-title">
            <IonTitle>{currentUserProfile?.username? "Edit": "Create"} Your Username</IonTitle>
            <IonButtons slot="start">
                <IonButton onClick={onDismiss}>Cancel</IonButton>
            </IonButtons>
        </IonToolbar>
    </IonHeader>
    <IonContent className="create-post">
    <IonCard  className="onboarding-slide">
      <IonCardContent>
        <IonCardTitle>Want to {currentUserProfile?.username? "change": "create"} your Refreshments username?</IonCardTitle>
            <IonText>Your username keeps your preferred first name hidden at the Refreshments Bar, but know that anyone who can see your profile can also see your username.</IonText>
            <p> You can only change your username every 60 days.</p>
            <IonItem >
            <IonInput value={username}
                            name="username"
                            required={true}
                            disabled={!(currentUserProfile?.username_last_updated == null || greaterThanThirtyDays(currentUserProfile?.username_last_updated))}
                            placeholder={currentUserProfile?.username}
                            onIonChange={e => setUsername(e.detail.value!)}
                            maxlength={30}
                            counter
                            type="text" />
            </IonItem>
            {error ? <IonNote slot="error">{error}</IonNote> : <></>}
           
      
      {currentUserProfile?.username_last_updated == null || greaterThanThirtyDays(currentUserProfile?.username_last_updated) ?
      <>
      <IonButton disabled={username == null} onClick={updateUsernameHandler}>Update</IonButton>
      </>
      :
      <IonText>You cannot change your username at this time.</IonText>}
      <br/><br/>
      <IonCardTitle style={{fontSize: "16px"}}>Want to allow other users to be able to see your Profile and connect with you from posts / comments?</IonCardTitle>
      <br/><p> You can change this in Settings at any time.</p>
      <IonItem>
            <IonLabel>Connect from Refreshments</IonLabel>
            <IonToggle slot="end"
              onIonChange={async e =>await updateConnectSettings(e.detail.checked)}
              checked={currentUserProfile?.settings_community_profile}
              disabled={(currentUserProfile?.paused_profile || currentUserProfile?.deactivated_profile)}
            >
            </IonToggle>
          </IonItem>
          <IonButton onClick={onDismiss}>Done</IonButton>
      </IonCardContent>
    </IonCard>
    </IonContent>
</IonPage>
    
  )
};
export default EditUsernameModal;