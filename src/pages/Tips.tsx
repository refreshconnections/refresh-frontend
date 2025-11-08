import { IonContent, IonPage, IonFab, IonFabButton, IonIcon } from '@ionic/react';
import React from 'react'
import { chevronBackOutline } from 'ionicons/icons';






const Tips: React.FC = () => {


    return (
        <IonPage>
            <IonContent>
            <IonFab className="very-top" slot="fixed" vertical="top" horizontal="start">
                <IonFabButton routerLink="/me" routerDirection="back" color="light">
                    <IonIcon icon={chevronBackOutline}></IonIcon>
                </IonFabButton>
            </IonFab>
                
            <iframe title="tips" src="https://refreshconnections.com/tips" style={{height: "100%", width: "100%", border: "none"}}></iframe>

            </IonContent>
        </IonPage>
    );

};



export default Tips;
