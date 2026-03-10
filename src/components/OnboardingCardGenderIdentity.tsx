import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonCheckbox, IonItem, IonLabel, IonList, IonNote, IonRow, IonText, IonToggle,
  useIonModal,
} from '@ionic/react';
import React, { useEffect, useState } from 'react'

import { updateCurrentUserProfile } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';


// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { useSwiper } from 'swiper/react';
import StayPausedModal from './StayPausedModal';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';



const OnboardingCardGenderIdentity: React.FC = () => {

  const swiper = useSwiper();

  const currentProfile = useGetCurrentProfile().data;
  const [gS, setGS] = useState<string[]>([]);
  const [showOnProfile, setShowOnProfile] = useState<boolean>(false);


  const [stayPausedOpen, stayPausedDismiss] = useIonModal(StayPausedModal, {
    onDismiss: () => stayPausedDismiss(),
  });


  useEffect(() => {
    if (currentProfile?.gender_sexuality_choices) {
      setGS(Array.from(new Set(currentProfile.gender_sexuality_choices)));
    }
    setShowOnProfile(Boolean(currentProfile?.settings_show_gender_sexuality));
  }, [currentProfile?.gender_sexuality_choices, currentProfile?.settings_show_gender_sexuality]);

  const updateProfile = async () => {
    if (gS.length !== 0) {
      const existingChoices = currentProfile?.gender_sexuality_choices ?? [];
      const existingShow = Boolean(currentProfile?.settings_show_gender_sexuality);
      const nextSorted = [...gS].sort();
      const existingSorted = [...existingChoices].sort();
      const choicesUnchanged =
        nextSorted.length === existingSorted.length &&
        nextSorted.every((value, index) => value === existingSorted[index]);
      const showUnchanged = showOnProfile === existingShow;

      if (!choicesUnchanged || !showUnchanged) {
        await updateCurrentUserProfile({
          gender_sexuality_choices: gS,
          settings_show_gender_sexuality: showOnProfile,
        })
      }
      swiper.slideNext()
    }
  }
  //Adds the checkedbox to the array and check if you unchecked it
  const addGenderSexualityCheckbox = (event: any) => {
    const value = event.detail.value as string;
    const checked = event.detail.checked as boolean;
    setGS((prev) =>
      checked ? (prev.includes(value) ? prev : [...prev, value]) : prev.filter((a) => a !== value)
    );
  }


  return (
    <>
    <IonCard className="onboarding-slide">
      <IonCardContent className="w-checkboxes">
        <IonCardTitle>How do you identify?</IonCardTitle>
        <IonText>We use your gender identity to share your profile with potential connections. Choose as many as apply to you.</IonText>
        <div className="onboarding-option-card">
          <IonList className="scrollable-list onboarding-checkbox-list">
            <IonItem>
              <IonCheckbox slot="start" value="woman" checked={gS.includes("woman")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Woman
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="man" checked={gS.includes("man")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Man
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="nb" checked={gS.includes("nb")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Nonbinary/gender noncomforming
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="genderfluid" checked={gS.includes("genderfluid")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Gender Fluid
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="cis" checked={gS.includes("cis")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Cis
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="trans" checked={gS.includes("trans")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Trans
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="intersex" checked={gS.includes("intersex")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Intersex
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="straight" checked={gS.includes("straight")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Straight/heterosexual
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="gay" checked={gS.includes("gay")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Gay/homosexual
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="lesbian" checked={gS.includes("lesbian")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Lesbian
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="bi" checked={gS.includes("bi")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Bi
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="pan" checked={gS.includes("pan")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Pan
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="gray ace" checked={gS.includes("gray ace")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Gray ace
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="ace" checked={gS.includes("ace")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Ace
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="demi" checked={gS.includes("demi")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Demisexual
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="queer" checked={gS.includes("queer")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Queer
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="mono" checked={gS.includes("mono")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Monogamous
            </IonItem>
            <IonItem>
              <IonCheckbox slot="start" value="poly" checked={gS.includes("poly")} onIonChange={e => addGenderSexualityCheckbox(e)} />
              Polyamorous
            </IonItem>
          </IonList>
          <IonNote className="onboarding-option-note">Scroll for all options!</IonNote>
          <IonText className="onboarding-subtext">
            These choices are used to filter your picks. You can choose to show them on your profile, or keep them just for filtering.
          </IonText>
          <IonItem className="onboarding-toggle-row">
            <IonLabel>Show on profile</IonLabel>
            <IonToggle
              slot="end"
              checked={showOnProfile}
              onIonChange={(e) => setShowOnProfile(e.detail.checked)}
            />
          </IonItem>
        </div>
        
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
