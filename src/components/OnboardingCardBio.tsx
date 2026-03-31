import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonSelect, IonSelectOption, IonText, IonTextarea,
} from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react'

import { updateCurrentUserProfile } from '../hooks/utilities';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { ONBOARDING_COPY } from '../constants/onboarding';


import './CantAccessCard.css';
import './OnboardingCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { useSwiper } from 'swiper/react';



const OnboardingCardBio: React.FC = () => {
  const copy = ONBOARDING_COPY.cards.bio;

  const [bio, setBio] = useState<string | null>(null);
  const swiper = useSwiper();
  const currentProfile = useGetCurrentProfile().data;

  useEffect(() => {
    if (bio !== null) return;
    if (currentProfile?.bio) {
      setBio(currentProfile.bio);
    }
  }, [bio, currentProfile?.bio]);



  const updateProfile = async (e: any) => {

    if (bio !== null) {
      const existing = currentProfile?.bio ?? '';
      if (bio !== existing) {
        await updateCurrentUserProfile({ bio: bio })
      }
    }
    swiper.slideNext()


  }



  return (
    <IonCard className="onboarding-slide ">
      <IonCardContent>
        <IonCardTitle>{copy.title}</IonCardTitle>
        <IonText>{copy.body}</IonText>
        <IonItem>
          <IonTextarea value={bio}
            name="bio"
            onIonInput={e => setBio(e.detail.value!)}
            placeholder=""
            maxlength={400}
            counter
            autoGrow={true} 
            autoCapitalize='sentences'
            />
        </IonItem>
        <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray" onClick={() => swiper.slidePrev()}>{ONBOARDING_COPY.common.back}</IonButton>
        <IonButton disabled={bio == null || bio.length < 5} onClick={updateProfile} >{ONBOARDING_COPY.common.next}</IonButton>
      </IonRow>
      </IonCardContent>
    </IonCard>
  )
};
export default OnboardingCardBio;
