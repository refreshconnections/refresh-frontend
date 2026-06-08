
import {
  IonAlert,
  IonApp,
  IonBadge,
  IonCard,
  IonCardContent,
  IonContent,
  IonButton,
  IonIcon,
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonRow,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonToast,
  setupIonicReact
} from '@ionic/react';
import { star, flowerOutline as flowerIcon, heartOutline as heartIcon, personOutline as personIcon, chatbubblesOutline as chatbubble, cafeOutline as cafe, starOutline } from 'ionicons/icons';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Route, Redirect, useParams, useLocation } from 'react-router-dom';
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
import { Browser } from '@capacitor/browser';
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
import { isMobile, updateCurrentUserProfile, handleLogoutCommon, applyThemeFromPref, getBadgeCount, setTextZoom, checkForBrokenStreak, recoverStreak, isStagingEnvironment, linkInstall, CURRENT_APP_VERSION, getReduceAnimations } from '../hooks/utilities';
import { STREAK_BREAK_POPUPS_ENABLED_KEY } from '../hooks/streakPreferences';
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
import Hub from '../pages/Hub';
import EmailBuilderDetails from './Change/EmailBuilder/EmailBuilderDetails';
import OtherDetails from './Change/Other/OtherDetails';

import {
  Purchases,
  PurchasesOfferings, // Types for TypeScript
} from '@revenuecat/purchases-capacitor';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { App as CapApp } from "@capacitor/app";
import { Device } from '@capacitor/device';
import Activity from '../pages/Activity';
import SubmittedPosts from '../pages/SubmittedPosts';
import SubmittedPostPreview from '../pages/SubmittedPostPreview';
import { useGetCurrentStreak } from '../hooks/api/profiles/current-streak';
import moment from 'moment';
import { useGetUnreadCount } from '../hooks/api/chats/unread-count';
import { useGetMinimumVersion } from '../hooks/api/minimum-version';
import VersionUpdateRequired from '../pages/VersionUpdateRequired';
import { useChatSettings } from '../hooks/api/chats/chat-settings';
import { SplashScreen } from '@capacitor/splash-screen';
import { useGetGlobalAppCurrentProfile } from '../hooks/api/profiles/global-app-current-profile';
import { useGetSettingsCurrentProfile } from '../hooks/api/profiles/settings-current-profile';
import { useGetCommunityProfile } from '../hooks/api/profiles/community-profile';
import { useMultipleAccountsCheck } from '../hooks/api/profiles/multiple_accounts_check';
import MultipleAccountsDetected from '../pages/MultipleAccountsDetected';
import { IconPop } from './IconPop';
import StreakSaverAlert, { StreakSaverAlertState } from './StreakSaverAlert';
import Picksv2 from '../pages/Picksv2';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import OnboardingV2 from '../pages/OnboardingV2';
import CommunityOnboarding from '../pages/CommunityOnboarding';
import PersonalProfile from '../pages/PersonalProfile';
import AgeVerificationFlow, { AgeCheckState, YOTI_BROWSER_CLOSED_EVENT } from '../pages/AgeVerificationFlow';
import { extractSessionIdFromPayload, normalizeYotiSessionId } from '../utils/yoti-session';
import { useEligibilityStatus, useCompleteAgeVerification } from '../hooks/api/eligibility';
import { simulateFakeYotiResultForUser, startYotiSession } from '../hooks/api/account/yoti';
import { consumeAgeCheckQuery } from '../utils/age-verification';
import { apiClient } from '../hooks/api';
import { useYotiCallbackListener, YotiCallbackPayload } from '../hooks/useYotiCallbackListener';
import Loading from '../pages/Loading';
import { shouldShowPrimaryOnboardingScreen, shouldShowOnboardingForProfile } from './app-shell-routing';
import { useEmailStatus } from '../hooks/api/account/emails';






setupIonicReact();

const CommunityPostRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (id === 'submitted') {
    return <SubmittedPosts />;
  }

  return <OpenedPost />;
};

type TabsShellProps = {
  chatBadgeCount: number;
};

const TabsShell: React.FC<TabsShellProps> = ({ chatBadgeCount }) => {
  const location = useLocation();
  const hideTabs = location.pathname === '/community-onboarding' || location.pathname === '/personal-profile-onboarding';

  return (
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
          <Route exact path="/community">
            <Refreshments />
          </Route>
          <Route exact path="/community-onboarding">
            <CommunityOnboarding />
          </Route>
          <Route exact path="/personal-profile-onboarding">
            <PersonalProfile />
          </Route>
          <Route exact path="/community/submitted">
            <SubmittedPosts />
          </Route>
          <Route exact path="/community/submitted/:id">
            <SubmittedPostPreview />
          </Route>
          <Route exact path="/community/:id">
            <CommunityPostRoute />
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
          <Route exact path="/hub">
            <Hub />
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
      {!hideTabs && (
        <IonTabBar slot="bottom">
          <IonTabButton tab="picks" href="/picks">
            <IonIcon icon={flowerIcon} />
            <IonLabel>Discovery</IonLabel>
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
          <IonTabButton tab="change" href="/hub">
            <IonIcon icon={starOutline} />
            <IonLabel>Hub</IonLabel>
          </IonTabButton>
          <IonTabButton tab="person" href="/me">
            <IonIcon icon={personIcon} />
            <IonLabel>Me</IonLabel>
          </IonTabButton>
        </IonTabBar>
      )}
    </IonTabs>
  );
};

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

const AppV2: React.FC = () => {

  const currentVersion: number = CURRENT_APP_VERSION

  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const [reduceAnimations, setReduceAnimations] = useState(false);

  const [maintenance, setMaintenance] = useState(false);
  const [loggedin, setLoggedin] = useState(false);
  const [inAppPurchasesReady, setInAppPurchasesReady] = useState(false);

  const [showIssueAlert, setShowIssueAlert] = useState(false);
  const [streakSaverAlert, setStreakSaverAlert] = useState<StreakSaverAlertState | null>(null);
  const [showRequireVersionUpdate, setShowRequireVersionUpdate] = useState(false);
  const [multipleAccountsDetected, setShowMultipleAccountsDetected] = useState(false);
  const [linkInstallComplete, setLinkInstallComplete] = useState(false);
  const [showStartupTimeout, setShowStartupTimeout] = useState(false);
  const initialAgeResult = useMemo(() => consumeAgeCheckQuery(), []);
  const [ageCheckState, setAgeCheckState] = useState<AgeCheckState | null>(initialAgeResult);
  const [lastYotiSessionId, setLastYotiSessionId] = useState<string | null>(null);
  const [launchingYoti, setLaunchingYoti] = useState(false);
  const fakeModeEnabled = process.env.NODE_ENV !== 'production';
  const refreshYotiResultRef = useRef<((sessionId?: string | null) => Promise<void>) | null>(null);



  const { chatBadgeCount, setChatBadgeCount } = useContext(ChatBadgeContext);

  const queryClient = useQueryClient()
  const { data: globalCurrentProfile, isLoading: globalIsLoading, isError: globalIsError, error: globalError } = useGetGlobalAppCurrentProfile();
  const { data: settingsCurrentProfile, isLoading: settingsIsLoading } = useGetSettingsCurrentProfile();
  const { data: communityProfile, isLoading: communityProfileLoading } = useGetCommunityProfile(undefined, loggedin);

  const { data: eligibilityStatus, isLoading: eligibilityStatusLoading } = useEligibilityStatus(
    loggedin
  );
  const { data: emailStatus, isLoading: emailStatusLoading } = useEmailStatus({ enabled: loggedin });
  const completeAgeVerification = useCompleteAgeVerification({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eligibility', 'status'] });
    },
  });
  const verifyingAgeGate = launchingYoti || completeAgeVerification.isPending;


  const hasMultipleAccounts = useMultipleAccountsCheck(linkInstallComplete).data;

  const currentStreak = useGetCurrentStreak().data;
  const unreadBadgeCount = useGetUnreadCount().data;
  // go ahead and fetch chats
  const { data: chats, refetch: refetchChats } = useGetCurrentUserChats();
  const minVersion = useGetMinimumVersion()

  const current_settings = useChatSettings().data;


  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    let mql: MediaQueryList | null = null;
    let handler: (() => void) | null = null;

    (async () => {
      const { EdgeToEdge } = await import('@capawesome/capacitor-android-edge-to-edge-support');
      const { StatusBar, Style } = await import('@capacitor/status-bar');

      const applyBars = async () => {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const color = isDark ? '#2f2f2f' : '#f2f2fd';
        await EdgeToEdge.setBackgroundColor({ color });
        await StatusBar.setStyle({ style: isDark ? Style.Light : Style.Dark });
      };

      await EdgeToEdge.enable();
      await applyBars();

      mql = window.matchMedia('(prefers-color-scheme: dark)');
      handler = () => void applyBars();
      mql.addEventListener('change', handler);
    })();

    return () => {
      if (mql && handler) mql.removeEventListener('change', handler);
    };
  }, []);


  // const paths = ['/community', '/change', '/chats', '/picks', '/me', '/profile']

  useEffect(() => {
    const foregroundDisplay = (event: any) => {
      event.preventDefault();

      console.log("event", event?.notification);

      if ("additionalData" in event?.notification && !!event.notification?.additionalData && "invalidate_key" in event.notification?.additionalData) {
        queryClient.invalidateQueries({ queryKey: event.notification.additionalData["invalidate_key"] });
      } else if (event?.notification?.title?.includes("sent you a message")) {
        queryClient.invalidateQueries({ queryKey: ["unread"] });
      }
      event.notification.display();
    };

    let resumeListener: PluginListenerHandle | null = null;

    const register = async () => {
        resumeListener = await CapApp.addListener("resume", async () => {
          await applyThemeFromPref();
          await setTextZoom();
          if (settingsCurrentProfile?.settings_streak_tracker) {
            const result = await checkForBrokenStreak();
            const { value: streakBreakPref } = await Preferences.get({ key: STREAK_BREAK_POPUPS_ENABLED_KEY });
            if (result?.data?.broken === 'true' && result?.data?.savers > 0 && result?.data?.streak_pre_break > 2 && streakBreakPref !== 'false') {
              const computedCost = (() => {
                if (result.data.recovery_cost != null) return result.data.recovery_cost;
                if (result.data.break_date) {
                  const d = Math.floor((Date.now() - new Date(result.data.break_date).getTime()) / 86400000);
                  return d <= 2 ? 1 : d <= 4 ? 2 : d <= 6 ? 3 : d <= 10 ? 4 : d <= 14 ? 5 : null;
                }
                return 1;
              })();
              setStreakSaverAlert({
                preBreak: result.data.streak_pre_break,
                savers: result.data.savers,
                recoveryCost: computedCost,
              });
            }
          }
          console.log("resume")
          if (lastYotiSessionId) {
            await refreshYotiResultRef.current?.();
          }
        });
    };

    register();

    if (isMobile()) {
      console.log("foreground handler");
      OneSignal.Notifications.addEventListener("foregroundWillDisplay", foregroundDisplay);
    }

    const reduceAnimationsHandler = (e: Event) => setReduceAnimations((e as CustomEvent<boolean>).detail);
    window.addEventListener('reduce_animations_changed', reduceAnimationsHandler);

    return () => {
      resumeListener?.remove?.();
      if (isMobile()) {
        OneSignal.Notifications.removeEventListener("foregroundWillDisplay", foregroundDisplay);
      }
      window.removeEventListener('reduce_animations_changed', reduceAnimationsHandler);
    };
 }, [
    applyThemeFromPref,
    checkForBrokenStreak,
    lastYotiSessionId,
    queryClient,
    settingsCurrentProfile?.settings_streak_tracker,
  ]);

  useEffect(() => {
    let browserListener: PluginListenerHandle | null = null;
    const dispatchBrowserClosedEvent = () => {
      if (typeof window === "undefined") return;
      try {
        window.dispatchEvent(new CustomEvent(YOTI_BROWSER_CLOSED_EVENT));
      } catch (error) {
        console.warn("Unable to dispatch browser closed event", error);
      }
    };

    const registerBrowserListener = async () => {
      try {
        browserListener = await Browser.addListener("browserFinished", () => {
          dispatchBrowserClosedEvent();
          refreshYotiResultRef.current?.();
        });
      } catch (error) {
        console.warn("Unable to register browser close listener", error);
      }
    };

    registerBrowserListener();

    return () => {
      browserListener?.remove?.();
    };
  }, []);

  useEffect(() => {

    if (currentVersion < minVersion?.data?.minimum_version) {
      setShowRequireVersionUpdate(true)
    }

  }, [minVersion])

  useEffect(() => {

    if (globalCurrentProfile) {
      if (shouldShowOnboardingForProfile(globalCurrentProfile, emailStatus) && hasMultipleAccounts) {
        setShowMultipleAccountsDetected(true);
      } else {
        // If they *have* finished onboarding, never show multiple accounts warning
        setShowMultipleAccountsDetected(false);
      }
    }

  }, [hasMultipleAccounts, globalCurrentProfile, emailStatus]);


  useEffect(() => {


    const prefetchOngoingChatProfiles = () => {
      console.log("chats", chats)
      chats?.slice(0, 5)?.map((c: { other_user_id: any; }) => {
        queryClient.prefetchQuery({ queryKey: ['profiles', 'detail', parseInt(c.other_user_id)], queryFn: getProfileDetailsFn });
      })
    }

    const prefetchChatOrganizerData = () => {
      queryClient.prefetchQuery({
        queryKey: ['chats', 'groups'],
        queryFn: async () => {
          const response = await apiClient.get('/api/profiles/chat_groups/');
          return response.data;
        },
      });
    }

    if (chats) {
      prefetchOngoingChatProfiles();
      prefetchChatOrganizerData();
    }

    const badgeCount = () => {
      if (unreadBadgeCount) {
        setChatBadgeCount(unreadBadgeCount?.unread)
        if (unreadBadgeCount?.unread > 0) {
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

      await applyThemeFromPref()
      await setTextZoom()
      setReduceAnimations(await getReduceAnimations())
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
            const brokenResult = await checkForBrokenStreak();
            const { value: streakBreakPref } = await Preferences.get({ key: STREAK_BREAK_POPUPS_ENABLED_KEY });
            if (brokenResult?.data?.broken === 'true' && brokenResult?.data?.savers > 0 && brokenResult?.data?.streak_pre_break > 2 && streakBreakPref !== 'false') {
              const computedCost = (() => {
                if (brokenResult.data.recovery_cost != null) return brokenResult.data.recovery_cost;
                if (brokenResult.data.break_date) {
                  const d = Math.floor((Date.now() - new Date(brokenResult.data.break_date).getTime()) / 86400000);
                  return d <= 2 ? 1 : d <= 4 ? 2 : d <= 6 ? 3 : d <= 10 ? 4 : d <= 14 ? 5 : null;
                }
                return 1;
              })();
              setStreakSaverAlert({
                preBreak: brokenResult.data.streak_pre_break,
                savers: brokenResult.data.savers,
                recoveryCost: computedCost,
              });
            }

          }

        }
      };

      await SplashScreen.hide();
      setAuthReady(true);
    }

    checkLoggedIn()



  }, []);



  useEffect(() => {

    setLoading(true)

    if (loggedin && !window.location.pathname.includes('/construction')) {
      queryClient.prefetchQuery({ queryKey: ['limits'], queryFn: getLimitsFn });

    }

    setLoading(false)


  }, [loggedin, queryClient]);

  useEffect(() => {
    if (
      ageCheckState === 'success' &&
      eligibilityStatus?.needs_age_verification &&
      !completeAgeVerification.isPending &&
      !completeAgeVerification.isSuccess
    ) {
      completeAgeVerification.mutate();
    }
  }, [ageCheckState, eligibilityStatus?.needs_age_verification, completeAgeVerification]);

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
            queryClient.invalidateQueries({ queryKey: ['current'] })
          }
          else if ("personalplus" in revenueCatCustomerInfo.entitlements.active) {
            await updateCurrentUserProfile({ "subscription_level": "personalplus", "subscription_source": "RevenueCat" })
            queryClient.invalidateQueries({ queryKey: ['current'] })
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
          queryClient.invalidateQueries({ queryKey: ['current'] })
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

  useEffect(() => {
    if (eligibilityStatus?.failed_result) {
      setAgeCheckState('failed');
    }
  }, [eligibilityStatus?.failed_result]);

  const stillCheckingInfo =
    loading || !authReady || globalIsLoading || settingsIsLoading || communityProfileLoading || eligibilityStatusLoading || (loggedin && emailStatusLoading);
  const globalErrorStatus = (globalError as any)?.response?.status;
  const globalAccountIssue = globalIsError && [401, 403, 404].includes(globalErrorStatus);
  const shouldShowOnboarding =
    loggedin &&
    shouldShowPrimaryOnboardingScreen(
      window.location.pathname,
      globalCurrentProfile,
      emailStatus,
      Boolean(communityProfile?.username)
    );
  const needsAgeVerificationGate =
    loggedin &&
    !shouldShowOnboarding &&
    (eligibilityStatus?.needs_age_verification ||
      eligibilityStatus?.failed_result ||
      Boolean(ageCheckState));

  useEffect(() => {
    if (!stillCheckingInfo) {
      setShowStartupTimeout(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowStartupTimeout(true);
    }, 15000);

    return () => window.clearTimeout(timeout);
  }, [stillCheckingInfo]);

  const retryStartup = () => {
    window.location.reload();
  };

  const startAgeVerification = async () => {
      setLaunchingYoti(true);
      try {
        const session = await startYotiSession();
        console.log('Launching Yoti at', session.redirect_url);
        setLastYotiSessionId(session.session_id ?? null);
        setAgeCheckState('required');
        await Browser.open({ url: session.redirect_url });
    } catch (error: any) {
      console.error('Failed to launch age verification', error);
      setLastYotiSessionId(null);
      if (error?.response?.status === 403) {
        setAgeCheckState('failed');
      } else {
        setAgeCheckState('error');
      }
    } finally {
      setLaunchingYoti(false);
    }
  };

  const applyAgeCheckState = useCallback(
    (state: AgeCheckState) => {
      setAgeCheckState(state);
      if (state === 'success' || state === 'failed') {
        queryClient.invalidateQueries({ queryKey: ['eligibility', 'status'] });
      }
    },
    [queryClient]
  );

  const refreshYotiResult = useCallback(
    async (sessionId?: string | null) => {
      const normalizedFromCallback = normalizeYotiSessionId(sessionId);
      const normalizedFromState = normalizeYotiSessionId(lastYotiSessionId);
      const targetSessionId = normalizedFromCallback ?? normalizedFromState;
      if (!targetSessionId) {
        console.warn('No valid Yoti session to refresh');
        return;
      }
      setLastYotiSessionId(targetSessionId);
      try {
        const res = await apiClient.get('/account/yoti/result/', {
          params: { session_id: targetSessionId },
        });
        console.log('Yoti result', res.data);
        const status = res.data?.status;
        if (status === 'passed') {
          applyAgeCheckState('success');
        } else if (status === 'failed') {
          applyAgeCheckState('failed');
        } else {
          applyAgeCheckState('canceled');
        }
      } catch (error) {
        console.error('Unable to refresh Yoti result', error);
      }
    },
    [lastYotiSessionId, applyAgeCheckState]
  );

  useEffect(() => {
    refreshYotiResultRef.current = refreshYotiResult;
  }, [refreshYotiResult]);

  const handleYotiCallbackPayload = useCallback(
    (payload: YotiCallbackPayload) => {
      const payloadSessionId = extractSessionIdFromPayload(payload);
      if (!payloadSessionId) {
        console.warn('Yoti callback payload missing a session id', payload);
      }
      refreshYotiResult(payloadSessionId);
    },
    [refreshYotiResult]
  );

  useYotiCallbackListener(handleYotiCallbackPayload);

  const simulateYotiResult = useCallback(
    async (state: AgeCheckState) => {
      const fakeStatusMap: Partial<Record<AgeCheckState, 'passed' | 'failed' | 'inconclusive'>> = {
        success: 'passed',
        failed: 'failed',
        canceled: 'inconclusive',
      };
      const fakeStatus = fakeStatusMap[state];
      if (fakeModeEnabled && fakeStatus) {
        try {
          const res = await simulateFakeYotiResultForUser(fakeStatus);
          if (res.status === 'passed') {
            applyAgeCheckState('success');
            return;
          }
          if (res.status === 'failed' || res.failed_result) {
            applyAgeCheckState('failed');
            return;
          }
          applyAgeCheckState('canceled');
          return;
        } catch (error) {
          console.error('Failed to simulate fake Yoti result', error);
        }
      }
      applyAgeCheckState(state);
    },
    [applyAgeCheckState, fakeModeEnabled]
  );

  const contactSupport = () => {
    window.open(
      'mailto:help@refreshconnections.com?subject=Age%20verification%20review%20request',
      '_blank'
    );
  };

  if (stillCheckingInfo) {
    if (showStartupTimeout) {
      return (
        <IonApp>
          <IonPage>
            <IonContent fullscreen className="startup-timeout-screen">
              <div className="startup-timeout-screen__inner">
                <IonCard className="startup-timeout-screen__card">
                  <IonCardContent>
                    <h1>Connection issue</h1>
                    <p>This is taking longer than expected. Please try again later.</p>
                    <IonButton expand="block" onClick={retryStartup}>
                      Try again
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </div>
            </IonContent>
          </IonPage>
        </IonApp>
      );
    }

    return (
      <IonApp>
          <Loading />
      </IonApp>
    );
  }

  if (window.location.pathname.includes('/construction')) {
    return <Construction />;
  }

  if (showRequireVersionUpdate) {
    return (
      <IonApp>
        <VersionUpdateRequired />
      </IonApp>
    );
  }

  if (!loggedin) {
    return (
      <IonApp>
        <Login setLoggedin={setLoggedin} />
      </IonApp>
    );
  }

  if (globalIsError && !globalAccountIssue) {
    return (
      <IonApp>
        <IonPage>
          <IonContent fullscreen className="startup-timeout-screen">
            <div className="startup-timeout-screen__inner">
              <IonCard className="startup-timeout-screen__card">
                <IonCardContent>
                  <h1>Connection issue</h1>
                  <p>There's a problem loading your account right now. Please try again in a moment.</p>
                  <IonButton expand="block" onClick={retryStartup}>
                    Try again
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </div>
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  if (!globalCurrentProfile || globalAccountIssue) {
    return (
      <IonApp>
        <IonPage>
          <IonContent fullscreen className="startup-timeout-screen">
            <div className="startup-timeout-screen__inner">
              <IonCard className="startup-timeout-screen__card">
                <IonCardContent>
                  <h1>Account issue</h1>
                  <p>There's a problem loading your account. Please log out and back in, or contact support if this keeps happening.</p>
                  <IonButton expand="block" onClick={() => handleLogoutCommon()}>
                    Log out
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </div>
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  if (multipleAccountsDetected) {
    return (
      <IonApp>
        <MultipleAccountsDetected />
      </IonApp>
    );
  }

  if (shouldShowOnboarding) {
    return (
      <IonApp>
        <OnboardingV2 />
      </IonApp>
    );
  }

  if (needsAgeVerificationGate) {
    return (
      <IonApp>
        
            <AgeVerificationFlow
              state={ageCheckState || 'required'}
              regionName={eligibilityStatus?.region_name}
              providerName={eligibilityStatus?.provider ? 'Yoti' : undefined}
              verifying={verifyingAgeGate}
              onStart={startAgeVerification}
              onRetry={startAgeVerification}
              onContinue={() => {
                setAgeCheckState(null);
                queryClient.invalidateQueries({ queryKey: ['eligibility', 'status'] });
              }}
              onContactSupport={contactSupport}
              onLogout={handleLogoutCommon}
              lastSessionId={lastYotiSessionId}
              onRefreshResult={refreshYotiResult}
              fakeModeEnabled={fakeModeEnabled}
              onSimulatePass={() => simulateYotiResult('success')}
              onSimulateFail={() => simulateYotiResult('failed')}
              onSimulateInconclusive={() => simulateYotiResult('canceled')}
            />
          
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <TabsShell chatBadgeCount={chatBadgeCount} />
      </IonReactRouter>
      <IonAlert
        isOpen={showIssueAlert}
        header="Oops! Something happened. Try again later."
        onDidDismiss={() => handleLogoutCommon()}
        buttons={['Ok']}
      />
      <StreakSaverAlert
        alert={streakSaverAlert}
        onDismiss={() => setStreakSaverAlert(null)}
        onRestore={async () => {
          try {
            await recoverStreak();
            queryClient.invalidateQueries({ queryKey: ['streak'] });
          } catch (e) {
            console.log('streak recovery failed', e);
          }
        }}
      />
      <IonToast
        isOpen={streakOpen}
        message={`Streak increase! ${currentStreak?.streak_count}`}
        onDidDismiss={() => setStreakOpen(false)}
        duration={3000}
        cssClass={"streak-toast"}
        position="top"
      ></IonToast>

      {!reduceAnimations && <IconPop trigger={streakOpen} position="top-right" />}
    </IonApp>
  );
};

export default AppV2;
