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
    useIonAlert,
    useIonPopover,
    IonAlert,
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

    const Popover = () => <IonContent className="ion-padding no-scroll">{popoverValue}</IonContent>;

    const [presentPopover, dismissPopover] = useIonPopover(Popover, {
        onDismiss: () => dismissPopover(),
    });

    const [popoverValue, setPopover] = useState<null | string>(null)
    const [imageLoaded, setImageLoaded] = useState(false);

    const [showStoreAlert, setShowStoreAlert] = useState(false);

    const [altShow, setAltShow] = useState<number | null>(null);
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
                            className={`profilepic ${imageLoaded ? 'loaded' : 'loading'}`}
                            alt="Picture 1"
                            src={cardData.pic1_main || "../static/img/null.png"}
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


                    {altShow === 1 ?
                        <IonRow className="show-alt-profile">
                            <IonText>{cardData.pic1_alt}</IonText>
                        </IonRow>
                        : <></>}
                </div>


                <IonCardHeader className="leave-end-room ">
                    {settingsAlt && cardData.pic1_alt ?
                        <IonButton className="alt-desc-profile" fill="clear" size="small" onClick={altShow !== 1 ? () => setAltShow(1) : () => setAltShow(null)}>
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
                        <IonAccordionGroup className="profile-card" value={["first"]}>
                            <IonAccordion value="first">
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
                                                    {cardData.gender_sexuality_choices.includes("poly") ? <> Poly &bull;</> : <></>}
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
                        <IonAccordionGroup className="profile-card" value={["second"]}>
                            <IonAccordion value="second">
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

                                        <IonItem> <IonLabel><p>Work / School:</p> </IonLabel> </IonItem>
                                        {cardData.covid_precautions.includes(1) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I work from home </h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(9) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I go to work/school but always in a high quality mask </h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(16) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; My work requires poor/no masking </h2></IonLabel></IonItem> : null}

                                        <IonItem> <IonLabel><p>Home:</p> </IonLabel> </IonItem>
                                        {cardData.covid_precautions.includes(18) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I have no routine daily exposures </h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(8) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I live alone/with others who share my level of Covid caution</h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(3) ? <IonItem><IonLabel className="ion-text-wrap wrap"><h2> &bull;  I live with non-Covid cautious people </h2></IonLabel></IonItem> : null}
                                        {cardData.covid_precautions.includes(11) ? <IonItem><IonLabel className="ion-text-wrap"><h2> &bull; I use air purifiers and HEPA filters</h2></IonLabel></IonItem> : null}

                                        <IonItem> <IonLabel><p>Play:</p> </IonLabel> </IonItem>
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
                        {cardData.settings_show_long_covid ?
                            <IonAccordionGroup className="profile-card">
                                <IonAccordion value="second">
                                    <IonItem slot="header" lines="none">
                                        <IonLabel>Long Covid Support</IonLabel>
                                    </IonItem>
                                    <IonCardContent slot="content">
                                        <IonRow>
                                            {cardData.long_covid_choices.includes("I have LC") ? <IonItem lines="none"><IonLabel className="ion-text-wrap"><h2> &bull; I am living with Long Covid</h2></IonLabel></IonItem> : null}
                                            {cardData.long_covid_choices.includes("LC caretaker") ? <IonItem lines="none"><IonLabel className="ion-text-wrap"><h2> &bull; I care for someone with Long Covid</h2></IonLabel></IonItem> : null}
                                            {cardData.long_covid_choices.includes("I could help local") ? <IonItem lines="none"><IonLabel className="ion-text-wrap"><h2> &bull; I could provide local support </h2></IonLabel></IonItem> : null}
                                            {cardData.long_covid_choices.includes("I could help remote") ? <IonItem lines="none"><IonLabel className="ion-text-wrap"><h2> &bull; I could provide remote support</h2></IonLabel></IonItem> : null}
                                            {cardData.long_covid_choices.includes("I need help local") ? <IonItem lines="none"><IonLabel className="ion-text-wrap"><h2> &bull; I could use local support</h2></IonLabel></IonItem> : null}
                                            {cardData.long_covid_choices.includes("I need help remote") ? <IonItem lines="none"><IonLabel className="ion-text-wrap"><h2> &bull; I could use remote support</h2></IonLabel></IonItem> : null}

                                        </IonRow>

                                    </IonCardContent>
                                </IonAccordion>
                            </IonAccordionGroup>
                            : <></>}
                        <Swiper
                            modules={[Navigation, Pagination]}
                            pagination={{ clickable: true }}
                            centeredSlides
                            onInit={(swiper) => { swiperRef.current = swiper; }}

                        >
                            {cardData.pic2 !== null ?
                                <SwiperSlide>
                                    <IonCard>
                                        <img alt="Picture 2" src={cardData.pic2} onError={(e) => onImgError(e)} />
                                        {altShow == 2 ?
                                            <IonRow className="show-alt">
                                                <IonText>{cardData.pic2_alt}</IonText>
                                            </IonRow>
                                            : <></>}
                                        <IonCardSubtitle onClick={settingsAlt && altShow !== 2 && cardData.pic2_alt ? () => setAltShow(2) : () => setAltShow(null)}>{cardData.pic2_caption}
                                            {settingsAlt && (cardData.pic2_alt !== null && cardData.pic2_alt !== '') ?
                                                <FontAwesomeIcon className="alt-desc" icon={faSubtitles} />
                                                : <></>}
                                        </IonCardSubtitle>
                                    </IonCard>
                                </SwiperSlide>
                                : null}
                            {cardData.pic3 !== null ?
                                <SwiperSlide>
                                    <IonCard>
                                        <img alt={cardData.pic3_alt || "Picture 3"} src={cardData.pic3} onError={(e) => onImgError(e)} />
                                        {altShow == 3 ?
                                            <IonRow className="show-alt">
                                                <IonText>{cardData.pic3_alt}</IonText>
                                            </IonRow>
                                            : <></>}
                                        <IonCardSubtitle onClick={settingsAlt && altShow !== 3 && cardData.pic3_alt ? () => setAltShow(3) : () => setAltShow(null)}>{cardData.pic3_caption}
                                            {settingsAlt && (cardData.pic3_alt !== null && cardData.pic3_alt !== '') ?
                                                <FontAwesomeIcon className="alt-desc" icon={faSubtitles}
                                                />
                                                : <></>}
                                        </IonCardSubtitle>
                                    </IonCard>
                                </SwiperSlide>
                                : null}
                            {cardData.pic4 !== null ?
                                <SwiperSlide>
                                    <IonCard>
                                        <img alt="Picture 4" src={cardData.pic4} onError={(e) => onImgError(e)} />
                                        {altShow == 4 ?
                                            <IonRow className="show-alt">
                                                <IonText>{cardData.pic4_alt}</IonText>
                                            </IonRow>
                                            : <></>}
                                        <IonCardSubtitle onClick={settingsAlt && altShow !== 4 && cardData.pic4_alt ? () => setAltShow(4) : () => setAltShow(null)}>{cardData.pic4_caption}
                                            {settingsAlt && (cardData.pic4_alt !== null && cardData.pic4_alt !== '') ?
                                                <FontAwesomeIcon className="alt-desc" icon={faSubtitles} />
                                                : <></>}
                                        </IonCardSubtitle>
                                    </IonCard>
                                </SwiperSlide>
                                : null}
                            {cardData.pic5 !== null ?
                                <SwiperSlide>
                                    <IonCard>
                                        <img alt="Picture 5" src={cardData.pic5} onError={(e) => onImgError(e)} />
                                        {altShow == 5 ?
                                            <IonRow className="show-alt">
                                                <IonText>{cardData.pic5_alt}</IonText>
                                            </IonRow>
                                            : <></>}
                                        <IonCardSubtitle onClick={settingsAlt && altShow !== 5 && cardData.pic5_alt !== null ? () => setAltShow(5) : () => setAltShow(null)}>{cardData.pic5_caption}
                                            {settingsAlt && (cardData.pic5_alt !== null && cardData.pic5_alt !== '') ?
                                                <FontAwesomeIcon className="alt-desc" icon={faSubtitles} />
                                                : <></>}
                                        </IonCardSubtitle>
                                    </IonCard>

                                </SwiperSlide>
                                : null}
                            {cardData.pic6 !== null ?
                                <SwiperSlide>
                                    <IonCard>
                                        <img alt="Picture 6" src={cardData.pic6} onError={(e) => onImgError(e)} />
                                        {altShow == 6 ?
                                            <IonRow className="show-alt">
                                                <IonText>{cardData.pic6_alt}</IonText>
                                            </IonRow>
                                            : <></>}
                                        <IonCardSubtitle onClick={settingsAlt && altShow !== 6 && cardData.pic6_alt ? () => setAltShow(6) : () => setAltShow(null)}>{cardData.pic6_caption}
                                            {settingsAlt && (cardData.pic6_alt !== null && cardData.pic6_alt !== '') ?
                                                <FontAwesomeIcon className="alt-desc" icon={faSubtitles} />
                                                : <></>}
                                        </IonCardSubtitle>
                                    </IonCard>
                                </SwiperSlide>
                                : null}
                            {cardData.pic7 !== null ?
                                <SwiperSlide>
                                    <IonCard>
                                        <img alt="Picture 7" src={cardData.pic7} onError={(e) => onImgError(e)} />
                                        {altShow == 7 ?
                                            <IonRow className="show-alt">
                                                <IonText>{cardData.pic7_alt}</IonText>
                                            </IonRow>
                                            : <></>}
                                        <IonCardSubtitle onClick={settingsAlt && altShow !== 7 && cardData.pic7_alt ? () => setAltShow(7) : () => setAltShow(null)}>{cardData.pic7_caption}
                                            {settingsAlt && (cardData.pic7_alt !== null && cardData.pic7_alt !== '') ?
                                                <FontAwesomeIcon className="alt-desc" icon={faSubtitles} />
                                                : <></>}
                                        </IonCardSubtitle>
                                    </IonCard>
                                </SwiperSlide>
                                : null}
                            {cardData.pic8 !== null ?
                                <SwiperSlide>
                                    <IonCard>
                                        <img alt="Picture 8" src={cardData.pic8} onError={(e) => onImgError(e)} />
                                        {altShow == 8 ?
                                            <IonRow className="show-alt">
                                                <IonText>{cardData.pic8_alt}</IonText>
                                            </IonRow>
                                            : <></>}
                                        <IonCardSubtitle onClick={settingsAlt && altShow !== 8 ? () => setAltShow(8) : () => setAltShow(null)}>{cardData.pic8_caption}
                                            {settingsAlt && (cardData.pic8_alt !== null && cardData.pic8_alt !== '') ?
                                                <FontAwesomeIcon className="alt-desc" icon={faSubtitles} />
                                                : <></>}
                                        </IonCardSubtitle>
                                    </IonCard>
                                </SwiperSlide>
                                : null}
                            {cardData.pic9 !== null ?
                                <SwiperSlide>
                                    <IonCard>
                                        <img alt="Picture 9" src={cardData.pic9} onError={(e) => onImgError(e)} />
                                        {altShow == 9 ?
                                            <IonRow className="show-alt">
                                                <IonText>{cardData.pic9_alt}</IonText>
                                            </IonRow>
                                            : <></>}
                                        <IonCardSubtitle onClick={settingsAlt && altShow !== 9 && cardData.pic9_alt ? () => setAltShow(9) : () => setAltShow(null)}>{cardData.pic9_caption}
                                            {settingsAlt && (cardData.pic9_alt !== null && cardData.pic9_alt !== '') ?
                                                <FontAwesomeIcon className="alt-desc" icon={faSubtitles} />
                                                : <></>}
                                        </IonCardSubtitle>
                                    </IonCard>
                                </SwiperSlide>
                                : null}
                        </Swiper>
                        {somethingInLetsTalkAbout(cardData) ?
                            <IonAccordionGroup className="profile-card" value={["third"]}>
                                <IonAccordion value="third">
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
                                        {!(pro || currentStreak?.streak_count >= 3) ? <IonRow className="ion-justify-content-center"><IonButton size="small" fill="outline" onClick={() => setShowStoreAlert(true)}>Want to see more?</IonButton>
                                            <IonAlert
                                                isOpen={showStoreAlert}
                                                onDidDismiss={() => setShowStoreAlert(false)}
                                                header="A 3 day streak allows you to to view all Let's Talk About fields for everyone!"
                                                subHeader="Or become a Personal+ or Pro member!"
                                                buttons={[{
                                                    text: "Ok, maybe later.",
                                                    role: 'cancel'
                                                },
                                                {
                                                    text: 'What is my streak?',
                                                    handler: async () => {
                                                        window.location.pathname = "/activity"
                                                    }
                                                },
                                                {
                                                    text: 'Get Pro!',
                                                    handler: async () => {
                                                        window.location.pathname = "/store"
                                                    }
                                                }]}
                                            />
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