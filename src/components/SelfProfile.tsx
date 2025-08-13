import {

    IonLabel,
    IonItem,
    IonAccordion,
    IonAccordionGroup,
    IonRow, IonGrid, IonCol,
    IonCard, IonCardContent,
    IonButton,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    IonList,
    IonNote,
    useIonModal,
    IonTextarea,
    IonText,
    IonBadge,
    IonToggle,
    useIonAlert
} from '@ionic/react';
import React, { useEffect, useState } from 'react'
import "./SelfProfile.css"


import { updateCurrentUserProfile } from '../hooks/utilities';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconProp } from '@fortawesome/fontawesome-svg-core';


// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import { faFaceViewfinder, faX, faCheck, faInfoSquare, faEllipsis, faStar } from '@fortawesome/pro-solid-svg-icons';
import CroppedImageModal from './CroppedImageModal';
import ProfileModal from './ProfileModal';
import LoadingCard from './LoadingCard';
import EditPhotoGridRow from './EditPhotoGridRow';
import EditLocationModal from './EditLocationModal';
import EditUsernameModal from './EditUsernameModal';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useQueryClient } from "@tanstack/react-query";




interface Hi {
    pronouns?: string,
    bio?: string,
    location?: string,
    job?: string,
    politics?: string,
    school?: string,
    sexualOrientation?: string,
    gender_and_sexuality_info?: string,
    hometown?: string,
    height?: string,
    alcohol?: string,
    cigarettes?: string,
    looking_for?: string[],
    gender_sexuality_choices?: string[],
    long_covid_choices?: string[],
    covid_precautions?: number[],
    covid_precaution_info?: string,
    kids_info?: string,

    settings_show_gender_sexuality?: boolean,
    settings_show_long_covid?: boolean,

    together_idea?: string,
    freetime?: string,
    hobby?: string,
    petpeeve?: string,
    talent?: string


    fave_book?: string,
    fave_movie?: string,
    fave_tv?: string,
    fave_topic?: string,
    fave_musicalartist?: string,
    fave_game?: string,
    fave_album?: string,
    fave_sport_watch?: string,
    fave_sport_play?: string,

    fixation_book?: string,
    fixation_movie?: string,
    fixation_tv?: string,
    fixation_topic?: string,
    fixation_musicalartist?: string,
    fixation_game?: string,
    fixation_album?: string,

    created_profile?: boolean,
}

const SelfProfile: React.FC = () => {

    // tanstack query
    const currentUserProfile = useGetCurrentProfile().data;
    const queryClient = useQueryClient()
    


    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<null | string>(null);
    const [image, setImage] = useState<any>(null);
    const [imageName, setImageName] = useState<string | null>(null);
    const [picDb, setPicDB] = useState<any>(null);
    const [profileCardData, setProfileCardData] = useState<any>(null);


    const [pronouns, setPronouns] = useState("");
    const [pronounsSelector, setPronounsSelector] = useState("");
    const [genderandsexualityinfo, setgenderandsexualityinfo] = useState("");
    const [customPronouns, setCustomPronouns] = useState("");
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");
    const [job, setJob] = useState("");
    const [politics, setPolitics] = useState("");
    const [school, setSchool] = useState("");
    const [sexualOrientation, setSexualOrientation] = useState("");
    const [hometown, setHometown] = useState("");
    const [height, setHeight] = useState("");
    const [heightFeet, setHeightFeet] = useState("");
    const [heightInches, setHeightInches] = useState("");
    const [alcohol, setAlcohol] = useState("");
    const [cigarettes, setCigarettes] = useState("");
    const [covidPrecautionInfo, setCovidPrecautionInfo] = useState("");
    const [kidsInfo, setKidsInfo] = useState("");

    const [togetherIdea, setTogetherIdea] = useState("");
    const [freetime, setFreetime] = useState("");
    const [hobby, setHobby] = useState("");
    const [petPeeve, setPetPeeve] = useState("");
    const [talents, setTalents] = useState("");


    const [faveBook, setFaveBook] = useState("");
    const [faveTv, setFaveTv] = useState("");
    const [faveTopic, setFaveTopic] = useState("");
    const [faveMovie, setFaveMovie] = useState("");
    const [faveAlbum, setFaveAlbum] = useState("");
    const [faveMusicalArtist, setFaveMusicalArtist] = useState("");
    const [faveGame, setFaveGame] = useState("");
    const [faveSportWatch, setFaveSportWatch] = useState("");
    const [faveSportPlay, setFaveSportPlay] = useState("");

    const [currMovie, setCurrMovie] = useState("");
    const [currTopic, setCurrTopic] = useState("");
    const [currBook, setCurrBook] = useState("");
    const [currTv, setCurrTv] = useState("");
    const [currAlbum, setCurrAlbum] = useState("");
    const [currMusicalArtist, setCurrMusicalArtist] = useState("");
    const [currGame, setCurrGame] = useState("");


    const [editpronouns, seteditPronouns] = useState(false);
    const [editbio, seteditBio] = useState(false);
    const [editlocation, seteditLocation] = useState(false);
    const [editjob, seteditJob] = useState(false);
    const [editpolitics, seteditPolitics] = useState(false);
    const [editschool, seteditSchool] = useState(false);
    const [editgenderandsexualityinfo, seteditgenderandsexualityinfo] = useState(false);
    const [editsexualOrientation, seteditSexualOrientation] = useState(false);
    const [edithometown, seteditHometown] = useState(false);
    const [editheight, seteditHeight] = useState(false);
    const [editalcohol, seteditAlcohol] = useState(false);
    const [editcigarettes, seteditCigarettes] = useState(false);
    const [editlookingFor, seteditLookingFor] = useState(false);
    const [editcovidPrecautions, seteditCovidPrecautions] = useState(false);
    const [editcovidPrecautionInfo, seteditCovidPrecautionInfo] = useState(false);
    const [edittogetherIdea, seteditTogetherIdea] = useState(false);
    const [editfreetime, seteditFreetime] = useState(false);
    const [edithobby, seteditHobby] = useState(false);
    const [editpetPeeve, seteditPetPeeve] = useState(false);
    const [edittalents, seteditTalents] = useState(false);
    const [editkidsinfo, seteditKidsInfo] = useState(false);

    const [editLCSupport, seteditLCSupport] = useState(false);
    const [editGSChoices, seteditGSChoices] = useState(false);

    const [editfaveBook, seteditFaveBook] = useState(false);
    const [editfaveTv, seteditFaveTv] = useState(false);
    const [editfaveTopic, seteditFaveTopic] = useState(false);
    const [editfaveMovie, seteditFaveMovie] = useState(false);
    const [editfaveAlbum, seteditFaveAlbum] = useState(false);
    const [editfaveMusicalArtist, seteditFaveMusicalArtist] = useState(false);
    const [editfaveGame, seteditFaveGame] = useState(false);
    const [editfaveSportWatch, seteditFaveSportWatch] = useState(false);
    const [editfaveSportPlay, seteditFaveSportPlay] = useState(false);


    const [editcurrMovie, seteditCurrMovie] = useState(false);
    const [editcurrTopic, seteditCurrTopic] = useState(false);
    const [editcurrBook, seteditCurrBook] = useState(false);
    const [editcurrTv, seteditCurrTv] = useState(false);
    const [editcurrAlbum, seteditCurrAlbum] = useState(false);
    const [editcurrMusicalArtist, seteditCurrMusicalArtist] = useState(false);
    const [editcurrGame, seteditCurrGame] = useState(false);

    const lookingForChecked: string[] = currentUserProfile?.looking_for;
    const covidPrecautionsChecked: number[] = currentUserProfile?.covid_precautions;

    const lcSupportChecked: string[] = currentUserProfile?.long_covid_choices
    const genderSexualityChecked: string[] = currentUserProfile?.gender_sexuality_choices
    const [lcCount, setLcCount] = useState(0);
    const [gsCount, setGsCount] = useState(0);

    const [showLongCovid, setShowLongCovid] = useState(currentUserProfile?.settings_show_long_covid);
    const [showProBanner, setShowProBanner] = useState(currentUserProfile?.settings_profile_banner_bool);
    const [showGenderSexuality, setShowGenderSexuality] = useState(currentUserProfile?.settings_show_gender_sexuality);

    const [presentShowContactSupportAlert] = useIonAlert();






    useEffect(() => {

        setBio(currentUserProfile?.bio)
        setCovidPrecautionInfo(currentUserProfile?.covid_precaution_info)
        setSchool(currentUserProfile?.school)
        setJob(currentUserProfile?.job)
        setHometown(currentUserProfile?.hometown)
        setPolitics(currentUserProfile?.politics)
        setgenderandsexualityinfo(currentUserProfile?.gender_and_sexuality_info)
        setKidsInfo(currentUserProfile?.kids_info)

        setFreetime(currentUserProfile?.freetime)
        setTogetherIdea(currentUserProfile?.together_idea)
        setHobby(currentUserProfile?.hobby)
        setPetPeeve(currentUserProfile?.petpeeve)
        setTalents(currentUserProfile?.talent)

        setFaveBook(currentUserProfile?.fave_book)
        setFaveMovie(currentUserProfile?.fave_movie)
        setFaveTopic(currentUserProfile?.fave_topic)
        setFaveTv(currentUserProfile?.fave_tv)
        setFaveSportWatch(currentUserProfile?.fave_sport_watch)
        setFaveSportPlay(currentUserProfile?.fave_sport_play)
        setFaveAlbum(currentUserProfile?.fave_album)
        setFaveMusicalArtist(currentUserProfile?.fave_musical_artist)
        setFaveGame(currentUserProfile?.fave_game)

        setCurrBook(currentUserProfile?.fixation_book)
        setCurrMovie(currentUserProfile?.fixation_movie)
        setCurrTopic(currentUserProfile?.fixation_topic)
        setCurrTv(currentUserProfile?.fixation_tv)
        setCurrAlbum(currentUserProfile?.fixation_album)
        setCurrMusicalArtist(currentUserProfile?.fixation_musical_artist)
        setCurrGame(currentUserProfile?.fixation_game)

        setShowLongCovid(currentUserProfile?.settings_show_long_covid)
        setShowProBanner(currentUserProfile?.settings_profile_banner_bool)
        setShowGenderSexuality(currentUserProfile?.settings_show_gender_sexuality)

    }, [currentUserProfile]);

    const showContactSupport = async (field: string, field2: string) => {
        presentShowContactSupportAlert({
          header: `To keep our community authentic, we require you to contact support if you need to update your ${field}.`,
          subHeader: `Please use our Help feature and include what you would like your ${field2} updated to.`,
          buttons: [
            {
              text: 'Nevermind',
              role: 'cancel',
            },
            {
              text: 'Get Help',
              handler: () => {
                window.location.href = "/help";
              }
            }
          ],
        })
      }



    function updateData() {
        let form_data: Hi = {};

        if (editpronouns && pronounsSelector) {
            if (pronounsSelector == "custom") {
                form_data.pronouns = customPronouns
            }
            else {
                form_data.pronouns = pronounsSelector
            }
        }
        if (editbio) {
            form_data.bio = bio
        }
        if (editlocation) {
            form_data.location = location
        }
        if (editjob) {
            form_data.job = job
        }
        if (editpolitics) {
            form_data.politics = politics
        }
        if (editkidsinfo) {
            form_data.kids_info = kidsInfo
        }
        if (editschool) {
            form_data.school = school
        }
        if (editsexualOrientation) {
            form_data.sexualOrientation = sexualOrientation
        }
        if (editgenderandsexualityinfo) {
            form_data.gender_and_sexuality_info = genderandsexualityinfo
        }
        if (edithometown) {
            form_data.hometown = hometown
        }
        if (editheight) {
            if (heightFeet) {
                form_data.height = heightFeet + "'" + heightInches
            }
        }
        if (editalcohol) {
            form_data.alcohol = alcohol
        }
        if (editcigarettes) {
            form_data.cigarettes = cigarettes
        }
        if (editlookingFor) {
            console.log("LFC self profile", lookingForChecked)
            form_data.looking_for = lookingForChecked
        }
        if (editcovidPrecautions) {
            console.log("CP self profile", lookingForChecked)
            form_data.covid_precautions = covidPrecautionsChecked
        }
        if (editGSChoices) {
            form_data.gender_sexuality_choices = genderSexualityChecked
        }
        if (editLCSupport) {
            form_data.long_covid_choices = lcSupportChecked
        }
        if (editcovidPrecautionInfo) {
            form_data.covid_precaution_info = covidPrecautionInfo
        }
        if (editfreetime) {
            form_data.freetime = freetime
        }
        if (edittogetherIdea) {
            form_data.together_idea = togetherIdea
        }
        if (edithobby) {
            form_data.hobby = hobby
        }
        if (editpetPeeve) {
            form_data.petpeeve = petPeeve
        }
        if (edittalents) {
            form_data.talent = talents
        }
        if (editfaveBook) {
            form_data.fave_book = faveBook
        }
        if (editfaveMovie) {
            form_data.fave_movie = faveMovie
        }
        if (editfaveTv) {
            form_data.fave_tv = faveTv
        }
        if (editfaveTopic) {
            form_data.fave_topic = faveTopic
        }
        if (editfaveAlbum) {
            form_data.fave_album = faveAlbum
        }
        if (editfaveMusicalArtist) {
            form_data.fave_musicalartist = faveMusicalArtist
        }
        if (editfaveGame) {
            form_data.fave_game = faveGame
        }
        if (editfaveSportPlay) {
            form_data.fave_sport_play = faveSportPlay
        }
        if (editfaveSportWatch) {
            form_data.fave_sport_watch = faveSportWatch
        }
        if (editcurrBook) {
            form_data.fixation_book = currBook
        }
        if (editcurrMovie) {
            form_data.fixation_movie = currMovie
        }
        if (editcurrTv) {
            form_data.fixation_tv = currTv
        }
        if (editcurrTopic) {
            form_data.fixation_topic = currTopic
        }
        if (editcurrAlbum) {
            form_data.fixation_album = currAlbum
        }
        if (editcurrMusicalArtist) {
            form_data.fixation_musicalartist = currMusicalArtist
        }
        if (editcurrGame) {
            form_data.fixation_game = currGame
        }

        return form_data;
    }

    const clearEdits = async () => {
        console.log("clear the edits!")

        setPronouns("")
        seteditPronouns(false)
        setPronounsSelector("")
        setCustomPronouns("")
        setBio("")
        seteditBio(false)
        setLocation("")
        seteditLocation(false)
        setJob("")
        seteditJob(false)
        setPolitics("")
        seteditPolitics(false)
        setSchool("")
        seteditSchool(false)
        setgenderandsexualityinfo("")
        seteditgenderandsexualityinfo(false)
        setSexualOrientation("")
        seteditSexualOrientation(false)
        setHometown("")
        seteditHometown(false)
        setHeight("")
        seteditHeight(false)
        setHeightFeet("")
        setHeightInches("")
        setAlcohol("")
        seteditAlcohol(false)
        setCigarettes("")
        seteditCigarettes(false)
        seteditCovidPrecautions(false)
        seteditCovidPrecautionInfo(false)
        setCovidPrecautionInfo("")
        seteditLookingFor(false)
        setKidsInfo("")
        seteditKidsInfo(false)
        setFreetime("")
        seteditFreetime(false)
        setTogetherIdea("")
        seteditTogetherIdea(false)
        setHobby("")
        seteditHobby(false)
        setPetPeeve("")
        seteditPetPeeve(false)
        setTalents("")
        seteditTalents(false)

        setFaveBook("")
        setFaveMovie("")
        setFaveTopic("")
        setFaveTv("")
        setFaveMusicalArtist("")
        setFaveAlbum("")
        setFaveGame("")
        setFaveSportWatch("")
        setFaveSportPlay("")
        seteditFaveBook(false)
        seteditFaveMovie(false)
        seteditFaveTopic(false)
        seteditFaveTv(false)
        seteditFaveMusicalArtist(false)
        seteditFaveAlbum(false)
        seteditFaveGame(false)
        seteditFaveSportWatch(false)
        seteditFaveSportPlay(false)

        seteditGSChoices(false)
        seteditLCSupport(false)

        setCurrBook("")
        setCurrMovie("")
        setCurrTopic("")
        setCurrTv("")
        setCurrMusicalArtist("")
        setCurrAlbum("")
        setCurrGame("")
        seteditCurrBook(false)
        seteditCurrMovie(false)
        seteditCurrTopic(false)
        seteditCurrTv(false)
        seteditCurrMusicalArtist(false)
        seteditCurrAlbum(false)
        seteditCurrGame(false)
    }

    //Adds the checkedbox to the array and check if you unchecked it
    const addCovidPrecautionsCheckbox = (event: any) => {
        if (event.detail.checked) {
            covidPrecautionsChecked.push(event.detail.value);
        } else {
            let index = removeCovidPrecautionsCheckedFromArray(event.detail.value);
            covidPrecautionsChecked.splice(index, 1);
        }
    }

    //Removes checkbox from array when you uncheck it
    const removeCovidPrecautionsCheckedFromArray = (checkbox: number) => {
        return covidPrecautionsChecked.findIndex((category) => {
            return category === checkbox;
        })
    }


    //Adds the checkedbox to the array and check if you unchecked it
    const addLookingForCheckbox = (event: any) => {
        if (event.detail.checked) {
            lookingForChecked.push(event.detail.value);
        } else {
            let index = removelookingForCheckedFromArray(event.detail.value);
            lookingForChecked.splice(index, 1);
        }
    }

    //Removes checkbox from array when you uncheck it
    const removelookingForCheckedFromArray = (checkbox: string) => {
        return lookingForChecked.findIndex((category) => {
            return category === checkbox;
        })
    }


    const updateProfile = async () => {
        // pass form data in here

        const response = await updateCurrentUserProfile(updateData())

        // setData(await getCurrentUserProfile())
        await clearEdits()
        queryClient.invalidateQueries({ queryKey: ['current'] })

        console.log("after reload", response)
    }

    const updateProfileSingle = async (setstate: any) => {
        // pass form data in here

        const response = await updateCurrentUserProfile(updateData())

        setstate(false)
        queryClient.invalidateQueries({ queryKey: ['current'] })

        console.log("after single update reload", response)
    }

    const [profilePresent, profileDismiss] = useIonModal(ProfileModal, {
        cardData: currentUserProfile,
        pro: true,
        settingsAlt: true,
        profiletype: "self",
        yourName: currentUserProfile?.name || "",
        onDismiss: (data: string, role: string) => profileDismiss(data, role),
    });

    const openModal = (item: any) => {
        updateProfile()
        setProfileCardData(item)
        profilePresent();
    }

    const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

    const handleDismiss = async () => {
        setLoading(true)
        cropDismiss()
        console.log("Waiting 3 seconds to reload image ")
        await delay(3000);
        await updateProfile()
        setLoading(false)
    }

    const [cropPresent, cropDismiss] = useIonModal(CroppedImageModal, {
        image: image,
        picDb: picDb,
        imageName: imageName,
        onDismiss: handleDismiss
    });

    const handleLocationDismiss = async () => {
        locationDismiss();
    }

    const [locationPresent, locationDismiss] = useIonModal(EditLocationModal, {
        onDismiss: handleLocationDismiss
    });

    const handleUsernameDismiss = async () => {
        usernameDismiss();
    }

    const [usernamePresent, usernameDismiss] = useIonModal(EditUsernameModal, {
        onDismiss: handleUsernameDismiss
    });


    const anyEdits = () => {

        if (editpronouns || editheight || edithobby || edithometown || editjob || editlocation || editlookingFor || editsexualOrientation || editpetPeeve || editpolitics || editschool || editfreetime || edittogetherIdea || edittalents || editalcohol || editbio || editgenderandsexualityinfo || editcigarettes || editcovidPrecautionInfo || editcovidPrecautions || editcurrAlbum || editcurrBook || editcurrGame || editcurrMovie || editcurrMusicalArtist || editcurrTopic || editcurrTv || editfaveAlbum || editfaveBook || editfaveGame || editfaveMovie || editfaveMusicalArtist || editfaveSportPlay || editfaveSportWatch || editfaveTopic || editfaveTv) {
            return true
        }
        else {
            return false
        }
    }

    //Adds the checkedbox to the array and check if you unchecked it
    const addGenderSexualityCheckbox = (event: any) => {
        if (event.detail.checked) {
            genderSexualityChecked.push(event.detail.value);
            setGsCount(gsCount + 1)
        } else {
            let index = removeGenderSexualityFilterCheckedFromArray(event.detail.value);
            genderSexualityChecked.splice(index, 1);
            setGsCount(gsCount - 1)
        }
    }

    //Removes checkbox from array when you uncheck it
    const removeGenderSexualityFilterCheckedFromArray = (checkbox: string) => {
        return genderSexualityChecked.findIndex((category: string) => {
            return category === checkbox;
        })
    }

    //Adds the checkedbox to the array and check if you unchecked it
    const addLCFilterCheckbox = (event: any) => {
        if (event.detail.checked) {
            lcSupportChecked.push(event.detail.value);
            setLcCount(lcCount + 1)
        } else {
            let index = removeLCFilterCheckedFromArray(event.detail.value);
            lcSupportChecked.splice(index, 1);
            setLcCount(lcCount - 1)
        }
    }

    //Removes checkbox from array when you uncheck it
    const removeLCFilterCheckedFromArray = (checkbox: string) => {
        return lcSupportChecked.findIndex((category: string) => {
            return category === checkbox;
        })
    }


    const showGenderSexualityHandler = async (checkbox: any) => {
        setShowGenderSexuality(checkbox)
        await updateCurrentUserProfile({ "settings_show_gender_sexuality": checkbox })

    }

    const showLongCovidHandler = async (checkbox: any) => {
        setShowLongCovid(checkbox)
        await updateCurrentUserProfile({ "settings_show_long_covid": checkbox })

    }


    const showProBannerHandler = async (checkbox: any) => {
        setShowProBanner(checkbox)
        await updateCurrentUserProfile({ "settings_profile_banner_bool": checkbox })

    }

    if (currentUserProfile) {

        return (
            <div>
                <IonCard className="margins">
                    <IonRow class="ion-justify-content-center">
                        <IonButton onClick={async () => openModal(currentUserProfile)} class="ion-text-wrap">
                            <FontAwesomeIcon icon={faFaceViewfinder as IconProp} />
                            &nbsp; See how others see your profile
                        </IonButton>
                    </IonRow>
                    <IonCardContent class="no-gutter">
                        <IonGrid class="editgrid">
                            <IonAccordionGroup>
                                <IonAccordion value="first" class="not-the-bottom">
                                    <IonItem slot="header" lines="none">
                                        <IonLabel>The Basics</IonLabel>
                                    </IonItem>
                                    <IonCardContent class="no-padding-cc " slot="content">
                                        <IonItem>
                                            <IonLabel><p>Name:</p> <h2>{currentUserProfile.name}</h2> </IonLabel>
                                            <IonButton fill="outline"  color="primary" onClick={() => showContactSupport('name', 'name')} slot="end">
                                                <FontAwesomeIcon icon={faEllipsis as IconProp}/>
                                            </IonButton>
                                        </IonItem>
                                        <IonItem> 
                                            <IonLabel>
                                                <p>Age:</p> <h2>{currentUserProfile.age}</h2> 
                                            </IonLabel>
                                        <IonButton fill="outline" color="primary" onClick={() => showContactSupport('age', 'birthdate')} slot="end">
                                            <FontAwesomeIcon icon={faEllipsis as IconProp} />
                                            </IonButton></IonItem>
                                        <IonItem>
                                            <IonLabel><p>Location:</p> <h2>{currentUserProfile.location}</h2> </IonLabel>
                                            <IonButton color="primary" onClick={() => locationPresent()} slot="end">
                                                Edit
                                            </IonButton>
                                        </IonItem>
                                        <IonItem>
                                            <IonLabel><p>Refreshments username:</p> <h2>{currentUserProfile.username}</h2> </IonLabel>
                                            <IonButton color="primary" onClick={() => usernamePresent()} slot="end">
                                                Edit
                                            </IonButton>
                                        </IonItem>


                                        <IonItem color={editpronouns ? "lightyellow" : ""}>
                                            <IonLabel> <p>Pronouns:</p> <h2>{currentUserProfile.pronouns}</h2> </IonLabel>
                                            {editpronouns ?
                                                <>
                                                    <IonButton color="danger" onClick={() => seteditPronouns(false)} slot="end">
                                                        <FontAwesomeIcon icon={faX} />
                                                    </IonButton>
                                                    <IonButton color="success" onClick={() => { updateProfileSingle(seteditPronouns) }} slot="end">
                                                        <FontAwesomeIcon icon={faCheck} />
                                                    </IonButton>
                                                </>
                                                :
                                                <IonButton onClick={() => seteditPronouns(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {/* {editpronouns ?
                                            <IonItem color="lightyellow">
                                                <IonInput value={pronouns}
                                                    name="pronouns"
                                                    onIonChange={e => setPronouns(e.detail.value!)}
                                                    placeholder="Update here"
                                                    type="text" />
                                            </IonItem> : null} */}

                                        {editpronouns ?
                                            <IonItem class="pronoun-select" color={editpronouns ? "lightyellow" : ""}>
                                                <IonItem color={editpronouns ? "lightyellow" : ""}>
                                                    <IonSelect placeholder="Select" onIonChange={e => setPronounsSelector(e.detail.value!)}>
                                                        <IonSelectOption value="she/her">she/her</IonSelectOption>
                                                        <IonSelectOption value="he/him">he/him</IonSelectOption>
                                                        <IonSelectOption value="they/them">they/them</IonSelectOption>
                                                        <IonSelectOption value="custom">custom</IonSelectOption>
                                                    </IonSelect>
                                                </IonItem>
                                                {pronounsSelector == "custom" ?
                                                    <IonItem color="lightyellow">
                                                        <IonInput value={customPronouns}
                                                            name="pronouns"
                                                            onIonChange={e => setCustomPronouns(e.detail.value!)}
                                                            placeholder="Update here"
                                                            maxlength={16}
                                                            type="text" />
                                                    </IonItem> : null}
                                            </IonItem> : null}



                                        <IonItem>
                                            <IonList class="looking-for-list" lines="none" className={editlookingFor ? "lightyellowitems" : ""} style={{ width: "100%" }}>
                                                <IonItem class="looking-for-list-title">
                                                    <IonLabel><p>Looking for:</p></IonLabel>
                                                    {editlookingFor ?
                                                        <>
                                                            <IonButton color="danger" onClick={() => seteditLookingFor(false)} slot="end">
                                                                <FontAwesomeIcon icon={faX} />
                                                            </IonButton>
                                                            <IonButton color="success" onClick={() => { updateProfileSingle(seteditLookingFor) }} slot="end">
                                                                <FontAwesomeIcon icon={faCheck} />
                                                            </IonButton>
                                                        </>
                                                        :
                                                        <IonButton onClick={() => seteditLookingFor(true)} slot="end">
                                                            Edit
                                                        </IonButton>

                                                    }
                                                </IonItem>
                                                <IonItem>
                                                    <IonCheckbox slot="start" value="friendship" checked={currentUserProfile.looking_for.includes("friendship") ? true : false} onIonChange={e => addLookingForCheckbox(e)} disabled={editlookingFor ? false : true} />
                                                    Friendships
                                                </IonItem>
                                                <IonItem>
                                                    <IonCheckbox slot="start" value="romance" checked={currentUserProfile.looking_for.includes("romance") ? true : false} onIonChange={e => addLookingForCheckbox(e)} disabled={editlookingFor ? false : true} />
                                                    Romance
                                                </IonItem>
                                                <IonItem>
                                                    <IonCheckbox slot="start" value="virtual connection" checked={currentUserProfile.looking_for.includes("virtual connection") ? true : false} onIonChange={e => addLookingForCheckbox(e)} disabled={editlookingFor ? false : true} />
                                                    Virtual Connection
                                                </IonItem>
                                                <IonItem>
                                                    <IonCheckbox slot="start" value="virtual only" checked={currentUserProfile.looking_for.includes("virtual only") ? true : false} onIonChange={e => addLookingForCheckbox(e)} disabled={editlookingFor ? false : true} />
                                                    Virtual Connection Only
                                                </IonItem>
                                                <IonItem>
                                                    <IonCheckbox slot="start" value="job" checked={currentUserProfile.looking_for.includes("job") ? true : false} onIonChange={e => addLookingForCheckbox(e)} disabled={editlookingFor ? false : true} />
                                                    Job
                                                </IonItem>
                                                <IonItem>
                                                    <IonCheckbox slot="start" value="housing" checked={currentUserProfile.looking_for.includes("housing") ? true : false} onIonChange={e => addLookingForCheckbox(e)} disabled={editlookingFor ? false : true} />
                                                    Housing/roommate
                                                </IonItem>
                                                <IonItem>
                                                    <IonCheckbox slot="start" value="families" checked={currentUserProfile.looking_for.includes("families") ? true : false} onIonChange={e => addLookingForCheckbox(e)} disabled={editlookingFor ? false : true} />
                                                    Families
                                                </IonItem>
                                            </IonList>
                                        </IonItem>

                                        


                                        {/* <IonItem color={editbio ? "lightyellow" : ""} >
                                        <IonLabel class="ion-text-wrap"> Bio: {currentUserProfile.bio} </IonLabel>
                                            {editbio ? 
                                                <IonTextarea value={bio}
                                                name="bio"
                                                autoGrow={true}
                                                onIonChange={e => setBio(e.detail.value!)}
                                                placeholder="New bio goes here! Say as much as you'd like (you know, up to a point)"
                                                /> : null }
                                            {editbio ? 
                                                <IonButton color="danger" onClick={()=>seteditBio(false)} slot="end">
                                                    X
                                                </IonButton>
                                            :
                                            <IonButton onClick={()=>seteditBio(true)} slot="end">
                                            Edit
                                            </IonButton>
                                            }
                                    </IonItem> */}

                                        <IonItem color={editbio ? "lightyellow" : ""}>
                                            <IonLabel class="ion-text-wrap"> <p>Bio:</p> <h2 className="css-fix">{currentUserProfile.bio}</h2> </IonLabel>
                                            {editbio ?
                                                <IonButton color="danger" onClick={() => seteditBio(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditBio(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editbio ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonTextarea value={bio}
                                                    name="bio"
                                                    onIonChange={e => setBio(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={1000}
                                                    autoCapitalize='sentences'
                                                    autoGrow={true} />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditBio) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}


                                        <IonItem color={editheight ? "lightyellow" : ""}>
                                            <IonLabel> <p>Height:</p> <h2>{currentUserProfile.height}</h2> </IonLabel>
                                            {editheight ?
                                                <>
                                                    <IonButton color="danger" onClick={async () => {await updateCurrentUserProfile({ "height": "" }); seteditHeight(false);  queryClient.invalidateQueries({ queryKey: ['current'] })}} slot="end">
                                                        <FontAwesomeIcon icon={faX} />
                                                    </IonButton>
                                                    <IonButton color="success" onClick={() => { updateProfileSingle(seteditHeight) }} slot="end">
                                                        <FontAwesomeIcon icon={faCheck} />
                                                    </IonButton>
                                                </>
                                                :
                                                <IonButton onClick={() => seteditHeight(true)} slot="end">
                                                    Edit
                                                </IonButton>

                                            }
                                        </IonItem>
                                        {editheight ?
                                            <IonItem class="height-select" color={editheight ? "lightyellow" : ""}>
                                                <IonItem color={editheight ? "lightyellow" : ""}>
                                                    <IonLabel position="floating">Feet</IonLabel>
                                                    <IonSelect onIonChange={e => setHeightFeet(e.detail.value!)}>
                                                        <IonSelectOption value="3">3</IonSelectOption>
                                                        <IonSelectOption value="4">4</IonSelectOption>
                                                        <IonSelectOption value="5">5</IonSelectOption>
                                                        <IonSelectOption value="6">6</IonSelectOption>
                                                        <IonSelectOption value="7">7</IonSelectOption>
                                                    </IonSelect>
                                                </IonItem>
                                                <IonItem color={editheight ? "lightyellow" : ""}>
                                                    <IonLabel position="floating">Inches</IonLabel>
                                                    <IonSelect onIonChange={e => setHeightInches(e.detail.value!)}>
                                                        <IonSelectOption value="0">0</IonSelectOption>
                                                        <IonSelectOption value="1">1</IonSelectOption>
                                                        <IonSelectOption value="2">2</IonSelectOption>
                                                        <IonSelectOption value="3">3</IonSelectOption>
                                                        <IonSelectOption value="4">4</IonSelectOption>
                                                        <IonSelectOption value="5">5</IonSelectOption>
                                                        <IonSelectOption value="6">6</IonSelectOption>
                                                        <IonSelectOption value="7">7</IonSelectOption>
                                                        <IonSelectOption value="8">8</IonSelectOption>
                                                        <IonSelectOption value="9">9</IonSelectOption>
                                                        <IonSelectOption value="10">10</IonSelectOption>
                                                        <IonSelectOption value="11">11</IonSelectOption>
                                                    </IonSelect>
                                                </IonItem>
                                            </IonItem> : null}

                                        <IonItem color={editjob ? "lightyellow" : ""}>
                                            <IonLabel> <p>Job:</p> <h2>{currentUserProfile.job}</h2> </IonLabel>
                                            {editjob ?
                                                <IonButton color="danger" onClick={() => seteditJob(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditJob(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editjob ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={job}
                                                    name="job"
                                                    onIonChange={e => setJob(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='words'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => updateProfileSingle(seteditJob)} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}




                                        <IonItem color={editschool ? "lightyellow" : ""}>
                                            <IonLabel> <p>School:</p> <h2>{currentUserProfile.school}</h2> </IonLabel>
                                            {editschool ?
                                                <IonButton color="danger" onClick={() => seteditSchool(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditSchool(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editschool ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={school}
                                                    name="school"
                                                    onIonChange={e => setSchool(e.detail.value!)}
                                                    placeholder="Update here"
                                                    autoCapitalize='words'
                                                    maxlength={80}
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditSchool) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                            <IonItem color={editkidsinfo ? "lightyellow" : ""}>
                                            <IonLabel> <p>Kids info:</p> <h2>{currentUserProfile?.kids_info}</h2> </IonLabel>
                                            {editkidsinfo ?
                                                <>
                                                    <IonButton color="danger" onClick={() => seteditKidsInfo(false)} slot="end">
                                                        <FontAwesomeIcon icon={faX} />
                                                    </IonButton>
                                                    <IonButton color="success" onClick={() => { updateProfileSingle(seteditKidsInfo) }} slot="end">
                                                        <FontAwesomeIcon icon={faCheck} />
                                                    </IonButton>
                                                </>
                                                :
                                                <IonButton onClick={() => seteditKidsInfo(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                            {editkidsinfo ?
                                            <IonItem class="kids-select" color={editkidsinfo ? "lightyellow" : ""}>
                                                <IonItem color={editkidsinfo ? "lightyellow" : ""}>
                                                    <IonSelect placeholder="Select" onIonChange={e => setKidsInfo(e.detail.value!)}>
                                                        <IonSelectOption value="I'm a parent">I'm a parent</IonSelectOption>
                                                        <IonSelectOption value="I'm a parent and am open to having more children">I'm a parent and am open to having more children</IonSelectOption>
                                                        <IonSelectOption value="I'm open to having children">I'm open to having children</IonSelectOption>
                                                        <IonSelectOption value="I definitely want children">I definitely want children</IonSelectOption>
                                                        <IonSelectOption value="I don't want children">I don't want children</IonSelectOption>
                                                        <IonSelectOption value="">(leave this part blank)</IonSelectOption>
                                                    </IonSelect>
                                                </IonItem>
                                            </IonItem> : null}

                                        <IonItem color={edithometown ? "lightyellow" : ""}>
                                            <IonLabel> <p>Hometown:</p> <h2>{currentUserProfile.hometown}</h2> </IonLabel>
                                            {edithometown ?
                                                <IonButton color="danger" onClick={() => seteditHometown(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditHometown(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {edithometown ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={hometown}
                                                    name="hometown"
                                                    onIonChange={e => setHometown(e.detail.value!)}
                                                    placeholder="Update here"
                                                    autoCapitalize='words'
                                                    maxlength={80}
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditHometown) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}


                                        <IonItem color={editpolitics ? "lightyellow" : ""}>
                                            <IonLabel> <p>Politics:</p> <h2>{currentUserProfile.politics}</h2> </IonLabel>
                                            {editpolitics ?
                                                <IonButton color="danger" onClick={() => seteditPolitics(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditPolitics(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editpolitics ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={politics}
                                                    name="politics"
                                                    onIonChange={e => setPolitics(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='sentences'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditPolitics) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}
                                            

                                            <IonAccordionGroup className="in-list">
                                            <IonAccordion>
                                                <IonItem slot="header"><IonLabel><p>Gender and Sexuality:</p><h2>{genderSexualityChecked.length} selected</h2></IonLabel>
                                                </IonItem>

                                                <IonGrid className="filter-grid" slot="content">

                                                    <IonRow>
                                                        <IonRow style={{ paddingLeft: "15pt" }}>
                                                            <IonText className="ion-text-wrap">
                                                                <p> These choices are used when other members filter their Picks. You can choose whether or not to show them on your profile.</p>
                                                            </IonText>
                                                            <IonItem lines="none">
                                                                <IonLabel color="black"><p>Show on profile? {showGenderSexuality == true ? "Yes" : "No"}</p></IonLabel>
                                                                <IonToggle slot="end"
                                                                    onIonChange={async e => await showGenderSexualityHandler(e.detail.checked)}
                                                                    checked={showGenderSexuality}>
                                                                </IonToggle>
                                                            </IonItem>

                                                            <IonItem lines="none" style={{ width: "90%" }}>
                                                                <IonLabel color="black"><p>I am:</p></IonLabel>
                                                                {editGSChoices ?
                                                                    <>
                                                                        <IonButton color="danger" onClick={() => seteditGSChoices(false)} slot="end">
                                                                            <FontAwesomeIcon icon={faX} />
                                                                        </IonButton>
                                                                        <IonButton color="success" onClick={() => { updateProfileSingle(seteditGSChoices) }} slot="end">
                                                                            <FontAwesomeIcon icon={faCheck} />
                                                                        </IonButton>
                                                                    </>
                                                                    :
                                                                    <IonButton onClick={() => seteditGSChoices(true)} slot="end">
                                                                        Edit
                                                                    </IonButton>
                                                                }
                                                            </IonItem>
                                                        </IonRow>




                                                        <IonGrid>
                                                            <IonRow>

                                                                <IonCol>
                                                                    <IonList className={editGSChoices ? "lightyellowitems" : ""}>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="straight" checked={currentUserProfile.gender_sexuality_choices.includes("straight") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Straight/heterosexual
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="gay" checked={currentUserProfile.gender_sexuality_choices.includes("gay") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Gay/homosexual
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="lesbian" checked={currentUserProfile.gender_sexuality_choices.includes("lesbian") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Lesbian
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="bi" checked={currentUserProfile.gender_sexuality_choices.includes("bi") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Bi
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="pan" checked={currentUserProfile.gender_sexuality_choices.includes("pan") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Pan
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="gray ace" checked={currentUserProfile.gender_sexuality_choices.includes("gray ace") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Gray ace
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="ace" checked={currentUserProfile.gender_sexuality_choices.includes("ace") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Ace
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="demi" checked={currentUserProfile.gender_sexuality_choices.includes("demi") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Demisexual
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="queer" checked={currentUserProfile.gender_sexuality_choices.includes("queer") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Queer
                                                                        </IonItem>

                                                                    </IonList>

                                                                </IonCol>
                                                                <IonCol>
                                                                    <IonList className={editGSChoices ? "lightyellowitems" : ""}>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="man" checked={currentUserProfile.gender_sexuality_choices.includes("man") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Man
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="woman" checked={currentUserProfile.gender_sexuality_choices.includes("woman") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Woman
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="nb" checked={currentUserProfile.gender_sexuality_choices.includes("nb") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Nonbinary/gender noncomforming
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="genderfluid" checked={currentUserProfile.gender_sexuality_choices.includes("genderfluid") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Gender Fluid
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="cis" checked={currentUserProfile.gender_sexuality_choices.includes("cis") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Cis
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="trans" checked={currentUserProfile.gender_sexuality_choices.includes("trans") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Trans
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="intersex" checked={currentUserProfile.gender_sexuality_choices.includes("intersex") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Intersex
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="mono" checked={currentUserProfile.gender_sexuality_choices.includes("mono") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Monogamous
                                                                        </IonItem>
                                                                        <IonItem lines="none">
                                                                            <IonCheckbox slot="start" value="poly" checked={currentUserProfile.gender_sexuality_choices.includes("poly") ? true : false} onIonChange={e => addGenderSexualityCheckbox(e)} disabled={editGSChoices ? false : true} />
                                                                            Polyamorous
                                                                        </IonItem>
                                                                    </IonList>
                                                                </IonCol>


                                                            </IonRow>
                                                        </IonGrid>



                                                    </IonRow>
                                                </IonGrid>
                                            </IonAccordion>
                                        </IonAccordionGroup >

                                        <IonItem color={editgenderandsexualityinfo ? "lightyellow" : ""}>
                                            <IonLabel class="ion-text-wrap"> <p>More gender and sexuality info:</p> <h2 className="css-fix">{currentUserProfile.gender_and_sexuality_info}</h2> </IonLabel>
                                            {editgenderandsexualityinfo ?
                                                <IonButton color="danger" onClick={() => seteditgenderandsexualityinfo(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditgenderandsexualityinfo(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        
                                        {editgenderandsexualityinfo ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonTextarea value={genderandsexualityinfo}
                                                    name="gender_and_sexuality_info"
                                                    onIonChange={e => setgenderandsexualityinfo(e.detail.value!)}
                                                    placeholder="Update me or leave me blank!"
                                                    maxlength={200}
                                                    autoCapitalize='sentences'
                                                    autoGrow={true} />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditgenderandsexualityinfo) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                            {currentUserProfile.subscription_level !== 'none' ?
                                            <>
                                             
                                        <IonItem lines="none">
                                            <IonLabel><p>Banner: &nbsp;<FontAwesomeIcon color="var(--ion-color-medium)" icon={faStar} /></p></IonLabel>
                                            
                                            </IonItem>
                                            <IonItem lines="none">
                                            <IonLabel color="black"><p>Show banner on profile? {showProBanner == true ? "Yes" : "No"}</p></IonLabel>
                                            <IonToggle slot="end"
                                                onIonChange={async e => await showProBannerHandler(e.detail.checked)}
                                                checked={showProBanner}>
                                            </IonToggle>
                                            </IonItem>
                                        <IonItem>
                                       
                                        <IonSelect disabled={!showProBanner} placeholder="Select" value={currentUserProfile?.settings_profile_banner} onIonChange={async (e)=> {await updateCurrentUserProfile({settings_profile_banner: e.detail.value!}); queryClient.invalidateQueries({ queryKey: ['current'] })} }>
                                            <IonSelectOption value="putting-money">putting my money where my mask is</IonSelectOption>
                                            <IonSelectOption value="salting-the-vibes">Salting the Vibes</IonSelectOption>
                                            <IonSelectOption value="lc-aware">Long Covid Awareness</IonSelectOption>
                                            <IonSelectOption value="conscientious-sexy">conscientious is the new sexy</IonSelectOption>
                                            <IonSelectOption value="happy-pride">happy pride!</IonSelectOption>
                                            <IonSelectOption value="fresh-air">I heart fresh air</IonSelectOption>
                                            <IonSelectOption value="dream-big">Mask up, dream big</IonSelectOption>
                                            <IonSelectOption value="disability-pride">Disability Pride</IonSelectOption>
                                            <IonSelectOption value="ready-connect">Ready to connect</IonSelectOption>
                                            <IonSelectOption value="freshies">(freshies)</IonSelectOption>
                                        </IonSelect>
                                    </IonItem>
                                    </>
                                        :<></>}





                                        {/* <IonItem color={editalcohol ? "lightyellow" : "default"}>
                                        <IonLabel > Alcohol: {data.alcohol} </IonLabel>
                                        {editalcohol ? 
                                            <IonSelect onIonChange={e => setAlcohol(e.detail.value!)}>
                                            <IonSelectOption value="Yes">Yes</IonSelectOption>
                                            <IonSelectOption value="Sometimes">Sometimes</IonSelectOption>
                                            <IonSelectOption value="Rarely">Rarely</IonSelectOption>
                                            <IonSelectOption value="No">No</IonSelectOption>
                                            </IonSelect> : null }
                                        {editalcohol ? 
                                            <IonButton color="danger" onClick={()=>seteditAlcohol(false)} slot="end">
                                                X
                                            </IonButton>
                                         :
                                        <IonButton onClick={()=>seteditAlcohol(true)} slot="end">
                                        Edit
                                        </IonButton>
                                        }
                                    </IonItem>
                                    <IonItem color={editcigarettes ? "lightyellow" : "default"}>
                                        <IonLabel> Cigarettes: {data.cigarettes} </IonLabel>
                                        {editcigarettes ? 
                                            <IonSelect onIonChange={e => setCigarettes(e.detail.value!)}>
                                            <IonSelectOption value="Yes">Yes</IonSelectOption>
                                            <IonSelectOption value="Sometimes">Sometimes</IonSelectOption>
                                            <IonSelectOption value="Rarely">Rarely</IonSelectOption>
                                            <IonSelectOption value="No">No</IonSelectOption>
                                            </IonSelect>
                                            : null }
                                        {editcigarettes ? 
                                            <IonButton color="danger" onClick={()=>seteditCigarettes(false)} slot="end">
                                                X
                                            </IonButton>
                                         :
                                        <IonButton onClick={()=>seteditCigarettes(true)} slot="end">
                                        Edit
                                        </IonButton>
                                        }
                                    </IonItem> */}
                                    </IonCardContent>
                                </IonAccordion>
                            </IonAccordionGroup>
                            <IonAccordionGroup>
                                <IonAccordion value="second" class="not-the-bottom">
                                    <IonItem slot="header" lines="none">
                                        <IonLabel>Covid Behaviors</IonLabel>
                                    </IonItem>
                                    <IonCardContent class="no-padding-cc" className="ion-padding" slot="content">
                                        <IonItem>
                                            <IonLabel><p>Check all that apply:</p></IonLabel>
                                            {editcovidPrecautions ?
                                                <>
                                                    <IonButton color="danger" onClick={() => seteditCovidPrecautions(false)} slot="end">
                                                        <FontAwesomeIcon icon={faX} />
                                                    </IonButton>
                                                    <IonButton color="success" onClick={() => { updateProfileSingle(seteditCovidPrecautions) }} slot="end">
                                                        <FontAwesomeIcon icon={faCheck} />
                                                    </IonButton>
                                                </>
                                                :
                                                <IonButton onClick={() => seteditCovidPrecautions(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        <IonList lines="none" class={editcovidPrecautions ? "lightyellowitems" : ""}>
                                        <IonItem lines="none"><IonLabel>Home:</IonLabel></IonItem>
                                            
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={18} checked={currentUserProfile.covid_precautions.includes(18) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I have no routine daily exposures
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={3} checked={currentUserProfile.covid_precautions.includes(3) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I live with non-Covid cautious people
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={8} checked={currentUserProfile.covid_precautions.includes(8) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I live alone/with others that share my level of Covid caution
                                            </IonItem>
                                            <IonItem lines="none"><IonLabel>Work:</IonLabel></IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={1} checked={currentUserProfile.covid_precautions.includes(1) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I work from home
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={9} checked={currentUserProfile.covid_precautions.includes(9) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I go to work/school but always in a high quality mask
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={16} checked={currentUserProfile.covid_precautions.includes(16) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                My work requires poor/no masking
                                            </IonItem>
                                            <IonItem lines="none"><IonLabel>Play:</IonLabel></IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={2} checked={currentUserProfile.covid_precautions.includes(2) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I eat outside at restaurants with good airflow and spacing
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={15} checked={currentUserProfile.covid_precautions.includes(15) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I do takeout from restaurants
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={5} checked={currentUserProfile.covid_precautions.includes(5) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I attend outdoor events
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={12} checked={currentUserProfile.covid_precautions.includes(12) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I attend outdoor events with a mask on
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={6} checked={currentUserProfile.covid_precautions.includes(6) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I attend indoor events with a mask on
                                            </IonItem>
                                            <IonItem lines="none"><IonLabel>Other:</IonLabel></IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={4} checked={currentUserProfile.covid_precautions.includes(4) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I'm immunocompromised/have a high-risk health condition
                                            </IonItem> 
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={17} checked={currentUserProfile.covid_precautions.includes(17) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I am a caregiver
                                            </IonItem>
                                           
                                            
                                            
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={7} checked={currentUserProfile.covid_precautions.includes(7) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I only leave home/outdoors for medically necessary reasons
                                            </IonItem>
                                           
                                            
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={10} checked={currentUserProfile.covid_precautions.includes(10) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I am living with Long Covid
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={11} checked={currentUserProfile.covid_precautions.includes(11) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I use air purifiers and use HEPA filters
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={13} checked={currentUserProfile.covid_precautions.includes(13) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I ask for testing before all meetups
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value={14} checked={currentUserProfile.covid_precautions.includes(14) ? true : false} onIonChange={e => addCovidPrecautionsCheckbox(e)} disabled={editcovidPrecautions ? false : true} />
                                                I ask for testing before indoor meetups
                                            </IonItem>
                                           
                                           
                                        </IonList>
                                        <IonNote>
                                            <h2 style={{ paddingTop: "20px" }}>Add anything else about your Covid behaviors that you think people you interact with might want to know!</h2>
                                        </IonNote>
                                        <IonItem color={editcovidPrecautionInfo ? "lightyellow" : ""}>
                                            <IonLabel class="ion-text-wrap"> <p>More about Covid:</p> <h2>{currentUserProfile.covid_precaution_info}</h2> </IonLabel>
                                            {editcovidPrecautionInfo ?


                                                <IonButton color="danger" onClick={() => seteditCovidPrecautionInfo(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>


                                                :
                                                <IonButton onClick={() => seteditCovidPrecautionInfo(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editcovidPrecautionInfo ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonTextarea value={covidPrecautionInfo}
                                                    name="covidPrecautionInfo"
                                                    onIonChange={e => setCovidPrecautionInfo(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={100}
                                                    autoCapitalize='sentences'
                                                    autoGrow={true} />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditCovidPrecautionInfo) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}
                                    </IonCardContent>
                                </IonAccordion>
                            </IonAccordionGroup>
                            <IonAccordionGroup>
                                <IonAccordion value="second-half" class="not-the-bottom">
                                    <IonItem slot="header" lines="none">
                                        <IonLabel>Long Covid Support</IonLabel>
                                    </IonItem>
                                    <IonCardContent class="no-padding-cc" className="ion-padding" slot="content">
                                        <IonItem>
                                            <IonText className="ion-text-wrap">
                                                <p> Choose as many as describe you. These choices are used when other members filter their Picks. You can choose whether or not to show them on your profile.</p>
                                            </IonText>

                                        </IonItem>
                                        <IonItem lines="none">
                                            <IonLabel color="black"><p>Show on profile? {showLongCovid == true ? "Yes" : "No"}</p></IonLabel>
                                            <IonToggle slot="end"
                                                onIonChange={async e => await showLongCovidHandler(e.detail.checked)}
                                                checked={showLongCovid}>
                                            </IonToggle>
                                        </IonItem>
                                        <IonList lines="none" className={editLCSupport ? "lightyellowitems" : ""}>
                                            <IonItem lines="none">
                                                <IonLabel color="black"><p>I am:</p></IonLabel>
                                                {editLCSupport ?
                                                    <>
                                                        <IonButton color="danger" onClick={() => seteditLCSupport(false)} slot="end">
                                                            <FontAwesomeIcon icon={faX} />
                                                        </IonButton>
                                                        <IonButton color="success" onClick={() => { updateProfileSingle(seteditLCSupport) }} slot="end">
                                                            <FontAwesomeIcon icon={faCheck} />
                                                        </IonButton>
                                                    </>
                                                    :
                                                    <IonButton onClick={() => seteditLCSupport(true)} slot="end">
                                                        Edit
                                                    </IonButton>
                                                }
                                            </IonItem>
                                            <IonItem lines="none">

                                                <IonCheckbox slot="start" value="I have LC" checked={currentUserProfile.long_covid_choices.includes("I have LC") ? true : false} onIonChange={e => addLCFilterCheckbox(e)} disabled={editLCSupport ? false : true} />
                                                living with Long Covid
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value="LC caretaker" checked={currentUserProfile.long_covid_choices.includes("LC caretaker") ? true : false} onIonChange={e => addLCFilterCheckbox(e)} disabled={editLCSupport ? false : true} />
                                                caring for someone with Long Covid
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value="I need help remote" checked={currentUserProfile.long_covid_choices.includes("I need help remote") ? true : false} onIonChange={e => addLCFilterCheckbox(e)} disabled={editLCSupport ? false : true} />
                                                needing remote support
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value="I need help local" checked={currentUserProfile.long_covid_choices.includes("I need help local") ? true : false} onIonChange={e => addLCFilterCheckbox(e)} disabled={editLCSupport ? false : true} />
                                                needing local support
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value="I could help remote" checked={currentUserProfile.long_covid_choices.includes("I could help remote") ? true : false} onIonChange={e => addLCFilterCheckbox(e)} disabled={editLCSupport ? false : true} />
                                                offering remote support
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonCheckbox slot="start" value="I could help local" checked={currentUserProfile.long_covid_choices.includes("I could help local") ? true : false} onIonChange={e => addLCFilterCheckbox(e)} disabled={editLCSupport ? false : true} />
                                                offering local support
                                            </IonItem>
                                        </IonList>

                                    </IonCardContent>
                                </IonAccordion>
                            </IonAccordionGroup>
                            <IonAccordionGroup>
                                <IonAccordion value="third">
                                    <IonItem slot="header" lines="none">
                                        <IonLabel>Let's Talk About</IonLabel>
                                    </IonItem>
                                    <IonCardContent class="no-padding-cc" slot="content">
                                        <IonNote><h2>Fill out as many or as few as you'd like. Anything you leave blank will not be included on your profile.</h2></IonNote>
                                        <IonItem color={editfreetime ? "lightyellow" : ""}>
                                            <IonLabel> <p>Freetime:</p> {currentUserProfile.freetime} </IonLabel>
                                            {editfreetime ?
                                                <IonButton color="danger" onClick={() => seteditFreetime(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditFreetime(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editfreetime ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={freetime}
                                                    name="freetime"
                                                    onIonChange={e => setFreetime(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='sentences'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditFreetime) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={edittogetherIdea ? "lightyellow" : ""}>
                                            <IonLabel> <p>Together idea:</p> <h2>{currentUserProfile.together_idea}</h2> </IonLabel>
                                            {edittogetherIdea ?
                                                <IonButton color="danger" onClick={() => seteditTogetherIdea(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditTogetherIdea(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {edittogetherIdea ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={togetherIdea}
                                                    name="togetherIdea"
                                                    onIonChange={e => setTogetherIdea(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='sentences'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditTogetherIdea) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={edithobby ? "lightyellow" : ""}>
                                            <IonLabel> <p>Hobby:</p> <h2>{currentUserProfile.hobby}</h2> </IonLabel>
                                            {edithobby ?
                                                <IonButton color="danger" onClick={() => seteditHobby(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditHobby(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {edithobby ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={hobby}
                                                    name="hobby"
                                                    onIonChange={e => setHobby(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='sentences'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditHobby) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={editpetPeeve ? "lightyellow" : ""}>
                                            <IonLabel> <p>Pet Peeve:</p> <h2>{currentUserProfile.petpeeve}</h2> </IonLabel>
                                            {editpetPeeve ?
                                                <IonButton color="danger" onClick={() => seteditPetPeeve(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditPetPeeve(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editpetPeeve ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={petPeeve}
                                                    name="petpeeve"
                                                    onIonChange={e => setPetPeeve(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='sentences'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditPetPeeve) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={edittalents ? "lightyellow" : ""}>
                                            <IonLabel> <p>Talents:</p> <h2>{currentUserProfile.talent}</h2> </IonLabel>
                                            {edittalents ?
                                                <IonButton color="danger" onClick={() => seteditTalents(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditTalents(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {edittalents ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={talents}
                                                    name="talents"
                                                    onIonChange={e => setTalents(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='sentences'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditTalents) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}



                                        <IonItem color={editfaveBook ? "lightyellow" : ""}>
                                            <IonLabel> <p>Fave Book:</p> <h2>{currentUserProfile.fave_book}</h2> </IonLabel>
                                            {editfaveBook ?
                                                <IonButton color="danger" onClick={() => seteditFaveBook(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditFaveBook(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editfaveBook ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={faveBook}
                                                    name="faveBook"
                                                    onIonChange={e => setFaveBook(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='words'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditFaveBook) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={editfaveMovie ? "lightyellow" : ""}>
                                            <IonLabel> <p>Fave Movie:</p> <h2>{currentUserProfile.fave_movie}</h2> </IonLabel>
                                            {editfaveMovie ?
                                                <IonButton color="danger" onClick={() => seteditFaveMovie(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditFaveMovie(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editfaveMovie ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={faveMovie}
                                                    name="faveMovie"
                                                    onIonChange={e => setFaveMovie(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='words'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditFaveMovie) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={editfaveTopic ? "lightyellow" : ""}>
                                            <IonLabel> <p>Fave Topic:</p> <h2>{currentUserProfile.fave_topic}</h2> </IonLabel>
                                            {editfaveTopic ?
                                                <IonButton color="danger" onClick={() => seteditFaveTopic(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditFaveTopic(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editfaveTopic ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={faveTopic}
                                                    name="faveTopic"
                                                    onIonChange={e => setFaveTopic(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='sentences'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditFaveTopic) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={editfaveTv ? "lightyellow" : ""}>
                                            <IonLabel> <p>Fave TV Show:</p> <h2>{currentUserProfile.fave_tv}</h2> </IonLabel>
                                            {editfaveTv ?
                                                <IonButton color="danger" onClick={() => seteditFaveTv(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditFaveTv(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editfaveTv ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={faveTv}
                                                    name="faveTv"
                                                    onIonChange={e => setFaveTv(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='words'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditFaveTv) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={editfaveAlbum ? "lightyellow" : ""}>
                                            <IonLabel> <p>Fave Album:</p> <h2>{currentUserProfile.fave_album}</h2> </IonLabel>
                                            {editfaveAlbum ?
                                                <IonButton color="danger" onClick={() => seteditFaveAlbum(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditFaveAlbum(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editfaveAlbum ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={faveAlbum}
                                                    name="faveAlbum"
                                                    onIonChange={e => setFaveAlbum(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='sentences'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditFaveAlbum) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={editfaveMusicalArtist ? "lightyellow" : ""}>
                                            <IonLabel> <p>Fave Musical Artist:</p> <h2>{currentUserProfile.fave_musicalartist}</h2> </IonLabel>
                                            {editfaveMusicalArtist ?
                                                <IonButton color="danger" onClick={() => seteditFaveMusicalArtist(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditFaveMusicalArtist(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editfaveMusicalArtist ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={faveMusicalArtist}
                                                    name="faveMusicalArtist"
                                                    onIonChange={e => setFaveMusicalArtist(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='words'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditFaveMusicalArtist) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={editfaveGame ? "lightyellow" : ""}>
                                            <IonLabel> <p>Fave Game:</p> <h2>{currentUserProfile.fave_game}</h2> </IonLabel>
                                            {editfaveGame ?
                                                <IonButton color="danger" onClick={() => seteditFaveGame(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditFaveGame(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editfaveGame ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={faveGame}
                                                    name="faveGame"
                                                    onIonChange={e => setFaveGame(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='words'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditFaveGame) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={editfaveSportWatch ? "lightyellow" : ""}>
                                            <IonLabel> <p>Fave Sport to Watch:</p> <h2>{currentUserProfile.fave_sport_watch}</h2> </IonLabel>
                                            {editfaveSportWatch ?
                                                <IonButton color="danger" onClick={() => seteditFaveSportWatch(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditFaveSportWatch(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editfaveSportWatch ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={faveSportWatch}
                                                    name="faveSportWatch"
                                                    onIonChange={e => setFaveSportWatch(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='sentences'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditFaveSportWatch) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={editfaveSportPlay ? "lightyellow" : ""}>
                                            <IonLabel> <p>Fave Sport to Play:</p> <h2>{currentUserProfile.fave_sport_play}</h2> </IonLabel>
                                            {editfaveSportPlay ?
                                                <IonButton color="danger" onClick={() => seteditFaveSportPlay(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditFaveSportPlay(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editfaveSportPlay ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={faveSportPlay}
                                                    name="faveSportPlay"
                                                    onIonChange={e => setFaveSportPlay(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='sentences'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditFaveSportPlay) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}




                                        <IonItem color={editcurrBook ? "lightyellow" : ""}>
                                            <IonLabel> <p>Current Book:</p> <h2>{currentUserProfile.fixation_book}</h2> </IonLabel>
                                            {editcurrBook ?
                                                <IonButton color="danger" onClick={() => seteditCurrBook(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditCurrBook(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editcurrBook ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={currBook}
                                                    name="currBook"
                                                    onIonChange={e => setCurrBook(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='words'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditCurrBook) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={editcurrMovie ? "lightyellow" : ""}>
                                            <IonLabel> <p>Current Movie:</p> <h2>{currentUserProfile.fixation_movie}</h2> </IonLabel>
                                            {editcurrMovie ?
                                                <IonButton color="danger" onClick={() => seteditCurrMovie(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditCurrMovie(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editcurrMovie ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={currMovie}
                                                    name="currMovie"
                                                    onIonChange={e => setCurrMovie(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='words'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditCurrMovie) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={editcurrTopic ? "lightyellow" : ""}>
                                            <IonLabel> <p>Current Topic:</p> <h2>{currentUserProfile.fixation_topic}</h2> </IonLabel>
                                            {editcurrTopic ?
                                                <IonButton color="danger" onClick={() => seteditCurrTopic(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditCurrTopic(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editcurrTopic ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={currTopic}
                                                    name="currTopic"
                                                    onIonChange={e => setCurrTopic(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='sentences'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditCurrTopic) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={editcurrTv ? "lightyellow" : ""}>
                                            <IonLabel> <p>Current TV Show:</p> <h2>{currentUserProfile.fixation_tv}</h2> </IonLabel>
                                            {editcurrTv ?
                                                <IonButton color="danger" onClick={() => seteditCurrTv(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditCurrTv(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editcurrTv ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={currTv}
                                                    name="currTv"
                                                    onIonChange={e => setCurrTv(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='words'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditCurrTv) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={editcurrAlbum ? "lightyellow" : ""}>
                                            <IonLabel> <p>Current Album:</p> <h2>{currentUserProfile.fixation_album}</h2> </IonLabel>
                                            {editcurrAlbum ?
                                                <IonButton color="danger" onClick={() => seteditCurrAlbum(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditCurrAlbum(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editcurrAlbum ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={currAlbum}
                                                    name="currAlbum"
                                                    onIonChange={e => setCurrAlbum(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='words'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditCurrAlbum) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={editcurrMusicalArtist ? "lightyellow" : ""}>
                                            <IonLabel> <p>Current Musical Artist:</p> <h2>{currentUserProfile.fixation_musicalartist}</h2> </IonLabel>
                                            {editcurrMusicalArtist ?
                                                <IonButton color="danger" onClick={() => seteditCurrMusicalArtist(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditCurrMusicalArtist(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editcurrMusicalArtist ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={currMusicalArtist}
                                                    name="currMusicalArtist"
                                                    onIonChange={e => setCurrMusicalArtist(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='words'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditCurrMusicalArtist) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem> : null}

                                        <IonItem color={editcurrGame ? "lightyellow" : ""}>
                                            <IonLabel> <p>Current Game:</p> <h2>{currentUserProfile.fixation_game}</h2> </IonLabel>
                                            {editcurrGame ?
                                                <IonButton color="danger" onClick={() => seteditCurrGame(false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                :
                                                <IonButton onClick={() => seteditCurrGame(true)} slot="end">
                                                    Edit
                                                </IonButton>
                                            }
                                        </IonItem>
                                        {editcurrGame ?
                                            <IonItem counter={true} color="lightyellow">
                                                <IonInput value={currGame}
                                                    name="currGame"
                                                    onIonChange={e => setCurrGame(e.detail.value!)}
                                                    placeholder="Update here"
                                                    maxlength={80}
                                                    autoCapitalize='words'
                                                    clearInput={true}
                                                    type="text" />
                                                <IonButton color="success" onClick={() => { updateProfileSingle(seteditCurrGame) }} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </IonItem>
                                            : null}
                                    </IonCardContent>
                                </IonAccordion>
                            </IonAccordionGroup>
                            {anyEdits() ?
                                <IonRow class="ion-justify-content-center">
                                    <IonButton onClick={updateProfile}>Make these changes to my profile</IonButton>
                                </IonRow>
                                : <></>}
                        </IonGrid>
                        
                    </IonCardContent>
                </IonCard>
                <IonGrid class="picture-grid">
                    <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic1_main} dataPicCaption={"profile picture"} picNumber={1} updateProfileFunc={updateProfile} delete_allowed={false} altText={currentUserProfile?.pic1_alt}/>
                    <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic2} dataPicCaption={currentUserProfile.pic2_caption} picNumber={2} updateProfileFunc={updateProfile} delete_allowed={false} altText={currentUserProfile?.pic2_alt}/>
                    <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic3} dataPicCaption={currentUserProfile.pic3_caption} picNumber={3} updateProfileFunc={updateProfile} delete_allowed={false} altText={currentUserProfile?.pic3_alt}/>
                    <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic4} dataPicCaption={currentUserProfile.pic4_caption} picNumber={4} updateProfileFunc={updateProfile} delete_allowed={true} altText={currentUserProfile?.pic4_alt}/>
                    <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic5} dataPicCaption={currentUserProfile.pic5_caption} picNumber={5} updateProfileFunc={updateProfile} delete_allowed={true} altText={currentUserProfile?.pic5_alt}/>
                    <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic6} dataPicCaption={currentUserProfile.pic6_caption} picNumber={6} updateProfileFunc={updateProfile} delete_allowed={true} altText={currentUserProfile?.pic6_alt}/>
                    <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic7} dataPicCaption={currentUserProfile.pic7_caption} picNumber={7} updateProfileFunc={updateProfile} delete_allowed={true} altText={currentUserProfile?.pic7_alt}/>
                    <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic8} dataPicCaption={currentUserProfile.pic8_caption} picNumber={8} updateProfileFunc={updateProfile} delete_allowed={true} altText={currentUserProfile?.pic8_alt}/>
                    <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic9} dataPicCaption={currentUserProfile.pic9_caption} picNumber={9} updateProfileFunc={updateProfile} delete_allowed={true} altText={currentUserProfile?.pic9_alt}/>
                </IonGrid>
            </div>
        )
    }
    else {
        return <LoadingCard />
    }
};
export default SelfProfile;