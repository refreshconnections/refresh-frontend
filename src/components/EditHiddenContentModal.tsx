import React, { useRef, useState } from "react";
import axios from "axios";

import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem,  IonButtons, IonPage, IonRow, IonList, useIonAlert } from '@ionic/react';

import { clearHiddenSomething, removeBlockedConnection } from "../hooks/utilities";
import { useGetCurrentProfile } from "../hooks/api/profiles/current-profile";
import { useQueryClient } from "@tanstack/react-query";
import { useProfileDetails } from "../hooks/api";


type Props = {
    onDismiss: () => void;
};


const EditHiddenContentModal: React.FC<Props> = (props) => {

    const { onDismiss } = props;
    const data = useGetCurrentProfile().data;


    const [confirmClearHiddenAlert] = useIonAlert();
    const queryClient = useQueryClient()


    const confirmClear = async (something: string) => {
        confirmClearHiddenAlert({
          header: `Are you sure you want to clear all the ${something} you've hidden?`,
          buttons: [
            {
                text: 'Nevermind',
                role: 'destructive'
            },
            {
              text: 'Yes',
              handler: async () => {
                await clearHiddenSomething(something)
                queryClient.invalidateQueries({ queryKey: ['current'] })
              }
            },
          ],
        })
      }


    return (
        <IonPage>
            
            <IonHeader>
                <IonToolbar className="modal-title">
                    <IonTitle>Hidden Content</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onDismiss}>Done</IonButton>
                    </IonButtons>

                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonRow>
                    <IonList style={{width: "100%"}} lines="none">
                {/* <IonItem>
                    {data?.blocked_connections?.length} blocked connections
                    {data?.blocked_connections?.length > 0? <IonButton slot="end" fill="outline" onClick={()=>{showBlocked? setShowBlocked(false) : setShowBlocked(true)}}>{showBlocked? "Hide" : "Show"}</IonButton> : <></>}
                </IonItem>
                {showBlocked?
                <>
                {data?.blocked_connections.map((item: any, index: number) => (
                    <li key={index}>
                        <BlockedItem id={item} confirmUnblock={confirmUnblock}/>
                    </li>))}
                    </>
            : <></>} */}
                <IonItem>
                {data?.hidden_dialogs?.length} hidden chats
                    {data?.hidden_dialogs?.length > 0? <IonButton slot="end" onClick={()=>confirmClear("dialogs")}>Unhide all</IonButton> : <></>}
                </IonItem>
                <IonItem>
                {data?.hidden_announcements?.length} hidden posts
                    {data?.hidden_announcements?.length > 0? <IonButton slot="end" onClick={()=>confirmClear("posts")}>Unhide all</IonButton> : <></>}
                </IonItem>
                <IonItem>
                {data?.hidden_authors?.length} hidden authors
                    {data?.hidden_authors?.length > 0? <IonButton slot="end" onClick={()=>confirmClear("authors")}>Unhide all</IonButton> : <></>}
                </IonItem>
                </IonList>
                </IonRow>
            </IonContent>
        </IonPage>
    )
};

export default EditHiddenContentModal;