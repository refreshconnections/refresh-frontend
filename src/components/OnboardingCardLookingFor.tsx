import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonCheckbox, IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonSelect, IonSelectOption, IonText, useIonAlert,
  useIonModal,
} from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react'
import useFetch from '../hooks/useFetch';

import { updateCurrentUserProfile, uploadPhoto } from '../hooks/utilities';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';


import './CantAccessCard.css';
import './OnboardingCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import moment from 'moment';
import { useSwiper } from 'swiper/react';
import SwiperButtonNext from './SwiperButtonNext';
import { ONBOARDING_COPY } from '../constants/onboarding';
// import StayPausedModal from './StayPausedModal';



const OnboardingCardLookingFor: React.FC = () => {
  const copy = ONBOARDING_COPY.cards.lookingFor;

  const swiper = useSwiper();
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const currentProfile = useGetCurrentProfile().data;

  useEffect(() => {
    if (currentProfile?.looking_for && lookingFor.length === 0) {
      setLookingFor(currentProfile.looking_for);
    }
  }, [currentProfile?.looking_for, lookingFor.length]);
  
  const updateProfile = async (e: any) => {
    
    if (lookingFor.length !== 0) {
      const existing = currentProfile?.looking_for ?? [];
      const nextSorted = [...lookingFor].sort();
      const existingSorted = [...existing].sort();
      const unchanged =
        nextSorted.length === existingSorted.length &&
        nextSorted.every((value, index) => value === existingSorted[index]);
      if (!unchanged) {
        await updateCurrentUserProfile({ looking_for: lookingFor })        
      }

      
      swiper.slideNext()
      
    }


  }

  //Adds the checkedbox to the array and check if you unchecked it
  const addLookingForCheckbox = (event: any) => {
    if (event.detail.checked) {
      const newArray = [...lookingFor, event.detail.value]
      setLookingFor(newArray)

    } else {
      setLookingFor(lookingFor.filter(a => a != event.detail.value))
    }
  }

  // const [stayPausedOpen, stayPausedDismiss] = useIonModal(StayPausedModal, {
  //   onDismiss: () => stayPausedDismiss(),
  // });



  


  return (
    <IonCard className="onboarding-v2__card onboarding-v2__card--shallow onboarding-slide">
      <IonCardContent className="w-checkboxes">
        <IonCardTitle>{copy.title}</IonCardTitle>
        <IonText>{copy.body}</IonText>
        <div className="onboarding-option-card compact">
          <IonList className="scrollable-list onboarding-checkbox-list" lines="none">
            {copy.options.map((option) => (
              <IonItem key={option.value}>
                <IonCheckbox slot="start" value={option.value} checked={lookingFor.includes(option.value)} onIonChange={e => addLookingForCheckbox(e)} />
                {option.label}
             </IonItem>
            ))}
          </IonList>
        </div>
      </IonCardContent>
      <IonNote style={{textAlign: "center"}}>{copy.scrollNote}</IonNote>
      <div className="onboarding-v2__card-footer">
        <IonRow className="onboarding-v2__nav">
          <IonButton fill="outline" onClick={() => swiper.slidePrev()}>{ONBOARDING_COPY.common.back}</IonButton>
          <IonButton className="onboarding-v2__primary-action" onClick={updateProfile} disabled={lookingFor.length === 0}>{ONBOARDING_COPY.common.next}</IonButton>
        </IonRow>
      </div>
    </IonCard>
  )
};
export default OnboardingCardLookingFor;
