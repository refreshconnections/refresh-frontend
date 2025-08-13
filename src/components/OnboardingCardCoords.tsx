import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonCol, IonGrid, IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonSelect, IonSelectOption, IonText, useIonAlert,
  useIonModal,
} from '@ionic/react';
import React, { useState } from 'react'

import { updateCurrentUserProfile } from '../hooks/utilities';
import { Geolocation } from '@capacitor/geolocation';
import { NativeGeocoder } from '@capgo/nativegeocoder';



import './CantAccessCard.css';
import './OnboardingCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { useSwiper } from 'swiper/react';




const OnboardingCardCoords: React.FC = () => {

  const swiper = useSwiper();

  const [presentAlert] = useIonAlert();
  const [presentOtherAlert] = useIonAlert();

  const enterLocationAlert = async () => {
    presentAlert({
      header: "Go to settings to grant Refresh location access or manually input your coordinates. Or you can choose to use Refresh without sharing your location – but you won't be able to filter based on your location!",
      buttons: [
        {
          text: "Cancel",
          role: 'destructive',
          handler: () => {
            console.log('Cancel clicked');
            // await updateCurrentUserProfile({ location_point_long: null, location_point_lat: null })
          }
        },
        {
          text: 'Select',
          handler: async (data: any) => {
            console.log('OK clicked: ', data);
            console.log('OK clicked lat: ', data.latitude);
            console.log('OK clicked lat: ', data.longitude);


            await confirmLocationAlert(parseFloat(data.latitude), parseFloat(data.longitude))

          }
        }
      ],
      inputs: [
        {
          name: 'latitude',
          type: 'number',
          placeholder: "Latitude",
        },
        {
          name: 'longitude',
          type: 'number',
          placeholder: "Longitude",
        },

      ],
    })
  }

  const deniedAlert = async () => {
    presentAlert({
      header: "You denied to share your location. You can either manually enter your coordinates or continue without sharing your location at all. You will be able to add your location later if you want to.",
      buttons: [
        {
          text: "Continue without location",
          role: 'destructive',
          handler: () => {
            console.log('Cancel clicked');
            swiper.slideNext()
            // await updateCurrentUserProfile({ location_point_long: null, location_point_lat: null })
          }
        },
        {
          text: 'Select',
          handler: async (data: any) => {
            console.log('OK clicked: ', data);
            console.log('OK clicked lat: ', data.latitude);
            console.log('OK clicked lat: ', data.longitude);


            await confirmLocationAlert(parseFloat(data.latitude), parseFloat(data.longitude))

          }
        }
      ],
      inputs: [
        {
          name: 'latitude',
          type: 'number',
          placeholder: "Latitude",
        },
        {
          name: 'longitude',
          type: 'number',
          placeholder: "Longitude",
        },

      ],
    })
  }

  const confirmLocationAlert = async (lat: number, long: number) => {


    const reverseOptions = {
      latitude: lat,
      longitude: long,
    };

    const address = await NativeGeocoder.reverseGeocode(reverseOptions)


    const local = address.addresses[0].locality


    presentOtherAlert({
      header: "So just confirming, you're near " + local + "?",
      buttons: [
        {
          text: "Nope, I'll try again.",
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Yep',
          handler: async () => {
            const response = await updateCurrentUserProfile({ location_point_long: long, location_point_lat: lat })


            swiper.slideNext()
          }
        }

      ],
    })
  }


  const updateProfile = async (e: any) => {

    enterLocationAlert()

  }

  const shareLocation = async (e: any) => {
    const permissionsStatus = await Geolocation.checkPermissions()

    console.log("PERM STATUS ", permissionsStatus)

    if (permissionsStatus.location !== 'denied') {
      console.log("perms not denied")

      const coordinates = await Geolocation.getCurrentPosition();

      if (coordinates !== null) {
        const response = await updateCurrentUserProfile({ location_point_long: coordinates.coords.longitude, location_point_lat: coordinates.coords.latitude })
        const reverseOptions = {
          latitude: coordinates.coords.latitude,
          longitude: coordinates.coords.longitude,
        };
    
        const address = await NativeGeocoder.reverseGeocode(reverseOptions)
        const local = address.addresses[0].locality
        const response2 = await updateCurrentUserProfile({ coordinates_near: local })

        swiper.slideNext()
      }
      else {
        deniedAlert()
      }

    }
    else {
      deniedAlert()
    }



    // printCurrentPosition()


    // swiper.slideNext()





  }

  // const [stayPausedOpen, stayPausedDismiss] = useIonModal(StayPausedModal, {
  //   onDismiss: () => stayPausedDismiss(),
  // });

  return (
    <>
    <IonCard className="onboarding-slide">
      <IonCardContent>
        <IonCardTitle>Where do you live?</IonCardTitle>

        <IonText>We won't reveal your specific location to anyone, but Refresh needs to know where you are to show your profile to potential connections nearby.
        </IonText>


      </IonCardContent>
      <IonRow className="onboarding-slide-buttons">
        <IonButton style={{ visibility: "hidden" }}></IonButton>
        <IonButton fill="outline" onClick={() => swiper.slideNext()}>Don't Share</IonButton>
      </IonRow>
      <IonRow className="onboarding-slide-buttons">
        <IonButton style={{ visibility: "hidden" }}></IonButton>
        <IonButton fill="outline" onClick={updateProfile}>Enter Manually</IonButton>
      </IonRow>
      <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray" onClick={() => swiper.slidePrev()}>Back</IonButton>

        <IonButton onClick={shareLocation}>Share Location</IonButton>
      </IonRow>
    </IonCard>
    {/* <IonRow class="notyet">
    <IonButton fill="clear" onClick={() => stayPausedOpen()}>I don't want to create a profile yet.</IonButton>
  </IonRow> */}
  </>
  )
};
export default OnboardingCardCoords;