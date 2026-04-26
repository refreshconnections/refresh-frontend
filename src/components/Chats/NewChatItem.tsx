import { IonAvatar, IonItem, IonText, useIonModal } from "@ionic/react";
import React, { useState } from "react";
import { isPersonalPlus, onImgError } from "../../hooks/utilities";
import { useProfileDetails } from "../../hooks/api/profiles/details";

import TextModal from "../TextModal";
import { useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentHeart } from "@fortawesome/pro-solid-svg-icons";
import { chatQueryKeys } from "../../hooks/api/chats/chat-query-keys";



type Props = {
    user: any;
    currentUserProfile: any;
    opener: boolean;
    name?: string;
    pic1_main?: string | null;
};



const NewChatItem: React.FC<Props> = (props) => {
    const { user, currentUserProfile, opener, name: nameProp, pic1_main: picProp } = props;
    const queryClient = useQueryClient();

    const hasSummaryProfileData = nameProp !== undefined || picProp !== undefined;
    const [profileDetailsEnabled, setProfileDetailsEnabled] = useState(!hasSummaryProfileData);
    const { data: profileDetails } = useProfileDetails(user, profileDetailsEnabled);

    const displayName = nameProp ?? profileDetails?.name ?? "";
    const displayPic = picProp !== undefined ? picProp : profileDetails?.pic1_main;
    const isDeactivated = profileDetails?.deactivated_profile ?? false;

    const handleDismiss = () => {
        queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
        queryClient.invalidateQueries({ queryKey: chatQueryKeys.paginated });
        queryClient.invalidateQueries({ queryKey: ['mutuals-no-dialog-paginated-v3'] });
        dismiss();
    };

    const [present, dismiss] = useIonModal(TextModal, {
        textModalData: {
            other_user_id: String(user),
            unread_count: 0
        },
        profileDetails: profileDetails,
        pro: isPersonalPlus(currentUserProfile?.subscription_level),
        settingsAlt: currentUserProfile?.settings_alt_text,
        from_name: currentUserProfile?.name,
        onDismiss: handleDismiss,
    });

    if (currentUserProfile?.hidden_dialogs.includes(user) || currentUserProfile?.blocked_connections.includes(user)) {
        return null;
    }

    if (!displayName && !hasSummaryProfileData) {
        return null;
    }

    const openModal = () => {
        setProfileDetailsEnabled(true);
        present();
    };

    return (
        <IonItem className="chat-item" button detail={true} onClick={openModal}>
            <IonAvatar>
                {isDeactivated
                    ? <img alt="chat avatar" src={"../static/img/null.png"} onError={(e) => onImgError(e)} />
                    : <img alt="chat avatar" src={displayPic ?? "../static/img/null.png"} onError={(e) => onImgError(e)} />
                }
            </IonAvatar>
            <IonText className="name">{displayName}</IonText>
            {opener &&
                <div slot="end">
                    <FontAwesomeIcon icon={faCommentHeart} />
                </div>
            }
        </IonItem>
    );
};

export default NewChatItem;
