import React, { useRef, useState } from "react";

import { IonContent, IonButton, IonPage, IonRow, IonText, IonCard, IonCardTitle, IonCardContent, useIonAlert } from '@ionic/react';
import { Preferences } from "@capacitor/preferences";
import { deleteAccount, isMobile, logoutCurrent, updateCurrentUserProfile } from "../hooks/utilities";
import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";



type Props = {
    onDismiss: () => void;
};


const DeleteModal: React.FC<Props> = (props) => {

    const { onDismiss } = props;

    const [appLoading, setAppLoading] = useState(false);
    const [presentConfirmAlert] = useIonAlert();
    const queryClient = useQueryClient()

    const [presentExtraAlert] = useIonAlert();



    const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

    const deactivateProfileClicked = async () => {
        console.log('Deactivate clicked');
        presentConfirmAlert({
            header: 'Are you sure you want to deactivate your profile?',
            subHeader: 'You can reactivate whenever you want.',
            buttons: [
                {
                    text: 'Nevermind.',
                    role: 'cancel',
                },
                {
                    text: "Yes, I'm sure",
                    role: 'confirm',
                    handler: async () => {
                        await updateCurrentUserProfile({ "deactivated_profile": true, "settings_community_profile": false })
                        queryClient.invalidateQueries({ queryKey: ['current'] })
                        window.location.reload()
                    },
                },
            ]
        })
    }

    async function handleLogout() {
        try {
            const response = await logoutCurrent()
        }
        catch {
            console.log("Something went wrong.")
        }
        await Preferences.remove({ key: 'EXPIRY' })
        localStorage.removeItem('token')
        Cookies.remove('sessionid')
        Cookies.remove('csrftoken')
        window.location.href = "/";
        if (!isMobile()) {
            console.log("Skipping OneSignal logout ")
        }
        else {
            console.log("Doing OneSignal logout");
            (window as any).plugins.OneSignal.logout();
        }
    };

    const deleteAccountClickedAgain = async () => {

        console.log('Delete clicked');
        presentConfirmAlert({
            header: 'Are you sure you want to delete your account?',
            buttons: [
                {
                    text: 'Nevermind.',
                    role: 'cancel',
                },
                {
                    text: "Yes, I'm sure",
                    role: 'destructive',
                    handler: async () => {
                        
                        setTimeout(() => {
                            presentExtraAlert({
                              header: "If you delete your account and later decide to return, you'll need to contact support.",
                              message: "Please confirm that you understand you won't be able to create a new account on your own by typing 'I understand'.",
                              inputs: [
                                {
                                  name: 'confirmation',
                                  type: 'text',
                                  placeholder: 'Type "I understand" here'
                                }
                              ],
                              buttons: [
                                {
                                  text: 'Cancel',
                                  role: 'cancel'
                                },
                                {
                                  text: 'Confirm',
                                  handler: async (data) => {
                                    if (data.confirmation?.trim().toUpperCase() === "I UNDERSTAND") {
                                        await updateCurrentUserProfile({ deactivated_profile: true, created_profile: false })
                                        await deleteAccount();
                                        queryClient.invalidateQueries({ queryKey: ['current'] })
                                        handleLogout()
                                    } else {
                                      setTimeout(() => {
                                        presentExtraAlert({
                                          header: "Incorrect Confirmation",
                                          message: "You must type 'I understand' exactly to proceed. Try deleting your account again.",
                                          buttons: ["OK"]
                                        });
                                      }, 300); // Delay so the first confirm alert closes before this shows
                                    }
                                  }
                                }
                              ]
                            });
                          }, 300); 
                    },
                },
            ]
        })
    }




    return (
        <IonPage>
            <IonContent>
                <IonCard style={{ boxShadow: "none" }}>
                    <IonCardTitle style={{ padding: "30pt" }}>
                        Are you sure?
                    </IonCardTitle>
                    <IonCardContent>
                        <IonText>
                            Refresh Connections is built for authentic relationships, not account hopping. For community safety, each member may make one account—and if you delete it, <span style={{fontWeight: "bold"}}>you'll need to contact support if you decide to return to the community</span>. This safeguards connection integrity, keeps blocking effective, and prevents misuse.
                            <br /><br />
                            If you need a break, consider pausing your profile or deactivating your account.
                            <br /><br />
                            You can read more about the difference between pausing, deactivating, and deleting in our <a href="/faqs">FAQs</a>.

                        </IonText>
                    </IonCardContent>



                </IonCard>
                <IonRow className="ion-justify-content-center">
                    <IonButton fill="outline" onClick={deactivateProfileClicked}>
                        Deactivate instead
                    </IonButton>
                </IonRow>
                <IonRow className="ion-justify-content-center" style={{ paddingBottom: "30pt" }}>
                    <IonButton onClick={onDismiss}>
                        Go Back
                    </IonButton>
                    <IonButton color="danger" onClick={deleteAccountClickedAgain} >
                        Proceed with deleting
                    </IonButton>
                </IonRow>
            </IonContent>
        </IonPage>
    )
};

export default DeleteModal;

