import React, { useRef, useState } from "react";
// import { FiLogIn } from "react-icons/fi";
import axios from "axios";
// import myConfig from "../../configs";
// import { ToastContainer, toast } from "react-toastify";
import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonInput, IonButton, IonItem, IonModal, IonButtons, IonNote, IonAlert, IonPage, IonIcon } from '@ionic/react';
import Cookies from 'js-cookie';

import { eye, eyeOff } from 'ionicons/icons';


import './ChangePasswordModal.css'

var BASE_URL = process.env.BASE_URL
if (!process.env.BASE_URL) {
  var BASE_URL = process.env.REACT_APP_BASE_URL
}

type Props = {
    onDismiss: () => void;
};

const ChangePasswordModal: React.FC<Props> = (props) => {

    const { onDismiss } = props;

    const modal = useRef<HTMLIonModalElement>(null);

    const [oldpassword, setOldPassword] = useState("");
    const [newpassword, setNewPassword] = useState("");
    const [newpassword2, setNewPassword2] = useState("");

    const [showOldPassword, setShowOldPassword] = useState<boolean>(false)
    const [showPassword1, setShowPassword1] = useState<boolean>(false)
    const [showPassword2, setShowPassword2] = useState<boolean>(false)



    const [errors, setErrors] = useState("");
    const [showAlert, setShowAlert] = useState(false)

    function passwordChangeSuccessful() {
        onDismiss();
    }

    const csrftoken = Cookies.get('csrftoken');

    function formData() {
        const form_data = new FormData();

        form_data.append("oldpassword", oldpassword);
        form_data.append("newpassword", newpassword);
        form_data.append("newpassword2", newpassword2)

        return form_data;
    }

    function handleRegister(e: any) {
        e.preventDefault();

        setErrors("")

        // const LOGIN_URL = `${myConfig.CRU_URL}/o/token/`;
        const PASSWORD_CHANGE_URL = `${BASE_URL}/account/amazingpassword_change/`;
        const token = localStorage.getItem("token")
        axios({
            baseURL: PASSWORD_CHANGE_URL,
            headers: {
                'Authorization': "Token " + token,
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

                    console.log(res)
                    console.log("Your password change was a success.");
                }
            })
            .catch((error: any) => {
                console.log("ERROR", error);
                console.log("Password change didn't work.");
                console.log(error.response)
                const errorsString = JSON.stringify(error.response.data)
                setErrors(errorsString)
            });
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="modal-title ">
                    <IonTitle>Change Password</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onDismiss}>Cancel</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={passwordChangeSuccessful}
                    header="Your password change was successful!"
                    buttons={['OK']}
                />
                <form className="ion-padding" onSubmit={handleRegister}>
                    <IonItem>
                        <IonLabel position="floating">Old Password</IonLabel>
                        <IonInput value={oldpassword}
                            name="oldpassword"
                            onIonInput={e => setOldPassword(e.detail.value!)}
                            type={showOldPassword ? "text" : "password"} />
                        <IonButton style={{marginTop: "20pt"}} fill="clear" slot="end" onClick={showOldPassword ? () => setShowOldPassword(false) : () => setShowOldPassword(true)}>
                            <IonIcon slot="icon-only" icon={showOldPassword ? eyeOff : eye} ></IonIcon>
                        </IonButton>
                    </IonItem>
                    <IonItem>
                        <IonLabel position="floating">New Password</IonLabel>
                        <IonInput value={newpassword}
                            name="newpassword"
                            onIonInput={e => setNewPassword(e.detail.value!)}
                            type={showPassword1 ? "text" : "password"} />
                        <IonButton style={{marginTop: "20pt"}} fill="clear" slot="end" onClick={showPassword1 ? () => setShowPassword1(false) : () => setShowPassword1(true)}>
                            <IonIcon slot="icon-only" icon={showPassword1 ? eyeOff : eye} ></IonIcon>
                        </IonButton>
                    </IonItem>
                    <IonItem>
                        <IonLabel position="floating">New Password (again)</IonLabel>
                        <IonInput value={newpassword2}
                            name="newpassword2"
                            onIonInput={e => setNewPassword2(e.detail.value!)}
                            placeholder="Repeat your new password"
                            type={showPassword2 ? "text" : "password"} />
                        <IonButton style={{marginTop: "20pt"}} fill="clear" slot="end" onClick={showPassword2 ? () => setShowPassword2(false) : () => setShowPassword2(true)}>
                            <IonIcon slot="icon-only" icon={showPassword2 ? eyeOff : eye} ></IonIcon>
                        </IonButton>
                    </IonItem>
                    <IonButton className="ion-margin-top" type="submit" expand="block">
                        Change Password
                    </IonButton>
                    {errors ? <IonNote>Errors: {errors}</IonNote> : null}
                </form>
            </IonContent>
        </IonPage>
    )
};

export default ChangePasswordModal;