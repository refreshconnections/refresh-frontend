import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonCheckbox, IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonSelect, IonSelectOption, IonText, useIonAlert,
  useIonModal,
} from '@ionic/react';
import React, { useState } from 'react'

import { updateCurrentUserProfile } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { useSwiper } from 'swiper/react';



const OnboardingCardCovid: React.FC = () => {

  const swiper = useSwiper();
  const [covidPrecautions, setCovidPrecautions] = useState<number[]>([]);



  const updateProfile = async (e: any) => {
    if (covidPrecautions.length !== 0) {
      await updateCurrentUserProfile({ covid_precautions: covidPrecautions })
      swiper.slideNext()
    }


  }

  //Adds the checkedbox to the array and check if you unchecked it
  const addCovidPrecautionsCheckbox = (event: any) => {
    if (event.detail.checked) {
      const newArray = [...covidPrecautions, event.detail.value]
      setCovidPrecautions(newArray)
    } else {
      setCovidPrecautions(covidPrecautions.filter(a => a != event.detail.value))
    }
  }

  // const [stayPausedOpen, stayPausedDismiss] = useIonModal(StayPausedModal, {
  //   onDismiss: () => stayPausedDismiss(),
  // });


  return (
    <>
    <IonCard className="onboarding-slide extra-top-padding">
      <IonCardContent className="w-checkboxes">
        <IonCardTitle>How are you dealing with Covid?</IonCardTitle>
        <IonText>These will be shown on your profile. You can change these at any time. </IonText>
        <IonItem class="scrollable-list">
          <IonList lines="none">
          <IonItem lines="none"><IonLabel>Home:</IonLabel></IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={18}  onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I have no routine daily exposures
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={3}  onIonChange={e => addCovidPrecautionsCheckbox(e)}/>
                                                I live with non-covid cautious people
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={8}  onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I live alone/with others that share my level of covid caution
                                            </IonItem>
                                            <IonItem lines="none"><IonLabel>Work:</IonLabel></IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={1}  onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I work from home
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={9}  onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I go to work/school but always in a high quality mask
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={16} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                My work requires poor/no masking
                                            </IonItem>
                                            <IonItem lines="none"><IonLabel>Play:</IonLabel></IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={2}  onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                I eat outside at restaurants with good airflow and spacing
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={15}  onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                I do takeout from restaurants
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={5}  onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I attend outdoor events
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={12} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I attend outdoor events with a mask on
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={6} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I attend indoor events with a mask on
                                            </IonItem>
                                            <IonItem lines="none"><IonLabel>Other:</IonLabel></IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={4} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                I'm immunocompromised/have a high-risk health condition
                                            </IonItem> 
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={17} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I am a caregiver
                                            </IonItem>
                                            
                                            
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={7}  onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I only leave home/outdoors for medically necessary reasons
                                            </IonItem>
                                           
                                            
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={10}  onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I am living with Long Covid
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={11} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                I use air purifiers and use HEPA filters
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={13}  onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I ask for testing before all meetups
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={14}  onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                I ask for testing before indoor meetups
                                            </IonItem>
          </IonList>
        </IonItem>
      </IonCardContent>
      <IonNote style={{textAlign: "center"}}>Scroll for all options!</IonNote>
      <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray " onClick={() => swiper.slidePrev()}>Back</IonButton>
        <IonButton onClick={updateProfile} disabled={covidPrecautions.length == 0 ? true : false}>Next</IonButton>
      </IonRow>
    </IonCard>
    {/* <IonRow class="notyet">
    <IonButton fill="clear" onClick={() => stayPausedOpen()}>I don't want to create a profile yet.</IonButton>
  </IonRow> */}
  </>
  )
};
export default OnboardingCardCovid;