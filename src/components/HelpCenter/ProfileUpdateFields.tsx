import React from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, IonNote, IonAccordion, IonAccordionGroup, IonRow, IonText, IonRouterLink, IonDatetime, IonDatetimeButton, IonModal, useIonModal } from '@ionic/react';
import moment from 'moment';
import CitySelectorModal from '../CitySelectorModal';
import { maxBirthdateForAdult } from '../../hooks/utilities';
import "./HelpCenter.css"

type Props = {
    profileUpdateType: string | null;
    setProfileUpdateType: (v: string) => void;
    newName: string;
    setNewName: (v: string) => void;
    birthdate: string;
    setBirthdate: (v: string) => void;
    selectedCity: string;
    setSelectedCity: (v: string) => void;
    birthYear?: number | null;
};

const ProfileUpdateFields: React.FC<Props> = ({
    profileUpdateType, setProfileUpdateType,
    newName, setNewName,
    birthdate, setBirthdate,
    selectedCity, setSelectedCity,
    birthYear,
}) => {
    const defaultBirthdate = birthYear && birthYear >= 1920 ? `${birthYear}-01-01` : null;

    const citySelectorOpeningRef = React.useRef(false);
    const [presentCitySelector, dismissCitySelector] = useIonModal(CitySelectorModal, {
        onDismiss: (city?: { name: string }) => {
            if (city) setSelectedCity(city.name);
            dismissCitySelector();
        },
    });
    const openCitySelector = () => {
        if (citySelectorOpeningRef.current) return;
        citySelectorOpeningRef.current = true;
        presentCitySelector({
            onDidDismiss: () => { citySelectorOpeningRef.current = false; },
        });
    };

    return (
        <>
            <IonItem>
                <IonLabel position="stacked">What would you like to update?</IonLabel>
                <IonSelect placeholder="Select one" value={profileUpdateType} onIonChange={e => setProfileUpdateType(e.detail.value!)}>
                    <IonSelectOption value="name">My name</IonSelectOption>
                    <IonSelectOption value="age">My age</IonSelectOption>
                    <IonSelectOption value="location">My location</IonSelectOption>
                    <IonSelectOption value="other">Something else</IonSelectOption>
                </IonSelect>
            </IonItem>
            {profileUpdateType === "name" && (
                <IonItem className="input">
                    <IonLabel position="stacked">Name you'd like to use</IonLabel>
                    <IonInput
                        placeholder="Your preferred name"
                        value={newName}
                        onIonInput={e => setNewName(e.detail.value!)}
                    />
                </IonItem>
            )}
            {profileUpdateType === "age" && (
                <>
                    <IonItem className="input">
                        <IonLabel position="stacked">Your date of birth</IonLabel>
                        <IonInput readonly value={birthdate} placeholder="Tap to select" style={{ pointerEvents: 'none' }} />
                        <IonDatetimeButton datetime="help-birthdate" style={{ position: "absolute", width: "100%", height: "100%", opacity: 0 }} />
                    </IonItem>
                    {birthdate && <IonNote style={{ paddingLeft: '16px', paddingBottom: '8px' }}>Your age will show as {moment().diff(moment(birthdate, 'YYYY-MM-DD'), 'years')}</IonNote>}
                    <IonModal keepContentsMounted={true}>
                        <IonDatetime
                            id="help-birthdate"
                            preferWheel={true}
                            presentation="date"
                            max={maxBirthdateForAdult()}
                            value={birthdate || defaultBirthdate}
                            onIonChange={e => {
                                const val = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
                                setBirthdate(val?.split('T')[0] ?? "");
                            }}
                            showDefaultButtons={true}
                        />
                    </IonModal>
                </>
            )}
            {profileUpdateType === "location" && (
                <>
                    <div className="help-section">
                        <IonRow className="ion-padding ion-justify-content-center">
                            <IonText>Here are some quick answers:</IonText>
                        </IonRow>
                        <IonAccordionGroup className="help-faqs">
                            <IonAccordion value="update-often">
                                <IonItem slot="header" lines="none">
                                    <IonLabel className="ion-text-wrap">Can I change my location myself?</IonLabel>
                                </IonItem>
                                <div className="ion-padding" slot="content">
                                    Need to change your location while traveling? With Refresh <IonRouterLink routerLink="/store"><span style={{ fontWeight: 'bold' }}>Pro</span></IonRouterLink>, 
                                    you can update it anytime. With Refresh <IonRouterLink routerLink="/store"><span style={{ fontWeight: 'bold' }}>Plus</span></IonRouterLink>  you can update once a day.
                                    Without a paid plan, location updates are available every 60 days.
                                </div>
                            </IonAccordion>
                        </IonAccordionGroup>
                        <IonRow className="ion-padding ion-justify-content-center top-border">
                            <IonText className="ion-text-center">Need a one-time update? We've got you — just select your city below and let us know!</IonText>
                        </IonRow>
                    </div>
                    <IonItem className="input">
                        <IonLabel position="stacked">Requested location</IonLabel>
                        <IonInput
                            value={selectedCity}
                            placeholder="Tap to select a city"
                            readonly
                            onClick={openCitySelector}
                        />
                    </IonItem>
                </>
            )}
        </>
    );
};

export default ProfileUpdateFields;
