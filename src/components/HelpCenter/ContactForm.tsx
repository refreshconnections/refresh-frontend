import React, { useState, useEffect } from 'react';
import { IonAccordion, IonAccordionGroup, IonCard, IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, IonTextarea, IonButton, IonText, IonRow, IonAlert } from '@ionic/react';
import { Link, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { sendAnEmail, CURRENT_APP_VERSION } from '../../hooks/utilities';
import { useGetCurrentProfile } from '../../hooks/api/profiles/current-profile';
import Subscriptions from './Subscriptions';
import ProfileUpdateFields from './ProfileUpdateFields';

const ContactForm: React.FC = () => {
    const currentUserProfile = useGetCurrentProfile().data;
    const location = useLocation();

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
    const [appVersion, setAppVersion] = useState("");

    useEffect(() => {
        App.getInfo().then(info => setAppVersion(info.version)).catch(() => setAppVersion("x.x.x"));
    }, []);

    useEffect(() => {
        if (profileUpdateType === "location") {
            setSubject("One time location update");
        }
    }, [profileUpdateType]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const prefill = params.get('prefill');
        if (prefill === 'name') {
            setReason("profile");
            setProfileUpdateType("name");
        } else if (prefill === 'age') {
            setReason("profile");
            setProfileUpdateType("age");
        }
    }, [location.search]);

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

    const isAutoFilled = reason === "profile" && (profileUpdateType === "name" || profileUpdateType === "age" || profileUpdateType === "location");
    const showCalendarBugFaq = reason === "bug" && /\bcal|event/i.test(`${subject ?? ""} ${message ?? ""}`);
    const showHiddenChatBugFaq = reason === "bug" && /hidden/i.test(`${subject ?? ""} ${message ?? ""}`);

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

        let emailSubject = subject;
        if (reason === "profile" && profileUpdateType === "name") {
            emailSubject = "Name change: " + newName;
        } else if (reason === "profile" && profileUpdateType === "age") {
            emailSubject = "Birthday change: " + birthdate;
        }

        if ((emailSubject !== "" || isAutoFilled) && reason !== "" && (message !== "" || isAutoFilled)) {
            let deviceType = "";
            if (Capacitor.getPlatform() === 'ios') {
                deviceType = "ios";
            } else if (Capacitor.getPlatform() === 'android') {
                deviceType = "android";
            }

            const emailMessage = message || emailSubject;

            let extraFields = "";
            if (reason === "profile" && profileUpdateType === "location") {
                extraFields = "\n requested location: " + selectedCity;
            }

            const response = await sendAnEmail(toEmail, subjectAppendage + emailSubject, emailMessage + "\n\n device: " + deviceType + "\n version: " + appVersion + " (" + CURRENT_APP_VERSION + ")" + "\n name: " + (currentUserProfile?.name ?? '') + extraFields);
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
                    <Link className="help-button-link" to="tips">
                        <IonButton className="ion-text-wrap help-button" fill="outline">How To</IonButton>
                    </Link>
                    <Link className="help-button-link" to="faqs">
                        <IonButton className="ion-text-wrap help-button" fill="outline">FAQs</IonButton>
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
                        birthYear={currentUserProfile?.birth_date ? parseInt(currentUserProfile.birth_date.split('-')[0]) : null}
                    />
                )}
                {!isAutoFilled && (
                    <IonItem className="input">
                        <IonLabel position="stacked">Subject</IonLabel>
                        <IonInput
                            placeholder="Something short and sweet!"
                            onIonInput={e => setSubject(e.detail.value!)}
                            value={subject}
                        />
                    </IonItem>
                )}
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
                        placeholder="Give us any details you think we will need."
                        autoGrow={true}
                    />
                </IonItem>
                {(showCalendarBugFaq || showHiddenChatBugFaq) && (
                    <div className="help-section">
                        <IonRow className="ion-padding ion-justify-content-center">
                            <IonText>Here is a quick answer that may help:</IonText>
                        </IonRow>
                        <IonAccordionGroup className="help-faqs">
                            {showCalendarBugFaq && (
                                <IonAccordion value="calendar-default">
                                    <IonItem slot="header" lines="none">
                                        <IonLabel className="ion-text-wrap">I can't find the event saved to my calendar.</IonLabel>
                                    </IonItem>
                                    <div className="ion-padding" slot="content">
                                        Refresh saves events to your device's default calendar. If you don't see the event, open your phone's Calendar settings and check which calendar is set as the default.
                                    </div>
                                </IonAccordion>
                            )}
                            {showHiddenChatBugFaq && (
                                <IonAccordion value="hidden-chats-organizer">
                                    <IonItem slot="header" lines="none">
                                        <IonLabel className="ion-text-wrap">I can't find my Hidden Chats.</IonLabel>
                                    </IonItem>
                                    <div className="ion-padding" slot="content">
                                        Hidden chats now appear in their own tab in the Chat Organizer in your Chats tab. If you don't see the Hidden tab, make sure both "Show Chat Organizer" and "Show Hidden Chats in Organizer" are toggled on in your Settings.
                                    </div>
                                </IonAccordion>
                            )}
                        </IonAccordionGroup>
                    </div>
                )}
            </IonCard>
            <IonRow className="send" style={{ paddingBottom: "20pt" }}>
                <IonButton onClick={sendHelpMail} disabled={
                    afterSendWait || !reason
                    || (!isAutoFilled && !subject)
                    || (reason !== "profile" && !message)
                    || (reason === "profile" && (profileUpdateType === "other" || !profileUpdateType) && !message)
                    || (reason === "profile" && !profileUpdateType)
                    || (reason === "profile" && profileUpdateType === "name" && !newName.trim())
                    || (reason === "profile" && profileUpdateType === "age" && !birthdate)
                    || (reason === "profile" && profileUpdateType === "location" && !selectedCity)
                }>Send</IonButton>
                {error && <IonText>{error}</IonText>}
            </IonRow>
        </>
    );
};

export default ContactForm;
