import {
  IonBackButton,
  IonBadge,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonNote,
  IonPage,
  IonRow,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import React, { useMemo } from 'react';
import { useGetSubmittedAnnouncements } from '../hooks/api/announcements-take-1/submitted-anns';
import { useHistory } from 'react-router-dom';

const statusLabelMap: Record<string, string> = {
  pending: 'Pending moderator review',
  approved: 'Approved',
  needs_edit: 'Needs your edit',
  rejected: 'Rejected',
};

const statusColorMap: Record<string, string> = {
  pending: 'medium',
  approved: 'success',
  needs_edit: 'warning',
  rejected: 'danger',
};

const getLastEditedDate = (post: any) => {
  const candidate =
    post?.last_edited ||
    post?.last_edited_at ||
    post?.updated_at ||
    post?.last_updated ||
    post?.approvalDateTime ||
    post?.uploadDateTime;
  return candidate ? new Date(candidate) : null;
};

const SubmittedPosts: React.FC = () => {
  const history = useHistory();
  const now = useMemo(() => new Date(), []);
  const {
    data,
    isLoading,
  } = useGetSubmittedAnnouncements();

  const submissions = useMemo(() => {
    const raw = data?.pages?.flatMap((page) => page?.results ?? []) ?? [];
    return raw.filter((post) => {
      const lastEditedAt = getLastEditedDate(post);
      if (!lastEditedAt || Number.isNaN(lastEditedAt.getTime())) {
        return true;
      }
      const daysSince = (now.getTime() - lastEditedAt.getTime()) / (1000 * 60 * 60 * 24);
      const rawStatus = post?.approval_status ?? (post?.approved ? 'approved' : 'pending');
      const status = rawStatus === 'needs_edit' && daysSince > 5
        ? 'rejected'
        : rawStatus;

      if (status === 'pending' || status === 'rejected') {
        return daysSince <= 14;
      }
      if (status === 'needs_edit') {
        return daysSince <= 5;
      }
      return true;
    });
  }, [data, now]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/community" />
          </IonButtons>
          <IonTitle>My Submitted Posts</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading && (
          <IonRow class="ion-justify-content-center ion-padding">
            <IonSpinner name="dots" />
          </IonRow>
        )}

        {!isLoading && submissions.length === 0 && (
          <IonRow class="ion-justify-content-center ion-padding">
            <IonNote>No submitted posts yet.</IonNote>
          </IonRow>
        )}

        {submissions.length > 0 && submissions.map((post) => {
          const rawStatus =
            post?.approval_status ?? (post?.approved ? 'approved' : 'pending');
          const lastEditedAtDate = getLastEditedDate(post);
          const daysSince = lastEditedAtDate
            ? (now.getTime() - lastEditedAtDate.getTime()) / (1000 * 60 * 60 * 24)
            : 0;
              const status = rawStatus === 'needs_edit' && daysSince > 5
                ? 'rejected'
                : rawStatus;
              const statusLabel = statusLabelMap[status] ?? 'Pending moderator review';
              const statusColor = statusColorMap[status] ?? 'medium';
              const submittedAt = lastEditedAtDate
                ? lastEditedAtDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : null;

          return (
            <IonCard
              key={post?.id}
              color="white"
              onClick={() =>
                (status === 'approved'
                  ? history.push(`/community/${post?.id}`)
                  : history.push(`/community/submitted/${post?.id}`, { post })
                )
              }
            >
              <IonCardContent>
                <IonRow class="ion-justify-content-between ion-align-items-center">
                  <div>
                    <h2>{post?.title}</h2>
                    {submittedAt && <p>Submitted {submittedAt}</p>}
                  </div>
                  <IonBadge color={statusColor}>{statusLabel}</IonBadge>
                </IonRow>
              </IonCardContent>
            </IonCard>
          );
        })}
      </IonContent>
    </IonPage>
  );
};

export default SubmittedPosts;
