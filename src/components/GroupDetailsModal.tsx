import { IonContent, IonPage, IonFab, IonFabButton, IonIcon, IonFabList, useIonAlert, IonCard, IonCardTitle, IonCardHeader, IonCardContent, IonText, IonRow, IonAvatar, IonItem, IonList, IonCardSubtitle, IonButton } from '@ionic/react';
import React, { useState } from 'react'
import { chevronBackOutline } from 'ionicons/icons';

import axios from 'axios';

import { acceptGroupChatInvite, onImgError, } from '../hooks/utilities';

import './GroupDetailsModal.css'


axios.defaults.withCredentials = true;



type Props = {
    groupDetailsData: any;
    currentUser: any;
    onDismiss: () => void;
};


const GroupDetailsModal: React.FC<Props> = (props) => {

    const { groupDetailsData, currentUser, onDismiss } = props;
    const [acceptLoading, setAcceptLoading] = useState(false);


    // useEffect(() => {

    //     setLoading(true); // set loading to true

    //     const fetchData = async () => {
    //         setError(null);
    //         setLoading(true);
    //         try {
    //             setData(await getCurrentUserProfile());
    //             setLoading(false);
    //         } catch (error: any) {
    //             setError(error.message);
    //             setLoading(false)
    //             console.log(error)
    //         }

    //     }

    //     fetchData();

    // }, []);


    console.log("GROUPDATA", groupDetailsData)
    console.log("current", currentUser)
    console.log("current user", currentUser.user)
    console.log("owner", currentUser == groupDetailsData?.owner.id)
    console.log("current user boolean", currentUser.user == groupDetailsData?.owner)
    console.log("in", currentUser in groupDetailsData?.requested_members)

    const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

    const acceptInvite = async () => {
        setAcceptLoading(true)
        acceptGroupChatInvite(groupDetailsData.id)
        await delay(3000)
        setAcceptLoading(false)
        onDismiss()

    }


    return (
        <IonPage>
            <IonContent fullscreen scrollEvents={true}>
                <IonFab className="very-top" slot="fixed" vertical="top" horizontal="start">
                    <IonFabButton onClick={onDismiss} color="light">
                        <IonIcon icon={chevronBackOutline}></IonIcon>
                    </IonFabButton>
                </IonFab>
                <IonCard className="group-details ">
                    <IonCardHeader>
                        <IonCardTitle>
                            {groupDetailsData?.group_name}
                        </IonCardTitle>
                        <IonCardSubtitle>
                            {groupDetailsData?.members.length} members
                        </IonCardSubtitle>
                        {groupDetailsData?.requested_members.find((x: { id: number; }) => x.id === currentUser.user) ?
                            <IonRow style={{display: "flex", flexDirection: "row"}}>
                                <IonButton onClick={acceptInvite}>Accept</IonButton>
                                {acceptLoading ? 
                                <img alt="loading" style={{maxWidth: "15%"}} src={"../static/img/loading-refresh-faster.gif"}></img>
                                : <></>}
                            </IonRow>
                            : <></>
                        }
                        <IonRow>
                            {groupDetailsData?.description}
                        </IonRow>
                    </IonCardHeader>
                    <IonCardContent>
                        <IonText>
                            Admin:
                        </IonText>
                        <IonItem className="chat-item">
                            <IonAvatar>
                                <img alt="chat avatar" src={groupDetailsData?.owner.profile_pic} onError={(e) => onImgError(e)} />
                            </IonAvatar>
                            <IonText className="name">{groupDetailsData?.owner.name}</IonText>
                            {currentUser == groupDetailsData?.owner.id ?
                                <IonButton slot="end" disabled={true} color="primary">
                                    This is you!
                                </IonButton> : <></>}
                        </IonItem>

                        <IonText>
                            Members:
                        </IonText>
                        <IonList>
                            {groupDetailsData?.members.length < 2 ? <IonItem className="chat-item">No one has joined yet</IonItem> :
                            <>
                            {groupDetailsData?.members.map((item: any, index: number) => (
                                <>
                                { item.id !== groupDetailsData.owner.id ?
                                <li key={index}>
                                    <IonItem className="chat-item">
                                        <IonAvatar>
                                            <img alt="chat avatar" src={item.profile_pic} onError={(e) => onImgError(e)} />
                                        </IonAvatar>
                                        <IonText className="name">{item.name}</IonText>
                                        {currentUser == item.id && currentUser !== groupDetailsData.owner.id ?
                                            <IonButton slot="end" fill="outline" color="danger">
                                                Leave
                                            </IonButton> : <></>}
                                        {currentUser !== item.id && currentUser == groupDetailsData.owner.id ?
                                            <IonButton slot="end" color="danger">
                                                Remove
                                            </IonButton> : <></>}
                                    </IonItem>
                                </li>
                                : <></>}
                                </>
                            ))} 
                            </>}
                        </IonList>
                        {groupDetailsData?.requested_members.length > 0 ?
                            <>
                                <IonText>
                                    Invites sent to:
                                </IonText>
                                <IonList>
                                    {groupDetailsData?.requested_members.map((item: any, index: number) => (
                                        <li key={index}>
                                            <IonItem className="chat-item">
                                                <IonAvatar>
                                                    <img alt="chat avatar" src={item.profile_pic} onError={(e) => onImgError(e)} />
                                                </IonAvatar>
                                                <IonText className="name">{item.name}</IonText>
                                                {currentUser !== item.id && currentUser == groupDetailsData.owner ?
                                                    <IonButton slot="end" color="danger">
                                                        Uninvite
                                                    </IonButton> : <></>}
                                            </IonItem>
                                        </li>
                                    ))}
                                </IonList>
                            </>
                            : <></>}
                    </IonCardContent>
                </IonCard>
            </IonContent>
        </IonPage>
    );

};



export default GroupDetailsModal;


