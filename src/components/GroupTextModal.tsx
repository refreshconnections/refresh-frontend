import React, { createRef, useEffect, useRef, useState } from "react";
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonItem, IonRow, IonButtons, IonNote, IonList, IonFooter, IonIcon, IonTextarea, IonCol, IonItemSliding, IonItemOptions, IonItemOption, useIonModal, IonAvatar, IonLabel, IonText } from '@ionic/react';
import { getGroupMessages, getWebsocketUrl, onImgError } from "../hooks/utilities";
import { chevronBackOutline } from 'ionicons/icons';

import "./TextModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faAngleRight } from "@fortawesome/pro-regular-svg-icons/faAngleRight";
import { faMessageArrowUp } from "@fortawesome/pro-regular-svg-icons/faMessageArrowUp";

import GroupDetailsModal from "./GroupDetailsModal";
import { PhotoProvider, PhotoView } from 'react-photo-view';



type Props = {
    groupTextModalData: any;
    currentUser: number
    onDismiss: () => void;
};


const GroupTextModal: React.FC<Props> = (props) => {

    const { groupTextModalData, currentUser, onDismiss } = props;

    const textContentRef = useRef<HTMLIonContentElement>(null);

    const [messages, setMessages] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<null | string>(null);
    const [messageInput, setMessageInput] = useState<any>(null);

    const messagesEndRef = useRef<null | HTMLDivElement>(null)

    const scrollToBottom = () => {

        messagesEndRef.current?.scrollIntoView({
            behavior: "auto",
            block: "start"
        })
    }

    const options = {
        connectionTimeout: 1000000,
        maxRetries: 10,
    };

    // let socket: ReconnectingWebSocket = new ReconnectingWebSocket('ws://localhost:8000/chat_ws', [], options)
    // const url = "https://localhost:8000"


    // useEffect(() => {

    //     webSocket.current = new ReconnectingWebSocket(getWebsocketUrl(), [], options)

    //     webSocket.current.onopen = () => {
    //         console.log("open!")
    //     }

    //     setLoading(true); // set loading to true

    //     const fetchData = async () => {
    //         setError(null);
    //         setLoading(true);
    //         try {
    //             // setData(await getProfileCardInfo(groupTextModalData.other_user_id))
    //             setMessages(await getGroupMessagesHandler(groupTextModalData.id))
    //             setLoading(false);
    //             scrollToBottom();
    //         } catch (error: any) {
    //             setError(error.message);
    //             setLoading(false)
    //             console.log(error)
    //         }

    //     }

    //     const resetMessages = async () => {
    //         setMessages(await getGroupMessagesHandler(groupTextModalData.id))
    //         console.log("getting messages from the server")
    //     }

    //     fetchData();

    //     webSocket.current.onclose = () => {
    //         console.log("close!")
    //     }

    //     webSocket.current.onmessage = (e) => {

    //         const jsone = JSON.parse(e.data)

    //         if (jsone.msg_type == 12) {
    //             resetMessages()
    //             return
    //         }
    //     };

    //     return () => {
    //         webSocket.current?.close()
    //     }
    // }, []);




    useEffect(() => {

        console.log("Group modal", groupTextModalData)
        console.log("Group modal members", groupTextModalData.members)
        console.log("oo", groupTextModalData.members?.find((x: { id: number; }) => x.id === Number("105"))?.profile_pic)

    }, []);



    const sendOutgoingGroupTextMessage = async (text: string, groupdialog_pk: string) => {
        // console.log("Sending text message:" + text + user_pk)
        // console.log(text)
        let randomId = Math.floor(Math.random() * -8000);
        let data = {
            "msg_type": 11,
            "text": text,
            "groupdialog_pk": groupdialog_pk,
            "random_id": randomId
        }
        const strData = JSON.stringify(data)
        // webSocket.current!.send(strData)
        setMessageInput("")
        console.log("to send", data)
        const nowDate = new Date()
        const nowTime = nowDate.getTime() / 1000
        console.log("time", nowTime)
        let fixedData = {
            "edited": 1696112928,
            "file": null,
            "id": 999,
            "out": true,
            "read": false,
            "sender": 0,
            "sender_username": "you",
            "recipient_group": groupdialog_pk,
            "sent": nowTime,
            "text": text,
        }
        let newMessages = messages
        newMessages.push(fixedData)
        setMessages(newMessages)
        scrollToBottom()
    }

    const getGroupMessagesHandler = async (id: number) => {

        const response = await getGroupMessages(id)

        const groupMessagesArray = response.data.reverse()

        return groupMessagesArray

    }

    const getTime = (utc: number) => {

        const d = new Date(utc * 1000)

        const strDate = d.toLocaleString();

        return strDate
    }

    const getDay = (utc: number) => {

        const d = new Date(utc * 1000)

        const options = {
            year: "numeric",
            month: "long",
            day: "numeric",
        };


        const strDate = d.toLocaleDateString(undefined, { month: "short", year: "numeric", day: "numeric" });

        return strDate
    }

    const isToday = (utc: number) => {

        const d = new Date(utc * 1000)
        d.setHours(0, 0, 0, 0);
        const d2 = new Date()
        d2.setHours(0, 0, 0, 0);

        if (d.getTime() === d2.getTime()) {
            return true
        }
        else {
            return false
        }

    }

    const [groupDetailsPresent, groupDetailsDismiss] = useIonModal(GroupDetailsModal, {
        groupDetailsData: groupTextModalData,
        currentUser: currentUser,
        onDismiss: () => groupDetailsDismiss(),
    });

    const openGroupDetailsModal = (item: any) => {
        groupDetailsPresent();
    }


    return (
        <IonPage id='text-page'>
            <IonHeader>
                <IonToolbar className="text-name">
                    <IonButtons slot="start" onClick={onDismiss}>
                        <IonIcon className="message-back " slot="icon-only" color="primary" icon={chevronBackOutline}></IonIcon>
                    </IonButtons>
                    <IonTitle className="ion-text-center" id={"profile-modal"} onClick={() => { openGroupDetailsModal(groupTextModalData) }}>
                        {groupTextModalData?.group_name} &nbsp;
                        <FontAwesomeIcon className="medium-gray" icon={faAngleRight} />
                        </IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent ref={textContentRef} >
                <IonList className="messages" id="wl " lines="full">
                    {messages?.map((item: any, index: number) => (
                        <li key={index}>
                            {(index == 0) ? <div style={{ textAlign: "center", paddingTop: "10px" }}>{getDay(messages[index].sent)}</div>
                                : <></>}
                            {(index !== 0) && (messages[index].sent - messages[index - 1].sent > (122400)) ? <div style={{ textAlign: "center", paddingTop: "10px" }}>{getDay(messages[index].sent)}</div>
                                : <></>}
                            <IonItemSliding>
                                {/* { (window.location.href.includes("https")) ?
                                <>{ isToday(item.sent) && (messages.length() >= 1 && !isToday(messages[index-1].sent)) ? <IonNote className="today">Today</IonNote> : <></> }</> : <></>} */}
                                {!item.out ?
                                    <>
                                    <IonItem className="groupincoming" color="background" >
                                        <IonAvatar slot="start">
                                            <img alt="chat avatar" src={groupTextModalData.members?.find((x: { id: number; }) => x.id === Number(item.sender))?.profile_pic} onError={(e) => onImgError(e)} />
                                        </IonAvatar>
                                        <IonLabel>{item.text}</IonLabel>
                                    </IonItem>
                                    <IonText className="group-sender-label">
                                        {groupTextModalData.members?.find((x: { id: number; }) => x.id === Number(item.sender))?.name}
                                    </IonText>
                                    </>
                                    :
                                    <IonItem className="outgoing" color="primary">{item.text}</IonItem>
                                }
                                <IonItemOptions side={(item.out === false) ? "start" : "end"}>
                                    <IonItemOption disabled={true} className="message-timestamp">{getTime(item.sent)}</IonItemOption>
                                </IonItemOptions>
                            </IonItemSliding>
                        </li>
                    ))}
                    <li key={messages?.length + 2}>
                        <div style={{ "marginBottom": "60px" }} ref={messagesEndRef}></div>
                    </li>
                </IonList>
            </IonContent>
            <IonFooter className="send-message">
                <IonRow>
                    <IonCol size="10">
                        <IonTextarea value={messageInput}
                            name="message_input"
                            onIonChange={e => setMessageInput(e.detail.value!)}
                            placeholder="Message"
                        />
                    </IonCol>
                    <IonCol size="2">
                        <IonButton expand="block" className="send-button " color="tertiary" onClick={() => { sendOutgoingGroupTextMessage(messageInput, (groupTextModalData?.id).toString()); scrollToBottom() }}>
                            <FontAwesomeIcon icon={faMessageArrowUp as IconProp} />
                        </IonButton>
                    </IonCol>
                </IonRow>
            </IonFooter>
        </IonPage>
    )
};

export default GroupTextModal;
