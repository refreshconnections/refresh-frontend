import React, { useEffect, useRef, useState } from "react";

import axios from "axios";
// import myConfig from "../../configs";
// import { ToastContainer, toast } from "react-toastify";
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonLabel, IonInput, IonCheckbox, IonButton, IonItem, IonRow, IonModal, IonButtons, IonNote, IonAlert, IonFooter, IonText, IonSegment, IonSegmentButton, useIonModal } from '@ionic/react';
import Cookies from 'js-cookie';
import PhoneInput from 'react-phone-number-input'


import './ForgotPasswordModal.css'
import ReceiveATextModal from "./ReceiveATextModal";

var BASE_URL = process.env.BASE_URL
if (!process.env.BASE_URL) {
  var BASE_URL = process.env.REACT_APP_BASE_URL
}


const ForgotPasswordModal: React.FC = () => {
    const modal = useRef<HTMLIonModalElement>(null);
    const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email'); // Tracks whether the user is inputting an email or phone number

    // const [username, setUsername] = useState("");
    // const [password, setPassword] = useState("");
    // const [email, setEmail] = useState("");
    
    // const [name, setName] = useState("");
    // const [confirmPassword, setConfirmPassword] = useState("");

    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState<any>(null);


    const [errors, setErrors] = useState("");
    const [showAlert, setShowAlert] = useState(false)

    const handleReceiveTextDismiss = () => {
        setPhoneNumber('')
        accountRecoveryModalDismiss()

    }

    const [accountRecoveryModalPresent, accountRecoveryModalDismiss] = useIonModal(ReceiveATextModal, {
        phoneNumber: phoneNumber,
        onDismiss: ()=>handleReceiveTextDismiss()
      });
    

    function dismiss() {
        modal.current?.dismiss();
    }

    function passwordChangeSuccessful() {
        modal.current?.dismiss();
        setEmail("")
        setShowAlert(false)
    }

    const csrftoken = Cookies.get('csrftoken');

    function formDataEmail() {
        const form_data = new FormData();

        form_data.append("email", email);

        return form_data;
    }

    function handleSendEmail(e: any) {
        e.preventDefault();

        setErrors("")

        const PASSWORD_RESET_URL = `${BASE_URL}/account/passwordreset/`;
        // const PASSWORD_RESET_URL = `${BASE_URL}/account/amazingpassword_reset/`;


        console.log("handling the password reset")


        axios({
            baseURL: PASSWORD_RESET_URL,
            headers: { 'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json; charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
            'enctype': 'multipart/form-data' },
            method: "POST",
            data: formDataEmail(),
        })
            .then((res: any) => {
                if (res.status === 200) {
                    setShowAlert(true)

                    console.log(res)
                    console.log("Your link was sent.");
                }
            })
            .catch((error: any) => {
                console.log("ERROR", error);
                console.log("Password reset didn't work.");
                console.log(error.response)
                const errorsString = JSON.stringify(error.response.data)
                setErrors(errorsString)
            });
    }

    

    return (
        <IonModal ref={modal} trigger="fp-modal">
            <IonHeader>
                <IonToolbar className="modal-title">
                    <IonTitle className="ion-text-wrap">Login help</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={dismiss}>Cancel</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={passwordChangeSuccessful}
                    header="If that email was associated with an account, we have sent that email a link to reset the password."
                    message="If you do not receive an email, please select 'Forgot email' above to find your account using your phone number."
                    buttons={['OK']}
                />
                
                <div className="ion-padding">
                    <IonSegment  value={identifierType} onIonChange={(e) => setIdentifierType(e.detail.value as 'email' | 'phone')}>
                        <IonSegmentButton value="phone">
                        <IonLabel>Forgot email</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="email">
                        <IonLabel>Forgot password</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>
                </div>
                {identifierType == "email"?
                <form className="ion-padding" onSubmit={handleSendEmail} key="email">
                    <IonItem>
                        <IonLabel position="floating">Email</IonLabel>
                        <IonInput value={email}
                            placeholder="example@email.com"
                            name="email"
                            onIonInput={e => setEmail(e.detail.value!)}
                            type="email" />
                    </IonItem>
                    <IonButton className="ion-margin-top" type="submit" expand="block" disabled={!email || !email.includes('@')}>
                        Send password-reset email
                    </IonButton>
                    {errors? <IonNote>Errors: {errors}</IonNote> : null}
                    
                </form>
                :
                <form className="ion-padding" key="form">
                    <IonItem className="forgot-email-reset">
                    <IonLabel position="stacked">Phone number</IonLabel>
                        <PhoneInput
                            placeholder={"(888) 888-8888"}
                            defaultCountry="US"
                            value={phoneNumber}
                            onChange={setPhoneNumber}
                             />
                    </IonItem>
                    <IonButton className="ion-margin-top" onClick={()=>{modal.current?.dismiss();accountRecoveryModalPresent()} } expand="block" disabled={!phoneNumber || phoneNumber?.length < 7}>
                        See account recovery options
                    </IonButton>
                    
                    {errors? <IonNote>Errors: {errors}</IonNote> : null}
                    
                </form>}
            </IonContent>
            <IonFooter className="ion-text-center ion-padding">
                <IonText color="navy">Need assistance? Send us an email at <a href="mailto:help@refreshconnections.com">help@refreshconnections.com</a>.</IonText>
            </IonFooter>
        </IonModal>
    )
};

export default ForgotPasswordModal;