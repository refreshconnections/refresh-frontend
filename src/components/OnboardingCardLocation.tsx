import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonSelect, IonSelectOption, IonText,
  useIonModal,
} from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react'
import useFetch from '../hooks/useFetch';

import { updateCurrentUserProfile } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { useSwiper } from 'swiper/react';
// import StayPausedModal from './StayPausedModal';



const OnboardingCardLocation: React.FC = () => {

  const [location, setLocation] = useState<string | null>(null);
  const swiper = useSwiper();



  const updateProfile = async (e: any) => {

    if (location !== null) {
      const response = await updateCurrentUserProfile({ location: location })
      swiper.slideNext()
    }


  }

  // const [stayPausedOpen, stayPausedDismiss] = useIonModal(StayPausedModal, {
  //   onDismiss: () => stayPausedDismiss(),
  // });


  return (
    <>
    <IonCard  className="onboarding-slide">
      <IonCardContent>
        <IonCardTitle>What area do you live in?</IonCardTitle>
            <IonText>We will show this on your profile. Put down what city or region you live in. For example, you might say you live on the Upper West Side of NYC. Or Northern Kentucky. Be as vague or as specific as you'd like (but don't share your exact address!).</IonText>
            <IonItem>
            <IonInput value={location}
                            name="location"
                            required={true}
                            onIonChange={e => setLocation(e.detail.value!)}
                            maxlength={30}
                            type="text" 
                            autoCapitalize='words'
                            onKeyUp={event => {
                              if (event.key === 'Enter') {
                                swiper.slideNext()
                              }
                            }}
                            enterkeyhint="next"/>
            </IonItem>
            <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray" onClick={()=>swiper.slidePrev()}>Back</IonButton>
        <IonButton onClick={updateProfile} disabled={location == null ? true : false}>Next</IonButton>
        </IonRow>
      </IonCardContent>
      
    </IonCard>
    {/* <IonRow class="notyet">
    <IonButton fill="clear" onClick={() => stayPausedOpen()}>I don't want to create a profile yet.</IonButton>
  </IonRow> */}
  </>
  )
};
export default OnboardingCardLocation;