import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonCheckbox,
  IonInput,
  IonItem,
  IonIcon,
  IonLabel,
  IonList,
  IonRow,
  IonText,
  IonContent,
  useIonPopover,
} from '@ionic/react';
import React, { useEffect, useMemo, useState } from 'react';
import { useSwiper } from 'swiper/react';
import { chevronDownOutline } from 'ionicons/icons';
import { updateCurrentUserProfile } from '../hooks/utilities';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { ONBOARDING_COPY } from '../constants/onboarding';

import './OnboardingCard.css';

const talkAboutOptions = ONBOARDING_COPY.cards.letsTalkAbout.options;

type OnboardingCardLetsTalkAboutProps = {
  onBeforeNext?: () => Promise<void>;
};

const OnboardingCardLetsTalkAbout: React.FC<OnboardingCardLetsTalkAboutProps> = ({ onBeforeNext }) => {
  const copy = ONBOARDING_COPY.cards.letsTalkAbout;
  const swiper = useSwiper();
  const [selected, setSelected] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const currentProfile = useGetCurrentProfile().data;

  const TopicsPopover: React.FC<{
    selected: string[];
    onToggle: (value: string) => void;
  }> = ({ selected, onToggle }) => (
    <IonContent className="ion-padding">
      <IonList className="talkabout-popover-list">
        {talkAboutOptions.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <IonItem
              key={option.value}
              button
              detail={false}
              onClick={() => onToggle(option.value)}
            >
              <IonCheckbox slot="start" checked={isSelected} />
              <IonLabel>{option.label}</IonLabel>
            </IonItem>
          );
        })}
      </IonList>
    </IonContent>
  );

  const [presentTopicsPopover, dismissTopicsPopover] = useIonPopover(TopicsPopover, {
    selected,
    onToggle: (value: string) => {
      handleTopicToggle(value);
    },
    onDismiss: () => dismissTopicsPopover(),
  });

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

  const selectedSummary = useMemo(() => {
    if (selectedOptions.length === 0) return '';
    const text = selectedOptions.map((opt) => opt.label).join(', ');
    const maxLen = 44;
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen - 1).trimEnd()}…`;
  }, [selectedOptions]);

  const hasThreeSelections = selected.length >= 3;
  const filledCount = selectedOptions.filter((opt) => (values[opt.value] ?? '').trim().length > 0).length;
  const canContinue = hasThreeSelections && filledCount >= 3;

  const handleTopicToggle = (value: string) => {
    setSelected((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      if (prev.length < 3) return [...prev, value];
      const [oldest, ...rest] = prev;
      return [...rest, value];
    });
  };

  const updateProfile = async () => {
    if (!canContinue) return;
    const payload = selectedOptions.reduce((acc, opt) => {
      acc[opt.value] = (values[opt.value] ?? '').trim();
      return acc;
    }, {} as Record<string, string>);
    await updateCurrentUserProfile(payload);
    if (onBeforeNext) {
      await onBeforeNext();
    }
    swiper.slideNext();
  };

  return (
    <IonCard className="onboarding-slide">
      <IonCardContent className="talkabouts">
        <IonCardTitle>{copy.title}</IonCardTitle>
        <IonText>{copy.body}</IonText>
        <IonItem
          className="talkabout-select-item"
          button
          detail={false}
          onClick={(event) =>
            presentTopicsPopover({ event: event.nativeEvent as Event })
          }
        >
          <IonLabel position="stacked">{copy.chooseTopics}</IonLabel>
          <IonText className="talkabout-summary">
            {selectedSummary || copy.pickThree}
          </IonText>
          <IonIcon slot="end" icon={chevronDownOutline} />
        </IonItem>

        <div className="talkabout-selections">
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
        </div>
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

export default OnboardingCardLetsTalkAbout;
