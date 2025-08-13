import { IonAvatar, IonBadge, IonItem, IonText, useIonModal } from "@ionic/react";
import React from "react";
import { isPersonalPlus, onImgError } from "../../hooks/utilities";
import { useProfileDetails } from "../../hooks/api/profiles/details";

import TextModal from "../TextModal";

type Props = {
    user: any
    currentUserProfile: any;
    chat: any
};

const HiddenChatItem: React.FC<Props> = (props) => {
    const { user, currentUserProfile, chat } = props;

    const profileDetails = useProfileDetails(user).data;
    console.log("profile details", profileDetails)

    const [present, dismiss] = useIonModal(TextModal, {
        textModalData: chat,
        profileDetails: profileDetails,
        pro: isPersonalPlus(currentUserProfile?.subscription_level),
        settingsAlt: currentUserProfile?.settings_alt_text,
        from_name: currentUserProfile?.name, 
        onDismiss: ()=>dismiss(),
      });
    
      const openModal = () => {
        present();
      }

    return (
        <>
            {((currentUserProfile?.hidden_dialogs.includes(user)) || (currentUserProfile?.blocked_connections.includes(user))) ?
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
                    {chat?.unread_count > 0 ? <IonBadge className="unread-badge" slot="end">
                                {currentUserProfile.subscription_level !== "none" && currentUserProfile.settings_new_message_count == true ?
                                  chat?.unread_count + " new"
                                  : "New message"}
                      </IonBadge>
                        : <></>}

                </IonItem>
                : <></>}
        </>


    )
};

export default HiddenChatItem;
