import React, { useEffect, useMemo, useRef, useState } from "react";
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonItem, IonRow, IonButtons, IonList, IonFooter, IonIcon, IonTextarea, IonCol, IonItemSliding, IonItemOptions, IonItemOption, useIonModal, IonAvatar, IonSpinner, IonLabel, IonToast, IonText, IonInfiniteScroll, IonInfiniteScrollContent, IonGrid, IonAlert, useIonAlert, IonNote, IonCard, useIonPopover, useIonRouter } from '@ionic/react';
import { getCurrentUserProfile, getWebsocketUrl, heartMessage, increaseStreak, isMobile, markAllInChatAsRead, newMessagePush, onAttachmentImgError, onImgError, removeMessage, unheartMessage, uploadFileForMessage, uploadFileForMessageNew } from "../hooks/utilities";
import { chevronBackOutline, trash as trashIcon } from 'ionicons/icons';

import "./TextModal.css";
import ProfileModal from "./ProfileModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faAngleRight } from "@fortawesome/pro-regular-svg-icons/faAngleRight";
import { faMessageArrowUp } from "@fortawesome/pro-regular-svg-icons/faMessageArrowUp";
import { faHeart } from "@fortawesome/pro-solid-svg-icons/faHeart";
import Linkify from 'react-linkify';
import { faPaperclip } from "@fortawesome/pro-regular-svg-icons/faPaperclip";
import { faImage } from "@fortawesome/pro-regular-svg-icons/faImage";
import { faMicrophoneLines } from "@fortawesome/pro-regular-svg-icons/faMicrophoneLines";
import Resizer from "react-image-file-resizer";

import { faHeart as faHeartOutline } from "@fortawesome/pro-regular-svg-icons/faHeart";
import { useQueryClient } from "@tanstack/react-query";
import { useAcceptingMessages } from "../hooks/api/chats/accepting-messages";
import { App } from "@capacitor/app";
import { useMessagesInf } from "../hooks/api/chats/messages-inf";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { decode } from "base64-arraybuffer";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { useMessageFile } from "../hooks/api/chats/message-file";
import { GenericResponse, RecordingData } from "capacitor-voice-recorder/dist/esm/definitions";
import { faStop } from "@fortawesome/pro-solid-svg-icons/faStop";
// import { Plugins } from "@capacitor/core";
import { faCommentHeart, faInfo, faMessageXmark, faTrash } from "@fortawesome/pro-solid-svg-icons";

import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { useChatSettings } from "../hooks/api/chats/chat-settings";
import AttachmentsInfoModal from "./AttachmentsInfoModal";
import moment from "moment";
import { useGetCurrentProfile } from "../hooks/api/profiles/current-profile";
import { useGetLimits } from "../hooks/api/profiles/current-limits";

import { useGetUnreadCount } from '../hooks/api/chats/unread-count';
import ConversationStarterCard from "./ConversationStarterCard";
import ConversationContextCard from "./ConversationContextCard";
import MessageLikePopover from "./MessageLikePopover";
import { useWebSocketContext } from "./WebsocketContext";
import { Capacitor } from "@capacitor/core";



const { VoiceRecorder } = require('capacitor-voice-recorder');




type AttachmentProps = {
    id: string;

};

type Props = {
    textModalData: any;
    unreadCount: number;
    profileDetails: any,
    pro: boolean;
    settingsAlt: boolean;
    from_name: string;
    onDismiss: () => void;
};

interface Recording {
    recording: boolean,
    playing: boolean,
    audio: any,
}

interface CustomAlert {
    message: string,
    buttons: any[],
}

const getAttachmentIfNotExpired = (attachment: any, userSubscription: string) => {

    let numberOfDays = 30

    if (userSubscription === "pro") {
        // pro image
        numberOfDays = 180
    }
    else if (userSubscription === "personalplus") {
        // personalplus image
        numberOfDays = 31
    }
    // else if personal plus
    else {
        // free image
        numberOfDays = 7
    }

    // numberOfDays = 120

    const givenDate = moment(attachment.upload_date);
    const expirationDate = givenDate.add(numberOfDays, 'days');

    if (moment().isAfter(expirationDate)) {
        return "../static/img/expired.png"
    }
    else {
        return attachment.file
    }

}

const isAudioExpired = (userSubscription, uploadDate: Date) => {

    let numberOfDays = 30

    if (userSubscription === "pro") {
        // pro audio
        numberOfDays = 14
    }
    else if (userSubscription === "personalplus") {
        // personalplus image
        numberOfDays = 7
    }
    // else if personal plus
    else {
        // free audio
        numberOfDays = 3
    }

    // numberOfDays = 1

    const givenDate = moment(uploadDate);
    const expirationDate = givenDate.add(numberOfDays, 'days');

    return moment().isAfter(expirationDate)

}

// const getExpirationTime = (currentUser: any, file: any) => {

//     let numberOfDays = 30

//     if (currentUser.subscription_level === "pro") {
//         // pro - audio
//         if (file.endsWith("webmcodecsopus") || file.endsWith("aac") || file.includes("webmcodecsopus?Expires") || file.includes("aac?Expires")) {
//             numberOfDays = 14
//         }
//         // pro - image
//         else {
//             numberOfDays = 150
//         }  
//     }
//     else {
//         // free - audio
//         if (file.endsWith("webmcodecsopus") || file.endsWith("aac") || file.includes("webmcodecsopus?Expires") || file.includes("aac?Expires")) {
//             numberOfDays = 3
//         }
//         // free - image
//         else {
//             numberOfDays = 7
//         }  
//     }

//     // numberOfDays = 1

//     const givenDate = moment(file.upload_date);
//     const expirationDate = givenDate.add(numberOfDays, 'days');

//     return moment().diff(expirationDate, 'days');

// }

const isAudioFile = (file: string) => {

    if (file.endsWith("webmcodecsopus") || file.endsWith("aac") || file.includes("webmcodecsopus?Expires") || file.includes("aac?Expires")) {
        return true
    }
    else {
        return false
    }

}

const isJpegUrl = (url?: string) => {
    if (!url) return false;
    try {
        const path = new URL(url, window.location.origin).pathname; // strips query
        return /\.(jpe?g)$/i.test(path); // matches .jpg or .jpeg
    } catch {
        // if it's a relative URL or plain string
        const path = url.split('?')[0];
        return /\.(jpe?g)$/i.test(path);
    }
};

const MessageAttachment: React.FC<AttachmentProps> = (props) => {

    const { id } = props;
    const file = useMessageFile(id)
    const currentUser = useGetCurrentProfile().data

    return (
        <div style={{
            padding: "5pt", width: "100%", display: "flex", justifyContent: "center", minHeight: "85pt", alignItems: "center"
        }}>
            {file?.isLoading ?
                <IonSpinner name="bubbles"></IonSpinner>
                :
                file?.data && isJpegUrl(file.data.file) ?
                    <PhotoView src={getAttachmentIfNotExpired(file?.data, currentUser.subscription_level)}>
                        <img src={getAttachmentIfNotExpired(file?.data, currentUser.subscription_level)} alt="uploaded image" style={{ maxHeight: "80pt", width: "auto" }} onError={(e) => onAttachmentImgError(e)} />
                    </PhotoView>
                    : file.data && isAudioFile(file.data?.file) ?
                        isAudioExpired(currentUser.subscription_level, file.data?.upload_date) ?
                            <img src={"../static/img/audioexpired.png"} alt="audio message has expired" style={{ maxHeight: "80pt", width: "190px" }} />
                            :
                            <AudioPlayer
                                src={file.data?.file}
                                showJumpControls={true}
                                layout="stacked"
                                autoPlay={false}
                                autoPlayAfterSrcChange={false}
                                customControlsSection={[RHAP_UI.MAIN_CONTROLS]}
                            />
                        : <img src={"../static/img/audioisntloading.png"} alt="audio message isn't loading" style={{ maxHeight: "80pt", width: "190px" }} />
            }
        </div>
    )

}

const recentlySent = (postedDate) => {
    return moment().diff(postedDate * 1000, 'seconds') < 120
}





const TextModal: React.FC<Props> = (props) => {
    const { textModalData, unreadCount, pro, settingsAlt, from_name, profileDetails, onDismiss } = props;

    const queryClient = useQueryClient()

    const { send, addListener, isConnected, connect } = useWebSocketContext();

    const [showReconnect, setShowReconnect] = useState(false);

    const handleManualReconnect = () => {
        setShowReconnect(false);
        connect();
    };

    const [uiConnected, setUiConnected] = useState(isConnected);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setUiConnected(isConnected);
        }, 300); // Debounce delay to prevent flashing

        return () => clearTimeout(timeout);
    }, [isConnected]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;

        if (!uiConnected) {
            timeout = setTimeout(() => {
                setShowReconnect(true);
            }, 10000); // 10 seconds before showing the reconnect button
        } else {
            setShowReconnect(false); // hide it again when reconnected
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [uiConnected]);

    const retrievedMessages = useMessagesInf(textModalData?.other_user_id)

    const loadingMessagesQuery = useMessagesInf(textModalData?.other_user_id)
    const loadingMessages = loadingMessagesQuery.isPending && loadingMessagesQuery.fetchStatus === "fetching";


    const othersChatSettings = useChatSettings(textModalData?.other_user_id)
    const yourChatSettings = useChatSettings()
    const limits = useGetLimits().data
    const overallUnread = useGetUnreadCount().data
    const currentUserProfile = useGetCurrentProfile().data;


    const [needContext, showNeedContext] = useState<boolean>(false)


    const [presentConfirmAlert] = useIonAlert();
    const [presentRemoveMessageAlert] = useIonAlert();
    const router = useIonRouter();

    const confirmAlert = async (alertProps: CustomAlert) => {
        presentConfirmAlert({
            header: alertProps.message,
            buttons: alertProps.buttons
        })
    }

    const [attachmentsInfoShow, attachmentsInfoDismiss] = useIonModal(AttachmentsInfoModal, {
        onDismiss: () => attachmentsInfoDismiss(),
        onNavigate: (path: string) => router.push(path),
    });

    const [presentPopover, dismissPopover] = useIonPopover(MessageLikePopover, {
        onDidDismiss: () => dismissPopover(),
    });



    const textContentRef = useRef<HTMLIonContentElement>(null);

    const [messages, setMessages] = useState<any>(retrievedMessages?.data ?? null);

    const [waitBeforeSendingMore, setWaitBeforeSendingMore] = useState<boolean>(false);
    const [attachmentErrorToastOpen, setAttachmentErrorToast] = useState<boolean>(false);
    const [messageInput, setMessageInput] = useState<any>(null);

    const [currMessageHeart, setCurrMessageHeart] = useState<number | null>(null);

    const messagesEndRef = useRef<null | HTMLDivElement>(null)

    const [justHearted, setJustHearted] = useState<number[]>([]);

    const [justUnhearted, setJustUnhearted] = useState<number[]>([]);

    const [waiting, setWaiting] = useState(false)
    const [image, setImage] = useState<any>(null)
    const [blob, setBlob] = useState<any>(null)
    const [recording, setRecording] = useState<Recording>({ recording: false, playing: false, audio: null })

    const [audioRef, setAudioRef] = useState<any>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>();
    const recordingTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [recordingSeconds, setRecordingSeconds] = useState(0);

    const [imageName, setImageName] = useState<any>(null)


    const [showAttachments, setShowAttachments] = useState<boolean>(false)

    // tanstack query
    const canText = useAcceptingMessages(textModalData?.other_user_id).data;
    const canTextisWaiting = useAcceptingMessages(textModalData?.other_user_id).isLoading;
    const currentUser = useGetCurrentProfile().data



    const goBackOut = async () => {
        onDismiss()
    }

    const scrollToBottom = () => {
        console.log("Scrolling to the bottom.")

        messagesEndRef.current?.scrollIntoView({
            behavior: "auto",
            block: "end"
        })
    }

    const addMessageToFrontOfTheArray = (newMessage: any) => {
        setMessages(messages => ({
            ...messages,
            pages:
                [
                    {
                        ...messages.pages[0],  // Spread the first user object
                        data: [newMessage, ...messages.pages[0].data]  // Add new hobby
                    },
                    ...messages.pages?.slice(1) ?? []  // Keep the other users unchanged
                ]
        }));
    };




    useEffect(() => {


        const readUnreadTheFirstTime = async () => {
            await markAllInChatAsRead(textModalData?.other_user_id)
        }

        if (unreadCount > 0 || overallUnread > 0) {
            readUnreadTheFirstTime()
            queryClient.invalidateQueries({
                queryKey: ['unread'],
            })
            queryClient.invalidateQueries({
                queryKey: ['chats', 'details', textModalData?.id],
            })
        }

        // scrollToBottom();


    }, [])

    const resetMessages = () => {
        console.log("RESETING")
        // scrollToBottom()
        queryClient.invalidateQueries({ queryKey: ['chats', 'messages', parseInt(textModalData?.other_user_id)] })
        queryClient.invalidateQueries({ queryKey: ['unread'] })
        // scrollToBottom()
    }


    useEffect(() => {
        const unsubscribe = addListener((msg: any) => {
            console.log("msg", msg)
            console.log("textModalData?.other_user_id", textModalData?.other_user_id)
            if (msg.msg_type === 8) {
                console.log("the message was sent thank goodness")
                resetMessages();
                newMessagePush(
                    [textModalData?.other_user_id.toString()],
                    `${from_name ?? 'Someone'} sent you a message`,
                    'View it in the app!',
                    'message'
                );
                if (msg.sender === textModalData?.other_user_id) {
                    send({
                        msg_type: 6,
                        user_pk: textModalData.other_user_id,
                        message_id: msg.db_id,
                    });
                }
            }
        });

        return unsubscribe; // ✅ DO NOT wrap it in another function
    }, [textModalData?.other_user_id, addListener, send]);



    useEffect(() => {

        setWaiting(true)


        if (retrievedMessages?.data) {
            console.log(retrievedMessages.hasNextPage)
            setMessages(retrievedMessages.data)
        }

        if (retrievedMessages && retrievedMessages?.data?.pages.length == 1) {
            const timeout = setTimeout(() => {
                console.log("retrieved messages done with timeout, scrolling to bottom")
                // scrollToBottom()
                messagesEndRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "end"
                })
            }, 500);
            return () => {
                // clears timeout before running the new effect
                clearTimeout(timeout);
            };
        }

        setWaiting(false)


    }, [retrievedMessages?.data]);


    useEffect(() => {



        scrollToBottom()


        console.log("messages?.count", messages?.pages[0].data.length)

        if (messagesEndRef.current) {
            // Scroll after a small delay to ensure the DOM has settled
            setTimeout(() => {
                messagesEndRef.current!.scrollIntoView({ behavior: 'smooth' });
            }, 0);
        }


        // if (messages && messages?.pages.length == 1) {
        //     const timeout = setTimeout(() => {
        //         console.log("done with timeout, scrolling to bottom")
        //         scrollToBottom()
        //     }, 500);
        //     return () => {
        //         // clears timeout before running the new effect
        //         clearTimeout(timeout);
        //     };
        // }

    }, [messages])




    useEffect(() => {

        if (recording.audio) {
            const base64Sound = recording?.audio?.recordDataBase64;
            const mimeType = recording?.audio?.mimeType;

            // let cleanedBase64String = base64Sound.replaceAll("[\\r\\n\\s]", "");

            // // Remove the LS0t (Base64 encoding of '---') if needed
            // cleanedBase64String = cleanedBase64String.replaceAll("LS0t", "");
            const audioRef = new Audio(`data:${mimeType};base64,${base64Sound}`);

            setAudioRef(audioRef)
        }


    }, [recording.audio])

    useEffect(() => {

        if (recording.recording) {
            console.log('started!');
            timerRef.current = setTimeout(() => {
                // This code will run after 50 seconds
                console.log('Force recording to stop after about 50 seconds!');
                stopVoiceRecording()
            }, 50000);
        }
        else {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };


    }, [recording])

    useEffect(() => {
        if (recording.recording) {
            setRecordingSeconds(0);
            if (recordingTickerRef.current) {
                clearInterval(recordingTickerRef.current);
            }
            recordingTickerRef.current = setInterval(() => {
                setRecordingSeconds((prev) => prev + 1);
            }, 1000);
        } else {
            if (recordingTickerRef.current) {
                clearInterval(recordingTickerRef.current);
                recordingTickerRef.current = null;
            }
            if (!recording.audio) {
                setRecordingSeconds(0);
            } else if (recordingSeconds === 0) {
                setRecordingSeconds(1);
            }
        }

        return () => {
            if (recordingTickerRef.current) {
                clearInterval(recordingTickerRef.current);
                recordingTickerRef.current = null;
            }
        };
    }, [recording.recording, recording.audio])



    const sendOutgoingTextMessage = async (text: string, user_pk: string) => {
        setWaitBeforeSendingMore(true);

        const randomId = Math.floor(Math.random() * -8000);
        const nowTime = Date.now() / 1000;

        const messageData = {
            msg_type: 3,
            text,
            user_pk,
            random_id: randomId,
        };

        const displayMessage = {
            edited: 1696112928,
            file: null,
            id: 999,
            out: true,
            read: false,
            sender: 0,
            sender_username: "you",
            recipient: user_pk,
            sent: nowTime,
            text,
        };

        setMessageInput("");
        addMessageToFrontOfTheArray(displayMessage);


        send(messageData);

        setWaitBeforeSendingMore(false);
    };

    // Convert dataURL -> Blob
    const dataURLToBlob = (dataUrl: string) => {
        console.log("dataURLToBlob")
        const [meta, b64] = dataUrl.split(',');
        const mime = meta.match(/data:(.*?);base64/)![1];
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return new Blob([arr], { type: mime });
    };

    const resizeToJpegBase64 = async (
        inputBlob: Blob,
        maxW = 800,
        maxH = 800,
        quality = 0.7
    ): Promise<Blob> => {
        const url = URL.createObjectURL(inputBlob);
        try {
            const img = new Image();
            const loaded = new Promise<void>((res, rej) => {
                img.onload = () => res();
                img.onerror = rej;
            });
            img.src = url;
            await loaded;

            let { width, height } = img;
            const ratio = Math.min(maxW / width, maxH / height, 1);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);

            // ✅ Use toBlob (binary) instead of toDataURL (base64)
            const blob: Blob = await new Promise((resolve, reject) =>
                canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', quality)
            );
            return blob;
        } finally {
            URL.revokeObjectURL(url);
        }
    };





    const sendOutgoingTextMessageWithFileAudio = async (user_pk: string, file: any) => {
        setWaitBeforeSendingMore(true);

        try {
            const filedata = new FormData();
            filedata.append("file", file);

            const uploadFile = await uploadFileForMessage(filedata);

            if (uploadFile.status !== 200) {
                console.log("Issue uploading and sending");
                setAttachmentErrorToast(true);
                setWaitBeforeSendingMore(false);
                return;
            }

            console.log("Upload successful");
            const file_id = uploadFile.data["id"];
            const randomId = Math.floor(Math.random() * -8000);
            const nowTime = Date.now() / 1000;

            const messageData = {
                msg_type: 4,
                file_id,
                user_pk,
                random_id: randomId,
            };

            const displayMessage = {
                edited: 1696112928,
                file: file_id,
                id: 999,
                out: true,
                read: false,
                sender: 0,
                sender_username: "you",
                recipient: user_pk,
                sent: nowTime,
                text: "Sending...",
            };

            setImage(null);
            setRecording({ recording: false, playing: false, audio: null });
            setAudioRef(null);
            addMessageToFrontOfTheArray(displayMessage);

            send(messageData);

        } catch (error) {
            console.error("Unexpected error sending file message:", error);
            setAttachmentErrorToast(true);
        }

        setWaitBeforeSendingMore(false);
    };

    const fileToDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const finalizeUploadedImage = (file_id: number, user_pk: string) => {
        const randomId = Math.floor(Math.random() * -8000);
        const nowTime = Date.now() / 1000;

        const messageData = { msg_type: 4, file_id, user_pk, random_id: randomId };
        const displayMessage = {
            edited: 1696112928,
            file: file_id,
            id: 999,
            out: true,
            read: false,
            sender: 0,
            sender_username: "you",
            recipient: user_pk,
            sent: nowTime,
            text: "Sending...",
        };

        setImage(null);
        setRecording({ recording: false, playing: false, audio: null });
        setAudioRef(null);
        addMessageToFrontOfTheArray(displayMessage);
        send(messageData);
    };

    const sendOutgoingTextMessageWithFileImage = async (user_pk: string, imageFile: File) => {
        console.log('send size/type:', imageFile.size, imageFile.type, imageFile.name);

        const attemptMultipartUpload = async (file: File) => {
            const blobform = new FormData();
            blobform.append('file', file, file.name); // key must be 'file'
            const uploadFile = await uploadFileForMessageNew(blobform);
            if (uploadFile.status !== 200) {
                throw new Error(`uploadFileForMessageNew status ${uploadFile.status}`);
            }
            return uploadFile.data["id"];
        };

        const buildSmallerFile = async (source: Blob, label: string) => {
            const smallerBlob = await resizeToJpegBase64(source, 600, 600, 0.6);
            const filename = `${label}_${Date.now()}.jpeg`;
            return new File([smallerBlob], filename, { type: 'image/jpeg' });
        };

        setWaitBeforeSendingMore(true);
        let uploadSucceeded = false;
        let smallerFile: File | null = null;

        try {
            const file_id = await attemptMultipartUpload(imageFile);
            finalizeUploadedImage(file_id, user_pk);
            uploadSucceeded = true;
        } catch (error) {
            // Try a smaller multipart upload first.
            try {
                smallerFile = await buildSmallerFile(imageFile, 'upload_small');
                const file_id = await attemptMultipartUpload(smallerFile);
                finalizeUploadedImage(file_id, user_pk);
                uploadSucceeded = true;
            } catch (smallMultipartError) {
                // Fall back to base64 JSON path (original).
                try {
                    const dataUrl = await fileToDataUrl(imageFile);
                    if (!dataUrl) {
                        throw new Error('legacy dataUrl empty');
                    }
                    const fallbackUpload = await uploadFileForMessageNew({ file: dataUrl });
                    if (fallbackUpload.status !== 200) {
                        throw new Error(`legacy upload status ${fallbackUpload.status}`);
                    }
                    const file_id = fallbackUpload.data["id"];
                    finalizeUploadedImage(file_id, user_pk);
                    uploadSucceeded = true;
                } catch (legacyError) {
                    // Final fallback: base64 of the smaller file if we created one.
                    try {
                        if (!smallerFile) {
                            throw legacyError;
                        }
                        const smallDataUrl = await fileToDataUrl(smallerFile);
                        if (!smallDataUrl) {
                            throw new Error('small dataUrl empty');
                        }
                        const fallbackUpload = await uploadFileForMessageNew({ file: smallDataUrl });
                        if (fallbackUpload.status !== 200) {
                            throw new Error(`small legacy upload status ${fallbackUpload.status}`);
                        }
                        const file_id = fallbackUpload.data["id"];
                        finalizeUploadedImage(file_id, user_pk);
                        uploadSucceeded = true;
                    } catch (finalError) {
                        setAttachmentErrorToast(true);
                    }
                }
            }
        }
        setWaitBeforeSendingMore(false);
        if (!uploadSucceeded) {
            return;
        }
    };


    const formatRecordingDuration = (durationSeconds: number) => {
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };


    const getTime = (utc: number) => {

        const d = new Date(utc * 1000)

        const strDate = d.toLocaleString();

        return strDate
    }

    const getDay = (utc: number) => {

        const d = new Date(utc * 1000)

        const strDate = d.toLocaleDateString(undefined, { month: "short", year: "numeric", day: "numeric" });

        return strDate
    }

    const [profilePresent, profileDismiss] = useIonModal(ProfileModal, {
        cardData: profileDetails,
        profiletype: "connected",
        pro: pro,
        settingsAlt: settingsAlt,
        yourName: from_name ?? "Someone",
        onDismiss: (data: string, role: string) => profileDismiss(data, role),
    });

    const openModal = () => {
        profilePresent();
    }

    const sendHandler = async () => {

        if (blob) { 
            if (blob) {
                await sendOutgoingTextMessageWithFileImage(
                    textModalData?.other_user_id,
                    blob as File
                );
            }
        }
        if (audioRef?.src) {
            await sendOutgoingTextMessageWithFileAudio(textModalData?.other_user_id, audioRef?.src)
        }
        if (messageInput) {
            await sendOutgoingTextMessage(messageInput, textModalData?.other_user_id);
        }


        // Streak increase
        if (currentUserProfile?.settings_streak_tracker) {
            await increaseStreak()
            queryClient.invalidateQueries({ queryKey: ['streak'] })
        }

        // scrollToBottom()

    }


    const giveUnheartedMessageAHeart = async (id: number) => {
        if (id !== -1) {
            const newArray = [...justHearted, id]
            setJustHearted(newArray)

            await heartMessage(id)
        }
    }

    const removeUnheartedMessageHeart = async (id: number) => {
        if (id !== -1) {

            let index = removeHeartFromArray(id);
            justHearted.splice(index, 1);

            setJustHearted([...justHearted])
            await unheartMessage(id)
        }
    }

    //Removes checkbox from array when you uncheck it
    const removeHeartFromArray = (id: number) => {
        return justHearted.findIndex((index) => {
            return index === id;
        })

    }

    const removeHeartedMessageHeart = async (id: number, index: number) => {
        if (id !== -1) {
            setCurrMessageHeart(index)

            const newArray = [...justUnhearted, id]
            setJustUnhearted(newArray)

            await unheartMessage(id)
        }
    }

    const giveHeartedMessageHeart = async (id: number) => {
        if (id !== -1) {

            let index = removeHeartFromArray(id);
            justUnhearted.splice(index, 1);

            setJustUnhearted([...justUnhearted])
            await heartMessage(id)
        }

    }

    const uploadPhoto = async () => {
        try {
            const photo = await Camera.getPhoto({
                source: CameraSource.Photos,
                resultType: CameraResultType.Uri,  // no base64
                quality: 90,
                allowEditing: false,
                webUseInput: true,
            });

            // iOS: prefer .path and convert it for fetch / <img> usage
            const src = photo.path
                ? Capacitor.convertFileSrc(photo.path)   // works in WKWebView
                : photo.webPath!;                        // fallback for web/PWA

            // Get the original picked file as Blob
            const res = await fetch(src);
            const originalBlob = await res.blob();     // may be HEIC/JPEG/etc.

            // Normalize & resize to **JPEG Blob**
            const jpegBlob = await resizeToJpegBase64(originalBlob, 800, 800, 0.7);

            // Build a File for iOS FormData robustness
            const filename = `upload_${Date.now()}.jpeg`;
            const file = new File([jpegBlob], filename, { type: 'image/jpeg' });

            // For your preview, make a data URL from the JPEG Blob (optional)
            const previewUrl = URL.createObjectURL(jpegBlob);
            setImage(previewUrl);                      // you can also keep dataURL if you prefer
            setBlob(file);                             // store the File in state for sending
            setImageName(filename);
            setShowAttachments(false);
        } catch (e) {
            console.error('uploadPhoto failed', e);
            const msg =
                e instanceof Error
                ? e.message
                : typeof e === "string"
                    ? e
                    : JSON.stringify(e);

            confirmAlert({
                message: `Photo picker failed. Please check Photos permissions in Settings.\n\n${msg}`,
                buttons: [{ text: "OK", role: "cancel" }],
            });
        }
    };

    const requestVoiceRecord = async () => {

        const getPermission = await VoiceRecorder?.requestAudioRecordingPermission()

        if (getPermission.value == true) {
            confirmAlert({
                message: "You can try recording a message now!", buttons: [{
                    text: 'Ok',
                    role: 'cancel',
                }]
            })
        }
        else {
            confirmAlert({
                message: "You haven't granted the app permission to record audio. Please go to your device's Settings and try again.", buttons: [{
                    text: 'Ok',
                    role: 'cancel',
                }]
            })
        }


    }

    const uploadVoiceRecording = async () => {
        const hasPermission = await VoiceRecorder?.hasAudioRecordingPermission();

        if (hasPermission.value == true) {

            VoiceRecorder.startRecording()
                .then((result: GenericResponse) => setRecording({ recording: true, playing: false, audio: null }))
                .catch(error => { console.log(error); setRecording({ recording: false, playing: false, audio: null }) });
        }


        else {
            await requestVoiceRecord()
        }
    }

    const deleteVoiceRecordingConfirm = () => {
        confirmAlert({
            message: "Are you sure you want to delete your voice recording?", buttons: [
                {
                    text: 'No',
                    role: 'cancel',
                },
                {
                    text: 'Yes',
                    role: 'destroy',
                    handler: async () => {
                        setAudioRef(null)
                        setRecording({ recording: false, playing: false, audio: null })
                    }
                }]
        })
    }

    const stopVoiceRecording = async () => {
        VoiceRecorder.stopRecording()
            .then((result: RecordingData) => { console.log("results", result); setRecording({ recording: false, playing: false, audio: result.value }) })
            .catch(error => console.log(error));


    }

    const removeMessageAlert = async (message_id: number) => {
        presentRemoveMessageAlert({
            header: 'Do you want to unsend this message?',
            subHeader: `Please note: Your message may have already been read. Also, you can only unsend messages ${5 - limits?.chats_removed} more times this month.`,
            buttons: [
                {
                    text: 'Nevermind',
                    role: 'cancel',

                },
                {
                    text: 'Yes, unsend!',
                    role: 'destructive',
                    handler: async () => {
                        const response = await removeMessage(message_id)
                        queryClient.invalidateQueries({
                            queryKey: ['limits'],
                        })
                        resetMessages()
                    }
                }
            ],

        })
    }




    return (
        <IonPage id='text-page'>

            <IonHeader>
                <IonToolbar className="text-name ">
                    <IonButtons slot="start" onClick={() => goBackOut()}>
                        <IonIcon className="message-back" slot="icon-only" color="primary" icon={chevronBackOutline}></IonIcon>
                    </IonButtons>

                    <IonTitle className="ion-text-center" id={"profile-modal"} onClick={() => { openModal() }}>
                        <div className="text-header ">
                            <IonAvatar>
                                <img alt={profileDetails?.pic1_alt || 'profile picture'} src={profileDetails?.deactivated_profile ? "../static/img/null.png" : profileDetails?.pic1_main ?? "../static/img/null.png"} onError={(e) => onImgError(e)} />
                            </IonAvatar>
                            {profileDetails?.name} &nbsp;
                            <FontAwesomeIcon className="medium-gray" icon={faAngleRight} />
                        </div>
                    </IonTitle>

                </IonToolbar>
            </IonHeader>
            <IonContent ref={textContentRef} >
                {loadingMessages ? <IonRow className="ion-justify-content-center ion-padding"><IonSpinner name="bubbles"></IonSpinner></IonRow> : <></>}
                {/* <IonInfiniteScroll
                    position="top"
                    threshold="100px"
                    onIonInfinite={(ev) => {
                        if (retrievedMessages?.hasNextPage) {
                            retrievedMessages.fetchNextPage();
                            setTimeout(() => ev.target.complete(), 500);
                        }
                        setTimeout(() => ev.target.complete(), 0);
                    }}
                >
                    <IonInfiniteScrollContent loadingSpinner="bubbles" style={{ background: "blue", minHeight: "14px" }}></IonInfiniteScrollContent>
                </IonInfiniteScroll> */}



                <IonList className="messages" id="wl " lines="full" style={{ maxHeight: "95%", overflow: "scroll" }}>



                    <PhotoProvider bannerVisible={false} >
                        {messages?.pages?.map((page: any, pindex: any) => (
                            <div key={pindex} className="per-page">
                                {page?.data?.map((item: any, index: number) => (
                                    <li key={index}>
                                        {(index == (page?.data?.length - 1) && page?.data[index]) ? <div style={{ textAlign: "center", paddingTop: "10px" }}>{getDay(page?.data[index].sent)}</div>
                                            : <></>}
                                        {(index !== (page?.data?.length - 1)) && (page?.data[index] && page?.data[index + 1] && page?.data[index].sent - page?.data[index + 1].sent > (122400)) ? <div style={{ textAlign: "center", paddingTop: "10px" }}>{getDay(page?.data[index].sent)}</div>
                                            : <></>}
                                        {item?.is_removed ?
                                            <div className="removed-item">
                                                <IonItem>
                                                    {(item?.out === false) ? profileDetails?.name : "You"} unsent a message &nbsp;<FontAwesomeIcon icon={faMessageXmark}></FontAwesomeIcon>
                                                </IonItem>
                                            </div>
                                            :
                                            <IonItemSliding key={item.id}>
                                                <div ref={(page === 0 && index === 0) ? messagesEndRef : null} ></div>
                                                <IonItem lines="none" onClick={item?.out === false && currMessageHeart !== index ? () => setCurrMessageHeart(index) : item?.out === false && !item?.heart ? async () => await giveUnheartedMessageAHeart(item?.id) : item?.out === false && item?.heart ? async () => await giveHeartedMessageHeart(item?.id) : () => setCurrMessageHeart(null)} className={(item?.out === false) ? "incoming" : item?.sender_username == "you" ? "outgoing-sending" : "outgoing"}>
                                                    {item?.text ?
                                                        <IonLabel className="ion-text-wrap the-actual-message">

                                                            <IonText>
                                                                {item?.id === -1 && (
                                                                    <>
                                                                        <FontAwesomeIcon
                                                                            icon={faCommentHeart}
                                                                            style={{ marginLeft: "3px" }}
                                                                            title="Sent with a like"
                                                                            onClick={(e) =>
                                                                                presentPopover({
                                                                                    event: e.nativeEvent,
                                                                                    showBackdrop: false,
                                                                                    cssClass: 'message-like-popover',
                                                                                })
                                                                            }
                                                                        />
                                                                        &nbsp;
                                                                    </>
                                                                )}
                                                                <Linkify>{item?.text}</Linkify>

                                                            </IonText></IonLabel>
                                                        :
                                                        item?.file ?
                                                            <MessageAttachment id={item?.file} />
                                                            :
                                                            null
                                                    }
                                                </IonItem>
                                                <IonItemOptions side={item?.out === true ? "end" : "start"}>
                                                    <div className="sliding-options-div">
                                                        <IonItemOption disabled={true} className="message-timestamp">{getTime(item?.sent)}</IonItemOption>
                                                        {/* {(item?.file && getExpirationTime(currentUser, item.file) > 0) &&
                                                <IonItemOption disabled={true} className="message-timestamp">Expires in {getExpirationTime(currentUser, item.file)} days</IonItemOption>
                                            } */}
                                                        {(item?.out && limits?.chats_removed < 5 && recentlySent(item?.sent)) &&
                                                            <IonItemOption className="message-timestamp"><IonButton style={{ fontSize: "10px" }} size="small" color={limits?.chats_removed == 4 ? "danger" : "black"} fill="outline" onClick={() => removeMessageAlert(item.id)}>Unsend</IonButton></IonItemOption>
                                                        }
                                                    </div>
                                                </IonItemOptions>
                                                {
                                                    item?.heart == false && item?.out === false && justHearted.includes(item?.id) ?
                                                        <FontAwesomeIcon className="in-heart-red" title="message heart" icon={faHeart} onClick={async () => await removeUnheartedMessageHeart(item?.id)} />
                                                        : item?.heart == false && currMessageHeart == index && item?.out === false ?
                                                            <FontAwesomeIcon className="in-heart" icon={faHeartOutline} title="message heart" onClick={async () => await giveUnheartedMessageAHeart(item?.id)} />
                                                            :
                                                            item?.out === false && currMessageHeart == index && item?.heart == true && justUnhearted.includes(item?.id) ?
                                                                <FontAwesomeIcon className="in-heart" icon={faHeartOutline} title="message heart" onClick={async () => await giveHeartedMessageHeart(item?.id)} />
                                                                :
                                                                item?.out === false && item?.heart == true && !(justUnhearted.includes(item?.id)) ?
                                                                    <FontAwesomeIcon className="in-heart-red" icon={faHeart} title="message heart" onClick={async () => await removeHeartedMessageHeart(item?.id, index)} />
                                                                    :
                                                                    item?.out === true && item?.heart == true ?
                                                                        <FontAwesomeIcon className="out-heart-red" icon={faHeart} title="message heart" />
                                                                        :
                                                                        <></>}
                                            </IonItemSliding>
                                        }
                                    </li>
                                ))}
                            </div>
                        ))}
                    </PhotoProvider>

                    {(messages?.pages.length == 1 && messages?.pages[0].count == 0 && messages?.pages[0].data.length == 0 && othersChatSettings?.data?.conversation_starter && othersChatSettings?.data?.conversation_starter_text)
                        ?
                        <ConversationStarterCard their_conversation_starter_text={othersChatSettings?.data?.conversation_starter_text} their_name={profileDetails?.name} your_conversation_starter_text={yourChatSettings?.data?.conversation_starter ? yourChatSettings?.data?.conversation_starter_text : null} />
                        :

                        ((!!othersChatSettings?.data?.conversation_starter_text || !!yourChatSettings?.data?.conversation_starter_text) && messages?.pages.length == 1 && messages?.pages[0].count > 0 && !(messages?.pages[0].data[messages?.pages[0].data.length - 1]?.id == -1) && messages?.pages[0].count < 10)
                            ?
                            <>
                                <IonRow className="ion-justify-content-center">
                                    <IonButton size="small" fill="outline" onClick={() => showNeedContext(needContext ? false : true)}>
                                        {needContext ? "Hide Context" : "Need Context?"}
                                    </IonButton>
                                </IonRow>
                                {needContext &&
                                    <ConversationContextCard their_conversation_starter_text={othersChatSettings?.data?.conversation_starter ? othersChatSettings?.data?.conversation_starter_text : null} their_name={profileDetails?.name} your_conversation_starter_text={yourChatSettings?.data?.conversation_starter ? yourChatSettings?.data?.conversation_starter_text : null} />
                                }
                            </>
                            :
                            <></>
                    }

                    <IonRow className="ion-justify-content-center">
                        {retrievedMessages.hasNextPage &&
                            <IonButton size="small" fill="outline" onClick={() => retrievedMessages.fetchNextPage()}>See more</IonButton>
                        }
                    </IonRow>

                </IonList>
            </IonContent>

            <IonToast
                isOpen={attachmentErrorToastOpen}
                message={"Your attachment is having troubles sending right now. Try again later."}
                onDidDismiss={() => setAttachmentErrorToast(false)}
                duration={5000}
                color='danger'
                buttons={[
                    {
                        text: 'x',
                        role: 'cancel',
                    },
                ]}
            ></IonToast>
            <IonFooter id="footer" className="send-message">
                <IonGrid>
                    {!uiConnected && (
                        <IonRow className="ion-justify-content-center" style={{ minHeight: "20px", paddingBottom: "5pt" }}>
                            {showReconnect ? (
                                <IonButton onClick={handleManualReconnect}>
                                    Reconnect
                                </IonButton>
                            ) : (
                                <IonText style={{ opacity: 0.6 }}>Trying to reconnect…</IonText>
                            )}
                        </IonRow>
                    )}
                    {showAttachments ?
                        <IonRow className="attachment-buttons" >
                            <IonCol size="1">
                            </IonCol>
                            <IonCol size="9.5" style={{ gap: "10pt", display: "flex" }}>
                                <IonButton shape="round" className="message-send" onClick={uploadPhoto} disabled={recording?.recording || recording?.audio || othersChatSettings?.data == null || !othersChatSettings?.data?.allow_images_global}>
                                    <FontAwesomeIcon icon={faImage} />
                                </IonButton>
                                <IonButton shape="round" className="message-send" color={recording?.recording || recording?.audio ? "danger" : "primary"} disabled={!!image || othersChatSettings?.data == null || !othersChatSettings?.data?.allow_audio_global} onClick={recording?.recording ? async () => await stopVoiceRecording() : recording?.audio ? async () => await deleteVoiceRecordingConfirm() : async () => await uploadVoiceRecording()}>
                                    <FontAwesomeIcon icon={recording?.recording ? faStop : recording?.audio ? faTrash : faMicrophoneLines} />
                                </IonButton>
                                <IonButton shape="round" className="message-send" fill="outline" onClick={() => attachmentsInfoShow()}>
                                    <FontAwesomeIcon icon={faInfo} />
                                </IonButton>
                            </IonCol>
                            <IonCol size="1.5">
                            </IonCol>
                        </IonRow> :
                        <div >
                        </div>}

                    {(recording?.recording || recording?.audio) &&
                        <IonRow style={{ display: "flex", justifyContent: "center", width: "90%" }}>
                            <div style={{ padding: "5pt", display: "flex", justifyContent: "center", width: "100%" }}>
                                {recording.recording ?
                                    <IonButton fill="clear" size="large" color="danger" >
                                        <FontAwesomeIcon icon={faMicrophoneLines} beatFade />
                                        &nbsp; Recording... {formatRecordingDuration(recordingSeconds)}
                                    </IonButton>
                                    : recording?.audio ?
                                        <AudioPlayer
                                            src={audioRef?.src}
                                            showJumpControls={false}
                                            layout="horizontal"
                                            autoPlay={false}
                                            autoPlayAfterSrcChange={false}
                                            customControlsSection={[RHAP_UI.MAIN_CONTROLS]}
                                        />
                                        :
                                        null
                                }
                            </div>
                        </IonRow>


                    }

                    <IonRow>
                        <IonCol size="1">
                            <IonButton fill="clear" shape="round" className="message-attachments" disabled={canText ? false : true} color="navy" onClick={() => setShowAttachments(showAttachments ? false : true)}>
                                <FontAwesomeIcon icon={faPaperclip} />
                            </IonButton>
                        </IonCol>


                        <IonCol size="9.5" style={{ display: "flex" }}>
                            {image &&
                                <IonCol size="3">
                                    <PhotoProvider bannerVisible={false}>
                                        <div style={{ padding: "5pt" }}>

                                            <PhotoView src={image}>
                                                <img src={image} alt="uploaded image" style={{ maxHeight: "80pt", width: "auto" }} />
                                            </PhotoView>

                                        </div>

                                    </PhotoProvider>
                                    <IonButton size="small" onClick={() => setImage(null)}>
                                        <IonIcon slot="icon-only" icon={trashIcon} />
                                    </IonButton>
                                </IonCol>
                            }
                            <IonCol size={image ? "9" : "12"}>
                                <IonItem lines="none" >
                                    <IonTextarea value={messageInput}
                                        name="message_input"
                                        onIonInput={e => {
                                            const newValue = e.detail.value ?? '';
                                            if (newValue !== messageInput) {
                                                setMessageInput(newValue);
                                            }
                                        }}
                                        placeholder={(!canText && !canTextisWaiting) ? "Not receiving." : "Message"}
                                        autocapitalize="sentences"
                                        disabled={((!canText && !canTextisWaiting) || (!isConnected)) ? true : false}
                                        autoCorrect="off"
                                        spellcheck
                                        maxlength={500}
                                        autoGrow
                                        counter
                                        rows={image ? 4 : 1}
                                    />

                                </IonItem>
                            </IonCol>
                        </IonCol>
                        <IonCol size="1.5">
                            <IonButton className="message-send" disabled={!(messageInput || image || audioRef?.src) ? true : (attachmentErrorToastOpen || waitBeforeSendingMore) ? true : canText ? false : false} color="tertiary" onClick={sendHandler}>
                                <FontAwesomeIcon icon={faMessageArrowUp as IconProp} />
                            </IonButton>
                        </IonCol>
                    </IonRow>

                </IonGrid>

            </IonFooter>
        </IonPage>
    )
};

export default TextModal;
