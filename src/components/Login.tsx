import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';
// import { FiLogIn } from "react-icons/fi";
import axios from "axios";
// import myConfig from "../../configs";
// import { ToastContainer, toast } from "react-toastify";
import { IonContent, IonPage, IonInput, IonButton, IonItem, IonRow, IonModal, IonButtons, IonCol, IonAlert, IonIcon } from '@ionic/react';
import Cookies from 'js-cookie';
import RegisterModal from "./RegisterModal";
import { eye, eyeOff } from 'ionicons/icons';

import "./Login.css"
import ForgotPasswordModal from "./ForgotPasswordModal";
import ResetPasswordModalInner from "./ResetPasswordModalInner";
import { pushOneSignalExtId } from "../hooks/utilities";
import { Preferences } from "@capacitor/preferences";
import Construction from "../pages/Construction";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocketContext } from "./WebsocketContext";


const ENV = process.env.NODE_ENV
const BASE_URL2 = process.env.BASE_URL
const UNDER_CONSTRUCTION = process.env.UNDER_CONSTRUCTION
const PRE_LAUNCH = process.env.PRE_LAUNCH

var BASE_URL = process.env.BASE_URL
if (!process.env.BASE_URL) {
  var BASE_URL = process.env.REACT_APP_BASE_URL
}


interface LoginInterface {
  setLoggedin: React.Dispatch<React.SetStateAction<boolean>>
}

const Login: React.FunctionComponent<LoginInterface> = ({ setLoggedin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerIsOpen, setRegisterIsOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState<boolean>(false)
  const [showBadLogin, setShowBadLogin] = useState<boolean>(false)
  // const [dontOpenError, setDontOpenError] = useState<boolean>(false)
  const [showConstructionAlert, setShowConstructionAlert] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)

  const [showDeleted, setShowDeleted] = useState<boolean>(false)
  const [showEmailNotValidated, setShowEmailNotValidated] = useState<boolean>(false)

  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false)

  const queryClient = useQueryClient()
  const { connect } = useWebSocketContext();


  useEffect(() => {

    if (window.location.pathname.includes("/forgot_password_reset")) {
      setResetPasswordOpen(true)
    }
    if (window.location.pathname.includes("/construction")) {
      setMaintenanceMode(true)
    }

  }, [[], email, password, registerIsOpen]); 


  const csrftoken = Cookies.get('csrftoken');
  console.log("csrftoken", csrftoken)

  function formData() {
    const form_data = new FormData();

    form_data.append("email", email);
    form_data.append("password", password);


    return form_data;
  }

  function formDataEmail() {
    const form_data = new FormData();

    form_data.append("email", email);


    return form_data;
  }

  function handleSave(e: any) {
    e.preventDefault();

    // const LOGIN_URL = `${myConfig.CRU_URL}/o/token/`;
    // const LOGIN_URL = `http://localhost:8000/account/amazinglogin/`;
    // const url = `http://${BASE_URL}:8000`;
    const LOGIN_URL = `${BASE_URL}/account/amazinglogin/`;



    axios({
      baseURL: LOGIN_URL,
      headers: { 'X-CSRFToken': csrftoken,
      'Content-Type': 'application/json; charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'enctype': 'multipart/form-data'},
      method: "POST",
      data: formData(),
    })
      .then(async (res: any) => {
        if (res.status === 200) {

          console.log("Your login was a success. ");
          console.log("token", res.data)
          localStorage.setItem("token", res.data["token"])
          await Preferences.set({
            key: 'EXPIRY',
            value: res.data["expiry"],
          });
          // queryClient.invalidateQueries()
          // queryClient.refetchQueries()
          pushOneSignalExtId(res.data["user"])
          setLoggedin(true)
          connect(); 

        }
      })
      .catch((error: any) => {
        console.log("ERROR", error);
        console.log("This email/password pair did not work.");
        if (error.response.status == 409) {
          setShowEmailNotValidated(true)
        }
        else if (error.response.status == 410) {
          setShowDeleted(true)
        }
        else {
          setShowBadLogin(true)
        }
      });
  }

  function handleSendEmailValidationAgain() {

    const VALIDATION_URL = `${BASE_URL}/account/resend_validation_link/`;

    console.log("handling the password reset")


    axios({
        baseURL: VALIDATION_URL,
        headers: { 'X-CSRFToken': csrftoken,
        'Content-Type': 'application/json; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'enctype': 'multipart/form-data' },
        method: "POST",
        data: formDataEmail(),
    })
        
}


  if (maintenanceMode) {
    return <Construction />
  }

  return (
    
    <IonPage>
      
      <IonContent>
        <IonRow className="login-page-title">
            <img src="../static/img/navylogo.png" alt="Refresh Connections logo" className="dark-dont-show"/>
            <img src="../static/img/refresh-connections-white-v2.png" alt="Refresh Connections logo" className="dark-show"/>
        </IonRow>
        <form className="ion-padding" onSubmit={handleSave}>
          <IonItem className="userpass">
            <IonInput value={email}
              name="email"
              onIonChange={e => setEmail(e.detail.value!)}
              placeholder="Email"
              type="text" />
          </IonItem>
          <IonItem className="userpass">
            <IonInput value={password}
              name="password"
              onIonChange={e => setPassword(e.detail.value!)}
              placeholder="Password"
              type={showPassword? "text" : "password"} />
            <IonButton fill="clear" slot="end" onClick={showPassword ? ()=>setShowPassword(false) : ()=>setShowPassword(true)}>
              <IonIcon slot="icon-only" icon={showPassword ? eyeOff : eye} ></IonIcon>
            </IonButton>
          </IonItem>
          <IonRow className="login-buttons">
            <IonCol>
              <IonButton className="login-button ion-margin-top" expand="block" fill="outline" id="reg-modal" onClick={() => setRegisterIsOpen(true)}>
                Sign up
              </IonButton>
            </IonCol>
            <IonCol>
              <IonButton className="login-button ion-margin-top" expand="block" type="submit" disabled={!password || !email}>
                Login
              </IonButton>
            </IonCol>
          </IonRow>
          <IonRow className="forgot-password">
            <IonButton fill="clear" className="login-button ion-margin-top" id="fp-modal" expand="block">
                Forgot email / password?
            </IonButton>
          </IonRow>
        </form>
        <IonAlert
            isOpen={showBadLogin}
            header="Uh oh!"
            subHeader="That didn't work. Is your email/password correct?"
            buttons={[
             
              {
              text: 'Try again',
              handler: () => {
                setShowBadLogin(false)
              },
            },
          ]}
          />
        <IonAlert
            isOpen={showDeleted}
            header="No account"
            message="This email is not associated with an active account. Please contact support at help@refreshconnections.com."
            buttons={[{
              text: 'Ok',
              handler: () => {
                setShowDeleted(false)
              }
            }]}
          />
        <IonAlert
            isOpen={showEmailNotValidated}
            header="Uh oh!"
            subHeader="That didn't work. Have you validated your email?"
            buttons={[{
              text: 'Close',
              handler: () => {
                setShowEmailNotValidated(false)
              }
            },
            {
              text: 'Send another validation link',
              handler: handleSendEmailValidationAgain
            }
            
          ]}
          />
        
        <RegisterModal />
        <ForgotPasswordModal />
        <IonModal isOpen={resetPasswordOpen}>
          <ResetPasswordModalInner setResetPasswordModalOpen={setResetPasswordOpen} urlpath={window.location.pathname}/>
        </IonModal>
      </IonContent>
    </IonPage>

  );
};

export default Login;

Login.propTypes = {
  setLoggedin: PropTypes.func.isRequired,
}