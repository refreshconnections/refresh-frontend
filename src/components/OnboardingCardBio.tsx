import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonSelect, IonSelectOption, IonText, IonTextarea,
} from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react'

import { updateCurrentUserProfile } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { useSwiper } from 'swiper/react';



const OnboardingCardBio: React.FC = () => {

  const [bio, setBio] = useState<string | null>(null);
  const swiper = useSwiper();



  const updateProfile = async (e: any) => {

    if (bio !== null) {
      const response = await updateCurrentUserProfile({ bio: bio })
    }
    swiper.slideNext()


  }



  return (
    <IonCard className="onboarding-slide ">
      <IonCardContent>
        <IonCardTitle>You're just about done!</IonCardTitle>
        <IonText>Anything else you want to tell people? Fill out the bio section! This is free space for you to say whatever you want about yourself (you know, within reason). Update this at any time. It will be shown front and center on your profile!</IonText>
        <IonItem counter={true}>
          <IonTextarea value={bio}
            name="bio"
            onIonChange={e => setBio(e.detail.value!)}
            placeholder=""
            maxlength={400}
            autoGrow={true} 
            autoCapitalize='sentences'
            />
        </IonItem>
        <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray" onClick={() => swiper.slidePrev()}>Back</IonButton>
        <IonButton disabled={bio == null || bio.length < 5} onClick={updateProfile} >Next</IonButton>
      </IonRow>
      </IonCardContent>
    </IonCard>
  )
};
export default OnboardingCardBio;