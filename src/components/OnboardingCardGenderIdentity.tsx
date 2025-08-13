import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonCheckbox, IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonSelect, IonSelectOption, IonText,
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
import StayPausedModal from './StayPausedModal';



const OnboardingCardGenderIdentity: React.FC = () => {

  const swiper = useSwiper();

  const [gS, setGS] = useState<string[]>([]);


  const [stayPausedOpen, stayPausedDismiss] = useIonModal(StayPausedModal, {
    onDismiss: () => stayPausedDismiss(),
  });


  const updateProfile = async (e: any) => {

    if (gS.length !== 0) {
      const response = await updateCurrentUserProfile({ gender_sexuality_choices: gS })
      swiper.slideNext()
    }

    // TODO validate gender is real

  }
  //Adds the checkedbox to the array and check if you unchecked it
  const addGenderSexualityCheckbox = (event: any) => {
    if (event.detail.checked) {
      const newArray = [...gS, event.detail.value]
      setGS(newArray)

    } else {
      setGS(gS.filter(a => a != event.detail.value))
    }
  }


  return (
    <>
    <IonCard className="onboarding-slide">
      <IonCardContent className="w-checkboxes">
        <IonCardTitle>How do you identify?</IonCardTitle>
        <IonText>We use your gender identity to share your profile with potential connections. Choose as many as apply to you. These choices do not appear in your profile unless you choose to show them. </IonText>
        <IonItem class="scrollable-list">
          <IonList>
            <IonItem>
              <IonCheckbox slot="start" value="woman" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Woman
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="man" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Man
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="nb" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Nonbinary/gender noncomforming
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="genderfluid" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Gender Fluid
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="cis" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Cis
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="trans" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Trans
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="intersex" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Intersex
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="straight" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Straight/heterosexual
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="gay" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Gay/homosexual
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="lesbian" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Lesbian
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="bi" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Bi
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="pan" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Pan
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="gray ace" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Gray ace
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="ace" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Ace
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="demi" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Demisexual
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="queer" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Queer
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="mono" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Monogamous
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="poly" onIonChange={e => addGenderSexualityCheckbox(e)} />
              Polyamorous
            </IonItem>
          </IonList>

        </IonItem>
        <IonNote style={{textAlign: "center"}}>Scroll for all options!</IonNote>
        
        <IonRow className="onboarding-slide-buttons">

          <IonButton color="gray" onClick={() => swiper.slidePrev()}>Back</IonButton>
          <IonButton onClick={updateProfile} disabled={gS.length == 0 ? true : false}>Next</IonButton>
        </IonRow>
        
      </IonCardContent>
      
    </IonCard>
    {/* <IonRow class="notyet">
    <IonButton fill="clear" onClick={() => stayPausedOpen()}>I don't want to create a profile yet.</IonButton>
  </IonRow> */}
  </>
  )
};
export default OnboardingCardGenderIdentity;