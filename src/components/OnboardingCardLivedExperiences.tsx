import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonCheckbox,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonRow,
  IonText,
  IonToggle,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { useSwiper } from 'swiper/react';
import { updateCurrentUserProfile } from '../hooks/utilities';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';

import './OnboardingCard.css';

const livedExperienceOptions: [string, string][] = [
  ['poc', 'POC'],
  ['spiritual', 'Spiritual'],
  ['neurodivergent', 'Neurodivergent'],
  ['disability', 'Disability'],
  ['chronic_illness', 'Chronic illness'],
  ['sober', 'Sober'],
];

const OnboardingCardLivedExperiences: React.FC = () => {
  const swiper = useSwiper();
  const currentProfile = useGetCurrentProfile().data;
  const [selected, setSelected] = useState<string[]>([]);
  const [showOnProfile, setShowOnProfile] = useState<boolean>(false);

  useEffect(() => {
    if (currentProfile?.lived_experiences) {
      setSelected(currentProfile.lived_experiences);
    }
    setShowOnProfile(Boolean(currentProfile?.settings_show_lived_experiences));
  }, [currentProfile?.lived_experiences, currentProfile?.settings_show_lived_experiences]);

  const toggleExperience = (value: string, checked: boolean) => {
    setSelected((prev) => (
      checked ? (prev.includes(value) ? prev : [...prev, value]) : prev.filter((v) => v !== value)
    ));
  };

  const updateProfile = async () => {
    if (selected.length === 0) return;
    const existingSelected = currentProfile?.lived_experiences ?? [];
    const existingShow = Boolean(currentProfile?.settings_show_lived_experiences);
    const nextSorted = [...selected].sort();
    const existingSorted = [...existingSelected].sort();
    const selectionsUnchanged =
      nextSorted.length === existingSorted.length &&
      nextSorted.every((value, index) => value === existingSorted[index]);
    const showUnchanged = showOnProfile === existingShow;

    if (!selectionsUnchanged || !showUnchanged) {
      await updateCurrentUserProfile({
        lived_experiences: selected,
        settings_show_lived_experiences: showOnProfile,
      });
    }
    swiper.slideNext();
  };

  return (
    <IonCard className="onboarding-slide">
      <IonCardContent className="w-checkboxes">
        <IonCardTitle>Lived experiences</IonCardTitle>
        <IonText>Choose any that apply. These are used for filtering in picks.</IonText>
        <div className="onboarding-option-card">
          <IonList className="scrollable-list onboarding-checkbox-list">
            {livedExperienceOptions.map(([value, label]) => (
              <IonItem key={value}>
                <IonCheckbox
                  slot="start"
                  value={value}
                  checked={selected.includes(value)}
                  onIonChange={(e) => toggleExperience(value, e.detail.checked)}
                />
                {label}
              </IonItem>
            ))}
          </IonList>
          <IonNote className="onboarding-option-note">Scroll for all options!</IonNote>
          <IonText className="onboarding-subtext">
            You can choose to show these on your profile, or keep them just for filtering.
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
          <IonButton onClick={updateProfile} disabled={selected.length === 0}>Next</IonButton>
        </IonRow>
      </IonCardContent>
    </IonCard>
  );
};

export default OnboardingCardLivedExperiences;
