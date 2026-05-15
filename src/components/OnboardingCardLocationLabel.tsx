import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonRow,
  IonText,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { useSwiper } from 'swiper/react';
import { updateCurrentUserProfile } from '../hooks/utilities';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { ONBOARDING_COPY } from '../constants/onboarding';
import BoxedStackedInput from './BoxedStackedInput';

import './OnboardingCard.css';

type Props = {
  initialLocation?: string;
  initialLocationIsDraft?: boolean;
};

const OnboardingCardLocationLabel: React.FC<Props> = ({ initialLocation, initialLocationIsDraft = false }) => {
  const copy = ONBOARDING_COPY.cards.locationLabel;
  const swiper = useSwiper();
  const currentProfile = useGetCurrentProfile().data;
  const [location, setLocation] = useState('');
  const [showInput, setShowInput] = useState(false);

  const hasCoords = Boolean(
    currentProfile?.location_point_lat && currentProfile?.location_point_long
  );

  const existingLabel = (currentProfile?.location ?? '').trim();
  const hasExistingLabel = Boolean(existingLabel) && !initialLocationIsDraft;

  useEffect(() => {
    const existingLocation =
      currentProfile?.location ||
      initialLocation ||
      currentProfile?.coordinates_near ||
      '';
    setLocation(existingLocation);
  }, [currentProfile?.location, currentProfile?.coordinates_near, initialLocation]);

  const saveAndContinue = async () => {
    if (!location.trim()) return;
    const existing = currentProfile?.location ?? '';
    if (location.trim() !== existing) {
      await updateCurrentUserProfile({ location: location.trim() });
    }
    swiper.slideNext();
  };

  if (hasExistingLabel && !showInput) {
    return (
      <IonCard className="onboarding-v2__card onboarding-v2__card--shallow onboarding-slide">
        <IonCardContent>
          <IonCardTitle>{copy.title}</IonCardTitle>
          <IonText style={{ whiteSpace: 'pre-line', display: 'block' }}>
            {`You've already set a location label to show on your Profiles. You can keep using this or update it to something different. `}
          </IonText>
          <IonText style={{ fontSize: '1.25rem', display: 'block', fontWeight: 600, textAlign: 'center' }}>
            {existingLabel}
          </IonText>
          <IonButton size="small" fill="outline" style={{ alignSelf: 'center' }} onClick={() => setShowInput(true)}>
            Update my label
          </IonButton>
        </IonCardContent>
        <div className="onboarding-v2__card-footer">
          <IonRow className="onboarding-v2__nav">
            <IonButton fill="outline" onClick={() => swiper.slidePrev()}>
              {ONBOARDING_COPY.common.back}
            </IonButton>
            <IonButton className="onboarding-v2__primary-action" onClick={() => swiper.slideNext()}>
              {ONBOARDING_COPY.common.next}
            </IonButton>
          </IonRow>
        </div>
      </IonCard>
    );
  }

  return (
    <IonCard className="onboarding-v2__card onboarding-v2__card--shallow onboarding-slide">
      <IonCardContent>
        <IonCardTitle>{copy.title}</IonCardTitle>
        <IonText>
          <p style={{ marginBottom: '1rem' }}>
            {hasCoords
              ? copy.withCoords
              : copy.withoutCoords}
          </p>
          <h3 style={{ marginBottom: '1rem' }}>{copy.profileNote}</h3>
          <p>{copy.note}</p>
        </IonText>
        <BoxedStackedInput
          label={copy.label}
          value={location}
          name="location_label"
          placeholder={copy.placeholder}
          autocapitalize="words"
          type="text"
          onIonInput={(event) => setLocation(event.detail.value ?? '')}
        />
      </IonCardContent>
      <div className="onboarding-v2__card-footer">
        <IonRow className="onboarding-v2__nav">
          <IonButton fill="outline" onClick={() => swiper.slidePrev()}>
            {ONBOARDING_COPY.common.back}
          </IonButton>
          <IonButton className="onboarding-v2__primary-action" onClick={saveAndContinue} disabled={!location.trim()}>
            {ONBOARDING_COPY.common.next}
          </IonButton>
        </IonRow>
      </div>
    </IonCard>
  );
};

export default OnboardingCardLocationLabel;
