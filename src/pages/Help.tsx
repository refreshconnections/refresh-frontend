import { IonContent, RefresherEventDetail, IonHeader, IonCard, IonCardContent, IonPage, IonTitle, IonToolbar, IonCardTitle, IonCardSubtitle, IonButton, IonText, IonFab, IonFabButton, IonIcon, IonRow, IonModal, IonButtons, IonItem, IonLabel, IonList, IonCheckbox, IonInput, IonRefresher, IonRefresherContent, IonFabList, useIonAlert, useIonModal, IonNote, IonCol, IonGrid, IonSelect, IonSelectOption, IonTextarea, IonAlert, IonFooter } from '@ionic/react';
import ProfileCard from '../components/ProfileCard';
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { close as closeIcon, filter as filterIcon, flower as flowerIcon, heartHalf as heartHalfIcon, person as personIcon, chatbubble, heartOutline as heartIcon, bugOutline as bugIcon } from 'ionicons/icons';
import { chevronBackOutline } from 'ionicons/icons';
import axios, { AxiosError } from 'axios';

import "./Page.css"
import "./Help.css"

import { sendAnEmail } from '../hooks/utilities';
import { Link } from 'react-router-dom';
import { useGetStatuses } from '../hooks/api/status';
import StatusToast from '../components/StatusToast';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import Subscriptions from '../components/HelpCenter/Subscriptions';
import { Capacitor } from '@capacitor/core';





const Help: React.FC = () => {

    const currentUserProfile = useGetCurrentProfile().data;

    const [reason, setReason] = useState<string | null>("")
    const [message, setMessage] = useState<string | null>("")
    const [subject, setSubject] = useState<string | null>("")
    const [afterSendWait, setAfterSendWait] = useState(false)
    const [showAlert, setShowAlert] = useState(false)
    const [error, setError] = useState("")


    const [isToastOpen, setIsToastOpen] = useState<boolean>(false)

    const statuses = useGetStatuses().data;

    const helpStatus = useMemo(
        () => statuses?.find(status => {
        return status.page.includes('help')}),
        [statuses]
    );

    const isBeforeExpiration = useMemo(
        () => helpStatus?.active &&  new Date() < new Date(helpStatus?.expirationDateTime) || !helpStatus?.expirationDateTime,
        [helpStatus?.expirationDateTime]
    );


    const clearFields = async () => {
        setReason("")
        setMessage("")
        setSubject("")
    }

    function helpSubmitSuccessful() {
        setShowAlert(false)
    }

    const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

    const sendHelpMail = async () => {
        // pass form data in here
        setAfterSendWait(true)
        let toEmail = ""
        let subjectAppendage = ""
        if (reason == "report") {
            toEmail = "report@refreshconnections.com"
            subjectAppendage = "[ Report ] "
        }
        else if (reason == "idea") {
            toEmail = "ideas@refreshconnections.com"
            subjectAppendage = "[ Idea ] "
        }
        else if (reason == "profile") {
            toEmail = "help@refreshconnections.com"
            subjectAppendage = "[ Profile Update ] "
        }
        else if (reason == "bug"){
            toEmail = "help@refreshconnections.com"
            subjectAppendage = "[ Bug ] "
        }
        else if (reason == "subscription"){
            toEmail = "help@refreshconnections.com"
            subjectAppendage = "[ Subscription ] "
        }
        else {
            toEmail = "help@refreshconnections.com"
            subjectAppendage = "[ Other ] "
        }

        // TODO: clean messages / subject?

        if (subject !=="" && reason !=="" && message !== "") {

            let deviceType = ""
            if (Capacitor.getPlatform() === 'ios') {
                deviceType = "ios"
            }
            else if (Capacitor.getPlatform() === 'android'){
                deviceType = "android"
            }

            const response = await sendAnEmail(toEmail, subjectAppendage + subject, message + "\n\n device: " + deviceType + "\n name: " + (currentUserProfile?.name ?? '') )
            if (response.status == 200) {
                setShowAlert(true)
                clearFields()
                await delay(2000)
                setAfterSendWait(false)
            }
            return response
        }
        else {
            setAfterSendWait(false)
            setError("Make sure you fill everything out first!")
            await delay(6000)
            setError("")
        }

        

    }

    return (
        <IonPage>
            <IonContent className="help">
                <IonFab className="very-top" slot="fixed" vertical="top" horizontal="start">
                    <IonFabButton routerLink="/me" routerDirection="back" color="light">
                        <IonIcon icon={chevronBackOutline}></IonIcon>
                    </IonFabButton>
                </IonFab>
                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={helpSubmitSuccessful}
                    header="Your message was sent."
                    subHeader="Make sure to check your email if your request requires a response."
                    buttons={['OK']}
                />

                <IonRow className="page-title bigger">
                    <img className="color-invertible" src="../static/img/help.png" alt="help" />
                </IonRow>
                <IonCard>
                <IonRow className="help-buttons">
                        <Link to="tips">
                        <IonButton className="ion-text-wrap" fill="outline" style={{width: "50pt"}}>How To</IonButton>
                        </Link>
                        
                        <Link to="faqs">
                        <IonButton className="ion-text-wrap" fill="outline" style={{width: "50pt"}}>FAQs</IonButton>
                        </Link>
                        
                    </IonRow>
                <IonItem>
                    <IonLabel position="stacked">How can we help?</IonLabel>
                    
                    <IonSelect className="help-select" value={reason} placeholder="Reason" onIonChange={e => setReason(e.detail.value!)}>
                        <IonSelectOption value="report">Report someone</IonSelectOption>
                        <IonSelectOption value="subscription">Subscription issue</IonSelectOption>
                        <IonSelectOption value="idea">Idea / feature request</IonSelectOption>
                        <IonSelectOption value="profile">I want to update a field on my profile and I can't</IonSelectOption>
                        <IonSelectOption value="bug">I think I found a bug</IonSelectOption>
                        <IonSelectOption value="other">Other</IonSelectOption>
                    </IonSelect>
                </IonItem>
                {reason == "subscription" ?
                    <Subscriptions /> : <></>
                }
                <IonItem className="input">
                    <IonLabel position="stacked">Subject</IonLabel>
                    <IonInput placeholder="Something short and sweet!"
                        onIonChange={e => setSubject(e.detail.value!)}
                        value={subject}>
                    </IonInput>
                </IonItem>
                <IonItem className="input">
                    <IonLabel position="stacked">Message</IonLabel>
                    <IonTextarea onIonChange={e => setMessage(e.detail.value!)} value={message} rows={3} placeholder={reason === "profile" ? `Please include what you'd like this field to be updated to so we can help you faster.` : `Give us all the details you think we will need.`}  autoGrow={true}></IonTextarea>
                </IonItem>
                </IonCard>

                <IonRow className="send" style={{paddingBottom: "20pt"}}>
                <IonButton onClick={sendHelpMail} disabled={afterSendWait || !reason || !message || !subject}>Send</IonButton>
                {error ? <IonText>{error}</IonText> : <></>}
                </IonRow>
                {helpStatus?.active && (helpStatus?.header || helpStatus?.message) && isBeforeExpiration ?
                    <StatusToast isToastOpen={true} setIsToastOpen={setIsToastOpen} header={helpStatus?.header} message={helpStatus?.message}/> 
                    : <></>}
            </IonContent>
        </IonPage>
    );

};



export default Help;
