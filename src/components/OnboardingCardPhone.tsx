import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonSelect, IonSelectOption, IonText, useIonAlert,
} from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react'
import useFetch from '../hooks/useFetch';
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'



import { checkVerificationCode, getCurrentUserProfile, logoutAll, onImgError, sendPhoneVerification, updateCurrentUserProfile, uploadPhoto } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import moment from 'moment';
import { useSwiper } from 'swiper/react';
import SwiperButtonNext from './SwiperButtonNext';



const OnboardingCardPhone: React.FC = () => {

  const [phone, setPhone] = useState<any>(null);
  const [code, setCode] = useState<string | null>(null);
  const swiper = useSwiper();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  const [presentAlert] = useIonAlert();
  const [presentBadAlert] = useIonAlert();

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

    if (phone !== null) {
      const response = await updateCurrentUserProfile({ phone_number: phone })
    }

    swiper.slideNext()

  }

  const verify = async (v_code: string) => {

    console.log("verify")
    const response = await checkVerificationCode(phone, v_code)



  }

  const enterCodeAlert = async () => {
    presentAlert({
      header: "We sent you a code to verify your number. What was it?",
      buttons: [
        {
          text: "Try Again",
          role: 'cancel',
          handler: async () => {
            console.log('please resent');
            // todo resend code
          }
        },
        {
          text: "Verify",
          role: 'ok',
          handler: async (data: any) => {
            console.log('OK clicked: ', data);
            await verify(data.code)
            swiper.slideNext()
            setData(await getCurrentUserProfile());
            // await updateCurrentUserProfile({ location_point_long: null, location_point_lat: null })
          }
        }
      ],
      inputs: [
        {
          name: 'code',
          type: 'number',
          placeholder: "Verification Code",
        },

      ],
    })
  }

  const couldntSendAlert = async (error: string) => {
    presentBadAlert({
      message: error,
      buttons: [
        {
          text: "Back to login",
          role: 'ok',
          handler: async () => {
            logoutAll()
          }
        },
        {
          text: "Try again",
          role: 'ok',
          handler: async () => {
            // todo
          }
        }
      ]
    })
  }

  const send = async () => {

    console.log("sending")
    const response = await sendPhoneVerification(phone)
    console.log("me**:)", response)
    if (response['status'] === 200) {
      enterCodeAlert()
    }
    else if (response['status'] === 409) {
      couldntSendAlert("This phone number cannot be used to sign up for an account. Users can only have one account with Refresh Connections. Please contact help@refreshconnections.com if you deleted a previous account in error.")
    }
    else if (response['status'] === 429) {
      couldntSendAlert("There have been too many attempts to send yourself a code at this time. Please try again later.")
    }
    else {
      couldntSendAlert(response?.data ?? "Sending you a code is not working at this time. Please try again later.")
    }
    
  }

  return (
    <IonCard className="onboarding-slide">

      <IonCardContent>
        <IonCardTitle>What's your phone number?</IonCardTitle>
        <IonText>We never share your phone number. We use it to verify your account. We'll send you a 6-digit code to make sure it's you.</IonText>
        <div>
          <IonItem className="phone-number-onboarding">
            <PhoneInput
              placeholder={data && data.phone_number ? data.phone_number : "Enter phone number"}
              defaultCountry="US"
              value={phone}
              onChange={setPhone}

              onKeyUp={event => {
                if (event.key === 'Enter') {
                  swiper.slideNext()
                }
              }}
              enterkeyhint="next"
              disabled={(data && data.phone_number)} />

          </IonItem>
          {error ? <IonNote slot="error">{error}</IonNote> : <></>}
        </div>
        
      </IonCardContent>
      <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray" onClick={() => swiper.slidePrev()}>Back</IonButton>
        {data?.phone_number ?
          <IonButton onClick={() => swiper.slideNext()}>Next</IonButton> :
          error ? <IonButton onClick={() => { setError(null); setPhone(null) }}>Clear</IonButton> :
            <IonButton onClick={send} disabled={(phone === null) ? true : false}>Send me a code!</IonButton>
        }
      </IonRow>
    </IonCard>
  )
};
export default OnboardingCardPhone;
