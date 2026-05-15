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
import { ONBOARDING_COPY } from '../constants/onboarding';



const OnboardingCardGenderIdentity: React.FC = () => {
  const copy = ONBOARDING_COPY.cards.genderIdentity;

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
    <IonCard className="onboarding-v2__card onboarding-v2__card--shallow onboarding-slide">
      <IonCardContent className="w-checkboxes">
        <IonCardTitle>{copy.title}</IonCardTitle>
        <IonText>{copy.body}</IonText>
        <div className="onboarding-option-card">
          <IonList className="scrollable-list onboarding-checkbox-list">
            {copy.options.map(([value, label]) => (
              <IonItem key={value}>
                <IonCheckbox slot="start" value={value} checked={gS.includes(value)} onIonChange={e => addGenderSexualityCheckbox(e)} />
                {label}
              </IonItem>
            ))}
          </IonList>
          <IonNote className="onboarding-option-note">{copy.scrollNote}</IonNote>
          <IonText className="onboarding-subtext">
            {copy.subtext}
          </IonText>
          <IonItem className="onboarding-toggle-row">
            <IonLabel>{copy.showOnProfile}</IonLabel>
            <IonToggle
              slot="end"
              checked={showOnProfile}
              onIonChange={(e) => setShowOnProfile(e.detail.checked)}
            />
          </IonItem>
        </div>
      </IonCardContent>
      <div className="onboarding-v2__card-footer">
        <IonRow className="onboarding-v2__nav">
          <IonButton fill="outline" onClick={() => swiper.slidePrev()}>{ONBOARDING_COPY.common.back}</IonButton>
          <IonButton className="onboarding-v2__primary-action" onClick={updateProfile} disabled={gS.length === 0}>{ONBOARDING_COPY.common.next}</IonButton>
        </IonRow>
      </div>
    </IonCard>
  )
};
export default OnboardingCardGenderIdentity;
