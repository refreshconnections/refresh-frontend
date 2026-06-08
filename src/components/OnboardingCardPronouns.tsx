import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
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
import BoxedStackedInput from './BoxedStackedInput';
import { PROFILE_FIELD_LIMITS } from '../constants/fieldLimits';

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

  const skipPronouns = async () => {
    const existing = currentProfile?.pronouns ?? '';
    if (existing !== '') {
      await updateCurrentUserProfile({ pronouns: '' });
    }
    swiper.slideNext();
  };

  return (
    <IonCard className="onboarding-v2__card onboarding-v2__card--shallow onboarding-slide">
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
          <BoxedStackedInput
            label={copy.customLabel}
            value={custom}
            name="custom_pronouns"
            placeholder={copy.customPlaceholder}
            maxlength={PROFILE_FIELD_LIMITS.pronouns}
            counter
            onIonInput={(event) => setCustom((event.detail.value ?? '').slice(0, PROFILE_FIELD_LIMITS.pronouns))}
          />
        )}
      </IonCardContent>
      <div className="onboarding-v2__card-footer">
        <IonRow className="onboarding-v2__nav">
          <IonButton fill="outline" onClick={() => swiper.slidePrev()}>
            {ONBOARDING_COPY.common.back}
          </IonButton>
          <IonButton className="onboarding-v2__primary-action" onClick={updateProfile} disabled={!canContinue}>
            {ONBOARDING_COPY.common.next}
          </IonButton>
        </IonRow>
        <IonRow className="onboarding-v2__nav">
          <IonButton fill="clear" size="small" onClick={skipPronouns}>
            {ONBOARDING_COPY.common.skip}
          </IonButton>
        </IonRow>
      </div>
    </IonCard>
  );
};

export default OnboardingCardPronouns;
