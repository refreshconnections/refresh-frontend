import { IonAvatar, IonButton, IonCol, IonContent, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonPage, IonRow, IonSkeletonText, IonSpinner, IonText, IonTextarea, useIonAlert, useIonModal, useIonRouter } from "@ionic/react";
import React, { useEffect, useRef, useState } from "react";
import { authorSidenoteComment, editComment, getAvatarDisplay, getInternalAppPath, increaseStreak, likeComment, onImgError, openExternalUrl, removeComment, sidenoteComment, unlikeComment } from "../../hooks/utilities";
import { useSheetModal } from "../../hooks/useSheetModal";
import { useQueryClient } from "@tanstack/react-query";
import Linkify from 'react-linkify';


import './Comments.css'
import ReportModal from "../ReportModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


import { faHeart as heartOutline } from '@fortawesome/pro-regular-svg-icons';
import { faComments } from '@fortawesome/pro-regular-svg-icons/faComments';
import { faHeart as heartFull } from '@fortawesome/pro-solid-svg-icons/faHeart';
import { useGetIndividualComment } from "../../hooks/api/refreshments/individual-comment";

import { alert as alertIcon, removeCircleOutline, chatbubble, informationCircleOutline } from 'ionicons/icons';
import CommentReplies from "./CommentReplies";
import CommunityProfileModal from "../CommunityProfileModal";
import moment from "moment";
import { faMessageXmark, faPen } from "@fortawesome/pro-solid-svg-icons";
import { useGetLimits } from "../../hooks/api/profiles/current-limits";
import { useGetDynamicIndividualComment } from "../../hooks/api/refreshments/individual-comment-dynamic";
import { useGetStaticIndividualComment } from "../../hooks/api/refreshments/individual-comment-static";
import { useGetRefreshmentsCurrentProfile } from "../../hooks/api/profiles/refreshments-current-profile";
import { useGetGlobalAppCurrentProfile } from "../../hooks/api/profiles/global-app-current-profile";
import { useGetSettingsCurrentProfile } from "../../hooks/api/profiles/settings-current-profile";
import { useGetOutgoingConnections } from "../../hooks/api/profiles/outgoing-connections";
import { useGetMutualConnections } from "../../hooks/api/profiles/mutual-connections";
import { postQueryKeys } from "../../hooks/api/refreshments";
import { ModerationNote } from "./ModerationNote";





type Props = {
  comment: any,
  showSidenotes: boolean,
  setReplyTo: React.Dispatch<React.SetStateAction<any | null>>
  replyTo?: any;
  isAReply: boolean;
  onLikeUnlike: (commentId: string | number) => void;
  forceShowReplies?: boolean;
};

const recentlyPosted = (postedDate) => {
  return moment().diff(postedDate, 'seconds') < 120
}



const CommentItem: React.FC<Props> = (props) => {


  const { comment, showSidenotes, setReplyTo, replyTo, isAReply, onLikeUnlike, forceShowReplies } = props;



  const queryClient = useQueryClient()
  const router = useIonRouter();


  // const {data: comment, isLoading: commentLoading} = useGetStaticIndividualComment(comment_id)
  const { data: currentProfileRefreshments, isLoading: currentProfileRefreshmentsLoading } = useGetRefreshmentsCurrentProfile()

  const { data: globalCurrentProfile, isLoading: globalIsLoading } = useGetGlobalAppCurrentProfile();
  const { data: settingsCurrentProfile, isLoading: settingsIsLoading } = useGetSettingsCurrentProfile();

  const outgoingConnections = useGetOutgoingConnections().data
  const mutualConnections = useGetMutualConnections().data

  // const commentReplies = useGetCommentReplies(comment_id).data

  const profileLoading = false;
  const commentAnonymous = !comment?.username || String(comment?.username).toLowerCase() === 'anonymous';
  const { className: avatarClassName, src: avatarSrc, hasImage: hasCommunityImage } = getAvatarDisplay({
    profileImage: commentAnonymous ? null : comment?.profile_image,
    viewerConnect: settingsCurrentProfile?.settings_community_profile,
    authorConnect: comment?.settings_community_profile,
  });
  const avatarOverride = hasCommunityImage ? avatarSrc : null;



  const limits = useGetLimits().data
  const openAppOrExternalUrl = (url: string) => {
    const internalPath = getInternalAppPath(url);
    if (internalPath) {
      router.push(internalPath);
      return;
    }
    openExternalUrl(url);
  };


  const [liked, setLiked] = useState<boolean>(false)
  const [likedLength, setLikedLength] = useState(0)
  const [commentText, setCommentText] = useState<string>(comment?.text ?? "");
  const [originalTextState, setOriginalTextState] = useState<string>(comment?.original_text ?? "");
  const [editedAtState, setEditedAtState] = useState<string>(comment?.edited_at ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<string>(comment?.text ?? "");
  const [editSaving, setEditSaving] = useState(false);
  const editTextareaRef = useRef<HTMLIonTextareaElement | null>(null);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        editTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 300);
    }
  }, [isEditing]);

  const [presentSidenoteAlert] = useIonAlert();
  const [presentSidenoteAlertConfirmation] = useIonAlert();
  const [presentSidenoteInfo] = useIonAlert();
  const slidingRef = useRef<HTMLIonItemSlidingElement | null>(null);

  const isOwner = globalCurrentProfile?.user === comment?.user;
  // Owners should still see moderator-hidden comments so they can understand what happened
  // without enabling "show sidenotes", but self-removed comments should feel gone unless a
  // moderator reason is attached.
  const showOwnHidden = isOwner && (comment?.sidenoted || (comment?.removed && comment?.removed_reason));
  const reportedByMe = Array.isArray(currentProfileRefreshments?.reported_comments)
    ? currentProfileRefreshments.reported_comments.includes(comment?.id)
    : false;
  const sidenotedByMe = Array.isArray(currentProfileRefreshments?.comment_sidenotes)
    ? currentProfileRefreshments.comment_sidenotes.includes(comment?.id)
    : false;
  // "Show sidenotes" is the moderator-view toggle for hidden thread context, so it also
  // allows non-owners to see removed-comment placeholders, not just sidenoted comments.
  const canShowComment = comment?.approved
    && (
      (!comment?.sidenoted && !comment?.removed && !reportedByMe && !sidenotedByMe)
      || showSidenotes
      || showOwnHidden
    );

  const showSidenoteInfo = () => {
    presentSidenoteInfo({
      header: 'Comment has been sidenoted',
      message: "Sidenoted comments don't show up for most members by default to keep threads on topic.",
      buttons: ['OK'],
    });
  };

  const canEdit = isOwner
    && !comment?.removed
    && !comment?.sidenoted
    && moment().diff(comment?.uploadDateTime, 'minutes') <= 5;

  const handleStartEdit = async () => {
    if (slidingRef.current) {
      await slidingRef.current.closeOpened();
      await slidingRef.current.close();
    }
    setEditDraft(commentText ?? "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditDraft(commentText ?? "");
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    const newText = (editDraft ?? "").trim();
    if (!newText || editSaving) {
      return;
    }
    try {
      setEditSaving(true);
      if (!originalTextState) {
        setOriginalTextState(commentText);
      }
      await editComment(comment?.id, newText);
      setCommentText(newText);
      setEditedAtState(new Date().toISOString());
      queryClient.invalidateQueries({ queryKey: postQueryKeys.comment(comment?.id) });
      queryClient.invalidateQueries({ queryKey: postQueryKeys.staticcomment(comment?.id) });
      setIsEditing(false);
    } finally {
      setEditSaving(false);
    }
  };

  const editedLabelVisible = !!((comment?.edited_at && comment?.original_text) || (editedAtState && originalTextState));

  const OriginalCommentModal: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
    <IonContent className="ion-padding comment-original-modal-content" scrollY={true}>
      <IonRow className="comment-original-header">
        <IonCol size="8">
          <h4 className="comment-original-title">Original comment</h4>
          <h5 className="comment-original-time">({getTime(comment?.uploadDateTime)})</h5>
        </IonCol>
        <IonCol size="4" className="comment-original-close-col">
          <IonButton fill="clear" onClick={onDismiss}>Close</IonButton>
        </IonCol>
      </IonRow>
      <p className="css-fix">
        {comment?.original_text || originalTextState}
      </p>
      <IonText className="comment-original-note">
        Comments can be edited for 5 minutes after they are posted.
      </IonText>
    </IonContent>
  );

  const [presentOriginalComment, dismissOriginalComment] = useIonModal(OriginalCommentModal, {
    onDismiss: () => dismissOriginalComment(),
  });

  const heartComment = async () => {

    setLiked(true)
    setLikedLength(likedLength + 1)
    onLikeUnlike(comment?.id);
    const response = await likeComment(comment?.id)
    await increaseStreak()
    return response
  }

  const unheartComment = async () => {
    setLiked(false)
    setLikedLength(likedLength - 1)
    onLikeUnlike(comment?.id);
    const response = await unlikeComment(comment?.id)
    return response
  }

  useEffect(() => {
    if (comment?.like_count) {
      setLikedLength(comment?.like_count)
    }

  }, [comment?.like_count])

  useEffect(() => {
    setCommentText(comment?.text ?? "");
    setOriginalTextState(comment?.original_text ?? "");
    setEditedAtState(comment?.edited_at ?? "");
    setIsEditing(false);
    setEditDraft(comment?.text ?? "");
  }, [comment?.text, comment?.original_text, comment?.edited_at]);

  useEffect(() => {

    if (currentProfileRefreshments?.comment_likes) {
      setLiked(currentProfileRefreshments?.comment_likes?.includes(comment?.id))
    }

  }, [currentProfileRefreshments?.comment_likes])





  const getTime = (utc: number) => {
    const d = new Date(utc)
    const strDate = d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    return strDate
  }

  const [createReportPresent, createReportDismiss] = useIonModal(ReportModal, {
    offender: "comment",
    id: comment?.id,
    text: comment?.text,
    onDismiss: (data: string, role: string) => createReportDismiss(data, role),
  });

  const sidenoteAlert = async () => {
    if (currentProfileRefreshments?.comment_sidenotes?.includes(comment?.id)) {
      presentSidenoteAlert({
        header: 'You have already marked this comment as needing a sidenote.',
        buttons: [
          {
            text: 'Ok',
            role: 'cancel',

          },
        ],
      })

    }
    else {
      presentSidenoteAlert({
        header: 'Is this comment off-topic?',
        subHeader: "Let the moderators know that this comment doesn't really fit so they can sidenote it.",
        buttons: [
          {
            text: 'Nevermind',
            role: 'cancel',

          },
          {
            text: 'Yes!',
            role: 'confirm',
            handler: async () => {
              const response = await sidenoteComment(comment?.id)
              sidenoteAlertConfirmed()
              queryClient.invalidateQueries({ queryKey: ['refreshments-current'] })
              return response
            },
          },
        ],

      })
    }
  }

  const sidenoteAlertConfirmed = () => {
    presentSidenoteAlertConfirmation({
      header: 'Thank you!',
      subHeader: "The moderators will check this out.",
      buttons: [
        {
          text: 'Ok',
          role: 'cancel',
        }
      ],
    })
  }

  const authorSidenoteAlert = async () => {
    presentSidenoteAlert({
      header: 'Is this comment off-topic?',
      subHeader: "As the author, comments you sidenote will be immediately be hidden.",
      buttons: [
        {
          text: 'Nevermind',
          role: 'cancel',

        },
        {
          text: 'Yes!',
          role: 'confirm',
          handler: async () => {
            const response = await authorSidenoteComment(comment?.id)
            if (isAReply) {
              queryClient.invalidateQueries({ queryKey: ['refreshments', 'comment', 'replies', replyTo?.id] });
            }
            else {
              queryClient.invalidateQueries({
                queryKey: ['top-comments', parseInt(comment?.id)], exact: false,
              });
            }

            queryClient.invalidateQueries({
              queryKey: ['posts', 'comment', comment?.id],
            })
            queryClient.invalidateQueries({ queryKey: ['refreshments-current'] })
            queryClient.invalidateQueries({ queryKey: ['notshown', comment?.announcement] })
            return response
          },
        },
      ],

    })
  }

  const removeCommentAlert = async () => {
    presentSidenoteAlert({
      header: 'Do you want to remove the comment you just posted?',
      subHeader: `Please note: You can only remove comments ${5 - limits?.comments_removed} more times this month. Removed comments will also be sidenoted.`,
      buttons: [
        {
          text: 'Nevermind',
          role: 'cancel',

        },
        {
          text: 'Yes, remove!',
          role: 'destructive',
          handler: async () => {
            const response = await removeComment(comment?.id)
            queryClient.invalidateQueries({
              queryKey: ['posts', 'comment', comment?.id],
            })
            if (isAReply) {
              queryClient.invalidateQueries({ queryKey: ['refreshments', 'comment', 'replies', replyTo?.id] });
            }
            else {
              queryClient.invalidateQueries({
                queryKey: ['top-comments', parseInt(comment?.id)], exact: false,
              });
            }
            queryClient.invalidateQueries({ queryKey: ['notshown', comment?.announcement] })
            queryClient.invalidateQueries({
              queryKey: ['limits'],
            })
            return response
          },
        },
      ],

    })
  }

  const [communityProfilePresent, communityProfileDismiss] = useSheetModal(CommunityProfileModal, {
    userId: comment?.user ?? null,
    isAnonymous: commentAnonymous,
    avatarUrl: avatarOverride,
    onDismiss: () => communityProfileDismiss(),
  });

  const onClickProfileHandler = () => {
    if (commentAnonymous) return;
    if (!comment?.user) return;
    communityProfilePresent({ cssClass: 'community-profile-modal' });
  }


  return (
    <>
      {false ?
        <IonItem className="written">
          <div className="commentdiv">
            <IonLabel className="comment-label">
              <>
                <div className="name-avatar">
                  <IonAvatar><IonSkeletonText animated={true}></IonSkeletonText></IonAvatar>
                  <h3 style={{ width: '100pt' }}> <IonSkeletonText animated={true} ></IonSkeletonText></h3>
                </div>
                <h4 > <IonSkeletonText animated={true} style={{ width: '100%' }}></IonSkeletonText> </h4>
                <h4 > <IonSkeletonText animated={true} style={{ width: '100%' }}></IonSkeletonText> </h4>
                <h4 > <IonSkeletonText animated={true} style={{ width: '100%' }}></IonSkeletonText> </h4>
              </>
            </IonLabel>

          </div>
        </IonItem>
        :
        <>
          {canShowComment ?
            <>
              <IonItemSliding ref={slidingRef} key={comment?.id} disabled={isEditing}>
                <IonItem id={`comment-${comment?.id}`} className={replyTo?.id == comment.id ? "replyingto" : recentlyPosted(comment.uploadDateTime) && globalCurrentProfile?.user == comment.user ? "selfrecent" : recentlyPosted(comment.uploadDateTime) ? "writtenrecent" : globalCurrentProfile?.user == comment.user ? "selfwritten" : "written"}>
                  <div className="commentdiv">
                    <IonLabel className="comment-label">
                      {!comment?.approved ?
                        <></>
                        :
                        comment?.removed ?
                          <>
                            <h4 style={{ color: "var(--ion-color-maroon)" }}>
                              {isOwner ? "Your removed comments are only visible to you." : "This comment has been removed."}
                            </h4>
                            {comment?.removed_reason && (
                              <h4 style={{ color: "var(--ion-color-maroon)" }}>Removal reason: {comment?.removed_reason}</h4>
                            )}
                                {isOwner && (
                                  <div className="name-avatar">
                                <IonAvatar className={avatarClassName}>
                                  <img src={avatarSrc} onError={(e) => onImgError(e)} />
                                </IonAvatar>
                                <h3>{comment?.username ? comment?.username : "Anonymous"}</h3>
                              </div>
                            )}
                            {isOwner && comment?.removed_reason ? (
                              <>
                                <h4 className="css-fix"><Linkify componentDecorator={(href, text, key) => <a key={key} onClick={(e) => { e.preventDefault(); openAppOrExternalUrl(href); }} style={{ cursor: 'pointer' }}>{text}</a>}>{commentText}</Linkify></h4>
                              </>
                            ) : null}
                            <ModerationNote
                              moderationNote={comment.moderation_note}
                              moderationIconOnly={false}
                              moderationNoteLonger={comment.moderation_note_longer}
                            />
                          </>
                          : comment?.sidenoted ?
                          <>
                            <IonRow className="ion-align-items-center">
                              <h4 style={{ color: "var(--ion-color-maroon)", marginRight: "6px" }}>This comment has been sidenoted.</h4>
                              {isOwner && (
                                <IonButton fill="clear" size="small" onClick={showSidenoteInfo}>
                                  <IonIcon icon={informationCircleOutline}></IonIcon>
                                </IonButton>
                              )}
                            </IonRow>
                            <div className="name-avatar">
                              <IonAvatar className={avatarClassName}>
                                <img src={avatarSrc} onError={(e) => onImgError(e)} />
                              </IonAvatar>
                              <h3>{comment?.username ? comment?.username : "Anonymous"}</h3>
                            </div>
                            <h4 className="css-fix"><Linkify componentDecorator={(href, text, key) => <a key={key} onClick={(e) => { e.preventDefault(); openAppOrExternalUrl(href); }} style={{ cursor: 'pointer' }}>{text}</a>}>{commentText}</Linkify></h4>
                            <ModerationNote
                              moderationNote={comment.moderation_note}
                              moderationIconOnly={false}
                              moderationNoteLonger={comment.moderation_note_longer}
                            />
                          </>
                          : reportedByMe ?
                          <>
                            <div className="name-avatar">
                              <IonAvatar className={avatarClassName}>
                                <img src={avatarSrc} onError={(e) => onImgError(e)} />
                              </IonAvatar>
                              <h3>{comment?.username ? comment?.username : "Anonymous"}</h3>
                            </div>
                            <h4 className="css-fix"><Linkify componentDecorator={(href, text, key) => <a key={key} onClick={(e) => { e.preventDefault(); openAppOrExternalUrl(href); }} style={{ cursor: 'pointer' }}>{text}</a>}>{commentText}</Linkify></h4>
                          </>
                          : sidenotedByMe ?
                          <>
                            <div className="name-avatar">
                              <IonAvatar className={avatarClassName}>
                                <img src={avatarSrc} onError={(e) => onImgError(e)} />
                              </IonAvatar>
                              <h3>{comment?.username ? comment?.username : "Anonymous"}</h3>
                            </div>
                            <h4 className="css-fix"><Linkify componentDecorator={(href, text, key) => <a key={key} onClick={(e) => { e.preventDefault(); openAppOrExternalUrl(href); }} style={{ cursor: 'pointer' }}>{text}</a>}>{commentText}</Linkify></h4>
                          </>
                          :
                          <>
                            <div
                              className="name-avatar comment-name-row"
                              onClick={(!isEditing && !commentAnonymous) ? () => onClickProfileHandler() : undefined}
                              style={(!isEditing && !commentAnonymous) ? { cursor: 'pointer' } : undefined}
                            >
                              <IonAvatar className={avatarClassName}>
                                <img src={avatarSrc} onError={(e) => onImgError(e)} />
                              </IonAvatar>
                              <h3> {comment?.username ? comment?.username : "Anonymous"}</h3>
                              {profileLoading && <IonSpinner name="bubbles"></IonSpinner>}
                            </div>
                            {isEditing ? (
                              <div className="comment-edit-inline">
                                <IonTextarea
                                  ref={editTextareaRef}
                                  aria-label="Edit comment text"
                                  value={editDraft}
                                  rows={4}
                                  autocapitalize="sentences"
                                  autoCorrect="on"
                                  spellcheck
                                  onIonInput={(event) => setEditDraft(event.detail.value ?? "")}
                                />
                                <div className="comment-edit-actions">
                                  <IonButton aria-label="Cancel edit" size="small" fill="clear" color="medium" onClick={handleCancelEdit}>
                                    Cancel
                                  </IonButton>
                                  <IonButton aria-label="Save comment" size="small" color="primary" onClick={handleSaveEdit} disabled={editSaving}>
                                    {editSaving ? "Saving..." : "Save"}
                                  </IonButton>
                                </div>
                              </div>
                            ) : (
                              <h4 className="css-fix comment-body-text"><Linkify componentDecorator={(href, text, key) => <a key={key} onClick={(e) => { e.preventDefault(); openAppOrExternalUrl(href); }} style={{ cursor: 'pointer' }}>{text}</a>}>{commentText}</Linkify></h4>
                            )}
                          </>
                      }
                    </IonLabel>


                    {comment?.sidenoted || comment?.removed ?
                      <div style={{ textAlign: "end", display: "flex", justifyContent: "flex-end" }} >
                        <div style={{ alignItems: "center", display: "inline-flex", paddingTop: "5pt" }}>
                          <ModerationNote
                            moderationNote={comment.moderation_note}
                            moderationIconOnly={comment.moderation_icon_only}
                            moderationNoteLonger={comment.moderation_note_longer}
                          />
                        </div>
                        <div style={{ alignItems: "center", textAlign: "end", display: "flex", justifyContent: "flex-end", paddingTop: "5pt"  }} >
                          <IonButton size="small" fill="clear" disabled style={{ width: "80pt" }}>
                            <IonIcon icon={removeCircleOutline}></IonIcon>
                          </IonButton>
                        </div>
                      </div> :
                      <div style={{ textAlign: "end", display: "flex", justifyContent: "flex-end" }} >
                        <div style={{ alignItems: "center", display: "inline-flex", paddingTop: "5pt" }}>
                          <ModerationNote
                            moderationNote={comment.moderation_note}
                            moderationIconOnly={comment.moderation_icon_only}
                            moderationNoteLonger={comment.moderation_note_longer}
                          />
                        </div>
                        {editedLabelVisible && (
                          <IonButton
                            fill="clear"
                            size="small"
                            onClick={() => {
                              presentOriginalComment({
                                showBackdrop: false,
                                backdropDismiss: true,
                                breakpoints: [0, 0.3, 0.9],
                                initialBreakpoint: 0.3,
                                handleBehavior: "none",
                                expandToScroll: false,
                                cssClass: "comment-original-modal",
                              });
                            }}
                            style={{ marginRight: "4px" }}
                          >
                            <IonText color="medium" style={{ fontSize: "10pt" }}>
                              edited
                            </IonText>
                          </IonButton>
                        )}
                        <div style={{ alignItems: "center", display: "inline-flex", paddingTop: "5pt" }} >
                          <IonButton fill="clear" color="primary" onClick={() => setReplyTo(isAReply ? comment.reply_to : comment)}><FontAwesomeIcon icon={faComments} /></IonButton>
                          {comment?.reply_count > 0 ?
                            <IonText style={{ width: "50pt", textAlign: "start", fontSize: "10pt" }} onClick={() => setReplyTo(isAReply ? comment.reply_to : comment)}>{comment?.reply_count} {comment?.reply_count == 1 ? "reply" : "replies"}</IonText>
                            : <div style={{ width: "15pt" }}></div>
                          }
                        </div>
                        <div style={{ width: "60pt", alignItems: "center", display: "inline-flex", paddingTop: "5pt" }}>
                          {liked ?
                            <IonButton size="small" fill="clear" onClick={() => unheartComment()}><FontAwesomeIcon color="red" icon={heartFull} /></IonButton> :
                            <IonButton size="small" fill="clear" onClick={() => heartComment()}><FontAwesomeIcon icon={heartOutline} /></IonButton>}
                          {likedLength > 0 ?
                            <IonText style={{ width: "20pt", textAlign: "start" }}>{likedLength}</IonText>
                            : <div style={{ width: "20pt" }}></div>}
                        </div>
                      </div>
                    }
                  </div>
                </IonItem>
                {!isEditing && (
                  <>
                    <IonItemOptions side="start">
                      <IonItemOption disabled={true} className="message-timestamp">{getTime(comment?.uploadDateTime)}</IonItemOption>
                    </IonItemOptions>
                    {globalCurrentProfile?.user !== comment?.user ?
                      <IonItemOptions side="end">
                        <IonItemOption color="danger">
                          <IonButton
                            fill="clear"
                            color="light"
                            onClick={() => createReportPresent()}
                            disabled={reportedByMe}
                          >
                            <IonIcon icon={alertIcon}></IonIcon>
                          </IonButton>
                        </IonItemOption>
                        {comment?.sidenoted ? <></> :
                          <IonItemOption color="gray" ><IonButton fill="clear" color="black" onClick={comment?.post_author == globalCurrentProfile?.user ? () => authorSidenoteAlert() : () => sidenoteAlert()}><IonIcon icon={removeCircleOutline}></IonIcon></IonButton></IonItemOption>
                        }
                        <IonItemOption color="primary" ><IonButton fill="clear" color="white" onClick={() => setReplyTo(isAReply ? comment.reply_to : comment)}><FontAwesomeIcon icon={faComments} /></IonButton></IonItemOption>
                      </IonItemOptions>
                      :
                      <IonItemOptions side="end">
                        <>
                          <IonItemOption color="primary" ><IonButton fill="clear" color="white" onClick={() => setReplyTo(isAReply ? comment.reply_to : comment)}><FontAwesomeIcon icon={faComments} /></IonButton></IonItemOption>
                          {canEdit && (
                            <IonItemOption color="medium">
                              <IonButton aria-label="Edit comment" fill="clear" color="white" onClick={handleStartEdit} disabled={isEditing}>
                                <FontAwesomeIcon icon={faPen} />
                              </IonButton>
                            </IonItemOption>
                          )}
                          {(limits?.comments_removed < 5 && recentlyPosted(comment.uploadDateTime)) &&
                            <IonItemOption color="black" ><IonButton fill="clear" color="white" onClick={() => removeCommentAlert()}><FontAwesomeIcon icon={faMessageXmark}></FontAwesomeIcon></IonButton></IonItemOption>
                          }
                        </>
                      </IonItemOptions>}
                  </>
                )}
              </IonItemSliding>
              {(comment?.preview_reply || comment?.reply_count > 0 || forceShowReplies) && (
                <CommentReplies
                  commentId={comment.id}
                  previewReply={comment.preview_reply}
                  showSidenotes={showSidenotes}
                  setReplyTo={setReplyTo}
                  replyTo={replyTo}
                  onLikeUnlike={onLikeUnlike}
                  replyCount={comment.reply_count}
                  forceOpen={forceShowReplies}
                />
              )}


            </>
            : <></>}
        </>
      }
    </>
  )


};

export default CommentItem;
