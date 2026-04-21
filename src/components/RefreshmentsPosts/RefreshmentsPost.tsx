import { IonAvatar, IonBadge, IonButton, IonCard, IonCardContent, IonCardSubtitle, IonCardTitle, IonChip, IonCol, IonIcon, IonItem, IonLabel, IonList, IonRow, IonText, useIonModal } from "@ionic/react";
import React, { useEffect, useState } from "react";
import { increaseStreak, isCommunityPlus, likeAnnouncement, onImgError, unlikeAnnouncement } from "../../hooks/utilities";
import { useQueryClient } from "@tanstack/react-query";

import './RefreshmentsPost.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as heartOutline } from '@fortawesome/pro-regular-svg-icons';
import { faComments } from '@fortawesome/pro-regular-svg-icons/faComments';
import { faHeart as heartFull } from '@fortawesome/pro-solid-svg-icons/faHeart';
import { useGetCommentsNotShownCount } from "../../hooks/api/refreshments/comments-not-shown";
import { Link } from "react-router-dom";
import { faThumbtack } from "@fortawesome/pro-solid-svg-icons/faThumbtack";
import { faReel } from "@fortawesome/pro-solid-svg-icons/faReel";
import { useGetStaticPostContent } from "../../hooks/api/refreshments/static-post-content";
import { useGetDynamicPostContent } from "../../hooks/api/refreshments/dynamic-post-content";
import { useGetSettingsCurrentProfile } from "../../hooks/api/profiles/settings-current-profile";
import { useGetRefreshmentsCurrentProfile } from "../../hooks/api/profiles/refreshments-current-profile";
import { useGetGlobalAppCurrentProfile } from "../../hooks/api/profiles/global-app-current-profile";
import { faLocationDot } from "@fortawesome/pro-solid-svg-icons/faLocationDot";
import Poll from "./Polls/Poll";
import { star, starOutline } from "ionicons/icons";
import { useInterestPost, useUninterestPost } from "../../hooks/api/interests";
import {
    getHideInterestedCountOnMySubmissionsPref,
    getShowInterestedCountPref,
    HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_CHANGED_EVENT,
    SHOW_INTERESTED_COUNT_CHANGED_EVENT,
} from "../../hooks/capacitorPreferences/interested-counts";


type Props = {
    post_id: number
};



const RefreshmentsPost: React.FC<Props> = (props) => {
    const { post_id } = props;

    const staticContentPost = useGetStaticPostContent(post_id).data;
    const dynamicContentPost = useGetDynamicPostContent(post_id).data;
    const { data: globalCurrentProfile } = useGetGlobalAppCurrentProfile();

    const {data: currentProfileRefreshments, isLoading: currentProfileRefreshmentsLoading} = useGetRefreshmentsCurrentProfile()
    const {data: settingsCurrentProfile, isLoading: settingsIsLoading} = useGetSettingsCurrentProfile();


    const commentsNotShownCount = useGetCommentsNotShownCount(post_id).data

    const [liked, setLiked] = useState<boolean>(false)
    const [likedLength, setLikedLength] = useState(0)
    const [interested, setInterested] = useState<boolean>(false)
    const [interestedCount, setInterestedCount] = useState(0)
    const [showInterestedCountPref, setShowInterestedCountPrefState] = useState(true)
    const [hideInterestedCountOnMySubmissions, setHideInterestedCountOnMySubmissions] = useState(false)

    const queryClient = useQueryClient()
    const interestPost = useInterestPost()
    const uninterestPost = useUninterestPost()
    const canViewInterestedCount = isCommunityPlus(globalCurrentProfile?.subscription_level) && showInterestedCountPref
    const isOwnSubmission = staticContentPost?.user != null && staticContentPost.user === globalCurrentProfile?.user
    const shouldShowInterestedCount = canViewInterestedCount && interestedCount > 3 && !(hideInterestedCountOnMySubmissions && isOwnSubmission)

    const normalizeInterestedCount = (value: unknown) => {
        const parsed = Number(value)
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
    }

    const likePost = async () => {
        setLiked(true)
        setLikedLength(likedLength + 1)
        const response = await likeAnnouncement(post_id)
        queryClient.invalidateQueries({
            queryKey: ['posts', 'postcontent', 'dynamic', post_id]
        })
        await increaseStreak()
        queryClient.invalidateQueries({ queryKey: ['streak'] })
        queryClient.invalidateQueries({ queryKey: ['refreshments-current'] })
        return response
    }

    const unlikePost = async () => {
        setLiked(false)
        setLikedLength(likedLength - 1)
        const response = await unlikeAnnouncement(post_id)
        queryClient.invalidateQueries({
            queryKey: ['posts', 'postcontent', 'dynamic', post_id],
        })
        queryClient.invalidateQueries({ queryKey: ['refreshments-current'] })
        return response
    }

    useEffect(() => {

        setLikedLength(dynamicContentPost?.like_count)

    }, [dynamicContentPost])

    useEffect(() => {

        setLiked(currentProfileRefreshments?.likes?.includes(post_id))

    }, [currentProfileRefreshments])

    useEffect(() => {
        setInterested(Boolean(dynamicContentPost?.interested))
    }, [dynamicContentPost?.interested])

    useEffect(() => {
        setInterestedCount(normalizeInterestedCount(staticContentPost?.interested_count))
    }, [staticContentPost?.interested_count])

    useEffect(() => {
        let cancelled = false

        const syncPrefs = async () => {
            const [showInterestedCount, hideOnMySubmissions] = await Promise.all([
                getShowInterestedCountPref(),
                getHideInterestedCountOnMySubmissionsPref(),
            ])
            if (cancelled) {
                return
            }
            setShowInterestedCountPrefState(showInterestedCount)
            setHideInterestedCountOnMySubmissions(hideOnMySubmissions)
        }

        const handleShowInterestedCountChanged = (event: Event) => {
            setShowInterestedCountPrefState(Boolean((event as CustomEvent<boolean>).detail))
        }

        const handleHideOnMySubmissionsChanged = (event: Event) => {
            setHideInterestedCountOnMySubmissions(Boolean((event as CustomEvent<boolean>).detail))
        }

        syncPrefs()
        window.addEventListener(SHOW_INTERESTED_COUNT_CHANGED_EVENT, handleShowInterestedCountChanged)
        window.addEventListener(HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_CHANGED_EVENT, handleHideOnMySubmissionsChanged)

        return () => {
            cancelled = true
            window.removeEventListener(SHOW_INTERESTED_COUNT_CHANGED_EVENT, handleShowInterestedCountChanged)
            window.removeEventListener(HIDE_INTERESTED_COUNT_ON_MY_SUBMISSIONS_CHANGED_EVENT, handleHideOnMySubmissionsChanged)
        }
    }, [])

    const markInterested = async () => {
        const previousInterested = interested
        const previousCount = interestedCount
        setInterested(true)
        if (!previousInterested) {
            setInterestedCount(previousCount + 1)
        }
        try {
            await interestPost.mutateAsync(post_id)
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
            await uninterestPost.mutateAsync(post_id)
        } catch (error) {
            setInterested(previousInterested)
            setInterestedCount(previousCount)
        }
    }



    return (
        <IonRow id={`#${post_id}`}>
            <IonItem className="refreshments-category" lines="none"
                color={staticContentPost?.category == "science" ? "tertiary" :
                    staticContentPost?.category == "families" ? "families" :
                    staticContentPost?.category == "pop" ? "pop" :
                    staticContentPost?.category == "mingle" ? "secondary" :
                    staticContentPost?.category == "change" ? "change" :
                    staticContentPost?.category == "longcovid" ? "longcovid" :
                    staticContentPost?.category == "newcomers" ? "newcomers" :
                    staticContentPost?.category == "book" ? "pop" :
                    staticContentPost?.category == "housing" ? "secondary" :
                    staticContentPost?.category == "recommendations" ? "secondary" :
                    staticContentPost?.category == "events" ? "secondary" :
                                            "primary"} />
            <IonItem lines="none" className="refreshments-category-label"
                color={staticContentPost?.category == "science" ? "tertiary" :
                    staticContentPost?.category == "families" ? "families" :
                    staticContentPost?.category == "pop" ? "pop" :
                    staticContentPost?.category == "mingle" ? "secondary" :
                    staticContentPost?.category == "change" ? "change" :
                    staticContentPost?.category == "longcovid" ? "longcovid" :
                    staticContentPost?.category == "newcomers" ? "newcomers" :
                    staticContentPost?.category == "book" ? "pop" :
                    staticContentPost?.category == "housing" ? "secondary" :
                    staticContentPost?.category == "recommendations" ? "secondary" :
                    staticContentPost?.category == "events" ? "secondary" :
                                            "primary"}>
                <IonLabel>
                {staticContentPost?.pinned? <><FontAwesomeIcon  className="pinned"  title="pinned post" icon={faThumbtack}/> &nbsp; </> : <></> }
                {staticContentPost?.megathread ? <><FontAwesomeIcon className="pinned" title="megathread" icon={faReel}/> &nbsp; </> : <></>}
                {staticContentPost?.location} &nbsp;&nbsp;&nbsp;
                {staticContentPost?.local_only? <><FontAwesomeIcon  className="pinned"  title="local" icon={faLocationDot}/> &nbsp; </> : <></> }
                {staticContentPost?.category == "science" ? "STEAM" :
                    staticContentPost?.category == "families" ? "Families" :
                    staticContentPost?.category == "pop" ? "Pop" :
                    staticContentPost?.category == "mingle" ? "Mingle" :
                    staticContentPost?.category == "change" ? "Change" :
                    staticContentPost?.category == "longcovid" ? "Long Covid" :
                    staticContentPost?.category == "newcomers" ? "Newcomers" :
                    staticContentPost?.category == "book" ? "Book Club" :
                    staticContentPost?.category == "housing" ? "Housing" :
                    staticContentPost?.category == "recommendations" ? "Recommendations" :
                    staticContentPost?.category == "events" ? "Events" :
                                            "Refreshments"}
                </IonLabel>
            </IonItem>
            <Link className="postlink" style={{width: "100%"}} to={`/community/${post_id}`}>

            <IonCard className="refreshments-card-in-list ">
                {(currentProfileRefreshments?.hidden_announcements?.includes(post_id) || currentProfileRefreshments?.hidden_authors?.includes(staticContentPost?.user))
                ?
                <IonRow className="hidden ion-justify-content-center">
                    <IonText className="ion-text-center">You have hidden this post or author.</IonText>
                    <IonButton size="small" fill="outline">Show anyway</IonButton>
                </IonRow> 
                :
                (staticContentPost?.sensitive && !settingsCurrentProfile?.settings_show_sensitive_content)?
                <IonRow className="sensitive ion-justify-content-center">
                    <IonText className="ion-text-center" style={{fontWeight: "bold", color: "var(--ion-color-black)"}}>This post contains sensitive content.</IonText>
                    {staticContentPost?.sensitive_description && <IonText className="ion-text-center"style={{paddingTop: "10pt", paddingBottom: "10pt"}} >{staticContentPost?.sensitive_description}</IonText>}
                    <IonButton size="small" fill="outline">Show anyway</IonButton>
                </IonRow> 
                :
                <>
                <IonRow>
                    <IonCol>
                        <IonCardTitle>
                            {staticContentPost?.title}
                        </IonCardTitle>
                    </IonCol>
                </IonRow>

                <IonCardContent className="css-fix">

                    <IonRow>
                        <IonCol size={staticContentPost?.coverPhoto ? "6" : "12"}>
                            <IonText>
                                <p className={staticContentPost?.coverPhoto ? "post-content-more-lines" : "post-content"}>
                                    {staticContentPost?.markdown?
                                        staticContentPost?.preview ?? ""
                                    :
                                    staticContentPost?.content}
                                </p>
                            </IonText>

                        </IonCol>

                        {staticContentPost?.coverPhoto ?
                            <IonCol size="6">
                                <div style={{ position: "relative", paddingLeft: "10pt" }}>
                                    <img alt={staticContentPost?.coverPhoto_alt || "Cover Photo"} src={staticContentPost?.coverPhoto} onError={(e) => onImgError(e)}></img>

                                </div>
                            </IonCol>
                            : <></>}
                    </IonRow>

                </IonCardContent>
                </>
            }
            </IonCard>
            
            </Link>
            {staticContentPost?.poll && 
            <Poll id={staticContentPost?.poll}/>}

            {(currentProfileRefreshments?.hidden_announcements?.includes(post_id) || currentProfileRefreshments?.hidden_authors?.includes(staticContentPost?.user)) ?
            <IonRow className="post-likes"></IonRow> :
            <IonRow className="post-likes">
                <IonCol>
                    <IonRow>
                        {liked ?
                            <IonButton aria-label="Unlike post" size="small" fill="clear" onClick={() => unlikePost()} disabled={currentProfileRefreshmentsLoading}><FontAwesomeIcon color="red" icon={heartFull} /></IonButton> :
                            <IonButton aria-label="Like post" size="small" fill="clear" onClick={() => likePost()} disabled={currentProfileRefreshmentsLoading}><FontAwesomeIcon icon={heartOutline} /></IonButton>}
                        {likedLength > 0 ?
                            <IonText>{likedLength}</IonText>
                            : <></>}
                    </IonRow>
                </IonCol>
                <IonCol>
                    <IonRow>
                        <Link className="postlink" to={`/community/${post_id}`}>
                        <IonButton size="small" fill="clear"><FontAwesomeIcon icon={faComments} /></IonButton>
                        </Link>
                        {dynamicContentPost?.comment_count - commentsNotShownCount > 0 ?
                            <IonText>{dynamicContentPost?.comment_count - commentsNotShownCount}</IonText>
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
                            <IonText data-testid="post-interest-count">{interestedCount}</IonText>
                        ) : null}
                    </IonRow>
                </IonCol>
            </IonRow>
            }






        </IonRow>
    )


};

export default RefreshmentsPost;
