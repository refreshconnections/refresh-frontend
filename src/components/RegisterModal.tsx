import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';
// import { FiLogIn } from "react-icons/fi";
import axios from "axios";
// import myConfig from "../../configs";
// import { ToastContainer, toast } from "react-toastify";
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonItem, IonModal, IonButtons, IonNote, IonAlert, IonRow, IonCheckbox, IonText, IonCard } from '@ionic/react';
import Cookies from 'js-cookie';
import BoxedStackedInput from './BoxedStackedInput';

var BASE_URL = process.env.BASE_URL
if (!process.env.BASE_URL) {
    var BASE_URL = process.env.REACT_APP_BASE_URL
}

import { useGetSiteSettings } from '../hooks/api/sitesettings';
import "./RegisterModal.css"


const RegisterModal: React.FC = () => {
    const modal = useRef<HTMLIonModalElement>(null);
    const siteSettings = useGetSiteSettings().data;

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
            headers: {
                'X-CSRFToken': csrftoken,
                'Content-Type': 'application/json; charset=UTF-8',
                'Access-Control-Allow-Origin': '*',
                'enctype': 'multipart/form-data'
            },
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
                const responseData = error?.response?.data;

                if (responseData?.["email"]?.length > 0) {
                    responseData["email"].forEach((element: any) => {
                        errorsList.push("Email: " + element["message"])
                    })
                }
                if (responseData?.["name"]?.length > 0) {
                    responseData["name"].forEach((element: any) => {
                        errorsList.push("Name: " + element["message"])
                    })
                }
                if (responseData?.["password"]?.length > 0) {
                    responseData["password"].forEach((element: any) => {
                        errorsList.push("Password: " + element["message"])
                    })
                }
                if (responseData?.["confirmPassword"]?.length > 0) {
                    responseData["confirmPassword"].forEach((element: any) => {
                        errorsList.push("Confirm Password: " + element["message"])
                    })
                }
                if (!errorsList.length && typeof responseData === 'string' && responseData.trim()) {
                    errorsList.push(responseData.trim())
                }
                if (!errorsList.length) {
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
                {siteSettings?.allow_account_sign_ups === false ? (
                    <IonCard color="white" className="ion-padding ion-text-center">
                        <IonText className="ion-text-center">
                            <p>Account sign ups have been temporarily paused.</p>
                        </IonText>
                    </IonCard>
                ) : <>
                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={registrationSuccessful}
                    header="Your signup was successful!"
                    message="Check your email for a link to validate before you can log in."
                    buttons={['OK']}
                />
                <form className="ion-padding register-modal-form" onSubmit={handleRegister}>
                    <BoxedStackedInput
                        label="Email"
                        value={email}
                        name="email"
                        onIonInput={e => setEmail(e.detail.value!)}
                        placeholder="email@example.com"
                        type="email"
                    />
                    <BoxedStackedInput
                        label="First name"
                        value={first_name}
                        name="first name"
                        autocapitalize="words"
                        onIonInput={e => setFirstName(e.detail.value!)}
                        placeholder="First name"
                        type="text"
                    />
                    <BoxedStackedInput
                        label="Last name"
                        value={last_name}
                        name="last name"
                        autocapitalize="words"
                        onIonInput={e => setLastName(e.detail.value!)}
                        placeholder="Last name"
                        type="text"
                    />
                    <BoxedStackedInput
                        label="Password"
                        value={password}
                        name="password"
                        onIonInput={e => setPassword(e.detail.value!)}
                        placeholder="Password"
                        type="password"
                    />
                    <BoxedStackedInput
                        label="Confirm Password"
                        value={confirmPassword}
                        name="password"
                        onIonInput={e => setConfirmPassword(e.detail.value!)}
                        placeholder="Password"
                        type="password"
                    />
                    <IonItem className="terms">
                        <IonCheckbox slot="start" onIonChange={e => setAgreedToTerms(e.detail.checked)}></IonCheckbox>
                        <IonText>I have read and agree to the Refresh Connections <a href="https://refreshconnections.com/terms">Terms and Conditions</a> and <a href="https://refreshconnections.com/privacy">Privacy Policy</a>.</IonText>
                    </IonItem>
                    <IonButton className="ion-margin-top" type="submit" expand="block" disabled={!agreedToTerms || nameErrors !== null || disableButton}>
                        Sign up
                    </IonButton>
                    {(nameErrors !== null) ?
                        <IonNote >{nameErrors}</IonNote>
                        : <></>
                    }
                    {errors && errors.length > 0 ? <IonNote color="danger">Errors: </IonNote> : null}
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
                </>}
            </IonContent>
        </IonModal>
    )
};

export default RegisterModal;
