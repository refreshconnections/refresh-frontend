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
// import StayPausedModal from './StayPausedModal';



const OnboardingCardLookingFor: React.FC = () => {

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
    <>
    <IonCard className="onboarding-slide">
      <IonCardContent className="w-checkboxes">
        <IonCardTitle>What kind of connections are you looking to make?</IonCardTitle>
        <IonText>These will be shown on your profile. You can change these at any time. </IonText>
        <div className="onboarding-option-card compact">
          <IonList className="scrollable-list onboarding-checkbox-list" lines="none">
            <IonItem>
              <IonCheckbox slot="start" value="friendship" checked={lookingFor.includes("friendship")} onIonChange={e => addLookingForCheckbox(e)} />
              Friendships
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="romance" checked={lookingFor.includes("romance")} onIonChange={e => addLookingForCheckbox(e)} />
              Romance
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="virtual connection" checked={lookingFor.includes("virtual connection")} onIonChange={e => addLookingForCheckbox(e)} />
              Virtual Connection
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="virtual only" checked={lookingFor.includes("virtual only")} onIonChange={e => addLookingForCheckbox(e)} />
              Virtual Connection Only
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="job" checked={lookingFor.includes("job")} onIonChange={e => addLookingForCheckbox(e)} />
              Job
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="housing" checked={lookingFor.includes("housing")} onIonChange={e => addLookingForCheckbox(e)} />
              Housing / roommate
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="families" checked={lookingFor.includes("families")} onIonChange={e => addLookingForCheckbox(e)} />
              Families
           </IonItem>
          </IonList>
        </div>
      </IonCardContent>
      <IonNote style={{textAlign: "center"}}>Scroll for all options!</IonNote>
      <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray" onClick={() => swiper.slidePrev()}>Back</IonButton>
        <IonButton onClick={updateProfile} disabled={lookingFor.length == 0 ? true : false}>Next</IonButton>
      </IonRow>
    </IonCard>
    {/* <IonRow class="notyet">
    <IonButton fill="clear" onClick={() => stayPausedOpen()}>I don't want to create a profile yet.</IonButton>
  </IonRow> */}
  </>
  
  )
};
export default OnboardingCardLookingFor;
