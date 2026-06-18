import { IonContent, IonPage, IonRow, IonFab, IonFabButton, IonIcon, IonCol, IonSegment, IonSegmentButton, IonLabel, useIonAlert, useIonModal, useIonRouter } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { chevronBackOutline } from 'ionicons/icons';

import '../Page.css';
import './Activity.css';

import { useGetCurrentProfile } from '../../hooks/api/profiles/current-profile';
import { useGetRecentNotifications } from '../../hooks/api/profiles/recent-notifications';
import { useGetCurrentStreak } from '../../hooks/api/profiles/current-streak';
import { useGetLimits } from '../../hooks/api/profiles/current-limits';
import { useGetSubmittedAnnouncements } from '../../hooks/api/refreshments/submitted-anns';
import { useGetSubmissionSummary } from '../../hooks/api/refreshments/submission-summary';
import { useGetSubmittedEvents } from '../../hooks/api/submitted-events';
import { useGetGlobalAppCurrentProfile } from '../../hooks/api/profiles/global-app-current-profile';
import { useGetMyComments } from '../../hooks/api/profiles/my-comments';
import { recoverStreak, increaseStreak } from '../../hooks/utilities';
import { Preferences } from '@capacitor/preferences';
import { useQueryClient } from '@tanstack/react-query';
import CreatePostModal from '../../components/CreatePostModal';

import StreakSegment from './StreakSegment';
import RefreshmentsSegment from './RefreshmentsSegment';
import RecentSegment from './RecentSegment';


const Activity: React.FC = () => {

    const [currSegment, setCurrSegment] = useState<'streak' | 'refreshments' | 'recently'>('recently');

    const currentUserProfile = useGetCurrentProfile().data;
    const { data: globalProfile, isLoading: globalProfileLoading } = useGetGlobalAppCurrentProfile({ enabled: currSegment === 'recently' });
    const { data: recentNotifications, isLoading: recentLoading } = useGetRecentNotifications(undefined, { enabled: currSegment === 'recently' });
    const { data: streak, isLoading: streakLoading } = useGetCurrentStreak({ enabled: currSegment === 'streak' });
    const { data: limits, isLoading: limitsLoading } = useGetLimits({ enabled: currSegment === 'recently' });
    const submittedPostsQuery = useGetSubmittedAnnouncements(undefined, { enabled: currSegment === 'refreshments' });
    const submittedEventsQuery = useGetSubmittedEvents({ enabled: currSegment === 'refreshments' });
    const submissionSummary = useGetSubmissionSummary({ enabled: currSegment === 'refreshments' }).data;
    const myCommentsQuery = useGetMyComments({ enabled: currSegment === 'refreshments' });
    const myComments = (myCommentsQuery.data?.pages ?? []).flatMap((p: any) => p?.results ?? []);
    const router = useIonRouter();

    const submittedPosts = (submittedPostsQuery.data?.pages ?? []).flatMap((page: any) => page?.results ?? []);
    const postStatuses = submittedPosts.map((post: any) => {
        if (post?.approval_status) return post.approval_status;
        return post?.approved ? 'approved' : 'pending';
    });

    const submittedEvents = (submittedEventsQuery.data?.pages ?? []).flatMap((page: any) => page?.results ?? []);
    const eventStatuses = submittedEvents.map((event: any) => {
        if (event?.status) return event.status;
        return event?.approved ? 'approved' : 'pending';
    });

    const fallbackApprovedCount = postStatuses.filter((s: string) => s === 'approved').length + eventStatuses.filter((s: string) => s === 'approved').length;
    const fallbackPendingCount = postStatuses.filter((s: string) => s === 'pending').length + eventStatuses.filter((s: string) => s === 'pending').length;
    const fallbackNeedsEditCount = postStatuses.filter((s: string) => s === 'needs_edit').length + eventStatuses.filter((s: string) => s === 'needs_edit').length;

    const approvedCount = submissionSummary?.totals?.approved ?? fallbackApprovedCount;
    const pendingCount = submissionSummary?.totals?.pending ?? fallbackPendingCount;
    const needsEditCount = submissionSummary?.totals?.needs_edit ?? fallbackNeedsEditCount;
    const hasSummaryCounts = approvedCount + pendingCount + needsEditCount > 0;
    const approvedPostCount = postStatuses.filter((s: string) => s === 'approved').length;
    const approvedEventCount = eventStatuses.filter((s: string) => s === 'approved').length;
    const rejectedCount = submissionSummary?.totals?.rejected ??
        (postStatuses.filter((s: string) => s === 'rejected').length + eventStatuses.filter((s: string) => s === 'rejected').length);

    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const toggleComment = (key: string) => setExpandedComments(prev => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
    });

    const [presentAlert] = useIonAlert();
    const [recoveringStreak, setRecoveringStreak] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (currSegment !== 'streak') return;
        const run = async () => {
            await queryClient.refetchQueries({ queryKey: ['streak'] });
            const streakData = queryClient.getQueryData<any>(['streak']);
            // Don't auto-increase if the user has a recoverable broken streak — calling
            // increaseStreak would reset streak_count to 1 and clear the restore window.
            if (streakData?.streak_pre_break && streakData?.break_date) return;
            await Preferences.remove({ key: 'lastStreakUpdate' });
            await increaseStreak();
            await queryClient.refetchQueries({ queryKey: ['streak'] });
            const updated = queryClient.getQueryData<any>(['streak']);
            if (updated?.last_updated) {
                await Preferences.set({ key: 'lastStreakUpdate', value: new Date(updated.last_updated).toISOString() });
            }
        };
        run().catch(() => {});
    }, [currSegment]);

    const handleRecoverStreak = async () => {
        setRecoveringStreak(true);
        try {
            await recoverStreak();
            queryClient.invalidateQueries({ queryKey: ['streak'] });
        } catch (e) {
            console.log('streak recovery failed', e);
        }
        setRecoveringStreak(false);
    };

    const [createPostPresent, createPostDismiss] = useIonModal(CreatePostModal, {
        preferred_name: currentUserProfile?.name,
        username: currentUserProfile?.username,
        onGoToSubmissions: () => router.push('/community/submitted'),
        onDismiss: (data: string, role: string) => createPostDismiss(data, role),
    });

    const handleCreatePost = () => {
        if (currentUserProfile === undefined) return;
        createPostPresent();
    };

    return (
        <IonPage>
            <IonContent className="activity">
                <IonFab className="very-top" slot="fixed" vertical="top" horizontal="start">
                    <IonFabButton routerLink="/me" routerDirection="back" color="light">
                        <IonIcon icon={chevronBackOutline} />
                    </IonFabButton>
                </IonFab>

                <IonRow className="page-title bigger">
                    <img className="color-invertible" src="../static/img/activity-navy.png" alt="activity" />
                </IonRow>

                <IonRow className="segments">
                    <IonCol>
                        <IonSegment value={currSegment} mode="ios">
                            <IonSegmentButton value="recently" onClick={() => setCurrSegment('recently')}>
                                <IonLabel>Recent</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="refreshments" onClick={() => setCurrSegment('refreshments')}>
                                <IonLabel>Refreshments</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="streak" onClick={() => setCurrSegment('streak')}>
                                <IonLabel>Streak</IonLabel>
                            </IonSegmentButton>
                        </IonSegment>
                    </IonCol>
                </IonRow>

                {currSegment === 'streak' && (
                    <StreakSegment
                        currentUserProfile={currentUserProfile}
                        streak={streak}
                        isLoading={streakLoading}
                        recoveringStreak={recoveringStreak}
                        handleRecoverStreak={handleRecoverStreak}
                    />
                )}

                {currSegment === 'refreshments' && (
                    <RefreshmentsSegment
                        hasSummaryCounts={hasSummaryCounts}
                        approvedCount={approvedCount}
                        pendingCount={pendingCount}
                        needsEditCount={needsEditCount}
                        rejectedCount={rejectedCount}
                        approvedPostCount={approvedPostCount}
                        approvedEventCount={approvedEventCount}
                        myComments={myComments}
                        myCommentsQuery={myCommentsQuery}
                        isLoading={submittedPostsQuery.isLoading || myCommentsQuery.isLoading}
                        expandedComments={expandedComments}
                        toggleComment={toggleComment}
                        presentAlert={presentAlert}
                        router={router}
                        createPostPresent={handleCreatePost}
                    />
                )}

                {currSegment === 'recently' && (
                    <RecentSegment
                        recentNotifications={recentNotifications}
                        globalProfile={globalProfile}
                        limits={limits}
                        isLoading={recentLoading || globalProfileLoading || limitsLoading}
                    />
                )}
            </IonContent>
        </IonPage>
    );
};

export default Activity;
