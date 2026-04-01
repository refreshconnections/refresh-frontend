import { IonContent, RefresherEventDetail, IonHeader, IonCard, IonCardContent, IonPage, IonTitle, IonToolbar, IonCardTitle, IonCardSubtitle, IonButton, IonText, IonFab, IonFabButton, IonIcon, IonRow, IonModal, IonButtons, IonItem, IonLabel, IonList, IonCheckbox, IonInput, IonRefresher, IonRefresherContent, IonFabList, useIonAlert, useIonModal, IonNote, IonCol, IonGrid, IonToggle, useIonActionSheet, IonSelect, IonSelectOption, ToggleCustomEvent } from '@ionic/react';
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { chevronBackOutline } from 'ionicons/icons';
import OneSignal from 'onesignal-cordova-plugin';


import "./Page.css"
import "./Settings.css"

import { updateCurrentUserProfile, logoutAll, logoutCurrent, applyThemeFromPref, setThemePref, isMobile, setFontSizePref, setTextZoom, clearStreak, removeAllProfilesFromCapacitorStorage, getReduceAnimations, setReduceAnimationsPref } from '../hooks/utilities';


import ChangePasswordModal from '../components/ChangePasswordModal';
import { Preferences } from '@capacitor/preferences';
import Cookies from 'js-cookie';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons/faRightFromBracket';
import { faUnlock } from '@fortawesome/free-solid-svg-icons/faUnlock';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePause } from '@fortawesome/pro-solid-svg-icons/faCirclePause';
import { faRightFromLine } from '@fortawesome/pro-solid-svg-icons/faRightFromLine';
import { faTrashCan } from '@fortawesome/pro-solid-svg-icons/faTrashCan';
import { faSquareMinus } from '@fortawesome/pro-solid-svg-icons/faSquareMinus';
import { faSquarePlus } from '@fortawesome/pro-solid-svg-icons/faSquarePlus';
import { faCirclePlay } from '@fortawesome/pro-solid-svg-icons/faCirclePlay';
import DeleteModal from '../components/DeleteModal';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { faRefresh } from '@fortawesome/pro-solid-svg-icons/faRefresh';
import { useGetStatuses } from '../hooks/api/status';
import StatusToast from '../components/StatusToast';
import EditHiddenContentModal from '../components/EditHiddenContentModal';
import { useGetCurrentModeration } from '../hooks/api/profiles/current-moderation';
import EditChatSettingsModal from '../components/EditChatSettingsModal';
import EditPushNotifications from '../components/EditPushNotifications';
import { removeFromCapacitorLocalStorage } from '../hooks/capacitorPreferences/all';
import { faBroomWide, faEnvelope, faEnvelopeCircleCheck } from '@fortawesome/pro-solid-svg-icons';
import EmailSettingsModal from '../components/EmailSettingsModal';
import { faEnvelopes } from '@fortawesome/pro-regular-svg-icons';





const Settings: React.FC = () => {

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [theme, setTheme] = useState<'auto' | 'light' | 'dark' | null>(null);
  const [fontZoom, setFontZoom] = useState<'auto' | 'default' | 'large' | 'xl' | null>(null);
  const [reduceAnimations, setReduceAnimations] = useState<boolean>(false);
  const [chatOrganizer, setChatOrganizer] = useState<boolean>(true);
  const [chatOrganizerShowHidden, setChatOrganizerShowHidden] = useState<boolean>(false);

  const queryClient = useQueryClient()
  const data = useGetCurrentProfile().data
  const [streakTracker, setStreakTracker] = useState<boolean | null>(
    typeof data?.settings_streak_tracker === 'boolean' ? data.settings_streak_tracker : null
  );
  const moderation = useGetCurrentModeration().data;


  const [isToastOpen, setIsToastOpen] = useState<boolean>(false)

  const statuses = useGetStatuses().data;

  const settingsStatus = useMemo(
    () => statuses?.find(status => {
      return status.page.includes('settings')
    }),
    [statuses]
  );

  const isBeforeExpiration = useMemo(
    () => settingsStatus?.active && new Date() < new Date(settingsStatus?.expirationDateTime),
    [settingsStatus?.expirationDateTime]
  );




  async function handleLogout() {
    await Preferences.remove({ key: 'EXPIRY' })
    await Preferences.clear();
    localStorage.removeItem('token')
    localStorage.clear();
    Cookies.remove('sessionid')
    Cookies.remove('csrftoken')
    try {
      const response = await logoutCurrent()
    }
    catch {
      console.log("Something went wrong.")
    }
    window.location.href = "/";
    if (!isMobile()) {
      console.log("Skipping OneSignal logout ")
    }
    else {
      console.log("Doing OneSignal logout");
      (window as any).plugins.OneSignal.logout();
    }
  };

  async function clearCachedData() {
    await removeFromCapacitorLocalStorage('picks_with_filters')
    await removeFromCapacitorLocalStorage('last_shown_pick')
    await removeFromCapacitorLocalStorage('chats')
    await removeFromCapacitorLocalStorage('radius')
    await removeFromCapacitorLocalStorage('local')
    await removeFromCapacitorLocalStorage('filters')
    await removeFromCapacitorLocalStorage('sort')
    await removeAllProfilesFromCapacitorStorage()
  };

  async function handleLogoutAll() {
    const response = await logoutAll()
    await Preferences.remove({ key: 'EXPIRY' })
    localStorage.removeItem('token')
    localStorage.clear();
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


  const [presentConfirmAlert] = useIonAlert();
  const [cantUnpauseAlert] = useIonAlert();
  const [turnOffStreakAlert] = useIonAlert();


  const [deleteWarningOpen, deleteWarningDismiss] = useIonModal(DeleteModal, {
    onDismiss: () => deleteWarningDismiss(),
  });

  const deleteAccountClicked = async () => {
    deleteWarningOpen();
  }

  const pauseProfileClicked = async () => {
    console.log('Pause clicked');
    presentConfirmAlert({
      header: 'Are you sure you want to pause your profile?',
      buttons: [
        {
          text: 'Nevermind.',
          role: 'cancel',
        },
        {
          text: "Yes, I'm sure",
          role: 'confirm',
          handler: async () => {
            await updateCurrentUserProfile({ "paused_profile": true, "settings_community_profile": false })
            queryClient.invalidateQueries({ queryKey: ['current'] })
            window.location.reload()
          },
        },
      ]
    })
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

  const clearStreakTracker = async () => {
    console.log('clear tracker');
    turnOffStreakAlert({
      header: 'Are you sure you want to stop tracking your streak?',
      subHeader: 'Your streak will be set to 0 and you will lose access to features your streak has unlocked.',
      buttons: [
        {
          text: 'Nevermind.',
          role: 'cancel',
          handler: async () => {
            setStreakTracker(true)
          }
        },
        {
          text: "Yes, I'm sure",
          role: 'confirm',
          handler: async () => {
            await clearStreak()
            await updateCurrentUserProfile({ "settings_streak_tracker": false, "settings_show_streak_increase": false })
            queryClient.invalidateQueries({ queryKey: ['current'] })
            queryClient.invalidateQueries({ queryKey: ['streak'] })
          },
        },
      ]
    })
  }


  const unPauseProfileHandler = async () => {

    if (data?.pic1_main == null || data?.pic2 == null || data?.pic3 == null) {
      cantUnpause("Make sure you have uploaded your first three pictures.")
    }
    else if (data?.bio == null || data?.bio == "") {
      cantUnpause("Write something in your bio.")
    }
    else if (data?.looking_for.length == 0) {
      cantUnpause("Select at least one value in the Looking For section.")
    }
    else if (data?.covid_precautions.length == 0) {
      cantUnpause("Select at least one value in the Covid Precautions section. That's why we're here!")
    }
    else if (moderation?.moderator_paused_check_required || moderation?.moderator_paused) {
      cantUnpause("Head to your Profile for more details.")
    }
    else {
      await unpauseProfileClicked()
    }

  }

  const unpauseProfileClicked = async () => {
    console.log('Pause clicked');
    presentConfirmAlert({
      header: 'Are you sure you want to unpause your profile?',
      buttons: [
        {
          text: 'Nevermind.',
          role: 'cancel',
        },
        {
          text: "Yes, I'm sure",
          role: 'confirm',
          handler: async () => {
            await updateCurrentUserProfile({ "paused_profile": false })
            queryClient.invalidateQueries({ queryKey: ['current'] })
          },
        },
      ]
    })
  }

  const deactivateProfileClicked = async () => {
    console.log('Deactivate clicked');
    presentConfirmAlert({
      header: 'Are you sure you want to deactivate your profile?',
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

  const reactivateProfileClicked = async () => {
    console.log('Deactivate clicked');

    if (moderation?.moderator_deactivated) {

      presentConfirmAlert({
        header: 'Your account is under review and cannot be reactivated at this time.',
        message: 'See your Profile page for more information.',
        buttons: [
          {
            text: 'Ok.',
            role: 'cancel'
          },
        ]
      })

    }
    else {
      presentConfirmAlert({
        header: 'Are you sure you want to reactivate your profile?',
        buttons: [
          {
            text: 'Nevermind.',
            role: 'cancel'
          },
          {
            text: "Yes, I'm sure",
            role: 'confirm',
            handler: async () => {
              await updateCurrentUserProfile({ "deactivated_profile": false })
              queryClient.invalidateQueries({ queryKey: ['current'] })
              window.location.reload()
            },
          },
        ]
      })
    }
  }

  const clearCacheClicked = () => {
    console.log('clear cache clicked');
    presentConfirmAlert({
      header: 'Are you sure you want to clear your cached data?',
      message: 'This will temporarily slow the loading of your app. Your theme and font size preferences will not be affected.',
      buttons: [
        {
          text: 'Nevermind.',
          role: 'cancel'
        },
        {
          text: "Yes, clear it.",
          role: 'confirm',
          handler: async () => {
            await clearCachedData()

          },
        },
      ]
    })
  }

  const getThemePreference = async () => {
    const { value } = await Preferences.get({ key: 'theme' });
    if (value == null) {
      return
    }
    return value

  }

  const getFontSizePreference = async () => {
    const { value } = await Preferences.get({ key: 'textzoom' });
    if (value == null) {
      return
    }
    return value

  }


  const [passwordChangePresent, passwordChangeDismiss] = useIonModal(ChangePasswordModal, {
    onDismiss: (data: string, role: string) => passwordChangeDismiss(data, role),
  });

  const [editPushNotificationsPresent, editPushNotificationsDismiss] = useIonModal(EditPushNotifications, {
    onDismiss: () => editPushNotificationsDismiss(),
  });

  const [editHiddenContentPresent, editHiddenContentDismiss] = useIonModal(EditHiddenContentModal, {
    onDismiss: () => editHiddenContentDismiss(),
  });

  const [editChatSettingsPresent, editChatSettingsDismiss] = useIonModal(EditChatSettingsModal, {
    onDismiss: () => editChatSettingsDismiss(),
  });

    const [emailSettingsPresent, editEmailSettingsDismiss] = useIonModal(EmailSettingsModal, {
    onDismiss: () => editEmailSettingsDismiss(),
  });


  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const themePref = await getThemePreference()
        if (cancelled) {
          return;
        }
        setTheme(themePref == 'dark' ? 'dark' : themePref == 'light' ? 'light' : 'auto')
        const textSizePref = await getFontSizePreference()
        if (cancelled) {
          return;
        }
        setFontZoom((textSizePref == 'default' || textSizePref == 'large' || textSizePref == 'xl') ? textSizePref : 'auto')
        const reduceAnimPref = await getReduceAnimations()
        if (cancelled) {
          return;
        }
        setReduceAnimations(reduceAnimPref)
        const { value: chatOrganizerPref } = await Preferences.get({ key: 'chat_organizer' });
        if (cancelled) {
          return;
        }
        setChatOrganizer(chatOrganizerPref !== 'false');
        const { value: chatOrganizerShowHiddenPref } = await Preferences.get({ key: 'chat_organizer_show_hidden' });
        if (cancelled) return;
        setChatOrganizerShowHidden(chatOrganizerShowHiddenPref === 'true');
        // if (isMobile()) {
        //   setRealSettingsPushAllowed(await (window as any).plugins.OneSignal.Notifications.getPermissionAsync())
        // }
        // setPushOptedIn(await (window as any).plugins.OneSignal.User.pushSubscription.getOptedInAsync())
        setLoading(false);
      } catch (error: any) {
        if (cancelled) {
          return;
        }
        setError(error.message);
        setLoading(false)
        console.log(error)
      }

    }

    // const setOptin = async () => {
    //   const onesignalstatus = await OneSignal.User.pushSubscription.getOptedInAsync()
    //   setPushOptedIn(onesignalstatus)
    // }

    fetchData();

    return () => {
      cancelled = true;
    };

    // if (isMobile() && realSettingsPushAllowed) {
    //   setOptin();
    // }
  }, []);

  useEffect(() => {
    if (theme) {

      const setTheme = async () => {
        setThemePref(theme);
      }
      const changeTheme = async () => {
        applyThemeFromPref()
      }
      setTheme();
      changeTheme()
    }

  }, [theme]);

  useEffect(() => {
    if (typeof data?.settings_streak_tracker !== 'boolean') {
      return;
    }

    setStreakTracker((currentValue) =>
      currentValue === data.settings_streak_tracker
        ? currentValue
        : data.settings_streak_tracker
    );
  }, [data?.settings_streak_tracker]);

  useEffect(() => {
    if (streakTracker === null || streakTracker === data?.settings_streak_tracker) {
      return;
    }

    const setToTrue = async () => {
      await updateCurrentUserProfile({ "settings_streak_tracker": true })
      queryClient.invalidateQueries({ queryKey: ['current'] })
    }

    if (streakTracker == false && data?.settings_streak_tracker == true) {
      clearStreakTracker()

    }
    else if (streakTracker == true && !(data?.settings_streak_tracker == true)) {
      setToTrue()
    }


  }, [data?.settings_streak_tracker, queryClient, streakTracker]);


  useEffect(() => {
    if (fontZoom) {

      const setFontSizePreference = async () => {
        setFontSizePref(fontZoom);
      }
      const changeFontSize = async () => {
        setTextZoom()
      }
      setFontSizePreference();
      changeFontSize()
    }

  }, [fontZoom]);


  if (loading) {
    return (
      <IonPage>
        <IonContent>

          <IonRow className="page-title ">
            <img className="color-invertible" src="../static/img/settings-navy.png" alt="settings" />
          </IonRow>


        </IonContent>
      </IonPage>
    )
  }

  return (
    <IonPage>
      <IonContent className="settings ">
        <IonFab className="very-top" slot="fixed" vertical="top" horizontal="start">
          <IonFabButton routerLink="/me" routerDirection="back" color="light" onClick={() => queryClient.invalidateQueries({ queryKey: ['current'] })}>
            <IonIcon icon={chevronBackOutline}></IonIcon>
          </IonFabButton>
        </IonFab>

        <IonRow className="page-title bigger">
          <img className="color-invertible" src="../static/img/settings-navy.png" alt="settings" />
        </IonRow>
        {data ?
          <>
            <IonNote>Pro Settings</IonNote>
            <IonList>
              <IonItem>
                <IonLabel className="ion-text-wrap">New message count</IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_new_message_count": e.detail.checked })}
                  disabled={data?.subscription_level !== "pro"}
                  checked={data?.subscription_level == "pro" && data?.settings_new_message_count}>
                </IonToggle>
              </IonItem>
              {/* <IonItem>
                <IonLabel className="ion-text-wrap">Create group chats</IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_create_groups": e.detail.checked })}
                  disabled={data?.subscription_level !== "pro"}
                  checked={data?.subscription_level == "pro" && data?.settings_create_groups}>
                </IonToggle>
              </IonItem> */}
              <IonItem>
              <IonLabel className="ion-text-wrap"><span className="settings__label-heading">Initiate mode</span>
                  {data?.subscription_level == "pro" ?
                    <p>Only connect with people you Like first</p>
                    : <></>}
                </IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "initiate_mode": e.detail.checked })}
                  disabled={data?.subscription_level !== "pro"}
                  checked={data?.initiate_mode}>
                </IonToggle>
              </IonItem>
              <IonItem>
              <IonLabel className="ion-text-wrap"><span className="settings__label-heading">Show Pro banner</span>
                  {data?.subscription_level == "pro" ?
                    <p>Choose your banner in the Me tab under Profile - The Basics.</p>
                    : <></>}
                </IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_profile_banner_bool": e.detail.checked })}
                  disabled={data?.subscription_level !== "pro"}
                  checked={data?.subscription_level == "pro" && data?.settings_profile_banner_bool}>
                </IonToggle>
              </IonItem>
              <IonItem>
              <IonLabel className="ion-text-wrap"><span className="settings__label-heading">Show Chats Keep-it-going</span></IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_chats_next_reminder": e.detail.checked })}
                  disabled={data?.subscription_level !== "pro"}
                  checked={data?.settings_chats_next_reminder}>
                </IonToggle>
              </IonItem>
            </IonList>

            <IonNote className="ion-text-wrap">Objectionable Content Settings</IonNote>
            <IonItem>
              <IonLabel className="ion-text-wrap">Hide sensitive Community posts</IonLabel>
              <IonToggle slot="end"
                onIonChange={async e => await updateCurrentUserProfile({ "settings_show_sensitive_content": !e.detail.checked })}
                checked={!(data?.settings_show_sensitive_content)}>
              </IonToggle>
            </IonItem>
            <IonItem>
              <IonLabel className="ion-text-wrap">Hidden Content</IonLabel>
              <IonButton slot="end" onClick={() => editHiddenContentPresent()}> Edit </IonButton>
            </IonItem>

            <IonNote className="ion-text-wrap">Communication Settings</IonNote>
            <IonItem>
              <IonLabel className="ion-text-wrap">Push notifications preferences</IonLabel>
              <IonButton slot="end" onClick={() => editPushNotificationsPresent()}> Edit </IonButton>
            </IonItem>
            <IonItem>
              <IonLabel className="ion-text-wrap"><span className="settings__label-heading">Chat organizer</span></IonLabel>
              <IonToggle slot="end"
                onIonChange={async e => {
                  const val = e.detail.checked;
                  setChatOrganizer(val);
                  await Preferences.set({ key: 'chat_organizer', value: String(val) });
                  window.dispatchEvent(new CustomEvent('chat_organizer_changed', { detail: val }));
                }}
                checked={chatOrganizer}
              />
            </IonItem>
            <IonItem>
              <IonLabel className="ion-text-wrap"><span className="settings__label-heading">Show hidden chats in organizer</span></IonLabel>
              <IonToggle slot="end"
                disabled={!chatOrganizer}
                checked={chatOrganizer && chatOrganizerShowHidden}
                onIonChange={async e => {
                  const val = e.detail.checked;
                  setChatOrganizerShowHidden(val);
                  await Preferences.set({ key: 'chat_organizer_show_hidden', value: String(val) });
                  window.dispatchEvent(new CustomEvent('chat_organizer_show_hidden_changed', { detail: val }));
                }}
              />
            </IonItem>
            <IonItem>
              <IonLabel className="ion-text-wrap">Chat preferences</IonLabel>
              <IonButton slot="end" onClick={() => editChatSettingsPresent()}> Edit </IonButton>
            </IonItem>
            <IonItem>
              <IonLabel className="ion-text-wrap">Receive marketing emails</IonLabel>
              <IonToggle slot="end"
                onIonChange={async e => await updateCurrentUserProfile({ "email_marketing": e.detail.checked })}
                checked={data?.email_marketing}
              >
              </IonToggle>
            </IonItem>
            <IonNote className="ion-text-wrap">Profile Actions</IonNote>
            <IonList>
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <span className="settings__label-heading">Connect from Refreshments</span>
                  <p>View Profiles and send / receive Likes from posts and comments in the Refreshments Bar.</p>
                </IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_community_profile": e.detail.checked })}
                  checked={data?.username && data?.settings_community_profile}
                  disabled={(!data?.settings_community_profile && (data?.paused_profile || data?.deactivated_profile))}
                >
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">Create community posts</IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_create_posts": e.detail.checked })}
                  checked={data?.settings_create_posts}>
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap"><span className="settings__label-heading">Track your streak</span>
                  <p>Earned streaks can unlock Pro features.</p></IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => setStreakTracker(e.detail.checked)}
                  checked={streakTracker == true ? true : false}
                >
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap"><span className="settings__label-heading">Show streak increases</span>
                  <p>A little pop-up will tell you every time your streak increases.</p></IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_show_streak_increase": e.detail.checked })}
                  checked={data?.settings_show_streak_increase}
                >
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">Show Image Descriptions</IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_alt_text": e.detail.checked })}
                  checked={data?.settings_alt_text}
                >
                </IonToggle>
              </IonItem>

              <IonItem>
                <IonSelect label="Theme" value={theme ?? 'auto'} onIonChange={(e) => setTheme(e.detail.value)}>
                  <IonSelectOption value="auto">Auto</IonSelectOption>
                  <IonSelectOption value="light">Light</IonSelectOption>
                  <IonSelectOption value="dark">Dark</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonSelect label="Font Size" value={fontZoom ?? 'auto'} onIonChange={(e) => setFontZoom(e.detail.value)}>
                  <IonSelectOption value="auto">Auto</IonSelectOption>
                  <IonSelectOption value="default">Default</IonSelectOption>
                  <IonSelectOption value="large">Large</IonSelectOption>
                  <IonSelectOption value="xl">X-Large</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">Reduce animations</IonLabel>
                <IonToggle slot="end"
                  checked={reduceAnimations}
                  onIonChange={async e => {
                    setReduceAnimations(e.detail.checked);
                    await setReduceAnimationsPref(e.detail.checked);
                  }}
                />
              </IonItem>
              <IonItem>
              <IonLabel className="ion-text-wrap">Change/Add Email</IonLabel>
              <IonButton slot="end" size="default" onClick={() => emailSettingsPresent()}><FontAwesomeIcon icon={faEnvelopes} /></IonButton>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">Change password</IonLabel>
                <IonButton slot="end" size="default" onClick={() => passwordChangePresent()}><FontAwesomeIcon icon={faUnlock} /></IonButton>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">Logout just this device</IonLabel>
                <IonButton slot="end" size="default" onClick={handleLogout}><FontAwesomeIcon icon={faRightFromBracket} /></IonButton>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">Logout on all devices</IonLabel>
                <IonButton slot="end" size="default" onClick={() => handleLogoutAll()}><FontAwesomeIcon icon={faRightFromLine} /></IonButton>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">Clear cache</IonLabel>
                <IonButton size="default" slot="end" onClick={() => clearCacheClicked()}><FontAwesomeIcon icon={faBroomWide} /></IonButton>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">Reload app</IonLabel>
                <IonButton size="default" slot="end" onClick={() => window.location.reload()}><FontAwesomeIcon icon={faRefresh} /></IonButton>
              </IonItem>
              {data?.paused_profile ?
                <IonItem>
                  <IonLabel className="ion-text-wrap">Unpause profile</IonLabel>
                  <IonButton slot="end" size="default" onClick={() => unPauseProfileHandler()}><FontAwesomeIcon icon={faCirclePlay} /></IonButton>
                </IonItem>
                :
                <IonItem>
                  <IonLabel className="ion-text-wrap">Pause profile</IonLabel>
                  <IonButton slot="end" size="default" onClick={() => pauseProfileClicked()}><FontAwesomeIcon icon={faCirclePause} /></IonButton>
                </IonItem>
              }
              {data?.deactivated_profile ?
                <IonItem>
                  <IonLabel className="ion-text-wrap">Reactivate profile</IonLabel>
                  <IonButton slot="end" size="default" onClick={() => reactivateProfileClicked()}><FontAwesomeIcon icon={faSquarePlus} /></IonButton>
                </IonItem>
                :
                <IonItem>
                  <IonLabel className="ion-text-wrap">Deactivate profile</IonLabel>
                  <IonButton slot="end" size="default" onClick={() => deactivateProfileClicked()}><FontAwesomeIcon icon={faSquareMinus} /></IonButton>
                </IonItem>
              }
              <IonItem>
                <IonLabel className="ion-text-wrap">Delete your account</IonLabel>
                <IonButton color="danger" size="default" slot="end" onClick={() => deleteAccountClicked()}><FontAwesomeIcon icon={faTrashCan} /></IonButton>
              </IonItem>
            </IonList>
          </>
          : <></>}
        {settingsStatus?.active && (settingsStatus?.header || settingsStatus?.message) && isBeforeExpiration ?
          <StatusToast isToastOpen={true} setIsToastOpen={setIsToastOpen} header={settingsStatus?.header} message={settingsStatus?.message} />
          : <></>}
      </IonContent>
    </IonPage>
  );

};



export default Settings;
