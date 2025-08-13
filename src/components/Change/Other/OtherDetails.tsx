import { IonActionSheet, IonAvatar, IonBadge, IonButton, IonCard, IonCardContent, IonCardSubtitle, IonCardTitle, IonChip, IonCol, IonContent, IonFab, IonFabButton, IonFooter, IonIcon, IonInput, IonItem, IonLabel, IonList, IonNote, IonPage, IonRow, IonText, IonTextarea, useIonAlert, useIonModal } from "@ionic/react";
import React, { useEffect, useState } from "react";

import { useParams } from "react-router-dom"
import { chevronBackOutline } from 'ionicons/icons';


import "./OtherDetails.css"
import { useQueryClient } from "@tanstack/react-query";
import { useGetCurrentProfile } from "../../../hooks/api/profiles/current-profile";
import { useOtherDetails } from "../../../hooks/api/campaigns/other/other-by-id";
import Participated from "../Participated";









const OtherDetails: React.FC = () => {

    let { id } = useParams<{id: string}>()

    const queryClient = useQueryClient()
    const me = useGetCurrentProfile().data
    const other = useOtherDetails(parseInt(id)).data;
  
    
    

    


    const delay = (ms: any) => new Promise(res => setTimeout(res, ms));




    return (
        <IonPage>
            <IonContent>
                <IonFab className="very-top" slot="fixed" vertical="top" horizontal="start">
                    <IonFabButton routerLink={`/change/#${id}`} routerDirection="back" color="light">
                        <IonIcon icon={chevronBackOutline}></IonIcon>
                    </IonFabButton>
                </IonFab>



                <IonCard className="other">

                    <IonRow className="ion-align-items-center">
                            <IonCol size="11">
                            <IonCardTitle>
                            {other?.title ?  other?.title : ""}
                            </IonCardTitle>
                            </IonCol>
                            <IonCol size="1">
                            </IonCol>
                        </IonRow>

                    
                    <IonCardContent >
                        <IonText>

                        
                        {other?.details? <h2>{other?.details}<br/></h2> : <></>}
                        {other?.purpose? <h2>Purpose: {other?.purpose}</h2> : <></>}
                        {other?.location? <h2>Location: {other?.location}</h2> : <></>}
                    
                        </IonText>
                        
                        

                    </IonCardContent>
                    {other?.link?
                          <IonRow className="ion-justify-content-center" style={{paddingBottom: "0px"}}>
                        <IonButton fill="outline" href={other?.link}>Learn more</IonButton>
                        </IonRow>
                        : <></>}

                    <Participated campaign_id={other?.campaign} />

                </IonCard>

               
            </IonContent>
        </IonPage>
    )


};

export default OtherDetails;

