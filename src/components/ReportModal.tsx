import React, { useRef, useState } from "react";
import axios from "axios";

import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonInput, IonButton, IonItem, IonModal, IonButtons, IonNote, IonAlert, IonPage, IonTextarea, IonSelect, IonSelectOption, useIonModal, IonCol, IonGrid, IonRow, IonText, IonCheckbox } from '@ionic/react';

import { reportSomething, sendAnEmail } from "../hooks/utilities";


type Props = {
    offender: "user" | "announcement" | "comment",
    text: string,
    id: number,
    onDismiss: () => void;
};

interface ReportDetails {
    offender?: "user" | "announcement" | "comment",
    text?: string,
    reason?: string,
    details?: string | null
}
const ReportModal: React.FC<Props> = (props) => {

    const { offender, text, id, onDismiss } = props;


    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [inProfile, setInProfile] = useState(false);
    const [inMessages, setInMessages] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [afterSendWait, setAfterSendWait] = useState(false)


    const [showAlert, setShowAlert] = useState(false)

    function reportSubmitSuccessful() {
        setShowAlert(false)
        onDismiss();
    }

    function formData() {
        const form_data: ReportDetails = {}

        form_data.offender = offender;
        form_data.text = text;
        form_data.reason = reason;
        form_data.details = details;
        if (inProfile){
            form_data.details = form_data.details + "---In profile"
        }
        if (inMessages){
            form_data.details = form_data.details + "---In messages"
        }
        return form_data;
    }
    
    async function handlePostSubmit(e: any) {
        setAfterSendWait(true)
        e.preventDefault();
        setErrors([])

        const report_response = await reportSomething(id, offender)
        console.log("report response", report_response)
        

        const response = await sendAnEmail("report@refreshconnections.com", " [ Report ] " + offender, JSON.stringify(formData(), null, '\t'))
        console.log("report response", response)

        setShowAlert(true)
        setAfterSendWait(false)
    }

    return (
        <IonPage>
            
            <IonHeader>
                <IonToolbar color="danger" class="modal-title">
                    <IonTitle>Submit Report</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onDismiss}>Cancel</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent class="create-report">
                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={reportSubmitSuccessful}
                    header="Thanks for helping our community by submitting a report."
                    subHeader="The Refresh team will check this out ASAP!"
                    buttons={['OK']}
                />
                <form className="ion-padding" onSubmit={handlePostSubmit}>
                    <IonItem>
                        <IonLabel position="stacked">What you're reporting</IonLabel>
                        <IonInput 
                            value={offender}
                            disabled={true}
                            type="text" 
                            /> 
                    </IonItem>
                    <IonItem>
                        <IonLabel position="stacked">Reason</IonLabel>
                        <IonSelect aria-label="Tags" placeholder="What's wrong with this?" onIonChange={e => setReason(e.detail.value!)}>
                            <IonSelectOption value="Covid Minimizing">Covid minimizing</IonSelectOption>
                            <IonSelectOption value="Safety Shaming">Safety shaming</IonSelectOption>
                            <IonSelectOption value="Disinformation">Disinformation</IonSelectOption>
                            <IonSelectOption value="Hate/harassment">Hate/harassment</IonSelectOption>
                            <IonSelectOption value="Sexual content">Sexual content</IonSelectOption>
                            <IonSelectOption value="Scams">Scams</IonSelectOption>
                            <IonSelectOption value="Graphic content">Graphic content</IonSelectOption>
                            <IonSelectOption value="Offensive material">Offensive material</IonSelectOption>
                            <IonSelectOption value="Other">Other</IonSelectOption>
                        </IonSelect>
                    </IonItem>
                    {offender == "user"?
                    <>
                    <IonItem>
                        <IonLabel position="stacked">Where was this violation?</IonLabel>
                        
                    
                    <IonItem lines="none">
                    <IonCheckbox slot="start" onIonChange={e => setInProfile(e.detail.checked)}></IonCheckbox>
                    <IonText>In their profile</IonText>
                    </IonItem>
                    <IonItem lines="none">
                    <IonCheckbox slot="start" onIonChange={e => setInMessages(e.detail.checked)}></IonCheckbox>
                    <IonText>In our private messages</IonText>
                    </IonItem>
                    </IonItem>
                    </>
                    : <></>
                    }
                    <IonItem>
                        <IonLabel position="stacked">Details</IonLabel>
                        <IonTextarea value={details}
                            style={{ minHeight: "63pt" }}
                            name="details"
                            autoGrow={true}
                            autoCapitalize='sentences'
                            onIonChange={e => setDetails(e.detail.value!)}
                            placeholder="Add specifics for the moderation team to check out."
                        />
                    </IonItem>
                    
                    <IonButton className="ion-margin-top" type="submit" expand="block" disabled={!reason || afterSendWait}>
                        Submit
                    </IonButton>
                    {errors && errors.length > 0 ? <IonNote color="danger">Errors:</IonNote> : null}
                    {errors?.map((message: string, index: number) =>
                        <div key={index}>
                            <IonNote >{message}</IonNote>
                        </div>
                    )}
                </form>
            </IonContent>
        </IonPage>
    )
};

export default ReportModal;