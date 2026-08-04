import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonRow,
  IonText,
  useIonAlert,
  useIonRouter,
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
import { ONBOARDING_COPY } from '../constants/onboarding';





interface OnboardingCardDoneProps {
  onDismiss?: () => void;
}

const OnboardingCardDone: React.FC<OnboardingCardDoneProps> = ({ onDismiss }) => {
  const copy = ONBOARDING_COPY.cards.done;

  const swiper = useSwiper();
  const [appLoading, setAppLoading] = useState(false);
  const queryClient = useQueryClient()
  const router = useIonRouter();

  const moderation = useGetCurrentModeration().data;

  const [presentPausedOnCreationAlert] = useIonAlert();



  const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

  const handleGetStarted = async (e: any) => {

    

    if (moderation?.paused_on_creation) {
      presentPausedOnCreationAlert({
        subHeader: copy.pausedReview.subHeader,
        message: copy.pausedReview.message,
        buttons: [
          {
            text: copy.pausedReview.confirm,
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
      await Preferences.remove({ key: 'personal_profile_onboarding_in_progress' });
      await Preferences.remove({ key: 'personal_profile_onboarding_slide' });

      const response = await updateCurrentUserProfile({
        created_profile: true,
        paused_profile: moderation?.paused_on_creation ? true : false,
        location_last_updated: null,
        romance_gender_last_updated: null,
        gender_last_updated: null,
      })
      queryClient.setQueryData(['global-current'], (current: any) => (
        current ? { ...current, created_profile: true, onboarded: true } : current
      ));
      queryClient.invalidateQueries({ queryKey: ['current'] })
      queryClient.invalidateQueries({ queryKey: ['global-current'] })
      
      await delay(1000)
      setAppLoading(false)

      if (onDismiss) {
        onDismiss();
      } else {
        router.push('/community', 'root', 'replace');
      }


  }


  return (
    <IonCard className="onboarding-v2__card onboarding-v2__card--shallow onboarding-slide">
      <IonCardContent>
        <IonCardTitle>{copy.title}</IonCardTitle>
        <IonText>{copy.body}</IonText>
      </IonCardContent>
      <div className="onboarding-v2__card-footer">
        <IonRow className="onboarding-v2__nav">
          <IonButton fill="outline" disabled={appLoading} onClick={() => swiper.slidePrev()}>{ONBOARDING_COPY.common.back}</IonButton>
          <IonButton className="onboarding-v2__primary-action" disabled={appLoading} onClick={handleGetStarted}>{copy.refreshCta}</IonButton>
        </IonRow>
        {appLoading && (
          <IonRow className="ion-justify-content-center">
            <img alt="Refresh Connections logo spinning" src="../static/img/arrowload.gif" style={{paddingTop: "20pt", width: "40%"}} />
          </IonRow>
        )}
      </div>
    </IonCard>
  )
};
export default OnboardingCardDone;
