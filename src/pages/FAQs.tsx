import { IonContent, RefresherEventDetail, IonHeader, IonCard, IonCardContent, IonPage, IonTitle, IonToolbar, IonCardTitle, IonCardSubtitle, IonButton, IonText, IonFab, IonFabButton, IonIcon, IonRow, IonModal, IonButtons, IonItem, IonLabel, IonList, IonCheckbox, IonInput, IonRefresher, IonRefresherContent, IonFabList, useIonAlert, useIonModal, IonNote, IonCol, IonGrid } from '@ionic/react';
import React from 'react'
import { chevronBackOutline } from 'ionicons/icons';






const FAQs: React.FC = () => {


    return (
        <IonPage>
            <IonContent>
            <IonFab class="very-top" slot="fixed" vertical="top" horizontal="start">
                <IonFabButton routerLink="/me" routerDirection="back" color="light">
                    <IonIcon icon={chevronBackOutline}></IonIcon>
                </IonFabButton>
            </IonFab>
                
            <iframe title="tutorial" src="https://refreshconnections.com/faqsapp" style={{height: "100%", width: "100%", border: "none"}}></iframe>

            </IonContent>
        </IonPage>
    );

};



export default FAQs;
