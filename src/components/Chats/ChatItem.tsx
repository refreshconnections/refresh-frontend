import { IonAvatar, IonBadge, IonItem, IonList, IonRow, IonText, useIonModal } from "@ionic/react";
import React, { useEffect, useState } from "react";
import { getProfileCardInfo, isPersonalPlus, onImgError } from "../../hooks/utilities";
import { useProfileDetails } from "../../hooks/api/profiles/details";
import { useQueryClient } from "@tanstack/react-query";
import TextModal from "../TextModal";
import { useGetChatDetails } from "../../hooks/api/chats/chat-details";




type Props = {
    user: any
    currentUserProfile: any;
    chat: any
};



const ChatItem: React.FC<Props> = (props) => {
    const { user, currentUserProfile, chat } = props;

    const queryClient = useQueryClient()

    const profileDetails = useProfileDetails(user, true).data;
    const chatDetails = useGetChatDetails(chat?.id).data;
    

    const [handlingDismiss, setHandlingDismiss] = useState(false)


    const handleDismiss = () => {
        setHandlingDismiss(true)
        queryClient.invalidateQueries({
            queryKey: ['chats'],
        })
        queryClient.invalidateQueries({
            queryKey: ['unread'],
        })
        queryClient.invalidateQueries({
            queryKey: ['chats', 'details', chat?.id],
        })
        dismiss();
        setHandlingDismiss(false)
    }

    const [present, dismiss] = useIonModal(TextModal, {
        textModalData: chat,
        unreadCount: chatDetails?.unread_count ?? 0,
        profileDetails: profileDetails,
        pro: isPersonalPlus(currentUserProfile?.subscription_level),
        settingsAlt: currentUserProfile?.settings_alt_text,
        from_name: currentUserProfile?.name, 
        onDismiss: handleDismiss,
      });
    
      const openModal = () => {
        present();
      }

    return (
        <>
            {(!(currentUserProfile?.hidden_dialogs.includes(user)) && !(currentUserProfile?.blocked_connections.includes(user))) ?
                <IonItem class="chat-item" button disabled={!profileDetails} detail={true} 
                onClick={() => 
                { openModal() }}>
                    <IonAvatar>
                    {profileDetails?.deactivated_profile?
                        <img alt="chat avatar" src={"../static/img/null.png"} onError={(e) => onImgError(e)} />
                        :
                        <img alt="chat avatar" src={profileDetails?.pic1_main ?? "../static/img/null.png"} onError={(e) => onImgError(e)} />
                    }
                    </IonAvatar>
                    <IonText className="name">{profileDetails?.name || "User"}</IonText>
                    {handlingDismiss? <></> : chatDetails?.unread_count > 0 ? <IonBadge className="unread-badge" slot="end">
                                {currentUserProfile?.subscription_level !== "none" && currentUserProfile?.settings_new_message_count == true ?
                                  chatDetails?.unread_count + " new"
                                  : "New message"}
                      </IonBadge>
                        : chatDetails?.last_message?.out == false && chatDetails?.last_message?.heart == false && currentUserProfile?.settings_chats_next_reminder? <IonBadge class="ion-text-wrap" color="gray" slot="end" style={{maxWidth: "30%"}}>Keep it going!</IonBadge>
                      : <></>}

                </IonItem>
                : <></>}
        </>


    )
};

export default ChatItem;
