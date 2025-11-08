import React, { useEffect, useState } from "react";

import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, IonButtons, IonPage, IonToggle, IonLabel, IonNote } from '@ionic/react';

import { isMobile, updateCurrentUserPushNotificationSettings } from "../hooks/utilities";
import { useQueryClient } from "@tanstack/react-query";

import "./EditModal.css"
import { usePushNotificationSettings } from "../hooks/api/profiles/push-notification-settings";


type Props = {
    onDismiss: () => void;
};

interface OSTags {
    no_direct_messages?: "t" | "f",
    no_comments_on_posts?: "t" | "f",
    no_comment_replies?: "t" | "f",
    no_comment_threads?: "t" | "f",
}

const EditPushNotifications: React.FC<Props> = (props) => {

    const { onDismiss } = props;
    const [pushEnabled, setPushEnabled] = useState<boolean>(false)
    const [getAllNotifications, setGetAllNotifications] = useState<boolean>(false)
    const [devicePushEnabled, setDevicePushEnabled] = useState<boolean>(false)
    const current_push_settings = usePushNotificationSettings(null).data;


    const queryClient = useQueryClient()

    const handleDismiss = () => {
        queryClient.invalidateQueries({ queryKey: ['current', 'push_notification_settings'] })
        onDismiss()
    }


    const changePushNotifications = async () => {
        if (pushEnabled) {
            await (window as any).plugins.OneSignal.User.pushSubscription.optOut();
        }
        else {
            await (window as any).plugins.OneSignal.User.pushSubscription.optIn();
        }
        setPushEnabled(await (window as any).plugins.OneSignal.User.pushSubscription.getOptedInAsync())
    }

    const setAllToTrue = async () => {
        await updateCurrentUserPushNotificationSettings({ direct_messages: true, new_connections: true, new_likes: true, comments_on_threads: true, replies_to_comments: true, comments_on_posts: true })
        queryClient.invalidateQueries({ queryKey: ['current', 'push_notification_settings'] })
        setGetAllNotifications(true)
    }



    useEffect(() => {
        const getDevicePermissions = async () => {
            if (isMobile()) {
                setDevicePushEnabled(await (window as any).plugins.OneSignal.Notifications.getPermissionAsync())
                setPushEnabled(await (window as any).plugins.OneSignal.User.pushSubscription.getOptedInAsync())
            }
        }

        getDevicePermissions()


    }, [])

    useEffect(() => {

        const checkIfGettingAllNotifications = async () => {
            if (current_push_settings.direct_messages && current_push_settings.new_likes
                && current_push_settings.new_connections && current_push_settings.comments_in_thread && current_push_settings.replies_to_comments
                && current_push_settings.comments_on_posts) {
                console.log("hi", current_push_settings.replies_to_comments)
                setGetAllNotifications(true)
            }
        }


        if (current_push_settings) {
            console.log("current ush", current_push_settings)
            checkIfGettingAllNotifications()
        }

    }, [current_push_settings])




    return (
        <IonPage>

            <IonHeader>
                <IonToolbar className="modal-title">
                    <IonTitle>Push Notifications</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleDismiss}>Done</IonButton>
                    </IonButtons>

                </IonToolbar>
            </IonHeader>
            <IonContent className="edit-modal specific-settings">
                <IonItem>
                    <IonLabel className="ion-text-wrap">Enable push notifications</IonLabel>
                    <IonToggle slot="end"
                        onIonChange={async () => await changePushNotifications()}
                        checked={pushEnabled && devicePushEnabled}
                        disabled={!isMobile()}
                    >
                    </IonToggle>
                </IonItem>
                {(pushEnabled || !(isMobile())) &&
                    <>
                        <IonItem>
                            <IonLabel className="ion-text-wrap">
                                <span style={{ fontSize: "17px" }}>Get all push notifications</span>
                                <p>Receive notifications for all private messages and interactions in the Refreshments Bar</p>
                            </IonLabel>
                            <IonToggle slot="end"
                                onIonChange={async () => { getAllNotifications ? setGetAllNotifications(false) : await setAllToTrue() }}
                                checked={getAllNotifications}
                            >
                            </IonToggle>
                        </IonItem>
                        <>
                            <IonNote>
                                Custom notification options
                            </IonNote>
                            <IonItem>
                                <IonLabel className="ion-text-wrap">Notify me when I get a message in Chats</IonLabel>
                                <IonToggle slot="end"
                                    onIonChange={async e => await updateCurrentUserPushNotificationSettings({ direct_messages: e.detail.checked })}
                                    checked={current_push_settings?.direct_messages}
                                    disabled={getAllNotifications}>
                                </IonToggle>
                            </IonItem>
                            <IonItem>
                                <IonLabel className="ion-text-wrap">Notify me when I get a new Like</IonLabel>
                                <IonToggle slot="end"
                                    onIonChange={async e => await updateCurrentUserPushNotificationSettings({ new_likes: e.detail.checked })}
                                    checked={current_push_settings?.new_likes}
                                    disabled={getAllNotifications}>
                                </IonToggle>
                            </IonItem>
                            <IonItem>
                                <IonLabel className="ion-text-wrap">Notify me when someone connects with me</IonLabel>
                                <IonToggle slot="end"
                                    onIonChange={async e => await updateCurrentUserPushNotificationSettings({ new_connections: e.detail.checked })}
                                    checked={current_push_settings?.new_connections}
                                    disabled={getAllNotifications}>
                                </IonToggle>
                            </IonItem>
                            <IonItem>
                                <IonLabel className="ion-text-wrap">Notify me when someone comments on a post I made</IonLabel>
                                <IonToggle slot="end"
                                    onIonChange={async e => await updateCurrentUserPushNotificationSettings({ comments_on_posts: e.detail.checked })}
                                    checked={current_push_settings?.comments_on_posts}
                                    disabled={getAllNotifications}>
                                </IonToggle>
                            </IonItem>
                            <IonItem>
                                <IonLabel className="ion-text-wrap">Notify me when someone replies to a comment I wrote</IonLabel>
                                <IonToggle slot="end"
                                    onIonChange={async e => await updateCurrentUserPushNotificationSettings({ replies_to_comments: e.detail.checked })}
                                    checked={current_push_settings?.replies_to_comments}
                                    disabled={getAllNotifications}>
                                </IonToggle>
                            </IonItem>
                            <IonItem>
                                <IonLabel className="ion-text-wrap">Notify me when someone replies to a comment I also replied to</IonLabel>
                                <IonToggle slot="end"
                                    onIonChange={async e => await updateCurrentUserPushNotificationSettings({ comments_in_thread: e.detail.checked })}
                                    checked={current_push_settings?.comments_in_thread}
                                    disabled={getAllNotifications}>
                                </IonToggle>
                            </IonItem>
                        </>

                    </>
                }
            </IonContent>
        </IonPage>
    )
};

export default EditPushNotifications;