import { IonContent, IonPage, IonFab, IonFabButton, IonIcon, IonFabList, useIonAlert, IonRow, IonLabel, useIonModal, IonSpinner, IonNote, IonCard, IonTitle, IonCardTitle } from '@ionic/react';
import ProfileCard from './ProfileCard';
import React, { useState } from 'react'
import { hourglass as hourglassIcon, square as squareIcon, alert as alertIcon, heartOutline as heartIcon, ellipsisHorizontal as ellipsisIcon, bugOutline as bugIcon, eyeOff as eyeoffIcon, eye as eyeIcon, backspace as backspaceIcon } from 'ionicons/icons';
import { chevronBackOutline } from 'ionicons/icons';

import axios from 'axios';

import { addToHiddenDialogs, increaseStreak, newMessagePush, removeFromHiddenDialogs, sendAnOpener, updateBlockedConnections, updateDismissedConnections, updateMutualConnection, updateOutgoingConnections, updateUnmatchedConnections } from '../hooks/utilities';

import './ProfileModal.css'
import ReportModal from './ReportModal';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentHeart } from '@fortawesome/pro-solid-svg-icons';
import { LikeMessageAlertModal } from '../pages/LikeMessageAlertModal';


axios.defaults.withCredentials = true;



type Props = {
    cardData: any;
    profiletype: "unconnected" | "connected" | "self" | "connected-nodismiss" | "unconnected-nodismiss",
    pro: boolean,
    settingsAlt: boolean,
    yourName?: string,
    onDismiss: () => void;
    onActionDismiss?: (action: 'NoAction' | 'ActionTaken') => void;
};


const ProfileModal: React.FC<Props> = (props) => {

    const { cardData, profiletype, pro, settingsAlt, yourName, onDismiss, onActionDismiss = () => {} } = props;

    const [presentAlert] = useIonAlert();

    const [showMessageWithLikeModal, setShowMessageWithLikeModal] = useState(false);
    const [showMessagePop, setShowMessagePop] = useState(false);


    const [offendingId, setOffendingId] = useState<number | null>(null);
    const [offendingName, setOffendingName] = useState<string | null>(null);

    // tanstack query
    const queryClient = useQueryClient()
    const currentUserProfile = useGetCurrentProfile().data;

    const [buttonLoading, setButtonLoading] = useState<boolean>(false);


    const handleSendMessageAndLike = async (connection: number, message: string) => {
        try {
            await sendAnOpener(connection, message);
            await addOutgoingConnection(connection);
        } catch (err) {
            console.error(err);
        }
    };



    // const blockingAlert = async (connection: number) => {
    //     presentAlert({
    //         header: 'Are you sure you want to block this person?!',
    //         subHeader: 'This cannot be undone. Both of you will lose access to any messages you have exchanged with one another.',
    //         buttons: [
    //             {
    //                 text: 'Nevermind',
    //                 role: 'cancel',

    //             },
    //             {
    //                 text: 'Yes!',
    //                 role: 'confirm',
    //                 handler: () => {
    //                     addBlockedConnection(connection);
    //                 },
    //             },
    //         ]
    //     })
    // }

    const blockingAlert = async (connection: number) => {
        const alert = await presentAlert({
          header: 'Are you sure you want to block this person?!',
          subHeader:
            'This cannot be undone. Both of you will lose access to any messages you have exchanged with one another.',
          inputs: [
            {
              name: 'confirmation',
              type: 'text',
              placeholder: 'Type "block" to confirm',
            },
          ],
          buttons: [
            {
              text: 'Nevermind',
              role: 'cancel',
            },
            {
              text: 'Yes!',
              role: 'confirm',
              handler: async (alertData) => {
                if (alertData?.confirmation?.toLowerCase() === 'block') {
                  await addBlockedConnection(connection);
                } else {
                  // Optional: Show a warning or re-open the alert
                //   alert.dismiss();
                  console.log("no block")
                  setTimeout(() => {
                    presentAlert({
                      header: 'Incorrect Confirmation',
                      message: 'You must type "block" exactly to proceed. You can try blocking this user again.',
                      buttons: ['OK'],
                    });
                  }, 300);
                }
              },
            },
          ],
        });
      };
      

    const unmatchAlert = async (connection: number) => {
        presentAlert({
            header: 'Are you sure you want to unmatch with this person?',
            subHeader: 'This cannot be undone. Both of you will lose access to any messages you have exchanged with one another.',
            message: 'Tip: Need a break? Hiding a chat lets you step back without losing your messages or the connection.',
            inputs: [
                {
                  name: 'confirmation',
                  type: 'text',
                  placeholder: 'Type "unmatch" to confirm',
                },
              ],
            buttons: [
                {
                    text: 'Nevermind',
                    role: 'cancel',

                },

                {
                    text: 'Yes!',
                    role: 'confirm',
                    handler: async (alertData) => {
                      if (alertData?.confirmation?.toLowerCase() === 'unmatch') {
                        await unmatchConnection(connection);
                      } else {
                        // Optional: Show a warning or re-open the alert
                      //   alert.dismiss();
                        console.log("no unmatch")
                        setTimeout(() => {
                          presentAlert({
                            header: 'Incorrect Confirmation',
                            message: 'You must type "unmatch" exactly to proceed. You can try unmatching this user again.',
                            buttons: ['OK'],
                          });
                        }, 300);
                      }
                    },
                  },
            ]
        })
    }


    const addMutualConnection = async (connection: number, name: string) => {
        setButtonLoading(true)
        const response = await updateMutualConnection(connection)
        onActionDismiss('ActionTaken');
        queryClient.invalidateQueries({ queryKey: ['mutuals'] })

        newMessagePush([connection.toString()], "You have a new connection!", "Start a chat with " + name, "connection", `You and ${name} connected.`)
        onDismiss()
        if (currentUserProfile?.settings_streak_tracker) {
            await increaseStreak()
            queryClient.invalidateQueries({ queryKey: ['streak'] })
        }

        setButtonLoading(false)


        return response
    }

    // const addDismissedConnection = async (connection: number) => {
    //     console.log("dismissing, then moving on")
    //     const response = await updateDismissedConnections(connection)


    //     onDismiss()

    //     return response
    // }

    const addToHiddenChats = async (connection: number) => {
        console.log("adding to hidden chats, then moving on")
        const response = await addToHiddenDialogs(connection)
        queryClient.invalidateQueries({ queryKey: ['current'] })
        onActionDismiss('ActionTaken');
        onDismiss()

        return response
    }

    const removeFromHiddenChats = async (connection: number) => {
        console.log("adding to hidden chats, then moving on")
        const response = await removeFromHiddenDialogs(connection)
        queryClient.invalidateQueries({ queryKey: ['current'] })
        onActionDismiss('ActionTaken');
        onDismiss()

        return response
    }

    const addBlockedConnection = async (connection: number) => {
        console.log("blocking, then moving on")
        const response = await updateBlockedConnections(connection)
        onActionDismiss('ActionTaken');
        queryClient.invalidateQueries({ queryKey: ['current'] })
        queryClient.invalidateQueries({ queryKey: ['chats'] })
        queryClient.invalidateQueries({ queryKey: ['mutuals'] })
        queryClient.invalidateQueries({ queryKey: ['mutuals-no-dialog'] })
        onDismiss()

        return response
    }

    const addDismissedConnection = async (connection: number) => {
        console.log("dismiss, then moving on")
        const response = await updateDismissedConnections(connection)
        onActionDismiss('ActionTaken');
        queryClient.invalidateQueries({ queryKey: ['current'] })
        onDismiss()
        return response
    }

    const unmatchConnection = async (connection: number) => {
        console.log("unmatch")
        const response = await updateUnmatchedConnections(connection)
        onActionDismiss('ActionTaken');
        queryClient.invalidateQueries({ queryKey: ['current'] })
        queryClient.invalidateQueries({ queryKey: ['mutuals'] })
        queryClient.invalidateQueries({ queryKey: ['chats'] })
        queryClient.invalidateQueries({ queryKey: ['mutuals-no-dialog'] })
        onDismiss()
        return response
    }

    const handleReportOpen = async (id: number, name: string) => {
        setOffendingId(id)
        setOffendingName(name)
        createReportPresent()
    }

    const [createReportPresent, createReportDismiss] = useIonModal(ReportModal, {
        offender: "user",
        text: offendingName,
        id: offendingId,
        onDismiss: (data: string, role: string) => createReportDismiss(data, role),
    });

    const addOutgoingConnection = async (connection: number) => {
        setButtonLoading(true)
        const response = await updateOutgoingConnections(connection)
        queryClient.invalidateQueries({ queryKey: ['current'] })
        // Not doing this here because we don't want to send this if the other person has already dismissed them.
        // newMessagePush(connection, name + " wants to connect!", "Check out your Likes")
        onDismiss()
        if (currentUserProfile?.settings_streak_tracker) {
            await increaseStreak()
            queryClient.invalidateQueries({ queryKey: ['streak'] })
        }
        setButtonLoading(false)

        return response
    }

    const [presentLikeMessageModal, dismissLikeMessageModal] = useIonModal(LikeMessageAlertModal, {
        connectionName: cardData?.name,
        onDismiss: () => dismissLikeMessageModal(),
        onSendLike: async () => {
            await addOutgoingConnection(cardData?.user);
            onActionDismiss('ActionTaken');
            dismissLikeMessageModal();
        },
        onSendWithMessage: async (msg: string) => {
            await handleSendMessageAndLike(cardData?.user, msg);
            onActionDismiss('ActionTaken');
            setShowMessagePop(true);
            setTimeout(() => setShowMessagePop(false), 10);
            dismissLikeMessageModal();
        },
    });

    const handleDismissProfile = () => {
        onActionDismiss('NoAction');
        onDismiss();
    }


    return (
        <IonPage>
            <IonContent fullscreen scrollEvents={true}>
                {cardData?.name ?
                    <>
                        {cardData?.latest_opener_text &&
                            <IonRow class="message-bubble"><p><FontAwesomeIcon icon={faCommentHeart}></FontAwesomeIcon> {cardData.name} sent you a message along with a Like!</p>
                                <IonCard class="message-bubble"><h5>{cardData?.latest_opener_text}</h5></IonCard>
                            </IonRow>
                        }
                        <ProfileCard cardData={cardData} pro={pro ? true : false} settingsAlt={settingsAlt} />
                    </>
                    :
                    <IonRow className="ion-justify-content-center">
                        <IonSpinner name="bubbles"></IonSpinner>
                    </IonRow>
                }
                <IonFab class="very-top " slot="fixed" vertical="top" horizontal="start">
                    <IonFabButton onClick={handleDismissProfile} color="light">
                        <IonIcon icon={chevronBackOutline}></IonIcon>
                    </IonFabButton>
                </IonFab>
                {profiletype == "self" ?
                    <></> :
                    <IonFab class="very-bottom" slot="fixed" vertical="bottom" horizontal="start">
                        <IonFabButton disabled={buttonLoading} color="secondary">
                            <IonIcon icon={profiletype == "unconnected" ? bugIcon : ellipsisIcon}></IonIcon>
                        </IonFabButton>
                        <IonFabList className="with-label" side="top">
                            {profiletype == "unconnected" ?
                                <IonFabButton disabled={buttonLoading} color="warning" onClick={() => addDismissedConnection(cardData.user)} data-label="Ignore for now">
                                    <IonIcon icon={hourglassIcon}></IonIcon>
                                </IonFabButton>
                                : profiletype == "connected" ?
                                    <>
                                        {currentUserProfile?.hidden_dialogs?.includes(cardData.user) ?
                                            <IonFabButton disabled={buttonLoading} color="tertiary" onClick={() => removeFromHiddenChats(cardData.user)} data-label="Unhide Chat">
                                                <IonIcon icon={eyeIcon}></IonIcon>
                                            </IonFabButton> :
                                            <IonFabButton disabled={buttonLoading} color="warning" onClick={() => addToHiddenChats(cardData.user)} data-label="Add to Hidden Chats">
                                                <IonIcon icon={eyeoffIcon}></IonIcon>
                                            </IonFabButton>
                                        }
                                        <IonFabButton disabled={buttonLoading} color="gray" onClick={() => unmatchAlert(cardData.user)} data-label="Unmatch">
                                            <IonIcon icon={backspaceIcon}></IonIcon>
                                        </IonFabButton>
                                    </>
                                    :
                                    <></>
                            }
                            <IonFabButton disabled={buttonLoading} color="danger" onClick={() => blockingAlert(cardData.user)} data-label="Block">
                                <IonIcon icon={squareIcon}></IonIcon>
                            </IonFabButton>
                            <IonFabButton disabled={buttonLoading} color="dark" onClick={() => handleReportOpen(cardData.user, cardData.name)} data-label="Report">
                                <IonIcon icon={alertIcon}></IonIcon>
                            </IonFabButton>
                        </IonFabList>
                    </IonFab>

                }
                <>
                    {profiletype == "connected" || profiletype == "self" || profiletype == "connected-nodismiss" ?
                        <></> :
                        profiletype == "unconnected-nodismiss" ?
                            <IonFab class="very-bottom" slot="fixed" vertical="bottom" horizontal="end">
                                <IonFabButton disabled={buttonLoading} onClick={() => presentLikeMessageModal({
                                    cssClass: 'like-message-alert-modal',
                                })}>
                                    <IonIcon icon={heartIcon}></IonIcon>
                                </IonFabButton>
                            </IonFab>
                            :
                            <IonFab class="very-bottom" slot="fixed" vertical="bottom" horizontal="end">
                                <IonFabButton disabled={buttonLoading} onClick={() => addMutualConnection(cardData.user, currentUserProfile?.name)}>
                                    <IonIcon icon={heartIcon}></IonIcon>
                                </IonFabButton>
                            </IonFab>
                    }
                </>

            </IonContent>
            <IonRow class="just-some-extra-space">
            </IonRow>
        </IonPage>
    );

};



export default ProfileModal;

