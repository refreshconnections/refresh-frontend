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
import React, { useEffect, useMemo, useState } from 'react';
import { useSwiper } from 'swiper/react';
import { updateCurrentUserProfile } from '../hooks/utilities';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';

import './OnboardingCard.css';

const talkAboutOptions = [
  { value: 'freetime', label: 'Freetime' },
  { value: 'together_idea', label: 'Something we could do together' },
  { value: 'hobby', label: 'Hobbies' },
  { value: 'petpeeve', label: 'Pet peeves' },
  { value: 'talent', label: 'Talents' },
  { value: 'fixation_book', label: 'Current book' },
  { value: 'fixation_tv', label: 'Current TV show' },
  { value: 'fixation_movie', label: 'Current movie' },
  { value: 'fixation_album', label: 'Current album' },
  { value: 'fixation_musicalartist', label: 'Current musical artist' },
  { value: 'fixation_game', label: 'Current game' },
  { value: 'fixation_topic', label: 'Current interest/topic' },
];

const OnboardingCardLetsTalkAbout: React.FC = () => {
  const swiper = useSwiper();
  const [selected, setSelected] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const currentProfile = useGetCurrentProfile().data;

  useEffect(() => {
    if (!currentProfile) return;
    if (selected.length > 0 || Object.keys(values).length > 0) return;
    const existingEntries = talkAboutOptions
      .map((opt) => ({ key: opt.value, value: (currentProfile as any)[opt.value] as string | undefined }))
      .filter((entry) => (entry.value ?? '').trim().length > 0);
    if (existingEntries.length === 0) return;
    const nextSelected = existingEntries.slice(0, 3).map((entry) => entry.key);
    const nextValues = existingEntries.reduce((acc, entry) => {
      acc[entry.key] = entry.value ?? '';
      return acc;
    }, {} as Record<string, string>);
    setSelected(nextSelected);
    setValues(nextValues);
  }, [currentProfile, selected.length, values]);

  const selectedOptions = useMemo(
    () => talkAboutOptions.filter((opt) => selected.includes(opt.value)),
    [selected]
  );

  const hasThreeSelections = selected.length >= 3;
  const filledCount = selectedOptions.filter((opt) => (values[opt.value] ?? '').trim().length > 0).length;
  const canContinue = hasThreeSelections && filledCount >= 3;

  const handleSelectChange = (incoming: string[]) => {
    const next = incoming.slice(0, 3);
    setSelected(next);
  };

  const updateProfile = async () => {
    if (!canContinue) return;
    const payload = selectedOptions.reduce((acc, opt) => {
      acc[opt.value] = (values[opt.value] ?? '').trim();
      return acc;
    }, {} as Record<string, string>);
    await updateCurrentUserProfile(payload);
    swiper.slideNext();
  };

  return (
    <IonCard className="onboarding-slide">
      <IonCardContent className="talkabouts">
        <IonCardTitle>Let’s talk about</IonCardTitle>
        <IonText>Choose three prompts and fill them out so people have easy conversation starters.</IonText>
        <IonItem>
          <IonLabel position="stacked">Choose three topics</IonLabel>
          <IonSelect
            multiple
            value={selected}
            onIonChange={(event) => handleSelectChange(event.detail.value ?? [])}
            placeholder="Pick three"
          >
            {talkAboutOptions.map((option) => (
              <IonSelectOption key={option.value} value={option.value}>
                {option.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        {selectedOptions.map((option) => (
          <IonItem key={option.value}>
            <IonLabel position="stacked">{option.label}</IonLabel>
            <IonInput
              value={values[option.value] ?? ''}
              onIonInput={(event) =>
                setValues((prev) => ({ ...prev, [option.value]: event.detail.value ?? '' }))
              }
              maxlength={90}
              autoCapitalize="sentences"
            />
          </IonItem>
        ))}
      </IonCardContent>
      <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray" onClick={() => swiper.slidePrev()}>
          Back
        </IonButton>
        <IonButton onClick={updateProfile} disabled={!canContinue}>
          Next
        </IonButton>
      </IonRow>
    </IonCard>
  );
};

export default OnboardingCardLetsTalkAbout;
