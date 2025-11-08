import { faMessagePlus } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IonRow, IonText, IonList, IonItem, IonFab, IonFabButton, IonAlert, useIonModal } from "@ionic/react";
import React, { useState } from "react";
import GroupTextModal from "../GroupTextModal";
import { getGroupChatInvites, getGroupChats } from "../../hooks/utilities";
import GroupDetailsModal from "../GroupDetailsModal";
import CreateGroupModal from "../CreateGroupModal";
import { useGetCurrentProfile } from "../../hooks/api/profiles/current-profile";



type Props = {
    groupChats: any,
    groupChatInvites: any
};


const GroupChatsSegment: React.FC<Props> = (props) => {
    const { groupChats, groupChatInvites } = props;

    const [groupTextModalData, setGroupTextModalData] = useState<any>(null)
    const [groupDetailsData, setGroupDetailsData] = useState<any>(null)

    const [showStoreAlert, setShowStoreAlert] = useState(false);

    const currentUserProfile = useGetCurrentProfile().data;


    const handleGroupDismiss = () => {
        dismissGroup();
    };

    const handleCreateGroupDismiss = () => {
        dismissCreateGroup();
    };

    const [presentGroup, dismissGroup] = useIonModal(GroupTextModal, {
        groupTextModalData: groupTextModalData,
        currentUser: currentUserProfile?.user,
        onDismiss: handleGroupDismiss,
    });


    const [presentCreateGroup, dismissCreateGroup] = useIonModal(CreateGroupModal, {
        onDismiss: handleCreateGroupDismiss,
    });

    const openGroupTextModal = (item: any) => {

        setGroupTextModalData(item)
        presentGroup();
    }

    const openCreateGroupModal = () => {

        presentCreateGroup();
    }

    const handleGroupDetailsDismiss = async () => {
        // setGroupChats(await getGroupChats());
        // setGroupChatInvites(await getGroupChatInvites());
        groupDetailsDismiss()
      }
    
      const [groupDetailsPresent, groupDetailsDismiss] = useIonModal(GroupDetailsModal, {
        groupDetailsData: groupDetailsData,
        currentUser: currentUserProfile,
        onDismiss: () => handleGroupDetailsDismiss()
      });

    const openGroupDetailsModal = (item: any) => {
        setGroupDetailsData(item)
        groupDetailsPresent();
    }



    return (
        <>
            {groupChats?.data && groupChats?.data.length == 0 && groupChatInvites?.data && groupChatInvites?.data.length == 0 ?
                <IonRow className="empty-chats">
                    <img alt="Flower gif" src="../static/img/refresh-icon@3x.png" />
                    <IonText>
                        <br /><br />
                        Group chats are under construction!
                    </IonText>
                </IonRow>
                : <></>
            }
            <IonList id="wl" lines="full">
                {groupChats?.data.map((item: any, index: number) => (
                    <li key={index}>
                        <IonItem className="chat-item" button detail={true} onClick={() => openGroupTextModal(item)}>
                            <IonText className="name">{item.group_name !== null ? item.group_name : "New group"}</IonText>
                        </IonItem>
                    </li>
                ))}
            </IonList>
            {groupChatInvites?.data.length > 0 ?
                <div>
                    <IonRow className="page-title">
                        <IonText>
                            <h2>Invites</h2>
                        </IonText>
                    </IonRow>
                    <IonList id="wl" lines="full">
                        {groupChatInvites?.data.map((item: any, index: number) => (
                            <li key={index}>
                                <IonItem className="chat-item" button detail={true} onClick={() => openGroupDetailsModal(item)}>
                                    <IonText className="name">{item.group_name !== null ? item.group_name : "New group"}</IonText>
                                </IonItem>
                            </li>
                        ))}
                    </IonList>
                </div>
                : <></>}
            <IonFab className="very-bottom larger-font" slot="fixed" vertical="bottom" horizontal="end">
                {/* {currentUserProfile.subscription_level == "pro" && currentUserProfile.settings_create_groups ?
                    <IonFabButton onClick={() => openCreateGroupModal()}>
                        <FontAwesomeIcon icon={faMessagePlus} />
                    </IonFabButton>
                    : currentUserProfile.subscription_level == "pro" && !currentUserProfile.settings_create_groups ?
                        <></>
                        : */}
                        <IonFabButton onClick={() => setShowStoreAlert(true)}>
                            <FontAwesomeIcon icon={faMessagePlus} />
                            <IonAlert
                                isOpen={showStoreAlert}
                                onDidDismiss={() => setShowStoreAlert(false)}
                                header="Group messages currently under construction! Come back soon."
                                buttons={[{
                                    text: "Ok",
                                    role: 'destructive'
                                }
                                // {
                                //     text: 'Get Pro!',
                                //     handler: async () => {
                                //         window.location.pathname = "/store"
                                //     }
                                // }
                                ]}
                            />
                        </IonFabButton>
                        {/* } */}
            </IonFab>

        </>
    )
};

export default GroupChatsSegment;
