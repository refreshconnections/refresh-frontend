import { IonContent, RefresherEventDetail, IonHeader, IonCard, IonCardContent, IonPage, IonTitle, IonToolbar, IonCardTitle, IonCardSubtitle, IonButton, IonText, IonFab, IonFabButton, IonIcon, IonRow, IonModal, IonButtons, IonItem, IonLabel, IonList, IonCheckbox, IonInput, IonRefresher, IonRefresherContent, IonFabList, useIonAlert, useIonModal, IonNote, IonCol, IonGrid, IonSelect, IonSelectOption, IonTextarea, IonAlert } from '@ionic/react';
import React from 'react'
import { chevronBackOutline } from 'ionicons/icons';


import "./Page.css"
import "./Activity.css"


import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useGetRecentNotifications } from '../hooks/api/profiles/recent-notifications';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMugHot } from '@fortawesome/pro-solid-svg-icons/faMugHot';
import { faPlus } from '@fortawesome/pro-solid-svg-icons/faPlus';
import { faComments } from '@fortawesome/pro-solid-svg-icons/faComments';
import { faSparkles } from '@fortawesome/pro-solid-svg-icons/faSparkles';
import moment from 'moment';
import { useGetCurrentStreak } from '../hooks/api/profiles/current-streak';
import { faStarShooting } from '@fortawesome/pro-regular-svg-icons/faStarShooting';
import { faHeart } from '@fortawesome/pro-solid-svg-icons/faHeart';
import { useGetLimits } from '../hooks/api/profiles/current-limits';
import { faStar } from '@fortawesome/pro-solid-svg-icons';




const Activity: React.FC = () => {

    const currentUserProfile = useGetCurrentProfile().data;
    const recentNotifications = useGetRecentNotifications().data;
    const streak = useGetCurrentStreak().data;
    const limits = useGetLimits().data;

    return (
        <IonPage>
            <IonContent class="activity">
                <IonFab class="very-top" slot="fixed" vertical="top" horizontal="start">
                    <IonFabButton routerLink="/me" routerDirection="back" color="light">
                        <IonIcon icon={chevronBackOutline}></IonIcon>
                    </IonFabButton>
                </IonFab>

                <IonRow class="page-title bigger">
                    <img className="color-invertible" src="../static/img/activity-navy.png" alt="activity" />
                </IonRow>

                {currentUserProfile?.settings_streak_tracker ?
                    <>
                        <IonNote class="header"><FontAwesomeIcon icon={faStarShooting} /> &nbsp;{streak?.streak_count == 0 ? "You don't have a streak yet!" : `Streak count: ${streak?.streak_count}`}</IonNote>
                        <IonRow class="ion-padding ion-justify-content-center">
                            {currentUserProfile?.subscription_level == "pro" ?
                                <IonText color="navy" class="ion-padding ion-text-center">As a pro member, your streak is just for fun!</IonText> :
                                <>
                                    {currentUserProfile?.subscription_level == "communityplus" ?
                                        <>
                                            <IonText color="navy" class="ion-padding ion-text-center">As a Community+ member, your streak can unlock you some of the benefits of Personal+ too!</IonText>
                                            <>{streak?.streak_count < 3 ?
                                                <IonText color="navy" class="ion-padding ion-text-center">
                                                    Increase your streak to unlock more <FontAwesomeIcon icon={faStar} /> features.
                                                </IonText>
                                                :
                                                <IonText color="navy" class="ion-padding ">
                                                    <>
                                                        Your streak has unlocked the following <FontAwesomeIcon icon={faStar} />  {streak?.streak_count < 7 ? "feature" : "features"}:
                                                        <ul>
                                                            {streak?.streak_count >= 3 ?
                                                                <li>
                                                                    Viewing all Let's Talk Abouts on all profiles.
                                                                </li>
                                                                : <></>}
                                                            {streak?.streak_count >= 7 ?
                                                                <li>
                                                                    Viewing all of your Likes at once.
                                                                </li>
                                                                : <></>}
                                                        </ul>
                                                    </>
                                                </IonText>

                                            }</>
                                        </>
                                        :
                                        currentUserProfile?.subscription_level == "personalplus" ?
                                            <>
                                            <IonText color="navy" class="ion-padding ion-text-center">As a Personal+ member, your streak can unlock you some of the benefits of Community+ too!</IonText>
                                            <>{streak?.streak_count < 5 ?
                                                <IonText color="navy" class="ion-padding ion-text-center">
                                                    Increase your streak to unlock more <FontAwesomeIcon icon={faStar} /> features.
                                                </IonText>
                                                :
                                                <IonText color="navy" class="ion-padding ">
                                                    <>
                                                        Your streak has unlocked the following <FontAwesomeIcon icon={faStar} />  {streak?.streak_count < 7 ? "feature" : "features"}:
                                                        <ul>
                                                            {streak?.streak_count >= 5 ?
                                                                <li>
                                                                    Submitting posts to the Refreshments Bar community forum.*
                                                                </li>
                                                                : <></>}
                                                        </ul>
                                                    </>
                                                </IonText>

                                            }</>
                                            </>
                                            : <>{streak?.streak_count < 3 ?
                                                <IonText color="navy" class="ion-padding ion-text-center">
                                                    Increase your streak to unlock <FontAwesomeIcon icon={faStar} /> features.
                                                </IonText>
                                                :
                                                <IonText color="navy" class="ion-padding ">
                                                    <>
                                                        Your streak has unlocked the following <FontAwesomeIcon icon={faStar} />  {streak?.streak_count < 5 ? "feature" : "features"}:
                                                        <ul>
                                                            {streak?.streak_count >= 3 ?
                                                                <li>
                                                                    Viewing all Let's Talk Abouts on all profiles.
                                                                </li>
                                                                : <></>}
                                                            {streak?.streak_count >= 5 ?
                                                                <li>
                                                                    Submitting posts to the Refreshments Bar community forum.*
                                                                </li>
                                                                : <></>}
                                                            {streak?.streak_count >= 7 ?
                                                                <li>
                                                                    Viewing all of your Likes at once.
                                                                </li>
                                                                : <></>}
                                                        </ul>
                                                    </>
                                                </IonText>

                                            }</>}

                                </>


                            }
                            {/* <IonItem class="streak" color="white" lines="none">
                <IonLabel color="navy">
                <FontAwesomeIcon icon={faStarShooting} /> Streak count: {streak?.streak_count}</IonLabel>
                </IonItem> */}
                            <IonNote class="ion-padding ion-text-center">
                                Streaks can be increased daily by exchanging messages, sending Likes, making connections, or liking posts and comments in the Refreshments Bar community forum.
                            </IonNote>
                            {streak?.streak_count > 0 ?
                                <IonNote color="navy" class="ion-padding ion-text-center">Your streak was last updated {moment(streak?.last_updated).fromNow()}.</IonNote>
                                : <></>}
                        </IonRow>
                    </>
                    : <></>}

                {recentNotifications?.length > 0 ?

                    <IonNote class="header">Recent happenings</IonNote>

                    : <></>

                }


                <IonList class="change-projects" lines="none">


                    {recentNotifications?.map((item: any, index: number) => (

                        <IonItem color="white" key={item.id} >

                            <IonLabel color="navy" class="ion-text-wrap">
                                <h3>
                                    {item.notification_type == "comment" ?
                                        <FontAwesomeIcon icon={faComments} /> :
                                        item.notification_type == "connection" ?
                                            <FontAwesomeIcon icon={faPlus} /> :
                                            item.notification_type == "post" ?
                                                <FontAwesomeIcon icon={faMugHot} /> :
                                                item.notification_type == "like" ?
                                                    <FontAwesomeIcon icon={faHeart} /> :
                                                    <FontAwesomeIcon icon={faSparkles} />
                                    }
                                    &nbsp; {item.message}
                                </h3>

                            </IonLabel>
                            <div className="metadata-end-wrapper" slot="end">
                                <IonNote style={{ fontSize: "10pt" }} color="medium">{moment(item.notif_datetime).fromNow() ?? ''}</IonNote>
                            </div>
                        </IonItem>
                    ))}

                </IonList>

                <IonNote style={{ padding: "20pt" }}>

                    <IonRow class="ion-justify-content-center">
                        Comments removed this month: {limits?.comments_removed}/5
                    </IonRow>
                    <IonRow class="ion-justify-content-center">
                        Chat messages unsent this month: {limits?.chats_removed}/5
                    </IonRow>
                </IonNote>



            </IonContent>
        </IonPage>
    );

};



export default Activity;
