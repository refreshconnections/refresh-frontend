
import {
  IonAlert,
  IonApp,
  IonBadge,
  IonContent,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonRow,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonToast,
  setupIonicReact
} from '@ionic/react';
import { star, flowerOutline as flowerIcon, heartOutline as heartIcon, personOutline as personIcon, chatbubblesOutline as chatbubble, cafeOutline as cafe, flashOutline as flash } from 'ionicons/icons';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Route, Redirect } from 'react-router-dom';
import Likes from '../pages/Likes';
import Me from '../pages/Me';
import Login from './Login';
import Profile from '../pages/Profile';
import Community from '../pages/Community';
import Onboarding from '../pages/Onboarding';
import Store from '../pages/Store';
import Settings from '../pages/Settings';
import Help from '../pages/Help';
import Tutorial from '../pages/Tutorial';

import { IonReactRouter } from '@ionic/react-router';
import { Preferences } from '@capacitor/preferences';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

import './App.css';
import 'react-photo-view/dist/react-photo-view.css';


// import Layout from "./containers/Base/Layout";
// import Routes from "./Routes";
// import "react-toastify/dist/ReactToastify.css";
/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import OneSignal from 'onesignal-cordova-plugin';

/* Theme variables */
import '../theme/variables.css';
import { isMobile, updateCurrentUserProfile, handleLogoutCommon, setColorTheme, getBadgeCount, setTextZoom, checkForBrokenStreak, isStagingEnvironment, linkInstall } from '../hooks/utilities';
import { ChatBadgeContext } from './ChatBadgeContext';
import FAQs from '../pages/FAQs';
import Tips from '../pages/Tips';
import Construction from '../pages/Construction';
import Chats from '../pages/Chats';
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import LoadingCard from './LoadingCard';
import Refreshments from '../pages/Refreshments';
import OpenedPost from './RefreshmentsPosts/OpenedPost';
import { useGetCurrentUserChats } from '../hooks/api/chats/current-user-chats';
import { getProfileDetailsFn } from '../hooks/api/profiles/details';
import { getLimitsFn, useGetLimits } from '../hooks/api/profiles/current-limits';
import Change from '../pages/Change';
import EmailBuilderDetails from './Change/EmailBuilder/EmailBuilderDetails';
import OtherDetails from './Change/Other/OtherDetails';

import {
  Purchases,
  PurchasesOfferings, // Types for TypeScript
} from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from "@capacitor/app";
import { Device } from '@capacitor/device';
import Activity from '../pages/Activity';
import { useGetCurrentStreak } from '../hooks/api/profiles/current-streak';
import moment from 'moment';
import { useGetUnreadCount } from '../hooks/api/chats/unread-count';
import { useGetMinimumVersion } from '../hooks/api/minimum-version';
import VersionUpdateRequired from '../pages/VersionUpdateRequired';
import { useChatSettings } from '../hooks/api/chats/chat-settings';
import { SplashScreen } from '@capacitor/splash-screen';
import { useGetGlobalAppCurrentProfile } from '../hooks/api/profiles/global-app-current-profile';
import { useGetSettingsCurrentProfile } from '../hooks/api/profiles/settings-current-profile';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { removeFromCapacitorLocalStorage } from '../hooks/capacitorPreferences/all';
import { useMultipleAccountsCheck } from '../hooks/api/profiles/multiple_accounts_check';
import MultipleAccountsDetected from '../pages/MultipleAccountsDetected';
import { IconPop } from './IconPop';
import Picksv2 from '../pages/Picksv2';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';






setupIonicReact();

// For PWA Camera 
defineCustomElements(window);

function OneSignalInit(): void {
  // Uncomment to set OneSignal device logging to VERBOSE  
  // OneSignal.Debug.setLogLevel(6);

  // Uncomment to set OneSignal visual logging to VERBOSE  
  // OneSignal.Debug.setAlertLevel(6);

  // NOTE: Update the init value below with your OneSignal AppId.

  if (isStagingEnvironment()) {
    OneSignal.initialize("e1c18b6d-e523-4515-9a93-b9b76666a831");
  }
  else {
    OneSignal.initialize("79f28778-f43e-4537-951c-9172fee69e2f");
  }

  let myClickListener = async function (event: any) {
    let notificationData = JSON.stringify(event);
    console.log("notification", notificationData)
  };


  OneSignal.Notifications.addEventListener("click", myClickListener);


  // Prompts the user for notification permissions.
  //    * Since this shows a generic native prompt, we recommend instead using an In-App Message to prompt for notification permission (See step 7) to better communicate to your users what notifications they will get.
  OneSignal.Notifications.requestPermission(false).then((accepted: boolean) => {
    console.log("User accepted notifications: " + accepted);
  });

}

if (isMobile()) {
  console.log("Is mobile!")
  OneSignalInit();
}

const App: React.FC = () => {

  // Version 3: July 6 2025
  const currentVersion: number = 3

  const [loading, setLoading] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);

  const [maintenance, setMaintenance] = useState(false);
  const [loggedin, setLoggedin] = useState(false);
  const [inAppPurchasesReady, setInAppPurchasesReady] = useState(false);

  const [showIssueAlert, setShowIssueAlert] = useState(false);
  const [showOnboard, setShowOnboard] = useState(false);
  const [showRequireVersionUpdate, setShowRequireVersionUpdate] = useState(false);
  const [multipleAccountsDetected, setShowMultipleAccountsDetected] = useState(false);
  const [linkInstallComplete, setLinkInstallComplete] = useState(false);



  const { chatBadgeCount, setChatBadgeCount } = useContext(ChatBadgeContext);

  const queryClient = useQueryClient()
  const { data: globalCurrentProfile, isLoading: globalIsLoading } = useGetGlobalAppCurrentProfile();
  const { data: settingsCurrentProfile, isLoading: settingsIsLoading } = useGetSettingsCurrentProfile();



  const hasMultipleAccounts = useMultipleAccountsCheck(linkInstallComplete).data;

  const currentStreak = useGetCurrentStreak().data;
  const unreadBadgeCount = useGetUnreadCount().data;
  // go ahead and fetch chats
  const { data: chats, refetch: refetchChats } = useGetCurrentUserChats();
  const minVersion = useGetMinimumVersion()

  //Get rid of this later 
  const currentUserProfile = useGetCurrentProfile().data;
  const current_settings = useChatSettings().data;

  function isSamsung() {
    const ua = navigator.userAgent || '';
    return /SM-[A-Z0-9]+|samsung|oneui/i.test(ua);
  }

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android' || !isSamsung()) return;

    const showListener = Keyboard.addListener('keyboardWillShow', info => {
      const offset = `${info.keyboardHeight}px`;
      document.body.classList.add('samsung-keyboard-opend');
      document.documentElement.style.setProperty('--keyboard-offset', offset);
    });

    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('samsung-keyboard-opend');
      document.documentElement.style.setProperty('--keyboard-offset', '0px');
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);




  // const paths = ['/community', '/change', '/chats', '/picks', '/me', '/profile']

  const checkOnboarded = async () => {

    console.log("Gotta check if the user is onboarded")
    const { value } = await Preferences.get({ key: 'ONBOARDED' });

    if (value == "false") {
      console.log(`User has not yet onboarded! Redirecting.`);
      setShowOnboard(true)
    }
    else {
      try {
        console.log("Current USER PROFILE", globalCurrentProfile)
        if (globalCurrentProfile?.created_profile == false) {
          setShowOnboard(true)
        }


      }
      catch (e) {
        console.log("I don't know what to do.", e)

        console.log(e)
        console.log("hmmmm", (e as any).response)
        if ((e as any).response["status"] !== 503) {
          console.log("shouldn't but did")
          setShowIssueAlert(true)
        }
        else {
          setMaintenance(true)
        }
      }

    }
  }

  useEffect(() => {

    const foregroundDisplay = (event: any) => {

      event.preventDefault();

      console.log("event", event?.notification)

      if ("additionalData" in event?.notification && !!event.notification?.additionalData && "invalidate_key" in event.notification?.additionalData) {
        queryClient.invalidateQueries({ queryKey: event.notification.additionalData['invalidate_key'] })
      }
      else if (event?.notification?.title?.includes("sent you a message")) {
        queryClient.invalidateQueries({ queryKey: ['unread'] })
      }
      event.notification.display();
    };


    const listen = async () => {
      CapApp.addListener('resume', async () => {
        await setColorTheme()
        await setTextZoom()
        if (settingsCurrentProfile?.settings_streak_tracker) {
          await checkForBrokenStreak()
        }
      })
    }
    listen();

    if (isMobile()) {
      console.log("foreground handler")
      OneSignal.Notifications.addEventListener("foregroundWillDisplay", foregroundDisplay);
    }


  }, [])

  useEffect(() => {

    if (currentVersion < minVersion?.data?.minimum_version) {
      setShowRequireVersionUpdate(true)
    }

  }, [minVersion])

  useEffect(() => {
    console.log("*** the useeffect");

    if (globalCurrentProfile) {
      if (!globalCurrentProfile.created_profile && hasMultipleAccounts) {
        setShowMultipleAccountsDetected(true);
      } else {
        // If they *have* finished onboarding, never show multiple accounts warning
        setShowMultipleAccountsDetected(false);
      }
    }

  }, [hasMultipleAccounts, globalCurrentProfile]);


  useEffect(() => {


    const prefetchOngoingChatProfiles = () => {
      console.log("chats", chats)
      chats?.slice(0, 5)?.map((c: { other_user_id: any; }) => {
        queryClient.prefetchQuery({ queryKey: ['profiles', 'detail', parseInt(c.other_user_id)], queryFn: getProfileDetailsFn });
      })
    }

    if (chats) {
      prefetchOngoingChatProfiles();
    }

    const badgeCount = async () => {
      if (unreadBadgeCount) {
        setChatBadgeCount(unreadBadgeCount?.unread)
        if (unreadBadgeCount > 0) {
          console.log("unread count more than one so refetching chats")
          await removeFromCapacitorLocalStorage('chats')
          refetchChats()
        }
      }
    }

    badgeCount()




  }, [chats, unreadBadgeCount])


  const updatedInTheLast20Seconds = () => {
    return moment().diff(currentStreak?.last_updated, 'seconds') < 20
  }


  useEffect(() => {

    if (settingsCurrentProfile?.settings_streak_tracker && settingsCurrentProfile?.settings_show_streak_increase && currentStreak?.streak_count > 0 && updatedInTheLast20Seconds()) {
      setStreakOpen(true)
    }
  }, [currentStreak?.streak_count])


  useEffect(() => {


    if (!(isMobile() || window.location.href.includes('localhost') || window.location.href.includes("/forgot_password_reset") || window.location.href.includes("/account/amazingpassword_reset"))) {
      window.location.href = "https://refreshconnections.com"
    }

    const checkLoggedIn = async () => {

      await setColorTheme()
      await setTextZoom()
      if (localStorage.getItem('token') == null) {
        setLoggedin(false)
      }
      else {
        const { value } = await Preferences.get({ key: 'EXPIRY' });
        if (value == null) {
          setLoggedin(false)
        }
        else {
          const expiredTime = new Date(value)
          const nowTime = new Date()
          if (expiredTime < nowTime) {
            setLoggedin(false)
          }
          else {
            setLoggedin(true)
            await checkForBrokenStreak()

          }

        }
      };

      await SplashScreen.hide();
    }

    checkLoggedIn()



  }, []);



  useEffect(() => {

    setLoading(true)

    if (loggedin && !window.location.pathname.includes('/construction')) {
      checkOnboarded()
      queryClient.prefetchQuery({ queryKey: ['limits'], queryFn: getLimitsFn });

    }

    setLoading(false)


  }, [loggedin, globalCurrentProfile?.created_profile]);

  useEffect(() => {

    const inAppPurchases = async () => {


      try {

        if (Capacitor.getPlatform() === 'ios') {
          await Purchases.configure({ apiKey: 'appl_ElcylJHncTZAjnkhaCHUiMGJLfh', appUserID: globalCurrentProfile?.uuid });
        } else if (Capacitor.getPlatform() === 'android') {
          await Purchases.configure({ apiKey: 'goog_pxoiyldGzmbIemSEGKXmBIcGsQG', appUserID: globalCurrentProfile?.uuid });
        }

        const installId = await Device.getId();
        console.log("installID", installId)
        if (installId?.identifier) {
          await linkInstall(installId?.identifier)
          setLinkInstallComplete(true);
        }

      } catch (e) {
        // initialization error
      }
    }



    if (isMobile() && globalCurrentProfile) {
      console.log("Is mobile and current user profile", globalCurrentProfile)

      inAppPurchases();
      setInAppPurchasesReady(true)
    }

    else {
      console.log("Is mobile and no current user profile yet so no purchases situation ", globalCurrentProfile)
    }



  }, [globalCurrentProfile?.uuid])


  useEffect(() => {

    const checkSubscriptionStatus = async () => {

      try {
        const revenueCatCustomerInfo = (await Purchases.getCustomerInfo()).customerInfo
        if (!revenueCatCustomerInfo.entitlements.active.isEmpty) {

          if ("pro" in revenueCatCustomerInfo.entitlements.active) {
            await updateCurrentUserProfile({ "subscription_level": "pro" })
            await updateCurrentUserProfile({ "subscription_source": "RevenueCat" })
            queryClient.invalidateQueries({ queryKey: ['current'] })
          }
          else if ("communityplus" in revenueCatCustomerInfo.entitlements.active) {
            await updateCurrentUserProfile({ "subscription_level": "communityplus", "subscription_source": "RevenueCat" })
          }
          else if ("personalplus" in revenueCatCustomerInfo.entitlements.active) {
            await updateCurrentUserProfile({ "subscription_level": "personalplus", "subscription_source": "RevenueCat" })
          }
          else {
            await updateCurrentUserProfile({ "subscription_level": "none" })
            await updateCurrentUserProfile({ "subscription_source": "RevenueCat - none" })
            queryClient.invalidateQueries({ queryKey: ['current'] })
          }
        }
        queryClient.invalidateQueries({ queryKey: ['global-current'] })

      } catch (e) {
        // initialization error
        console.log("revenueCat error", e)
      }

      const checkSubscriptionLevelOverride = async () => {
        if (globalCurrentProfile?.subscription_override !== "none" && globalCurrentProfile?.subscription_override_expiration && new Date() < new Date(globalCurrentProfile?.subscription_override_expiration)) {
          await updateCurrentUserProfile({ "subscription_level": globalCurrentProfile?.subscription_override })
          await updateCurrentUserProfile({ "subscription_source": "override" })
          queryClient.invalidateQueries({ queryKey: ['global-current'] })
        }

      }

      if (globalCurrentProfile?.subscription_override !== "none") {
        await checkSubscriptionLevelOverride()
      }


    }

    if (inAppPurchasesReady && globalCurrentProfile?.uuid) {
      checkSubscriptionStatus()
    }

  }, [inAppPurchasesReady, globalCurrentProfile?.uuid])

  if (loading) {
    return (
      <IonApp>
        <IonContent>
          <LoadingCard />
        </IonContent>
      </IonApp>
    )
  }
  if (window.location.pathname.includes('/construction')) {
    return <Construction />
  }
  if (showRequireVersionUpdate) {
    return <IonApp><VersionUpdateRequired /></IonApp>
  }
  if (!loggedin) {
    return <IonApp><Login setLoggedin={setLoggedin} /></IonApp>
  }
  if (multipleAccountsDetected) {
    return <IonApp><MultipleAccountsDetected /></IonApp>
  }
  if (showOnboard) {
    return <IonApp><Onboarding /></IonApp>
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route path="/picks">
              <Picksv2 />
            </Route>
            <Route path="/likes">
              <Likes />
            </Route>
            <Route path="/chats">
              <Chats />
            </Route>
            <Route path="/communityold">
              <Community />
            </Route>
            <Route exact path="/community">
              <Refreshments />
            </Route>
            <Route path="/community/:id">
              <OpenedPost />
            </Route>
            <Route path="/me">
              <Me />
            </Route>
            <Route path="/profile">
              <Profile />
            </Route>
            <Route path="/store">
              <Store />
            </Route>
            <Route path="/settings">
              <Settings />
            </Route>
            <Route path="/help">
              <Help />
            </Route>
            <Route path="/tutorial">
              <Tutorial />
            </Route>
            <Route path="/faqs">
              <FAQs />
            </Route>
            <Route path="/tips">
              <Tips />
            </Route>
            <Route path="/construction">
              <Construction />
            </Route>
            <Route exact path="/change">
              <Change />
            </Route>
            <Route path="/change/emailbuilder/:id">
              <EmailBuilderDetails />
            </Route>
            <Route path="/change/other/:id">
              <OtherDetails />
            </Route>
            <Route path="/activity">
              <Activity />
            </Route>
            <Redirect exact from="/" to="/community" />
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="picks" href="/picks">
              <IonIcon icon={flowerIcon} />
              <IonLabel>Picks</IonLabel>
            </IonTabButton>
            <IonTabButton tab="chat" href="/chats">
              {chatBadgeCount > 0 ?
                <IonBadge color="danger">{chatBadgeCount}</IonBadge>
                : <></>}
              <IonIcon icon={chatbubble} />
              <IonLabel>Chats</IonLabel>
            </IonTabButton>
            <IonTabButton tab="community" href="/community">
              <IonIcon icon={cafe} />
              <IonLabel>Refreshments</IonLabel>
            </IonTabButton>
            <IonTabButton tab="change" href="/change">
              <IonIcon icon={flash} />
              <IonLabel>Change</IonLabel>
            </IonTabButton>
            <IonTabButton tab="person" href="/me">
              <IonIcon icon={personIcon} />
              <IonLabel>Me</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
      <IonAlert
        isOpen={showIssueAlert}
        header="Oops! Something happened. Try again later."
        onDidDismiss={() => handleLogoutCommon()}
        buttons={['Ok']}
      />
      <IonToast
        isOpen={streakOpen}
        message={`Streak increase! ${currentStreak?.streak_count}`}
        onDidDismiss={() => setStreakOpen(false)}
        duration={3000}
        cssClass={"streak-toast"}
        position="top"
      ></IonToast>

      <IconPop trigger={streakOpen} position="top-right" />
    </IonApp>
  );
};

export default App;

