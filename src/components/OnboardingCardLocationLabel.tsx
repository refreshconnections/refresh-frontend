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
};

const OnboardingCardLocationLabel: React.FC<Props> = ({ initialLocation }) => {
  const copy = ONBOARDING_COPY.cards.locationLabel;
  const swiper = useSwiper();
  const currentProfile = useGetCurrentProfile().data;
  const [location, setLocation] = useState('');

  const hasCoords = Boolean(
    currentProfile?.location_point_lat && currentProfile?.location_point_long
  );

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
