import React, { useState } from "react";
import OngoingChats from "./OngoingChats";
import NewChats from "./NewChats";
import HiddenChats from "./HiddenChats";
import { IonList, IonNote, IonRow, IonSearchbar, IonText } from "@ionic/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import './Chats.css'

import { useGetMutualConnectionsFiltered } from "../../hooks/api/profiles/mutual-connections-filtered";
import NewChatItem from "./NewChatItem";
import { faFrown } from "@fortawesome/pro-regular-svg-icons/faFrown";

type Props = {
    mutualConnectionsList: number[],
    chats: any,
    currentUserProfile: any,
    showSearch: boolean
};


const ChatsSegment: React.FC<Props> = (props) => {
    const { mutualConnectionsList, currentUserProfile, chats, showSearch } = props;

    const [search, setSearch] = useState<string>("")

    const searchedChats = useGetMutualConnectionsFiltered(search).data

    return (

        <>
            {mutualConnectionsList?.length > 0 ?
                <>
                    {showSearch ?
                        <>
                            <IonRow className="filter-row ">
                                <IonSearchbar debounce={500} value={search} onIonInput={e => setSearch(e.detail.value!)} color="navy" placeholder="Looking for someone specific?"></IonSearchbar>
                            </IonRow >
                            {search ?
                                <>
                                    <IonList id="wl" lines="full">
                                        {searchedChats?.map((e: any) => (
                                            <li key={e.id}>
                                                <NewChatItem user={parseInt(e)} currentUserProfile={currentUserProfile} opener={false}/>
                                            </li>
                                        ))}
                                        {searchedChats?.length == 0 ?
                                            <IonRow className="ion-padding ion-justify-content-center">
                                                <IonNote>Couldn't find anyone &nbsp;<FontAwesomeIcon icon={faFrown}/></IonNote>
                                                <IonNote className="ion-padding ion-justify-content-center">Please note: Unmatched and blocked connections are removed from your chats.</IonNote>
                                            </IonRow>

                                            : searchedChats?.length == 1 && currentUserProfile?.blocked_connections?.includes(searchedChats[0]) ?
                                            <IonRow className="ion-padding ion-justify-content-center">
                                                 <IonNote>Couldn't find anyone &nbsp;<FontAwesomeIcon icon={faFrown}/></IonNote>
                                            </IonRow>
                                            
                                            :<></>}
                                        
                                    </IonList>
                                </>
                                : <></>}
                        </>
                        : <></>}
                    {!showSearch && searchedChats?.length > 0 ?
                    <>
                    <OngoingChats mutualConnectionsList={mutualConnectionsList} currentUserProfile={currentUserProfile} chatsList={chats} />
                    <NewChats mutualConnectionsList={mutualConnectionsList} currentUserProfile={currentUserProfile} chatsList={chats} />
                    <HiddenChats currentUserProfile={currentUserProfile} chatsList={chats} />
                    </>
                    : <></>}
                </>
                :
                <IonRow className="ion-justify-content-center ion-padding-top" style={{ padding: "30pt" }}>
                    <img alt="Flower gif" src="../static/img/refresh-icon@3x.png" style={{ width: "50%" }} />
                    <IonText style={{ textAlign: "center" }}>
                        <br /><br />
                        Connect with others in Picks and Likes to start Chats!
                    </IonText>
                </IonRow>
            }


        </>
    )
};

export default ChatsSegment;
