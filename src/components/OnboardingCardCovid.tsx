import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonCheckbox, IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonText,
} from '@ionic/react';
import React, { useEffect, useState } from 'react'

import { updateCurrentUserProfile } from '../hooks/utilities';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';


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
  const [covidNote, setCovidNote] = useState<string>('');
  const currentProfile = useGetCurrentProfile().data;

  useEffect(() => {
    if (currentProfile?.covid_precautions && covidPrecautions.length === 0) {
      setCovidPrecautions(currentProfile.covid_precautions);
    }
    if (currentProfile?.covid_precaution_info && covidNote.length === 0) {
      setCovidNote(currentProfile.covid_precaution_info);
    }
  }, [currentProfile?.covid_precautions, currentProfile?.covid_precaution_info, covidPrecautions.length, covidNote.length]);



  const updateProfile = async () => {
    if (covidPrecautions.length !== 0) {
      const existingPrecautions = currentProfile?.covid_precautions ?? [];
      const existingNote = currentProfile?.covid_precaution_info ?? '';
      const nextSorted = [...covidPrecautions].sort((a, b) => a - b);
      const existingSorted = [...existingPrecautions].sort((a, b) => a - b);
      const precautionsUnchanged =
        nextSorted.length === existingSorted.length &&
        nextSorted.every((value, index) => value === existingSorted[index]);
      const noteUnchanged = covidNote.trim() === existingNote;

      if (!precautionsUnchanged || !noteUnchanged) {
        await updateCurrentUserProfile({
          covid_precautions: covidPrecautions,
          covid_precaution_info: covidNote.trim(),
        })
      }
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
        <IonItem className="scrollable-list">
          <IonList lines="none" className="onboarding-checkbox-list">
          <IonItem lines="none"><IonLabel>Home:</IonLabel></IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={18} checked={covidPrecautions.includes(18)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I have no routine daily exposures
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={3} checked={covidPrecautions.includes(3)} onIonChange={e => addCovidPrecautionsCheckbox(e)}/>
                                                I live with non-covid cautious people
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={8} checked={covidPrecautions.includes(8)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I live alone/with others that share my level of covid caution
                                            </IonItem>
                                            <IonItem lines="none"><IonLabel>Work:</IonLabel></IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={1} checked={covidPrecautions.includes(1)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I work from home
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={9} checked={covidPrecautions.includes(9)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I go to work/school but always in a high quality mask
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={16} checked={covidPrecautions.includes(16)} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                My work requires poor/no masking
                                            </IonItem>
                                            <IonItem lines="none"><IonLabel>Play:</IonLabel></IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={2} checked={covidPrecautions.includes(2)} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                I eat outside at restaurants with good airflow and spacing
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={15} checked={covidPrecautions.includes(15)} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                I do takeout from restaurants
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={5} checked={covidPrecautions.includes(5)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I attend outdoor events
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={12} checked={covidPrecautions.includes(12)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I attend outdoor events with a mask on
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={6} checked={covidPrecautions.includes(6)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I attend indoor events with a mask on
                                            </IonItem>
                                            <IonItem lines="none"><IonLabel>Other:</IonLabel></IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={4} checked={covidPrecautions.includes(4)} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                I'm immunocompromised/have a high-risk health condition
                                            </IonItem> 
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={17} checked={covidPrecautions.includes(17)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I am a caregiver
                                            </IonItem>
                                            
                                            
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={7} checked={covidPrecautions.includes(7)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I only leave home/outdoors for medically necessary reasons
                                            </IonItem>
                                           
                                            
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={10} checked={covidPrecautions.includes(10)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I am living with Long Covid
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={11} checked={covidPrecautions.includes(11)} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                I use air purifiers and use HEPA filters
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={13} checked={covidPrecautions.includes(13)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                I ask for testing before all meetups
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={14} checked={covidPrecautions.includes(14)} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                I ask for testing before indoor meetups
                                            </IonItem>
          </IonList>
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Anything else you want to share?</IonLabel>
          <IonInput
            value={covidNote}
            onIonInput={(e) => setCovidNote(e.detail.value ?? '')}
            placeholder="Optional note about your Covid precautions"
            maxlength={200}
          />
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
