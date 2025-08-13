import {
  IonAlert,
  IonButton,
  IonButtons,
  IonCard, IonCardContent, IonCardTitle, IonContent, IonFooter, IonHeader, IonInput, IonItem, IonLabel, IonList, IonNote, IonPage, IonRow, IonSelect, IonSelectOption, IonText, IonTitle, IonToolbar, useIonAlert,
} from '@ionic/react';
import React, { useState } from 'react'
import axios from "axios";




import './CantAccessCard.css';
import './ReceiveATextModal.css';
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faSms } from '@fortawesome/pro-solid-svg-icons';


type Props = {
  phoneNumber: string,
  onDismiss: () => void;
};

var BASE_URL = process.env.BASE_URL
if (!process.env.BASE_URL) {
  var BASE_URL = process.env.REACT_APP_BASE_URL
}


const ReceiveATextModal: React.FC<Props> = (props) => {

  const { phoneNumber, onDismiss } = props;


  const [showTextSentAlert, setShowTextSentAlert] = useState(false)
  const [showEmailSentAlert, setShowEmailSentAlert] = useState(false)
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [disabled, setDisabled] = useState(false)



  const csrftoken = Cookies.get('csrftoken');

  function formDataPhoneNumber() {
    const form_data = new FormData();

    form_data.append("phone_number", phoneNumber);

    return form_data;
}

  function handleSendText() {

    setDisabled(true)


    const PASSWORD_RESET_URL = `${BASE_URL}/account/forgotemail/`;

    console.log("handling the email recovery (email and text)")

    axios({
        baseURL: PASSWORD_RESET_URL,
        headers: { 'X-CSRFToken': csrftoken,
        'Content-Type': 'application/json; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'enctype': 'multipart/form-data' },
        method: "POST",
        data: formDataPhoneNumber(),
    })
        .then((res: any) => {
            if (res.status === 200) {
                setShowTextSentAlert(true)
                console.log(res)
                console.log("Your link was sent.");
            }
        })
        .catch((error: any) => {
          console.log("awoo", error);
            if (error.response.status === 400) {
              console.log("made it here", error);
              setShowErrorAlert(true)
              setErrorMessage("The text couldn't be sent right now, but if your phone number was associated with an account, we still sent the confirmation email. Please email help@refreshconnections.com for more help if you don't receive the email.")
            }
            else {
              setErrorMessage('')
              setShowErrorAlert(true)
            }
            console.log("ERROR1", error);
            console.log("Email recovery via text didn't work");
            console.log(error.response)
        });
}


function handleSendEmail() {

  setDisabled(true)


  const PASSWORD_RESET_URL = `${BASE_URL}/account/forgotemailsendemail/`;

  console.log("handling the email recovery (email only)")

  axios({
      baseURL: PASSWORD_RESET_URL,
      headers: { 'X-CSRFToken': csrftoken,
      'Content-Type': 'application/json; charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'enctype': 'multipart/form-data' },
      method: "POST",
      data: formDataPhoneNumber(),
  })
      .then((res: any) => {
          if (res.status === 200) {
              setShowEmailSentAlert(true)
              console.log(res)
              console.log("Your email was sent.");
          }
      })
      .catch((error: any) => {
          setErrorMessage('')
          setShowErrorAlert(true)
          console.log("ERROR", error);
          console.log("Email recovery didn't work.");
          console.log(error.response)
      });
}




  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="modal-title">
          <IonTitle className="ion-text-wrap">Retrieve your email</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={onDismiss}>Go back</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="receive-a-text">
      <IonAlert
                isOpen={showTextSentAlert}
                onDidDismiss={onDismiss}
                header="If that phone number was associated with an account, we have texted you your email address in a masked format to help recover your account."
                buttons={['OK']}
                />
       <IonAlert
                isOpen={showEmailSentAlert}
                onDidDismiss={onDismiss}
                header="If that phone number was associated with an account, we have emailed the account you used to sign up."
                buttons={['OK']}
                />
        <IonAlert
                isOpen={showErrorAlert}
                onDidDismiss={onDismiss}
                header="Something went wrong."
                message={errorMessage ?? 'Please try again or email help@refreshconnections.com.'}
                buttons={['OK']}
                />

        

        <IonCard className="recieve-a-text-card">
        
            <IonCardContent>

              <div className="choice-block">
               <FontAwesomeIcon style={{fontSize: "40pt"}} icon={faEnvelope} />
              <IonNote color="black">
                <h2>Receive an <strong>email</strong> to the email address associated with your account.</h2>
              </IonNote>

              <IonButton onClick={async()=>handleSendEmail()} disabled={disabled}>
                Email me
              </IonButton>

              </div>


              <div className="choice-block">
              <FontAwesomeIcon style={{fontSize: "40pt"}} icon={faSms} />

              <IonNote color="black" >
              <h2>Receive a <strong>text</strong> of a masked version (a***e@example.com) of your email to the verified phone number associated with your account: {phoneNumber}.</h2><br/><h3> This will also send an email to your associated email.</h3>
              </IonNote>


              <IonButton onClick={async()=>handleSendText()} disabled={disabled}>
                Text and email me
              </IonButton>

              <IonNote color="navy">
                <br/><br/>
                <h3>By selecting "Text and email me", you agree to receive a message to your verified phone number that includes your masked email address. Data rates may apply.</h3>
              </IonNote>
              </div>

                               {/* <IonAlert
                isOpen={showNoEmailAccountRecoveryOptions}
                onDidDismiss={()=>setShowNoEmailAccountRecoveryOptions(false)}
                header={`Receive a text of a masked version (a***e@example.com) of your email to the verified phone number associated with your account. Or choose to send an email to the email address associated with your account.`}
                subHeader={'By selecting "Text and email me", you agree to receive a message to your verified phone number that includes your masked email address. Data rates may apply.'}
                buttons={[
                    {
                        text: 'Just email me',
                        handler: async () => {
                            console.log("email")
                        }
                    },
                    {
                        text: 'Text and email me',
                        handler: async () => {
                            handleSendText()
                        }
                    }
                    ]}
                /> */}
              
            </IonCardContent>
            <IonFooter className="ion-text-center">
            <IonText className="ion-padding"><a href="https://refreshconnections.com/terms">Terms and Conditions</a> | <a href="https://refreshconnections.com/privacy">Privacy Policy</a></IonText>
            </IonFooter>

        </IonCard>
      </IonContent>
    </IonPage>

  )
};
export default ReceiveATextModal;