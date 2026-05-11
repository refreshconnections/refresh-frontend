import React from 'react';
import { IonNote, IonRow, IonText, IonCard, IonCardTitle, IonButton, IonSpinner } from '@ionic/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStarShooting } from '@fortawesome/pro-regular-svg-icons/faStarShooting';
import { faCirclePlus } from '@fortawesome/pro-solid-svg-icons';
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
                        ? `Your ${streak.streak_pre_break}-day streak ended!`
                        : `Streak count: ${streak?.streak_count}`}
            </IonNote>
            <IonRow className="ion-padding ion-justify-content-center">
                {currentUserProfile?.subscription_level === 'pro' ? (
                    <IonText color="navy" className="ion-padding ion-text-center">
                        Remember, as a pro user, your streak is just for fun!
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
                                        Increase your streak to unlock more <FontAwesomeIcon icon={faCirclePlus} /> features.
                                    </IonText>
                                ) : (
                                    <IonText color="navy" className="ion-padding">
                                        Your streak has unlocked the following <FontAwesomeIcon icon={faCirclePlus} /> {streak?.streak_count < 7 ? 'feature' : 'features'}:
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
                                        Increase your streak to unlock more <FontAwesomeIcon icon={faCirclePlus} /> features.
                                    </IonText>
                                ) : (
                                    <IonText color="navy" className="ion-padding">
                                        Your streak has unlocked the following <FontAwesomeIcon icon={faCirclePlus} /> {streak?.streak_count < 7 ? 'feature' : 'features'}:
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
                                        Increase your streak to unlock <FontAwesomeIcon icon={faCirclePlus} /> features.
                                    </IonText>
                                ) : (
                                    <IonText color="navy" className="ion-padding">
                                        Your streak has unlocked the following <FontAwesomeIcon icon={faCirclePlus} /> {streak?.streak_count < 5 ? 'feature' : 'features'}:
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
                    Increase your streak each day by exchanging messages, sending Likes, making connections, or liking posts and comments in the Refreshments Bar.
                </IonNote>

                {streak?.streak_count > 0 && (() => {
                    const lastUpdated = moment(streak.last_updated);
                    const nextUpdateAvailable = lastUpdated.clone().add(22, 'hours');
                    const canUpdateNow = moment().isAfter(nextUpdateAvailable);
                    return (
                        <IonNote color="navy" className="ion-padding ion-text-center">
                            Last updated {lastUpdated.fromNow()}.
                            {/* This should be unreachable — visiting this page clears lastStreakUpdate and calls increaseStreak automatically */}
                        {canUpdateNow ? ' Send a message or a like to grow your streak now!' : ''}
                        </IonNote>
                    );
                })()}

                {(streak?.max_streak > 0 || streak?.savers != null || (streak?.streak_pre_break && streak?.break_date)) && (() => {
                    const daysMissed = streak?.break_date
                        ? Math.floor((Date.now() - new Date(streak.break_date).getTime()) / 86400000)
                        : null;
                    const cost = daysMissed === null ? 1 : daysMissed <= 2 ? 1 : daysMissed <= 4 ? 2 : daysMissed <= 6 ? 3 : daysMissed <= 10 ? 4 : daysMissed <= 14 ? 5 : null;
                    const canAfford = cost !== null && streak.savers >= cost;
                    const windowExpired = cost === null;
                    return (
                        <IonCard color="white" className="streak-summary-card">
                            <div className="streak-summary-card-header">
                                <div className="streak-summary-card-header-title">Streak summary</div>
                            </div>
                            <div className="streak-summary-card-body">
                            <div className="streak-summary-section">
                                {streak?.max_streak > 0 && (
                                    <IonText color="navy" className="streak-summary-line">
                                        Personal best: {streak.max_streak} day{streak.max_streak === 1 ? '' : 's'}
                                    </IonText>
                                )}
                                {streak?.savers != null && (
                                    <IonText color="navy" className="streak-summary-line">
                                        <FontAwesomeIcon icon={faCirclePlus} /> &nbsp;
                                        {streak.savers === 0
                                            ? 'You have no streak savers. Earn 1 every 7 active days.'
                                            : streak.savers >= 10
                                                ? '10 streak savers (max)'
                                                : `${streak.savers} streak saver${streak.savers === 1 ? '' : 's'}`}
                                    </IonText>
                                )}
                            </div>
                            {streak?.streak_pre_break && streak?.break_date && (
                                <div className="streak-summary-section streak-summary-section--recovery">
                                    <IonCardTitle className="streak-summary-title">
                                        Restore your streak
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
                                                    You need <strong>{cost} streak saver{cost === 1 ? '' : 's'} to restore it</strong>.
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
                                </div>
                            )}
                            </div>
                        </IonCard>
                    );
                })()}
            </IonRow>
        </>
    );
};

export default StreakSegment;
