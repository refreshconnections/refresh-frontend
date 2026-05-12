import React from 'react';
import { IonNote, IonSpinner } from '@ionic/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMugHot } from '@fortawesome/pro-solid-svg-icons/faMugHot';
import { faPlus } from '@fortawesome/pro-solid-svg-icons/faPlus';
import { faComments } from '@fortawesome/pro-solid-svg-icons/faComments';
import { faSparkles } from '@fortawesome/pro-solid-svg-icons/faSparkles';
import { faHeart } from '@fortawesome/pro-solid-svg-icons/faHeart';
import moment from 'moment';

interface Props {
    recentNotifications: any[] | undefined;
    globalProfile: any;
    limits: any;
    isLoading: boolean;
}

const getJoinedRefreshConnectionsLabel = (registrationDate: string) => {
    const registeredAt = moment(registrationDate);
    if (!registeredAt.isValid()) return moment(registrationDate).fromNow();

    if (Math.abs(moment().diff(registeredAt, 'hours', true)) < 24) return 'today';

    return registeredAt.fromNow();
};

const RecentSegment: React.FC<Props> = ({ recentNotifications, globalProfile, limits, isLoading }) => {
    if (isLoading) return <div className="segment-loading"><IonSpinner name="dots" /></div>;

    return (
        <>
            <IonNote className="header">Recent happenings</IonNote>

            <div>
                {recentNotifications?.map((item: any) => (
                    <div className="comment-card" key={item.id}>
                        <div className="comment-card-text expanded">
                            {item.notification_type === 'comment' ? <FontAwesomeIcon icon={faComments} /> :
                             item.notification_type === 'connection' ? <FontAwesomeIcon icon={faPlus} /> :
                             item.notification_type === 'post' ? <FontAwesomeIcon icon={faMugHot} /> :
                             item.notification_type === 'like' ? <FontAwesomeIcon icon={faHeart} /> :
                             <FontAwesomeIcon icon={faSparkles} />}
                            &nbsp; {item.message}
                        </div>
                        <div className="comment-card-footer">
                            <div className="comment-card-footer-left" />
                            <div className="comment-card-footer-right">
                                <span className="comment-card-time">{moment(item.notif_datetime).fromNow()}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {(recentNotifications?.length ?? 0) < 10 && globalProfile?.registrationDate && (
                    <div className="comment-card">
                        <div className="comment-card-text expanded">
                            <FontAwesomeIcon icon={faSparkles} /> &nbsp; You joined Refresh Connections {getJoinedRefreshConnectionsLabel(globalProfile.registrationDate)}
                        </div>
                    </div>
                )}
            </div>

            <IonNote style={{ padding: '20pt' }}>
                <div style={{ textAlign: 'center' }}>Comments you removed this month: {limits?.comments_removed}/5</div>
                <div style={{ textAlign: 'center' }}>Chat messages you unsent this month: {limits?.chats_removed}/5</div>
            </IonNote>
        </>
    );
};

export default RecentSegment;
