import { IonButton, IonButtons, IonCard, IonCardContent, IonCardTitle, IonCol, IonContent, IonHeader, IonNote, IonPage, IonRow, IonSkeletonText, IonText, IonTitle, IonToolbar, useIonModal } from '@ionic/react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCalendarStar, faComment, faReel, faStar } from '@fortawesome/pro-solid-svg-icons';
import { useHistory } from 'react-router';
import { useGetInterestedEvents, useGetInterestedPosts, type InterestedPost } from '../hooks/api/interests';
import { useGetMegathreads } from '../hooks/api/refreshments/megathreads';
import { useGetDailyTip } from '../hooks/api/tips';
import PostSuggestionMini from '../components/PostSuggestionMini';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { isCommunityPlus, localTzAbbr, openExternalUrl } from '../hooks/utilities';
import type { RefreshEvent } from '../hooks/api/events';
import './Page.css';
import './Hub.css';

const HUB_VISIBLE_ITEMS = 3;
const HUB_MODAL_BATCH_SIZE = 10;

type HubMegathread = {
  id: number;
  title: string;
  preview?: string;
  content?: string;
  comment_count?: number;
  like_count?: number;
  category?: string;
  latest_activity_time?: string;
  uploadDateTime?: string;
};

type HubListModalProps<T extends { id: number }> = {
  title: string;
  emptyCopy: string;
  onDismiss: () => void;
  items: T[];
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void | Promise<void>;
  renderItem: (item: T) => ReactNode;
};

const HubListModal = <T extends { id: number }>({
  title,
  emptyCopy,
  onDismiss,
  items,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  renderItem,
}: HubListModalProps<T>) => (
    <IonPage>
      <IonHeader>
        <IonToolbar className="modal-title">
          <div className="hub-modal-title-bar">
            <span className="hub-modal-title-text">{title}</span>
          </div>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>Done</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
    <IonContent className="ion-padding">
      {items.length ? (
        <IonRow className="hub-modal-list">
          {items.map((item) => (
            <IonCol key={item.id} size="12">
              {renderItem(item)}
            </IonCol>
          ))}
        </IonRow>
      ) : (
        <IonNote color="medium">{emptyCopy}</IonNote>
      )}
      {hasMore && onLoadMore ? (
        isLoadingMore ? (
          <IonRow className="ion-justify-content-center hub-modal-loading-row">
            <IonSkeletonText animated style={{ width: '120px', height: '14px' }} />
          </IonRow>
        ) : (
          <IonRow className="ion-justify-content-center hub-section-action-row">
            <IonButton size="small" fill="outline" onClick={onLoadMore}>
              Load more
            </IonButton>
          </IonRow>
        )
      ) : null}
    </IonContent>
  </IonPage>
);

type HubInterestedEventsModalProps = {
  onDismiss: () => void;
  upcomingEvents: RefreshEvent[];
  pastEvents: RefreshEvent[];
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void | Promise<void>;
};

const HubInterestedEventsModal = ({
  onDismiss,
  upcomingEvents,
  pastEvents,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: HubInterestedEventsModalProps) => {
  const history = useHistory();

  const renderEventCard = (event: RefreshEvent) => {
    const dayTag = getEventDayTag(event.start_datetime);

    return (
      <button
        type="button"
        key={event.id}
        className="hub-event-preview hub-event-preview-modal"
        onClick={() => history.push(`/community?calendarDate=${moment(event.start_datetime).format('YYYY-MM-DD')}`)}
      >
        {dayTag ? (
          <span className={`hub-event-tag ${dayTag === 'TODAY' ? 'today' : 'tomorrow'}`}>
            {dayTag}
          </span>
        ) : null}
        <span className="hub-event-preview-title">{event.name}</span>
        <span className="hub-event-preview-datetime">{getEventDateTimeLabel(event.start_datetime)}</span>
      </button>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="modal-title">
          <div className="hub-modal-title-bar">
            <span className="hub-modal-title-text">Interested Events</span>
          </div>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>Done</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {upcomingEvents.length ? (
          <section className="hub-modal-section">
            <h2 className="hub-modal-section-title">Upcoming</h2>
            <div className="hub-modal-events-grid">
              {upcomingEvents.map((event) => renderEventCard(event))}
            </div>
          </section>
        ) : null}

        {pastEvents.length ? (
          <section className="hub-modal-section">
            <h2 className="hub-modal-section-title">Recent Past</h2>
            <IonNote color="medium" className="hub-modal-section-note">
              Past events are limited by your current subscription.
            </IonNote>
            <div className="hub-modal-events-grid">
              {pastEvents.map((event) => renderEventCard(event))}
            </div>
          </section>
        ) : null}

        {!upcomingEvents.length && !pastEvents.length ? (
          <IonNote color="medium">No interested events to show yet.</IonNote>
        ) : null}

      {hasMore && onLoadMore ? (
        isLoadingMore ? (
          <IonRow className="ion-justify-content-center hub-modal-loading-row">
            <IonSkeletonText animated style={{ width: '120px', height: '14px' }} />
          </IonRow>
        ) : (
          <IonRow className="ion-justify-content-center hub-section-action-row">
            <IonButton size="small" fill="outline" onClick={onLoadMore}>
              Load more
            </IonButton>
          </IonRow>
        )
      ) : null}
      </IonContent>
    </IonPage>
  );
};

const getEventDayTag = (startDatetime?: string | null) => {
  if (!startDatetime) return null;
  const start = moment(startDatetime);
  if (!start.isValid()) return null;
  if (start.isSame(moment(), 'day')) return 'TODAY';
  if (start.isSame(moment().add(1, 'day'), 'day')) return 'Tomorrow';
  return null;
};

const getEventDateTimeLabel = (startDatetime?: string | null) => {
  if (!startDatetime) return '';
  const start = moment(startDatetime);
  if (!start.isValid()) return '';
  const tz = localTzAbbr(startDatetime);
  return `${start.format('ddd, MMM D • h:mm A')}${tz ? ` ${tz}` : ''}`;
};

const Hub = () => {
  const [interestedPostsPage, setInterestedPostsPage] = useState(1);
  const [interestedEventsPage, setInterestedEventsPage] = useState(1);
  const [displayedInterestedPosts, setDisplayedInterestedPosts] = useState<InterestedPost[]>([]);
  const [displayedInterestedEvents, setDisplayedInterestedEvents] = useState<RefreshEvent[]>([]);
  const [visibleMegathreadsCount, setVisibleMegathreadsCount] = useState(HUB_MODAL_BATCH_SIZE);
  const [showFlowerThanks, setShowFlowerThanks] = useState(false);
  const history = useHistory();
  const profile = useGetCurrentProfile().data;

  const interestedPostsQuery = useGetInterestedPosts(interestedPostsPage);
  const interestedEventsQuery = useGetInterestedEvents(interestedEventsPage);
  const interestedPosts = interestedPostsQuery.data;
  const interestedEvents = interestedEventsQuery.data;
  const megathreads = useGetMegathreads('').data ?? [];
  const dailyTip = useGetDailyTip().data;

  useEffect(() => {
    if (!interestedPosts?.results) return;
    setDisplayedInterestedPosts((prev) => (
      interestedPostsPage === 1
        ? interestedPosts.results
        : [...prev, ...interestedPosts.results.filter((post) => !prev.some((existing) => existing.id === post.id))]
    ));
  }, [interestedPosts, interestedPostsPage]);

  useEffect(() => {
    if (!interestedEvents?.results) return;
    setDisplayedInterestedEvents((prev) => (
      interestedEventsPage === 1
        ? interestedEvents.results
        : [...prev, ...interestedEvents.results.filter((event) => !prev.some((existing) => existing.id === event.id))]
    ));
  }, [interestedEvents, interestedEventsPage]);

  useEffect(() => {
    if (!showFlowerThanks) return;
    const timeout = window.setTimeout(() => {
      setShowFlowerThanks(false);
    }, 7000);
    return () => window.clearTimeout(timeout);
  }, [showFlowerThanks]);

  const upcomingInterestedEvents = useMemo(() => {
    const now = moment();
    const twoWeeksOut = moment(now).add(14, 'days').endOf('day');

    const nextTwoWeeks = displayedInterestedEvents
      .filter((event) => {
        const start = moment(event.start_datetime);
        return start.isValid() && start.isSameOrAfter(now) && start.isSameOrBefore(twoWeeksOut);
      })
      .sort((a, b) => moment(a.start_datetime).valueOf() - moment(b.start_datetime).valueOf());

    const todayAndTomorrow = nextTwoWeeks.filter((event) => {
      const start = moment(event.start_datetime);
      return start.isSame(now, 'day') || start.isSame(moment(now).add(1, 'day'), 'day');
    });

    if (todayAndTomorrow.length > 5) {
      return todayAndTomorrow;
    }

    const remainingSlots = 5 - todayAndTomorrow.length;
    const laterEvents = nextTwoWeeks.filter((event) => {
      const start = moment(event.start_datetime);
      return !start.isSame(now, 'day') && !start.isSame(moment(now).add(1, 'day'), 'day');
    });

    return [...todayAndTomorrow, ...laterEvents.slice(0, remainingSlots)];
  }, [displayedInterestedEvents]);

  const visibleUpcomingInterestedEvents = useMemo(
    () => upcomingInterestedEvents.slice(0, HUB_VISIBLE_ITEMS),
    [upcomingInterestedEvents]
  );

  const pastInterestedEvents = useMemo(() => {
    const now = moment();
    const earliestPast = isCommunityPlus(profile?.subscription_level)
      ? moment().subtract(2, 'months').startOf('day')
      : moment().subtract(1, 'week').startOf('day');

    return displayedInterestedEvents
      .filter((event) => {
        const start = moment(event.start_datetime);
        return start.isValid() && start.isBefore(now) && start.isSameOrAfter(earliestPast);
      })
      .sort((a, b) => moment(b.start_datetime).valueOf() - moment(a.start_datetime).valueOf());
  }, [displayedInterestedEvents, profile?.subscription_level]);

  const allVisibleInterestedEvents = useMemo(
    () => [...upcomingInterestedEvents, ...pastInterestedEvents.filter((event) => !upcomingInterestedEvents.some((upcoming) => upcoming.id === event.id))],
    [pastInterestedEvents, upcomingInterestedEvents]
  );

  const activeMegathreads = useMemo(
    () => megathreads.slice(0, 5),
    [megathreads]
  );
  const visibleMegathreads = useMemo(
    () => activeMegathreads.slice(0, HUB_VISIBLE_ITEMS),
    [activeMegathreads]
  );
  const megathreadsForModal = useMemo(
    () => activeMegathreads.slice(0, visibleMegathreadsCount),
    [activeMegathreads, visibleMegathreadsCount]
  );
  const visibleInterestedPosts = useMemo(
    () => displayedInterestedPosts.slice(0, HUB_VISIBLE_ITEMS),
    [displayedInterestedPosts]
  );

  const getLatestActivityLabel = (thread: any) => {
    const latest = thread.latest_activity_time || thread.uploadDateTime;
    if (!latest) return 'Latest activity over a month ago';

    const latestMoment = moment(latest);
    if (!latestMoment.isValid()) return 'Latest activity over a month ago';

    if (latestMoment.isBefore(moment().subtract(1, 'month'))) {
      return 'Latest activity over a month ago';
    }

    return `Latest activity ${latestMoment.fromNow()}`;
  };

  const getPostActivityLabel = (post: any) => {
    const postedAt = post.uploadDateTime;
    if (!postedAt) return 'Posted over a month ago';

    const postedMoment = moment(postedAt);
    if (!postedMoment.isValid()) return 'Posted over a month ago';

    if ((post.comment_count ?? 0) > 0) {
      if (postedMoment.isBefore(moment().subtract(1, 'month'))) {
        return 'Latest activity over a month ago';
      }
      return `Latest activity ${postedMoment.fromNow()}`;
    }

    if (postedMoment.isBefore(moment().subtract(1, 'month'))) {
      return 'Posted over a month ago';
    }
    return `Posted ${postedMoment.fromNow()}`;
  };

  const handleFlowerClick = () => {
    setShowFlowerThanks((prev) => !prev);
  };

  const eventsLoading = interestedEventsQuery.isLoading && interestedEventsPage === 1;
  const postsLoading = interestedPostsQuery.isLoading && interestedPostsPage === 1;
  const tipLoading = !dailyTip;
  const [presentInterestedEventsModal, dismissInterestedEventsModal] = useIonModal(HubInterestedEventsModal, {
    upcomingEvents: upcomingInterestedEvents,
    pastEvents: pastInterestedEvents,
    hasMore: Boolean(interestedEvents?.next),
    isLoadingMore: interestedEventsQuery.isFetching && interestedEventsPage > 1,
    onLoadMore: () => setInterestedEventsPage((prev) => prev + 1),
    onDismiss: () => dismissInterestedEventsModal(),
  });
  const [presentInterestedPostsModal, dismissInterestedPostsModal] = useIonModal(HubListModal, {
    title: "Posts You're Interested In",
    emptyCopy: "No interested posts to show yet.",
    items: displayedInterestedPosts,
    hasMore: Boolean(interestedPosts?.next),
    isLoadingMore: interestedPostsQuery.isFetching && interestedPostsPage > 1,
    onLoadMore: () => setInterestedPostsPage((prev) => prev + 1),
    renderItem: (post: InterestedPost) => (
      <PostSuggestionMini
        post={post}
        className="hub-mini-post"
        routerLink={`/community/${post.id}`}
        showContent={false}
        showLikeCount={false}
        showCommentCount={true}
        customMeta={getPostActivityLabel(post)}
      />
    ),
    onDismiss: () => dismissInterestedPostsModal(),
  });
  const [presentMegathreadsModal, dismissMegathreadsModal] = useIonModal(HubListModal, {
    title: 'Megathreads',
    emptyCopy: 'No megathreads to show yet.',
    items: megathreadsForModal,
    hasMore: visibleMegathreadsCount < activeMegathreads.length,
    onLoadMore: () => setVisibleMegathreadsCount((prev) => prev + HUB_MODAL_BATCH_SIZE),
    renderItem: (thread: HubMegathread) => (
      <PostSuggestionMini
        post={thread}
        className="hub-mini-post"
        routerLink={`/community/${thread.id}`}
        showContent={false}
        showLikeCount={false}
        showCommentCount={true}
        customMeta={getLatestActivityLabel(thread)}
      />
    ),
    onDismiss: () => dismissMegathreadsModal(),
  });

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonRow className="page-title">
          <img className="color-invertible" src="../static/img/hub.png" alt="hub" />
        </IonRow>

        <IonRow className="hub-section-row hub-first-section-row">
          <IonCol size="12">
            <IonCard className="hub-section-card hub-white-card">
              <IonCardContent>
                <IonCardTitle>
                  <FontAwesomeIcon icon={faCalendarStar} /> &nbsp; Upcoming events you're interested in
                </IonCardTitle>
                {eventsLoading ? (
                  <div className="hub-events-strip" aria-hidden="true">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="hub-event-preview hub-event-preview-skeleton">
                        <IonSkeletonText animated style={{ width: '44px', height: '18px', borderRadius: '999px' }} />
                        <IonSkeletonText animated style={{ width: '78%', height: '16px' }} />
                        <IonSkeletonText animated style={{ width: '62%', height: '14px' }} />
                      </div>
                    ))}
                  </div>
                ) : visibleUpcomingInterestedEvents.length ? (
                  <div className="hub-events-strip" role="list" aria-label="Upcoming interested events">
                    {visibleUpcomingInterestedEvents.map((event) => (
                      <button
                        type="button"
                        key={event.id}
                        className="hub-event-preview"
                        onClick={() => history.push(`/community?calendarDate=${moment(event.start_datetime).format('YYYY-MM-DD')}`)}
                      >
                        {getEventDayTag(event.start_datetime) ? (
                          <span className={`hub-event-tag ${getEventDayTag(event.start_datetime) === 'TODAY' ? 'today' : 'tomorrow'}`}>
                            {getEventDayTag(event.start_datetime)}
                          </span>
                        ) : null}
                        <span className="hub-event-preview-title">{event.name}</span>
                        <span className="hub-event-preview-datetime">{getEventDateTimeLabel(event.start_datetime)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="hub-empty-state">
                    <IonNote color="medium" className="hub-empty-state-copy">
                      Use the Star <FontAwesomeIcon icon={faStar} /> to see events you&apos;re interested in here.
                    </IonNote>
                    <div className="hub-empty-state-action">
                      <IonButton size="small" fill="outline" color="navy" onClick={() => history.push(`/community?calendarDate=${moment().format('YYYY-MM-DD')}`)}>
                        Open calendar
                      </IonButton>
                    </div>
                  </div>
                )}
                {allVisibleInterestedEvents.length > HUB_VISIBLE_ITEMS || interestedEvents?.next ? (
                  <div className="hub-section-action-row">
                    <IonButton size="small" fill="outline" onClick={() => presentInterestedEventsModal()}>
                      See all events
                    </IonButton>
                  </div>
                ) : null}
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="12" className="hub-tips-col">
              {dailyTip ? (
                <>
                  {showFlowerThanks ? (
                    <button className="hub-tip-flower-chatbubble" type="button" onClick={handleFlowerClick}>
                      <FontAwesomeIcon icon={faComment} />
                      <span>Thank you for masking!</span>
                    </button>
                  ) : null}
                  <button className="hub-tip-flower-button" type="button" onClick={handleFlowerClick} aria-label="Show thank you message">
                    <img className="hub-tip-section-flower" src="../static/img/flower-mask.png" alt="" />
                  </button>
                </>
              ) : null}
            <IonCard className="hub-section-card hub-tips-section-card">
              <div>
                {tipLoading ? (
                  <IonCard className="hub-tip-card">
                    <div className="hub-tip-card-header">
                      <IonSkeletonText animated style={{ width: '120px', height: '20px' }} />
                    </div>
                    <div className="hub-tip-card-body">
                      <IonSkeletonText animated style={{ width: '58%', height: '16px', marginBottom: '6px' }} />
                      <IonSkeletonText animated style={{ width: '100%', height: '14px', marginBottom: '6px' }} />
                      <IonSkeletonText animated style={{ width: '92%', height: '14px', marginBottom: '10px' }} />
                      <IonSkeletonText animated style={{ width: '96px', height: '32px', borderRadius: '8px' }} />
                    </div>
                  </IonCard>
                ) : dailyTip ? (
                  <IonCard className="hub-tip-card">
                    <div className="hub-tip-card-header">
                      <div className="hub-tip-card-header-title">Tip of the Day</div>
                    </div>
                    <div className="hub-tip-card-body">
                      <span className="hub-tip-card-title">{dailyTip.title}</span>
                      <span className="hub-tip-card-copy">{dailyTip.description}</span>
                      {dailyTip.link && (
                        <div className="hub-tip-card-button-row">
                          <IonButton fill="outline" color="navy" size="small" onClick={() => openExternalUrl(dailyTip.link!)}>
                            {dailyTip.link_name || 'Learn more'}
                          </IonButton>
                        </div>
                      )}
                    </div>
                  </IonCard>
                ) : null}
              </div>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonRow className="hub-section-row">
          <IonCol size="12">
            <IonCard className="hub-section-card hub-white-card">
              <IonCardContent>
                <IonCardTitle>
                  <FontAwesomeIcon icon={faStar} /> &nbsp; Posts you're interested in
                </IonCardTitle>
                {postsLoading ? (
                  <IonRow className="hub-mini-posts-row">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <IonCol key={index} size="12" sizeMd="6">
                        <IonCard className="hub-mini-post hub-mini-post-skeleton">
                          <IonCardContent>
                            <IonSkeletonText animated style={{ width: '72%', height: '18px', marginBottom: '8px' }} />
                            <IonSkeletonText animated style={{ width: '100%', height: '14px', marginBottom: '6px' }} />
                            <IonSkeletonText animated style={{ width: '86%', height: '14px', marginBottom: '10px' }} />
                            <IonSkeletonText animated style={{ width: '44%', height: '12px' }} />
                          </IonCardContent>
                        </IonCard>
                      </IonCol>
                    ))}
                  </IonRow>
                ) : visibleInterestedPosts.length ? (
                  <IonRow className="hub-mini-posts-row">
                    {visibleInterestedPosts.map((post) => (
                      <IonCol key={post.id} size="12" sizeMd="6">
                        <PostSuggestionMini
                          post={post}
                          className="hub-mini-post"
                          routerLink={`/community/${post.id}`}
                          showContent={false}
                          showLikeCount={false}
                          showCommentCount={true}
                          customMeta={getPostActivityLabel(post)}
                        />
                      </IonCol>
                    ))}
                  </IonRow>
                ) : (
                  <div className="hub-empty-state">
                    <IonNote color="medium" className="hub-empty-state-copy">
                      Use the Star <FontAwesomeIcon icon={faStar} /> to see posts you&apos;re interested in here.
                    </IonNote>
                  </div>
                )}
                {displayedInterestedPosts.length > HUB_VISIBLE_ITEMS || interestedPosts?.next ? (
                  <div className="hub-section-action-row">
                    <IonButton size="small" fill="outline" onClick={() => presentInterestedPostsModal()}>
                      See all posts
                    </IonButton>
                  </div>
                ) : null}
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="12">
            <IonCard className="hub-section-card hub-white-card">
              <IonCardContent>
                <IonCardTitle>
                  <FontAwesomeIcon icon={faReel} /> &nbsp; Megathreads
                </IonCardTitle>
                {visibleMegathreads.length ? (
                  <IonRow className="hub-mini-posts-row">
                    {visibleMegathreads.map((thread: HubMegathread) => (
                      <IonCol key={thread.id} size="12" sizeMd="6">
                        <PostSuggestionMini
                          post={thread}
                          className="hub-mini-post"
                          routerLink={`/community/${thread.id}`}
                          showContent={false}
                          showLikeCount={false}
                          showCommentCount={true}
                          customMeta={getLatestActivityLabel(thread)}
                        />
                      </IonCol>
                    ))}
                  </IonRow>
                ) : (
                  <IonNote color="medium">No megathreads to show yet.</IonNote>
                )}
                {activeMegathreads.length > HUB_VISIBLE_ITEMS ? (
                  <div className="hub-section-action-row">
                    <IonButton size="small" fill="outline" onClick={() => presentMegathreadsModal()}>
                      See all megathreads
                    </IonButton>
                  </div>
                ) : null}
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonRow className="hub-section-row">
          <IonCol size="12">
            <div className="hub-change-action">
              <IonButton routerLink="/change" color="navy" expand="block">
                <FontAwesomeIcon icon={faArrowRight} /> &nbsp; Open Change
              </IonButton>
            </div>
          </IonCol>
        </IonRow>
      </IonContent>
    </IonPage>
  );
};

export default Hub;
