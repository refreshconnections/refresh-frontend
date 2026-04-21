import { IonContent, RefresherEventDetail, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonFab, IonFabButton, IonIcon, IonRow, IonModal, IonButtons, IonItem, IonLabel, IonList, IonCheckbox, IonInput, IonRefresher, IonRefresherContent, IonFabList, useIonAlert, useIonModal, IonNote, IonCol, IonGrid, IonToggle, useIonActionSheet, IonSelect, IonSelectOption, ToggleCustomEvent, useIonRouter } from '@ionic/react';
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { chevronBackOutline } from 'ionicons/icons';
import OneSignal from 'onesignal-cordova-plugin';


import "./Page.css"
import "./Settings.css"

import { updateCurrentUserProfile, logoutAll, logoutCurrent, applyThemeFromPref, setThemePref, isMobile, setFontSizePref, setTextZoom, clearStreak, removeAllProfilesFromCapacitorStorage, getReduceAnimations, setReduceAnimationsPref, isCommunityPlus, updateCurrentUserChatSettings } from '../hooks/utilities';


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
import EditPushNotifications from '../components/EditPushNotifications';
import { clearTransientAppStorage } from '../hooks/capacitorPreferences/all';
import { faBroomWide, faEnvelope, faEnvelopeCircleCheck } from '@fortawesome/pro-solid-svg-icons';
import { faCirclePlus } from '@fortawesome/pro-solid-svg-icons/faCirclePlus';
import EmailSettingsModal from '../components/EmailSettingsModal';
import { faEnvelopes } from '@fortawesome/pro-regular-svg-icons';
import {
  getShowInterestedCountPref,
  setShowInterestedCountPref,
  SHOW_INTERESTED_COUNT_CHANGED_EVENT,
  getHideInterestedCountOnMySubmissionsPref,
  setHideInterestedCountOnMySubmissionsPref,
  HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_CHANGED_EVENT,
} from '../hooks/capacitorPreferences/interested-counts';
import {
  getShowEventsThisWeekRowPref,
  setShowEventsThisWeekRowPref,
  SHOW_EVENTS_THIS_WEEK_ROW_CHANGED_EVENT,
} from '../hooks/capacitorPreferences/events-this-week-row';
import { useChatSettings } from '../hooks/api/chats/chat-settings';
import SettingsSupportCard from '../components/SettingsSupportCard';





const Settings: React.FC = () => {
  const router = useIonRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [theme, setTheme] = useState<'auto' | 'light' | 'dark' | null>(null);
  const [fontZoom, setFontZoom] = useState<'auto' | 'default' | 'large' | 'xl' | null>(null);
  const [reduceAnimations, setReduceAnimations] = useState<boolean>(false);
  const [chatOrganizer, setChatOrganizer] = useState<boolean>(true);
  const [chatOrganizerShowHidden, setChatOrganizerShowHidden] = useState<boolean>(false);
  const [allowImagesGlobal, setAllowImagesGlobal] = useState<boolean>(false);
  const [allowAudioGlobal, setAllowAudioGlobal] = useState<boolean>(false);
  const [conversationStarter, setConversationStarter] = useState<boolean>(false);
  const [showInterestedCount, setShowInterestedCount] = useState<boolean>(true);
  const [hideInterestedCountOnMySubmissions, setHideInterestedCountOnMySubmissions] = useState<boolean>(false);
  const [showEventsThisWeekRow, setShowEventsThisWeekRow] = useState<boolean>(true);

  const queryClient = useQueryClient()
  const data = useGetCurrentProfile().data
  const [streakTracker, setStreakTracker] = useState<boolean | null>(
    typeof data?.settings_streak_tracker === 'boolean' ? data.settings_streak_tracker : null
  );
  const moderation = useGetCurrentModeration().data;
  const currentChatSettings = useChatSettings().data;


  const [isToastOpen, setIsToastOpen] = useState<boolean>(false)

  const conversationPrompts = [
    "If you could live anywhere, real or fictional, where would you live?",
    "What's a random fun fact about you?",
    "What food combo do you secretly, or not so secretly, love?",
    "What's the last TV show you binged?",
    "When was the last time you saw someone else wearing a mask in public?",
    "If you had to give a 45 minute lecture right now on any one topic, what would that topic be?",
    "What three words would best describe your day?",
    "What's an underrated book in your opinion?",
    "When do you feel the most connected to other people?",
    "What's a question you wish people asked you more often?",
    "What's something that fascinates you even if you don't fully understand it?",
    "What's the last thing you did just for fun?"
  ];

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

  const isProUser = data?.subscription_level === 'pro';
  const canShowInterestedCounts = isCommunityPlus(data?.subscription_level);
  const [presentPremiumUpsellAlert] = useIonAlert();

  const openPremiumUpsellAlert = () => {
    presentPremiumUpsellAlert({
      header: 'Get Pro!',
      buttons: [
        {
          text: 'Back',
          role: 'cancel',
        },
        {
          text: 'Store',
          handler: () => {
            router.push('/store');
          },
        },
      ],
    });
  };

  const PremiumLabel = ({ children, available }: { children: React.ReactNode; available: boolean }) => (
    <span className="settings__label-heading settings__label-heading--premium">
      <span>{children}</span>
      {available ? (
        <span className="settings__premium-icon-button" aria-hidden="true">
          <FontAwesomeIcon className="settings__premium-icon" icon={faCirclePlus} aria-hidden="true" />
        </span>
      ) : (
        <button
          type="button"
          className="settings__premium-icon-button"
          aria-label="See plans"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            openPremiumUpsellAlert();
          }}
        >
          <FontAwesomeIcon className="settings__premium-icon" icon={faCirclePlus} aria-hidden="true" />
        </button>
      )}
    </span>
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
    await clearTransientAppStorage()
    await removeAllProfilesFromCapacitorStorage()
    queryClient.clear()
  };

  async function reloadApp() {
    await clearCachedData();
    window.location.reload();
  }

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
      message: 'This will temporarily slow the loading of your app. Your local preferences and filters will stay the same.',
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
        setShowInterestedCount(await getShowInterestedCountPref());
        if (cancelled) return;
        setHideInterestedCountOnMySubmissions(await getHideInterestedCountOnMySubmissionsPref());
        if (cancelled) return;
        setShowEventsThisWeekRow(await getShowEventsThisWeekRowPref());
        if (cancelled) return;
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
    setAllowImagesGlobal(Boolean(currentChatSettings?.allow_images_global));
  }, [currentChatSettings?.allow_images_global]);

  useEffect(() => {
    setAllowAudioGlobal(Boolean(currentChatSettings?.allow_audio_global));
  }, [currentChatSettings?.allow_audio_global]);

  useEffect(() => {
    setConversationStarter(Boolean(currentChatSettings?.conversation_starter));
  }, [currentChatSettings?.conversation_starter]);

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
        {data && (
          <>
            <SettingsSupportCard isProUser={isProUser} onPremiumIconClick={openPremiumUpsellAlert} />
            <IonList>
              <IonNote className="ion-text-wrap">Refreshments Community</IonNote>
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <span className="settings__label-heading">Connect from Refreshments</span>
                  <p>View profiles and send or receive Likes from Refreshments Bar posts, comments, and Refreshments Calendar events.</p>
                </IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_community_profile": e.detail.checked })}
                  checked={data?.username && data?.settings_community_profile}
                  disabled={(!data?.settings_community_profile && (data?.paused_profile || data?.deactivated_profile))}
                >
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <span className="settings__label-heading">Create Community Posts</span>
                  <p>Start conversations in the Refreshments Bar by creating your own posts.</p>
                </IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_create_posts": e.detail.checked })}
                  checked={data?.settings_create_posts}>
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <PremiumLabel available={canShowInterestedCounts}>Show Interested Counts Everywhere</PremiumLabel>
                  <p>See how many members are interested in posts and calendar events across the app.</p>
                </IonLabel>
                <IonToggle
                  slot="end"
                  onIonChange={async e => {
                    const val = e.detail.checked;
                    setShowInterestedCount(val);
                    await setShowInterestedCountPref(val);
                    window.dispatchEvent(new CustomEvent(SHOW_INTERESTED_COUNT_CHANGED_EVENT, { detail: val }));
                  }}
                  disabled={!canShowInterestedCounts}
                  checked={canShowInterestedCounts && showInterestedCount}
                />
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <span className="settings__label-heading">Show Interested Counts on My Submissions</span>
                  <p>Show interested counts next to posts and calendar events you submitted.</p>
                </IonLabel>
                <IonToggle
                  slot="end"
                  checked={!hideInterestedCountOnMySubmissions}
                  onIonChange={async e => {
                    const hideValue = !e.detail.checked;
                    setHideInterestedCountOnMySubmissions(hideValue);
                    await setHideInterestedCountOnMySubmissionsPref(hideValue);
                    window.dispatchEvent(new CustomEvent(HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_CHANGED_EVENT, { detail: hideValue }));
                  }}
                />
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <span className="settings__label-heading">Show Events This Week Row</span>
                  <p>Keep this week’s events easy to spot above the full community events list.</p>
                </IonLabel>
                <IonToggle
                  slot="end"
                  checked={showEventsThisWeekRow}
                  onIonChange={async e => {
                    const val = e.detail.checked;
                    setShowEventsThisWeekRow(val);
                    await setShowEventsThisWeekRowPref(val);
                    window.dispatchEvent(new CustomEvent(SHOW_EVENTS_THIS_WEEK_ROW_CHANGED_EVENT, { detail: val }));
                  }}
                />
              </IonItem>

              <IonNote className="ion-text-wrap">Chats</IonNote>
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <PremiumLabel available={isProUser}>Show Exact Unread Message Counts</PremiumLabel>
                  <p>See exact unread counts on your chats.</p>
                </IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_new_message_count": e.detail.checked })}
                  disabled={!isProUser}
                  checked={isProUser && data?.settings_new_message_count}>
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap"><span className="settings__label-heading">Show Chat Organizer</span>
                  <p>Organize your chats into sections like Local and Hidden. Personal+ and Pro add editable custom sections.</p>
                </IonLabel>
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
                <IonLabel className="ion-text-wrap">
                  <span className="settings__label-heading">Show Hidden Chats in Organizer</span>
                  <p>Include your Hidden tab in the organizer.</p>
                </IonLabel>
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
                <IonLabel className="ion-text-wrap">
                  <span className="settings__label-heading">Receive Images</span>
                  <p>Allow other members to send you images in Chats.</p>
                </IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => {
                    const checked = e.detail.checked;
                    setAllowImagesGlobal(checked);
                    await updateCurrentUserChatSettings({ allow_images_global: checked });
                  }}
                  checked={allowImagesGlobal}>
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <span className="settings__label-heading">Receive Audio Messages</span>
                  <p>Allow other members to send you audio messages in Chats.</p>
                </IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => {
                    const checked = e.detail.checked;
                    setAllowAudioGlobal(checked);
                    await updateCurrentUserChatSettings({ allow_audio_global: checked });
                  }}
                  checked={allowAudioGlobal}>
                </IonToggle>
              </IonItem>
              <IonItem lines={conversationStarter ? 'none' : 'full'}>
                <IonLabel className="ion-text-wrap">
                  <span className="settings__label-heading">Show Conversation Starter</span>
                  <p>When a new chat hasn’t started yet, show a prompt to help get the conversation going.</p>
                </IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => {
                    const checked = e.detail.checked;
                    setConversationStarter(checked);
                    await updateCurrentUserChatSettings({ conversation_starter: checked });
                  }}
                  checked={conversationStarter}>
                </IonToggle>
              </IonItem>
              <IonItem
                className={`with-select settings__conversation-starter-select${conversationStarter ? '' : ' settings__conversation-starter-select--hidden'}`}
                aria-hidden={!conversationStarter}
              >
                <IonLabel className="ion-text-wrap settings__conversation-starter-field">
                  <span className="settings__label-heading">Conversation Starter Prompt</span>
                  <IonSelect
                    value={currentChatSettings?.conversation_starter_text ?? null}
                    placeholder="Choose a prompt"
                    onIonChange={async e => {
                      await updateCurrentUserChatSettings({ conversation_starter_text: e.detail.value });
                    }}
                    interface="alert"
                    disabled={!conversationStarter}
                  >
                    {conversationPrompts.map((prompt, index) => (
                      <IonSelectOption key={index} value={prompt}>
                        {prompt}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <PremiumLabel available={isProUser}>Show Keep It Going Reminder</PremiumLabel>
                  <p>Show a gentle reminder when a chat could use a follow-up.</p>
                </IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_chats_next_reminder": e.detail.checked })}
                  disabled={!isProUser}
                  checked={isProUser && data?.settings_chats_next_reminder}>
                </IonToggle>
              </IonItem>

              <IonNote className="ion-text-wrap">Discovery</IonNote>
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <PremiumLabel available={isProUser}>Initiate Mode</PremiumLabel>
                  <p>Only appear to members whose profiles you Like first.</p>
                </IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "initiate_mode": e.detail.checked })}
                  disabled={!isProUser}
                  checked={isProUser && data?.initiate_mode}>
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <PremiumLabel available={isProUser}>Show Pro Banner</PremiumLabel>
                  <p>Display your Pro banner on your profile while other members browse in Discovery.</p>
                </IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_profile_banner_bool": e.detail.checked })}
                  disabled={!isProUser}
                  checked={isProUser && data?.settings_profile_banner_bool}>
                </IonToggle>
              </IonItem>

              <IonNote className="ion-text-wrap">Sensitive Content Preferences</IonNote>
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <span className="settings__label-heading">Hide Sensitive Community Posts</span>
                  <p>Hide posts marked sensitive in the Refreshments Community unless you choose to view them.</p>
                </IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_show_sensitive_content": !e.detail.checked })}
                  checked={!(data?.settings_show_sensitive_content)}>
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <span className="settings__label-heading">Hidden Content and Blocks</span>
                  <p>View and manage hidden chats, hidden posts, and blocked members.</p>
                </IonLabel>
                <IonButton slot="end" onClick={() => editHiddenContentPresent()}> Edit </IonButton>
              </IonItem>

              <IonNote className="ion-text-wrap">App Preferences</IonNote>
              <IonItem>
                <IonLabel className="ion-text-wrap"><span className="settings__label-heading">Track Your Streak</span>
                  <p>Show your activity streak. Some streak milestones can unlock Pro features.</p></IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => setStreakTracker(e.detail.checked)}
                  checked={streakTracker == true ? true : false}>
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap"><span className="settings__label-heading">Show Streak Increases</span>
                  <p>Get a little pop-up when your streak goes up.</p></IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_show_streak_increase": e.detail.checked })}
                  checked={data?.settings_show_streak_increase}>
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <span className="settings__label-heading">Show Image Descriptions</span>
                  <p>Show text descriptions for images when available.</p>
                </IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "settings_alt_text": e.detail.checked })}
                  checked={data?.settings_alt_text}
                >
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">
                  <span className="settings__label-heading">Reduce Animations</span>
                  <p>Reduce motion throughout the app.</p>
                </IonLabel>
                <IonToggle slot="end"
                  checked={reduceAnimations}
                  onIonChange={async e => {
                    const val = e.detail.checked;
                    setReduceAnimations(val);
                    await setReduceAnimationsPref(val);
                    window.dispatchEvent(new CustomEvent('reduce_animations_changed', { detail: val }));
                  }}
                />
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
                <IonLabel className="ion-text-wrap">Push Notification Preferences</IonLabel>
                <IonButton slot="end" onClick={() => editPushNotificationsPresent()}> Edit </IonButton>
              </IonItem>

              <IonNote className="ion-text-wrap">Profile Actions</IonNote>
              {data?.paused_profile ?
                <IonItem>
                  <IonLabel className="ion-text-wrap">Unpause profile</IonLabel>
                  <IonButton slot="end" size="default" onClick={() => unPauseProfileHandler()}><FontAwesomeIcon icon={faCirclePlay} /></IonButton>
                </IonItem>
                :
                <IonItem>
                  <IonLabel className="ion-text-wrap">
                    <span className="settings__label-heading">Pause Profile</span>
                    <p>Stop showing your profile in Discovery while keeping existing chats and community participation.</p>
                  </IonLabel>
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
                  <IonLabel className="ion-text-wrap">
                    <span className="settings__label-heading">Deactivate Profile</span>
                    <p>Hide your profile and pause discovery, messaging, posting, and commenting until you reactivate. You can still read Refreshments posts and view the calendar.</p>
                  </IonLabel>
                  <IonButton slot="end" size="default" onClick={() => deactivateProfileClicked()}><FontAwesomeIcon icon={faSquareMinus} /></IonButton>
                </IonItem>
              }

              <IonNote className="ion-text-wrap">Account</IonNote>
              <IonItem>
                <IonLabel className="ion-text-wrap">Receive Marketing Emails</IonLabel>
                <IonToggle slot="end"
                  onIonChange={async e => await updateCurrentUserProfile({ "email_marketing": e.detail.checked })}
                  checked={data?.email_marketing}
                >
                </IonToggle>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">Add or Change Email</IonLabel>
                <IonButton slot="end" size="default" onClick={() => emailSettingsPresent()}><FontAwesomeIcon icon={faEnvelopes} /></IonButton>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">Change Password</IonLabel>
                <IonButton slot="end" size="default" onClick={() => passwordChangePresent()}><FontAwesomeIcon icon={faUnlock} /></IonButton>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">Log Out of This Device</IonLabel>
                <IonButton slot="end" size="default" onClick={handleLogout}><FontAwesomeIcon icon={faRightFromBracket} /></IonButton>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">Log Out of All Devices</IonLabel>
                <IonButton slot="end" size="default" onClick={() => handleLogoutAll()}><FontAwesomeIcon icon={faRightFromLine} /></IonButton>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">Clear Cached Data</IonLabel>
                <IonButton size="default" slot="end" onClick={() => clearCacheClicked()}><FontAwesomeIcon icon={faBroomWide} /></IonButton>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">Reload App</IonLabel>
                <IonButton size="default" slot="end" onClick={() => reloadApp()}><FontAwesomeIcon icon={faRefresh} /></IonButton>
              </IonItem>
              <IonItem>
                <IonLabel className="ion-text-wrap">Delete Account</IonLabel>
                <IonButton color="danger" size="default" slot="end" onClick={() => deleteAccountClicked()}><FontAwesomeIcon icon={faTrashCan} /></IonButton>
              </IonItem>
            </IonList>
          </>
        )}
        {settingsStatus?.active && (settingsStatus?.header || settingsStatus?.message) && isBeforeExpiration ?
          <StatusToast isToastOpen={true} setIsToastOpen={setIsToastOpen} header={settingsStatus?.header} message={settingsStatus?.message} />
          : <></>}
      </IonContent>
    </IonPage>
  );

};



export default Settings;
