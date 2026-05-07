import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardSubtitle,
  IonCardTitle,
  IonNote,
  IonRow,
  IonText,
  useIonAlert,
  useIonModal,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { useSwiper } from 'swiper/react';
import { Geolocation } from '@capacitor/geolocation';
import { NativeGeocoder } from '@capgo/nativegeocoder';
import { useQueryClient } from '@tanstack/react-query';
import { updateCurrentUserProfile } from '../hooks/utilities';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { getCurrentPositionSmart } from '../hooks/geolocationUtilities';
import { userQueryKeys } from '../hooks/api/profiles/user-query-keys';
import CitySelectorModal from './CitySelectorModal';
import { ONBOARDING_COPY } from '../constants/onboarding';

import './OnboardingCard.css';

type Props = {
  flow?: 'personal' | 'community';
  preExistingCoords?: boolean;
  hasPersonalProfile?: boolean;
  onCoordsSaved?: (localLabel: string) => void;
  onCoordsCleared?: () => void;
};

const buildLocationLabel = (address?: Record<string, any>, fallback?: string) => {
  const parts = [
    fallback,
    address?.administrativeArea,
    address?.countryName || address?.countryCode,
  ].filter((part, index, arr) => {
    if (!part) return false;
    return arr.indexOf(part) === index;
  });

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return fallback ?? '';
};

const OnboardingCardLocationCoords: React.FC<Props> = ({ flow = 'personal', preExistingCoords = false, hasPersonalProfile = false, onCoordsSaved, onCoordsCleared }) => {
  const copy =
    flow === 'community'
      ? ONBOARDING_COPY.cards.locationCoords.community
      : ONBOARDING_COPY.cards.locationCoords.personal;
  const body =
    flow === 'community' && hasPersonalProfile
      ? ONBOARDING_COPY.cards.locationCoords.community.bodyWithPersonalProfile
      : copy.body;
  const swiper = useSwiper();
  const queryClient = useQueryClient();
  const currentProfile = useGetCurrentProfile().data;
  const [presentAlert] = useIonAlert();
  const [presentConfirm] = useIonAlert();

  const [coordsSet, setCoordsSet] = useState(false);

  useEffect(() => {
    const hasCoords = Boolean(currentProfile?.location_point_lat && currentProfile?.location_point_long);
    setCoordsSet(hasCoords);
  }, [currentProfile?.location, currentProfile?.coordinates_near, currentProfile?.location_point_lat, currentProfile?.location_point_long]);

  type City = { name: string; lat: number; lng: number };

  const [presentCitySelector, dismissCitySelector] = useIonModal(CitySelectorModal, {
    onDismiss: async (selectedCity?: City) => {
      if (selectedCity) {
        await confirmLocationAlert(selectedCity.lat, selectedCity.lng, selectedCity.name);
      }
      dismissCitySelector();
    },
  });

  const openCitySelector = () => {
    presentCitySelector();
  };

  const confirmLocationAlert = async (lat: number, long: number, cityLabel?: string) => {
    const reverseOptions = { latitude: parseFloat(String(lat)), longitude: parseFloat(String(long)) };
    const address = await NativeGeocoder.reverseGeocode(reverseOptions);
    const firstAddress = address?.addresses?.[0];
    const fallbackLabel =
      cityLabel ||
      firstAddress?.locality ||
      `${lat.toFixed(3)}, ${long.toFixed(3)}`;
    const local = cityLabel || buildLocationLabel(firstAddress, fallbackLabel) || fallbackLabel;

    presentConfirm({
      header: `${copy.confirmPrefix}${local}${copy.confirmSuffix}`,
      buttons: [
        { text: copy.confirmCancel, role: 'cancel' },
        {
          text: copy.confirmConfirm,
          handler: async () => {
            await updateCurrentUserProfile({
              location_point_long: long,
              location_point_lat: lat,
              coordinates_near: local,
            });
            await queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
            setCoordsSet(true);
            onCoordsSaved?.(local);
            swiper.slideNext();
          },
        },
      ],
    });
  };

  const showDeniedAlert = () =>
    presentAlert({
      header: copy.deniedHeader,
      subHeader: copy.deniedSubHeader,
      buttons: ['OK'],
    });

  const shareLocation = async () => {
    const permissionsStatus = await Geolocation.checkPermissions();
    if (permissionsStatus.location === 'denied' && permissionsStatus.coarseLocation !== 'granted') {
      await showDeniedAlert();
      return;
    }

    try {
      const coordinates = await getCurrentPositionSmart({
        fastTimeoutMs: 7000,
        preciseTimeoutMs: 25000,
        maximumAgeMs: 60000,
      });

      if (!coordinates) {
        await presentAlert({
          header: copy.gpsErrorHeader,
          message: copy.gpsErrorMessage,
          buttons: ['OK'],
        });
        return;
      }

      await confirmLocationAlert(
        coordinates.coords.latitude,
        coordinates.coords.longitude,
        undefined
      );
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (msg.toLowerCase().includes('permission')) {
        await showDeniedAlert();
      } else {
        await presentAlert({
          header: copy.gpsErrorHeader,
          message: copy.gpsErrorMessage,
          buttons: ['OK'],
        });
      }
    }
  };

  const declineCoordinates = async () => {
    await presentAlert({
      header: copy.declineHeader,
      message: copy.declineMessage,
      buttons: [
        {
          text: copy.declineCancel,
          role: 'cancel',
        },
        {
          text: copy.declineConfirm,
          handler: async () => {
            setCoordsSet(false);
            await updateCurrentUserProfile({
              location_point_lat: null,
              location_point_long: null,
              coordinates_near: null,
            });
            await queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
            onCoordsCleared?.();
            swiper.slideNext();
          },
        },
      ],
    });
  };

  const [showUpdateButtons, setShowUpdateButtons] = useState(false);

  if (preExistingCoords) {
    const coordinatesNear = (currentProfile?.coordinates_near ?? '').trim();
    const coordinatesLabel = currentProfile?.location_point_lat && currentProfile?.location_point_long
      ? `${currentProfile.location_point_lat}, ${currentProfile.location_point_long}`
      : '';
    const existingLabel = coordinatesNear || coordinatesLabel;
    return (
      <IonCard className="onboarding-slide">
        <IonCardContent>
          <IonCardTitle>{copy.title}</IonCardTitle>
          <IonText style={{ whiteSpace: 'pre-line', display: 'block', marginBottom: '12px' }}>
            {flow === 'personal'
              ? 'Your location helps Refresh Connections show you people nearby and helps others understand where you\'re looking to connect.\n\nThis location will be used for filtering on both your Personal and Refreshments Profiles.'
              : 'Your location helps Refresh Connections show you posts and events nearby.\n\nThis location will be used for filtering on both your Personal and Refreshments Profiles.'}
          </IonText>
          {!showUpdateButtons ? (
            <>
              <IonText style={{ whiteSpace: 'pre-line', display: 'block', }}>
                {`You can update your location now or press next to keep using`}
              </IonText>
              <IonText style={{ fontSize: '1.25rem', display: 'block', fontWeight: 600, textAlign: 'center' }}>
                {existingLabel}
              </IonText>
              <IonButton size="small" fill="outline" style={{ alignSelf: 'center' }} onClick={() => setShowUpdateButtons(true)}>
                Update my location
              </IonButton>
            </>
          ) : (
            <IonRow className="onboarding-slide-buttons" style={{ flexDirection: 'column', gap: '12px' }}>
              <IonButton expand="block" onClick={shareLocation}>
                Update via device location
              </IonButton>
              <IonButton expand="block" fill="outline" onClick={openCitySelector}>
                Update by choosing my city
              </IonButton>
            </IonRow>
          )}
          {coordsSet && (
            <IonNote style={{ textAlign: 'center' }}>
              {copy.coordsSaved}
            </IonNote>
          )}
        </IonCardContent>
        <IonRow className="onboarding-slide-buttons">
          <IonButton color="gray" onClick={() => swiper.slidePrev()}>
            {ONBOARDING_COPY.common.back}
          </IonButton>
          <IonButton onClick={() => swiper.slideNext()}>
            {ONBOARDING_COPY.common.next}
          </IonButton>
        </IonRow>
      </IonCard>
    );
  }

  return (
    <IonCard className="onboarding-slide">
      <IonCardContent>
        <IonCardTitle>{copy.title}</IonCardTitle>
        <IonText style={{ whiteSpace: 'pre-line' }}>
          {body}
        </IonText>
        <IonRow className="onboarding-slide-buttons" style={{ flexDirection: 'column', gap: '12px' }}>
          <IonButton expand="block" onClick={shareLocation}>
            {copy.useLocation}
          </IonButton>
          <IonButton expand="block" fill="outline" onClick={openCitySelector}>
            {copy.chooseCity}
          </IonButton>
        </IonRow>
        {coordsSet && (
          <IonNote style={{ textAlign: 'center' }}>
            {copy.coordsSaved}
          </IonNote>
        )}
      </IonCardContent>
      <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray" onClick={() => swiper.slidePrev()}>
          {ONBOARDING_COPY.common.back}
        </IonButton>
        <IonButton onClick={declineCoordinates}>
          {copy.dontShare}
        </IonButton>
      </IonRow>
    </IonCard>
  );
};

export default OnboardingCardLocationCoords;
