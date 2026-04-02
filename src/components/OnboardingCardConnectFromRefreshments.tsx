import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonRow,
  IonToggle,
} from '@ionic/react';
import React from 'react';
import { useSwiper } from 'swiper/react';
import { useQueryClient } from '@tanstack/react-query';

import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { updateCurrentUserProfile } from '../hooks/utilities';
import { ONBOARDING_COPY } from '../constants/onboarding';

import './OnboardingCard.css';

const OnboardingCardConnectFromRefreshments: React.FC = () => {
  const swiper = useSwiper();
  const queryClient = useQueryClient();
  const currentProfile = useGetCurrentProfile().data;
  const copy = ONBOARDING_COPY.communityOnboarding.connect;

  const handleToggleConnect = async (checked: boolean) => {
    await updateCurrentUserProfile({ settings_community_profile: checked });
    await queryClient.invalidateQueries({ queryKey: ['current'] });
    await queryClient.invalidateQueries({ queryKey: ['global-current'] });
  };

  return (
    <div className="onboarding-v2__slide">
      <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
        <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
          <IonCardTitle>{copy.title}</IonCardTitle>
          <p>{copy.body}</p>
          <IonItem lines="none" color="white">
            <IonLabel>{copy.toggleLabel}</IonLabel>
            <IonToggle
              slot="end"
              checked={Boolean(currentProfile?.settings_community_profile)}
              onIonChange={(e) => handleToggleConnect(e.detail.checked)}
            />
          </IonItem>
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
    </div>
  );
};

export default OnboardingCardConnectFromRefreshments;
