import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonFab, IonFabButton, IonIcon, IonRow, IonText,
} from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react'
import { chevronBackOutline } from 'ionicons/icons';
import BoxedStackedInput from './BoxedStackedInput';

import { getCurrentUserProfile, onImgError, updateCurrentUserProfile, uploadPhoto } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { useSwiper } from 'swiper/react';
import { ONBOARDING_COPY } from '../constants/onboarding';
import { PROFILE_FIELD_LIMITS } from '../constants/fieldLimits';



const OnboardingCardZipcode: React.FC = () => {
  const copy = ONBOARDING_COPY.cards.name;

  const [nickname, setNickname] = useState<string | null>(null);
  const swiper = useSwiper();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  
  useEffect(() => {
    setLoading(true); // set loading to true

    const fetchData = async () => {
        setError(null);
        setLoading(true);
        try {
            setData(await getCurrentUserProfile());
            setLoading(false);
        } catch (error: any) {
            setError(error.message);
            setLoading(false)
            console.log("error", error)
        }

    }

    fetchData();
}, []);

  useEffect(() => {
    if (nickname !== null) return;
    const existing = data?.nickname ?? data?.name ?? null;
    if (existing) {
      setNickname(existing);
    }
  }, [data, nickname]);


  const updateProfile = async (e: any) => {

    if (nickname !== null) {
      const existing = data?.nickname ?? data?.name ?? null;
      if (nickname !== existing) {
        await updateCurrentUserProfile({ nickname: nickname })
      }
    }

    swiper.slideNext()

  }
  




  return (
    <IonCard className="onboarding-v2__card onboarding-v2__card--shallow onboarding-slide">
      <IonCardContent>
        <IonCardTitle>{copy.title}</IonCardTitle>
        <IonText>{copy.bodyPrimary}</IonText>
        <IonText>{copy.bodySecondary}</IonText>
        {data ? (
          <BoxedStackedInput
            label="Name"
            value={nickname ?? ''}
            name="nickname"
            placeholder={data.name}
            maxlength={PROFILE_FIELD_LIMITS.nickname}
            counter
            onIonInput={e => setNickname((e.detail.value ?? '').slice(0, PROFILE_FIELD_LIMITS.nickname))}
            type="text"
            autocapitalize="words"
          />
        ) : <>Loading</>}
      </IonCardContent>
      <div className="onboarding-v2__card-footer">
        <IonRow className="onboarding-v2__nav">
          <IonButton fill="outline" onClick={() => swiper.slidePrev()}>{ONBOARDING_COPY.common.back}</IonButton>
          <IonButton className="onboarding-v2__primary-action" onClick={updateProfile}>{ONBOARDING_COPY.common.next}</IonButton>
        </IonRow>
      </div>
    </IonCard>
  )
};
export default OnboardingCardZipcode;
