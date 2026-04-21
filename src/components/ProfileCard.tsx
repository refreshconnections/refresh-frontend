import {
    IonContent,
    IonHeader,
    IonLabel,
    IonItem,
    IonAccordion,
    IonAccordionGroup,
    IonRow, IonGrid, IonCol,
    IonCard, IonCardContent,
    IonCardHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonCardTitle,
    IonCardSubtitle,
    IonText,
    IonList,
    IonIcon,
    IonButton,
    IonPopover,
    IonNote,
    useIonPopover,
    useIonRouter,
    IonBadge,
    IonSpinner
} from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWifi } from '@fortawesome/free-solid-svg-icons/faWifi'
import { faBriefcase } from '@fortawesome/free-solid-svg-icons/faBriefcase'
import { faComment } from '@fortawesome/free-solid-svg-icons/faComment'
import { faFamily } from '@fortawesome/pro-solid-svg-icons/faFamily'
import { faHeart } from '@fortawesome/free-solid-svg-icons/faHeart'
import { faHouseUser } from '@fortawesome/free-solid-svg-icons/faHouseUser'
import { faUserPlus } from '@fortawesome/free-solid-svg-icons/faUserPlus'
import { faHandWave } from '@fortawesome/pro-solid-svg-icons/faHandWave';



import './ProfileCard.css';


// Import Swiper React components
import { Swiper, SwiperSlide, useSwiper } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination } from 'swiper';

import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { onImgError, somethingInLetsTalkAbout } from '../hooks/utilities';
import { useUpsellAlert } from '../hooks/useUpsellAlert';
import { faSubtitles } from '@fortawesome/pro-regular-svg-icons/faSubtitles';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useGetCurrentStreak } from '../hooks/api/profiles/current-streak';
import moment from 'moment';
import { faStarShooting } from '@fortawesome/pro-solid-svg-icons';




interface ContainerProps {
    cardData: any;
    pro: boolean;
    settingsAlt: boolean
}

const amINewHere = (date: any) => {
    const now = moment()
    const days = now.diff(date, "days")

    if (days < 10) {
        return true
    }
    return false

};



const ProfileCard: React.FC<ContainerProps> = ({ cardData, pro, settingsAlt }) => {

    const swiperRef = useRef<any>(null);
    const primaryImageRef = useRef<HTMLImageElement | null>(null);

    const Popover = () => <IonContent className="ion-padding no-scroll">{popoverValue}</IonContent>;

    const [presentPopover, dismissPopover] = useIonPopover(Popover, {
        onDismiss: () => dismissPopover(),
    });

    const [popoverValue, setPopover] = useState<null | string>(null)
    const [imageLoaded, setImageLoaded] = useState(false);

    const presentUpsellAlert = useUpsellAlert();
    const router = useIonRouter();

    const [altShow, setAltShow] = useState<string | null>(null);
    const [showStreakLetsTalkAbouts, setShowStreakLetsTalkAbouts] = useState<boolean>(false);


    const currentUserProfile = useGetCurrentProfile().data;
    const currentStreak = useGetCurrentStreak().data;



    useEffect(() => {
        setAltShow(null)
        try {
            swiperRef.current?.slideTo?.(0);
        } catch (e) {
            console.warn("Swiper not ready:", e);
        }

    }, [cardData])


    const photoKeys = ['pic1_main', 'pic2', 'pic3', 'pic4', 'pic5', 'pic6', 'pic7', 'pic8', 'pic9'];

    const livedExperienceLabels: Record<string, string> = {
        poc: 'POC',
        spiritual: 'Spiritual',
        neurodivergent: 'Neurodivergent',
        disability: 'Disability',
        chronic_illness: 'Chronic illness',
        sober: 'Sober',
    };
    const preferredOrder = Array.isArray(cardData?.photo_order) && cardData.photo_order.length > 0
        ? cardData.photo_order
        : photoKeys;
    const existingPhotos = photoKeys.filter(key => cardData?.[key]);
    const orderedPhotos = [
        ...preferredOrder.filter((key: string) => existingPhotos.includes(key)),
        ...existingPhotos.filter(key => !preferredOrder.includes(key)),
    ];
    const primaryPhotoKey = orderedPhotos[0] || 'pic1_main';
    const primaryPhotoSrc = cardData?.[primaryPhotoKey] || "../static/img/null.png";
    const secondaryPhotoKeys = orderedPhotos.filter(key => key !== primaryPhotoKey);

    useEffect(() => {
        setImageLoaded(false);

        const image = primaryImageRef.current;
        if (image?.complete) {
            setImageLoaded(true);
        }
    }, [primaryPhotoSrc]);

    if (cardData?.deactivated_profile || currentUserProfile?.blocked_by?.includes(cardData?.user)) {
        return (
            <IonCard className="margins ">
                <img className="profilepic" alt="Picture 1 null" src={"../static/img/null.png"} />
                <IonCardHeader>
                    <IonCardTitle>Deactivated</IonCardTitle>
                </IonCardHeader>
            </IonCard>
        )
    }
    else {
        return (
            <IonCard className="margins">
                <div style={{ position: "relative" }}>


                    <div className="profilepic-wrapper">
                        {!imageLoaded && (
                            <div className="profilepic-loader">
                                <IonSpinner name="bubbles" />
                            </div>
                        )}
                        <img
                            ref={primaryImageRef}
                            className={`profilepic ${imageLoaded ? 'loaded' : 'loading'}`}
                            alt={cardData?.[`${primaryPhotoKey}_alt`] || "Profile photo"}
                            src={primaryPhotoSrc}
                            onError={(e) => onImgError(e)}
                            loading="lazy"
                            onLoad={() => setImageLoaded(true)}
                        />
                    </div>
                    {cardData.subscription_level == "pro" && cardData.settings_profile_banner_bool ?
                        <IonRow className="banner">
                            {cardData.settings_profile_banner == "happy-pride" ?
                                <img src="../static/img/pride.png" alt="Happy pride banner" />
                                : cardData.settings_profile_banner == "putting-money" ?
                                    <img src="../static/img/money.png" alt="Putting my money where my mouth is banner" />
                                    : cardData.settings_profile_banner == "lc-aware" ?
                                        <img src="../static/img/longcaware.png" alt="Long Covid Awareness banner" />
                                        : cardData.settings_profile_banner == "conscientious-sexy" ?
                                            <img src="../static/img/conscientiousnewsexy.png" alt="Conscientious is the new sexy banner" />
                                            : cardData.settings_profile_banner == "ready-connect" ?
                                                <img src="../static/img/readytoconnect.png" alt="Ready to connect banner" />
                                                : cardData.settings_profile_banner == "fresh-air" ?
                                                    <img src="../static/img/iheartfreshair.png" alt="I heart fresh air banner" />
                                                    : cardData.settings_profile_banner == "disability-pride" ?
                                                        <img src="../static/img/disabilitypride.png" alt="Disability pride banner" />
                                                        : cardData.settings_profile_banner == "dream-big" ?
                                                            <img src="../static/img/maskupdreambig.png" alt="Mask up dream big banner" />
                                                            : cardData.settings_profile_banner == "salting-the-vibes" ?
                                                                <img src="../static/img/salting_the_vibes_banner.png" alt="Salting the vibes banner" />
                                                                :
                                                                <img src="../static/img/freshies.png" alt="Refresh Connections freshies banner" />
                            }
                        </IonRow>

                        : <></>}


                    {altShow === primaryPhotoKey ?
                        <IonRow className="show-alt-profile">
                            <IonText>{cardData?.[`${primaryPhotoKey}_alt`]}</IonText>
                        </IonRow>
                        : <></>}
                </div>


                <IonCardHeader className="leave-end-room ">
                    {settingsAlt && cardData?.[`${primaryPhotoKey}_alt`] ?
                        <IonButton className="alt-desc-profile" fill="clear" size="small" onClick={altShow !== primaryPhotoKey ? () => setAltShow(primaryPhotoKey) : () => setAltShow(null)}>
                            <FontAwesomeIcon icon={faSubtitles} />
                        </IonButton>
                        : <></>}

                    <IonCardTitle>{cardData.name}
                    </IonCardTitle>
                    <IonCardSubtitle>{cardData.pronouns}</IonCardSubtitle>
                    <IonCardSubtitle>{cardData.location}</IonCardSubtitle>

                </IonCardHeader>
                <IonCardContent>
                    <IonGrid className="profile-grid">
                        <IonRow className="bio css-fix">{cardData.bio} </IonRow>
                        {amINewHere(cardData.registrationDate) ?
                            <IonRow className="ion-justify-content-center">
                                <IonBadge>
                                    <FontAwesomeIcon icon={faHandWave} /> &nbsp; I'm new here!
                                </IonBadge>
                            </IonRow>
                            : <></>}
                        <IonAccordionGroup className="profile-card" value="basics">
                            <IonAccordion value="basics">
                                <IonItem slot="header" lines="none">
                                    <IonLabel>The Basics</IonLabel>
                                </IonItem>
                                <IonCardContent slot="content">
                                    <IonList lines="none">
                                        <IonItem>
                                            <IonGrid style={{ "paddingLeft": "0px" }}>
                                                <IonRow>
                                                    <IonCol style={{ "paddingLeft": "0px" }}>
                                                        <IonLabel><p>Age:</p> <h2>{cardData.age}</h2></IonLabel>
                                                    </IonCol>
                                                    <IonCol style={{ "paddingLeft": "0px" }}>
                                                        {cardData.height && cardData.height.length > 1 ?
                                                            <IonLabel><p>Height:</p> <h2>{cardData.height}</h2></IonLabel>
                                                            : <></>}
                                                    </IonCol>
                                                </IonRow>
                                            </IonGrid>
                                        </IonItem>
                                        <IonItem className="icons">
                                            <IonGrid style={{ "paddingLeft": "0px" }}>
                                                <IonRow style={{ "paddingLeft": "0px" }}>
                                                    <IonLabel><p>Looking for:</p> </IonLabel>
                                                </IonRow>
                                                <IonRow style={{ "paddingLeft": "0px", "paddingRight": "0px" }}>
                                                    <IonButton disabled={cardData.looking_for.includes("friendship") ? false : true} className="looking-for-buttons" fill="clear" onClick={(e: any) => {
                                                        presentPopover({
                                                            event: e,
                                                        }); setPopover("friendship")
                                                    }
                                                    } id="looking-for-popover-friendship">
                                                        <FontAwesomeIcon icon={faUserPlus as IconProp} visibility={cardData.looking_for.includes("friendship") ? "visible" : "hidden"} />
                                                    </IonButton>
                                                    <IonButton disabled={cardData.looking_for.includes("romance") ? false : true} className="looking-for-buttons" fill="clear" onClick={(e: any) => {
                                                        presentPopover({
                                                            event: e,
                                                        }); setPopover("romance")
                                                    }
                                                    }>
                                                        <FontAwesomeIcon icon={faHeart as IconProp} visibility={cardData.looking_for.includes("romance") ? "visible" : "hidden"} />
                                                    </IonButton>
                                                    <IonButton disabled={cardData.looking_for.includes("housing") ? false : true} className="looking-for-buttons" fill="clear" id="looking-for-popover" onClick={(e: any) => {
                                                        presentPopover({
                                                            event: e,
                                                        }); setPopover("housing / roommate")
                                                    }
                                                    }>
                                                        <FontAwesomeIcon icon={faHouseUser as IconProp} visibility={cardData.looking_for.includes("housing") ? "visible" : "hidden"} />
                                                    </IonButton>
                                                    <IonButton disabled={cardData.looking_for.includes("job") ? false : true} className="looking-for-buttons" fill="clear" onClick={(e: any) => {
                                                        presentPopover({
                                                            event: e,
                                                        }); setPopover("job")
                                                    }
                                                    }>
                                                        <FontAwesomeIcon icon={faBriefcase as IconProp} visibility={cardData.looking_for.includes("job") ? "visible" : "hidden"} />
                                                    </IonButton>
                                                    <IonButton disabled={cardData.looking_for.includes("virtual connection") ? false : true} className="looking-for-buttons" fill="clear" onClick={(e: any) => {
                                                        presentPopover({
                                                            event: e,
                                                        }); setPopover("virtual connection")
                                                    }
                                                    }>
                                                        <FontAwesomeIcon icon={faComment as IconProp} visibility={cardData.looking_for.includes("virtual connection") ? "visible" : "hidden"} />
                                                    </IonButton>
                                                    <IonButton disabled={cardData.looking_for.includes("virtual only") ? false : true} className="looking-for-buttons" fill="clear" onClick={(e: any) => {
                                                        presentPopover({
                                                            event: e,
                                                        }); setPopover("virtual connection ONLY")
                                                    }
                                                    }>
                                                        <FontAwesomeIcon icon={faWifi as IconProp} visibility={cardData.looking_for.includes("virtual only") ? "visible" : "hidden"} />
                                                    </IonButton>
                                                    <IonButton disabled={cardData.looking_for.includes("families") ? false : true} className="looking-for-buttons" fill="clear" onClick={(e: any) => {
                                                        presentPopover({
                                                            event: e,
                                                        }); setPopover("families")
                                                    }
                                                    }>
                                                        <FontAwesomeIcon icon={faFamily as IconProp} visibility={cardData.looking_for.includes("families") ? "visible" : "hidden"} />
                                                    </IonButton>
                                                </IonRow>
                                            </IonGrid>
                                        </IonItem>
                                        {cardData.kids_info ?
                                            <IonItem> <IonLabel><p>Kids info:</p> <h2 className="wrap">{cardData.kids_info}</h2></IonLabel> </IonItem> : <></>}
                                        {cardData.settings_show_lived_experiences && cardData.lived_experiences?.length ? (
                                            <IonItem>
                                                <IonLabel className="ion-text-wrap" style={{ textWrap: "balance" }}>
                                                    <p style={{ textAlign: "center" }}>
                                                        {`• ${cardData.lived_experiences
                                                            .map((value: string) => livedExperienceLabels[value] ?? value)
                                                            .join(' • ')} •`}
                                                    </p>
                                                </IonLabel>
                                            </IonItem>
                                        ) : null}
                                        {cardData.job ?
                                            <IonItem> <IonLabel><p>Job:</p> <h2 className="wrap">{cardData.job}</h2></IonLabel> </IonItem> : <></>}
                                        {cardData.school ?
                                            <IonItem> <IonLabel><p>School:</p> <h2 className="wrap">{cardData.school}</h2></IonLabel> </IonItem> : <></>}
                                        {cardData.politics ?
                                            <IonItem> <IonLabel><p>Politics:</p> <h2 className="wrap">{cardData.politics}</h2></IonLabel> </IonItem> : <></>}
                                        {cardData.hometown ?
                                            <IonItem> <IonLabel><p>Hometown:</p> <h2 className="wrap">{cardData.hometown}</h2></IonLabel> </IonItem> : <></>}
                                        {cardData.gender_and_sexuality_info ?
                                            <IonItem> <IonLabel><p>Gender and Sexuality:</p> <h2 className="wrap ion-text-wrap">{cardData.gender_and_sexuality_info}</h2></IonLabel> </IonItem> : <></>}
                                        {cardData.settings_show_gender_sexuality ?
                                            <IonItem >
                                                <IonLabel className="ion-text-wrap" style={{ textWrap: "balance" }}><p style={{ textAlign: "center" }}>&bull;
                                                    {cardData.gender_sexuality_choices.includes("straight") ? <> Straight &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("gay") ? <> Gay &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("lesbian") ? <> Lesbian &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("bi") ? <> Bi &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("pan") ? <> Pan &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("ace") ? <> Ace &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("gray ace") ? <> Gray Ace &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("demi") ? <> Demisexual &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("queer") ? <> Queer &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("man") ? <> Man &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("woman") ? <> Woman &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("nb") ? <> Nonbinary &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("genderfluid") ? <> Gender fluid &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("intersex") ? <> Intersex &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("cis") ? <> Cis &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("trans") ? <> Trans &bull;</> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("mono") ? <> Monogamous &bull; </> : <></>}
                                                    {cardData.gender_sexuality_choices.includes("poly") ? <> Polyam &bull;</> : <></>}
                                                </p>
                                                </IonLabel>
                                            </IonItem>
                                            : <></>}
                                        {/* {cardData.gender_and_sexuality_info == null || cardData.gender_and_sexuality_info == "" ? <></> :
                                    <IonItem> <IonLabel><p>Gender and Sexuality:</p> <h2 className="wrap">{cardData.gender_and_sexuality_info}</h2></IonLabel> </IonItem>} */}
                                    </IonList>
                                </IonCardContent>
                            </IonAccordion>
                        </IonAccordionGroup>
                        <IonAccordionGroup className="profile-card" value="covid">
                            <IonAccordion value="covid">
                                <IonItem slot="header" lines="none">
                                    <IonLabel>Covid Behaviors</IonLabel>
                                </IonItem>
                                <IonCardContent slot="content">
                                    <IonNote className="covid-note">{cardData.covid_precaution_info}</IonNote>
                                    <IonList lines="none">
                                        {cardData.covid_precautions.includes(10) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I am living with Long Covid</h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(17) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I am a caregiver</h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(4) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull;  I'm immunocompromised/have a high-risk health condition</h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(7) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I only leave home/outdoors for medically necessary reasons</h2></IonLabel></IonItem> : null}

                                        {(cardData.covid_precautions.includes(1) || cardData.covid_precautions.includes(9) || cardData.covid_precautions.includes(16)) ? <IonItem> <IonLabel><p>Work / School:</p> </IonLabel> </IonItem> : null}
                                        {cardData.covid_precautions.includes(1) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I work from home </h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(9) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I go to work/school but always in a high quality mask </h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(16) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; My work requires poor/no masking </h2></IonLabel></IonItem> : null}

                                        {(cardData.covid_precautions.includes(18) || cardData.covid_precautions.includes(8) || cardData.covid_precautions.includes(3) || cardData.covid_precautions.includes(11)) ? <IonItem> <IonLabel><p>Home:</p> </IonLabel> </IonItem> : null}
                                        {cardData.covid_precautions.includes(18) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I have no routine daily exposures </h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(8) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I live alone/with others who share my level of Covid caution</h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(3) ? <IonItem><IonLabel className="ion-text-wrap wrap"><h2> &bull;  I live with non-Covid cautious people </h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(11) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I use air purifiers and HEPA filters</h2></IonLabel></IonItem> : null}

                                        {(cardData.covid_precautions.includes(15) || cardData.covid_precautions.includes(2) || cardData.covid_precautions.includes(5) || cardData.covid_precautions.includes(6) || cardData.covid_precautions.includes(12) || cardData.covid_precautions.includes(13) || cardData.covid_precautions.includes(14)) ? <IonItem> <IonLabel><p>Play:</p> </IonLabel> </IonItem> : null}
                                        {cardData.covid_precautions.includes(15) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I do takeout from restaurants</h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(2) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I eat outdoors at restaurants with good airflow and spacing</h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(5) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I attend outdoor events</h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(6) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I attend indoor events with a mask on</h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(12) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I attend outdoor events with a mask on</h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(13) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I ask for testing before all meetups</h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(14) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I ask for testing before indoor meetups</h2></IonLabel></IonItem> : null}

                                    </IonList>


                                </IonCardContent>
                            </IonAccordion>
                        </IonAccordionGroup>
                        {cardData.settings_show_long_covid ? (
                            <IonAccordionGroup className="profile-card" value="longcovid">
                                <IonAccordion value="longcovid">
                                    <IonItem slot="header" lines="none">
                                        <IonLabel>Long Covid Support</IonLabel>
                                    </IonItem>
                                    <IonCardContent slot="content">
                                        <IonList lines="none">
                                            {cardData.long_covid_choices.includes("I have LC") ? (
                                                <IonItem lines="none">
                                                    <IonLabel className="ion-text-wrap">
                                                        <h2>&bull; I am living with Long Covid</h2>
                                                    </IonLabel>
                                                </IonItem>
                                            ) : null}
                                            {cardData.long_covid_choices.includes("LC caretaker") ? (
                                                <IonItem lines="none">
                                                    <IonLabel className="ion-text-wrap">
                                                        <h2>&bull; I care for someone with Long Covid</h2>
                                                    </IonLabel>
                                                </IonItem>
                                            ) : null}
                                            {cardData.long_covid_choices.includes("I could help local") ? (
                                                <IonItem lines="none">
                                                    <IonLabel className="ion-text-wrap">
                                                        <h2>&bull; I could provide local support</h2>
                                                    </IonLabel>
                                                </IonItem>
                                            ) : null}
                                            {cardData.long_covid_choices.includes("I could help remote") ? (
                                                <IonItem lines="none">
                                                    <IonLabel className="ion-text-wrap">
                                                        <h2>&bull; I could provide remote support</h2>
                                                    </IonLabel>
                                                </IonItem>
                                            ) : null}
                                            {cardData.long_covid_choices.includes("I need help local") ? (
                                                <IonItem lines="none">
                                                    <IonLabel className="ion-text-wrap">
                                                        <h2>&bull; I could use local support</h2>
                                                    </IonLabel>
                                                </IonItem>
                                            ) : null}
                                            {cardData.long_covid_choices.includes("I need help remote") ? (
                                                <IonItem lines="none">
                                                    <IonLabel className="ion-text-wrap">
                                                        <h2>&bull; I could use remote support</h2>
                                                    </IonLabel>
                                                </IonItem>
                                            ) : null}
                                        </IonList>
                                    </IonCardContent>
                                </IonAccordion>
                            </IonAccordionGroup>
                        ) : null}
                        <Swiper
                            modules={[Navigation, Pagination]}
                            pagination={{ clickable: true }}
                            centeredSlides
                            onInit={(swiper) => { swiperRef.current = swiper; }}

                        >
                            {secondaryPhotoKeys.map(key => (
                                <SwiperSlide key={key}>
                                    <IonCard>
                                        <img
                                            alt={cardData?.[`${key}_alt`] || 'Profile photo'}
                                            src={cardData?.[key]}
                                            onError={(e) => onImgError(e)}
                                        />
                                        {altShow === key ? (
                                            <IonRow className="show-alt">
                                                <IonText>{cardData?.[`${key}_alt`]}</IonText>
                                            </IonRow>
                                        ) : null}
                                        <IonCardSubtitle
                                            onClick={
                                                settingsAlt && altShow !== key && cardData?.[`${key}_alt`]
                                                    ? () => setAltShow(key)
                                                    : () => setAltShow(null)
                                            }
                                        >
                                            {cardData?.[`${key}_caption`]}
                                            {settingsAlt && cardData?.[`${key}_alt`] ? (
                                                <FontAwesomeIcon className="alt-desc" icon={faSubtitles} />
                                            ) : null}
                                        </IonCardSubtitle>
                                    </IonCard>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                        {somethingInLetsTalkAbout(cardData) ?
                            <IonAccordionGroup className="profile-card" value="preferences">
                                <IonAccordion value="preferences">
                                    <IonItem slot="header" lines="none">
                                        <IonLabel>Let's Talk About</IonLabel>
                                    </IonItem>
                                    <IonCardContent slot="content">
                                        <IonList lines="none" className={(pro || currentStreak?.streak_count >= 3) ? "" : "limitheight"}>
                                            {cardData.freetime ? <IonItem> <IonLabel><p>Freetime:</p> <h2 className="wrap">{cardData.freetime}</h2></IonLabel> </IonItem> : <></>}
                                            {cardData.together_idea ? <IonItem> <IonLabel><p>Something we could do together:</p> <h2 className="wrap">{cardData.together_idea}</h2></IonLabel> </IonItem> : <></>}
                                            {cardData.hobby ? <IonItem> <IonLabel><p>Hobbies:</p> <h2 className="wrap">{cardData.hobby}</h2></IonLabel> </IonItem> : <></>}
                                            {cardData.petpeeve ? <IonItem> <IonLabel><p>Pet Peeves:</p> <h2 className="wrap">{cardData.petpeeve}</h2></IonLabel> </IonItem> : <></>}
                                            {cardData.talent ? <IonItem> <IonLabel><p>Talents:</p> <h2 className="wrap">{cardData.talent}</h2></IonLabel> </IonItem> : <></>}
                                            {(cardData.fixation_book || cardData.fixation_movie || cardData.fixation_tv || cardData.fixation_album || cardData.fixation_musicalartist || cardData.fixation_game || cardData.fixation_topic) ?
                                                <><IonText><p>Current interests:</p> </IonText>
                                                    {cardData.fixation_book ? <IonItem> <IonLabel><p>Book:</p> <h2 className="wrap">{cardData.fixation_book}</h2></IonLabel> </IonItem> : <></>}
                                                    {cardData.fixation_movie ? <IonItem> <IonLabel><p>Movie:</p> <h2 className="wrap">{cardData.fixation_movie}</h2></IonLabel> </IonItem> : <></>}
                                                    {cardData.fixation_tv ? <IonItem> <IonLabel><p>TV Show:</p> <h2 className="wrap">{cardData.fixation_tv}</h2></IonLabel> </IonItem> : <></>}
                                                    {cardData.fixation_album ? <IonItem> <IonLabel><p>Album:</p> <h2 className="wrap">{cardData.fixation_album}</h2></IonLabel> </IonItem> : <></>}
                                                    {cardData.fixation_musicalartist ? <IonItem> <IonLabel><p>Musical Artist:</p> <h2 className="wrap">{cardData.fixation_musicalartist}</h2></IonLabel> </IonItem> : <></>}
                                                    {cardData.fixation_game ? <IonItem> <IonLabel><p>Game:</p> <h2 className="wrap">{cardData.fixation_game}</h2></IonLabel> </IonItem> : <></>}
                                                    {cardData.fixation_topic ? <IonItem> <IonLabel><p>Topic:</p> <h2 className="wrap">{cardData.fixation_topic}</h2></IonLabel> </IonItem> : <></>}
                                                </> : <></>}
                                            {(cardData.fave_book || cardData.fave_movie || cardData.fave_tv || cardData.fave_album || cardData.fave_musicalartist || cardData.fave_game || cardData.fave_topic || cardData.fave_sport_play || cardData.fave_sport_watch) ?
                                                <>
                                                    <IonText><p>All-time favorites:</p> </IonText>
                                                    {cardData.fave_book ? <IonItem> <IonLabel><p>Book:</p> <h2 className="wrap">{cardData.fave_book}</h2></IonLabel> </IonItem> : <></>}
                                                    {cardData.fave_movie ? <IonItem> <IonLabel><p>Movie:</p> <h2 className="wrap">{cardData.fave_movie}</h2></IonLabel> </IonItem> : <></>}
                                                    {cardData.fave_tv ? <IonItem> <IonLabel><p>TV Show:</p> <h2 className="wrap">{cardData.fave_tv}</h2></IonLabel> </IonItem> : <></>}
                                                    {cardData.fave_album ? <IonItem> <IonLabel><p>Album:</p> <h2 className="wrap">{cardData.fave_album}</h2></IonLabel> </IonItem> : <></>}
                                                    {cardData.fave_musicalartist ? <IonItem> <IonLabel><p>Musical Artist:</p> <h2 className="wrap">{cardData.fave_musicalartist}</h2></IonLabel> </IonItem> : <></>}
                                                    {cardData.fave_game ? <IonItem> <IonLabel><p>Game:</p> <h2 className="wrap">{cardData.fave_game}</h2></IonLabel> </IonItem> : <></>}
                                                    {cardData.fave_topic ? <IonItem> <IonLabel><p>Topic:</p> <h2 className="wrap">{cardData.fave_topic}</h2></IonLabel> </IonItem> : <></>}
                                                    {cardData.fave_sport_watch ? <IonItem> <IonLabel><p>Sport to watch:</p> <h2 className="wrap">{cardData.fave_sport_watch}</h2></IonLabel> </IonItem> : <></>}
                                                    {cardData.fave_sport_play ? <IonItem> <IonLabel><p>Sport to play:</p> <h2 className="wrap">{cardData.fave_sport_play}</h2></IonLabel> </IonItem> : <></>}
                                                </> : <></>}
                                        </IonList>
                                        {!(pro || currentStreak?.streak_count >= 3) ? <IonRow className="ion-justify-content-center"><IonButton size="small" fill="outline" onClick={() => presentUpsellAlert({
                                            header: "A 3 day streak lets you view all Let's Talk About fields!",
                                            message: 'Or become a Personal+ or Pro member.',
                                            extraButtons: [{ text: 'What is my streak?', handler: () => router.push('/activity') }],
                                        })}>Want to see more?</IonButton>
                                        </IonRow> : <></>}
                                        {(!pro && currentStreak?.streak_count >= 3) &&

                                            <IonRow className="ion-justify-content-center"><IonButton fill="clear" onClick={
                                                () => { { showStreakLetsTalkAbouts ? setShowStreakLetsTalkAbouts(false) : setShowStreakLetsTalkAbouts(true) } }
                                            }>
                                                <FontAwesomeIcon icon={faStarShooting as IconProp} />
                                            </IonButton>
                                                {showStreakLetsTalkAbouts && <IonNote className="ion-text-center">Your {currentStreak?.streak_count} day streak means you can view all Let's Talk About conversation starters!</IonNote>}</IonRow>}
                                    </IonCardContent>
                                </IonAccordion>
                            </IonAccordionGroup>
                            : <></>}
                    </IonGrid>
                </IonCardContent>
            </IonCard>
        )
    }
};
export default ProfileCard;
