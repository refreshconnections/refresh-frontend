import { Capacitor } from '@capacitor/core';
import { IonContent, IonPage, IonFab, IonFabButton, IonIcon, IonRow, IonText, IonCard, IonCardContent, IonButton } from '@ionic/react';
import React from 'react'






const VersionUpdateRequired: React.FC = () => {


    return (
        <IonPage>
            <IonContent>
            
            <IonRow class="page-title" style={{paddingTop: "150pt"}}>
            <IonText class="bold" style={{padding: "25pt", textAlign: "center"}}>
              <h1>New great things are here! Please update your app.</h1>
            </IonText>
  
          </IonRow>
          <IonCard class="created-no-shadow">
              <IonCardContent class="ion-justify-content-center" style={{ display: "flex", flexDirection: "column" }}>
                <img alt="loading-freshy" src="../static/img/flower-mask.png" style={{ width: "40%", alignSelf: "center" }}></img>
              </IonCardContent>
            </IonCard>

            <IonRow class="ion-justify-content-center">
            {Capacitor.getPlatform() === 'ios' ?
              <IonButton href="https://apps.apple.com/us/app/refresh-connections/id6502037766">Go to the App Store</IonButton>
              : 
              <IonButton href="https://play.google.com/store/apps/details?id=com.refreshconnections.app">Go to the Play Store</IonButton>
            }
            </IonRow>
            

            </IonContent>
        </IonPage>
    );

};



export default VersionUpdateRequired;
