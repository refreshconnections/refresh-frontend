import {
  IonButton,
  IonButtons,
  IonCard, IonCardContent, IonCardTitle, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonNote, IonPage, IonRow, IonSelect, IonSelectOption, IonText, IonTitle, IonToolbar, useIonAlert,
  useIonModal,
} from '@ionic/react';
import React, { useState } from 'react'
import { Geolocation } from '@capacitor/geolocation';
import { NativeGeocoder } from '@capgo/nativegeocoder';

import { isMobile, updateCurrentUserProfile  } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useQueryClient } from '@tanstack/react-query';
import CitySelectorModal from './CitySelectorModal';

type Props = {
  onDismiss: () => void;
};


const EditLocationModal: React.FC<Props> = (props) => {

  const [location, setLocation] = useState<string | null>(null);
  const { onDismiss } = props;

  const [presentAlert] = useIonAlert();
  const [presentOtherAlert] = useIonAlert();
  const [presentOptionsAlert] = useIonAlert();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<null | string>(null);

  const [newNear, setNewNear] = useState<string | null>(null);

  // tanstack query
  const currentUserProfile = useGetCurrentProfile().data;
  const queryClient = useQueryClient()

  const isPro = currentUserProfile?.subscription_level === 'pro';
  const isPlus = currentUserProfile?.subscription_level === 'personalplus' || currentUserProfile?.subscription_level === 'communityplus';


  const [presentCitySelector, dismissCitySelector] = useIonModal(CitySelectorModal, {
    onDismiss: async (selectedCity?: {name: string, lat: string, lng: string}) => {
      if (selectedCity) {
        console.log('Selected city:', selectedCity);
        await updateCurrentUserProfile({ 
          coordinates_near: selectedCity.name,
          location_point_lat: selectedCity.lat,
          location_point_long: selectedCity.lng,
        });
        queryClient.invalidateQueries({ queryKey: ['current'] });
      }
      dismissCitySelector();
    }
  });



  const enterLocationAlert = async () => {
    presentAlert({
      header: "Manually input your coordinates",
      buttons: [
        {
          text: "Nevermind ",
          role: 'destructive',
          handler: () => {
            console.log('Cancel clicked');
            // await updateCurrentUserProfile({ location_point_long: null, location_point_lat: null })
          }
        },
        {
          text: 'Enter',
          handler: async (data: any) => {
            console.log('OK clicked: ', data);
            console.log('OK clicked lat: ', data.latitude);
            console.log('OK clicked lat: ', data.longitude);
            await confirmLocationAlert(parseFloat(data.latitude), parseFloat(data.longitude))
          }
        },

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
      header: "Refresh Connections can't access your location because of your settings.",
      subHeader: "Allow the app to see your current location by going to Settings > Refresh > Location.",
      buttons: [
        {
          text: "Go back",
          role: 'ok',
        }
      ],

    })
  }

  const presentCoordOptions = async () => {
    const canChange = isPro || (isPlus && greaterThanXDays(currentUserProfile?.location_last_updated, 1)) || greaterThanXDays(currentUserProfile?.location_last_updated, 30);

    if (!canChange) {
      const lastSaved = localStorage.getItem('lastSavedLocation');
    
      const buttons: any = [];

      if (lastSaved) {
        buttons.push({
          text: 'Restore Last Location',
          handler: async () => {
            const lastSavedRaw = localStorage.getItem('lastSavedLocation');
            if (lastSavedRaw) {
              const lastSaved = JSON.parse(lastSavedRaw);

              setLoading(true);
              await updateCurrentUserProfile({
                coordinates_near: lastSaved.coordinates_near,
                location_point_lat: lastSaved.location_point_lat,
                location_point_long: lastSaved.location_point_long,
              });
              queryClient.invalidateQueries({ queryKey: ['current'] });
              setLoading(false);
              onDismiss();
            }
            else {
            setLoading(false);
            onDismiss();
            }
          }
        });
      }

      buttons.push({
        text: 'OK',
        role: 'cancel'
      });

      presentAlert({
        header: isPlus ? "You can only change your location once a day" : "You can only change your location every 30 days.",
        message: lastSaved
          ? "You can restore your last location instead if you want. Or upgrade to Pro for unlimited location changes."
          : "Upgrade to Pro for unlimited location changes.",
        buttons: buttons
      });

      return;
    }

    presentOptionsAlert({
      header: "How would you like to share your location?",
      subHeader: isPro ? 'As a pro member, you can change your location as much as you want.' : isPlus ? 'As a + member, you can change your location once a day.' : 'You can only change your location every 30 days. Upgrade to a subscription to change your location more often.',
      buttons: [
        {
          text: "Nevermind",
          role: 'destructive',
          handler: async () => {
            console.log('Nevermind');
          }
        },
        {
          text: 'Enter my coordinates manually',
          role: 'ok',
          handler: async () => {
            await enterLocationAlert()
          }
        },
        {
          text: 'Choose my city',
          role: 'ok',
          handler: () => {
            presentCitySelector()
          }
        },
        {
          text: "Use my phone's location (recommended)",
          role: 'ok',
          handler: async () => {
            if (isMobile() && (await Geolocation.checkPermissions())?.location !== 'denied') {
              await shareLocation()
            }
            else {
              deniedAlert()
            }

          }
        },
      ]
    })
  }

  const shareLocation = async () => {
    const permissionsStatus = await Geolocation.checkPermissions()

    console.log("PERM STATUS ", permissionsStatus)

    if (permissionsStatus.location !== 'denied') {
      console.log("perms not denied")

      const coordinates = await Geolocation.getCurrentPosition();

      if (coordinates !== null) {

        // setLat(coordinates.coords.latitude)
        // setLong(coordinates.coords.longitude)

        const reverseOptions = {
          latitude: coordinates.coords.latitude,
          longitude: coordinates.coords.longitude,
        };

        const address = await NativeGeocoder.reverseGeocode(reverseOptions)
        const local = address.addresses[0].locality
        const response = await updateCurrentUserProfile({ coordinates_near: local, location_point_long: coordinates.coords.longitude, location_point_lat: coordinates.coords.latitude })
        queryClient.invalidateQueries({ queryKey: ['current'] })

        onDismiss()

      }
      else {
        presentCoordOptions()
      }

    }
    else {
      presentCoordOptions()
    }
  }

  const confirmLocationAlert = async (lati: number, longi: number) => {


    const reverseOptions = {
      latitude: lati,
      longitude: longi,
    };

    const address = await NativeGeocoder.reverseGeocode(reverseOptions)


    const local = address.addresses[0].locality ? address.addresses[0].locality : "" + lati + ", " + longi


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
          text: 'Yes',
          handler: async () => {
            setLoading(true)
            setNewNear(local)
            await updateCurrentUserProfile({ location_point_long: longi, location_point_lat: lati, coordinates_near: local })
            queryClient.invalidateQueries({ queryKey: ['current'] })
            setLoading(false)
          }
        }

      ],
    })
  }

  const clearLocation = async () => {

    setLoading(true)

    let alertMessage = "";

      if (isPro) {
        alertMessage = "";
      } else if (isPlus) {
        alertMessage = " Choose 'Save and Clear' for the option to restore it later if you change your mind. You can only change your location once a day.";
      } else {
        alertMessage = "Choose 'Save and Clear' for the option to restore it later if you change your mind. You can only change your location every 30 days.";
      }
  

    presentAlert({
      header: "Are you sure you want to clear your location?",
      message: alertMessage,
      buttons: [
        {
          text: 'Just Clear',
          role: 'destructive',
          handler: async () => {
              setTimeout(() => {
                presentAlert({
                  header: "When you clear your location, you will not be able to filter by distance or view local posts.",
                  message: "Type OK to confirm clearing your location.",
                  inputs: [
                    {
                      name: 'confirmation',
                      type: 'text',
                      placeholder: 'Type OK here'
                    }
                  ],
                  buttons: [
                    {
                      text: 'Cancel',
                      role: 'cancel'
                    },
                    {
                      text: 'Confirm',
                      handler: async (data) => {
                        if (data.confirmation?.trim().toUpperCase() === "OK") {
                          setLoading(true);
                          localStorage.removeItem('lastSavedLocation');
                          await updateCurrentUserProfile({ location_point_long: null, location_point_lat: null, coordinates_near: null });
                          queryClient.invalidateQueries({ queryKey: ['current'] });
                          setLoading(false);
                        } else {
                          setTimeout(() => {
                            presentAlert({
                              header: "Incorrect Confirmation",
                              message: "You must type OK exactly to proceed. Try clearing your location again.",
                              buttons: ["OK"]
                            });
                          }, 300); // Delay so the first confirm alert closes before this shows
                        }
                      }
                    }
                  ]
                });
              }, 300); 
            

            
              
          
            }
        },
        {
          text: 'Save and Clear',
          handler: async () => {
            localStorage.setItem('lastSavedLocation', JSON.stringify({
              coordinates_near: currentUserProfile?.coordinates_near ?? null,
              location_point_lat: currentUserProfile?.location_point_lat,
              location_point_long: currentUserProfile?.location_point_long
            }));
            await updateCurrentUserProfile({ location_point_long: null, location_point_lat: null, coordinates_near: null });
            queryClient.invalidateQueries({ queryKey: ['current'] })
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });



    setLoading(false)
  };

  const updateGivenInfo = async () => {


    if (location !== null) {
      setLoading(true)
      //" Only update the location shown on your profile." 
      const response = await updateCurrentUserProfile({ location: location })
      queryClient.invalidateQueries({ queryKey: ['current'] })
      setLoading(false)

    }

  }

  const greaterThanXDays = (changed, numdays) => {
    if (changed == null) return true
    const nowDate = new Date()
    const lastChangedDate = new Date(changed)
    const milliseconds = Math.abs(nowDate.getTime() - lastChangedDate.getTime());
    const days = milliseconds / 86400000

    if (days >= numdays) { return true }
    else { return false }

  }


  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="modal-title">
          <IonTitle>Edit Your Location</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={onDismiss}>Done</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="create-post">
        {loading?
        <div>
          <img alt="Refresh Connections logo spinning" src="../static/img/arrowload.gif"
            style={{
              width: "30%",
              position: "absolute",
              top: "50%",
              zIndex: 9999,
              right: "40%"
            }}>
          </img>
        </div>
        : <></>}
        <IonCard className="onboarding-slide">
          <IonCardContent>
            <IonCardTitle>Want to change your location?</IonCardTitle>

            <IonText>The approximate location description you share on your profile is different from the coordinates Refresh uses to filter by distance.</IonText>

            <IonText><p>The location description shown on your profile:</p></IonText>
            <IonItem>
              <IonInput value={location}
                name="location"
                placeholder={currentUserProfile?.location}
                onIonInput={e => setLocation(e.detail.value!)}
                maxlength={30}
                disabled={currentUserProfile?.location == location}
                type="text" />
            </IonItem>
            <IonButton onClick={updateGivenInfo} disabled={location == null || location == currentUserProfile?.location}> {(location !== null || location !== currentUserProfile?.location) ? "Update" : "Nothing to update"}</IonButton>
            
            
            
            {(currentUserProfile?.location_point_long !== null && currentUserProfile?.location_point_lat !== null) ?

              <IonRow className="with-button" style={{paddingTop: "50pt"}}>
                <IonText><p>The coordinates we use to filter your Picks by distance show that you are near:</p></IonText>

                <IonItem  style={{width: "100%"}}>
                  <IonInput
                    placeholder={currentUserProfile?.coordinates_near}
                    disabled={true}
                    value={currentUserProfile?.coordinates_near ? currentUserProfile?.coordinates_near : (currentUserProfile?.location_point_lat && currentUserProfile?.location_point_long) ? " " + currentUserProfile?.location_point_lat.toFixed(1) + ", " + currentUserProfile?.location_point_long.toFixed(1) : ""}
                  >
                  </IonInput>

                </IonItem>
                <IonButton color="danger" onClick={clearLocation}> Clear location </IonButton>
                <IonButton onClick={presentCoordOptions}>Change</IonButton>
              </IonRow>
              : <IonRow style={{paddingTop: "50pt"}}><IonItem>You haven't shared your location coordinates with us.</IonItem><IonButton style={{width: "100%"}} expand="block" onClick={presentCoordOptions}>Choose how to share</IonButton></IonRow>}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>

  )
};
export default EditLocationModal;