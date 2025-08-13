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
  
        const response = await updateCurrentUserProfile({ created_profile: true, paused_profile: true })
        const response2 = await updateCurrentUserProfile({ location_last_updated: null, romance_gender_last_updated: null, gender_last_updated: null })
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
                        Refresh Connections requires everybody to provide some basic profile information to see other people's profiles and make one-on-one or small group connections. This basic information includes uploading 3 photos, including 1 of your face. It's one way we keep our members safe while creating a culture of showing the real you.
                        <br/><br/>
                        If you aren't ready to upload your photos, you may choose a Paused Profile setting and enjoy the Refreshments Bar community forum until you are. This way you can read posts and comments and see what Refresh Connections is all about. 
                        <br/><br/>
                        
                        </IonText>
                        </IonCardContent>



                </IonCard>
                <IonRow className="ion-justify-content-center" style={{paddingBottom: "30pt"}}>
                    <IonButton fill="outline" onClick={onDismiss}>
                        Go Back
                    </IonButton>
                    <IonButton onClick={updateProfile} >
                        Proceed with Paused Profile
                    </IonButton>
                </IonRow>
            </IonContent>
        </IonPage>
    )
};

export default StayPausedModal;