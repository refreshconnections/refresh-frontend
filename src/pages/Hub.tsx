import { IonButton, IonCard, IonCardContent, IonCardTitle, IonCol, IonContent, IonNote, IonPage, IonRow, IonText } from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCalendarStar, faComment, faReel, faStar } from '@fortawesome/pro-solid-svg-icons';
import { useHistory } from 'react-router';
import { useGetInterestedEvents, useGetInterestedPosts } from '../hooks/api/interests';
import { useGetMegathreads } from '../hooks/api/refreshments/megathreads';
import { useGetDailyTip } from '../hooks/api/tips';
import PostSuggestionMini from '../components/PostSuggestionMini';
import './Page.css';
import './Hub.css';

const Hub: React.FC = () => {
  const [interestedPostsPage, setInterestedPostsPage] = useState(1);
  const [interestedEventsPage, setInterestedEventsPage] = useState(1);
  const [displayedInterestedPosts, setDisplayedInterestedPosts] = useState<any[]>([]);
  const [displayedInterestedEvents, setDisplayedInterestedEvents] = useState<any[]>([]);
  const [showFlowerThanks, setShowFlowerThanks] = useState(false);
  const history = useHistory();

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
    if (!interestedEvents?.next) return;
    setInterestedEventsPage((prev) => prev + 1);
  }, [interestedEvents?.next]);

  useEffect(() => {
    if (!showFlowerThanks) return;
    const timeout = window.setTimeout(() => {
      setShowFlowerThanks(false);
    }, 7000);
    return () => window.clearTimeout(timeout);
  }, [showFlowerThanks]);

  const upcomingInterestedEvents = useMemo(() => {
    const now = moment();
    const twoWeeksOut = moment().add(14, 'days').endOf('day');

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

  const activeMegathreads = useMemo(
    () => megathreads.slice(0, 5),
    [megathreads]
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
    return start.format('ddd, MMM D • h:mm A');
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonRow className="page-title bigger">
          <IonText className="hub-page-title">Hub</IonText>
        </IonRow>

        <IonRow className="hub-section-row">
          <IonCol size="12">
            <IonCard className="hub-section-card hub-white-card">
              <IonCardContent>
                <IonCardTitle>
                  <FontAwesomeIcon icon={faCalendarStar} /> &nbsp; Upcoming events
                </IonCardTitle>
                {interestedEventsQuery.isLoading && interestedEventsPage === 1 ? (
                  <IonNote color="medium">Loading events...</IonNote>
                ) : upcomingInterestedEvents.length ? (
                  <div className="hub-events-strip" role="list" aria-label="Upcoming interested events">
                    {upcomingInterestedEvents.map((event) => (
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
                      <IonButton size="small" fill="outline" color="navy" routerLink="/community">
                        Open calendar
                      </IonButton>
                    </div>
                  </div>
                )}
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
                {dailyTip ? (
                  <IonCard className="hub-tip-card">
                    <div className="hub-tip-card-header">
                      <div className="hub-tip-card-header-title">Tip of the Day</div>
                    </div>
                    <div className="hub-tip-card-body">
                      <span className="hub-tip-card-title">{dailyTip.title}</span>
                      <span className="hub-tip-card-copy">{dailyTip.description}</span>
                      {dailyTip.link && (
                        <div className="hub-tip-card-button-row">
                          <IonButton fill="outline" color="navy" size="small" href={dailyTip.link} target="_blank" rel="noopener noreferrer">
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
                {interestedPostsQuery.isLoading && interestedPostsPage === 1 ? (
                  <IonNote color="medium">Loading posts...</IonNote>
                ) : displayedInterestedPosts.length ? (
                  <IonRow className="hub-mini-posts-row">
                    {displayedInterestedPosts.map((post) => (
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
                {interestedPosts?.next ? (
                  <IonButton size="small" fill="outline" onClick={() => setInterestedPostsPage(interestedPostsPage + 1)}>
                    See more posts
                  </IonButton>
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
                {activeMegathreads.length ? (
                  <IonRow className="hub-mini-posts-row">
                    {activeMegathreads.map((thread: any) => (
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
