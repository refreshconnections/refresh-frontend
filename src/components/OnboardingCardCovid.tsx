import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonCheckbox, IonItem, IonLabel, IonList, IonNote, IonRow, IonText,
} from '@ionic/react';
import React, { useEffect, useState } from 'react'
import BoxedStackedInput from './BoxedStackedInput';
import { PROFILE_FIELD_LIMITS } from '../constants/fieldLimits';

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
  const [covidNote, setCovidNote] = useState<string | null>(null);
  const currentProfile = useGetCurrentProfile().data;

  useEffect(() => {
    if (currentProfile?.covid_precautions && covidPrecautions.length === 0) {
      setCovidPrecautions(currentProfile.covid_precautions);
    }
    if (covidNote === null && currentProfile) {
      setCovidNote(currentProfile.covid_precaution_info ?? '');
    }
  }, [currentProfile, covidPrecautions.length, covidNote]);



  const updateProfile = async () => {
    if (covidPrecautions.length !== 0) {
      const existingPrecautions = currentProfile?.covid_precautions ?? [];
      const existingNote = currentProfile?.covid_precaution_info ?? '';
      const nextSorted = [...covidPrecautions].sort((a, b) => a - b);
      const existingSorted = [...existingPrecautions].sort((a, b) => a - b);
      const precautionsUnchanged =
        nextSorted.length === existingSorted.length &&
        nextSorted.every((value, index) => value === existingSorted[index]);
      const noteUnchanged = (covidNote ?? '').trim() === existingNote;

      if (!precautionsUnchanged || !noteUnchanged) {
        await updateCurrentUserProfile({
          covid_precautions: covidPrecautions,
          covid_precaution_info: (covidNote ?? '').trim(),
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
    <IonCard className="onboarding-v2__card onboarding-v2__card--shallow onboarding-slide">
      <IonCardContent className="w-checkboxes onboarding-covid-content">
        <IonCardTitle>{copy.title}</IonCardTitle>
        <IonText>{copy.body}</IonText>
        <IonItem className="scrollable-list onboarding-covid-list">
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
        <BoxedStackedInput
          label={copy.noteLabel}
          value={covidNote ?? ''}
          name="covid_note"
          maxlength={PROFILE_FIELD_LIMITS.covidPrecautionInfo}
          counter
          onIonInput={(e) => setCovidNote((e.detail.value ?? '').slice(0, PROFILE_FIELD_LIMITS.covidPrecautionInfo))}
          placeholder={copy.notePlaceholder}
          type="text"
          autocapitalize="sentences"
          autoCorrect="on"
        />
        <IonNote className="onboarding-covid-scroll-note">{copy.scrollNote}</IonNote>
      </IonCardContent>
      <div className="onboarding-v2__card-footer">
        <IonRow className="onboarding-v2__nav">
          <IonButton fill="outline" onClick={() => swiper.slidePrev()}>{ONBOARDING_COPY.common.back}</IonButton>
          <IonButton className="onboarding-v2__primary-action" onClick={updateProfile} disabled={covidPrecautions.length === 0}>{ONBOARDING_COPY.common.next}</IonButton>
        </IonRow>
      </div>
    </IonCard>
  )
};
export default OnboardingCardCovid;
