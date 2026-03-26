import { IonContent, RefresherEventDetail, IonHeader, IonCard, IonCardContent, IonPage, IonTitle, IonToolbar, IonCardTitle, IonCardSubtitle, IonButton, IonText, IonFab, IonFabButton, IonIcon, IonRow, IonModal, IonButtons, IonItem, IonLabel, IonList, IonCheckbox, IonInput, IonRefresher, IonRefresherContent, IonFabList, useIonAlert, useIonModal, IonNote, IonCol, IonChip, IonAccordionGroup, IonAccordion, IonAlert, IonActionSheet, IonAvatar, IonSpinner, useIonRouter } from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react'
import { arrowDown, close } from 'ionicons/icons';

import "./Page.css"
import "./Community.css"

import { getAvatarDisplay, getRandomProfileList, updateCurrentUserProfile, updateOutgoingConnections, updateDismissedConnections, updateBlockedConnections, getProfileAnnouncementLikes, likeAnnouncement, unlikeAnnouncement, onImgError, createAnnouncement, addToHiddenPosts, addToHiddenAuthors, getAllAnnouncementsAtOnce, isCommunityPlus } from '../hooks/utilities';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as heartOutline } from '@fortawesome/pro-regular-svg-icons';
import { faComments } from '@fortawesome/pro-regular-svg-icons/faComments';
import { faArrowLeft } from '@fortawesome/pro-solid-svg-icons/faArrowLeft';
import { faArrowRight } from '@fortawesome/pro-solid-svg-icons/faArrowRight';
import { faLinkSimple} from '@fortawesome/pro-solid-svg-icons/faLinkSimple';
import { faBarsFilter } from '@fortawesome/pro-solid-svg-icons/faBarsFilter';
import { faMegaphone } from '@fortawesome/pro-solid-svg-icons/faMegaphone';
import { faHeart as heartFull } from '@fortawesome/pro-solid-svg-icons/faHeart';
import { faCircleEllipsis } from '@fortawesome/pro-solid-svg-icons/faCircleEllipsis';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { useGetCurrentProfile } from "../hooks/api/profiles/current-profile";
import { dismissNotification, useGetRecentNotifications } from "../hooks/api/profiles/recent-notifications";
import { userQueryKeys } from "../hooks/api/profiles/user-query-keys";
import { useQueryClient } from "@tanstack/react-query";


import CreatePostModal from '../components/CreatePostModal';
import CommunityBlockMigrationModal from '../components/CommunityBlockMigrationModal';
import PostDetails from './PostDetails';
import ReportModal from '../components/ReportModal';
import CommunityProfileModal from '../components/CommunityProfileModal';
import { faSubtitles } from '@fortawesome/pro-regular-svg-icons/faSubtitles';
import { useGetAllAnnouncementsTake1Fn } from '../hooks/api/announcements-take-1/all-anns';


const Community: React.FC = () => {

  const router = useIonRouter();
  const [myLikes, setMyLikes] = useState<any>(null);

  const [pageUrl, setPageUrl] = useState<string>("");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const tagsFilterChecked: string[] = filterTags;

  const [altShow, setAltShow] = useState<number | null>(null);

  const [showComments, setShowComments] = useState<number | null>(null);
  const [postActionsOpen, setPostActionsOpen] = useState<number | null>(null);

  const [showPostOverride, setShowPostOverride] = useState<number[]>([]);

  const [showStoreAlert, setShowStoreAlert] = useState(false);

  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<any>(false);

  const [offendingId, setOffendingId] = useState<number | null>(null);
  const [offendingTitle, setOffendingTitle] = useState<string | null>(null);

  const refreshmentsTopRef = useRef<null | HTMLDivElement>(null)
  const commentInputRef = useRef<null | HTMLDivElement>(null)
  const postRefs = useRef<any[]>([])


  const [communityProfileUserId, setCommunityProfileUserId] = useState<number | null>(null);
  const [communityProfileAnonymous, setCommunityProfileAnonymous] = useState<boolean>(false);
  const [communityProfileAvatar, setCommunityProfileAvatar] = useState<string | null>(null);

  const [littleLoading, setLittleLoading] = useState<boolean>(false);

  const [more, setMore] = useState<number | null>(null);

  const [showMigrationModal, setShowMigrationModal] = useState(false);

  const modal = useRef<HTMLIonModalElement>(null);

  const queryClient = useQueryClient()
  const me = useGetCurrentProfile().data
  const data = useGetAllAnnouncementsTake1Fn().data
  const refreshmentsAlerts = useGetRecentNotifications('refreshments_alert').data || []
  const [dismissingAlertId, setDismissingAlertId] = useState<number | null>(null)
  const activeRefreshmentsAlerts = refreshmentsAlerts.filter((item: any) => item?.show_refreshments === true)
  const topRefreshmentsAlert = activeRefreshmentsAlerts[0]

  const handleDismissRefreshmentsAlert = async (notificationId: number) => {
    setDismissingAlertId(notificationId)
    try {
      await dismissNotification(notificationId, 'refreshments')
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.notifications })
    } finally {
      setDismissingAlertId(null)
    }
  }

  useEffect(() => {
    if (!me) return;
    const hasBlocks = (me.blocked_connections?.length ?? 0) > 0;
    const hasCommunityBlocks = (me.community_blocked?.length ?? 0) > 0;
    if (!hasBlocks || hasCommunityBlocks) return;

    Preferences.get({ key: 'community_block_migration_shown' }).then(({ value }) => {
      if (!value) setShowMigrationModal(true);
    });
  }, [me]);

  function dismiss() {
    modal.current?.dismiss();
  }

  const scrollToTop = () => {

    refreshmentsTopRef.current?.scrollIntoView({
      behavior: "auto",
      block: "start"
    })
  }

  const scrollToCommentInput = () => {

    commentInputRef.current?.scrollIntoView({
      behavior: "auto",
      block: "end"
    })
  }

  const scrollToBottomCurrentPost = (int) => {
    console.log("post regs", postRefs)

    console.log("data", data?.results)
    console.log("int", int)

    var postIndex = data?.results.findIndex(p => p.id == int);

    console.log("*", postIndex)

    postRefs.current[postIndex].scrollIntoView({
      behavior: "auto",
      block: "center"
    })
  }


  useEffect(() => {

    // const listen = async () => {
    //   App.addListener('resume', async () => {
    //     console.log('Returned focus. Reloading.')
    //     setShowComments(null)
    //     queryClient.invalidateQueries({ queryKey: ['ann'] })    });
    // }

    // listen();

    const fetchData = async () => {
      setError(null);
      setLoading(true);
      try {
        queryClient.invalidateQueries({ queryKey: ['ann'] })
        // setData(await getAnnouncements(pageUrl, filterTags));
        setLoading(false);
      } catch (error: any) {
        setError(error.message);
        setLoading(false)
        console.log(error)
      }

    }

    fetchData();
    console.log("ann", data)

  }, []);

  useEffect(() => {

    const fetchData = async () => {
      setError(null);
      setLoading(true);
      try {
        queryClient.invalidateQueries({ queryKey: ['ann'] })
        // setData(await getAnnouncements(pageUrl, filterTags));
        setLoading(false);
        scrollToTop();
      } catch (error: any) {
        setError(error.message);
        setLoading(false)
        console.log(error)
      }

    }

    fetchData();




  }, [pageUrl]);

  const likePost = async (announcement_id: number) => {
    const response = await likeAnnouncement(announcement_id)

    // TODO: better way to update heart
    // setData(await getAnnouncements(pageUrl, filterTags));
    queryClient.invalidateQueries({ queryKey: ['ann'] })

    return response
  }

  const unlikePost = async (announcement_id: number) => {
    const response = await unlikeAnnouncement(announcement_id)

    // TODO: better way to update heart
    // setData(await getAnnouncements(pageUrl, filterTags));
    queryClient.invalidateQueries({ queryKey: ['ann'] })
    return response
  }

  const [createPostPresent, createPostDismiss] = useIonModal(CreatePostModal, {
    preferred_name: me?.name,
    username: me?.username,
    onGoToSubmissions: () => router.push('/community/submitted'),
    onDismiss: (data: string, role: string) => createPostDismiss(data, role),
  });

  const handleReportOpen = async () => {
    createReportPresent()
  }

  const [createReportPresent, createReportDismiss] = useIonModal(ReportModal, {
    offender: "announcement",
    id: offendingId,
    text: offendingTitle,
    onDismiss: (data: string, role: string) => createReportDismiss(data, role),
  });


  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    setLittleLoading(true)
    setTimeout(async () => {
      // setData(await getAnnouncements(pageUrl, filterTags));
      queryClient.invalidateQueries({ queryKey: ['ann'] })
      event.detail.complete();
      setLittleLoading(false)
    }, 2000);
  }

  //Adds the checkedbox to the array and check if you unchecked it
  const addTagsFilterCheckbox = (event: any) => {
    if (event.detail.checked) {
      tagsFilterChecked.push(event.detail.value);
    } else {
      let index = removeTagsFilterCheckedFromArray(event.detail.value);
      tagsFilterChecked.splice(index, 1);
    }
  }

  //Removes checkbox from array when you uncheck it
  const removeTagsFilterCheckedFromArray = (checkbox: string) => {
    return tagsFilterChecked.findIndex((category: string) => {
      return category === checkbox;
    })
  }

  const saveFilters = async () => {
    console.log("tags FC", tagsFilterChecked)
    setFilterTags(tagsFilterChecked)
    setPageUrl("")
    dismiss();
    setTimeout(async () => {
      // setData(await getAnnouncements(pageUrl, filterTags));
      queryClient.invalidateQueries({ queryKey: ['ann'] })
    }, 2000);
  }

  const commentStuff = async (thePostNumber: number) => {
    scrollToBottomCurrentPost(thePostNumber)
    setShowComments(null)
  }

  const handleCloseComments = async () => {
    await commentStuff(showComments!)
   
    setTimeout(async () => {
      // setData(await getAnnouncements(pageUrl, filterTags));
      queryClient.invalidateQueries({ queryKey: ['ann'] })
    }, 1000);

  }

  const hidePostHandler = async () => {
    setShowPostOverride([])
    const response = await addToHiddenPosts(postActionsOpen)
    console.log("hide post response", response)
    setTimeout(async () => {
      queryClient.invalidateQueries({ queryKey: ['current'] })
    }, 1000);
  }

  const hideAuthorHandler = async () => {
    setShowPostOverride([])
    const response = await addToHiddenAuthors(postActionsOpen)
    console.log("hide author response", response)
    setTimeout(async () => {
      queryClient.invalidateQueries({ queryKey: ['current'] })
    }, 1000);
  }


  const handlePostDetailSetting = async (id: number, title: string) => {
    setPostActionsOpen(id)
    setOffendingId(id)
    setOffendingTitle(title)
  }

  const [communityProfilePresent, communityProfileDismiss] = useIonModal(CommunityProfileModal, {
    userId: communityProfileUserId,
    isAnonymous: communityProfileAnonymous,
    avatarUrl: communityProfileAvatar,
    onDismiss: () => {
      setCommunityProfileUserId(null);
      setCommunityProfileAnonymous(false);
      setCommunityProfileAvatar(null);
      communityProfileDismiss();
    },
  });

  const openModal = (id: number, isAnonymous: boolean, avatarUrl?: string | null) => {
    if (isAnonymous) return;
    setCommunityProfileUserId(id);
    setCommunityProfileAnonymous(isAnonymous);
    setCommunityProfileAvatar(avatarUrl ?? null);
  };

  useEffect(() => {
    if (communityProfileUserId !== null) {
      communityProfilePresent({
        showBackdrop: false,
        backdropDismiss: true,
        initialBreakpoint: 0.8,
        handleBehavior: 'none',
        expandToScroll: false,
        cssClass: 'community-profile-modal',
      });
    }
  }, [communityProfileUserId, communityProfilePresent]);

  return (
    <IonPage>
      <CommunityBlockMigrationModal
        isOpen={showMigrationModal}
        onDismiss={() => {
          setShowMigrationModal(false);
          Preferences.set({ key: 'community_block_migration_shown', value: 'true' });
        }}
      />
      <IonContent>

        <IonRow className="page-title">
          <img src="../static/img/refreshments.png" alt="refreshments" className="dark-dont-show"/>
          <img src="../static/img/refreshments-white.png" alt="refreshments" className="dark-show"/>
          <div ref={refreshmentsTopRef}></div>
        </IonRow>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        {topRefreshmentsAlert ? (
          <IonRow className="refreshments-alert-row">
            <IonCol size="12">
              <IonCard className="refreshments-alert-card">
                <IonCardContent>
                  <IonRow className="refreshments-alert-content">
                    <IonCol className="refreshments-alert-text" size="11">
                      <IonText>{topRefreshmentsAlert.message}</IonText>
                    </IonCol>
                    <IonCol className="refreshments-alert-action" size="1">
                      <IonButton
                        fill="clear"
                        size="small"
                        disabled={dismissingAlertId === topRefreshmentsAlert.id}
                        onClick={() => handleDismissRefreshmentsAlert(topRefreshmentsAlert.id)}
                        aria-label="Dismiss alert"
                        className="refreshments-alert-dismiss"
                      >
                        {dismissingAlertId === topRefreshmentsAlert.id ? <IonSpinner name="dots" /> : <IonIcon icon={close} />}
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        ) : null}
        {littleLoading ? <IonRow className="ion-justify-content-center"><IonSpinner name="dots"></IonSpinner></IonRow> : <></>}
        <IonRow className="filter-buttons">
          {/* <IonButton id="community-open-modal">
            <FontAwesomeIcon icon={faBarsFilter} />
          </IonButton> */}
          <IonCol className="filter-column">

            {filterTags.length === 0 ? <IonText color="gray">Showing all posts</IonText> :
              <>
                <IonText color="light">
                  Filter by: &nbsp;
                </IonText>
                {filterTags.map((item, index) => (
                  <IonChip key={index}>{item}</IonChip>
                ))}
              </>
            }
          </IonCol>
          {isCommunityPlus(me?.subscription_level) && me?.settings_create_posts ?
            <IonButton color="tertiary" onClick={() => createPostPresent()}>
              <FontAwesomeIcon icon={faMegaphone} />
            </IonButton>
            : isCommunityPlus(me?.subscription_level) && !me?.settings_create_posts ?
            <></>
            :
            <>
              <IonButton color="tertiary" onClick={() => setShowStoreAlert(true)}>
                <FontAwesomeIcon icon={faMegaphone} />
              </IonButton>
              <IonAlert
                isOpen={showStoreAlert}
                onDidDismiss={() => setShowStoreAlert(false)}
                header="Increase your streak to create your own post!"
                subHeader="Or become a Refresh Pro!"
                buttons={[{
                  text: "Not now",
                  role: 'destructive'
                },
                {
                  text: 'What is my streak?',
                  handler: async () => {
                      router.push("/activity")
                  }
                },
                {
                  text: 'Get Pro!',
                  handler: async () => {
                    router.push("/store")
                  }
                }]}
              />
            </>}
        </IonRow>
        {data ?
          <IonRow className="margin-top-bottom">
            {data?.results.map((item: any, index: number) => (
              <IonCard key={index} className="post-card">
                {!showPostOverride.includes(item.id) && (me?.hidden_announcements?.includes(item.id) || me?.hidden_authors?.includes(item.user))?
                <>
                <IonRow className="ion-justify-content-center">
                <IonText>You have hidden this post and/or author.</IonText>
                </IonRow> 
                
                <IonRow className="ion-justify-content-center">
                <IonButton size="small" onClick={()=>setShowPostOverride(showPostOverride => [...showPostOverride,item.id] )}>Show anyway</IonButton>
                </IonRow>
                </>
                :
                !showPostOverride.includes(item.id) && (item.sensitive && !me?.settings_show_sensitive_content)?
                <>
                <IonRow className="ion-justify-content-center">
                <IonText>This post contains sensitive content.</IonText>
                </IonRow> 
                
                <IonRow className="ion-justify-content-center">
                <IonButton size="small" onClick={()=>setShowPostOverride(showPostOverride => [...showPostOverride,item.id] )}>Show anyway</IonButton>
                <IonButton size="small" fill="outline" routerLink="/settings">Update sensitivity settings</IonButton>
                </IonRow>
                </>
                :
                item.removed ?
                <>
                <IonRow className="ion-justify-content-center">
                <IonText>This post has been removed.</IonText>
                </IonRow> 
                {item.removed_reason ?
                <IonRow className="ion-justify-content-center">
                <IonText>Reason for removal: {item.removed_reason}</IonText>
                </IonRow>
                : <></>}
                </>
                :
                <>
                <IonRow className="ion-justify-content-end">
                <IonCol size="11">
                <IonCardTitle>
                  {item.title}
                </IonCardTitle>
                </IonCol>
                <IonCol size="1">
                <IonButton fill="clear" size="small" onClick={() => handlePostDetailSetting(item.id, item.title)}><FontAwesomeIcon icon={faCircleEllipsis} /></IonButton>
                </IonCol>
                </IonRow>
                {item.coverPhoto !== null ? 
                <div style={{position: "relative"}}>
                <img alt={item.coverPhoto_alt ||"Cover Photo"} src={item.coverPhoto} onError={(e) => onImgError(e)}></img> 
                  {altShow === item.id ?
                    <IonRow className="show-alt-coverPhoto">
                        <IonText>{item.coverPhoto_alt}</IonText>
                    </IonRow>
                    : <></>}
                </div>
                : <></>}
                <IonCardSubtitle>
                  <IonRow className="ion-align-items-center">
                    <IonCol
                      size="5"
                      onClick={() =>
                        item?.user
                          ? openModal(
                              item.user,
                              !item.include_profile || !item.byline || String(item.byline).toLowerCase() === 'anonymous',
                              item.profile_image ? getAvatarDisplay({ profileImage: item.profile_image, viewerConnect: me?.settings_community_profile, authorConnect: item.settings_community_profile }).src : null
                            )
                          : null
                      }
                    >
                      <div className="display-flex">
                      {(() => {
                        const isAnonymous = !item.include_profile || !item.byline || String(item.byline).toLowerCase() === 'anonymous';
                        const avatarDisplay = getAvatarDisplay({
                          profileImage: isAnonymous ? null : item.profile_image,
                          viewerConnect: me?.settings_community_profile,
                          authorConnect: item.settings_community_profile,
                          includeBylineClass: true,
                        });
                        return (
                          <IonAvatar className={avatarDisplay.className}>
                            <img
                              src={avatarDisplay.src}
                              onError={(e) => onImgError(e)}
                            />
                          </IonAvatar>
                        );
                      })()}
                      <IonText>
                        By {(!item.include_profile || !item.byline || String(item.byline).toLowerCase() === 'anonymous')
                          ? "Anonymous"
                          : (item.username || item.byline)}
                      </IonText>
                      </div>
                    </IonCol>
                    <IonCol size="3" className="justify-center">
                      {item.link ?
                        <IonButton size="small" href={item.link} color="light">
                          <FontAwesomeIcon icon={faLinkSimple} />
                        </IonButton>
                        : <></>}
                    </IonCol>

                    <IonCol size="4" className="justify-end">
                      <div>
                      <IonRow>
                      {item.uploadDate}
                      </IonRow>
                      {me?.settings_alt_text && item.coverPhoto !== null && item.coverPhoto_alt !== '' && item.coverPhoto_alt !== null ?
                      <IonRow className="ion-justify-content-end">
                    <IonButton className="alt-coverPhoto-button" fill="clear" size="small"  onClick={altShow !== item.id ? () => setAltShow(item.id) : () => setAltShow(null)}>
                        <FontAwesomeIcon icon={faSubtitles} />
                        </IonButton>
                        </IonRow>
                        : <></>}
                      </div>
                    </IonCol>
                  </IonRow>
                </IonCardSubtitle>
                {item.content.length <= 1200?
                <IonCardContent className="css-fix">
                  {item.content}
                </IonCardContent>
                :
                <IonCardContent className="css-fix">
                  <div className={!(more == item.id) ? "setmax" : ""}>
                  {item.content}
                  </div>
                  {more == item.id?
                  // <IonButton style={{marginTop: "15pt"}} size="small" onClick={()=>setMore(null)}>
                  //   See less
                  // </IonButton>
                  <></>
                  :
                  <IonButton style={{marginTop: "15pt"}} size="small" onClick={() =>setMore(item.id)}>Read more</IonButton>
                    } 
                  </IonCardContent>}
               
                <IonRow>{item?.tags.map((tag: string, index: number) => (<IonChip>{tag}</IonChip>))}</IonRow>
                <IonRow className="post-likes">
                <div ref={(el) => (postRefs.current[index] = el!)}></div>
                  <IonCol>
                    <IonRow>
                      {me?.user && item.liked_by.includes(me?.user) ?
                        <IonButton size="small" fill="clear" onClick={() => unlikePost(item.id)}><FontAwesomeIcon color="red" icon={heartFull} /></IonButton> :
                        <IonButton size="small" fill="clear" onClick={() => likePost(item.id)}><FontAwesomeIcon icon={heartOutline} /></IonButton>}
                      {item.liked_by.length > 0 ?
                        <IonText>{item.liked_by.length}</IonText>
                        : <></>}
                    </IonRow>
                  </IonCol>
                  <IonCol>
                    <IonRow>
                      <IonButton size="small" fill="clear" onClick={showComments == item.id ? () => setShowComments(null) : () => setShowComments(item.id)}><FontAwesomeIcon icon={faComments} /></IonButton>
                      {/* <IonButton size="small" fill="clear"  href={"/community/" + item.id}><FontAwesomeIcon icon={faComments}/></IonButton> */}
                      {item.comments.length > 0 ?
                        <IonText>{item.comments.length}</IonText>
                        : <></>}
                    </IonRow>
                  </IonCol>
                </IonRow>
                {showComments == item.id ?
                  <>
                    <PostDetails comments={item.comments} announcement_id={item.id} />
                    <div ref={commentInputRef}>
                      <IonRow className="hide">
                        <IonButton size="small" fill="clear" onClick={handleCloseComments}>Hide comments </IonButton>
                      </IonRow>
                    </div>
                  </>
                  : <></>}
                  </>
                }
              </IonCard>
              
            ))
            
            }
            {/* <IonRow className="controls">
              <IonButton disabled={data?.previous == null} onClick={() => setPageUrl(data?.previous)}>
                <FontAwesomeIcon icon={faArrowLeft} /> &nbsp; Back
              </IonButton>
              <IonButton disabled={data?.next == null} onClick={() => setPageUrl(data?.next)}>
                Next &nbsp; <FontAwesomeIcon icon={faArrowRight} />
              </IonButton>
            </IonRow> */}
          </IonRow>
          : <IonRow>
            <IonRow className="ion-justify-content-center">
            <img alt="loading-freshy" src="../static/img/arrowload.gif" style={{width: "40%"}}></img>
                </IonRow>

            </IonRow>}

        {/* {loading ? <LoadingCard /> : <CantAccessCard tabName="Picks" />} */}
        <IonModal id="filter-modal" ref={modal} trigger="community-open-modal">
          <IonContent>
            <IonToolbar>
              <IonTitle>Filters</IonTitle>
              <IonButtons slot="start">
                <IonButton onClick={() => dismiss()} color="white">
                  Close
                </IonButton>
              </IonButtons>
              <IonButtons slot="end">
                <IonButton onClick={async () => saveFilters()} color="white">
                  Save
                </IonButton>
              </IonButtons>
            </IonToolbar>
            <IonList>
              <IonItem>
                <IonLabel>
                  <p>Tags</p>
                </IonLabel>
                <IonList>
                  <IonItem>
                    <IonCheckbox slot="start" value="community" onIonChange={e => addTagsFilterCheckbox(e)} checked={filterTags.includes("community") ? true : false} />
                    Community
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="dating" onIonChange={e => addTagsFilterCheckbox(e)} checked={filterTags.includes("dating") ? true : false} />
                    Dating
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="friendship" onIonChange={e => addTagsFilterCheckbox(e)} checked={filterTags.includes("friendship") ? true : false} />
                    Friendship
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="info" onIonChange={e => addTagsFilterCheckbox(e)} checked={filterTags.includes("info") ? true : false} />
                    Info
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="kids" onIonChange={e => addTagsFilterCheckbox(e)} checked={filterTags.includes("kids") ? true : false} />
                    Kids
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="lgbtqia" onIonChange={e => addTagsFilterCheckbox(e)} checked={filterTags.includes("lgbtqia") ? true : false} />
                    LGBTQIA+
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="question" onIonChange={e => addTagsFilterCheckbox(e)} checked={filterTags.includes("question") ? true : false} />
                    Question
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="men" onIonChange={e => addTagsFilterCheckbox(e)} checked={filterTags.includes("men") ? true : false} />
                    Men
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="tip" onIonChange={e => addTagsFilterCheckbox(e)} checked={filterTags.includes("tip") ? true : false} />
                    Life Tip
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="vent" onIonChange={e => addTagsFilterCheckbox(e)} checked={filterTags.includes("vent") ? true : false} />
                    Vent
                  </IonItem>
                  <IonItem>
                    <IonCheckbox slot="start" value="women" onIonChange={e => addTagsFilterCheckbox(e)} checked={filterTags.includes("women") ? true : false} />
                    Women
                  </IonItem>
                </IonList>
              </IonItem>
            </IonList>
            {/* <div className="filter-clear-button">
                <IonButton onClick={clearFilters}>
                  Clear filters
                </IonButton>
              </div> */}
          </IonContent>
        </IonModal>
        {showComments !== null ?
        <>
          <IonFab slot="fixed" vertical="bottom" horizontal="end">
            <IonFabButton onClick={scrollToCommentInput}>
              <IonIcon icon={arrowDown}></IonIcon>
            </IonFabButton>
          </IonFab>
          <IonRow className="just-some-space"></IonRow>
        </>
          : <></>}
        <IonActionSheet
        isOpen={postActionsOpen !== null}
        header="What do you want to do about this post?"
        buttons={[
          {
            text: 'Report post',
            role: 'destructive',
            handler: () => {
              handleReportOpen()
            }
          },
          {
            text: 'Hide all posts by this author',
            handler: () => {
              hideAuthorHandler()
            }
          },
          {
            text: 'Hide post',
            handler: () => {
              hidePostHandler()
            }
          },
          {
            text: 'Nevermind',
            role: 'cancel',
            data: {
              action: 'cancel',
            },
          },
        ]}
        onDidDismiss={() => setPostActionsOpen(null)}
      ></IonActionSheet>
      </IonContent>
    </IonPage>
  );

};



export default Community;
