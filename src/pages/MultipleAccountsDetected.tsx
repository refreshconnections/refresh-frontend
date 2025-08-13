import { Capacitor } from '@capacitor/core';
import { IonContent, IonPage, IonRow, IonText, IonButton, IonFooter } from '@ionic/react';
import React from 'react'
import { handleLogoutCommon } from '../hooks/utilities';






const MultipleAccountsDetected: React.FC = () => {


    return (
        <IonPage>
            <IonContent className="ion-padding">
            
            <IonRow className="page-title">
            <IonText className="bold" style={{padding: "15pt", textAlign: "center"}}>
              <h1>It looks like you've had an account with Refresh Connections before.</h1>
              <p>
                Each member is only allowed one account, and those who have previously deleted an account can't return without contacting support. This is to protect the integrity of connections and prevent misuse. 
              </p>
              <p>If you have not created an account before or you previously deleted your account in error, please reach out to <a href="mailto:help@refreshconnections.com">help@refreshconnections.com</a></p>
            </IonText>
  
          </IonRow>
          <IonRow className="ion-justify-content-center ion-padding">
          <img alt="loading-freshy" src="../static/img/flower-mask.png" style={{ width: "30%", alignSelf: "center" }}></img>
          <IonText className="bold" style={{paddingTop: "15pt", textAlign: "center"}}>
          <p>Please log in with your existing account or use the "Forgot email / password?" button to retrieve your account details.</p>
          </IonText>
            </IonRow>
            <IonRow className="ion-justify-content-center ion-padding">
              <IonButton onClick={async ()=>handleLogoutCommon()}>Return to login page</IonButton>
            </IonRow>
            
            <IonFooter className="ion-text-center" style={{paddingTop: "30pt", paddingBottom: "30pt"}}>
            <IonText className="ion-padding"><a href="https://refreshconnections.com/terms">Terms and Conditions</a> | <a href="https://refreshconnections.com/privacy">Privacy Policy</a></IonText>
            </IonFooter>
            </IonContent>

        </IonPage>
    );

};



export default MultipleAccountsDetected;
