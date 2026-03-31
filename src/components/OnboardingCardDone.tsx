import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonText,
  IonToggle,
  useIonAlert,
} from '@ionic/react';
import React, { useEffect, useState } from 'react'

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
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { ONBOARDING_COPY } from '../constants/onboarding';





type OnboardingCardDoneProps = {
  showConnectToggle?: boolean;
};

const OnboardingCardDone: React.FC<OnboardingCardDoneProps> = ({ showConnectToggle = true }) => {
  const copy = ONBOARDING_COPY.cards.done;

  const swiper = useSwiper();
  const [appLoading, setAppLoading] = useState(false);
  const queryClient = useQueryClient()
  const currentProfile = useGetCurrentProfile().data;
  const [connectFromRefreshments, setConnectFromRefreshments] = useState<boolean>(!!currentProfile?.settings_community_profile);



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


  useEffect(() => {
    setConnectFromRefreshments(!!currentProfile?.settings_community_profile);
  }, [currentProfile?.settings_community_profile]);

  const handleConnectToggle = async (checked: boolean) => {
    setConnectFromRefreshments(checked);
    await updateCurrentUserProfile({ settings_community_profile: checked });
    queryClient.invalidateQueries({ queryKey: ['current'] });
  };

  const updateProfile = async () => {

      setAppLoading(true)

      await Preferences.set({
        key: 'ONBOARDED',
        value: 'true',
      });

      const response = await updateCurrentUserProfile({
        created_profile: true,
        paused_profile: moderation?.paused_on_creation ? true : false,
        location_last_updated: null,
        romance_gender_last_updated: null,
        gender_last_updated: null,
      })
      queryClient.invalidateQueries({ queryKey: ['current'] })
      
      await delay(1000)
      setAppLoading(false)

      window.location.pathname = "/community"


  }


  return (
    <IonCard className="onboarding-slide">
      <IonCardContent>
        <IonCardTitle>{copy.title}</IonCardTitle>
        <IonText>{copy.body}</IonText>
        {showConnectToggle && (
          <IonItem>
            <IonLabel>
              <p className="connect-refreshments-title">{copy.connectTitle}</p>
              <IonText color="medium">
                {copy.connectBody}
              </IonText>
            </IonLabel>
            <IonToggle
              slot="end"
              checked={connectFromRefreshments}
              onIonChange={e => handleConnectToggle(e.detail.checked)}
            ></IonToggle>
          </IonItem>
        )}
      </IonCardContent>
      <IonRow className="onboarding-slide-buttons">
        <IonButton disabled={appLoading} color="gray" onClick={()=>swiper.slidePrev()}>{ONBOARDING_COPY.common.back}</IonButton>
        <IonButton disabled={appLoading} onClick={handleGetStarted}>{copy.refreshCta}</IonButton>
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
