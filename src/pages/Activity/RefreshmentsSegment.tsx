import React from 'react';
import { IonNote, IonRow, IonText, IonCard, IonButton, IonSpinner } from '@ionic/react';
import GuidelinesButton from '../../components/GuidelinesButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMugHot } from '@fortawesome/pro-solid-svg-icons/faMugHot';
import { faComments } from '@fortawesome/pro-solid-svg-icons/faComments';
import { faComment, faChevronDown, faChevronUp, faCalendar, faPenToSquare, faClock } from '@fortawesome/pro-solid-svg-icons';
import moment from 'moment';

interface Props {
    hasSummaryCounts: boolean;
    approvedCount: number;
    pendingCount: number;
    needsEditCount: number;
    rejectedCount: number;
    approvedPostCount: number;
    approvedEventCount: number;
    myComments: any[];
    myCommentsQuery: any;
    isLoading: boolean;
    expandedComments: Set<string>;
    toggleComment: (key: string) => void;
    presentAlert: (opts: any) => void;
    router: any;
    createPostPresent: () => void;
}

const RefreshmentsSegment: React.FC<Props> = ({
    hasSummaryCounts,
    approvedCount,
    pendingCount,
    needsEditCount,
    rejectedCount,
    approvedPostCount,
    approvedEventCount,
    myComments,
    myCommentsQuery,
    isLoading,
    expandedComments,
    toggleComment,
    presentAlert,
    router,
    createPostPresent,
}) => {
    const hasAnything = hasSummaryCounts || approvedPostCount > 0 || approvedEventCount > 0 || rejectedCount > 0;

    if (isLoading) return <div className="segment-loading"><IonSpinner name="dots" /></div>;

    return (
        <>
            <IonNote className="header">My post and event submissions</IonNote>
            <IonRow className="ion-padding ion-justify-content-center">
                <IonCard color="white" className="ion-padding" style={{ width: '100%' }}>

                    {/* Pending action callouts */}
                    {needsEditCount > 0 && (
                        <div className="submission-callout submission-callout--edit" onClick={() => router.push('/community/submitted')} style={{ cursor: 'pointer' }}>
                            <FontAwesomeIcon icon={faPenToSquare} />
                            &nbsp; {needsEditCount} post{needsEditCount !== 1 ? 's' : ''} need{needsEditCount === 1 ? 's' : ''} your edit
                        </div>
                    )}
                    {pendingCount > 0 && (
                        <div className="submission-callout submission-callout--pending">
                            <FontAwesomeIcon icon={faClock} />
                            &nbsp; {pendingCount} {pendingCount !== 1 ? 'submissions' : 'submission'} awaiting moderator review
                        </div>
                    )}

                    {/* Category chips */}
                    {(approvedPostCount > 0 || approvedEventCount > 0) && (
                        <div className="submission-chips">
                            {approvedPostCount > 0 && (
                                <span className="submission-chip">
                                    <FontAwesomeIcon icon={faMugHot} /> &nbsp;{approvedPostCount} post{approvedPostCount !== 1 ? 's' : ''}
                                </span>
                            )}
                            {approvedEventCount > 0 && (
                                <span className="submission-chip">
                                    <FontAwesomeIcon icon={faCalendar} /> &nbsp;{approvedEventCount} event{approvedEventCount !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    )}

                    {!hasAnything && (
                        <>
                            <IonRow className="ion-text-center ion-justify-content-center">
                                <IonText color="navy" className="ion-text-center ion-padding-bottom">
                                    Feel like submitting a post?
                                </IonText>
                            </IonRow>
                            <IonRow className="ion-justify-content-center ion-padding-bottom">
                                <IonButton color="primary" onClick={() => createPostPresent()}>
                                    Create a post
                                </IonButton>
                            </IonRow>
                        </>
                    )}

                    <IonRow className="ion-justify-content-center ion-padding-top">
                        <IonButton routerLink="/community/submitted" color="primary" fill={hasAnything ? 'outline' : 'solid'}>
                            My submissions
                        </IonButton>
                        {hasAnything && (
                            <IonButton color="primary" onClick={() => createPostPresent()}>
                                Create a post
                            </IonButton>
                        )}
                    </IonRow>
                </IonCard>
            </IonRow>

            {myComments?.length > 0 && (
                <>
                    <IonNote className="header">My comments</IonNote>
                    {myComments.map((comment: any) => {
                        const key = `${comment.item_type}-${comment.id}`;
                        const expanded = expandedComments.has(key);
                        const isReplyType = comment.item_type === 'reply' || comment.item_type === 'sibling_reply';
                        const icon = comment.item_type === 'comment'
                            ? (comment.is_reply ? faComments : faComment)
                            : faComments;
                        const ownCommentText = comment.item_type === 'comment' ? (comment.text || '') : '';
                        const isRemoved = comment.item_type === 'comment' && comment.removed && !!comment.removed_reason;
                        const isRemovedNoReason = comment.item_type === 'comment' && comment.removed && !comment.removed_reason;
                        const isModerated = comment.item_type === 'comment' && !isRemovedNoReason && (comment.moderation_note || comment.moderation_note_longer);
                        const iconColor = (isRemoved || isRemovedNoReason) ? 'var(--ion-color-maroon)' : isModerated ? 'var(--ion-color-secondary)' : undefined;
                        const isExpandable = isReplyType || comment.is_reply || isRemoved || isModerated || ownCommentText.length > 60;

                        return (
                            <div className="comment-card" key={key}>
                                {comment.item_type === 'comment' && (
                                    <>
                                        <div className={`comment-card-text${expanded ? ' expanded' : ''}`}>
                                            <span className="comment-card-icon" style={iconColor ? { color: iconColor } : undefined}>
                                                <FontAwesomeIcon icon={icon} />
                                            </span> &nbsp;{isRemovedNoReason ? 'You removed a comment you left.' : comment.text}
                                        </div>
                                        {isExpandable && (
                                            <div style={{ textAlign: 'right' }}>
                                                <button className="comment-card-chevron" onClick={() => toggleComment(key)}>
                                                    <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
                                                </button>
                                            </div>
                                        )}
                                        {expanded && isRemoved && (
                                            <div className="comment-card-removed-reason">
                                                Removal reason: {comment.removed_reason}
                                                <div style={{ marginTop: '6px' }}>
                                                    <GuidelinesButton label="Guidelines" fill="outline" color="primary" />
                                                </div>
                                            </div>
                                        )}
                                        {expanded && isModerated && (
                                            <div className="comment-card-moderation-note">
                                                <strong>Moderation note:</strong> {comment.moderation_note}
                                                {comment.moderation_note_longer && (
                                                    <><br />{comment.moderation_note_longer}</>
                                                )}
                                                <div style={{ marginTop: '6px' }}>
                                                    <GuidelinesButton label="Guidelines" fill="outline" color="primary" />
                                                </div>
                                            </div>
                                        )}
                                        {expanded && comment.is_reply && comment.reply_to_text && (
                                            <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--ion-color-navy, #22215e)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <div style={{ borderLeft: '3px solid var(--ion-color-medium)', paddingLeft: '8px', color: 'var(--ion-color-medium)' }}>
                                                    {comment.reply_to_username && (
                                                        <div style={{ fontWeight: 600, fontSize: '11px', marginBottom: '2px' }}>{comment.reply_to_username}</div>
                                                    )}
                                                    {comment.reply_to_text}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {isReplyType && (
                                    <>
                                        <div className="comment-card-text expanded" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <span>
                                                <FontAwesomeIcon icon={faComments} /> &nbsp;
                                                <strong>{comment.replier_name}</strong>
                                                {comment.item_type === 'reply'
                                                    ? ' replied to your comment'
                                                    : ' replied to a comment thread you also commented in'}
                                            </span>
                                            <button className="comment-card-chevron" style={{ marginLeft: '8px', flexShrink: 0 }} onClick={() => toggleComment(key)}>
                                                <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
                                            </button>
                                        </div>
                                        {expanded && (
                                            <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--ion-color-navy, #22215e)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {comment.item_type === 'reply' && comment.parent_text && (
                                                    <div style={{ borderLeft: '3px solid var(--ion-color-medium)', paddingLeft: '8px', color: 'var(--ion-color-medium)' }}>
                                                        <div style={{ fontWeight: 600, fontSize: '11px', marginBottom: '2px' }}>Your comment</div>
                                                        {comment.parent_text}
                                                    </div>
                                                )}
                                                <div>
                                                    {comment.text}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="comment-card-footer">
                                    <div className="comment-card-footer-left">
                                        <span className="comment-card-title">{comment.announcement_title}</span>
                                        <IonButton
                                            fill="clear"
                                            size="small"
                                            style={{ '--padding-start': '4px', '--padding-end': '4px', height: '20px' }}
                                            onClick={() => presentAlert({
                                                header: 'Go to this post?',
                                                subHeader: comment.announcement_title ? `Title "${comment.announcement_title}" ` : '',
                                                buttons: [
                                                    { text: 'Cancel', role: 'cancel' },
                                                    { text: 'Go', handler: () => router.push(`/community/${comment.announcement_id}`) },
                                                ],
                                            })}
                                        >
                                            <FontAwesomeIcon icon={faMugHot} style={{ fontSize: '11px' }} />
                                        </IonButton>
                                    </div>
                                    <div className="comment-card-footer-right">
                                        <span className="comment-card-time">{moment(comment.latest_activity).fromNow()}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {myCommentsQuery.hasNextPage && (
                        <IonRow className="ion-justify-content-center ion-padding">
                            <IonButton
                                fill="outline"
                                color="navy"
                                size="small"
                                onClick={() => myCommentsQuery.fetchNextPage()}
                                disabled={myCommentsQuery.isFetchingNextPage}
                            >
                                {myCommentsQuery.isFetchingNextPage ? <IonSpinner name="dots" /> : 'Load more'}
                            </IonButton>
                        </IonRow>
                    )}
                </>
            )}
        </>
    );
};

export default RefreshmentsSegment;
