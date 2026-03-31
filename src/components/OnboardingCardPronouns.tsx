import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonInput,
  IonItem,
  IonLabel,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonText,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { useSwiper } from 'swiper/react';
import { updateCurrentUserProfile } from '../hooks/utilities';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { ONBOARDING_COPY } from '../constants/onboarding';

import './OnboardingCard.css';

const pronounOptions = ONBOARDING_COPY.cards.pronouns.options;

const OnboardingCardPronouns: React.FC = () => {
  const copy = ONBOARDING_COPY.cards.pronouns;
  const swiper = useSwiper();
  const currentProfile = useGetCurrentProfile().data;
  const [selected, setSelected] = useState<string>('');
  const [custom, setCustom] = useState<string>('');

  useEffect(() => {
    if (!currentProfile?.pronouns) return;
    const match = pronounOptions.find((option) => option.value === currentProfile.pronouns);
    if (match) {
      setSelected(match.value);
      setCustom('');
    } else if (currentProfile.pronouns) {
      setSelected('custom');
      setCustom(currentProfile.pronouns);
    }
  }, [currentProfile?.pronouns]);

  const resolvedPronouns =
    selected === 'custom' ? custom.trim() : selected === 'Prefer not to say' ? '' : selected;
  const canContinue = selected.length > 0 && (selected !== 'custom' || custom.trim().length > 0);

  const updateProfile = async () => {
    if (!canContinue) return;
    const existing = currentProfile?.pronouns ?? '';
    if (resolvedPronouns !== existing) {
      await updateCurrentUserProfile({ pronouns: resolvedPronouns });
    }
    swiper.slideNext();
  };

  return (
    <IonCard className="onboarding-slide">
      <IonCardContent>
        <IonCardTitle>{copy.title}</IonCardTitle>
        <IonText>{copy.body}</IonText>
        <IonItem>
          <IonLabel position="stacked">{copy.label}</IonLabel>
          <IonSelect
            value={selected}
            placeholder={copy.placeholder}
            onIonChange={(event) => {
              const value = event.detail.value as string;
              setSelected(value);
              if (value !== 'custom') {
                setCustom('');
              }
            }}
          >
            {pronounOptions.map((option) => (
              <IonSelectOption key={option.value} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        {selected === 'custom' && (
          <IonItem>
            <IonLabel position="stacked">{copy.customLabel}</IonLabel>
            <IonInput
              value={custom}
              placeholder={copy.customPlaceholder}
              maxlength={30}
              onIonInput={(event) => setCustom(event.detail.value ?? '')}
              onKeyUp={(event) => {
                if (event.key === 'Enter' && canContinue) {
                  updateProfile();
                }
              }}
            />
          </IonItem>
        )}
      </IonCardContent>
      <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray" onClick={() => swiper.slidePrev()}>
          {ONBOARDING_COPY.common.back}
        </IonButton>
        <IonButton onClick={updateProfile} disabled={!canContinue}>
          {ONBOARDING_COPY.common.next}
        </IonButton>
      </IonRow>
    </IonCard>
  );
};

export default OnboardingCardPronouns;
