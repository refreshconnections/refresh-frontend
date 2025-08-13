import { IonContent, IonPage, IonButton, IonFab, IonFabButton, IonIcon, IonRow, IonFabList, useIonAlert, useIonModal, IonCard, IonCardTitle, IonCardContent, IonRefresher, IonRefresherContent, RefresherEventDetail, IonSpinner } from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react';
import { heartOutline as heartIcon, bugOutline as bugIcon, hourglass as hourglassIcon, square as squareIcon, alert as alertIcon, filter as filterIcon } from 'ionicons/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarsFilter, faPaperclip } from '@fortawesome/pro-solid-svg-icons';
import { faCommentHeart } from '@fortawesome/pro-solid-svg-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useGetStatuses } from '../hooks/api/status';
import { updateOutgoingConnections, updateDismissedConnections, updateBlockedConnections, increaseStreak, isPersonalPlus, sendAnOpener } from '../hooks/utilities';
import { getWithExpiry, removeFromCapacitorLocalStorage, setWithExpiry } from '../hooks/capacitorPreferences/all';
import ProfileCard from '../components/ProfileCard';
import LoadingCard from '../components/LoadingCard';
import CantAccessCard from '../components/CantAccessCard';
import AdvancedFilterModal from '../components/AdvancedFilterModal';
import ReportModal from '../components/ReportModal';
import { LikeMessageAlertModal } from './LikeMessageAlertModal';
import StatusToast from '../components/StatusToast';
import { IconPop } from '../components/IconPop';
import './Page.css';
import './Picks.css';
import { getPicksAndProfilesWithFiltersFn, usePicksAndProfilesWithFilters } from '../hooks/api/profiles/picks-and-profiles';
import debounce from "lodash.debounce";
import { userQueryKeys } from '../hooks/api';



const Picksv2: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: filterData, isLoading: filterDataIsLoading } = useGetCurrentProfile();
  const { data: picksData, isLoading: picksLoading, isFetching: picksFetching, refetch: picksRefetch } = usePicksAndProfilesWithFilters();
  const statuses = useGetStatuses().data;
  const [index, setIndex] = useState(0);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [showMessagePop, setShowMessagePop] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const picksTopRef = useRef<null | HTMLDivElement>(null);
  const [sortedPicks, setSortedPicks] = useState<typeof picksData>(null);
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);

  const profileDetails = sortedPicks?.[index] ?? null;
  const [filtersVisible, setFiltersVisible] = useState(false);

  /* refs */
  const lastY = useRef(0);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const topReady = useRef(false);        // true once the pause has elapsed
  const revealTimeout = useRef<NodeJS.Timeout | null>(null);

  const sortedReady = sortedPicks !== null;

  const shouldShowNoProfiles =
    sortedReady &&                                   // only after effect runs
    !picksLoading &&
    !nextLoading &&
    sortedPicks.length === 0;

  useEffect(() => {
    if (shouldShowNoProfiles && filtersVisible) {
      setFiltersVisible(false);
    }
  }, [shouldShowNoProfiles, filtersVisible]);



  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const [presentAlert] = useIonAlert();
  const [presentfirstFiltersAlert] = useIonAlert();

  const [offendingId, setOffendingId] = useState<number | null>(null);
  const [offendingName, setOffendingName] = useState<string | null>(null);

  const [isHydratedFromCache, setIsHydratedFromCache] = useState(false);



  const [createReportPresent, createReportDismiss] = useIonModal(ReportModal, {
    offender: 'user',
    text: offendingName,
    id: offendingId,
    onDismiss: (data: string, role: string) => createReportDismiss(data, role),
  });

  const picksStatus = statuses?.find(status => status.page.includes('picks'));
  const isBeforeExpiration = picksStatus?.active && (!picksStatus.expirationDateTime || new Date() < new Date(picksStatus.expirationDateTime));

  useEffect(() => {
    const mergeLastShownPick = async () => {
      if (!picksData) return;

      const lastShownPick = await getWithExpiry('last_shown_pick_v2');

      if (!lastShownPick || typeof lastShownPick.user !== 'number') {
        setSortedPicks(picksData);
        return;
      }

      const alreadyIncluded = picksData.some(p => p.user === lastShownPick.user);

      const merged = alreadyIncluded
        ? [
          lastShownPick,
          ...picksData.filter(p => p.user !== lastShownPick.user),
        ]
        : [lastShownPick, ...picksData];

      setSortedPicks(merged);
      setIndex(0);
    };

    mergeLastShownPick();
  }, [picksData]);

  useEffect(() => {
    const hydrateFromLastSeen = async () => {
      const last = await getWithExpiry('last_shown_pick_v2');
      if (last && typeof last.user === 'number') {
        setSortedPicks([last]);
        setIndex(0);
        setIsHydratedFromCache(true);
      }
    };
    hydrateFromLastSeen();
  }, []);


  const scrollToTop = () => {
    picksTopRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
  };

  useEffect(() => {
    const storeCurrentPick = async () => {
      const current = sortedPicks?.[index];
      if (current && typeof current.user === 'number') {
        await setWithExpiry('last_shown_pick_v2', current, 1000 * 60 * 60 * 24 * 2); // 2 days
      }
    };

    storeCurrentPick();
  }, [index, sortedPicks]);

  useEffect(() => {
    const next = sortedPicks?.[index + 1];
    if (next?.pic1_main) {
      const img = new Image();
      img.src = next.pic1_main;
    }
  }, [index, sortedPicks]);

  // 1️⃣  inside the effect that actually scrolls the page
  useEffect(() => {
    if (shouldScrollToTop && profileDetails) {
      /* ignore the scroll events for the next 350 ms */
      revealTimeout.current = setTimeout(() => {
        revealTimeout.current = null;          // re-enable normal handling
      }, 350);                                 // match card-switch animation

      scrollToTop();                           // <-- programmatic scroll
      setShouldScrollToTop(false);
    }
  }, [profileDetails, shouldScrollToTop]);

  const handleNextItem = async (connection: number, action: 'dismiss' | 'like' | 'block') => {
    const next = picksData?.[index + 1];
    setFiltersVisible(false);

    const doTheThing = async () => {
      if (action === 'like') await updateOutgoingConnections(connection);
      if (action === 'dismiss') await updateDismissedConnections(connection);
      if (action === 'block') await updateBlockedConnections(connection);
    }




    if (index < (picksData?.length ?? 0) - 1) {

      await delay(300); // Wait for grey overlay to show
      setIndex(i => i + 1);
      setShouldScrollToTop(true);

      await doTheThing()


    } else {
      setNextLoading(true);
      await removeFromCapacitorLocalStorage('picks_and_profiles_with_filters');
      await removeFromCapacitorLocalStorage('last_shown_pick_v2');

      await doTheThing()

      const result = await picksRefetch();

      const newData = result?.data ?? [];
      setShouldScrollToTop(true);
      if (newData.length > 0) {
        //   const lastSeenId = await getWithExpiry('last_shown_pick_v2');
        //   const index = newData.findIndex(p => p.user === lastSeenId.user);
        //   const reordered = index !== -1
        //     ? [newData[index], ...newData.slice(0, index), ...newData.slice(index + 1)]
        //     : newData;

        setSortedPicks(newData);

        await delay(300); // Wait for grey overlay to show
        setIndex(0);
        setShouldScrollToTop(true);
      } else {
        // truly out of picks, show "no profiles"
        await removeFromCapacitorLocalStorage('last_shown_pick_v2');
        await delay(300); // Wait for grey overlay to show
        setSortedPicks([]);
        setIndex(0);
        setShouldScrollToTop(true);

      }



      const isNearEnd = index >= (sortedPicks.length - 3);
      if (isNearEnd && !picksFetching) {
        console.log("⏩ Safe refetch triggered inside action handler");
        await queryClient.prefetchQuery({
          queryKey: userQueryKeys.picks_and_profiles,
          queryFn: getPicksAndProfilesWithFiltersFn,
        });
      }

      setNextLoading(false);
    }
  };

  const addOutgoingConnection = async (connection: number) => {
    setButtonLoading(true);
    await handleNextItem(connection, 'like');
    console.log("liking")
    if (filterData?.settings_streak_tracker) {
      await increaseStreak();
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    }
    setButtonLoading(false);
  };

  const addDismissedConnection = async (connection: number) => {
    setButtonLoading(true);
    console.log("dismissing")
    await handleNextItem(connection, 'dismiss');
    setButtonLoading(false);
  };

  const addBlockedConnection = async (connection: number) => {
    setButtonLoading(true);
    console.log("blocking")
    await handleNextItem(connection, 'block');
    setButtonLoading(false);
  };

  const [filterPresent, filterDismiss] = useIonModal(AdvancedFilterModal, {
    currentProfileData: filterData,
    pro: filterData?.subscription_level,
    onDismiss: async (changes: boolean) => {
      if (changes) {
        setFiltersLoading(true);
        await removeFromCapacitorLocalStorage('picks_and_profiles_with_filters');
        await picksRefetch();
        setFiltersLoading(false);
      }
      setFiltersVisible(false);
      filterDismiss();
    },
  });

  const openAdvancedFilterModal = () => {
    filterPresent();
  };

  const handleReportOpen = async (name: string, id: number) => {
    setOffendingName(name);
    setOffendingId(id);
    createReportPresent();
  };

  const [presentLikeMessageModal, dismissLikeMessageModal] = useIonModal(LikeMessageAlertModal, {
    connectionName: profileDetails?.name ?? '',
    onDismiss: () => dismissLikeMessageModal(),
    onSendLike: async () => {
      await addOutgoingConnection(profileDetails?.user);
      dismissLikeMessageModal();
    },
    onSendWithMessage: async (msg: string) => {
      await sendAnOpener(profileDetails?.user, msg);
      await addOutgoingConnection(profileDetails?.user);
      setShowMessagePop(true);
      dismissLikeMessageModal();
    },
  });



  if (!filterData || filterDataIsLoading) {
    return <IonPage><IonContent><div style={{ marginTop: "100pt" }}>
      <LoadingCard />
    </div></IonContent></IonPage>;
  }

  if (!filterData.created_profile || filterData.deactivated_profile || filterData.paused_profile) {
    return <IonPage>
      <IonContent>
        <IonRow class="page-title bigger">
          <img className="color-invertible" src="../static/img/picks.png" alt="picks" />
        </IonRow>
        <CantAccessCard tabName="Picks" />
      </IonContent>
    </IonPage>;
  }



  const extraTimeWithRefetch = async () => {
    setButtonLoading(true)
    picksRefetch()
    await delay(1000)
    setButtonLoading(false)
  }

  /* SCROLL STUFF */
  /* tweakables */
  const TOP_THRESHOLD_PX = 6;     // “at the very top” window
  const TOP_HOLD_MS = 200;   // must pause this long before pull
  const FAST_PULL_VELOCITY = -120;  // px change between two events
  const HIDE_DEBOUNCE_MS = 80;    // ignore tiny bounces at top



  const onScroll = (e: CustomEvent) => {
    const y = (e.detail as any).scrollTop as number;
    const delta = y - lastY.current;               // +ve = downward motion

    /* 1 ─ Ignore programmatic scrollToTop after card switch */
    if (revealTimeout.current) {
      lastY.current = y;
      return;
    }

    /* 2 ─ Track “pause at very top” */
    if (y <= TOP_THRESHOLD_PX) {
      if (!holdTimer.current && !topReady.current) {
        // start the pause timer
        holdTimer.current = setTimeout(() => {
          topReady.current = true;          // user has paused long enough
          holdTimer.current = null;
        }, TOP_HOLD_MS);
      }
    } else {
      // moved away from top → reset pause
      if (holdTimer.current) clearTimeout(holdTimer.current);
      holdTimer.current = null;
      topReady.current = false;
    }

    /* 3 ─ SHOW conditions */
    const pullingUp = delta < 0;
    const fastPullUp = delta < FAST_PULL_VELOCITY;

    if ((topReady.current && pullingUp) || fastPullUp) {
      setFiltersVisible(true);
      topReady.current = false;             // consume the readiness
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    }

    /* 4 ─ HIDE when actually scrolling down away from top */
    const movedAwayFromTop = y > TOP_THRESHOLD_PX;
    const scrollingDown = delta > 0;

    if (filtersVisible && movedAwayFromTop && scrollingDown) {
      // debounce hide a bit so micro-bounces don’t close instantly
      if (!hideTimer.current) {
        hideTimer.current = setTimeout(() => {
          setFiltersVisible(false);
          hideTimer.current = null;
        }, HIDE_DEBOUNCE_MS);
      }
    }

    lastY.current = y;
  };




  return (
    <IonPage>

      <IonContent fullscreen scrollEvents forceOverscroll onIonScroll={onScroll} className={`picks-offset ${filtersVisible ? 'filters-visible' : ''}`}>

        <IonRow className={`picks-filters ${filtersVisible ? 'show' : ''}`}>
          <IonButton
            color="primary"
            onClick={openAdvancedFilterModal}
            disabled={nextLoading || picksLoading || picksFetching || filtersLoading}
          >
            <FontAwesomeIcon icon={faBarsFilter} />
            &nbsp;Filters
          </IonButton>
        </IonRow>


        <div ref={picksTopRef}></div>

        {(!nextLoading && profileDetails && (!picksLoading || isHydratedFromCache) && !filtersLoading) ? (
          <>

            <div
              className="profile-card-container"
              key={profileDetails?.user}
            >
              <ProfileCard
                cardData={profileDetails}
                pro={isPersonalPlus(filterData.subscription_level)}
                settingsAlt={filterData.settings_alt_text}
              />
            </div>
            <IonRow class="ion-justify-content-center">
              <IonButton
                fill="clear"
                size="small"
                onClick={openAdvancedFilterModal}
                disabled={nextLoading || picksLoading || picksFetching || filtersLoading}
              >
                <FontAwesomeIcon icon={faBarsFilter} />
                &nbsp;Filters
              </IonButton>
            </IonRow>
            <IonFab className="bigger" slot="fixed" vertical="bottom" horizontal="end">
              <IonFabButton disabled={buttonLoading} onClick={() => presentLikeMessageModal({ cssClass: 'like-message-alert-modal' })}>
                <IonIcon icon={heartIcon}></IonIcon>
              </IonFabButton>
            </IonFab>
            <IonFab className="very-bottom" slot="fixed" vertical="bottom" horizontal="start">
              <IonFabButton disabled={buttonLoading} color="secondary">
                <IonIcon icon={bugIcon}></IonIcon>
              </IonFabButton>
              <IonFabList className="with-label" side="top">
                <IonFabButton color="warning" disabled={buttonLoading} onClick={() => addDismissedConnection(profileDetails.user)} data-label="Ignore for now">
                  <IonIcon icon={hourglassIcon}></IonIcon>
                </IonFabButton>
                <IonFabButton color="danger" disabled={buttonLoading} onClick={() => presentAlert({
                  header: 'Are you sure you want to block this person?!',
                  buttons: [
                    { text: 'Nevermind', role: 'cancel' },
                    { text: 'Yes!', role: 'confirm', handler: () => addBlockedConnection(profileDetails.user) },
                  ]
                })} data-label="Block">
                  <IonIcon icon={squareIcon}></IonIcon>
                </IonFabButton>
                <IonFabButton color="dark" disabled={buttonLoading} onClick={() => handleReportOpen(profileDetails.name, profileDetails.user)} data-label="Report">
                  <IonIcon icon={alertIcon}></IonIcon>
                </IonFabButton>
              </IonFabList>
            </IonFab>
          </>
        ) : shouldShowNoProfiles ? (
          <>
            <IonRow class="page-title bigger">
              <img className="color-invertible" src="../static/img/picks.png" alt="picks" />
            </IonRow>
            <IonCard className="prelaunch">
              <IonCardTitle style={{ fontWeight: "normal" }}>
                {buttonLoading ? "Refreshing..." : "No new Profiles to view!"}
                <br /><br />
                <IonButton onClick={openAdvancedFilterModal} color="primary" disabled={buttonLoading}>
                  <IonIcon icon={filterIcon}></IonIcon> &nbsp;Adjust Your Filters
                </IonButton>
                <br /><br />
                <span style={{ fontSize: "16px", lineHeight: "0.8" }}>
                  Check back later for new members joining our community.
                </span>
              </IonCardTitle>
              <IonCardContent>
                Plus, join the discussion at the Refreshments Bar (community forum).
              </IonCardContent>
            </IonCard>
            <IonCard class="out-of-profiles">
              <IonRow className="ion-justify-content-center spinning-flower-wrapper">
                <img
                  className={buttonLoading ? "flower-mask spin" : "flower-mask"}
                  src="../static/img/flower-mask.png"
                  alt="refresh-mask"
                />
              </IonRow>
              <IonRow class="picks-buttons">
                <IonButton
                  class="clearfilters"
                  onClick={extraTimeWithRefetch}
                  disabled={buttonLoading}
                >
                  {buttonLoading ? "Refreshing..." : "Refresh your Picks"}
                </IonButton>
              </IonRow>
            </IonCard>
          </>
        ) : (
          <div style={{ marginTop: "100pt" }}>
            <LoadingCard />
          </div>
        )}

        {picksStatus?.active && (picksStatus?.header || picksStatus?.message) && isBeforeExpiration && (
          <StatusToast isToastOpen={true} setIsToastOpen={setIsToastOpen} header={picksStatus.header} message={picksStatus.message} />
        )}

        <IconPop
          trigger={showMessagePop}
          position="center"
          emojis={['🧡']}
          icons={[faCommentHeart]}
          intensity="big"
          onComplete={() => setShowMessagePop(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Picksv2;
