import React from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, IonNote, IonAccordion, IonAccordionGroup, IonRow, IonText, IonRouterLink, useIonModal } from '@ionic/react';
import CitySelectorModal from '../CitySelectorModal';
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
};

const ProfileUpdateFields: React.FC<Props> = ({
    profileUpdateType, setProfileUpdateType,
    newName, setNewName,
    birthdate, setBirthdate,
    selectedCity, setSelectedCity,
}) => {
    const [presentCitySelector, dismissCitySelector] = useIonModal(CitySelectorModal, {
        onDismiss: (city?: { name: string }) => {
            if (city) setSelectedCity(city.name);
            dismissCitySelector();
        }
    });

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
                <IonItem className="input">
                    <IonLabel position="stacked">Your date of birth</IonLabel>
                    <IonInput
                        type="date"
                        value={birthdate}
                        onIonInput={e => setBirthdate(e.detail.value!)}
                    />
                </IonItem>
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
                                    Traveling or moving around? With <IonRouterLink routerLink="/store"><span style={{ fontWeight: 'bold' }}>Pro</span></IonRouterLink>, you can update your location whenever you'd like — no need to contact us. <IonRouterLink routerLink="/store"><span style={{ fontWeight: 'bold' }}>Plus</span></IonRouterLink> lets you update once a day. Otherwise, you can update your location once every 60 days.
                                </div>
                            </IonAccordion>
                        </IonAccordionGroup>
                        <IonRow className="ion-padding ion-justify-content-center top-border">
                            <IonText className="ion-text-center">Need a one-time update? We've got you — just select your city below!</IonText>
                        </IonRow>
                    </div>
                    <IonItem className="input">
                        <IonLabel position="stacked">Requested location</IonLabel>
                        <IonInput
                            value={selectedCity}
                            placeholder="Tap to select a city"
                            readonly
                            onClick={() => presentCitySelector()}
                        />
                    </IonItem>
                </>
            )}
        </>
    );
};

export default ProfileUpdateFields;
