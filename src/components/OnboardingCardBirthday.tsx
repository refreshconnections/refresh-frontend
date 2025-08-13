import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonDatetime, IonDatetimeButton, IonInput, IonItem, IonLabel, IonList, IonModal, IonNote, IonRow, IonSelect, IonSelectOption, IonText,
  useIonAlert,
} from '@ionic/react';
import React, { useEffect, useState } from 'react'

import { updateCurrentUserProfileWStatus } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import moment from 'moment';
import { useSwiper } from 'swiper/react';
import SwiperButtonNext from './SwiperButtonNext';



const OnboardingCardBasic: React.FC = () => {

  const [birthday, setBirthday] = useState<string | null | any>(null);
  const [age, setAge] = useState<string | null | any>(null);

  const swiper = useSwiper();
  const [isValid, setIsValid] = useState<boolean>(false);

  const [presentAgeAlert] = useIonAlert();


  const ageAlert = async () => {
    presentAgeAlert({
      header: `${age} will show as your age on your profile. Is this correct?`,
      buttons: [
        {
          text: "No, go back.",
          role: 'cancel',
          handler: async () => {
            console.log('please resent');
          }
        },
        {
          text: "Yes, next!",
          role: 'ok',
          handler: async () => {
            swiper.slideNext()
          }
        }
      ]
    })
  }


  const eighteenYearsAtLeast = () => {
    var date = new Date();
    const year = date.getFullYear();
    date.setFullYear(year - 18);
    const stringDate: string = moment(date).format('YYYY-MM-DD')
    return stringDate

  }

  const getAge = (value: string) => {

    return moment().diff(moment(value, 'YYYY-MM-DD'), 'years')

  }


  const updateProfile = async (e: any) => {

    if (birthday !== null) {

      const birthday_justdate = (birthday.split('T')[0])
      const response = await updateCurrentUserProfileWStatus({ birth_date: birthday_justdate })

      if (response?.status == 204){
        await ageAlert()
      }
      
      console.log("birthday", response)
    }

    // TODO validate bday

  }

  const validate = (birthday: string) => {
    const value = birthday.split('T')[0]

    setAge(getAge(value))

    setIsValid(false);

    if (value === '') setIsValid(false);

    if (value <= eighteenYearsAtLeast()) {
      setIsValid(true)
    }
    else {
      setIsValid(false)
    }
  };

  useEffect(() => {
    console.log(birthday)
    if (birthday) {
      validate(birthday!)
    }

}, [birthday]);


  return (
    <IonCard className="onboarding-slide">
      <IonCardContent>
        <IonCardTitle>When is your birthday?</IonCardTitle>
        
            <IonText>We don't share your birthday with anyone, but we will show your age on your profile. You won't be able to change this later, so use your real birthday.</IonText>
            {/* <IonItem>
            <IonInput
              value={birthday}
              name="birthday"
              onIonInput={(event) => validate(event)}
              max={eighteenYearsAtLeast()}
              onIonChange={e => setBirthday(e.detail.value!)}
              autocomplete="bday"
              type="date" />
            </IonItem> */}
            <IonItem className="tb-padding "> 
              <IonLabel color={birthday == null? "gray" : "black"} className="always-visible">{birthday?.split('T')[0] || "Click here"}</IonLabel>
              <IonDatetimeButton datetime="datetime" style={{position: "absolute", width: "100%", height: "100%"}}></IonDatetimeButton>
            </IonItem>
            {(isValid === false && birthday) ? <IonNote slot="error">You must be at least 18.</IonNote> : <></>}

            <IonModal keepContentsMounted={true}>
              <IonDatetime id="datetime" preferWheel={true} placeholder="Select your birthday" max={eighteenYearsAtLeast()} presentation="date" value={birthday ?? "2000-01-01"}  onIonChange={e => setBirthday(e.detail.value)} showDefaultButtons={true}></IonDatetime>
            </IonModal>
            <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray" onClick={()=>swiper.slidePrev()}>Back</IonButton>
        <IonButton onClick={updateProfile} disabled={!isValid}>Next</IonButton>
        </IonRow>
      </IonCardContent>
      
    </IonCard>
  )
};
export default OnboardingCardBasic;