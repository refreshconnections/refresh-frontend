import { IonAvatar, IonBadge, IonButton, IonCard, IonCardContent, IonCardSubtitle, IonCardTitle, IonChip, IonCol, IonItem, IonLabel, IonList, IonRow, IonText, useIonModal } from "@ionic/react";
import React, { useEffect, useState } from "react";
import { increaseStreak, likeAnnouncement, onImgError, unlikeAnnouncement } from "../../hooks/utilities";
import { useQueryClient } from "@tanstack/react-query";

import './RefreshmentsPost.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as heartOutline } from '@fortawesome/pro-regular-svg-icons';
import { faComments } from '@fortawesome/pro-regular-svg-icons/faComments';
import { faHeart as heartFull } from '@fortawesome/pro-solid-svg-icons/faHeart';
import { useGetCommentsNotShownCount } from "../../hooks/api/refreshments/comments-not-shown";
import { Link } from "react-router-dom";
import { faThumbtack } from "@fortawesome/pro-solid-svg-icons/faThumbtack";
import { useGetStaticPostContent } from "../../hooks/api/refreshments/static-post-content";
import { useGetDynamicPostContent } from "../../hooks/api/refreshments/dynamic-post-content";
import { useGetSettingsCurrentProfile } from "../../hooks/api/profiles/settings-current-profile";
import { useGetRefreshmentsCurrentProfile } from "../../hooks/api/profiles/refreshments-current-profile";
import { faLocationDot } from "@fortawesome/pro-solid-svg-icons/faLocationDot";
import Poll from "./Polls/Poll";


type Props = {
    post_id: number
};



const RefreshmentsPost: React.FC<Props> = (props) => {
    const { post_id } = props;

    const staticContentPost = useGetStaticPostContent(post_id).data;
    const dynamicContentPost = useGetDynamicPostContent(post_id).data;

    const {data: currentProfileRefreshments, isLoading: currentProfileRefreshmentsLoading} = useGetRefreshmentsCurrentProfile()
    const {data: settingsCurrentProfile, isLoading: settingsIsLoading} = useGetSettingsCurrentProfile();


    const commentsNotShownCount = useGetCommentsNotShownCount(post_id).data

    const [liked, setLiked] = useState<boolean>(false)
    const [likedLength, setLikedLength] = useState(0)

    const queryClient = useQueryClient()

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



    return (
        <IonRow id={`#${post_id}`}>
            <IonItem class="refreshments-category" lines="none"
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
            <IonItem lines="none" class="refreshments-category-label"
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
                <IonRow class="hidden ion-justify-content-center">
                    <IonText class="ion-text-center">You have hidden this post or author.</IonText>
                    <IonButton size="small" fill="outline">Show anyway</IonButton>
                </IonRow> 
                :
                (staticContentPost?.sensitive && !settingsCurrentProfile?.settings_show_sensitive_content)?
                <IonRow class="sensitive ion-justify-content-center">
                    <IonText class="ion-text-center" style={{fontWeight: "bold", color: "var(--ion-color-black)"}}>This post contains sensitive content.</IonText>
                    {staticContentPost?.sensitive_description && <IonText class="ion-text-center"style={{paddingTop: "10pt", paddingBottom: "10pt"}} >{staticContentPost?.sensitive_description}</IonText>}
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
                    <IonRow onClick={liked || currentProfileRefreshmentsLoading ? () => { } : () => likePost()} >
                        {liked ?
                            <IonButton size="small" fill="clear" onClick={() => unlikePost()} disabled={currentProfileRefreshmentsLoading}><FontAwesomeIcon color="red" icon={heartFull} /></IonButton> :
                            <IonButton size="small" fill="clear" onClick={() => likePost()} disabled={currentProfileRefreshmentsLoading}><FontAwesomeIcon icon={heartOutline} /></IonButton>}
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
            </IonRow>
            }






        </IonRow>
    )


};

export default RefreshmentsPost;


