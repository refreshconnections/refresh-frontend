import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonSelect, IonSelectOption, IonText,
  useIonAlert,
} from '@ionic/react';
import React, { useState } from 'react'

import { updateCurrentUserProfile } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';


// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { useSwiper } from 'swiper/react';
import { Preferences } from '@capacitor/preferences';
import { useQueryClient } from "@tanstack/react-query";
import { useGetCurrentModeration } from '../hooks/api/profiles/current-moderation';





const OnboardingCardDone: React.FC = () => {

  const swiper = useSwiper();
  const [appLoading, setAppLoading] = useState(false);
  const queryClient = useQueryClient()



  const moderation = useGetCurrentModeration().data;

  const [presentPausedOnCreationAlert] = useIonAlert();



  const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

  const handleGetStarted = async (e: any) => {

    

    if (moderation?.paused_on_creation) {
      presentPausedOnCreationAlert({
        subHeader: "As part of our effort to keep Refresh safe and conscientious, we're reviewing your account before you can connect with others. We appreciate your patience.",
        message: 'In the meantime, you can continue to add to your profile by going to the Me tab > Profile.',
        buttons: [
          {
            text: 'Ok',
            role: 'cancel',
            handler: async ()=>{
              await updateProfile()
            }
          }
        ],
      })
    }
    else{
      await updateProfile()
    }
    
      
  }


  const updateProfile = async () => {

      setAppLoading(true)

      await Preferences.set({
        key: 'ONBOARDED',
        value: 'true',
      });

      const response = await updateCurrentUserProfile({ created_profile: true, location_last_updated: null, romance_gender_last_updated: null, gender_last_updated: null  })
      queryClient.invalidateQueries({ queryKey: ['current'] })
      
      await delay(1000)
      setAppLoading(false)

      window.location.pathname = "/community"


  }


  return (
    <IonCard className="onboarding-slide">
      <IonCardContent>
        <IonCardTitle>That's it!</IonCardTitle>
        <IonText>Head to the "Me" tab at any time to update or add to your profile!</IonText>
      </IonCardContent>
      <IonRow className="onboarding-slide-buttons">
        <IonButton disabled={appLoading} color="gray" onClick={()=>swiper.slidePrev()}>Back</IonButton>
        <IonButton disabled={appLoading} onClick={handleGetStarted}>Let's Refresh!</IonButton>
        </IonRow>
      {appLoading ?
        <IonRow className="ion-justify-content-center">
            <img alt="Refresh Connections logo spinning" src="../static/img/arrowload.gif" style={{paddingTop: "20pt", width: "40%"}}></img>
                </IonRow>
      : <></>}   
    </IonCard>
  )
};
export default OnboardingCardDone;