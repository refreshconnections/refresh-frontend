import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonInput,
  IonItem,
  IonLabel,
  IonRow,
  IonText,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { useSwiper } from 'swiper/react';
import { updateCurrentUserProfile } from '../hooks/utilities';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { ONBOARDING_COPY } from '../constants/onboarding';

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
    <IonCard className="onboarding-slide">
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
        <IonItem>
          <IonLabel position="stacked">{copy.label}</IonLabel>
          <IonInput
            value={location}
            placeholder={copy.placeholder}
            autoCapitalize="words"
            maxlength={40}
            onIonInput={(event) => setLocation(event.detail.value ?? '')}
          />
        </IonItem>
      </IonCardContent>
      <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray" onClick={() => swiper.slidePrev()}>
          {ONBOARDING_COPY.common.back}
        </IonButton>
        <IonButton onClick={saveAndContinue} disabled={!location.trim()}>
          {ONBOARDING_COPY.common.next}
        </IonButton>
      </IonRow>
    </IonCard>
  );
};

export default OnboardingCardLocationLabel;
