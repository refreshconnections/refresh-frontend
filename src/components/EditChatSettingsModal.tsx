import React, { useEffect, useState } from "react";

import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, IonButtons, IonPage, IonToggle, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';

import { updateCurrentUserChatSettings } from "../hooks/utilities";
import { useQueryClient } from "@tanstack/react-query";
import { useChatSettings } from "../hooks/api/chats/chat-settings";

import "./EditModal.css"


type Props = {
    onDismiss: () => void;
};

const EditChatSettingsModal: React.FC<Props> = (props) => {

    const [conversationStarter, setConversationStarter] = useState<boolean>(false);

    const { onDismiss } = props;
    const current_settings = useChatSettings().data;

    const queryClient = useQueryClient()

    useEffect(() => {

        setConversationStarter(current_settings?.conversation_starter)

    }, [current_settings?.conversation_starter])

    const handleDismiss = async () => {
        if (current_settings?.conversation_starter !== conversationStarter) {
            await updateCurrentUserChatSettings({ conversation_starter: conversationStarter })
        }
        queryClient.invalidateQueries({ queryKey: ['chats', 'settings'] })
        onDismiss()
    }

    const conversationPrompts = [
        "If you could live anywhere, real or fictional, where would you live?",
        "What's a random fun fact about you?",
        "What food combo do you secretly, or not so secretly, love?",
        "What's the last TV show you binged?",
        "When was the last time you saw someone else wearing a mask in public?",
        "If you had to give a 45 minute lecture right now on any one topic, what would that topic be?",
        "What three words would best describe your day?",
        "What's an underrated book in your opinion?",
        "When do you feel the most connected to other people?",
        "What's a question you wish people asked you more often?",
        "What's something that fascinates you even if you don't fully understand it?",
        "What's the last thing you did just for fun?"
    ];


    return (
        <IonPage>

            <IonHeader>
                <IonToolbar className="modal-title">
                    <IonTitle>Chat Preferences</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleDismiss}>Done</IonButton>
                    </IonButtons>

                </IonToolbar>
            </IonHeader>
            <IonContent className="edit-modal">
                <IonItem>
                    <IonLabel className="ion-text-wrap">Receive images</IonLabel>
                    <IonToggle slot="end"
                        onIonChange={async e => await updateCurrentUserChatSettings({ allow_images_global: e.detail.checked })}
                        checked={current_settings?.allow_images_global ?? false}>
                    </IonToggle>
                </IonItem>
                <IonItem>
                    <IonLabel className="ion-text-wrap">Receive audio messages</IonLabel>
                    <IonToggle slot="end"
                        onIonChange={async e => await updateCurrentUserChatSettings({ allow_audio_global: e.detail.checked })}
                        checked={current_settings?.allow_audio_global ?? false}>
                    </IonToggle>
                </IonItem>
                <IonItem lines="none">
                    <IonLabel className="ion-text-wrap">
                        <span style={{ fontSize: "17px" }}>Show conversation starter</span>
                        <p>If you've matched but no message has been sent yet, show a pre-defined conversation starter so it's easier to get the chat going!</p>
                    </IonLabel>
                    <IonToggle slot="end"
                        onIonChange={e => setConversationStarter(e.detail.checked)}
                        checked={conversationStarter}>
                    </IonToggle>

                </IonItem>

                {conversationStarter &&
                    <IonItem className="with-select">

                        <IonSelect
                            value={current_settings?.conversation_starter_text ?? null}
                            placeholder="Choose a prompt"
                            onIonChange={async e => await updateCurrentUserChatSettings({ conversation_starter_text: e.detail.value })}
                            interface="alert"
                        >
                            {conversationPrompts.map((prompt, index) => (
                                <IonSelectOption key={index} value={prompt}>
                                    {prompt}
                                </IonSelectOption>
                            ))}
                        </IonSelect>
                    </IonItem>
                }
            </IonContent>
        </IonPage>
    )
};

export default EditChatSettingsModal;