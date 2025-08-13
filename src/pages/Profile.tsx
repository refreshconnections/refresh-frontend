import { IonButton, IonCard, IonContent, IonPage, IonRow, IonText, useIonAlert, IonNote, IonFabButton, IonIcon, IonFab, IonCardContent } from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import SelfProfile from '../components/SelfProfile';
import { updateCurrentUserProfile, updateCurrentModeration, sendAnEmail } from '../hooks/utilities';
import { chevronBackOutline } from 'ionicons/icons';

import "./Page.css"
import "./Me.css"
import "./Profile.css"

import LoadingCard from '../components/LoadingCard';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useQueryClient } from '@tanstack/react-query';
import { useGetStatuses } from '../hooks/api/status';
import StatusToast from '../components/StatusToast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate } from '@fortawesome/pro-solid-svg-icons/faArrowsRotate';
import { useGetCurrentModeration } from '../hooks/api/profiles/current-moderation';

const Profile: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const [cantUnpauseAlert, dismissAlert] = useIonAlert();

  // tanstack query
  const data = useGetCurrentProfile().data;
  const moderation = useGetCurrentModeration().data;
  const queryClient = useQueryClient()


  const [isToastOpen, setIsToastOpen] = useState<boolean>(false)


  const statuses = useGetStatuses().data;

  const profileStatus = useMemo(
    () => statuses?.find(status => {
      return status.page.includes('picks')
    }),
    [statuses]
  );

  const isBeforeExpiration = useMemo(
    () => profileStatus?.active && new Date() < new Date(profileStatus?.expirationDateTime) || !profileStatus?.expirationDateTime,
    [profileStatus?.expirationDateTime]
  );

  useEffect(() => {
    if (moderation?.moderator_paused || moderation?.moderator_paused_check_required) {
      moderatorNote()
    }
  }, [moderation]);

  const unpauseHandler = async () => {

    dismissAlert()
    setLoading(true)
    await updateCurrentUserProfile({ "paused_profile": false })
    await updateCurrentModeration({ "moderator_paused": false })
    await sendAnEmail("report@refreshconnections.com", `${data?.name ?? "Someone"} unpaused`, `Please check it out. Note: ${moderation?.moderator_paused_note ?? "none"}`)
    queryClient.invalidateQueries({ queryKey: ['current'] })
    setLoading(false)
    
  }

  const cantUnpauseHandler = async () => {
    dismissAlert()

    await sendAnEmail("report@refreshconnections.com", data?.name + " wants to unpause", `Please check it out. Note: ${moderation?.moderator_paused_note ?? "none"}`)
    await updateCurrentModeration({ "moderator_email_sent": true })
    queryClient.invalidateQueries({ queryKey: ['current', 'moderation'] })
    
  }




  const cantUnpause = async (message: string) => {
    cantUnpauseAlert({
      header: 'Uh oh. Your profile is not ready to be un-paused!',
      subHeader: message,
      buttons: [
        {
          text: 'Ok!',
          role: 'cancel',
        },
      ],
    })
  }

  const cantReactivate = async () => {
    cantUnpauseAlert({
      header: 'Your account has been temporarily suspended pending moderator review.',
      message: moderation?.moderator_deactivated_note ? moderation?.moderator_deactivated_note + ' Please reach out to help@refreshconnections.com if you have any questions.' : "This was the result of a community report and/or moderation for the safety of our community. Please reach out to help@refreshconnections.com if you have any questions. Please reach out to help@refreshconnections.com if you have any questions.",
      buttons: [
        {
          text: 'Ok.',
          role: 'cancel',
        },
      ],
    })
  }

  const allowUnpauseButAlertModerator = async () => {
    cantUnpauseAlert({
      header: 'Ready to unpause?',
      subHeader: moderation?.moderator_paused_note ? "Your profile will unpause right away. It will be reviewed again by a moderator so make sure you've made the appropriate changes." : "",
      message: "Moderator's note: " + moderation?.moderator_paused_note,
      buttons: [
        {
          text: 'Not ready yet',
          role: 'cancel',
        },
        {
          text: 'Unpause',
          role: 'confirm',
          handler: async () => {
            console.log('Unpause clicked');
            await unpauseHandler()
            
          }
        }
      ],
    })
  }

  const cantUnpauseModerator = async () => {
    cantUnpauseAlert({
      header: 'Your profile needs to be reviewed by a moderator before you can unpause. They will unpause it for you once it has been reviewed.',
      subHeader: moderation?.moderator_paused_note ?? "",
      buttons: [
        {
          text: 'Not ready yet',
          role: 'cancel',
        },
        {
          text: 'Ask moderator to review',
          handler: async () => {
            console.log('Unpause clicked');
            await cantUnpauseHandler()
          }
        }
      ],
    })
  }

  const moderatorNote = async () => {
    cantUnpauseAlert({
      header: 'Your profile was paused by a moderator.',
      subHeader: moderation?.moderator_paused_note ?? "",
      buttons: [
        {
          text: 'Ok!',
          role: 'cancel',
        },
      ],
    })
  }



  const unPauseProfileHandler = async () => {

    if (data?.pic1_main == null || data?.pic2 == null || data?.pic3 == null) {
      cantUnpause("Make sure you have uploaded your first three pictures.")
    }
    else if (data.bio == null || data.bio == "") {
      cantUnpause("Write something in your bio.")
    }
    else if (data.looking_for.length == 0) {
      cantUnpause("Select at least one value in the Looking For section.")
    }
    else if (data.covid_precautions.length == 0) {
      cantUnpause("Select at least one value in the Covid Precautions section. That's why we're here!")
    }
    else if (moderation?.moderator_paused_check_required) {
      cantUnpauseModerator()
    }
    else if (moderation?.moderator_paused) {
      allowUnpauseButAlertModerator()
    }
    else {
      await updateCurrentUserProfile({ "paused_profile": false })
      queryClient.invalidateQueries({ queryKey: ['current'] })
    }

  }

  const reactivateProfileHandler = async () => {

    if (moderation?.moderator_deactivated) {
      cantReactivate()
    }
    else {
      await updateCurrentUserProfile({ "deactivated_profile": false })
      window.location.reload()
    }

    

  }

  if (loading) {
    return (
      <IonPage>
        <IonContent>
          <IonRow className="page-title">
            <IonText className="bold">
              <h1>Hi!</h1>
            </IonText>
          </IonRow>
          <LoadingCard />
        </IonContent>
      </IonPage>
    )
  }
  else {
    return (
      <IonPage>
        <IonContent fullscreen>
          <IonFab className="very-top" slot="fixed" vertical="top" horizontal="start">
            <IonFabButton routerLink="/me" routerDirection="back" color="light">
              <IonIcon icon={chevronBackOutline}></IonIcon>
            </IonFabButton>
          </IonFab>
          <IonRow className="page-title">
            <IonText className="bold">
              <h1>Hi {data?.name ?? "there"}!</h1>
            </IonText>
          </IonRow>
          {data?.deactivated_profile ?
              <IonRow className="unpause-profile">
                {moderation?.moderator_deactivated? 
                <>
                <IonNote>Your account has been temporarily suspended by a moderator.</IonNote>
                <IonButton color="warning" onClick={async () => reactivateProfileHandler()}>What does this mean?</IonButton>
                </>
                :
                <>
                <IonNote>Your profile is currently deactivated.</IonNote>
                <IonButton color="tertiary" onClick={async () => reactivateProfileHandler()}>Reactivate profile</IonButton>
                </>}
              </IonRow> :
              data?.paused_profile ?
              <IonRow className="unpause-profile">
                <IonNote>Your profile is currently paused.</IonNote>
                {moderation?.moderator_email_sent ?
                  <IonText> It is under review by a moderator.</IonText> :
                  <IonButton color="tertiary" onClick={unPauseProfileHandler}>{moderation?.moderator_paused_check_required? "Submit for review to unpause" : "Un-pause profile"}</IonButton>
                }
              </IonRow>
              :
              <></>}
          {data?.created_profile ?
            <SelfProfile /> :
            <IonCard className="created-no-shadow ">
              <IonCardContent className="ion-justify-content-center" style={{ display: "flex", flexDirection: "column" }}>
                <img alt="loading-freshy" src="../static/img/flower-mask.png" style={{ width: "40%", alignSelf: "center" }}></img>
                <IonRow className="ion-justify-content-center" style={{ width: "100%" }}>
                  <IonButton fill="clear" onClick={() => window.location.reload()}><FontAwesomeIcon icon={faArrowsRotate} /></IonButton>
                </IonRow>
              </IonCardContent>
            </IonCard>
          }
          
          {data?.name &&
          <IonRow className="ion-justify-content-center">
            Subscription: {data?.subscription_level == "pro" ? "Pro" : data?.subscription_level == "communityplus" ? "Community+" : data?.subscription_level == "personalplus" ? "Personal+" :"none"}
          </IonRow>
          }
          
          <IonRow>
            &nbsp;
          </IonRow>
          {profileStatus?.active && (profileStatus?.header || profileStatus?.message) && isBeforeExpiration ?
            <StatusToast isToastOpen={true} setIsToastOpen={setIsToastOpen} header={profileStatus?.header} message={profileStatus?.message} />
            : <></>}
        </IonContent>
      </IonPage>
    );
  };
}

export default Profile;
