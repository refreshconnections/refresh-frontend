import { IonAvatar, IonBadge, IonItem, IonText, useIonModal } from "@ionic/react";
import React, { useState } from "react";
import { isPersonalPlus, onImgError } from "../../hooks/utilities";
import { useProfileDetails } from "../../hooks/api/profiles/details";
import { useQueryClient } from "@tanstack/react-query";
import TextModal from "../TextModal";
import { chatQueryKeys } from "../../hooks/api/chats/chat-query-keys";




type Props = {
    user: any
    currentUserProfile: any;
    chat: any
};



const ChatItem: React.FC<Props> = (props) => {
    const { user, currentUserProfile, chat } = props;

    const queryClient = useQueryClient()

    const [profileDetailsEnabled, setProfileDetailsEnabled] = useState(false);
    const profileDetails = useProfileDetails(user, profileDetailsEnabled).data;
    

    const [handlingDismiss, setHandlingDismiss] = useState(false)


    const handleDismiss = (options?: { refreshChatList?: boolean }) => {
        setHandlingDismiss(true)
        queryClient.invalidateQueries({
            queryKey: ['unread'],
        })
        queryClient.invalidateQueries({
            queryKey: ['chats', 'details', chat?.id],
        })
        if (options?.refreshChatList) {
            queryClient.invalidateQueries({
                queryKey: chatQueryKeys.all,
            })
            queryClient.invalidateQueries({
                queryKey: chatQueryKeys.paginated,
            })
        }
        dismiss();
        setHandlingDismiss(false)
    }

    const [present, dismiss] = useIonModal(TextModal, {
        textModalData: chat,
        unreadCount: chat?.unread_count ?? 0,
        profileDetails: profileDetails,
        pro: isPersonalPlus(currentUserProfile?.subscription_level),
        settingsAlt: currentUserProfile?.settings_alt_text,
        from_name: currentUserProfile?.name, 
        onDismiss: handleDismiss,
      });
    
      const openModal = () => {
        setProfileDetailsEnabled(true);
        present();
      }

    return (
        <>
            {(!(currentUserProfile?.hidden_dialogs.includes(user)) && !(currentUserProfile?.blocked_connections.includes(user))) ?
                <IonItem className="chat-item" button disabled={false} detail={true} 
                onClick={() => 
                { openModal() }}>
                    <IonAvatar>
                    {profileDetails?.deactivated_profile?
                        <img alt="chat avatar" src={"../static/img/null.png"} onError={(e) => onImgError(e)} />
                        :
                        <img alt="chat avatar" src={chat?.pic1_main ?? "../static/img/null.png"} onError={(e) => onImgError(e)} />
                    }
                    </IonAvatar>
                    <IonText className="name">{chat?.name || "User"}</IonText>
                    {handlingDismiss? <></> : chat?.unread_count > 0 ? <IonBadge className="unread-badge" slot="end">
                                {currentUserProfile?.subscription_level !== "none" && currentUserProfile?.settings_new_message_count == true ?
                                  chat?.unread_count + " new"
                                  : "New message"}
                      </IonBadge>
                        : chat?.keep_it_going && currentUserProfile?.settings_chats_next_reminder ? <IonBadge className="ion-text-wrap" color="gray" slot="end" style={{maxWidth: "30%"}}>Keep it going!</IonBadge>
                      : <></>}

                </IonItem>
                : <></>}
        </>


    )
};

export default ChatItem;
