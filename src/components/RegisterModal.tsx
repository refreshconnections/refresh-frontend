import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';
// import { FiLogIn } from "react-icons/fi";
import axios from "axios";
// import myConfig from "../../configs";
// import { ToastContainer, toast } from "react-toastify";
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonLabel, IonInput, IonButton, IonItem, IonModal, IonButtons, IonNote, IonAlert, IonRow, IonCheckbox, IonText } from '@ionic/react';
import Cookies from 'js-cookie';

var BASE_URL = process.env.BASE_URL
if (!process.env.BASE_URL) {
  var BASE_URL = process.env.REACT_APP_BASE_URL
}

import "./RegisterModal.css"


const RegisterModal: React.FC = () => {
    const modal = useRef<HTMLIonModalElement>(null);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [first_name, setFirstName] = useState("");
    const [last_name, setLastName] = useState("");

    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [emailMarketing, setEmailMarketing] = useState(false)

    const [nameErrors, setNameErrors] = useState<string | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [showAlert, setShowAlert] = useState(false)

    const [disableButton, setDisableButton] = useState(false)


    useEffect(() => {
        if (first_name.includes("@") || first_name.includes("+")) {
            setNameErrors("First name can't contain special characters.")
        }
        else if (last_name.includes("@") || last_name.includes("+")) {
            setNameErrors("Last name can't contain special characters.")
        }
        else {
            setNameErrors(null)
        }
    
      }, [first_name, last_name])
    
    function dismiss() {
        modal.current?.dismiss();
    }

    function registrationSuccessful() {
        setShowAlert(false);
        modal.current?.dismiss();
        setPassword("");
        setConfirmPassword("");
        setEmail("");
        setFirstName("");
        setLastName("");
    }

    const csrftoken = Cookies.get('csrftoken');

    function formData() {
        const form_data = new FormData();

        console.log("emailmarketing", emailMarketing)

        form_data.append("password", password);
        form_data.append("confirmPassword", confirmPassword);
        form_data.append("email", email)
        form_data.append("first_name", first_name)
        form_data.append("last_name", last_name)
        form_data.append("email_marketing", emailMarketing ? "true" : "false")

        return form_data;
    }

    function handleRegister(e: any) {
        e.preventDefault();

        setDisableButton(true)

        setErrors([])

        const LOGIN_URL = `${BASE_URL}/account/register/`;

        axios({
            baseURL: LOGIN_URL,
            headers: { 'X-CSRFToken': csrftoken, 
            'Content-Type': 'application/json; charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
            'enctype': 'multipart/form-data' },
            method: "POST",
            data: formData(),
        })
            .then((res: any) => {
                if (res.status === 200) {
                    setShowAlert(true)

                    console.log(res.data)
                    console.log("Your registration was a success.");
                }
                setDisableButton(false)
            })
            .catch((error: any) => {
                console.log("ERROR", error);
                console.log("Registration didn't work.");
                console.log(error.response.data)
                const errorsList: string[] = []
                if (error.response.data["email"]?.length > 0) {
                    error.response.data["email"].forEach((element: any) => {
                        errorsList.push("Email: " + element["message"])
                    })
                }
                if (error.response.data["name"]?.length > 0) {
                    error.response.data["name"].forEach((element: any) => {
                        errorsList.push("Name: " + element["message"])
                    })
                }
                if (error.response.data["password"]?.length > 0) {
                    error.response.data["password"].forEach((element: any) => {
                        errorsList.push("Password: " + element["message"])
                    })
                }
                else if (error.response.data["confirmPassword"]?.length > 0) {
                    error.response.data["confirmPassword"].forEach((element: any) => {
                        errorsList.push("Confirm Password: " + element["message"])
                    })
                }
                else {
                    errorsList.push("Something went wrong.")
                }
                setErrors(errorsList)
                console.log("errors", errorsList)
                setDisableButton(false)

            });
    }

    return (
        <IonModal ref={modal} trigger="reg-modal">
            <IonHeader>
                <IonToolbar className="modal-title">
                    <IonTitle>Sign up</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={dismiss}>Close</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={registrationSuccessful}
                    header="Your signup was successful!"
                    message="Check your email for a link to validate before you can log in."
                    buttons={['OK']}
                />
                <form className="ion-padding" onSubmit={handleRegister}>
                    <IonItem>
                        <IonLabel position="floating">Email</IonLabel>
                        <IonInput value={email}
                            name="email"
                            onIonChange={e => setEmail(e.detail.value!)}
                            placeholder="Email"
                            type="email" />
                    </IonItem>
                    <IonItem>
                        <IonLabel position="floating">First name</IonLabel>
                        <IonInput value={first_name}
                            name="first name"
                            autoCapitalize='words'
                            onIonChange={e => setFirstName(e.detail.value!)}
                            placeholder="First Name"
                            type="text" />
                    </IonItem>
                    <IonItem>
                        <IonLabel position="floating">Last name</IonLabel>
                        <IonInput value={last_name}
                            name="last name"
                            autoCapitalize='words'
                            onIonChange={e => setLastName(e.detail.value!)}
                            placeholder="Last Name"
                            type="text" />
                    </IonItem>
                    <IonItem>
                        <IonLabel position="floating">Password</IonLabel>
                        <IonInput value={password}
                            name="password"
                            onIonChange={e => setPassword(e.detail.value!)}
                            placeholder="Password"
                            type="password" />
                    </IonItem>
                    <IonItem>
                        <IonLabel position="floating">Confirm Password</IonLabel>
                        <IonInput value={confirmPassword}
                            name="password"
                            onIonChange={e => setConfirmPassword(e.detail.value!)}
                            placeholder="Password"
                            type="password" />
                    </IonItem>
                    <IonItem className="terms">
                        <IonCheckbox slot="start" onIonChange={e => setAgreedToTerms(e.detail.checked)}></IonCheckbox>
                        <IonText>I have read and agree to the Refresh Connections <a href="https://refreshconnections.com/terms">Terms and Conditions.</a></IonText>
                    </IonItem>
                    <IonButton className="ion-margin-top" type="submit" expand="block" disabled={!agreedToTerms || nameErrors !== null || disableButton}>
                        Sign up
                    </IonButton>
                    {(nameErrors !== null)?
                     <IonNote >{nameErrors}</IonNote>
                     : <></>
                    }
                    {errors && errors.length > 0? <IonNote color="danger">Errors: </IonNote> : null}
                    {errors?.some(msg => msg.includes("Email already in use")) ? (
                    <IonNote color="danger">
                        This email cannot be used to create a new account. If you already have an account, try logging in or contact <a href="mailto:help@refreshconnections.com">help@refreshconnections.com</a> for assistance.
                    </IonNote>
                    ) : (
                    errors?.map((message: string, index: number) => (
                        <div key={index}>
                        <IonNote color="danger">{message}</IonNote>
                        </div>
                    ))
                    )}
                </form>
            </IonContent>
        </IonModal>
    )
};

export default RegisterModal;