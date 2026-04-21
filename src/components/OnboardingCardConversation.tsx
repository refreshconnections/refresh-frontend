import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonRow, IonText,
} from '@ionic/react';
import React, { useState } from 'react'
import BoxedStackedInput from './BoxedStackedInput';

import { updateCurrentUserProfile } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { useSwiper } from 'swiper/react';
import SwiperButtonNext from './SwiperButtonNext';



const OnboardingCardConversation: React.FC = () => {

  const [topic, setTopic] = useState<string>("");
  const [hobby, setHobby] = useState<string>("");
  const [book, setBook] = useState<string>("");


  const swiper = useSwiper();



  const updateProfile = async () => {

    await updateCurrentUserProfile({ fave_topic: topic, fave_book: book, hobby: hobby })
    swiper.slideNext()


  }


  return (
    <IonCard className="onboarding-slide ">
      <IonCardContent className="talkabouts">
        <IonCardTitle>One last thing.</IonCardTitle>
        <IonText>Give people an easy conversation starter! Fill out one now - or all of them if you want! You can add more in the Let's Talk About section of your profile later.</IonText>
        <BoxedStackedInput
          label="Favorite topic"
          value={topic}
          name="topic"
          onIonInput={e => setTopic(e.detail.value!)}
          placeholder=""
          type="text"
          autocapitalize="sentences"
        />
        <BoxedStackedInput
          label="Hobby"
          value={hobby}
          name="hobby"
          onIonInput={e => setHobby(e.detail.value!)}
          placeholder=""
          type="text"
          autocapitalize="sentences"
        />
        <BoxedStackedInput
          label="Favorite book"
          value={book}
          name="book"
          onIonInput={e => setBook(e.detail.value!)}
          placeholder=""
          type="text"
          autocapitalize="sentences"
        />
        <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray" onClick={() => swiper.slidePrev()}>Back</IonButton>
        <IonButton disabled={topic == "" && book=="" && hobby==""} onClick={updateProfile} >Next</IonButton>
      </IonRow>
      </IonCardContent>
    </IonCard>
  )
};
export default OnboardingCardConversation;
