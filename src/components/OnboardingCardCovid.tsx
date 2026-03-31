import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonCheckbox, IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonText,
} from '@ionic/react';
import React, { useEffect, useState } from 'react'

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



const OnboardingCardCovid: React.FC = () => {
  const copy = ONBOARDING_COPY.cards.covid;

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
        <IonCardTitle>{copy.title}</IonCardTitle>
        <IonText>{copy.body}</IonText>
        <IonItem className="scrollable-list">
          <IonList lines="none" className="onboarding-checkbox-list">
          <IonItem lines="none"><IonLabel>{copy.sections.home}</IonLabel></IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={18} checked={covidPrecautions.includes(18)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                {copy.options[0].label}
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={3} checked={covidPrecautions.includes(3)} onIonChange={e => addCovidPrecautionsCheckbox(e)}/>
                                                {copy.options[1].label}
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={8} checked={covidPrecautions.includes(8)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                {copy.options[2].label}
                                            </IonItem>
                                            <IonItem lines="none"><IonLabel>{copy.sections.work}</IonLabel></IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={1} checked={covidPrecautions.includes(1)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                {copy.options[3].label}
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={9} checked={covidPrecautions.includes(9)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                {copy.options[4].label}
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={16} checked={covidPrecautions.includes(16)} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                {copy.options[5].label}
                                            </IonItem>
                                            <IonItem lines="none"><IonLabel>{copy.sections.play}</IonLabel></IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={2} checked={covidPrecautions.includes(2)} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                {copy.options[6].label}
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={15} checked={covidPrecautions.includes(15)} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                {copy.options[7].label}
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={5} checked={covidPrecautions.includes(5)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                {copy.options[8].label}
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={12} checked={covidPrecautions.includes(12)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                {copy.options[9].label}
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={6} checked={covidPrecautions.includes(6)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                {copy.options[10].label}
                                            </IonItem>
                                            <IonItem lines="none"><IonLabel>{copy.sections.other}</IonLabel></IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={4} checked={covidPrecautions.includes(4)} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                {copy.options[11].label}
                                            </IonItem> 
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={17} checked={covidPrecautions.includes(17)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                {copy.options[12].label}
                                            </IonItem>
                                            
                                            
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={7} checked={covidPrecautions.includes(7)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                {copy.options[13].label}
                                            </IonItem>
                                           
                                            
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={10} checked={covidPrecautions.includes(10)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                {copy.options[14].label}
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={11} checked={covidPrecautions.includes(11)} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                {copy.options[15].label}
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={13} checked={covidPrecautions.includes(13)} onIonChange={e => addCovidPrecautionsCheckbox(e)}  />
                                                {copy.options[16].label}
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={14} checked={covidPrecautions.includes(14)} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                                {copy.options[17].label}
                                            </IonItem>
          </IonList>
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">{copy.noteLabel}</IonLabel>
          <IonInput
            value={covidNote}
            onIonInput={(e) => setCovidNote(e.detail.value ?? '')}
            placeholder={copy.notePlaceholder}
            maxlength={200}
          />
        </IonItem>
      </IonCardContent>
      <IonNote style={{textAlign: "center"}}>{copy.scrollNote}</IonNote>
      <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray " onClick={() => swiper.slidePrev()}>{ONBOARDING_COPY.common.back}</IonButton>
        <IonButton onClick={updateProfile} disabled={covidPrecautions.length == 0 ? true : false}>{ONBOARDING_COPY.common.next}</IonButton>
      </IonRow>
    </IonCard>
    {/* <IonRow class="notyet">
    <IonButton fill="clear" onClick={() => stayPausedOpen()}>I don't want to create a profile yet.</IonButton>
  </IonRow> */}
  </>
  )
};
export default OnboardingCardCovid;
