import React, { createRef, useEffect, useRef, useState } from "react";
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonItem, IonRow, IonButtons, IonNote, IonList, IonFooter, IonIcon, IonTextarea, IonCol, IonItemSliding, IonItemOptions, IonItemOption, useIonModal, IonLabel, IonInput, IonSegment, IonSegmentButton, IonCheckbox, IonGrid, IonAccordionGroup, IonAccordion, IonRadioGroup, IonRadio, IonText, useIonAlert, IonToast, IonBadge, IonCard, IonCardTitle, IonToggle, IonRange, IonSelect, IonSelectOption } from '@ionic/react';
import { addSavedLocation, deleteSavedLocation, isCommunityPlus, isPro } from '../hooks/utilities';
import { DEFAULT_EVENT_FILTERS, EVENT_FILTER_PREF_KEYS, EventFilters } from '../hooks/api/events';
import EventFiltersSection from './EventFiltersSection';


import './AdvancedFilterModal.css'
import './RefreshmentsFilters.css'

import { useGetCurrentProfile } from "../hooks/api/profiles/current-profile";

import { Preferences } from "@capacitor/preferences";
import { useGetCurrentStreak } from "../hooks/api/profiles/current-streak";
import { faCirclePlus, faLocationDot, faLocationPin, faTrash } from "@fortawesome/pro-solid-svg-icons";
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
  onNavigate: (path: string) => void;
  onDismiss: (bars: string, localPosts: boolean, radius: number | null, sortSelected: string, eventFilters: EventFilters) => void;
};

const RefreshmentsFiltersModal: React.FC<Props> = (props) => {
  const { onDismiss, barsProp, localProp, radiusProp, sortProp, onNavigate } = props;

  const queryClient = useQueryClient()

  // tanstack query
  const currentUserProfile = useGetCurrentProfile().data;

  const { data: savedLocations, isLoading: savedLocationsLoading } = useGetSavedLocations(isCommunityPlus(currentUserProfile?.subscription_level));

  const canSeeLocal = !!(localProp && currentUserProfile?.location_point_lat && currentUserProfile?.location_point_long);



  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [sortSelected, setSortSelected] = useState<string>(sortProp);
  const [eventFilters, setEventFilters] = useState<EventFilters>(DEFAULT_EVENT_FILTERS);

  const [radius, setRadius] = useState<number>(radiusProp ?? 150);
  const [localPosts, setLocalPosts] = useState<boolean>(canSeeLocal);


  const [presentRadiusAlert] = useIonAlert();
  const [presentClearFiltersAlert] = useIonAlert();

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
  const categoryLabelMap = new Map(
    [...options, ...localOptions].map((option) => [option.value, option.label])
  );


  const sortOptions = [
    { label: "Most recent", value: "recent" },
    { label: "Most recent post or comment", value: "comment" },
    { label: "Most liked", value: "liked" },
  ]

  const allSortValues = sortOptions.map((opt) => opt.value);

  const getPostCategoriesBadge = () => {
    const availableCategoryValues = localPosts ? allValues.concat(allValuesLocal) : allValues;
    const selectedCategoryValues = selectedValues.includes('all')
      ? availableCategoryValues
      : selectedValues.filter((value) => availableCategoryValues.includes(value));

    if (
      selectedValues.includes('all') ||
      selectedCategoryValues.length === 0 ||
      selectedCategoryValues.length === availableCategoryValues.length
    ) {
      return 'All';
    }

    if (selectedCategoryValues.length === 1) {
      return categoryLabelMap.get(selectedCategoryValues[0]) ?? selectedCategoryValues[0];
    }

    return `${selectedCategoryValues.length} filters`;
  };

  const getEventPreferencesBadge = () => {
    const eventTypeSpecific = eventFilters.eventTypes.filter((value) => value !== 'all');
    const attendeeSpecific = eventFilters.attendeePrecautionPreferences.filter((value) => value !== 'all');
    const precautionSpecific = eventFilters.inPersonPrecautions.filter((value) => value !== 'all');
    const selectedEventFilterCount =
      eventTypeSpecific.length + attendeeSpecific.length + precautionSpecific.length;

    if (selectedEventFilterCount === 0) {
      return 'All';
    }

    if (selectedEventFilterCount === 1) {
      const singleValue =
        eventTypeSpecific[0] ??
        attendeeSpecific[0] ??
        precautionSpecific[0];

      if (singleValue === 'virtual_only') return 'Virtual only';
      if (singleValue === 'in_person_only') return 'In person only';
      if (singleValue === 'in_person_with_virtual_option') return 'In person with virtual option';
      if (singleValue === 'precautions_only') return 'Covid conscientious only';
      if (singleValue === 'precautions_preferred') return 'Covid conscientious preferred';
      if (singleValue === 'open') return 'Open to everyone';
      if (singleValue === 'masks_encouraged') return 'Masks encouraged';
      if (singleValue === 'masks_required') return 'Masks required';
      if (singleValue === 'tests_required') return 'Tests required';
      if (singleValue === 'outdoors') return 'Outdoors';
      if (singleValue === 'partially_outdoors') return 'Partially outdoors';
      if (singleValue === 'air_purifiers') return 'Air purifiers';
      return singleValue;
    }

    return `${selectedEventFilterCount} filters`;
  };


  useEffect(() => {
    if (barsProp === 'all') {
      setSelectedValues(['all']);
    } else {
      setSelectedValues(barsProp.split(','));
    }

    const loadEventFilters = async () => {
      const [types, attendee, precautions] = await Promise.all([
        Preferences.get({ key: EVENT_FILTER_PREF_KEYS.eventTypes }),
        Preferences.get({ key: EVENT_FILTER_PREF_KEYS.attendeePrecautionPreferences }),
        Preferences.get({ key: EVENT_FILTER_PREF_KEYS.inPersonPrecautions }),
      ]);
      setEventFilters({
        eventTypes: types.value ? types.value.split(',') : ['all'],
        attendeePrecautionPreferences: attendee.value ? attendee.value.split(',') : ['all'],
        inPersonPrecautions: precautions.value ? precautions.value.split(',') : ['all'],
      });
    };
    loadEventFilters();
  }, [])

  useEffect(() => {
    if (!localProp && localPosts) {
      if (selectedValues.includes('all')) return;
      const uniqueLocalValues = allValuesLocal.filter(val => !selectedValues.includes(val));
      setSelectedValues(prev => prev.concat(uniqueLocalValues));
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



  const handleCategoryChange = (event: CustomEvent) => {
    let next: string[] = event.detail.value ?? [];
    const prev = selectedValues;
    const added = next.find(v => !prev.includes(v));

    const allSpecific = localPosts ? allValues.concat(allValuesLocal) : allValues;
    if (added === 'all') {
      next = ['all'];
    } else if (added) {
      next = next.filter(v => v !== 'all');
      if (allSpecific.every(v => next.includes(v))) {
        next = ['all'];
      } else if (!isCommunityPlus(currentUserProfile?.subscription_level) && next.length < allSpecific.length - 1) {
        next = prev;
      }
    }
    if (next.length === 0) next = ['all'];

    setSelectedValues(next);
    requestAnimationFrame(() => {
      const popover = document.querySelector('ion-select-popover');
      if (popover) {
        const opts = (popover as any).options;
        if (opts) {
          (popover as any).options = opts.map((opt: any) => ({ ...opt, checked: next.includes(opt.value) }));
        }
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
    if (radius) {
      await Preferences.set({ key: "radius", value: radius.toString() });
    }
    await Preferences.set({ key: "local", value: localPosts ? 'on' : 'off' });
    if (sortSelected) {
      await Preferences.set({ key: "sort", value: sortSelected });
    }

    const activeValues = localPosts ? selectedValues : selectedValues.filter(v => !allValuesLocal.includes(v));
    if (activeValues.includes('all') || activeValues.length === 0) {
      await Preferences.set({ key: "filters", value: 'all' });
      onDismiss('all', localPosts, radius, sortSelected, eventFilters);
    } else {
      await Preferences.set({ key: "filters", value: activeValues.join(',') });
      onDismiss(activeValues.join(','), localPosts, radius, sortSelected, eventFilters);
    }

    await Preferences.set({ key: EVENT_FILTER_PREF_KEYS.eventTypes, value: eventFilters.eventTypes.join(',') });
    await Preferences.set({ key: EVENT_FILTER_PREF_KEYS.attendeePrecautionPreferences, value: eventFilters.attendeePrecautionPreferences.join(',') });
    await Preferences.set({ key: EVENT_FILTER_PREF_KEYS.inPersonPrecautions, value: eventFilters.inPersonPrecautions.join(',') });
  }

  const handleNavigate = async (path: string) => {
    await handleDone();
    onNavigate(path);
  };


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

  const resetRefreshmentsFilters = () => {
    const hasLocation = Boolean(currentUserProfile?.location_point_lat && currentUserProfile?.location_point_long);
    const maxRadius = isPro(currentUserProfile?.subscription_level)
      ? 5001
      : isCommunityPlus(currentUserProfile?.subscription_level)
        ? 5000
        : 150;

    setSelectedValues(['all']);
    setEventFilters(DEFAULT_EVENT_FILTERS);
    setSortSelected('recent');
    setRadius(maxRadius);

    if (hasLocation) {
      setLocalPosts(true);
      setLocalPostsEverywhere(isPro(currentUserProfile?.subscription_level));
    } else {
      setLocalPosts(false);
      setLocalPostsEverywhere(false);
    }
  };

  const confirmClearFilters = () => {
    presentClearFiltersAlert({
      header: 'Clear Refreshments filters?',
      message: 'This will reset post categories and event preferences, and maximize your local posts range.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Clear all',
          handler: () => {
            resetRefreshmentsFilters();
          },
        },
      ],
    });
  };

  return (
    <IonPage >
      <IonHeader>
        <IonToolbar className="modal-title">
          <IonTitle>Filters</IonTitle>
          <IonButtons slot="end" color="secondary">
            <IonButton onClick={handleDone}>Done</IonButton>
          </IonButtons>

        </IonToolbar>
      </IonHeader>
      <IonContent className="adv-filters">

        <IonItem lines="none">
          <IonToggle
            onIonChange={async e => setLocalPosts(e.detail.checked)}
            checked={localPosts}
            disabled={(!currentUserProfile?.location_point_lat || !currentUserProfile?.location_point_long)}
          >
            Local posts and events
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
                <IonToggle
                  onIonChange={async e => setLocalPostsEverywhereRaw(e.detail.checked)}
                  checked={localPostsEverywhere}
                >
                  <span style={{ whiteSpace: 'normal', lineHeight: 1.2 }}>
                    Show local posts and events from everywhere
                  </span>
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


              <IonRow className="ion-padding">

                <IonList className="sort-filters">
                  <IonRadioGroup value={sortSelected} onIonChange={e => setSortSelected(e.detail.value)} >
                    {sortOptions.map((option) => (

                        <IonRadio
                          key={option.value}
                          slot="start"
                          value={option.value}
                          disabled={!isCommunityPlus(currentUserProfile?.subscription_level) && option.value !== sortOptions[0].value}
                        >{option.label} {option.value !== sortOptions[0].value && <FontAwesomeIcon color="var(--ion-color-medium)" icon={faCirclePlus} />}
                        </IonRadio>

                    ))}

                  </IonRadioGroup>
                </IonList>

              </IonRow>

            </IonGrid>
          </IonAccordion>
        </IonAccordionGroup>
        <IonAccordionGroup>
          <IonAccordion value="first">
            <IonItem slot="header">
              <IonLabel className="ion-text-wrap"><span style={{ fontSize: "17px" }}>Post categories</span></IonLabel>
              <IonBadge>{getPostCategoriesBadge()}</IonBadge>
            </IonItem>
            <IonGrid className="filter-grid" slot="content">
              <IonRow>
                <IonItem>
                  <IonLabel position="stacked">Categories</IonLabel>
                  <IonSelect
                    value={selectedValues}
                    multiple
                    interface="popover"
                    onIonChange={handleCategoryChange}
                  >
                    <IonSelectOption value="all">Any</IonSelectOption>
                    {options.map(opt => (
                      <IonSelectOption key={opt.value} value={opt.value}>{opt.label}</IonSelectOption>
                    ))}
                    {localPosts && localOptions.map(opt => (
                      <IonSelectOption key={opt.value} value={opt.value}>{opt.label}</IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonRow>
              {(!isCommunityPlus(currentUserProfile?.subscription_level)) &&
                <IonRow className="ion-padding ion-text-align-center ion-justify-content-center">
                  <IonNote className="ion-text-center">
                    Upgrade to a subscription level to filter by more categories.
                  </IonNote>
                </IonRow>
              }
            </IonGrid>
          </IonAccordion>
        </IonAccordionGroup>
        <IonAccordionGroup>
          <IonAccordion value="first">
            <IonItem slot="header">
              <IonLabel className="ion-text-wrap"><span style={{ fontSize: "17px" }}>Event preferences</span></IonLabel>
              <IonBadge>{getEventPreferencesBadge()}</IonBadge>
            </IonItem>
            <IonGrid className="filter-grid" slot="content">
              <EventFiltersSection filters={eventFilters} onChange={setEventFilters} />
            </IonGrid>
          </IonAccordion>
        </IonAccordionGroup>

        {(!isCommunityPlus(currentUserProfile?.subscription_level)) &&
          <IonRow className="ion-padding ion-text-align-center ion-justify-content-center">
            <IonNote className="ion-text-center">
              <FontAwesomeIcon color="var(--ion-color-medium)" icon={faCirclePlus} /> Upgrade to a subscription level for more sort options, filters, and additional locations and increased radius for local posts.
            </IonNote>
          </IonRow>}

        <IonRow className="ion-justify-content-center ion-padding-top ion-padding-bottom">
          <IonButton size="small" color="navy" onClick={confirmClearFilters}>
            Clear all Refreshments filters
          </IonButton>
        </IonRow>





      </IonContent>
    </IonPage >
  )
};

export default RefreshmentsFiltersModal;
