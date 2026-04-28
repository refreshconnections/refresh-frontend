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
  IonContent,
  useIonPopover,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { useSwiper } from 'swiper/react';
import { updateCurrentUserProfile } from '../hooks/utilities';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { ONBOARDING_COPY } from '../constants/onboarding';

import './OnboardingCard.css';

const livedExperienceOptions: [string, string][] = ONBOARDING_COPY.cards.livedExperiences.options;
const livedExperiencePopoverText = ONBOARDING_COPY.cards.livedExperiences.popover;

const OnboardingCardLivedExperiences: React.FC = () => {
  const copy = ONBOARDING_COPY.cards.livedExperiences;
  const swiper = useSwiper();
  const currentProfile = useGetCurrentProfile().data;
  const [selected, setSelected] = useState<string[]>([]);
  const [showOnProfile, setShowOnProfile] = useState<boolean>(false);
  const Popover = () => (
    <IonContent className="ion-padding no-scroll">{livedExperiencePopoverText}</IonContent>
  );
  const [presentPopover, dismissPopover] = useIonPopover(Popover, {
    onDismiss: () => dismissPopover(),
  });


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
    <IonCard className="onboarding-v2__card onboarding-v2__card--shallow onboarding-slide">
      <IonCardContent className="w-checkboxes">
        <IonCardTitle className="onboarding-title-row">
          <span>{copy.title}</span>
          <IonButton
            fill="clear"
            size="small"
            className="onboarding-asterisk"
            onClick={(event) => {
              event.stopPropagation();
              presentPopover({ event: event.nativeEvent as Event });
            }}
          >
            *
          </IonButton>
        </IonCardTitle>
        <IonText>{copy.body}</IonText>
        <IonText className="onboarding-future-filters">
          {livedExperiencePopoverText}
        </IonText>
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
          <IonNote className="onboarding-option-note">{copy.scrollNote}</IonNote>
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
          <IonButton className="onboarding-v2__primary-action" onClick={updateProfile}>{ONBOARDING_COPY.common.next}</IonButton>
        </IonRow>
      </div>
    </IonCard>
  );
};

export default OnboardingCardLivedExperiences;
