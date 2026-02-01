import {
  IonButton,
  IonCard,
  IonCardContent,
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
import { updateCurrentUserProfile } from '../hooks/utilities';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { getCurrentPositionSmart } from '../hooks/geolocationUtilities';
import CitySelectorModal from './CitySelectorModal';

import './OnboardingCard.css';

const OnboardingCardLocationCoords: React.FC = () => {
  const swiper = useSwiper();
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
        await confirmLocationAlert(selectedCity.lat, selectedCity.lng, selectedCity.name, true);
      }
      dismissCitySelector();
    },
  });

  const openCitySelector = () => {
    presentCitySelector();
  };

  const confirmLocationAlert = async (
    lat: number,
    long: number,
    cityLabel?: string,
    advanceOnConfirm?: boolean
  ) => {
    const reverseOptions = { latitude: lat, longitude: long };
    const address = await NativeGeocoder.reverseGeocode(reverseOptions);
    const local =
      cityLabel ||
      address?.addresses?.[0]?.locality ||
      `${lat.toFixed(3)}, ${long.toFixed(3)}`;

    presentConfirm({
      header: `So just confirming, you're near ${local}?`,
      buttons: [
        { text: "Nope, I'll try again.", role: 'cancel' },
        {
          text: 'Yep',
          handler: async () => {
            await updateCurrentUserProfile({
              location_point_long: long,
              location_point_lat: lat,
              coordinates_near: local,
            });
            setCoordsSet(true);
            if (advanceOnConfirm) {
              swiper.slideNext();
            }
          },
        },
      ],
    });
  };

  const shareLocation = async () => {
    const permissionsStatus = await Geolocation.checkPermissions();
    if (permissionsStatus.location === 'denied') {
      await presentAlert({
        header: "Location access isn't enabled.",
        message: 'You can enable location access, choose your city, or continue without sharing.',
        buttons: ['OK'],
      });
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
          header: "We couldn't get your GPS coordinates.",
          message: 'Try again, choose your city, or continue without sharing.',
          buttons: ['OK'],
        });
        return;
      }

      await confirmLocationAlert(
        coordinates.coords.latitude,
        coordinates.coords.longitude,
        undefined,
        true
      );
    } catch (err) {
      await presentAlert({
        header: "We couldn't get your GPS coordinates.",
        message: 'Try again, choose your city, or continue without sharing.',
        buttons: ['OK'],
      });
    }
  };

  const declineCoordinates = async () => {
    setCoordsSet(false);
    await presentAlert({
      header: "Distance filters won’t work without coordinates",
      message: "You can still use Refresh, but you won’t be able to filter your picks by distance.",
      buttons: [
        {
          text: 'Go back',
          role: 'cancel',
        },
        {
          text: 'OK',
          handler: () => {
            swiper.slideNext();
          },
        },
      ],
    });
  };

  return (
    <IonCard className="onboarding-slide">
      <IonCardContent>
        <IonCardTitle>Where do you live?</IonCardTitle>
        <IonText>
          Refresh uses your coordinates to show nearby matches. Your profile shows a location label,
          and you control how specific it is.
        </IonText>
        <IonRow className="onboarding-slide-buttons" style={{ flexDirection: 'column', gap: '12px' }}>
          <IonButton expand="block" onClick={shareLocation}>
            Use my location
          </IonButton>
          <IonButton expand="block" fill="outline" onClick={openCitySelector}>
            Choose my city
          </IonButton>
        </IonRow>
        {coordsSet && (
          <IonNote style={{ textAlign: 'center' }}>
            Coordinates saved. You can edit your location label on the next step.
          </IonNote>
        )}
      </IonCardContent>
      <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray" onClick={() => swiper.slidePrev()}>
          Back
        </IonButton>
        <IonButton onClick={declineCoordinates}>
          Don’t share my location
        </IonButton>
      </IonRow>
    </IonCard>
  );
};

export default OnboardingCardLocationCoords;
