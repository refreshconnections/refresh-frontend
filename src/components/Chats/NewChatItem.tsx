import { IonAvatar, IonItem, IonText, useIonModal } from "@ionic/react";
import React from "react";
import {  isPersonalPlus, onImgError } from "../../hooks/utilities";
import { useProfileDetails } from "../../hooks/api/profiles/details";

import TextModal from "../TextModal";
import { useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentHeart } from "@fortawesome/pro-solid-svg-icons";





type Props = {
    user: any
    currentUserProfile: any;
    opener: boolean
};



const NewChatItem: React.FC<Props> = (props) => {
    const { user, currentUserProfile, opener } = props;
    const queryClient = useQueryClient()

    const profileDetails = useProfileDetails(user).data;


    const handleDismiss = () => {
        queryClient.invalidateQueries({
            queryKey: ['chats'],
        })
        queryClient.invalidateQueries({
            queryKey: ['mutuals-no-dialog'],
        })
        dismiss()
    }

    const [present, dismiss] = useIonModal(TextModal, {
        textModalData: {
            other_user_id: profileDetails?.user.toString(),
            unread_count: 0
        },
        profileDetails: profileDetails,
        pro: isPersonalPlus(currentUserProfile?.subscription_level),
        settingsAlt: currentUserProfile?.settings_alt_text,
        from_name: currentUserProfile?.name, 
        onDismiss: handleDismiss,
      });
    
      const openModal = () => {
    
        
        present();
      }

    // useEffect(() => {
    //     setLoading(true); // set loading to true
    //     const fetchData = async () => {
    //         setProfileDetails(await getProfileCardInfo(user))
    //     }
    //     fetchData();
    //     setLoading(false);
    // }, []);


    return (
        <>
            {(!(currentUserProfile?.hidden_dialogs.includes(user)) && !(currentUserProfile?.blocked_connections.includes(user))) ?
                <IonItem className="chat-item" button disabled={!profileDetails} detail={true} 
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
                    {opener &&
                    <div slot="end">
                    <FontAwesomeIcon icon={faCommentHeart} ></FontAwesomeIcon>
                    </div>
                    }
                </IonItem>
                : <></>}
        </>


    )
};

export default NewChatItem;
