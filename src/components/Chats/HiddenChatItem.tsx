import { IonAvatar, IonBadge, IonItem, IonText, useIonModal } from "@ionic/react";
import React, { useEffect, useState } from "react";
import { getPrimaryPhoto, isPersonalPlus, onImgError } from "../../hooks/utilities";
import { useProfileDetails } from "../../hooks/api/profiles/details";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentHeart } from "@fortawesome/pro-solid-svg-icons";
import { useQueryClient } from "@tanstack/react-query";

import TextModal from "../TextModal";
import { chatQueryKeys } from "../../hooks/api/chats/chat-query-keys";
import { Preferences } from "@capacitor/preferences";

const HIDDEN_CHAT_NEW_MESSAGE_BADGES_KEY = 'hidden_chat_new_message_badges';
const HIDDEN_CHAT_NEW_MESSAGE_BADGES_CHANGED_EVENT = 'hidden_chat_new_message_badges_changed';

type Props = {
    user: any;
    currentUserProfile: any;
    chat: any;
};

const HiddenChatItem: React.FC<Props> = ({ user, currentUserProfile, chat }) => {
    const queryClient = useQueryClient();
    const hasSummaryProfileData = chat.name !== undefined || chat.pic1_main !== undefined;
    const [profileDetailsEnabled, setProfileDetailsEnabled] = useState(!hasSummaryProfileData);
    const { data: profileDetails } = useProfileDetails(user, profileDetailsEnabled);
    const displayName = chat.name ?? profileDetails?.name ?? "";
    const displayPic = chat.pic1_main !== undefined ? chat.pic1_main : getPrimaryPhoto(profileDetails);
    const [showNewMessageBadges, setShowNewMessageBadges] = useState<boolean>(true);
    const canShowNewMessageBadges = isPersonalPlus(currentUserProfile?.subscription_level);

    useEffect(() => {
        Preferences.get({ key: HIDDEN_CHAT_NEW_MESSAGE_BADGES_KEY }).then(({ value }) => {
            setShowNewMessageBadges(value !== 'false');
        });
        const handler = (e: Event) => setShowNewMessageBadges((e as CustomEvent<boolean>).detail);
        window.addEventListener(HIDDEN_CHAT_NEW_MESSAGE_BADGES_CHANGED_EVENT, handler);
        return () => {
            window.removeEventListener(HIDDEN_CHAT_NEW_MESSAGE_BADGES_CHANGED_EVENT, handler);
        };
    }, []);

    const [present, dismiss] = useIonModal(TextModal, {
        textModalData: chat,
        unreadCount: chat?.unread_count ?? 0,
        profileDetails: profileDetails,
        pro: isPersonalPlus(currentUserProfile?.subscription_level),
        settingsAlt: currentUserProfile?.settings_alt_text,
        from_name: currentUserProfile?.name,
        onDismiss: () => {
            queryClient.invalidateQueries({
                queryKey: chatQueryKeys.unread,
            });
            queryClient.invalidateQueries({
                queryKey: chatQueryKeys.hidden,
            });
            dismiss();
        },
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
            {canShowNewMessageBadges && showNewMessageBadges && chat?.unread_count > 0 && (
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
