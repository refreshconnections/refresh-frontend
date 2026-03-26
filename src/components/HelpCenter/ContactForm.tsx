import React, { useState, useEffect } from 'react';
import { IonCard, IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, IonTextarea, IonButton, IonText, IonRow, IonAlert } from '@ionic/react';
import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { sendAnEmail } from '../../hooks/utilities';
import { useGetCurrentProfile } from '../../hooks/api/profiles/current-profile';
import Subscriptions from './Subscriptions';
import ProfileUpdateFields from './ProfileUpdateFields';

const ContactForm: React.FC = () => {
    const currentUserProfile = useGetCurrentProfile().data;

    const [reason, setReason] = useState<string | null>("");
    const [message, setMessage] = useState<string | null>("");
    const [subject, setSubject] = useState<string | null>("");
    const [afterSendWait, setAfterSendWait] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [error, setError] = useState("");
    const [profileUpdateType, setProfileUpdateType] = useState<string | null>("");
    const [newName, setNewName] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [selectedCity, setSelectedCity] = useState("");

    useEffect(() => {
        if (profileUpdateType === "location") {
            setSubject("One time location update");
        }
    }, [profileUpdateType]);

    const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

    const clearFields = async () => {
        setReason("");
        setMessage("");
        setSubject("");
        setProfileUpdateType("");
        setNewName("");
        setBirthdate("");
        setSelectedCity("");
    };

    const sendHelpMail = async () => {
        setAfterSendWait(true);
        let toEmail = "";
        let subjectAppendage = "";
        if (reason == "report") {
            toEmail = "report@refreshconnections.com";
            subjectAppendage = "[ Report ] ";
        } else if (reason == "idea") {
            toEmail = "ideas@refreshconnections.com";
            subjectAppendage = "[ Idea ] ";
        } else if (reason == "profile") {
            toEmail = "help@refreshconnections.com";
            subjectAppendage = "[ Profile Update ] ";
        } else if (reason == "bug") {
            toEmail = "help@refreshconnections.com";
            subjectAppendage = "[ Bug ] ";
        } else if (reason == "subscription") {
            toEmail = "help@refreshconnections.com";
            subjectAppendage = "[ Subscription ] ";
        } else {
            toEmail = "help@refreshconnections.com";
            subjectAppendage = "[ Other ] ";
        }

        const messageRequired = !(reason === "profile" && (profileUpdateType === "name" || profileUpdateType === "age" || profileUpdateType === "location"));
        if (subject !== "" && reason !== "" && (message !== "" || !messageRequired)) {
            let deviceType = "";
            if (Capacitor.getPlatform() === 'ios') {
                deviceType = "ios";
            } else if (Capacitor.getPlatform() === 'android') {
                deviceType = "android";
            }

            let extraFields = "";
            if (reason === "profile" && profileUpdateType === "name") {
                extraFields = "\n requested name: " + newName;
            } else if (reason === "profile" && profileUpdateType === "age") {
                extraFields = "\n requested birthdate: " + birthdate;
            } else if (reason === "profile" && profileUpdateType === "location") {
                extraFields = "\n requested location: " + selectedCity;
            }

            const response = await sendAnEmail(toEmail, subjectAppendage + subject, message + "\n\n device: " + deviceType + "\n name: " + (currentUserProfile?.name ?? '') + extraFields);
            if (response.status == 200) {
                setShowAlert(true);
                clearFields();
                await delay(2000);
                setAfterSendWait(false);
            }
            return response;
        } else {
            setAfterSendWait(false);
            setError("Make sure you fill everything out first!");
            await delay(6000);
            setError("");
        }
    };

    return (
        <>
            <IonAlert
                isOpen={showAlert}
                onDidDismiss={() => setShowAlert(false)}
                header="Your message was sent."
                subHeader="Make sure to check your email if your request requires a response."
                buttons={['OK']}
            />
            <IonCard>
                <IonRow className="help-buttons">
                    <Link to="tips">
                        <IonButton className="ion-text-wrap" fill="outline" style={{ width: "50pt" }}>How To</IonButton>
                    </Link>
                    <Link to="faqs">
                        <IonButton className="ion-text-wrap" fill="outline" style={{ width: "50pt" }}>FAQs</IonButton>
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
                {reason === "subscription" && <Subscriptions />}
                {reason === "profile" && (
                    <ProfileUpdateFields
                        profileUpdateType={profileUpdateType}
                        setProfileUpdateType={setProfileUpdateType}
                        newName={newName}
                        setNewName={setNewName}
                        birthdate={birthdate}
                        setBirthdate={setBirthdate}
                        selectedCity={selectedCity}
                        setSelectedCity={setSelectedCity}
                    />
                )}
                <IonItem className="input">
                    <IonLabel position="stacked">Subject</IonLabel>
                    <IonInput
                        placeholder="Something short and sweet!"
                        onIonInput={e => setSubject(e.detail.value!)}
                        value={subject}
                    />
                </IonItem>
                <IonItem className="input">
                    <IonLabel position="stacked">
                        {reason === "profile" && profileUpdateType === "name"
                            ? "No need to explain the name change, but you're welcome to add details if you'd like!"
                            : reason === "profile" && (profileUpdateType === "age" || profileUpdateType === "location")
                            ? "Anything else we should know? (optional)"
                            : "Message"}
                    </IonLabel>
                    <IonTextarea
                        onIonInput={e => setMessage(e.detail.value!)}
                        value={message}
                        rows={3}
                        placeholder={reason === "profile" ? `Please include what you'd like this field to be updated to so we can help you faster.` : `Give us all the details you think we will need.`}
                        autoGrow={true}
                    />
                </IonItem>
            </IonCard>
            <IonRow className="send" style={{ paddingBottom: "20pt" }}>
                <IonButton onClick={sendHelpMail} disabled={
                    afterSendWait || !reason || !subject
                    || (reason !== "profile" && !message)
                    || (reason === "profile" && (profileUpdateType === "other" || !profileUpdateType) && !message)
                    || (reason === "profile" && !profileUpdateType)
                    || (reason === "profile" && profileUpdateType === "name" && !newName.trim())
                    || (reason === "profile" && profileUpdateType === "age" && !birthdate)
                    || (reason === "profile" && profileUpdateType === "location" && !selectedCity)
                }>Send</IonButton>
                {error ? <IonText>{error}</IonText> : <></>}
            </IonRow>
        </>
    );
};

export default ContactForm;
