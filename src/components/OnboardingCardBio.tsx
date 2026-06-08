import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonSelect, IonSelectOption, IonText, IonTextarea,
} from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react'

import { updateCurrentUserProfile } from '../hooks/utilities';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { ONBOARDING_COPY } from '../constants/onboarding';
import { PROFILE_FIELD_LIMITS } from '../constants/fieldLimits';


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
    <IonCard className="onboarding-v2__card onboarding-v2__card--shallow onboarding-slide">
      <IonCardContent>
        <IonCardTitle>{copy.title}</IonCardTitle>
        <IonText>{copy.body}</IonText>
        <IonItem>
          <IonTextarea value={bio}
            name="bio"
            onIonInput={e => setBio((e.detail.value ?? '').slice(0, PROFILE_FIELD_LIMITS.bio))}
            placeholder=""
            maxlength={PROFILE_FIELD_LIMITS.bio}
            counter
            autoGrow={true}
            autocapitalize='sentences'
            autoCorrect='on'
            />
        </IonItem>
      </IonCardContent>
      <div className="onboarding-v2__card-footer">
        <IonRow className="onboarding-v2__nav">
          <IonButton fill="outline" onClick={() => swiper.slidePrev()}>{ONBOARDING_COPY.common.back}</IonButton>
          <IonButton className="onboarding-v2__primary-action" disabled={bio == null || bio.length < 5} onClick={updateProfile}>{ONBOARDING_COPY.common.next}</IonButton>
        </IonRow>
      </div>
    </IonCard>
  )
};
export default OnboardingCardBio;
