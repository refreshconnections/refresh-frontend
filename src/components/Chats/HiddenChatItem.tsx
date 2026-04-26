import { IonAvatar, IonBadge, IonItem, IonText, useIonModal } from "@ionic/react";
import React, { useState } from "react";
import { isPersonalPlus, onImgError } from "../../hooks/utilities";
import { useProfileDetails } from "../../hooks/api/profiles/details";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentHeart } from "@fortawesome/pro-solid-svg-icons";

import TextModal from "../TextModal";

type Props = {
    user: any;
    currentUserProfile: any;
    chat: any;
};

const HiddenChatItem: React.FC<Props> = ({ user, currentUserProfile, chat }) => {
    const hasSummaryProfileData = chat.name !== undefined || chat.pic1_main !== undefined;
    const [profileDetailsEnabled, setProfileDetailsEnabled] = useState(!hasSummaryProfileData);
    const { data: profileDetails } = useProfileDetails(user, profileDetailsEnabled);
    const displayName = chat.name ?? profileDetails?.name ?? "";
    const displayPic = chat.pic1_main !== undefined ? chat.pic1_main : profileDetails?.pic1_main;

    const [present, dismiss] = useIonModal(TextModal, {
        textModalData: chat,
        profileDetails: profileDetails,
        pro: isPersonalPlus(currentUserProfile?.subscription_level),
        settingsAlt: currentUserProfile?.settings_alt_text,
        from_name: currentUserProfile?.name,
        onDismiss: () => dismiss(),
    });

    const openModal = () => {
        setProfileDetailsEnabled(true);
        present();
    };

    if (!displayName && !hasSummaryProfileData) {
        return null;
    }

    return (
        <IonItem className="chat-item" button detail={true} onClick={openModal}>
            <IonAvatar>
                <img
                    alt="chat avatar"
                    src={displayPic ?? "../static/img/null.png"}
                    onError={(e) => onImgError(e)}
                />
            </IonAvatar>
            <IonText className="name">{displayName}</IonText>
            {chat?.opener && (
                <div slot="end">
                    <FontAwesomeIcon icon={faCommentHeart} />
                </div>
            )}
            {chat?.unread_count > 0 && (
                <IonBadge className="unread-badge" slot="end">
                    {currentUserProfile.subscription_level !== "none" && currentUserProfile.settings_new_message_count === true
                        ? chat.unread_count + " new"
                        : "New message"}
                </IonBadge>
            )}
        </IonItem>
    );
};

export default HiddenChatItem;
