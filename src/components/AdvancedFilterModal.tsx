import React, { createRef, useEffect, useRef, useState } from "react";
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonItem, IonRow, IonButtons, IonNote, IonList, IonFooter, IonIcon, IonTextarea, IonCol, IonItemSliding, IonItemOptions, IonItemOption, useIonModal, IonLabel, IonInput, IonSegment, IonSegmentButton, IonCheckbox, IonGrid, IonAccordionGroup, IonAccordion, IonRadioGroup, IonRadio, IonText, useIonAlert, IonToast, IonBadge } from '@ionic/react';
import { clearDismissedConnections, isPersonalPlus, updateCurrentUserProfile } from "../hooks/utilities";


import { eyeOff, closeCircle } from 'ionicons/icons';

import './AdvancedFilterModal.css'
import EditLocationModal from "./EditLocationModal";
import { useGetCurrentProfile } from "../hooks/api/profiles/current-profile";
import { useQueryClient } from "@tanstack/react-query";
import { faStar, faTriangleExclamation } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { removeFromCapacitorLocalStorage } from "../hooks/capacitorPreferences/all";

type Props = {
  currentProfileData: any;
  pro: boolean;
  onDismiss: (changes: boolean) => void;
};

interface Filters {
  filter_any_all: string,
  filter_keyword: string | null,
  filter_gender_sexuality: string[],
  filter_lc: string[],
  filter_looking_for_single_selection: string | null,
  filter_age_gt: number | null,
  filter_age_lt: number | null,
  filter_distance: number | null,
  filter_precautions_include_or_not: string,
  filter_precautions_single_selection: number | null
}

interface Limits {
  dontshow_outside_ages: boolean,
  dontshow_gendersexuality: string[],
  dontshow_gendersexuality_any_all: string
  onlyshow_gendersexuality: string[],
  onlyshow_gendersexuality_any_all: string
}

const getCovidBehaviorStatement = (value: number) => {

  if (value == 18) {
    return "does not have routine daily exposures"
  }
  else if (value == 1) {
    return "works from home"
  }
  else if (value == 8) {
    return "lives alone / with others of shared level of precaution"
  }
  else if (value == 2) {
    return "eats outside at restaraunts"
  }
  else if (value == 5) {
    return "attends outdoor events"
  }
  else if (value == 6) {
    return "attends indoor events with a mask on"
  }
  else if (value == 13) {
    return "tests before all meetups"
  }
  else if (value == 14) {
    return "tests before indoor meetups"
  }
  else if (value == 3) {
    return "lives with non-Covid conscientious people"
  }
  else if (value == 17) {
    return "is a caregiver"
  }
  else if (value == 9) {
    return "goes to work or school in a mask"
  }

  return ""
}

const tooRestrictive = (theArray: string[], extra = false) => {

  if (theArray.length > 3) {
    return true
  }

  if (theArray.includes('mono') && theArray.includes('poly')) {
    return true
  }

  if (theArray.includes('man') && theArray.includes('woman')) {
    return true
  }

  if (theArray.includes('man') && theArray.includes('genderfluid')) {
    return true
  }

  if (theArray.includes('woman') && theArray.includes('genderfluid')) {
    return true
  }


  if (theArray.includes('trans') && theArray.includes('cis')) {
    return true
  }

  if (theArray.includes('nb') && theArray.includes('cis')) {
    return true
  }

  if (theArray.includes('woman') && theArray.includes('nb')) {
    return true
  }

  if (theArray.includes('nb') && theArray.includes('genderfluid')) {
    return true
  }


  if (theArray.includes('man') && theArray.includes('nb')) {
    return true
  }

  if (theArray.includes('genderfluid') && theArray.includes('cis')) {
    return true
  }

  if (theArray.includes('trans') && theArray.includes('genderfluid')) {
    return true
  }

  if (theArray.includes('trans') && theArray.includes('nb')) {
    return true
  }

  if (theArray.includes('straight') && theArray.includes('queer')) {
    return true
  }

  if (theArray.includes('straight') && theArray.includes('gay')) {
    return true
  }

  if (theArray.includes('straight') && theArray.includes('lesbian')) {
    return true
  }

  if (extra) {

    if (theArray.includes('bi') && theArray.includes('pan')) {
      return true
    }

    if (theArray.includes('gray ace') && theArray.includes('ace')) {
      return true
    }


    if (theArray.includes('gray ace') && theArray.includes('demi')) {
      return true
    }

    if (theArray.includes('ace') && theArray.includes('demi')) {
      return true
    }

    if (theArray.includes('straight') && theArray.includes('pan')) {
      return true
    }
  
    if (theArray.includes('straight') && theArray.includes('bi')) {
      return true
    }
  }



  return false
}

const AdvancedFilterModal: React.FC<Props> = (props) => {
  const { onDismiss, currentProfileData } = props;

  // tanstack query
  const currentUserProfile = useGetCurrentProfile().data;
  const queryClient = useQueryClient()


  const [greaterThanFilter, setGreaterThanFilter] = useState<number | null>(currentProfileData?.filter_age_gt)
  const [lessThanFilter, setLessThanFilter] = useState<number | null>(currentProfileData?.filter_age_lt)
  const [distanceFilter, setDistanceFilter] = useState<number | null>(currentProfileData?.filter_distance)
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [ageValidError, setAgeValidError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [somethingChanged, setSomethingChanged] = useState<boolean>(false)

  const [currLat, setCurrLat] = useState<number | null>(currentProfileData?.location_point_lat)
  const [currLong, setCurrLong] = useState<number | null>(currentProfileData?.location_point_long)

  const [lcCount, setLcCount] = useState<number>((currentProfileData?.filter_lc).length)
  const [gsCount, setGsCount] = useState<number>((currentProfileData?.filter_gender_sexuality).length)
  const [limitCount, setLimitCount] = useState<number>(0)



  const [anyOrAll, setAnyOrAll] = useState<string>(currentProfileData.filter_any_all);
  const [hasOrDoesNotHavePrecaution, setHasOrDoesNotHavePrecaution] = useState<string>(currentProfileData?.filter_precautions_include_or_not);


  const [lookingForSS, setLookingForSS] = useState<string | null>(currentProfileData?.filter_looking_for_single_selection);
  const [precautionsSS, setPrecautionsSS] = useState<number | null>(currentProfileData?.filter_precautions_single_selection);

  const lcFilterChecked: string[] = currentProfileData?.filter_lc
  const genderSexualityFilterChecked: string[] = currentProfileData?.filter_gender_sexuality

  const [dontshowSexualityFilterChecked, setDontshowSexualityFilterChecked] =  useState<string[]>(currentProfileData?.dontshow_gendersexuality ?? [])
  const [onlyshowSexualityFilterChecked, setOnlyshowSexualityFilterChecked] =  useState<string[]>(currentProfileData?.onlyshow_gendersexuality ?? [])

  const [dontShowAnyOrAll, setDontShowAnyOrAll] = useState<string>(currentProfileData.dontshow_gendersexuality_any_all);
  const [onlyShowAnyOrAll, setOnlyShowAnyOrAll] = useState<string>(currentProfileData.onlyshow_gendersexuality_any_all);

  const [dontShowTooRestrictive, setDontShowTooRestrictive] = useState<boolean>(false);
  const [onlyShowTooRestrictive, setOnlyShowTooRestrictive] = useState<boolean>(false);







  // const [lcFilterChecked, setLcFilterChecked] =  useState<string []>(currentProfileData?.filter_lc ?? []);
  // const [genderSexualityFilterChecked, setGenderSexualityFilterChecked] =  useState<string []>(currentProfileData?.filter_gender_sexuality ?? []);
  const [keywordFilter, setKeywordFilter] = useState<string | null>(currentProfileData?.filter_keyword);

  const [showLCFilters, setShowLCFilters] = useState<boolean>(false)

  const [presentAgeAlert] = useIonAlert();
  const [presentDistanceAlert] = useIonAlert();
  const [presentLookingForAlert] = useIonAlert();
  const [presentKeywordAlert] = useIonAlert();
  const [presentClearFiltersAlert] = useIonAlert();
  const [presentShowIgnoredAlert] = useIonAlert();
  const [presentPrecautionsAlert] = useIonAlert();
  const [presentActualPrecautionsAlert] = useIonAlert();



  const whatConnections = async () => {
    presentLookingForAlert({
      header: 'Which kind of connection would you like to filter by?',
      subHeader: 'Choose one',
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
          handler: async (data: string) => {
            console.log('OK clicked: ', data);
            setSomethingChanged(true)
            if (data == "all") {
              setLookingForSS(null)
              queryClient.invalidateQueries({ queryKey: ['current'] })
              await updateCurrentUserProfile({ filter_looking_for_single_selection: null })
            }
            else {
              setLookingForSS(data)
              queryClient.invalidateQueries({ queryKey: ['current'] })
              await updateCurrentUserProfile({ filter_looking_for_single_selection: data })
            }
          }
        }
      ],
      inputs: [
        {
          label: 'all',
          type: 'radio',
          value: 'all',
        },
        {
          label: 'friendship',
          type: 'radio',
          value: 'friendship',
        },
        {
          label: 'romance',
          type: 'radio',
          value: 'romance',
          disabled: currentProfileData?.looking_for.includes("romance") ? false : true
        },
        {
          label: 'virtual connection',
          type: 'radio',
          value: 'virtual connection',
        },
        {
          label: 'virtual only',
          type: 'radio',
          value: 'virtual only',
        },
        {
          label: 'housing / roommates',
          type: 'radio',
          value: 'housing',
        },
        {
          label: 'job',
          type: 'radio',
          value: 'job',
        },
        {
          label: 'families',
          type: 'radio',
          value: 'families',
        },
        {
          label: 'Long Covid support',
          type: 'radio',
          value: 'Long Covid support',
        },
      ],
    })
  }

  const whatBasedOnPrecautions = async () => {
    presentPrecautionsAlert({
      cssClass: 'alertpadding',
      header: 'I am looking for someone',
      subHeader: 'Choose one',
      buttons: [
        {
          text: 'Clear',
          role: 'destructive',
          handler: async () => {
            console.log("hewo")
            setHasOrDoesNotHavePrecaution("none")
            await updateCurrentUserProfile({ filter_precautions_include_or_not: "none" })
            queryClient.invalidateQueries({ queryKey: ['current'] })

          }
        },
        {
          text: 'Select',
          handler: async (data: string) => {
            console.log('OK clicked: ', data);
            setSomethingChanged(true)
            if (data == "not") {
              setHasOrDoesNotHavePrecaution("not")
              await updateCurrentUserProfile({ filter_precautions_include_or_not: "not" })
              queryClient.invalidateQueries({ queryKey: ['current'] })
            }
            else if (data == "includes") {
              setHasOrDoesNotHavePrecaution("includes")
              await updateCurrentUserProfile({ filter_precautions_include_or_not: "includes" })
              queryClient.invalidateQueries({ queryKey: ['current'] })

            }
            else {
              setHasOrDoesNotHavePrecaution("none")
              await updateCurrentUserProfile({ filter_precautions_include_or_not: "none" })
              queryClient.invalidateQueries({ queryKey: ['current'] })
            }
          }
        }
      ],
      inputs: [
        {
          label: 'who has selected this Covid Behavior',
          type: 'radio',
          value: 'includes',
        },

        {
          label: 'who has NOT selected this Covid Behavior',
          type: 'radio',
          value: 'not',
        }
      ],
    })
  }

  const whatPrecautions = async () => {
    presentActualPrecautionsAlert({
      cssClass: 'alertpadding',
      header: `${(hasOrDoesNotHavePrecaution === "not") ? 'I am looking to filter out someone who' : 'I am looking for someone who'}`,
      subHeader: 'Choose one',
      buttons: [
        {
          text: 'Close',
          role: 'cancel',
        },
        {
          text: 'Select',
          handler: async (data: number) => {
            console.log('OK clicked: ', data);
            setSomethingChanged(true)
            setPrecautionsSS(data)
            await updateCurrentUserProfile({ filter_precautions_single_selection: data })
          }
        }
      ],
      inputs: [
        {
          label: "Does not have routine daily exposures",
          type: 'radio',
          value: 18,
        },
        {
          label: 'Works from home',
          type: 'radio',
          value: 1,
        },
        {
          label: 'Lives alone / with others of shared level of precaution',
          type: 'radio',
          value: 8,
        },
        {
          label: 'Eats outside at restaraunts',
          type: 'radio',
          value: 2,
        },
        {
          label: 'Attends outdoor events',
          type: 'radio',
          value: 5,
        },
        {
          label: 'Attends indoor events with a mask on',
          type: 'radio',
          value: 6,
        },
        {
          label: 'Tests before all meetups',
          type: 'radio',
          value: 13,
        },
        {
          label: 'Tests before indoor meetups',
          type: 'radio',
          value: 14,
        },
        {
          label: 'Lives with non-Covid conscientious people',
          type: 'radio',
          value: 3,
        },
        {
          label: 'Is a caregiver',
          type: 'radio',
          value: 17,
        },
        {
          label: 'Goes to work or school in a mask',
          type: 'radio',
          value: 9,
        }


      ],
    })
  }



  const whatAge = async () => {
    presentAgeAlert({
      header: 'What age range should we show you?',
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

            let min = data.minimum
            if (data.minimum == '' || data.minimum == null) {
              min = 18
            }

            let max = data.maximum
            if (data.maximum == '' || data.maximum == null) {
              max = 200
            }

            if (min < 18 || max < 18) {
              setIsValid(false)
              setAgeValidError("Age filters need to be at least 18.")
              return false
            }
            else if (max <= min) {
              setIsValid(false)
              setAgeValidError("Max must be greater than min.")
              return false
            }
            else if (max - min < 4) {
              setIsValid(false)
              setAgeValidError("Age range should be at least 4 years")
              return false
            }
            else if (yourAgeNotInRange(min, max)) {
              setIsValid(false)
              setAgeValidError("You must be within your filter age range.")
              return false
            }
            setSomethingChanged(true)
            setAgeValidError(null)
            setGreaterThanFilter(data.minimum || null)
            setLessThanFilter(data.maximum || null)
            queryClient.invalidateQueries({ queryKey: ['current'] })
            await updateCurrentUserProfile({ filter_age_gt: data.minimum || null, filter_age_lt: data.maximum || null })


          }
        }
      ],
      inputs: [
        {
          name: 'minimum',
          type: 'number',
          placeholder: "Minimum",
          min: 18

        },
        {
          name: 'maximum',
          type: 'number',
          placeholder: "Maximum",
          min: 19,

        },

      ],
    })
  }

  const whatDistance = async () => {
    presentDistanceAlert({
      header: 'What is the farthest away your Picks should be?',
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
          text: 'Clear',
          role: 'confirm',
          handler: async () => {
            queryClient.invalidateQueries({ queryKey: ['current'] })
            await updateCurrentUserProfile({ filter_distance: null })
            setDistanceFilter(null)
          },
          cssClass: distanceFilter == null ? "hide-button": ""
        },
        {
          text: 'Select',
          handler: async (data: any) => {
            if (data?.distance !== null) {
              console.log('OK clicked: ', data.distance);
              setSomethingChanged(true)
              setDistanceFilter(data.distance)
              await updateCurrentUserProfile({ filter_distance: data.distance })
              queryClient.invalidateQueries({ queryKey: ['current'] })
            }

          }
        }
      ],
      inputs: [
        {
          name: 'distance',
          type: 'number',
          placeholder: 'km'

        }
      ],
    })
  }

  const whatKeyword = async () => {
    presentKeywordAlert({
      header: 'What keyword should your Picks have somewhere in their profile?',
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
            console.log('OK clicked: ', data.keyword);
            setKeywordFilter(data.keyword)
            setSomethingChanged(true)
            queryClient.invalidateQueries({ queryKey: ['current'] })
            await updateCurrentUserProfile({ filter_keyword: data.keyword })

          }
        }
      ],
      inputs: [
        {
          name: 'keyword',
          type: 'text',
          placeholder: 'A word or phrase'

        }
      ],
    })
  }

  const clearFilterAlert = async () => {
    presentClearFiltersAlert({
      header: 'Are you sure you want to clear your filters?',
      subHeader: 'You can always put them back. Note: This does not clear your profile visibility preferences.',
      buttons: [
        {
          text: 'Nevermind',
          role: 'cancel',
        },
        {
          text: 'Clear',
          handler: async () => {
            queryClient.invalidateQueries({ queryKey: ['current'] })
            await removeFromCapacitorLocalStorage('last_shown_pick_v2');
            await clearFilters()
          }
        }
      ],
    })
  }

  const showIgnoredAgain = async () => {
    presentShowIgnoredAlert({
      header: 'Are you sure want to see the profiles of people you have ignored before?',
      buttons: [
        {
          text: 'Nevermind',
          role: 'cancel',
        },
        {
          text: 'Yes',
          handler: async () => {
            await clearDismissedConnections()
            onDismiss(true)
            queryClient.invalidateQueries({ queryKey: ['current'] })
            queryClient.invalidateQueries({ queryKey: ['incoming-paginated'] })
          }
        }
      ],
    })
  }



  const yourAgeNotInRange = (minimum: number, maximum: number) => {
    if ((maximum != null && currentProfileData.age > maximum)
      || (minimum != null && currentProfileData.age < minimum)) {
      return true
    }
    return false
  }



  async function clearFilters() {
    onDismiss(true)

    setSomethingChanged(true)
    setGreaterThanFilter(null)
    setLessThanFilter(null)
    setDistanceFilter(null)
    setKeywordFilter(null)

    setIsValid(null)
    setAgeValidError(null)
    setSomethingChanged(true)
    const form_data: Filters = {
      filter_any_all: "any",
      filter_keyword: null,
      filter_gender_sexuality: [],
      filter_lc: [],
      filter_looking_for_single_selection: null,
      filter_age_gt: null,
      filter_age_lt: null,
      filter_distance: null,
      filter_precautions_include_or_not: "none",
      filter_precautions_single_selection: null,

    }
    queryClient.invalidateQueries({ queryKey: ['current'] })

    const response = await updateCurrentUserProfile(form_data)

    return

  }

  async function clearLimits() {
    onDismiss(true)

    setIsValid(null)
    setSomethingChanged(true)

    const limits_form_data: Limits = {
      dontshow_outside_ages: false,
      dontshow_gendersexuality: [],
      dontshow_gendersexuality_any_all: "none",
      onlyshow_gendersexuality: [],
      onlyshow_gendersexuality_any_all: "none"
    }
    queryClient.invalidateQueries({ queryKey: ['current'] })

    const response = await updateCurrentUserProfile(limits_form_data)

    return

  }

  //Adds the checkedbox to the array and check if you unchecked it
  const addGenderSexualityFilterCheckbox = (event: any) => {

    console.log("e", event.detail)
    setSomethingChanged(true)
    if (event.detail.checked) {
      genderSexualityFilterChecked.push(event.detail.value);
      setGsCount(genderSexualityFilterChecked.length)
    } else {
      let index = removeGenderSexualityFilterCheckedFromArray(event.detail.value);
      genderSexualityFilterChecked.splice(index, 1)
      setGsCount(genderSexualityFilterChecked.length)
    }
    console.log(genderSexualityFilterChecked)
  }

  //Removes checkbox from array when you uncheck it
  const removeGenderSexualityFilterCheckedFromArray = (checkbox: string) => {
    return genderSexualityFilterChecked.findIndex((category: string) => {
      return category === checkbox;
    })
  }

  //Adds the checkedbox to the array and check if you unchecked it
  const addDontShowGenderFilterCheckbox = (event: any) => {
    setSomethingChanged(true)
    if (event.detail.checked) {
      setDontshowSexualityFilterChecked([...dontshowSexualityFilterChecked, event.detail.value])
    } else {
      setDontshowSexualityFilterChecked(
        dontshowSexualityFilterChecked.filter(a =>
        a !== event.detail.value
      ))
    }
  }

    //Adds the checkedbox to the array and check if you unchecked it
    const addOnlyShowGenderFilterCheckbox = (event: any) => {
      setSomethingChanged(true)
      if (event.detail.checked) {
        setOnlyshowSexualityFilterChecked([...onlyshowSexualityFilterChecked, event.detail.value])
      } else {
        setOnlyshowSexualityFilterChecked(
          onlyshowSexualityFilterChecked.filter(a =>
          a !== event.detail.value
        ))
      }
    }



  //Adds the checkedbox to the array and check if you unchecked it
  const addLCFilterCheckbox = (event: any) => {
    setSomethingChanged(true)
    if (event.detail.checked) {
      lcFilterChecked.push(event.detail.value);
      setLcCount(lcFilterChecked.length)
    } else {
      let index = removeLCFilterCheckedFromArray(event.detail.value);
      lcFilterChecked.splice(index, 1);
      setLcCount(lcFilterChecked.length)
    }
  }

  //Removes checkbox from array when you uncheck it
  const removeLCFilterCheckedFromArray = (checkbox: string) => {
    return lcFilterChecked.findIndex((category: string) => {
      return category === checkbox;
    })
  }

  const handleLocationDismiss = async () => {
    locationDismiss();
    setCurrLat(currentUserProfile?.location_point_lat)
    setCurrLong(currentUserProfile?.location_point_long)
  }

  const [locationPresent, locationDismiss] = useIonModal(EditLocationModal, {
    onDismiss: handleLocationDismiss
  });

  const handleDone = async () => {
    if (somethingChanged) {
      console.log("something changed")
      let saveDontShow = dontshowSexualityFilterChecked
      let saveDontShowAnyAll = dontShowAnyOrAll
      let saveOnlyShow = onlyshowSexualityFilterChecked
      let saveOnlyShowAnyAll = onlyShowAnyOrAll
      
      if (dontShowAnyOrAll == "any" && tooRestrictive(dontshowSexualityFilterChecked)) {
        saveDontShow = []
        saveDontShowAnyAll = 'none'
      }
      if (dontShowAnyOrAll == "any" && tooRestrictive(dontshowSexualityFilterChecked)) {
        saveDontShow = []
        saveDontShowAnyAll = 'none'
      }
      if (onlyShowAnyOrAll == "all" && tooRestrictive(onlyshowSexualityFilterChecked, true)) {
        saveOnlyShow = []
        saveOnlyShowAnyAll = 'none'
      }
      if (saveDontShow.length == 0) {
        saveDontShowAnyAll = "none"
      }
      if (saveOnlyShow.length == 0) {
        saveOnlyShowAnyAll = "none"
      }
      await updateCurrentUserProfile({ 
        filter_gender_sexuality: genderSexualityFilterChecked,
        filter_lc: lcFilterChecked, 
        filter_any_all: anyOrAll,
        dontshow_gendersexuality: saveDontShow,
        dontshow_gendersexuality_any_all: saveDontShowAnyAll,
        onlyshow_gendersexuality: saveOnlyShow,
        onlyshow_gendersexuality_any_all: saveOnlyShowAnyAll
       })
       if (hasOrDoesNotHavePrecaution !== "none"  && precautionsSS == null) {
        await updateCurrentUserProfile({ 
          filter_precautions_include_or_not: "none",
         })
       }
       console.log("gilter", genderSexualityFilterChecked)
      queryClient.invalidateQueries({ queryKey: ['current'] })
      onDismiss(true)
    }
    else {
      console.log("nothing changed")
      onDismiss(false)
    }

  }

  // Don't show use effect
  useEffect(() => {


    if (dontShowAnyOrAll == 'any') {
      if (tooRestrictive(dontshowSexualityFilterChecked)) {
        setDontShowTooRestrictive(true)
      }
      else {setDontShowTooRestrictive(false)}
    }
    else {
      setDontShowTooRestrictive(false)
    }

    


  }, [dontshowSexualityFilterChecked, dontShowAnyOrAll])

  // Only show use effect
  useEffect(() => {

    console.log("Only show changed")

    if (onlyShowAnyOrAll == 'all') {
      console.log("very restrictive")
      if (tooRestrictive(onlyshowSexualityFilterChecked, true)) {
        setOnlyShowTooRestrictive(true)
      }
      else {setOnlyShowTooRestrictive(false)}
    }
    else {
      setOnlyShowTooRestrictive(false)
    }


  }, [onlyshowSexualityFilterChecked, onlyShowAnyOrAll])

    // Only show use effect
    useEffect(() => {

      let count = 0

      if (currentUserProfile?.dontshow_outside_ages) {
        count++
      }
      count = count + onlyshowSexualityFilterChecked.length + dontshowSexualityFilterChecked.length

      setLimitCount(count)
      
  
  
    }, [currentUserProfile, onlyshowSexualityFilterChecked, dontshowSexualityFilterChecked])




  return (
    <IonPage >
      <IonHeader>
        <IonToolbar class="modal-title">
          <IonTitle>Filters</IonTitle>
          <IonButtons slot="start" color="secondary">
            <IonButton onClick={handleDone}>Done</IonButton>
          </IonButtons>

        </IonToolbar>
      </IonHeader>
      <IonToast
        isOpen={ageValidError !== null}
        message={ageValidError!}
        onDidDismiss={() => setAgeValidError(null)}
        duration={5000}
        position='middle'
        color='danger'
        buttons={[
          {
            text: 'x',
            role: 'cancel',
          },
        ]}
      ></IonToast>
      <IonContent className="adv-filters">
        <IonRow class="pad-bottom">
          <IonButton size="small" fill="outline" href="/tips">How to use filters</IonButton>
          <IonButton size="small" fill="outline" color="danger" onClick={clearFilterAlert}>Clear filters</IonButton>
        </IonRow>
        <IonRow className="ion-justify-content-center">
          <IonButton size="small" fill="outline" onClick={showIgnoredAgain}>Show previously ignored</IonButton>
        </IonRow>
        <IonRow class="ion-justify-content-center">

          <IonText class="ion-padding ion-text-wrap">I am looking for someone who is</IonText>
        </IonRow>
        <IonItem button detail={true} onClick={whatAge} lines="none">
          <IonLabel>
            <h3>Age</h3>
            {greaterThanFilter == null && lessThanFilter == null ?
              <p>Any age</p>
              :
              greaterThanFilter == null && lessThanFilter !== null ?
                <p> Younger than {lessThanFilter}</p>
                :
                lessThanFilter == null && greaterThanFilter !== null ?
                  <p> Older than {greaterThanFilter}</p>
                  :
                  <p> Between {greaterThanFilter} and {lessThanFilter}</p>
            }
          </IonLabel>
        </IonItem>
        <IonItem button detail={true} lines="none" onClick={(currLat == null || currLong == null) ? () => locationPresent() : whatDistance}>
          <IonLabel>
            <h3>Distance</h3>
            {distanceFilter == null ?
              <p>Anywhere</p>
              : <p>Less than {distanceFilter} km away</p>}
          </IonLabel>
        </IonItem>
        <IonItem button detail={true} onClick={whatConnections} lines="none">
          <IonLabel>
            <h3>Connections</h3>
            {lookingForSS == null ?
              <p>Looking for any connection</p>
              : <p>Looking for {lookingForSS}</p>}
          </IonLabel>
        </IonItem>
        <IonItem lines="none" button detail={true} onClick={whatKeyword} disabled={!isPersonalPlus(currentProfileData?.subscription_level)}>
            <IonLabel className="side">
              <h3>Keyword &nbsp;<FontAwesomeIcon color="var(--ion-color-medium)" icon={faStar} /></h3>
              {keywordFilter == null || keywordFilter == "" ?
                <p>Talking about any topic</p>
                : <p>Talking about "{keywordFilter}"</p>}
            </IonLabel>
          </IonItem>
        <IonAccordionGroup >
          <IonAccordion >
            <IonItem slot="header"><IonLabel class="ion-text-wrap">Covid Behaviors</IonLabel> {hasOrDoesNotHavePrecaution !== "none" ?
              <IonBadge color="primary">1 filter</IonBadge>
              : <></>
            }</IonItem>

            <IonGrid className="filter-grid" slot="content">
              <IonItem button detail={true} onClick={whatBasedOnPrecautions}>
                <IonLabel class="ion-text-wrap">
                  <h3>Filter by Covid Behavior?</h3>
                  {hasOrDoesNotHavePrecaution == "none" ?
                    <p>No</p>
                    : <p>Yes - I'm looking for people who {hasOrDoesNotHavePrecaution == "includes" ? "included" : "did NOT include"} this behavior on their profile.</p>}
                </IonLabel>
              </IonItem>
              {hasOrDoesNotHavePrecaution !== "none" ?
                <IonItem button detail={true} onClick={whatPrecautions}>
                  <IonLabel class="ion-text-wrap ">
                    <h3>Which behavior?</h3>
                    {precautionsSS == null ?
                      <p>(You have not chosen a behavior)</p>
                      : <p>{getCovidBehaviorStatement(precautionsSS)}</p>}
                  </IonLabel>
                </IonItem>
                : <></>}
            </IonGrid>
          </IonAccordion>
        </IonAccordionGroup >
          

        {lookingForSS == "Long Covid support" ?
          <IonAccordionGroup value="first">
            <IonAccordion value="first">
              <IonItem slot="header"><IonLabel class="ion-text-wrap">Long Covid Support</IonLabel><IonBadge color="primary">{lcCount} filters</IonBadge></IonItem>
              <IonItem >


              </IonItem>

              <IonGrid className="filter-grid" slot="content">
                <IonRow className="lr-pad">
                  <IonText className="ion-text-wrap">
                    I am looking for someone who is <i>any</i> of the following:
                  </IonText>
                </IonRow>
                <IonRow>


                  <IonCol>
                    <IonList>
                      <IonItem>
                        <IonCheckbox slot="start" value="I have LC" checked={currentProfileData.filter_lc.includes("I have LC") ? true : false} onIonChange={e => addLCFilterCheckbox(e)} />
                        living with Long Covid
                      </IonItem>
                      <IonItem>
                        <IonCheckbox slot="start" value="LC caretaker" checked={currentProfileData.filter_lc.includes("LC caretaker") ? true : false} onIonChange={e => addLCFilterCheckbox(e)} />
                        caring for someone with Long Covid
                      </IonItem>
                      <IonItem>
                        <IonCheckbox slot="start" value="I could help remote" checked={currentProfileData.filter_lc.includes("I could help remote") ? true : false} onIonChange={e => addLCFilterCheckbox(e)} />
                        needing remote support
                      </IonItem>
                      <IonItem>
                        <IonCheckbox slot="start" value="I could help local" checked={currentProfileData.filter_lc.includes("I could help local") ? true : false} onIonChange={e => addLCFilterCheckbox(e)} />
                        needing local support
                      </IonItem>
                      <IonItem>
                        <IonCheckbox slot="start" value="I need help remote" checked={currentProfileData.filter_lc.includes("I need help remote") ? true : false} onIonChange={e => addLCFilterCheckbox(e)} />
                        offering remote support
                      </IonItem>
                      <IonItem>
                        <IonCheckbox slot="start" value="I need help local" checked={currentProfileData.filter_lc.includes("I need help local") ? true : false} onIonChange={e => addLCFilterCheckbox(e)} />
                        offering local support
                      </IonItem>
                    </IonList>

                  </IonCol>



                </IonRow>
              </IonGrid>
            </IonAccordion>
          </IonAccordionGroup >
          : <></>}

        <IonAccordionGroup >
          <IonAccordion>
            <IonItem slot="header"><IonLabel class="ion-text-wrap">Gender and Sexuality</IonLabel>
            {gsCount > 0 ? <IonBadge color={anyOrAll == "all" ? "danger" : "primary"}>{gsCount} filters</IonBadge> : <></>}
            </IonItem>
            <IonGrid className="filter-grid" slot="content">

              <IonRow className="any-all-row">
                <IonSegment value={anyOrAll} style={{ width: "50%" }}>
                  <IonSegmentButton value="any" onClick={() => { setAnyOrAll("any"); setSomethingChanged(true) }}>
                    <IonLabel>Any</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="all" onClick={() => { setAnyOrAll("all"); setSomethingChanged(true) }}>
                    <IonLabel color="danger">All</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              </IonRow>
              <IonRow className="lr-pad">

                {anyOrAll == "all" ?
                  <IonText color="danger" class="ion-text-wrap">
                    <p>Remember: searching by "all" results in far fewer Picks!</p>

                  </IonText> : <></>}
                <IonText class="ion-padding ion-text-wrap">
                  I am looking for someone who is <i>{anyOrAll}</i> of the following:
                </IonText>
              </IonRow>



              <IonRow>

                <IonCol>
                  <IonList>
                    <IonItem>
                      <IonCheckbox slot="start" value="straight" checked={genderSexualityFilterChecked.includes("straight") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                      Straight / heterosexual
                    </IonItem>
                    <IonItem>
                      <IonCheckbox slot="start" value="gay" checked={genderSexualityFilterChecked.includes("gay") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                      Gay / homosexual
                    </IonItem>
                    <IonItem>
                      <IonCheckbox slot="start" value="lesbian" checked={genderSexualityFilterChecked.includes("lesbian") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                      Lesbian
                    </IonItem>
                    <IonItem>
                      <IonCheckbox slot="start" value="bi" checked={genderSexualityFilterChecked.includes("bi") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                      Bi
                    </IonItem>
                    <IonItem>
                      <IonCheckbox slot="start" value="pan" checked={genderSexualityFilterChecked.includes("pan") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                      Pan
                    </IonItem>
                    <IonItem>
                      <IonCheckbox slot="start" value="gray ace" checked={genderSexualityFilterChecked.includes("gray ace") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                      Gray ace
                    </IonItem>
                    <IonItem>
                      <IonCheckbox slot="start" value="ace" checked={genderSexualityFilterChecked.includes("ace") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                      Ace
                    </IonItem>
                    <IonItem>
                      <IonCheckbox slot="start" value="demi" checked={genderSexualityFilterChecked.includes("demi") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                      Demisexual
                    </IonItem>
                    <IonItem>
                      <IonCheckbox slot="start" value="queer" checked={genderSexualityFilterChecked.includes("queer") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                      Queer
                    </IonItem>

                  </IonList>

                </IonCol>
                <IonCol>
                  <IonItem>
                    <IonCheckbox slot="start" value="man" checked={genderSexualityFilterChecked.includes("man") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                    Man
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="woman" checked={genderSexualityFilterChecked.includes("woman") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                    Woman
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="nb" checked={genderSexualityFilterChecked.includes("nb") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                    Nonbinary / gender noncomforming
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="genderfluid" checked={genderSexualityFilterChecked.includes("genderfluid") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                    Gender Fluid
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="cis" checked={genderSexualityFilterChecked.includes("cis") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                    Cis
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="trans" checked={genderSexualityFilterChecked.includes("trans") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                    Trans
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="intersex" checked={genderSexualityFilterChecked.includes("intersex") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                    Intersex
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="mono" checked={genderSexualityFilterChecked.includes("mono") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                    Monogamous
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="poly" checked={genderSexualityFilterChecked.includes("poly") ? true : false} onIonChange={e => addGenderSexualityFilterCheckbox(e)} />
                    Polyamorous
                  </IonItem>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonAccordion>
        </IonAccordionGroup>

        <IonAccordionGroup class="blue-bg">
          <IonAccordion>
            <IonItem slot="header"><IonLabel class="ion-text-wrap">My Profile Visibility Preferences</IonLabel>
            {limitCount > 0?<IonBadge color={(dontShowAnyOrAll == "any" || onlyShowAnyOrAll == "all") ? "danger" : "primary"}>{limitCount} preferences</IonBadge> : <></>}
            </IonItem>
            <IonGrid className="filter-grid" slot="content">
              <IonRow className="lr-pad ion-justify-content-center">
                <IonButton size="small" color="danger" fill="outline" onClick={async ()=>await clearLimits()}>Clear preferences</IonButton>
              </IonRow>
              <IonRow >
                <IonText class="ion-padding ion-text-wrap" style={{fontSize: "14px"}}>
                ● Only show my profile to people who:
                </IonText>
              </IonRow>
              <IonItem>
                <IonCheckbox slot="start" disabled={greaterThanFilter == null && lessThanFilter == null} checked={(currentProfileData?.dontshow_outside_ages && (greaterThanFilter != null || lessThanFilter !== null)) ? true : false} onIonChange={async e => await updateCurrentUserProfile({ dontshow_outside_ages: e.detail.checked})} />
                
                <IonLabel class="ion-text-wrap"> Are in my specified age range {
                  greaterThanFilter == null && lessThanFilter !== null ?
                    <p> Younger than {lessThanFilter}</p>
                    :
                    lessThanFilter == null && greaterThanFilter !== null ?
                      <p> Older than {greaterThanFilter}</p>
                      : !(greaterThanFilter == null && lessThanFilter == null)? 
                      <p> Between {greaterThanFilter} and {lessThanFilter}</p> : <></>}</IonLabel> 
              </IonItem>
              <IonItem>
                <IonCheckbox slot="start" disabled={true} value="man" checked={false} />
                <IonLabel class="ion-text-wrap"> Live within __ kilometers / miles </IonLabel>
                <IonBadge color="gray">Under construction!</IonBadge>
              </IonItem>

              <IonAccordionGroup class="blue-bg">
                <IonAccordion value="first">
                  <IonItem slot="header">
                    <IonLabel style={{paddingLeft: 0}} class="ion-text-wrap">● Only show my profile to people who identify as: </IonLabel>
                    {onlyshowSexualityFilterChecked.length > 0? <IonBadge color={(onlyShowAnyOrAll == "all") ? "danger" : "primary"}>{onlyshowSexualityFilterChecked.length} preferences</IonBadge> : <></>}
                  </IonItem>
                  <div slot="content">
                    <IonRow className="any-all-row">
                      <IonSegment value={onlyShowAnyOrAll} style={{ width: "100%" }}>
                        <IonSegmentButton value="none" onClick={() => { setOnlyShowAnyOrAll("none"); setSomethingChanged(true) }}>
                          <IonLabel className="ion-text-wrap">(No preferences)</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="any" onClick={() => { setOnlyShowAnyOrAll("any"); setSomethingChanged(true) }}>
                          <IonLabel>Any</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="all" onClick={() => { setOnlyShowAnyOrAll("all"); setSomethingChanged(true) }}>
                          <IonLabel  color="danger">All</IonLabel>
                        </IonSegmentButton>
                      </IonSegment>
                    </IonRow>
                    {onlyShowAnyOrAll !== "none" ? 
                    <>
                    {onlyShowAnyOrAll == "all"?
                    <>
                    {onlyShowTooRestrictive ?
                      <IonRow className="lr-pad">
                      <IonText color="danger" class="ion-padding ion-text-wrap">
                        This combination is too restrictive and will not save. Loosen your selected preferences or set to "any".
                      </IonText>
                    </IonRow> :
                     <IonRow className="lr-pad">
                     <IonText class="ion-padding ion-text-wrap">
                     <FontAwesomeIcon style={{color: "var(--ion-color-danger)"}} icon={faTriangleExclamation} /> Warning: The Only Show All preference can be very restrictive. 
                     </IonText>
                    </IonRow> 
                    }
                    </> :<></>}
                    <IonRow className="lr-pad">
                      <IonText class="ion-padding ion-text-wrap">
                        Only show my profile to to people who identify as <i>{onlyShowAnyOrAll}</i> of the following:
                      </IonText>
                      </IonRow>
                      <IonRow>

                      <IonCol>
                        <IonList>
                          <IonItem>
                            <IonCheckbox slot="start" value="straight" checked={onlyshowSexualityFilterChecked.includes("straight") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                            Straight / heterosexual
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" value="gay" checked={onlyshowSexualityFilterChecked.includes("gay") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                            Gay / homosexual
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" value="lesbian" checked={onlyshowSexualityFilterChecked.includes("lesbian") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                            Lesbian
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" value="bi" checked={onlyshowSexualityFilterChecked.includes("bi") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                            Bi
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" value="pan" checked={onlyshowSexualityFilterChecked.includes("pan") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                            Pan
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" value="gray ace" checked={onlyshowSexualityFilterChecked.includes("gray ace") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                            Gray ace
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" value="ace" checked={onlyshowSexualityFilterChecked.includes("ace") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                            Ace
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" value="demi" checked={onlyshowSexualityFilterChecked.includes("demi") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                            Demisexual
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" value="queer" checked={onlyshowSexualityFilterChecked.includes("queer") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                            Queer
                          </IonItem>

                        </IonList>

                      </IonCol>
                      <IonCol>
                        <IonItem>
                          <IonCheckbox slot="start" value="man" checked={onlyshowSexualityFilterChecked.includes("man") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                          Man
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="woman" checked={onlyshowSexualityFilterChecked.includes("woman") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                          Woman
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="nb" checked={onlyshowSexualityFilterChecked.includes("nb") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                          Nonbinary / gender noncomforming
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="genderfluid" checked={onlyshowSexualityFilterChecked.includes("genderfluid") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                          Gender Fluid
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="cis" checked={onlyshowSexualityFilterChecked.includes("cis") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                          Cis
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="trans" checked={onlyshowSexualityFilterChecked.includes("trans") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                          Trans
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="intersex" checked={onlyshowSexualityFilterChecked.includes("intersex") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                          Intersex
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="mono" disabled={onlyshowSexualityFilterChecked.includes("poly")} checked={onlyshowSexualityFilterChecked.includes("mono") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                          Monogamous
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="poly" disabled={onlyshowSexualityFilterChecked.includes("mono")} checked={onlyshowSexualityFilterChecked.includes("poly") ? true : false} onIonChange={e => addOnlyShowGenderFilterCheckbox(e)} />
                          Polyamorous
                        </IonItem>

                      </IonCol>


                    </IonRow>
                    </> : <></>}
                  </div>
                </IonAccordion>
                <IonAccordion value="second">
                  <IonItem slot="header">
                    <IonLabel class="ion-text-wrap">● Only show my profile to people who do NOT identify as</IonLabel>
                    {dontshowSexualityFilterChecked.length > 0 ? <IonBadge color={(dontShowAnyOrAll == "any") ? "danger" : "primary"}>{dontshowSexualityFilterChecked.length} preferences</IonBadge> :<></>}
                  </IonItem>
                  <div slot="content">
                  <IonRow className="any-all-row">
                      <IonSegment value={dontShowAnyOrAll} style={{ width: "100%" }}>
                        <IonSegmentButton value="none" onClick={() => { setDontShowAnyOrAll("none"); setSomethingChanged(true) }}>
                          <IonLabel className="ion-text-wrap">(No preferences)</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="any" onClick={() => { setDontShowAnyOrAll("any"); setSomethingChanged(true) }}>
                          <IonLabel color="danger">Any</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="all" onClick={() => { setDontShowAnyOrAll("all"); setSomethingChanged(true) }}>
                          <IonLabel>All</IonLabel>
                        </IonSegmentButton>
                      </IonSegment>
                    </IonRow>
                    {dontShowAnyOrAll !== "none" ? 
                    <>
                    {dontShowAnyOrAll == "any"?
                    <>
                    {dontShowTooRestrictive ?
                      <IonRow className="lr-pad">
                      <IonText color="danger" class="ion-padding ion-text-wrap">
                        This combination is too restrictive and will not save. Loosen your selected preferences or set to "all".
                      </IonText>
                    </IonRow> :
                     <IonRow className="lr-pad">
                     <IonText class="ion-padding ion-text-wrap">
                     <FontAwesomeIcon style={{color: "var(--ion-color-danger)"}} icon={faTriangleExclamation} /> Warning: The Don't Show Any preference can be very restrictive. 
                     </IonText>
                    </IonRow> 
                    }
                    </> :<></>}
                    <IonRow className="lr-pad">
                      <IonText class="ion-padding ion-text-wrap">
                        Only show my profile to people who do NOT identify as <i>{dontShowAnyOrAll}</i> of the following:
                      </IonText>
                    </IonRow>
                    <IonRow>

                      <IonCol>
                        <IonList>
                          <IonItem>
                            <IonCheckbox slot="start" disabled={dontshowSexualityFilterChecked.includes("gay") || dontshowSexualityFilterChecked.includes("lesbian")}  value="straight" checked={dontshowSexualityFilterChecked.includes("straight") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                            Straight / heterosexual
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" disabled={dontshowSexualityFilterChecked.includes("straight") } value="gay" checked={dontshowSexualityFilterChecked.includes("gay") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                            Gay / homosexual
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" disabled={dontshowSexualityFilterChecked.includes("straight") } value="lesbian" checked={dontshowSexualityFilterChecked.includes("lesbian") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                            Lesbian
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" value="bi" checked={dontshowSexualityFilterChecked.includes("bi") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                            Bi
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" value="pan" checked={dontshowSexualityFilterChecked.includes("pan") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                            Pan
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" value="gray ace" checked={dontshowSexualityFilterChecked.includes("gray ace") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                            Gray ace
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" value="ace" checked={dontshowSexualityFilterChecked.includes("ace") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                            Ace
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" value="demi" checked={dontshowSexualityFilterChecked.includes("demi") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                            Demisexual
                          </IonItem>
                          <IonItem>
                            <IonCheckbox slot="start" value="queer" checked={dontshowSexualityFilterChecked.includes("queer") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                            Queer
                          </IonItem>

                        </IonList>

                      </IonCol>
                      <IonCol>
                        <IonItem>
                          <IonCheckbox slot="start" value="man" disabled={dontshowSexualityFilterChecked.includes("woman")} checked={dontshowSexualityFilterChecked.includes("man") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                          Man
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="woman" disabled={dontshowSexualityFilterChecked.includes("man")} checked={dontshowSexualityFilterChecked.includes("woman") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                          Woman
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="nb" checked={dontshowSexualityFilterChecked.includes("nb") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                          Nonbinary / gender noncomforming
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="genderfluid"  checked={dontshowSexualityFilterChecked.includes("genderfluid") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                          Gender Fluid
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="cis" disabled={dontshowSexualityFilterChecked.includes("trans")} checked={dontshowSexualityFilterChecked.includes("cis") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                          Cis
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="trans" disabled={dontshowSexualityFilterChecked.includes("cis")} checked={dontshowSexualityFilterChecked.includes("trans") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                          Trans
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="intersex" checked={dontshowSexualityFilterChecked.includes("intersex") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                          Intersex
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="mono" disabled={dontshowSexualityFilterChecked.includes("poly")} checked={dontshowSexualityFilterChecked.includes("mono") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                          Monogamous
                        </IonItem>
                        <IonItem>
                          <IonCheckbox slot="start" value="poly"  disabled={dontshowSexualityFilterChecked.includes("mono")} checked={dontshowSexualityFilterChecked.includes("poly") ? true : false} onIonChange={e => addDontShowGenderFilterCheckbox(e)} />
                          Polyamorous
                        </IonItem>

                      </IonCol>


                    </IonRow>
                    </>
                    :<></>}
                  </div>
                </IonAccordion>

              </IonAccordionGroup>
              <IonRow className="lr-pad">
                <IonText style={{fontSize: "10pt"}} class="ion-padding ion-text-wrap">
                  *Using visibility preferences does not guarantee that your profile will only be shown to people with your choices. 
                  Members self-select any number of attributes and can change them at any time. 
                  Using preferences should not lower the caution you take in what you reveal on your profile. 
                  Please check out our How Tos for specific examples and our 
                  <a href="https://refreshconnections.com/communitysafety"> Community Safety guidelines</a> for more information about best safety practices. 
                </IonText>
              </IonRow>
            </IonGrid>
          </IonAccordion>
        </IonAccordionGroup>
        <IonRow className="ion-justify-content-center" style={{ paddingBottom: "30pt" }}>
          <IonButton onClick={handleDone}>
            Done
          </IonButton>
        </IonRow>

      </IonContent>
    </IonPage >
  )
};

export default AdvancedFilterModal;
