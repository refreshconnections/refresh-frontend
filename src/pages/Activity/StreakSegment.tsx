import React from 'react';
import { IonNote, IonRow, IonText, IonCard, IonCardTitle, IonButton, IonSpinner } from '@ionic/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStarShooting } from '@fortawesome/pro-regular-svg-icons/faStarShooting';
import { faStar, faCircleStar } from '@fortawesome/pro-solid-svg-icons';
import moment from 'moment';

interface Props {
    currentUserProfile: any;
    streak: any;
    isLoading: boolean;
    recoveringStreak: boolean;
    handleRecoverStreak: () => void;
}

const StreakSegment: React.FC<Props> = ({ currentUserProfile, streak, isLoading, recoveringStreak, handleRecoverStreak }) => {
    if (!currentUserProfile?.settings_streak_tracker) return <></>;

    if (isLoading) return <div className="segment-loading"><IonSpinner name="dots" /></div>;

    return (
        <>
            <IonNote className="header">
                <FontAwesomeIcon icon={faStarShooting} /> &nbsp;
                {streak?.streak_count === 0 && !streak?.streak_pre_break
                    ? "You don't have a streak yet!"
                    : streak?.streak_count === 0 && streak?.streak_pre_break
                        ? `Your ${streak.streak_pre_break}-day streak broke!`
                        : `Streak count: ${streak?.streak_count}`}
            </IonNote>
            <IonRow className="ion-padding ion-justify-content-center">
                {currentUserProfile?.subscription_level === 'pro' ? (
                    <IonText color="navy" className="ion-padding ion-text-center">
                        As a pro member, your streak is just for fun!
                    </IonText>
                ) : (
                    <>
                        {currentUserProfile?.subscription_level === 'communityplus' ? (
                            <>
                                <IonText color="navy" className="ion-padding ion-text-center">
                                    As a Community+ member, your streak can unlock you some of the benefits of Personal+ too!
                                </IonText>
                                {streak?.streak_count < 3 ? (
                                    <IonText color="navy" className="ion-padding ion-text-center">
                                        Increase your streak to unlock more <FontAwesomeIcon icon={faStar} /> features.
                                    </IonText>
                                ) : (
                                    <IonText color="navy" className="ion-padding">
                                        Your streak has unlocked the following <FontAwesomeIcon icon={faStar} /> {streak?.streak_count < 7 ? 'feature' : 'features'}:
                                        <ul>
                                            {streak?.streak_count >= 3 && <li>Viewing all Let's Talk Abouts on all profiles.</li>}
                                            {streak?.streak_count >= 7 && <li>Viewing all of your Likes at once.</li>}
                                        </ul>
                                    </IonText>
                                )}
                            </>
                        ) : currentUserProfile?.subscription_level === 'personalplus' ? (
                            <>
                                <IonText color="navy" className="ion-padding ion-text-center">
                                    As a Personal+ member, your streak can unlock you some of the benefits of Community+ too!
                                </IonText>
                                {streak?.streak_count < 5 ? (
                                    <IonText color="navy" className="ion-padding ion-text-center">
                                        Increase your streak to unlock more <FontAwesomeIcon icon={faStar} /> features.
                                    </IonText>
                                ) : (
                                    <IonText color="navy" className="ion-padding">
                                        Your streak has unlocked the following <FontAwesomeIcon icon={faStar} /> {streak?.streak_count < 7 ? 'feature' : 'features'}:
                                        <ul>
                                            {streak?.streak_count >= 5 && <li>Submitting posts to the Refreshments Bar community forum.*</li>}
                                        </ul>
                                    </IonText>
                                )}
                            </>
                        ) : (
                            <>
                                {streak?.streak_count < 3 ? (
                                    <IonText color="navy" className="ion-padding ion-text-center">
                                        Increase your streak to unlock <FontAwesomeIcon icon={faStar} /> features.
                                    </IonText>
                                ) : (
                                    <IonText color="navy" className="ion-padding">
                                        Your streak has unlocked the following <FontAwesomeIcon icon={faStar} /> {streak?.streak_count < 5 ? 'feature' : 'features'}:
                                        <ul>
                                            {streak?.streak_count >= 3 && <li>Viewing all Let's Talk Abouts on all profiles.</li>}
                                            {streak?.streak_count >= 5 && <li>Submitting posts to the Refreshments Bar community forum.*</li>}
                                            {streak?.streak_count >= 7 && <li>Viewing all of your Likes at once.</li>}
                                        </ul>
                                    </IonText>
                                )}
                            </>
                        )}
                    </>
                )}

                <IonNote className="ion-padding ion-text-center">
                    Streaks can be increased daily by exchanging messages, sending Likes, making connections, or liking posts and comments in the Refreshments Bar community forum.
                </IonNote>

                {streak?.streak_count > 0 && (() => {
                    const lastUpdated = moment(streak.last_updated);
                    const nextUpdateAvailable = lastUpdated.clone().add(22, 'hours');
                    const canUpdateNow = moment().isAfter(nextUpdateAvailable);
                    return (
                        <IonNote color="navy" className="ion-padding ion-text-center">
                            Last updated {lastUpdated.fromNow()}.
                            {canUpdateNow ? ' Send a message or a like to increase your streak now!' : ''}
                        </IonNote>
                    );
                })()}

                {(streak?.max_streak > 0 || streak?.savers != null) && (
                    <IonCard color="white" className="ion-padding" style={{ width: '100%' }}>
                        {streak?.max_streak > 0 && (
                            <IonNote color="navy" className="ion-padding ion-text-center" style={{ display: 'block' }}>
                                Personal best: {streak.max_streak} day{streak.max_streak === 1 ? '' : 's'}
                            </IonNote>
                        )}
                        {streak?.savers != null && (
                            <IonNote color="navy" className="ion-padding ion-text-center" style={{ display: 'block' }}>
                                <FontAwesomeIcon icon={faCircleStar} /> &nbsp;
                                {streak.savers === 0
                                    ? 'You have no streak savers. Earn 1 every 7 active days.'
                                    : streak.savers >= 10
                                        ? '10 streak savers (max)'
                                        : `${streak.savers} streak saver${streak.savers === 1 ? '' : 's'}`}
                            </IonNote>
                        )}
                    </IonCard>
                )}

                {streak?.streak_pre_break && streak?.break_date && (() => {
                    const daysMissed = Math.floor((Date.now() - new Date(streak.break_date).getTime()) / 86400000);
                    const cost = daysMissed <= 2 ? 1 : daysMissed <= 4 ? 2 : daysMissed <= 6 ? 3 : daysMissed <= 10 ? 4 : daysMissed <= 14 ? 5 : null;
                    const canAfford = cost !== null && streak.savers >= cost;
                    const windowExpired = cost === null;
                    return (
                        <IonCard color="white" className="ion-padding" style={{ width: '100%' }}>
                            <IonCardTitle style={{ fontSize: '16pt', marginBottom: '8pt' }}>
                                <FontAwesomeIcon icon={faCircleStar} /> &nbsp; Restore your streak
                            </IonCardTitle>
                            {windowExpired ? (
                                <IonText color="medium">
                                    <p>The recovery window for your {streak.streak_pre_break}-day streak has expired.</p>
                                </IonText>
                            ) : (
                                <>
                                    <IonText color="navy">
                                        <p>
                                            Your {streak.streak_pre_break}-day streak broke {daysMissed} day{daysMissed === 1 ? '' : 's'} ago.
                                            Restoring it costs <strong>{cost} streak saver{cost === 1 ? '' : 's'}</strong>.
                                            You have <strong>{streak.savers}</strong>.
                                        </p>
                                    </IonText>
                                    <IonRow className="ion-justify-content-center">
                                        <IonButton
                                            color="primary"
                                            disabled={!canAfford || recoveringStreak}
                                            onClick={handleRecoverStreak}
                                        >
                                            {recoveringStreak
                                                ? <IonSpinner name="dots" />
                                                : canAfford
                                                    ? `Restore (${cost} saver${cost === 1 ? '' : 's'})`
                                                    : `Not enough savers (need ${cost})`}
                                        </IonButton>
                                    </IonRow>
                                </>
                            )}
                        </IonCard>
                    );
                })()}
            </IonRow>
        </>
    );
};

export default StreakSegment;
