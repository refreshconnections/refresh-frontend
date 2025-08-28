import React, { useRef, useState } from "react";

import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonInput, IonButton, IonItem, IonModal, IonButtons, IonNote, IonAlert, IonPage, IonTextarea, IonSelect, IonSelectOption, useIonModal, IonCol, IonGrid, IonRow, IonText, IonCheckbox, IonRadioGroup, IonRadio } from '@ionic/react';

import { sendAnEmail } from "../hooks/utilities";
import { useGetCurrentProfile } from "../hooks/api/profiles/current-profile";


type Props = {
    onDismiss: () => void;
};

const ChangeSuggestionModal: React.FC<Props> = (props) => {

    const { onDismiss } = props;
    const currentUserProfile = useGetCurrentProfile().data;

    const [showAlert, setShowAlert] = useState(false)

    const [message, setMessage] = useState('')
    const [name, setName] = useState(currentUserProfile?.name ?? '')
    const [myProject, setMyProject] = useState(false)

    function emailSendSuccessful() {
        setShowAlert(false)
        onDismiss();
    }

    
    async function handlePostSubmit() {

        const text = message + "\n\n" + (myProject ? "I help run this project" : "") + "\n\n" + name
        
        const response = await sendAnEmail("refreshments@refreshconnections.com", " [ Create Change ] Project suggestion", text)
        console.log("email response", response)

        setShowAlert(true)
    }

    return (
        <IonPage>
            
            <IonHeader>
                <IonToolbar className="modal-title">
                    <IonTitle>Change Idea</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onDismiss}>Cancel</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="create-report">
                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={emailSendSuccessful}
                    header="Thank you!"
                    subHeader="The Refresh Connections team will check this out - we might email you with follow-up questions."
                    buttons={['OK']}
                />
                <form className="ion-padding" onSubmit={handlePostSubmit}>
                    <IonItem>
                        <IonLabel position="stacked">Details</IonLabel>
                        <IonTextarea value={message}
                            style={{ minHeight: "63pt" }}
                            name="details"
                            autoGrow={true}
                            rows={4}
                            autoCapitalize='sentences'
                            onIonInput={e => setMessage(e.detail.value!)}
                            placeholder="Tell us about this Covid-related project. How might Refresh Connections help support it?  &#10;Include a link if you have one."
                        />
                    </IonItem>
                    <IonItem>
                        <IonCheckbox checked={myProject} onIonChange={(e) => setMyProject(e.detail.checked)} />
                        <IonLabel className="ion-text-wrap">I help run this project.</IonLabel>
                    </IonItem>
                    <IonItem>
                        <IonLabel position="stacked">Your name</IonLabel>
                        <IonInput value={name}
                            autoCapitalize='words'
                            onIonInput={e => setName(e.detail.value!)}
                        />
                    </IonItem>
                    <IonButton className="ion-margin-top" onClick={handlePostSubmit} expand="block" disabled={message?.length <  5}>
                        Submit
                    </IonButton>
                    
                </form>
            </IonContent>
        </IonPage>
    )
};

export default ChangeSuggestionModal;