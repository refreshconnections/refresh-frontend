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



const OnboardingCardZipcode: React.FC = () => {

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


  const updateProfile = async (e: any) => {

    if (nickname !== null) {
      const response = await updateCurrentUserProfile({ nickname: nickname })
    }

    swiper.slideNext()

  }
  




  return (
    <IonCard  className="onboarding-slide">
      <IonCardContent>
        <IonCardTitle>What's your name?</IonCardTitle>
            <IonText>This is the name (a first name or a nickname) that will be shown on your profile.</IonText>
            <IonText>To keep our community authentic, we require you to contact support if you need to change your name later.</IonText>
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
            <IonButton color="gray" onClick={()=>swiper.slidePrev()}>Back</IonButton>
            <IonButton onClick={updateProfile}>Next</IonButton>
            </IonRow>
    </IonCard>
  )
};
export default OnboardingCardZipcode;