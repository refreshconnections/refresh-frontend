import { IonContent, RefresherEventDetail, IonHeader, IonCard, IonCardContent, IonPage, IonTitle, IonToolbar, IonCardTitle, IonCardSubtitle, IonButton, IonText, IonFab, IonFabButton, IonIcon, IonRow, IonModal, IonButtons, IonItem, IonLabel, IonList, IonCheckbox, IonInput, IonRefresher, IonRefresherContent, IonFabList, useIonAlert, useIonModal, IonNote, IonCol, IonChip, IonFooter, IonTextarea, IonItemSliding, IonItemOption, IonItemOptions, IonAvatar } from '@ionic/react';
import ProfileCard from '../components/ProfileCard';
import React, { useEffect, useRef, useState } from 'react'
import { close as closeIcon, filter as filterIcon, flower as flowerIcon, heartHalf as heartHalfIcon, person as personIcon, chatbubble, heartOutline as heartIcon, bugOutline as bugIcon } from 'ionicons/icons';
import { alert as alertIcon } from 'ionicons/icons';

import "./Page.css"
import "./PostDetails.css"

import { getCurrentUserProfile, onImgError, getAnnouncementDetails, addComment, unlikeComment, likeComment, getProfileCardInfo, isPersonalPlus } from '../hooks/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as heartOutline } from '@fortawesome/pro-regular-svg-icons/faHeart';
import { faCommentPlus } from '@fortawesome/pro-solid-svg-icons/faCommentPlus';
import { faHeart as heartFull } from '@fortawesome/pro-solid-svg-icons/faHeart';


import EditUsernameModal from '../components/EditUsernameModal';
import ReportModal from '../components/ReportModal';
import ProfileModal from '../components/ProfileModal';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';


type Props = {
  comments: any;
  announcement_id: number,
};


const PostDetails: React.FC<Props> = (props) => {

  const [data, setData] = useState<any>(props.comments);
  const [profileData, setProfileData] = useState<any>(null);
  console.log("props ", props.comments)
  const [myLikes, setMyLikes] = useState<any>(null);
  const [commentInput, setCommentInput] = useState<string | null>(null);
  const [offendingText, setOffendingText] = useState<string | null>(null);
  const [offendingId, setOffendingId] = useState<number | null>(null);
  const [connected, setConnected] = useState<string | null>(null);
  const [noComment, setNoComment] = useState<boolean>(false);
  const [closed, setClosed] = useState<boolean>(false);

  const queryClient = useQueryClient()
  const me = useGetCurrentProfile().data


  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<any>(false);

  useEffect(() => {



    const fetchData = async () => {
      setError(null);
      setLoading(true);
      try {
        setClosed((await getAnnouncementDetails(props.announcement_id)).closed)
        setLoading(false);
      } catch (error: any) {
        setError(error.message);
        setLoading(false)
        console.log(error)
      }

    }

    fetchData();
    console.log("announcement details", data)

  }, []);

  const getTime = (utc: number) => {

    const d = new Date(utc)

    const strDate = d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    return strDate
  }

  const handleUsernameDismiss = async () => {
    usernameDismiss();
  }

  const [usernamePresent, usernameDismiss] = useIonModal(EditUsernameModal, {
    onDismiss: handleUsernameDismiss
  });

  const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

  const createComment = async (text: string) => {
    setNoComment(true)
    const commentData = {
      announcement: props.announcement_id,
      text: text
    }
    const response = await addComment(commentData)
    const detailsResponse = await getAnnouncementDetails(props.announcement_id)
    setData(detailsResponse.comments);

    setCommentInput(null)
    await delay(500)
    setNoComment(false)

    return response
  }

  const heartComment = async (comment_id: number) => {
    console.log("heart! ")
    const response = await likeComment(comment_id)

    // TODO: better way to update heart
    setData((await getAnnouncementDetails(props.announcement_id)).comments);

    return response
  }

  const unheartComment = async (comment_id: number) => {
    const response = await unlikeComment(comment_id)

    // TODO: better way to update heart
    setData((await getAnnouncementDetails(props.announcement_id)).comments);


    return response
  }

  const handleReportOpen = async (text: string, id: number) => {
    setOffendingText(text)
    setOffendingId(id)
    createReportPresent()
  }


  const [createReportPresent, createReportDismiss] = useIonModal(ReportModal, {
    offender: "comment",
    text: offendingText,
    id: offendingId,
    onDismiss: (data: string, role: string) => createReportDismiss(data, role),
  });

  const handleProfileDismiss = async () =>{
    queryClient.invalidateQueries({ queryKey: ['current'] })
    profileDismiss()
  }


  
  const [profilePresent, profileDismiss] = useIonModal(ProfileModal, {
    cardData: profileData,
    profiletype: connected,
    pro: isPersonalPlus(me?.subscription_level),
    settingsAlt: me?.settings_show_alt || true,
    yourName: me?.name || '',
    onDismiss: () => handleProfileDismiss(),
  });


  const openModal = async (id: any) => {
    setProfileData(await getProfileCardInfo(id))
    
    console.log("id, ", id)
    console.log("mut, ", me.mutual_connections)
    console.log("outgoing, ", me.outgoing_connections)
    console.log("hi again me here", profileData)
    if (me?.mutual_connections.includes(id) || me?.outgoing_connections.includes(id)) {
      console.log("HERE")
      setConnected("connected-nodismiss")
    }
    else {
      setConnected("unconnected-nodismiss")
    }
    profilePresent();
  }

  const onClickHandler = (item) => {

    if (me?.settings_community_profile && item.settings_community_profile && !item.removed && !(me?.user === item.user)) {
      openModal(item.user)
    }
    else {
      setProfileData(null)
    }

  }






  return (
    <IonList class="comments">
      {data.map((item: any, index: number) => (
            <>
            <IonItemSliding key={index}>
              {item.approved?
              <IonItem className={me?.user == item.user ? "selfwritten" : "written"}>
                {/* {(item.settings_community_profile && !item.removed) ? <IonAvatar><img src={item.profile_image} onError={(e) => onImgError(e)} /></IonAvatar> : <></>} */}
                <IonLabel onClick={()=>onClickHandler(item)}>
                  {item.removed ?
                  <>
                  <h4 style={{color: "maroon"}}>This comment has been removed.</h4>
                  {item.removed_reason ? <h4>Reason : {item.removed_reason}</h4> : <></>}
                  </>
                  :
                  <>
                  <div className="name-avatar">
                  {(item.settings_community_profile && me?.settings_community_profile && !item.removed) ? <IonAvatar><img src={item.profile_image} onError={(e) => onImgError(e)} /></IonAvatar> : <></>}
                  <h3> {item.username ? item.username : "Anonymous"}</h3>
                  </div>
                  <h4>{item.text}</h4>
                  </>
                  }
                </IonLabel>
                {me?.user && item.liked_by.includes(me.user) ?
                  <IonButton size="small" fill="clear" onClick={() => unheartComment(item.id)}><FontAwesomeIcon color="red" icon={heartFull} /></IonButton> :
                  <IonButton size="small" fill="clear" onClick={() => heartComment(item.id)}><FontAwesomeIcon icon={heartOutline} /></IonButton>}
                {item.liked_by.length > 0 ?
                  <IonText>{item.liked_by.length}</IonText>
                  : <></>}
              </IonItem>
              : <></>}
              <IonItemOptions side="start">
                <IonItemOption disabled={true} class="message-timestamp">{getTime(item.uploadDateTime)}</IonItemOption>
              </IonItemOptions>
              {me?.user !== item.user ?
              <IonItemOptions side="end">
                <IonItemOption color="danger" ><IonButton fill="clear" color="light" onClick={() => handleReportOpen(item.text, item.id)}><IonIcon icon={alertIcon}></IonIcon></IonButton></IonItemOption>
              </IonItemOptions>
              : <></>}
            </IonItemSliding>
            </>

      ))}
      {loading || me?.username ?
        <IonRow>
          <IonCol size="10">
            <IonItem className="inputted" counter={true}>
              <IonTextarea value={commentInput}
                name="comment_input"
                onIonChange={e => setCommentInput(e.detail.value!)}
                disabled={closed}
                maxlength={400}
                placeholder={closed ? "Discussion closed. Want to start a new one?" : "Leave your own comment"}
                autoCapitalize='sentences'
              />
            </IonItem>
          </IonCol>
          <IonCol size="2">
            <IonButton expand="block" className="send-button" color="tertiary" disabled={noComment || closed || loading} onClick={() => createComment(commentInput!)}>
              <FontAwesomeIcon icon={faCommentPlus} />
            </IonButton>
          </IonCol>
        </IonRow>
        :
        <IonRow className="ion-justify-content-center comment-username">
          <IonButton onClick={() => usernamePresent()} color="tertiary">
            Set a public username to post a comment!
          </IonButton>
        </IonRow>}
    </IonList>
  )

};



export default PostDetails;

