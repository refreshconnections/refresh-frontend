import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonRow,
  IonText,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { useSwiper } from 'swiper/react';
import { updateCurrentUserProfile } from '../hooks/utilities';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';

import './OnboardingCard.css';

const OnboardingCardLocationLabel: React.FC = () => {
  const swiper = useSwiper();
  const currentProfile = useGetCurrentProfile().data;
  const [location, setLocation] = useState('');

  const hasCoords = Boolean(
    currentProfile?.location_point_lat && currentProfile?.location_point_long
  );

  useEffect(() => {
    const existingLocation =
      currentProfile?.location ||
      currentProfile?.coordinates_near ||
      '';
    setLocation(existingLocation);
  }, [currentProfile?.location, currentProfile?.coordinates_near]);

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
        <IonCardTitle>Location shown on your profile</IonCardTitle>
        <IonText>
          {hasCoords
            ? "We’ll use your location to show nearby matches. This is the location label other members will see."
            : "You chose not to share your location with the app, but you can still add a location label to your profile for other members to see."}
        </IonText>
        <IonItem>
          <IonLabel position="stacked">Location label</IonLabel>
          <IonInput
            value={location}
            placeholder="City, region, or neighborhood"
            autoCapitalize="words"
            maxlength={40}
            onIonInput={(event) => setLocation(event.detail.value ?? '')}
          />
        </IonItem>
        <IonNote>
          You can keep this broad (like a state or country even) or more specific (like your city) - but never share your exact address!
        </IonNote>
      </IonCardContent>
      <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray" onClick={() => swiper.slidePrev()}>
          Back
        </IonButton>
        <IonButton onClick={saveAndContinue} disabled={!location.trim()}>
          Next
        </IonButton>
      </IonRow>
    </IonCard>
  );
};

export default OnboardingCardLocationLabel;
