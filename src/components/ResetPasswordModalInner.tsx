import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';
import axios from "axios";
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonLabel, IonInput, IonCheckbox, IonButton, IonItem, IonRow, IonModal, IonButtons, IonNote, IonAlert } from '@ionic/react';
import Cookies from 'js-cookie';

import './ResetPasswordModalInner.css'

var BASE_URL = process.env.BASE_URL
if (!process.env.BASE_URL) {
  var BASE_URL = process.env.REACT_APP_BASE_URL
}

interface OpenResetModalInterface {
    setResetPasswordModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
    urlpath: string
  }


const ResetPasswordModalInner: React.FC<OpenResetModalInterface> = ({setResetPasswordModalOpen, urlpath}) => {

    const [newpassword, setNewPassword] = useState("");
    const [newpassword2, setNewPassword2] = useState("");

    const [errors, setErrors] = useState("");
    const [showAlert, setShowAlert] = useState(false)

    const csrftoken = Cookies.get('csrftoken');
    

    function formData() {
        const form_data = new FormData();

        form_data.append("newpassword", newpassword);
        form_data.append("newpassword2", newpassword2);

        return form_data;
    }

    function handleRegister(e: any) {
        e.preventDefault();

        setErrors("")
        const strippedpath = urlpath.replace("/forgot_password_reset", "")
        axios.defaults.withCredentials = true

        // const LOGIN_URL = `${myConfig.CRU_URL}/o/token/`;
        const PASSWORD_RESET_URL = `${BASE_URL}/account/amazingpassword_reset` + strippedpath + "/";
        console.log("PASSWORD_RESET_URL", PASSWORD_RESET_URL)

        axios({
            baseURL: PASSWORD_RESET_URL, 
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
                    console.log("Resetting your password.");
                }
            })
            .catch((error: any) => {
                console.log("ERROR", error);
                console.log("Password reset didn't work.");
                console.log(error.response)
                const errorsString = JSON.stringify(error.response.data)
                console.log("errors", errorsString)
                setErrors(errorsString)
            });
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar class="modal-title">
                    <IonTitle>Reset</IonTitle>
                    <IonButtons slot="end">
                        <IonButton href="/">Cancel</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonAlert
                    isOpen={showAlert}
                    header="Success!"
                    message="Try logging in with your new password now."
                    buttons={[{
                        text: 'OK',
                        role: 'confirm',
                        handler: () => {
                            window.location.href = "/"
                        },
                      }]}
                />
                <form className="ion-padding" onSubmit={handleRegister}>
                <IonItem>
                        <IonLabel position="floating">New Password</IonLabel>
                        <IonInput value={newpassword}
                            name="newpassword"
                            onIonChange={e => setNewPassword(e.detail.value!)}
                            type="password" />
                    </IonItem>
                    <IonItem>
                        <IonLabel position="floating">New Password (again)</IonLabel>
                        <IonInput value={newpassword2}
                            name="newpassword2"
                            onIonChange={e => setNewPassword2(e.detail.value!)}
                            placeholder="Repeat your new password"
                            type="password" />
                    </IonItem>
                    <IonButton className="ion-margin-top" type="submit" expand="block">
                        Change password
                    </IonButton>
                    {errors? <IonNote>Errors: {errors}</IonNote> : null}
                </form>
            </IonContent>
        </IonPage>
    )
};

export default ResetPasswordModalInner;

ResetPasswordModalInner.propTypes = {
    setResetPasswordModalOpen: PropTypes.func.isRequired,
  }