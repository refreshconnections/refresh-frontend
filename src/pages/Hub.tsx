import { IonButton, IonCard, IonCardContent, IonCardTitle, IonCol, IonContent, IonItem, IonLabel, IonList, IonNote, IonPage, IonRow, IonText } from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faBoltLightning, faHammer, faPaperPlane, faSparkles } from '@fortawesome/pro-solid-svg-icons';
import { useGetInterestedEvents, useGetInterestedPosts } from '../hooks/api/interests';
import { useGetMegathreads } from '../hooks/api/refreshments/megathreads';
import PostSuggestionMini from '../components/PostSuggestionMini';
import './Page.css';
import './Hub.css';

const Hub: React.FC = () => {
  const [interestedPostsPage, setInterestedPostsPage] = useState(1);
  const [interestedEventsPage, setInterestedEventsPage] = useState(1);
  const [displayedInterestedPosts, setDisplayedInterestedPosts] = useState<any[]>([]);
  const [displayedInterestedEvents, setDisplayedInterestedEvents] = useState<any[]>([]);

  const interestedPosts = useGetInterestedPosts(interestedPostsPage).data;
  const interestedEvents = useGetInterestedEvents(interestedEventsPage).data;
  const megathreads = useGetMegathreads('').data ?? [];

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

  const upcomingInterestedEvents = useMemo(
    () => displayedInterestedEvents
      .filter((event) => moment(event.start_datetime).isSameOrAfter(moment()))
      .sort((a, b) => moment(a.start_datetime).valueOf() - moment(b.start_datetime).valueOf())
      .slice(0, 5),
    [displayedInterestedEvents]
  );

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

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonRow className="page-title bigger">
          <IonText className="hub-page-title">Hub</IonText>
        </IonRow>

        <IonRow className="hub-section-row">
          <IonCol size="12" sizeMd="6">
            <IonCard className="hub-section-card hub-white-card">
              <IonCardContent>
                <IonCardTitle>
                  <FontAwesomeIcon icon={faBoltLightning} /> &nbsp; Upcoming events
                </IonCardTitle>
                <IonNote className="hub-section-note">
                  Events you marked as interested that are coming up soon.
                </IonNote>
                {upcomingInterestedEvents.length ? (
                  <IonList lines="none" className="hub-interest-list">
                    {upcomingInterestedEvents.map((event) => (
                      <IonItem
                        color="white"
                        key={event.id}
                        button
                        detail
                        routerLink={`/community?calendarDate=${moment(event.start_datetime).format('YYYY-MM-DD')}`}
                      >
                        <IonLabel className="ion-text-wrap">
                          <h3>{event.name}</h3>
                          <p>{moment(event.start_datetime).format('MMM D, h:mm A')}</p>
                          <p>{event.location || event.event_type || 'Community event'}</p>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                ) : (
                  <IonNote color="medium">No upcoming interested events yet.</IonNote>
                )}
                {interestedEvents?.next ? (
                  <IonButton size="small" fill="outline" onClick={() => setInterestedEventsPage(interestedEventsPage + 1)}>
                    See more events
                  </IonButton>
                ) : null}
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="12" sizeMd="6">
            <IonCard className="hub-section-card hub-white-card hub-tips-section-card">
              <IonCardContent>
                <IonCardTitle>
                  <FontAwesomeIcon icon={faHammer} /> &nbsp; Tips
                </IonCardTitle>
                <IonCard className="hub-tip-card hub-white-card">
                  <IonCardContent>
                    <IonText className="hub-tip-card-title">Tips placeholder</IonText>
                    <IonNote className="hub-tip-card-copy">
                      Backend content source still to come.
                    </IonNote>
                  </IonCardContent>
                </IonCard>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonRow className="hub-section-row">
          <IonCol size="12" sizeMd="6">
            <IonCard className="hub-section-card hub-white-card">
              <IonCardContent>
                <IonCardTitle>
                  <FontAwesomeIcon icon={faSparkles} /> &nbsp; Interested posts
                </IonCardTitle>
                <IonNote className="hub-section-note">
                  Posts you marked to come back to.
                </IonNote>
                {displayedInterestedPosts.length ? (
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
                  <IonNote color="medium">No interested posts yet.</IonNote>
                )}
                {interestedPosts?.next ? (
                  <IonButton size="small" fill="outline" onClick={() => setInterestedPostsPage(interestedPostsPage + 1)}>
                    See more posts
                  </IonButton>
                ) : null}
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="12" sizeMd="6">
            <IonCard className="hub-section-card hub-white-card">
              <IonCardContent>
                <IonCardTitle>
                  <FontAwesomeIcon icon={faPaperPlane} /> &nbsp; Megathreads
                </IonCardTitle>
                <IonNote className="hub-section-note">
                  Ongoing conversations with the most recent activity.
                </IonNote>
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
