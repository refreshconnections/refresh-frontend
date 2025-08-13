import React, { createRef, useEffect, useRef, useState } from "react";
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonItem, IonRow, IonButtons, IonNote, IonList, IonFooter, IonIcon, IonTextarea, IonCol, IonItemSliding, IonItemOptions, IonItemOption, useIonModal, IonLabel, IonInput, IonSegment, IonSegmentButton, IonCheckbox, IonGrid, IonAccordionGroup, IonAccordion, IonRadioGroup, IonRadio, IonText, useIonAlert, IonToast, IonBadge, IonCard, IonCardTitle, IonToggle, IonRange } from '@ionic/react';
import { addSavedLocation, deleteSavedLocation, isCommunityPlus, isPro } from '../hooks/utilities';


import './AdvancedFilterModal.css'
import './RefreshmentsFilters.css'

import { useGetCurrentProfile } from "../hooks/api/profiles/current-profile";

import { Preferences } from "@capacitor/preferences";
import { useGetCurrentStreak } from "../hooks/api/profiles/current-streak";
import { faLocationDot, faLocationPin, faStar, faTrash } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGetSavedLocations } from "../hooks/api/profiles/saved-locations";
import { useQueryClient } from "@tanstack/react-query";
import CitySelectorModal from "./CitySelectorModal";
import EditLocationModal from "./EditLocationModal";


type Props = {
  barsProp: string,
  radiusProp: number | null
  localProp: boolean,
  sortProp: string,
  onDismiss: (bars: string, localPosts: boolean, radius: number | null, sortSelected: string) => void;
};

const RefreshmentsFiltersModal: React.FC<Props> = (props) => {
  const { onDismiss, barsProp, localProp, radiusProp, sortProp } = props;

  const queryClient = useQueryClient()

  // tanstack query
  const currentUserProfile = useGetCurrentProfile().data;

  const { data: savedLocations, isLoading: savedLocationsLoading } = useGetSavedLocations(isCommunityPlus(currentUserProfile?.subscription_level));

  const canSeeLocal = !!(localProp && currentUserProfile?.location_point_lat && currentUserProfile?.location_point_long);



  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [sortSelected, setSortSelected] = useState<string>(sortProp);

  const [radius, setRadius] = useState<number>(radiusProp ?? 150);
  const [localPosts, setLocalPosts] = useState<boolean>(canSeeLocal);


  const [presentRadiusAlert] = useIonAlert();

const hasSetLocalPostsEverywhere = useRef(false);

const [localPostsEverywhere, setLocalPostsEverywhereRaw] = useState<boolean>(false);

const setLocalPostsEverywhere = (val: boolean) => {
  hasSetLocalPostsEverywhere.current = true;
  setLocalPostsEverywhereRaw(val);
};

useEffect(() => {
  if (!currentUserProfile) return; // Wait for profile to load
  if (hasSetLocalPostsEverywhere.current) return;

  if (isPro(currentUserProfile.subscription_level) && radius && radius > 5000) {
    setLocalPostsEverywhereRaw(true);
  }
}, [currentUserProfile, radius]);


  const options = [
    { label: "Refreshments", value: "refreshments" },
    { label: "Mingle", value: "mingle" },
    { label: "Long Covid", value: "longcovid" },
    { label: "STEAM", value: "science" },
    { label: "Families", value: "families" },
    { label: "Change", value: "change" },
    { label: "Pop", value: "pop" },
    { label: "Newcomers", value: "newcomers" },
  ];

  // const popOptions = [
  //   { label: "book", value: "book" },
  // ]

  const localOptions = [
    { label: "Housing", value: "housing" },
    { label: "Events", value: "events" },
    { label: "Recommendations", value: "recommendations" },
  ]

  const allValues = options.map((opt) => opt.value);
  const allValuesLocal = localOptions.map((opt) => opt.value);


  const sortOptions = [
    { label: "Most recent", value: "recent" },
    { label: "Most recent post or comment", value: "comment" },
    { label: "Most liked", value: "liked" },
  ]

  const allSortValues = sortOptions.map((opt) => opt.value);


  useEffect(() => {


    let allValuesOptionalLocal = allValues

    if (localPosts) {
      allValuesOptionalLocal = allValues.concat(allValuesLocal)
    }



    if (barsProp == 'all') {
      setSelectedValues(allValuesOptionalLocal)
    }
    else {
      setSelectedValues(barsProp.split(','))
    }


  }, [])

  useEffect(() => {
    if (!localProp && localPosts) {
      const existingValues = barsProp === 'all' ? allValues : barsProp.split(',');

      // Filter out values from allValuesLocal that already exist in existingValues
      const uniqueLocalValues = allValuesLocal.filter(
        val => !existingValues.includes(val)
      );

      // Merge without duplicates
      setSelectedValues(existingValues.concat(uniqueLocalValues));
    }
  }, [localPosts]);

  useEffect(() => {
    if (localPostsEverywhere) {
      setRadius(5001)
    }
  }, [localPostsEverywhere]);

  useEffect(() => {
    let max = isPro(currentUserProfile?.subscription_level) ? 5001 : isCommunityPlus(currentUserProfile?.subscription_level) ? 5000 : 150
    if (radius < 10) {
      setRadius(10)
    }
    else if (radius > max) {
      setRadius(max)
    }
  }, [radius]);



  const handleCheckboxChange = (value: string, checked: boolean) => {
    setSelectedValues((prev) => {
      if (checked) {
        return prev.includes(value) ? prev : [...prev, value];
      } else {
        return prev.filter((item) => item !== value);
      }
    });
  };

  const handleAddSavedLocation = async (selectedCity) => {
    await addSavedLocation(selectedCity)
    queryClient.invalidateQueries({ queryKey: ['saved-locations'] });
  }

  const handleDeleteLocation = async (selectedCity) => {
    await deleteSavedLocation(selectedCity)
    queryClient.invalidateQueries({ queryKey: ['saved-locations'] });
  }


  const handleDone = async () => {

    const selectedString = selectedValues.join(',');
    console.log(selectedValues.length)

    if (radius) {
      await Preferences.set({ key: "radius", value: radius.toString() });
    }

    if (localPosts) {
      await Preferences.set({ key: "local", value: 'on' });
    }
    else {
      await Preferences.set({ key: "local", value: 'off' });
    }

    let numberOfAll = options.length
    if (localPosts) { numberOfAll = options.length + localOptions.length }


    if (selectedValues.length >= numberOfAll) {
      await Preferences.set({ key: "filters", value: 'all' });
      onDismiss('all', localPosts, radius, sortSelected)

    }
    else {
      await Preferences.set({ key: "filters", value: selectedString });
      onDismiss(selectedString, localPosts, radius, sortSelected)
    }

    if (sortSelected) {
      await Preferences.set({ key: "sort", value: sortSelected });
    }


  }

  const [presentCitySelector, dismissCitySelector] = useIonModal(CitySelectorModal, {
    onDismiss: async (selectedCity?: { name: string, lat: number, lng: number }) => {
      dismissCitySelector();
      if (selectedCity) {
        await handleAddSavedLocation({ coordinates_near: selectedCity.name, location_point_lat: selectedCity.lat, location_point_long: selectedCity.lng });
      }
    }
  });

  const handleRangeChange = (event: CustomEvent) => {
    setRadius(event.detail.value);
  };

  const whatDistanceRadius = async () => {
    presentRadiusAlert({
      header: 'What is the farthest away Local posts that you want to see should be?',
      subHeader: '(in kilometers)',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Select',
          handler: async (data: any) => {
            if (data?.distance !== null) {
              console.log('OK clicked: ', data.distance);
              setRadius(data?.distance)
            }

          }
        }
      ],
      inputs: [
        {
          name: 'distance',
          type: 'number',
          placeholder: `${radius} km`

        }
      ],

    })
  }

  const handleLocationDismiss = async () => {
    locationDismiss();
    setLocalPosts(true)
  }

  const [locationPresent, locationDismiss] = useIonModal(EditLocationModal, {
    onDismiss: handleLocationDismiss
  });

  return (
    <IonPage >
      <IonHeader>
        <IonToolbar className="modal-title">
          <IonTitle>Filters</IonTitle>
          <IonButtons slot="start" color="secondary">
            <IonButton onClick={handleDone}>Done</IonButton>
          </IonButtons>

        </IonToolbar>
      </IonHeader>
      <IonContent className="adv-filters">

        <IonItem lines="none">
          <IonLabel className="ion-text-wrap">
            <span style={{ fontSize: "17px" }}>Local posts</span>
          </IonLabel>
          <IonToggle
            onIonChange={async e => setLocalPosts(e.detail.checked)}
            checked={localPosts}
            disabled={(!currentUserProfile?.location_point_lat || !currentUserProfile?.location_point_long)}
          >
          </IonToggle>

        </IonItem>
        {(!currentUserProfile?.location_point_lat || !currentUserProfile?.location_point_long) && (
          <IonRow className="ion-padding ion-text-center ion-justify-content-center">
            <IonNote>Share your Location to turn on local posts.</IonNote>
            <IonButton onClick={() => locationPresent()}>Share location</IonButton>
          </IonRow>)}
        {(localPosts && currentUserProfile?.location_point_lat && currentUserProfile?.location_point_long) &&
          // <IonGrid style={{paddingLeft: "40pt", paddingRight: "40pt"}}>

          <>
            {isPro(currentUserProfile?.subscription_level) &&
              <IonItem lines="none">
                <IonLabel className="ion-text-wrap">
                  <span style={{ fontSize: "17px" }}>Show local posts from everywhere</span>
                </IonLabel>
                <IonToggle
                  onIonChange={async e => setLocalPostsEverywhereRaw(e.detail.checked)}
                  checked={localPostsEverywhere}
                >
                </IonToggle>
              </IonItem>
            }

            {(!localPostsEverywhere) &&
              <IonCard color="white" className="distance-radius">
                <IonRow className="ion-justify-content-center" style={{ paddingTop: "20pt" }}>
                  <IonNote color="black">Distance Radius (km)</IonNote>
                </IonRow>

                <IonItem color="white" lines="none">
                  <IonRange step={1} pin value={radius ?? 50} dualKnobs={false} onIonChange={handleRangeChange} min={10} max={isCommunityPlus(currentUserProfile?.subscription_level) ? 5000 : 150} >
                    <IonText slot="start">10</IonText>
                    <IonText slot="end">{isCommunityPlus(currentUserProfile?.subscription_level) ? 5000 : 150}</IonText>
                  </IonRange>
                </IonItem>
                {radius &&
                  <IonRow className="ion-padding ion-justify-content-center">
                    <IonNote onClick={whatDistanceRadius} color="navy"> <u>{radius}</u> kilometers ≅ {(radius / 1.609344).toFixed(1)} miles</IonNote>
                  </IonRow>
                }
                <IonRow className="ion-padding">
                  <IonNote> Local posts will also be filtered using your category selections.</IonNote>
                </IonRow>
                {isCommunityPlus(currentUserProfile?.subscription_level) &&
                  <IonCard color="midblue" className="distance-radius">
                    <IonItem color="midblue" lines="none">
                      <IonLabel>
                        <p style={{ fontSize: "11pt", fontWeight: "bold" }}>
                          •&nbsp;{currentUserProfile?.coordinates_near
                            ?? `Coordinates: ${currentUserProfile?.location_point_lat?.toFixed(1)}, ${currentUserProfile?.location_point_long?.toFixed(1)}`}</p>
                      </IonLabel><FontAwesomeIcon icon={faLocationDot} />
                    </IonItem>

                    {savedLocations?.length > 0 ? (
                      savedLocations?.map((location) => (
                        <IonItem color="midblue" lines="none" key={location.id}>
                          <IonLabel><p style={{ fontSize: "11pt" }}>
                            •&nbsp;{location.coordinates_near
                              ?? `${location?.location_point_lat?.toFixed(1)}, ${location?.location_point_long?.toFixed(1)}`}</p>
                          </IonLabel>
                          <IonButton
                            color="danger"
                            size="small"
                            onClick={() => handleDeleteLocation(location?.id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </IonButton>
                        </IonItem>
                      ))
                    ) : (
                      <IonItem color="midblue">
                        <IonLabel>No additional locations saved yet.</IonLabel>
                      </IonItem>
                    )}

                    {/* Add Location Button */}

                    {((isPro(currentUserProfile?.subscription_level) && savedLocations?.length < 4) || (isCommunityPlus(currentUserProfile?.subscription_level) && savedLocations?.length < 2)) && (
                      <IonRow style={{ width: "100%" }} className="ion-justify-content-center">
                        <IonButton
                          expand="block"
                          size="small"
                          className="ion-margin-top"
                          onClick={() => presentCitySelector()}
                        >
                          Add Another Location
                        </IonButton>
                      </IonRow>
                    )}

                  </IonCard>


                }
              </IonCard>

            }

          </>}
        <IonAccordionGroup>
          <IonAccordion value="first">
            <IonItem slot="header"><IonLabel className="ion-text-wrap"><span style={{ fontSize: "17px" }}>Sort by</span></IonLabel>
              <IonBadge >{sortOptions.find(option => option.value === sortSelected)?.label}</IonBadge>

            </IonItem>
            <IonGrid className="filter-grid" slot="content">


              <IonRow>

                <IonList className="refreshments-filters-list">
                  <IonRadioGroup value={sortSelected} onIonChange={e => setSortSelected(e.detail.value)}>
                    {sortOptions.map((option) => (
                      <IonItem key={option.value}>
                        <IonRadio
                          slot="start"
                          value={option.value}
                          disabled={!isCommunityPlus(currentUserProfile?.subscription_level) && option.value !== sortOptions[0].value}
                        />
                        <IonLabel>{option.label} {option.value !== sortOptions[0].value && <FontAwesomeIcon color="var(--ion-color-medium)" icon={faStar} />}</IonLabel>

                      </IonItem>
                    ))}

                  </IonRadioGroup>
                </IonList>

              </IonRow>

            </IonGrid>
          </IonAccordion>
        </IonAccordionGroup>
        <IonAccordionGroup>
          <IonAccordion value="first">
            <IonItem slot="header"><IonLabel className="ion-text-wrap"><span style={{ fontSize: "17px" }}>Categories</span></IonLabel>
              {barsProp == 'all' ? <IonBadge color={barsProp == "all" ? "primary" : "danger"}>Showing {barsProp == 'all' ? "all" : "some"} categories</IonBadge> : <></>}

            </IonItem>
            <IonGrid className="filter-grid" slot="content">


              <IonRow>

                <IonList lines="none">
                  {options.map((option) => (
                    <IonItem key={option.value} className="dont-grey-disabled">
                      <IonCheckbox
                        slot="start"
                        onIonChange={(e) => handleCheckboxChange(option.value, e.detail.checked)}
                        disabled={selectedValues.includes(option.value) && !isCommunityPlus(currentUserProfile?.subscription_level) && ((localPosts && (selectedValues.length <= (allValues.length + allValuesLocal.length - 2))) || (!localPosts && (selectedValues.length <= (options.length - 2))))}
                        checked={selectedValues.includes(option.value)}
                      />
                      <IonLabel>{option.label}</IonLabel>

                    </IonItem>
                  ))}
                  {localPosts &&
                    localOptions.map((option) => (
                      <IonItem key={option.value}>
                        <IonCheckbox
                          slot="start"
                          onIonChange={(e) => handleCheckboxChange(option.value, e.detail.checked)}
                          checked={selectedValues.includes(option.value)}
                        />
                        <IonLabel>{option.label}</IonLabel>

                      </IonItem>
                    ))}


                </IonList>





              </IonRow>
              <IonRow className="ion-padding ion-justify-content-center">
                <IonButton size="small" onClick={localPosts ? () => setSelectedValues(allValues.concat(allValuesLocal)) : () => setSelectedValues(allValues)}>Select all</IonButton>
              </IonRow>
              {(!isCommunityPlus(currentUserProfile?.subscription_level) && ((localPosts && (selectedValues.length <= (allValues.length + allValuesLocal.length - 2))) || (!localPosts && (selectedValues.length <= (options.length - 2))))) &&
                <IonRow className="ion-padding ion-text-align-center ion-justify-content-center">
                  <IonNote className="ion-text-center">
                    Upgrade to a subscription level to filter by more categories.
                  </IonNote>
                </IonRow>
              }
            </IonGrid>
          </IonAccordion>
        </IonAccordionGroup>

        {(!isCommunityPlus(currentUserProfile?.subscription_level)) &&
          <IonRow className="ion-padding ion-text-align-center ion-justify-content-center">
            <IonNote className="ion-text-center">
              <FontAwesomeIcon color="var(--ion-color-medium)" icon={faStar} /> Upgrade to a subscription level for more sort options, filters, and additional locations and increased radius for local posts.
            </IonNote>
          </IonRow>}





      </IonContent>
    </IonPage >
  )
};

export default RefreshmentsFiltersModal;
