import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonFab, IonFabButton, IonIcon, IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonSelect, IonSelectOption, IonText,
} from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react'
import { chevronBackOutline } from 'ionicons/icons';

import { getCurrentUserProfile, onImgError, updateCurrentUserProfile, uploadPhoto } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { useSwiper } from 'swiper/react';
import { ONBOARDING_COPY } from '../constants/onboarding';



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
    <IonCard  className="onboarding-slide">
      <IonCardContent>
        <IonCardTitle>{copy.title}</IonCardTitle>
            <IonText>{copy.bodyPrimary}</IonText>
            <IonText>{copy.bodySecondary}</IonText>
            {data ?
            <IonItem>
            
            <IonInput value={nickname}
                            name="nickname"
                            placeholder={data.name}
                            required={true}
                            onIonInput={e => setNickname(e.detail.value!)}
                            maxlength={30}
                            autoCapitalize='words'
                            onKeyUp={event => {
                              if (event.key === 'Enter') {
                                swiper.slideNext()
                              }
                            }}
                            enterkeyhint="next"
                            type="text" />
            </IonItem>
            : <>Loading</>}
            
      </IonCardContent>
      <IonRow className="onboarding-slide-buttons ">
            <IonButton color="gray" onClick={()=>swiper.slidePrev()}>{ONBOARDING_COPY.common.back}</IonButton>
            <IonButton onClick={updateProfile}>{ONBOARDING_COPY.common.next}</IonButton>
            </IonRow>
    </IonCard>
  )
};
export default OnboardingCardZipcode;
