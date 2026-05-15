import React, { useRef, useState } from "react";

import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonInput, IonButton, IonItem, IonModal, IonButtons, IonNote, IonAlert, IonPage, IonTextarea, IonSelect, IonSelectOption, useIonModal, IonCol, IonGrid, IonRow, IonText, IonCheckbox, IonCard, IonCardTitle, IonCardContent } from '@ionic/react';
import { Preferences } from "@capacitor/preferences";
import { updateCurrentUserProfile } from "../hooks/utilities";
import { useQueryClient } from "@tanstack/react-query";



type Props = {
    onDismiss: () => void;
};


const StayPausedModal: React.FC<Props> = (props) => {

    const { onDismiss } = props;
    const queryClient = useQueryClient()

    const [appLoading, setAppLoading] = useState(false);


    const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

    const updateProfile = async (e: any) => {


        await Preferences.set({
          key: 'ONBOARDED',
          value: 'true',
        });
  
        const response = await updateCurrentUserProfile({ created_profile: true, paused_profile: true, location_last_updated: null, romance_gender_last_updated: null, gender_last_updated: null })
        queryClient.invalidateQueries({ queryKey: ['current'] })

        setAppLoading(true)
        await delay(2000)
        setAppLoading(false)
  
        window.location.pathname = "/community"
  
    }




    return (
        <IonPage>
            <IonContent>
                <IonCard style={{ boxShadow: "none" }}>
                    <IonCardTitle style={{padding: "30pt"}}>
                    Not quite ready to upload your photos?
                    </IonCardTitle>
                    <IonCardContent>
                        <IonText>
                        To keep Refresh Connections safe and genuine, the Personal Profile requires 3 photos, including 1 that shows your face.
                        <br/><br/>
                        If you're not ready yet, you can still explore the Refreshments Bar and Calendar on the community side.
                        <br/><br/>
                        You can come back anytime to finish your Personal Profile and start making one-on-one connections.
                        </IonText>
                        </IonCardContent>



                </IonCard>
                <IonRow
                    className="ion-justify-content-center"
                    style={{ paddingBottom: "30pt", gap: "12px" }}
                >
                    <IonButton fill="outline" onClick={onDismiss} disabled={appLoading}>
                        Go Back
                    </IonButton>
                    <IonButton onClick={updateProfile} disabled={appLoading}>
                        {appLoading ? 'Loading...' : 'Finish Personal Profile later'}
                    </IonButton>
                </IonRow>
            </IonContent>
        </IonPage>
    )
};

export default StayPausedModal;
