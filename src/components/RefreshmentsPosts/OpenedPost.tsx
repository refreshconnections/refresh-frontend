import { IonActionSheet, IonAvatar, IonBadge, IonButton, IonCard, IonCardContent, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonFab, IonFabButton, IonFooter, IonIcon, IonItem, IonLabel, IonList, IonNote, IonPage, IonRefresher, IonRefresherContent, IonRow, IonSpinner, IonText, IonTextarea, IonTitle, RefresherEventDetail, useIonAlert, useIonModal, useIonRouter } from "@ionic/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addComment, addCommentReply, addToHiddenAuthors, addToHiddenPosts, containsPii, getAvatarDisplay, getInternalAppPath, increaseStreak, isCommunityPlus, likeAnnouncement, localTzAbbr, onImgError, openExternalUrl, unlikeAnnouncement } from "../../hooks/utilities";
import { useSheetModal } from "../../hooks/useSheetModal";
import { useQueryClient } from "@tanstack/react-query";
import { postQueryKeys, useGetPostContent } from "../../hooks/api/refreshments";
import { useParams } from "react-router-dom"
import { chevronBackOutline, informationCircleOutline, star, starOutline } from 'ionicons/icons';


import './OpenedPost.css'
import ReportModal from "../ReportModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleEllipsis } from '@fortawesome/pro-solid-svg-icons/faCircleEllipsis';
import { faSubtitles } from '@fortawesome/pro-regular-svg-icons/faSubtitles';


import { faCircleExclamation, faLocationDot, faHeart as heartOutline } from '@fortawesome/pro-regular-svg-icons';
import { faComments } from '@fortawesome/pro-regular-svg-icons/faComments';
import { faHeart as heartFull } from '@fortawesome/pro-solid-svg-icons/faHeart';
import Comments from "./Comments";
import { useGetCommentsNotShownCount } from "../../hooks/api/refreshments/comments-not-shown";
import CommunityProfileModal from "../CommunityProfileModal";
import { faCommentPlus } from "@fortawesome/pro-solid-svg-icons/faCommentPlus";

import Markdown from 'react-markdown'


import { close } from 'ionicons/icons';
import { useGetComments } from "../../hooks/api/refreshments/comments";
import Linkify from 'react-linkify';
import { useGetRefreshmentsCurrentProfile } from "../../hooks/api/profiles/refreshments-current-profile";
import { useGetSettingsCurrentProfile } from "../../hooks/api/profiles/settings-current-profile";
import { useGetGlobalAppCurrentProfile } from "../../hooks/api/profiles/global-app-current-profile";
import { useGetStaticPostContent } from "../../hooks/api/refreshments/static-post-content";
import { useGetDynamicPostContent } from "../../hooks/api/refreshments/dynamic-post-content";
import { useGetOutgoingConnections } from "../../hooks/api/profiles/outgoing-connections";
import { useGetMutualConnections } from "../../hooks/api/profiles/mutual-connections";
import debounce from "lodash.debounce";
import { useGetCurrentModeration } from "../../hooks/api/profiles/current-moderation";
import Poll from "./Polls/Poll";
import ContactDetailsPopover from "../ContactDetailsPopover";
import RefreshmentsEventDetails from "../RefreshmentsEventDetails";
import moment from "moment";
import { useInterestPost, useUninterestPost } from "../../hooks/api/interests";
import {
    getHideInterestedCountOnMySubmissionsPref,
    getShowInterestedCountPref,
    HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_CHANGED_EVENT,
    SHOW_INTERESTED_COUNT_CHANGED_EVENT,
} from "../../hooks/capacitorPreferences/interested-counts";

type Comment = {
    id: number;
    text: string;
    uploadDateTime: string;
    user: number;
    username: string;
    profile_image: string | null;
    settings_community_profile: boolean;
    like_count: number;
    approved: boolean
    loading: boolean
};

type PaginatedComments = {
    next: number | null;
    previous: number | null;
    count: number;
    results: Comment[];
};

type InfiniteCommentPages = {
    pages: PaginatedComments[];
    pageParams: number[];
};



type PostDetail = {
    id: string
}

const scrollToComment = (id) => {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: "center" });
    }
};

const OpenedPost: React.FC = () => {

    let { id } = useParams<PostDetail>()


    // const content = useGetPostContent(parseInt(id)).data

    const moderation = useGetCurrentModeration().data;

    const [pendingInvalidations, setPendingInvalidations] = useState(new Set());
    const pendingInvalidationsRef = useRef(pendingInvalidations);

    const { data: staticContentPost, isLoading: staticContentPostLoading } = useGetStaticPostContent(parseInt(id));
    const dynamicContentPost = useGetDynamicPostContent(parseInt(id)).data;

    // const isLoading = useGetPostContent(parseInt(id)).isLoading
    const queryClient = useQueryClient()

    const { data: globalCurrentProfile, isLoading: globalIsLoading } = useGetGlobalAppCurrentProfile();
    const { data: currentProfileRefreshments, isLoading: currentProfileRefreshmentsLoading } = useGetRefreshmentsCurrentProfile()
    const { data: settingsCurrentProfile, isLoading: settingsIsLoading } = useGetSettingsCurrentProfile();

    const outgoingConnections = useGetOutgoingConnections().data
    const mutualConnections = useGetMutualConnections().data

    const commentsNotShownCount = useGetCommentsNotShownCount(parseInt(id)).data
    const comments = useGetComments(parseInt(id))

    const [altShow, setAltShow] = useState<boolean>(false);
    const router = useIonRouter();
    const [postActionsOpen, setPostActionsOpen] = useState<boolean>(false);

    const [liked, setLiked] = useState<boolean>(false)
    const [likedLength, setLikedLength] = useState(0)
    const [interested, setInterested] = useState<boolean>(false)
    const [interestedCount, setInterestedCount] = useState(0)
    const [showInterestedCountPref, setShowInterestedCountPrefState] = useState(true)
    const [hideInterestedCountOnMySubmissions, setHideInterestedCountOnMySubmissions] = useState(false)

    const [showSidenotes, setShowSidenotes] = useState<boolean>(false)

    const [hideFooter, setHideFooter] = useState<boolean>(false)

    const [commentInput, setCommentInput] = useState<string>("")
    const [noComment, setNoComment] = useState<boolean>(false)

    const [replyTo, setReplyTo] = useState<any | null>(null);

    const [forceShowRepliesFor, setForceShowRepliesFor] = useState<Set<number>>(new Set());

    const [sortByRecentActivity, setSortByRecentActivity] = useState(() => {
        const stored = localStorage.getItem('sortByRecentActivity');
        return stored !== null ? stored === 'true' : false;
    });

    const delay = (ms: any) => new Promise(res => setTimeout(res, ms));
    const interestPost = useInterestPost();
    const uninterestPost = useUninterestPost();
    const canViewInterestedCount = isCommunityPlus(globalCurrentProfile?.subscription_level) && showInterestedCountPref;
    const isOwnSubmission = staticContentPost?.user != null && staticContentPost.user === globalCurrentProfile?.user;
    const shouldShowInterestedCount = canViewInterestedCount && interestedCount > 3 && !(hideInterestedCountOnMySubmissions && isOwnSubmission);
    const normalizeInterestedCount = (value: unknown) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    };

    const hasPii: boolean = useMemo(() => containsPii(commentInput), [commentInput]);
    const approvedEventForPost = staticContentPost?.event ?? null;
    const eventCalendarAnchor = approvedEventForPost?.end_datetime ?? approvedEventForPost?.start_datetime ?? null;
    const isPastEvent = Boolean(
        eventCalendarAnchor &&
        moment(eventCalendarAnchor).isValid() &&
        moment(eventCalendarAnchor).isBefore(moment())
    );
    const canOpenEventCalendar = Boolean(
        approvedEventForPost?.start_datetime &&
        eventCalendarAnchor &&
        moment(eventCalendarAnchor).isValid() &&
        moment(eventCalendarAnchor).isSameOrAfter(moment().subtract(7, 'days'))
    );
    const handleOpenEventCalendar = () => {
        if (!canOpenEventCalendar || !approvedEventForPost?.start_datetime) return;
        const dateParam = moment(approvedEventForPost.start_datetime).format('YYYY-MM-DD');
        router.push(`/community?calendarDate=${dateParam}`);
    };
    const openAppOrExternalUrl = (url: string) => {
        const internalPath = getInternalAppPath(url);
        if (internalPath) {
            router.push(internalPath);
            return;
        }
        openExternalUrl(url);
    };



    const [presentWhyHiddenAlert] = useIonAlert();
    const [presentLinkAlert] = useIonAlert();

    const createComment = async (text: string, replyTo: any) => {
        setNoComment(true)
        setReplyTo(null)
        setCommentInput("")

        // comment loading circle?
        let comment_id: any = null

        if (replyTo) {
            const commentReplyData = {
                announcement: id,
                reply_to: replyTo?.id,
                text: text
            }

            const tempId = `temp-${Date.now()}`;

            const optimisticReply = {
                id: tempId,
                text,
                uploadDateTime: new Date().toISOString(),
                user: globalCurrentProfile.user,
                username: "Posting...",
                profile_image: null,
                settings_community_profile: false,
                removed: false,
                removed_reason: null,
                approved: true,
                reply_to: replyTo?.id,
                like_count: 0,
                reply_count: 0
            };

            queryClient.setQueryData(['comments', replyTo.id, 'replies'], (oldData: any) => {
                if (!oldData || !Array.isArray(oldData.pages)) {
                    return {
                        pageParams: [undefined],
                        pages: [{
                            next: null,
                            previous: null,
                            count: 1,
                            results: [optimisticReply]
                        }]
                    };
                }

                // Insert into last page
                const updatedPages = oldData.pages.map((page, index) => {
                    if (index === oldData.pages.length - 1) {
                        return {
                            ...page,
                            results: [...page.results, optimisticReply]
                        };
                    }
                    return page;
                });

                return {
                    ...oldData,
                    pages: updatedPages
                };
            });

            setTimeout(() => scrollToComment(`comment-${tempId}`), 100);

            let add_reply_response = await addCommentReply(commentReplyData)
            if (add_reply_response?.data?.reply_id) {
                comment_id = add_reply_response?.data?.reply_id
            }

            queryClient.invalidateQueries({ queryKey: ['comments', replyTo.id, 'replies'] });
            setForceShowRepliesFor(prev => new Set(prev).add(replyTo.id));



        }
        else {

            const commentData = {
                announcement: id,
                text: text
            }

            queryClient.setQueryData<InfiniteCommentPages>(postQueryKeys.topcomments(parseInt(id), sortByRecentActivity), (oldData) => {
                if (!oldData || !Array.isArray(oldData.pages) || oldData.pages.length === 0) return oldData;

                const newComment: Comment = {
                    id: Date.now(), // temporary ID
                    text: text,
                    uploadDateTime: new Date().toISOString(),
                    user: globalCurrentProfile?.user,
                    username: "Posting...",
                    profile_image: null,
                    settings_community_profile: false,
                    like_count: 0,
                    approved: true,
                    loading: true
                };

                const lastPageIndex = oldData.pages.length - 1;
                const updatedLastPage = {
                    ...oldData.pages[lastPageIndex],
                    results: [...oldData.pages[lastPageIndex].results, newComment],
                };

                const updatedPages = [...oldData.pages];
                updatedPages[lastPageIndex] = updatedLastPage;

                return {
                    ...oldData,
                    pages: updatedPages,
                };
            }
            );
            let add_comment_response = await addComment(commentData)
            if (add_comment_response?.data?.comment_id) {
                comment_id = add_comment_response?.data?.comment_id
            }
            queryClient.invalidateQueries({
                queryKey: ['top-comments', parseInt(id)], exact: false,
            });
        }
        await delay(500)
        setNoComment(false)
        await increaseStreak()
        queryClient.invalidateQueries({ queryKey: ['streak'] })
        if (comment_id) {
            scrollToComment(`comment-${comment_id}`)
        }

        return
    }


    // const likePost = async () => {
    //     setLiked(true)
    //     setLikedLength(likedLength + 1)
    //     const response = await likeAnnouncement(id)
    //     await increaseStreak()
    //     queryClient.invalidateQueries({ queryKey: ['streak'] })
    //     queryClient.invalidateQueries({
    //         queryKey: ['posts', 'postcontent', parseInt(id)],
    //     })
    //     return response
    // }

    // const unlikePost = async () => {
    //     const response = await unlikeAnnouncement(id)
    //     setLiked(false)
    //     setLikedLength(likedLength - 1)
    //     queryClient.invalidateQueries({
    //         queryKey: ['posts', 'postcontent', parseInt(id)],
    //     })
    //     return response
    // }

    const likePost = async () => {
        setLiked(true)
        setLikedLength(likedLength + 1)
        const response = await likeAnnouncement(id)
        queryClient.invalidateQueries({
            queryKey: ['posts', 'postcontent', 'dynamic', parseInt(id)]
        })
        queryClient.invalidateQueries({ queryKey: ['refreshments-current'] })
        await increaseStreak()
        queryClient.invalidateQueries({ queryKey: ['streak'] })
        return response
    }

    const unlikePost = async () => {
        setLiked(false)
        setLikedLength(likedLength - 1)
        const response = await unlikeAnnouncement(id)
        queryClient.invalidateQueries({
            queryKey: ['posts', 'postcontent', 'dynamic', parseInt(id)],
        })
        queryClient.invalidateQueries({ queryKey: ['refreshments-current'] })
        return response
    }

    // useEffect(() => {

    //     setLiked(content?.liked_by.includes(me?.user))
    //     setLikedLength(content?.liked_by.length)


    // }, [content, me])


    useEffect(() => {

        setLikedLength(dynamicContentPost?.like_count)

    }, [dynamicContentPost])

    useEffect(() => {

        setLiked(currentProfileRefreshments?.likes?.includes(parseInt(id)))

    }, [currentProfileRefreshments])

    useEffect(() => {
        setInterested(Boolean(dynamicContentPost?.interested))
    }, [dynamicContentPost?.interested])

    useEffect(() => {
        setInterestedCount(normalizeInterestedCount(staticContentPost?.interested_count))
    }, [staticContentPost?.interested_count])

    useEffect(() => {
        let cancelled = false;

        const syncPrefs = async () => {
            const [showInterestedCount, hideOnMySubmissions] = await Promise.all([
                getShowInterestedCountPref(),
                getHideInterestedCountOnMySubmissionsPref(),
            ]);
            if (cancelled) {
                return;
            }
            setShowInterestedCountPrefState(showInterestedCount);
            setHideInterestedCountOnMySubmissions(hideOnMySubmissions);
        };

        const handleShowInterestedCountChanged = (event: Event) => {
            setShowInterestedCountPrefState(Boolean((event as CustomEvent<boolean>).detail));
        };

        const handleHideOnMySubmissionsChanged = (event: Event) => {
            setHideInterestedCountOnMySubmissions(Boolean((event as CustomEvent<boolean>).detail));
        };

        syncPrefs();
        window.addEventListener(SHOW_INTERESTED_COUNT_CHANGED_EVENT, handleShowInterestedCountChanged);
        window.addEventListener(HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_CHANGED_EVENT, handleHideOnMySubmissionsChanged);

        return () => {
            cancelled = true;
            window.removeEventListener(SHOW_INTERESTED_COUNT_CHANGED_EVENT, handleShowInterestedCountChanged);
            window.removeEventListener(HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_CHANGED_EVENT, handleHideOnMySubmissionsChanged);
        };
    }, []);

    const markInterested = async () => {
        const previousInterested = interested
        const previousCount = interestedCount
        setInterested(true)
        if (!previousInterested) {
            setInterestedCount(previousCount + 1)
        }
        try {
            await interestPost.mutateAsync(parseInt(id))
        } catch (error) {
            setInterested(previousInterested)
            setInterestedCount(previousCount)
        }
    }

    const unmarkInterested = async () => {
        const previousInterested = interested
        const previousCount = interestedCount
        setInterested(false)
        if (previousInterested) {
            setInterestedCount(Math.max(0, previousCount - 1))
        }
        try {
            await uninterestPost.mutateAsync(parseInt(id))
        } catch (error) {
            setInterested(previousInterested)
            setInterestedCount(previousCount)
        }
    }

    useEffect(() => {
        document.querySelector("ion-item-sliding")?.closeOpened();
    }, [replyTo])

    const hidePostHandler = async () => {
        const response = await addToHiddenPosts(parseInt(id))
        queryClient.invalidateQueries({ queryKey: ['refreshments-current'] })
        console.log("hide post response", response)
    }

    const hideAuthorHandler = async () => {
        const response = await addToHiddenAuthors(parseInt(id))
        console.log("hide author response", response)
        queryClient.invalidateQueries({ queryKey: ['refreshments-current'] })
    }


    const handleReportOpen = async () => {
        createReportPresent()
    }

    const [createReportPresent, createReportDismiss] = useIonModal(ReportModal, {
        offender: "announcement",
        id: id,
        text: staticContentPost?.title,
        onDismiss: (data: string, role: string) => createReportDismiss(data, role),
    });

    const hiddenCommentsInfo = () => {
        presentWhyHiddenAlert({
            header: 'Some comments have been hidden to keep this thread on topic.',
            subHeader: "You can show sidenoted comments using the ellipsis button at the top of the post.",
            buttons: [
                {
                    text: 'Ok',
                    role: 'cancel',
                }
            ],
        })
    }

    const postAnonymous = !staticContentPost?.include_profile || !staticContentPost?.byline || String(staticContentPost?.byline).toLowerCase() === 'anonymous';
    const postAvatarDisplay = getAvatarDisplay({
        profileImage: postAnonymous ? null : staticContentPost?.profile_image,
        viewerConnect: settingsCurrentProfile?.settings_community_profile,
        authorConnect: staticContentPost?.settings_community_profile,
        includeBylineClass: true,
    });
    const postAvatarOverride = postAvatarDisplay.hasImage ? postAvatarDisplay.src : undefined;
    const [communityProfilePresent, communityProfileDismiss] = useSheetModal(CommunityProfileModal, {
        userId: staticContentPost?.user ?? null,
        isAnonymous: postAnonymous,
        avatarUrl: postAvatarOverride,
        onDismiss: () => communityProfileDismiss(),
    });
    const eventAnonymous = Boolean(approvedEventForPost?.anonymous);
    const eventAvatarDisplay = getAvatarDisplay({
        profileImage: eventAnonymous ? null : approvedEventForPost?.profile_image,
        viewerConnect: settingsCurrentProfile?.settings_community_profile,
        authorConnect: approvedEventForPost?.settings_community_profile,
        includeBylineClass: true,
    });
    const eventAvatarOverride = eventAvatarDisplay.hasImage ? eventAvatarDisplay.src : undefined;
    // const [eventProfilePresent, eventProfileDismiss] = useSheetModal(CommunityProfileModal, {
    //     userId: approvedEventForPost?.user ?? null,
    //     isAnonymous: eventAnonymous,
    //     avatarUrl: eventAvatarOverride,
    //     onDismiss: () => eventProfileDismiss(),
    // });

    const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
        queryClient.invalidateQueries({
            queryKey: ['posts', 'postcontent', 'dynamic', parseInt(id)]
        })
        queryClient.invalidateQueries({
            queryKey: ['posts', 'postcontent', 'static', parseInt(id)]
        })

        queryClient.invalidateQueries({
            queryKey: ['posts', 'postcontent', parseInt(id), 'comments']
        })
        queryClient.invalidateQueries({
            queryKey: ['top-comments', parseInt(id)], exact: false,
        });

        queryClient.invalidateQueries({ queryKey: ['refreshments-current'] })

        comments?.data?.map((number) => (
            queryClient.invalidateQueries({ queryKey: ['refreshments', 'comment', 'replies', number] })

        ))
        setTimeout(async () => {
            event.detail.complete();

        }, 2000);

    }





    const backToAllPosts = () => {
        setHideFooter(true)

    }

    // Debounced invalidation function
    const batchInvalidateComments = useCallback(
        debounce(() => {
            const invalidationIds = Array.from(pendingInvalidationsRef.current);
            if (invalidationIds.length > 0) {
                console.log('Invalidating comments:', invalidationIds);
                // Invalidate queries for all pending comments
                pendingInvalidations.forEach((comment_id) => {
                    queryClient.invalidateQueries({ queryKey: ['posts', 'comment', 'dynamic', comment_id] })
                });

                queryClient.invalidateQueries({ queryKey: ['refreshments-current'] })
                queryClient.invalidateQueries({ queryKey: ['streak'] })
                setPendingInvalidations(new Set()); // Clear the set after invalidating
                pendingInvalidationsRef.current = new Set(); // Clear the ref as well
            }
        }, 500),  // 500ms debounce delay
        [queryClient]  // Dependencies for debounce
    );

    // Function to add commentId to pending invalidations
    const handleLikeUnlike = (comment_id) => {
        setPendingInvalidations((prev) => {
            const newSet = new Set(prev);
            newSet.add(comment_id);
            return newSet;
        });

        // Update the ref directly to ensure batchInvalidateComments gets the latest value
        pendingInvalidationsRef.current.add(comment_id);

        // Call the debounced function to handle invalidation
        batchInvalidateComments();
    };

    const hasSensitive  = !!staticContentPost?.sensitive;
    const hasDisclaimer = !!staticContentPost?.disclaimer;
    const sensitiveText = staticContentPost?.sensitive_description ?? 'This post contains sensitive content.';
    const moderatorDeactivated = Boolean(moderation?.moderator_deactivated);
    const commentingPausedUntil = moderation?.commenting_paused_until;
    const commentingPauseActive = Boolean(
        commentingPausedUntil &&
        moment(commentingPausedUntil).isValid() &&
        moment(commentingPausedUntil).isAfter(moment())
    );
    const commentingPausedLabel = commentingPauseActive
        ? moment(commentingPausedUntil).format('MMM D [at] h:mm A')
        : null;
    const commentingBlocked = Boolean(
        staticContentPost?.comments_deactivated ||
        staticContentPost?.closed ||
        moderatorDeactivated ||
        globalCurrentProfile?.deactivated_profile ||
        commentingPauseActive ||
        (moderation?.paused_on_creation && globalCurrentProfile?.paused_profile)
    );
    const moderationCommentBlockMessage = moderatorDeactivated
        ? 'Your account is currently suspended from commenting.'
        : commentingPauseActive
            ? `Your commenting is temporarily paused until ${commentingPausedLabel}.`
            : (moderation?.paused_on_creation && globalCurrentProfile?.paused_profile)
                ? 'Your account needs to be reviewed before you can comment.'
                : null;
    const disableHideAuthorAction = Boolean(globalCurrentProfile?.user == staticContentPost?.user || staticContentPost?.user == 24);
    const disableHidePostAction = Boolean(
        currentProfileRefreshments?.hidden_announcements?.includes(parseInt(id)) ||
        currentProfileRefreshments?.hidden_authors?.includes(staticContentPost?.user)
    );
    const disableSidenotesAction = Boolean(commentsNotShownCount <= 0);




    return (
        <IonPage>
            {staticContentPost ?
                <>
                    <IonContent>
                        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                            <IonRefresherContent refreshingSpinner="dots"></IonRefresherContent>
                        </IonRefresher>
                        <IonFab className="very-top" slot="fixed" vertical="top" horizontal="start">
                            <IonFabButton color="light" onClick={() => { backToAllPosts(); router.canGoBack() ? router.goBack() : router.push('/community', 'back'); }}>
                                <IonIcon icon={chevronBackOutline}></IonIcon>
                            </IonFabButton>
                        </IonFab>

                        <IonCard className="opened-post">
                            <IonRow>
                                <IonCol size="11">


                                </IonCol>
                                <IonCol size="1">
                                    <IonButton fill="clear" size="small" onClick={() => setPostActionsOpen(true)}><FontAwesomeIcon icon={faCircleEllipsis} /></IonButton>
                                </IonCol>
                            </IonRow>
                            <IonCardTitle>
                                {staticContentPost?.title}
                            </IonCardTitle>
                            <IonRow className="ion-justify-content-center">
                                <IonBadge color="navy">
                                    {staticContentPost?.location}
                                    {staticContentPost?.local_only ? <>&nbsp; &nbsp;<FontAwesomeIcon className="pinned" title="local" icon={faLocationDot} />  </> : <></>}
                                </IonBadge>
                            </IonRow>


                            {staticContentPost?.coverPhoto ?
                                <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                                    <img alt={staticContentPost?.coverPhoto_alt || "Cover Photo"} src={staticContentPost?.coverPhoto} onError={(e) => onImgError(e)}></img>
                                    {altShow ?
                                        <IonRow className="show-alt-coverPhoto">
                                            <IonText>{staticContentPost?.coverPhoto_alt}</IonText>
                                        </IonRow>
                                        : <></>}
                                </div>
                                : <></>}

                            <IonCardSubtitle>
                                <IonRow className="ion-align-items-center">
                                    {/* <IonCol size="7"> */}

                                    <IonCol
                                      className="byline-col"
                                      size="7"
                                      onClick={() =>
                                        !postAnonymous && staticContentPost?.user
                                          ? communityProfilePresent({ cssClass: 'community-profile-modal' })
                                          : null
                                      }
                                    >
                                        <IonAvatar className={postAvatarDisplay.className}>
                                          <img
                                            src={postAvatarDisplay.src}
                                            onError={(e) => onImgError(e)}
                                          />
                                        </IonAvatar>
                                        <IonText>
                                          by {postAnonymous ? "Anonymous" : (staticContentPost?.username || staticContentPost?.byline)}
                                        </IonText>
                                    </IonCol>

                                    <IonCol size="5" >
                                        {settingsCurrentProfile?.settings_alt_text && staticContentPost?.coverPhoto !== null && staticContentPost?.coverPhoto_alt !== '' && staticContentPost?.coverPhoto_alt !== null ?
                                            <IonRow className="ion-justify-content-end">
                                                <IonButton className="alt-coverPhoto-button" fill="clear" size="small" onClick={altShow ? () => setAltShow(false) : () => setAltShow(true)}>
                                                    <FontAwesomeIcon icon={faSubtitles} />
                                                </IonButton>
                                            </IonRow>
                                            : <></>}
                                        <IonRow className="ion-justify-content-end">
                                            {staticContentPost?.uploadDate}
                                        </IonRow>


                                    </IonCol>
                                </IonRow>

                            </IonCardSubtitle>

                            {(hasSensitive || hasDisclaimer) ? (
                            <IonRow className="sensitivity-note">
                                {hasSensitive && (
                                <IonCol size="12">
                                    <IonText className="ion-text-center" role="note" aria-label="Sensitive content">
                                    <strong>Sensitive content: </strong>{sensitiveText}
                                    </IonText>
                                </IonCol>
                                )}

                                {hasSensitive && hasDisclaimer && (
                                <IonCol size="12">
                                    <hr className="mid-hr" aria-hidden="true" role="separator" />
                                </IonCol>
                                )}

                                {hasDisclaimer && (
                                <IonCol size="12">
                                    <Linkify componentDecorator={(href, text, key) => <a key={key} onClick={(e) => { e.preventDefault(); openAppOrExternalUrl(href); }} style={{ cursor: 'pointer' }}>{text}</a>}>
                                    <IonText color="medium" className="ion-text-center">
                                        <FontAwesomeIcon icon={faCircleExclamation} /> &nbsp;
                                        {staticContentPost!.disclaimer}
                                    </IonText>
                                    </Linkify>
                                </IonCol>
                                )}
                            </IonRow>) 
                            : null}

                            <IonCardContent className={staticContentPost?.markdown ? "post-markdown css-fix" : "css-fix"}>
                                {staticContentPost?.poll && 
                                <Poll id={staticContentPost?.poll}/>}
                                {staticContentPost?.markdown ?
                                    <Markdown components={{ a: ({ href, children }) => <a onClick={(e) => { e.preventDefault(); openAppOrExternalUrl(href ?? ''); }} style={{ cursor: 'pointer' }}>{children}</a> }}>{staticContentPost?.content}</Markdown>
                                    : staticContentPost?.content
                                }
                            </IonCardContent>
                            {approvedEventForPost && (
                                <IonCard
                                    className={`opened-post-event calendar-event-card calendar-event-card--expanded ${canOpenEventCalendar ? 'opened-post-event--clickable' : 'opened-post-event--stale'}`}
                                    onClick={canOpenEventCalendar ? handleOpenEventCalendar : undefined}
                                    role={canOpenEventCalendar ? "button" : undefined}
                                    tabIndex={canOpenEventCalendar ? 0 : -1}
                                    onKeyDown={canOpenEventCalendar ? (event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            handleOpenEventCalendar();
                                        }
                                    } : undefined}
                                >
                                    <IonCardContent>
                                        <div className="calendar-event-card-toggle-row">
                                            <div className="calendar-event-card-toggle">
                                                {approvedEventForPost.name && (
                                                    <span className="calendar-event-card-name">
                                                        {approvedEventForPost.name}
                                                    </span>
                                                )}
                                                <span className="calendar-event-card-time">
                                                    {moment(approvedEventForPost.start_datetime).format('MMM D, h:mm A')} –{' '}
                                                    {moment(approvedEventForPost.end_datetime).format('h:mm A')} {localTzAbbr(approvedEventForPost.start_datetime)}
                                                </span>
                                            </div>
                                            {isPastEvent ? (
                                                <span className="event-status-badge">Past event</span>
                                            ) : null}
                                        </div>
                                        <RefreshmentsEventDetails
                                            event={approvedEventForPost}
                                            anonymous={eventAnonymous}
                                            avatarDisplay={eventAvatarDisplay}
                                            onProfilePresent={!eventAnonymous && approvedEventForPost?.user
                                                ? () => communityProfilePresent({ cssClass: 'community-profile-modal' })
                                                : undefined}
                                            onExternalLinkClick={approvedEventForPost.external_link
                                                ? () => presentLinkAlert({
                                                    header: 'Open link?',
                                                    message: approvedEventForPost.external_link!,
                                                    buttons: [
                                                      { text: 'Cancel', role: 'cancel' },
                                                      { text: 'Open', handler: () => openExternalUrl(approvedEventForPost.external_link!) },
                                                    ],
                                                  })
                                                : undefined}
                                        />
                                    </IonCardContent>
                                </IonCard>
                            )}
                            <IonRow className="post-likes" id="comments-top">
                                <IonCol>
                                    <IonRow onClick={liked ? () => { } : () => likePost()}>
                                        {liked ?
                                            <IonButton size="small" fill="clear" onClick={() => unlikePost()}><FontAwesomeIcon color="red" icon={heartFull} /></IonButton> :
                                            <IonButton size="small" fill="clear" onClick={() => likePost()}><FontAwesomeIcon icon={heartOutline} /></IonButton>}
                                        {likedLength > 0 ?
                                            <IonText>{likedLength}</IonText>
                                            : <></>}
                                    </IonRow>
                                </IonCol>
                                <IonCol>
                                    <IonRow>
                                        <IonButton size="small" fill="clear" onClick={() => setHideFooter(false)}><FontAwesomeIcon icon={faComments} /></IonButton>
                                        {(dynamicContentPost?.comment_count - commentsNotShownCount) > 0 ?
                                            <IonText>{dynamicContentPost?.comment_count - commentsNotShownCount} {showSidenotes ? "+" : ""}</IonText>
                                            : <></>}
                                    </IonRow>
                                </IonCol>
                                <IonCol>
                                    <IonRow>
                                        {interested ? (
                                            <IonButton
                                                aria-label="Remove post interest"
                                                size="small"
                                                fill="clear"
                                                onClick={() => unmarkInterested()}
                                                disabled={interestPost.isPending || uninterestPost.isPending}
                                            >
                                                <IonIcon color="warning" icon={star} />
                                            </IonButton>
                                        ) : (
                                            <IonButton
                                                aria-label="Mark post interested"
                                                size="small"
                                                fill="clear"
                                                onClick={() => markInterested()}
                                                disabled={interestPost.isPending || uninterestPost.isPending}
                                            >
                                                <IonIcon icon={starOutline} />
                                            </IonButton>
                                        )}
                                        {shouldShowInterestedCount ? (
                                            <IonText data-testid="opened-post-interest-count">{interestedCount}</IonText>
                                        ) : null}
                                    </IonRow>
                                </IonCol>
                            </IonRow>
                            {staticContentPost?.comment_instructions ?
                                <IonRow className="comment-instructions-note">
                                    <Linkify componentDecorator={(href, text, key) => <a key={key} onClick={(e) => { e.preventDefault(); openAppOrExternalUrl(href); }} style={{ cursor: 'pointer' }}>{text}</a>}><IonNote>{staticContentPost?.comment_instructions}</IonNote></Linkify>
                                </IonRow>
                                : <></>}
                            {!staticContentPost?.comments_deactivated &&
                                <>
                                    <Comments showSidenotes={showSidenotes} replyTo={replyTo} setReplyTo={setReplyTo} onLikeUnlike={handleLikeUnlike} forceShowRepliesFor={forceShowRepliesFor} sortByRecentActivity={sortByRecentActivity} setSortByRecentActivity={setSortByRecentActivity} onViewThread={(id) => setForceShowRepliesFor(prev => { const next = new Set(prev); next.add(id); return next; })} isMegathread={!!staticContentPost?.megathread} />
                                    {!comments?.isPending && commentsNotShownCount > 0 ?
                                        <>
                                            {showSidenotes ?
                                                <IonRow className="ion-justify-content-center" style={{ paddingTop: "10pt" }} color="primary" onClick={() => setShowSidenotes(false)}>
                                                    <IonNote>
                                                        Hide sidenotes
                                                    </IonNote>
                                                </IonRow> :
                                                <IonRow className="ion-justify-content-center" style={{ paddingTop: "10pt" }} color="primary" onClick={() => hiddenCommentsInfo()}>
                                                    <IonNote>
                                                        Some comments are hidden. &nbsp;
                                                        <IonIcon icon={informationCircleOutline}></IonIcon>
                                                    </IonNote>
                                                </IonRow>}
                                        </> : <></>}
                                </>
                            }
                        </IonCard>
                        <IonActionSheet
                            isOpen={postActionsOpen}
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
                                        if (disableHideAuthorAction) return;
                                        hideAuthorHandler()
                                    },
                                    cssClass: (disableHideAuthorAction ? "disabled-action-button" : "")
                                },
                                {
                                    text: 'Hide post',
                                    handler: () => {
                                        if (disableHidePostAction) return;
                                        hidePostHandler()
                                    },
                                    cssClass: (disableHidePostAction ? "disabled-action-button" : "")
                                },
                                {
                                    text: showSidenotes ? 'Hide sidenotes' : 'Show sidenotes',
                                    handler: () => {
                                        if (disableSidenotesAction) return;
                                        { showSidenotes ? setShowSidenotes(false) : setShowSidenotes(true) }
                                    },
                                    cssClass: (disableSidenotesAction ? "disabled-action-button" : "")
                                },
                                {
                                    text: 'Nevermind',
                                    role: 'cancel',
                                    data: {
                                        action: 'cancel',
                                    },
                                },
                            ]}
                            onDidDismiss={() => setPostActionsOpen(false)} />
                    </IonContent>

                    {!staticContentPost.comments_deactivated &&

                        <IonFooter className={hideFooter ? "create-comment-hidden" : "create-comment"}>
                            {globalCurrentProfile?.username ?
                            <>
                                <IonRow>
                                    <IonCol size="10">
                                        <IonItem className="inputted" lines="none">

                                            {replyTo ?
                                                <div style={{ display: "flex", padding: "5pt" }}>
                                                    <IonButton className="x" size="small" onClick={() => setReplyTo(null)}>
                                                        <IonIcon slot="icon-only" icon={close} ></IonIcon>
                                                    </IonButton>

                                                    <IonLabel className="reply ion-text-wrap" position="stacked">

                                                        <IonText>

                                                            <p>{"reply to " + (replyTo?.username ?? "Anonymous") + ": " + replyTo?.text}
                                                            </p>

                                                        </IonText>


                                                    </IonLabel>

                                                </div>
                                                : <></>}
                                            <IonTextarea value={commentInput}
                                                className="comment-creator"
                                                color="black"
                                                name="comment_input"
                                                onIonInput={e => setCommentInput(e.detail.value!)}
                                                disabled={commentingBlocked}
                                                maxlength={900}
                                                autoGrow={true}
                                                autoCorrect="on"
                                                spellcheck
                                                rows={(staticContentPost?.closed || globalCurrentProfile?.deactivated_profile || moderatorDeactivated) ? 2 : (commentingPauseActive || (moderation?.paused_on_creation && globalCurrentProfile?.paused_profile)) ? 3 : 1}
                                                placeholder={
                                                    staticContentPost?.comments_deactivated
                                                        ? 'Comments are closed.'
                                                        : staticContentPost?.closed
                                                            ? "Discussion closed. Want to start a new one?"
                                                            : moderatorDeactivated
                                                                ? 'Your account is currently suspended from commenting.'
                                                                : globalCurrentProfile?.deactivated_profile
                                                                    ? "You need an active account to comment."
                                                                    : commentingPauseActive
                                                                        ? `Your commenting is temporarily paused until ${commentingPausedLabel}.`
                                                                        : (moderation?.paused_on_creation && globalCurrentProfile?.paused_profile)
                                                                            ? "Your account needs to be reviewed before you can comment."
                                                                            : "Leave a comment"
                                                }
                                                autocapitalize='sentences'
                                            />
                                        </IonItem>
                                    </IonCol>
                                    <IonCol size="2">
                                        <IonButton
                                            expand="block"
                                            className="send-button"
                                            color="tertiary"
                                            disabled={noComment || commentingBlocked || !commentInput || hasPii}
                                            onClick={() => {
                                                if (commentingBlocked || !commentInput || hasPii || noComment) return;
                                                createComment(commentInput!, replyTo);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faCommentPlus} />
                                        </IonButton>
                                    </IonCol>
                                </IonRow>
                                {hasPii &&
                                <IonRow class="ion-padding">
                                    <IonText color="danger">
                                        Comments cannot contain contact information like emails or phone numbers.
                                    </IonText>
                                     <ContactDetailsPopover />
                                </IonRow>
                                }
                                {moderationCommentBlockMessage && (
                                <IonRow class="ion-padding">
                                    <IonCol size="12">
                                        <IonText color="medium">
                                            {moderationCommentBlockMessage} Check your Activity for moderation details and our guidelines.
                                        </IonText>
                                    </IonCol>
                                    <IonCol size="12">
                                        <IonButton fill="outline" color="primary" onClick={() => router.push('/activity')}>
                                            View Activity
                                        </IonButton>
                                    </IonCol>
                                </IonRow>
                                )}
                                </>
                                :
                                <IonRow className="ion-justify-content-center comment-username">
                                    <IonButton routerLink="/community-onboarding" color="tertiary">
                                        Create a Refreshments Profile to post a comment
                                    </IonButton>
                                </IonRow>}
                        </IonFooter>
                    }
                </>
                :
                (staticContentPostLoading) ?
                    <IonContent>
                        <IonFab className="very-top " slot="fixed" vertical="top" horizontal="start">
                            <IonFabButton color="light" onClick={() => router.canGoBack() ? router.goBack() : router.push('/community', 'back')}>
                                <IonIcon icon={chevronBackOutline}></IonIcon>
                            </IonFabButton>
                        </IonFab>
                    </IonContent>
                    :
                    <IonContent>
                        <IonFab className="very-top " slot="fixed" vertical="top" horizontal="start">
                            <IonFabButton color="light" onClick={() => router.canGoBack() ? router.goBack() : router.push('/community', 'back')}>
                                <IonIcon icon={chevronBackOutline}></IonIcon>
                            </IonFabButton>
                        </IonFab>
                        <IonCard className="opened-post" button routerLink={`/community#${id}`} routerDirection="back">
                            <div style={{ position: "relative" }}>
                                <img alt={"Go back"} src={"../static/img/goback.png"} onError={(e) => onImgError(e)}></img>
                            </div>
                            <IonCardTitle className="ion-text-center">
                                Uh oh!
                            </IonCardTitle>
                            <IonCardContent className="ion-text-center"> <IonText>This post doesn't seem to exist.</IonText>
                            </IonCardContent>
                        </IonCard>
                    </IonContent>
            }
        </IonPage>
    )


};

export default OpenedPost;
