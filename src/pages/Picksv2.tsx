import { IonContent, IonPage, IonButton, IonFab, IonFabButton, IonIcon, IonRow, IonFabList, useIonAlert, useIonModal, IonCard, IonCardTitle, IonCardContent, useIonRouter, IonText } from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react';
import { heartOutline as heartIcon, bugOutline as bugIcon, hourglass as hourglassIcon, square as squareIcon, alert as alertIcon, filter as filterIcon } from 'ionicons/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarsFilter } from '@fortawesome/pro-solid-svg-icons';
import { faCommentHeart } from '@fortawesome/pro-solid-svg-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useGetStatuses } from '../hooks/api/status';
import { updateOutgoingConnections, updateDismissedConnections, updateBlockedConnections, increaseStreak, isPersonalPlus, sendAnOpener, getReduceAnimations } from '../hooks/utilities';
import { useBlockProfile } from '../hooks/useBlockProfile';
import { Preferences } from '@capacitor/preferences';
import { getWithExpiry, removeFromCapacitorLocalStorage, setWithExpiry } from '../hooks/capacitorPreferences/all';
import ProfileCard from '../components/ProfileCard';
import LoadingCard from '../components/LoadingCard';
import CantAccessCard from '../components/CantAccessCard';
import AdvancedFilterModal from '../components/AdvancedFilterModal';
import ReportModal from '../components/ReportModal';
import { LikeMessageAlertModal } from './LikeMessageAlertModal';
import StatusToast from '../components/StatusToast';
import { IconPop } from '../components/IconPop';
import Tips from './Tips';
import './Page.css';
import './Picks.css';
import { getPicksAndProfilesWithFiltersFn, usePicksAndProfilesWithFilters } from '../hooks/api/profiles/picks-and-profiles';
import { userQueryKeys } from '../hooks/api';
import PersonalProfile from './PersonalProfile';

const getActiveFilterCount = (profile: any) => {
  if (!profile) return 0;
  let count = 0;
  count += profile.filter_lc?.length ?? 0;
  count += profile.filter_gender_sexuality?.length ?? 0;
  if (profile.filter_gender_sexuality_not) count += 1;
  count += profile.filter_lived_experiences?.length ?? 0;
  if (profile.filter_age_gt !== null && profile.filter_age_gt !== undefined) count += 1;
  if (profile.filter_age_lt !== null && profile.filter_age_lt !== undefined) count += 1;
  if (profile.filter_distance !== null && profile.filter_distance !== undefined) count += 1;
  if (profile.filter_keyword) count += 1;
  if (profile.filter_looking_for_single_selection) count += 1;
  if (profile.filter_precautions_single_selection !== null && profile.filter_precautions_single_selection !== undefined) count += 1;
  if (profile.filter_precautions_include_or_not && profile.filter_precautions_include_or_not !== 'none') count += 1;
  return count;
};

const Picksv2: React.FC = () => {
  const router = useIonRouter();
  const queryClient = useQueryClient();
  const FILTERS_TIP_KEY = 'picks_filters_tip_seen';

  const { data: filterData, isLoading: filterDataIsLoading } = useGetCurrentProfile();

  const {
    data: picksData,
    isLoading: picksLoading,
    isFetching: picksFetching,
    isError: picksIsError,
    refetch: picksRefetch,
  } = usePicksAndProfilesWithFilters();
  const picksError = Boolean(picksIsError);

  const statuses = useGetStatuses().data;

  const [index, setIndex] = useState(0);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [showMessagePop, setShowMessagePop] = useState(false);
  const [reduceAnimations, setReduceAnimations] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [sortedPicks, setSortedPicks] = useState<typeof picksData>(null);
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);
  const [isHydratedFromCache, setIsHydratedFromCache] = useState(false);
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);
  const skipCachedLastShownRef = useRef(false);

  const picksTopRef = useRef<null | HTMLDivElement>(null);

  const profileDetails = sortedPicks?.[index] ?? null;

  /* refs for scroll logic */
  const lastY = useRef(0);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const topReady = useRef(false);
  const revealTimeout = useRef<NodeJS.Timeout | null>(null);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
  const [presentAlert] = useIonAlert();
  const [presentfirstFiltersAlert] = useIonAlert();
  const blockProfile = useBlockProfile();

  const markFiltersTipSeen = async () => {
    await Preferences.set({ key: FILTERS_TIP_KEY, value: 'true' });
    setShowFiltersDialog(false);
  };

  useEffect(() => {
    getReduceAnimations().then(setReduceAnimations);
    const handler = (e: Event) => setReduceAnimations((e as CustomEvent<boolean>).detail);
    window.addEventListener('reduce_animations_changed', handler);
    return () => window.removeEventListener('reduce_animations_changed', handler);
  }, []);

  useEffect(() => {
    const maybeShowFiltersTip = async () => {
      if (!filterData) return;
      const { value } = await Preferences.get({ key: FILTERS_TIP_KEY });
      if (value === 'true') return;
      const count = getActiveFilterCount(filterData);
      if (count >= 1) {
        setShowFiltersDialog(false);
        return;
      }
      setShowFiltersDialog(true);
    };

    maybeShowFiltersTip();
  }, [filterData]);

  const [offendingId, setOffendingId] = useState<number | null>(null);
  const [offendingName, setOffendingName] = useState<string | null>(null);
  const [createReportPresent, createReportDismiss] = useIonModal(ReportModal, {
    offender: 'user',
    text: offendingName,
    id: offendingId,
    onDismiss: (data: string, role: string) => createReportDismiss(data, role),
    onReportSubmitted: () => { if (offendingId !== null) handleNextItem(offendingId, 'dismiss'); },
  });
  const [presentPersonalProfile, dismissPersonalProfile] = useIonModal(PersonalProfile, {
    onDismiss: () => dismissPersonalProfile(),
  });


  const picksStatus = statuses?.find(status => status.page.includes('picks'));
  const isBeforeExpiration = picksStatus?.active && (!picksStatus.expirationDateTime || new Date() < new Date(picksStatus.expirationDateTime));

  /** ─────────────────────────────────────────────────────────────
   *  Programmatic jump via anchor (no IonContent ref needed)
   *  ───────────────────────────────────────────────────────────── */
  const SUPPRESS_MS = 400;
  const jumpToTopViaAnchor = () => {
    setFiltersVisible(false); // never show filters during a programmatic jump

    if (revealTimeout.current) clearTimeout(revealTimeout.current);
    revealTimeout.current = setTimeout(() => {
      revealTimeout.current = null;
    }, SUPPRESS_MS);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        picksTopRef.current?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' });
      });
    });
  };

  /** --------- READY/STATE FLAGS (prevent infinite spinners) ---------- */
  const initialLoading = picksLoading;
  const ready = sortedPicks !== null || isHydratedFromCache;
  const hasProfile = !!(sortedPicks && sortedPicks[index]);
  const noProfiles = ready && !nextLoading && (sortedPicks?.length === 0);

  /** ---------------- Hydrate from cache ONCE ----------------- */
  useEffect(() => {
    let cancelled = false;
    const hydrateFromLastSeen = async () => {
      const last = await getWithExpiry('last_shown_pick_v2');
      if (!cancelled && last && typeof last.user === 'number') {
        setSortedPicks([last]);
        setIndex(0);
        setIsHydratedFromCache(true);
      }
    };
    hydrateFromLastSeen();
    return () => { cancelled = true; };
  }, []);

  /** ---------------- Merge server data when it arrives ----------------- */
  const currentCardUser = sortedPicks?.[index]?.user ?? null;

  useEffect(() => {
    if (!picksData || filtersLoading) return;
    let cancelled = false;

    const mergeLastShownPick = async () => {
      const lastShownPick = await getWithExpiry('last_shown_pick_v2');

      if (cancelled) return;

      let merged: typeof picksData = picksData;
      const shouldSkipCached = skipCachedLastShownRef.current;
      if (shouldSkipCached) {
        skipCachedLastShownRef.current = false;
      }
      const lastShownUserId =
        lastShownPick && typeof lastShownPick.user === 'number'
          ? lastShownPick.user
          : null;

      if (!shouldSkipCached && lastShownUserId != null) {
        const alreadyIncluded = picksData.some(p => p.user === lastShownUserId);
        if (!alreadyIncluded) {
          merged = [lastShownPick, ...picksData];
        }
      }

      const targetUser =
        currentCardUser ??
        (merged.length === 0 ? null : merged[0]?.user ?? null);

      let nextIndex = 0;
      if (targetUser != null) {
        const foundIndex = merged.findIndex(p => p.user === targetUser);
        nextIndex = foundIndex >= 0 ? foundIndex : 0;
      }

      setSortedPicks(merged);
      setIndex(nextIndex);
    };

    mergeLastShownPick();
    return () => {
      cancelled = true;
    };
  }, [picksData, currentCardUser]);

  /** ---------------- Persist current card for warm-start ----------------- */
  useEffect(() => {
    const storeCurrentPick = async () => {
      const current = sortedPicks?.[index];
      if (current && typeof current.user === 'number') {
        await setWithExpiry('last_shown_pick_v2', current, 1000 * 60 * 60 * 24 * 2);
      }
    };
    storeCurrentPick();
  }, [index, sortedPicks]);

  /** ---------------- Preload next image ----------------- */
  useEffect(() => {
    const next = sortedPicks?.[index + 1];
    if (!next) return;
    const photoKeys = ['pic1_main', 'pic2', 'pic3', 'pic4', 'pic5', 'pic6', 'pic7', 'pic8', 'pic9'];
    const order: string[] = Array.isArray(next.photo_order) && next.photo_order.length > 0
      ? next.photo_order
      : photoKeys;
    const firstKey = order.find((k: string) => next[k]) ?? 'pic1_main';
    const src = next[firstKey];
    if (src) {
      const img = new Image();
      img.src = src;
    }
  }, [index, sortedPicks]);

  /** ---------------- Scroll to top after switching cards ----------------- */
  useEffect(() => {
    if (!shouldScrollToTop) return;
    jumpToTopViaAnchor();
    setShouldScrollToTop(false);
  }, [shouldScrollToTop]);

  /** ---------------- Hide filter sheet if there are zero profiles ----------------- */
  useEffect(() => {
    if (noProfiles && filtersVisible) {
      setFiltersVisible(false);
    }
  }, [noProfiles, filtersVisible]);

  /** ---------------- Actions / navigation ----------------- */
  const handleNextItem = async (connection: number, action: 'dismiss' | 'like' | 'block') => {
    const doTheThing = async () => {
      if (action === 'like') await updateOutgoingConnections(connection);
      if (action === 'dismiss') await updateDismissedConnections(connection);
      if (action === 'block') await updateBlockedConnections(connection);
    };

    setFiltersVisible(false);

    if (index < (picksData?.length ?? 0) - 1) {
      await delay(300);
      setIndex(i => i + 1);
      setShouldScrollToTop(true);
      jumpToTopViaAnchor();
      await doTheThing();
    } else {
      setNextLoading(true);
      setSortedPicks([]);
      setIndex(0);
      setShouldScrollToTop(true);
      jumpToTopViaAnchor();

      await removeFromCapacitorLocalStorage('picks_and_profiles_with_filters');
      await removeFromCapacitorLocalStorage('last_shown_pick_v2');

      await doTheThing();

      const result = await picksRefetch();
      const newData = result?.data ?? [];
      setShouldScrollToTop(true);

      if (newData.length > 0) {
        setSortedPicks(newData);
        await delay(300);
        setIndex(0);
        jumpToTopViaAnchor();
        setShouldScrollToTop(true);
      } else {
        await removeFromCapacitorLocalStorage('last_shown_pick_v2');
        await delay(300);
        setSortedPicks([]);
        setIndex(0);
        jumpToTopViaAnchor();
        setShouldScrollToTop(true);
      }

      const nearEnd = (sortedPicks && index >= (sortedPicks.length - 3));
      if (nearEnd && !picksFetching) {
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
    if (filterData?.settings_streak_tracker) {
      await increaseStreak();
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    }
    setButtonLoading(false);
  };

  const addDismissedConnection = async (connection: number) => {
    setButtonLoading(true);
    await handleNextItem(connection, 'dismiss');
    setButtonLoading(false);
  };

  const addBlockedConnection = async (connection: number) => {
    setButtonLoading(true);
    await handleNextItem(connection, 'block');
    setButtonLoading(false);
  };

  const [tipsPresent, tipsDismiss] = useIonModal(Tips, {
    onDismiss: () => tipsDismiss(),
  });

  const [filterPresent, filterDismiss] = useIonModal(AdvancedFilterModal, {
    currentProfileData: filterData,
    pro: filterData?.subscription_level,
    onOpenTips: () => tipsPresent(),
    onDismiss: async (changes: boolean) => {
      // Close the modal first
      filterDismiss();

      if (changes) {
        // Only if the user actually changed something:
        setFiltersLoading(true);
        skipCachedLastShownRef.current = true;
        setSortedPicks(null);
        setIndex(0);
        setIsHydratedFromCache(false);
        setFiltersVisible(false);
        skipCachedLastShownRef.current = true;
        await removeFromCapacitorLocalStorage('picks_and_profiles_with_filters');
        await removeFromCapacitorLocalStorage('last_shown_pick_v2');
        const result = await picksRefetch();
        const freshData = result?.data ?? [];
        setSortedPicks(freshData);
        setIndex(freshData.length ? 0 : 0);
        setFiltersLoading(false);

        // After close animation finishes, jump to top and keep position there
        setTimeout(() => {
          jumpToTopViaAnchor();
          setShouldScrollToTop(true);
        }, 300);
      } else {
        // No changes → do NOT jump; leave scroll position as-is (prevents flash)
        setFiltersVisible(false);
      }
    },
  });

  const openAdvancedFilterModal = async () => {
    if (showFiltersDialog) {
      await markFiltersTipSeen();
    }
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
      if (!reduceAnimations) setShowMessagePop(true);
      dismissLikeMessageModal();
    },
  });

  const extraTimeWithRefetch = async () => {
    setButtonLoading(true);
    await picksRefetch();
    await delay(300);
    setButtonLoading(false);
  };

  /** ---------------- Scroll handler ----------------- */
  const TOP_THRESHOLD_PX = 6;
  const TOP_HOLD_MS = 200;
  const FAST_PULL_VELOCITY = -120;
  const HIDE_DEBOUNCE_MS = 80;

  const onScroll = (e: CustomEvent) => {
    const y = (e.detail as any).scrollTop as number;
    const delta = y - lastY.current;

    // Ignore programmatic scrollToTop after jumps
    if (revealTimeout.current) {
      lastY.current = y;
      return;
    }

    // Track "pause at very top"
    if (y <= TOP_THRESHOLD_PX) {
      if (!holdTimer.current && !topReady.current) {
        holdTimer.current = setTimeout(() => {
          topReady.current = true;
          holdTimer.current = null;
        }, TOP_HOLD_MS);
      }
    } else {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      holdTimer.current = null;
      topReady.current = false;
    }

    // SHOW conditions
    const pullingUp = delta < 0;
    const fastPullUp = delta < FAST_PULL_VELOCITY;

    if ((topReady.current && pullingUp) || fastPullUp) {
      setFiltersVisible(true);
      topReady.current = false;
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    }

    // HIDE when actually scrolling down away from top
    const movedAwayFromTop = y > TOP_THRESHOLD_PX;
    const scrollingDown = delta > 0;

    if (filtersVisible && movedAwayFromTop && scrollingDown) {
      if (!hideTimer.current) {
        hideTimer.current = setTimeout(() => {
          setFiltersVisible(false);
          hideTimer.current = null;
        }, HIDE_DEBOUNCE_MS);
      }
    }

    lastY.current = y;
  };

  if (!filterData || filterDataIsLoading) {
    return (
      <IonPage>
        <IonContent>
          <div style={{ marginTop: "100pt" }}>
            <LoadingCard />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!filterData.created_profile) {
    return (
      <IonPage>
        <IonContent>
          <IonRow className="page-title bigger">
            <img className="color-invertible" src="../static/img/discovery.png" alt="discovery" />
          </IonRow>
          <IonCard className="prelaunch">
            <IonCardTitle style={{ fontWeight: 'normal' }}>
              You’ll need a Personal Profile before browsing Discovery.
            </IonCardTitle>
            <IonCardContent>
              <p style={{ marginTop: 0 }}>Finish setting up your Personal Profile to unlock Discovery and start making one-on-one connections.</p>
              <IonButton onClick={() => presentPersonalProfile()} expand="block" color="primary">
                Create Personal Profile
              </IonButton>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonPage>
    );
  }

  if (filterData.deactivated_profile || filterData.paused_profile) {
    return (
      <IonPage>
        <IonContent>
          <IonRow className="page-title bigger">
            <img className="color-invertible" src="../static/img/discovery.png" alt="discovery" />
          </IonRow>
          <CantAccessCard tabName="Discovery" />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent
        fullscreen
        scrollEvents
        forceOverscroll
        onIonScroll={onScroll}
        className={`picks-offset ${filtersVisible ? 'filters-visible' : ''}`}
      >
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
        {showFiltersDialog && (
          <div className="picks-filters-overlay">
            <div className="picks-filters-dialog-center">
              <IonCard className="picks-filters-dialog-card">
                <IonCardContent>
                  <div className="picks-filters-dialog-title">
                    Filter anytime.
                  </div>
                  <IonText>
                    Filters are always available by scrolling to the top or bottom of this page. 
                  </IonText>
                  <IonRow className="picks-filters-dialog-actions">
                    <IonButton
                      color="primary"
                      onClick={openAdvancedFilterModal}
                    >
                      Add filters now
                    </IonButton>
                    <IonButton
                      fill="clear"
                      onClick={markFiltersTipSeen}
                    >
                      Maybe later
                    </IonButton>
                  </IonRow>
                </IonCardContent>
              </IonCard>
            </div>
          </div>
        )}

        <div ref={picksTopRef}></div>

        {/* === STATE MACHINE: avoid infinite spinners === */}
        {(!ready && initialLoading) || filtersLoading || nextLoading ? (
          <div style={{ marginTop: "100pt" }}>
            <LoadingCard />
          </div>
        ) : picksError ? (
          <IonCard className="error">
            <IonCardTitle>Couldn’t load Discovery</IonCardTitle>
            <IonCardContent>
              <IonButton onClick={() => picksRefetch()} color="primary">
                Try again
              </IonButton>
            </IonCardContent>
          </IonCard>
        ) : noProfiles ? (
          <>
            <IonRow className="page-title bigger">
              <img className="color-invertible" src="../static/img/discovery.png" alt="discovery" />
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
            <IonCard className="out-of-profiles">
              <IonRow className="ion-justify-content-center spinning-flower-wrapper">
                <img
                  className={buttonLoading ? "flower-mask spin" : "flower-mask"}
                  src="../static/img/flower-mask.png"
                  alt="refresh-mask"
                />
              </IonRow>
              <IonRow className="picks-buttons">
                <IonButton
                  className="clearfilters"
                  onClick={extraTimeWithRefetch}
                  disabled={buttonLoading}
                >
                  {buttonLoading ? "Refreshing..." : "Discover new connections"}
                </IonButton>
              </IonRow>
            </IonCard>
          </>
        ) : hasProfile ? (
          <>
            <div className={`profile-card-container${reduceAnimations ? ' no-animation' : ''}`} key={profileDetails?.user}>
              <ProfileCard
                cardData={profileDetails}
                pro={isPersonalPlus(filterData.subscription_level)}
                settingsAlt={filterData.settings_alt_text}
              />
            </div>
            <IonRow className="ion-justify-content-center">
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
                <IonFabButton color="danger" disabled={buttonLoading} onClick={() => blockProfile(profileDetails.user, () => addBlockedConnection(profileDetails.user))} data-label="Block">
                  <IonIcon icon={squareIcon}></IonIcon>
                </IonFabButton>
                <IonFabButton color="dark" disabled={buttonLoading} onClick={() => handleReportOpen(profileDetails.name, profileDetails.user)} data-label="Report">
                  <IonIcon icon={alertIcon}></IonIcon>
                </IonFabButton>
              </IonFabList>
            </IonFab>

            {!reduceAnimations && <IconPop
              trigger={showMessagePop}
              position="center"
              emojis={['🧡']}
              icons={[faCommentHeart]}
              intensity="big"
              onComplete={() => setShowMessagePop(false)}
            />}
          </>
        ) : (
          <div style={{ marginTop: "100pt" }}>
            <LoadingCard />
          </div>
        )}

        {picksStatus?.active && (picksStatus?.header || picksStatus?.message) && isBeforeExpiration && (
          <StatusToast isToastOpen={true} setIsToastOpen={setIsToastOpen} header={picksStatus.header} message={picksStatus.message} />
        )}
      </IonContent>
    </IonPage>
  );
};

export default Picksv2;
