import {
  IonBackButton,
  IonBadge,
  IonButtons,
  IonContent,
  IonHeader,
  IonNote,
  IonPage,
  IonRow,
  IonSpinner,
  IonInput,
  IonTextarea,
  IonText,
  IonTitle,
  IonButton,
  IonToolbar,
  useIonToast,
  IonCard,
  IonCardContent,
  useIonRouter,
} from '@ionic/react';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useGetSubmittedAnnouncements } from '../hooks/api/announcements-take-1/submitted-anns';
import Markdown from 'react-markdown';
import { apiClient } from '../hooks/api/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { postQueryKeys } from '../hooks/api/refreshments';
import './SubmittedPostPreview.css';

type SubmittedPost = {
  id: number;
  title?: string;
  content?: string;
  submitted_content?: string;
  uploadDateTime?: string;
  link?: string;
  coverPhoto?: string;
  disclaimer?: string;
  comment_instructions?: string;
  byline?: string;
  location?: string;
  sensitive?: boolean;
  sensitive_description?: string;
  approvalDateTime?: string;
  last_edited?: string;
  last_edited_at?: string;
  updated_at?: string;
  last_updated?: string;
  approved?: boolean;
  approval_status?: string;
  moderator_edit_request?: string;
  moderator_edit_reason?: string;
  moderator_edit_or_rejection_reason?: string;
  markdown?: boolean;
};

type RouteParams = {
  id: string;
};

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

const getLastEditedDate = (post: SubmittedPost | undefined) => {
  const candidate =
    post?.last_edited ||
    post?.last_edited_at ||
    post?.updated_at ||
    post?.last_updated ||
    post?.approvalDateTime ||
    post?.uploadDateTime;
  return candidate ? new Date(candidate) : null;
};

const SubmittedPostPreview: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const location = useLocation<{ post?: SubmittedPost }>();
  const [post, setPost] = useState<SubmittedPost | undefined>(location.state?.post);
  const [searching, setSearching] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [presentToast] = useIonToast();
  const router = useIonRouter();
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetSubmittedAnnouncements();

  const submissionPool = useMemo(
    () => data?.pages?.flatMap((page) => page?.results ?? []) ?? [],
    [data],
  );

  useEffect(() => {
    if (post?.id) {
      return;
    }

    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return;
    }

    const found = submissionPool.find((item) => item?.id === numericId);
    if (found) {
      setPost(found);
      return;
    }

    if (!searching && hasNextPage) {
      setSearching(true);
      fetchNextPage().finally(() => setSearching(false));
    }
  }, [post, id, submissionPool, hasNextPage, fetchNextPage, searching]);

  if (!post) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Post Preview</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonRow class="ion-justify-content-center ion-padding">
            <IonSpinner name="dots" />
          </IonRow>
          {!hasNextPage && !isFetchingNextPage && (
            <IonRow class="ion-justify-content-center ion-padding">
              <IonNote>Couldn’t find that submission.</IonNote>
            </IonRow>
          )}
        </IonContent>
      </IonPage>
    );
  }

  const submittedAtDate = getLastEditedDate(post);
  const daysSince = submittedAtDate
    ? (Date.now() - submittedAtDate.getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const rawStatus = post?.approval_status ?? (post?.approved ? 'approved' : 'pending');
  const status = rawStatus === 'needs_edit' && daysSince > 5
    ? 'rejected'
    : rawStatus;
  const statusLabel = statusLabelMap[status] ?? 'Pending moderator review';
  const statusColor = statusColorMap[status] ?? 'medium';
  const submittedAt = submittedAtDate
    ? submittedAtDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;
  const withinTwoWeeks = daysSince <= 14;
  const visible =
    status === 'approved' ||
    (status === 'needs_edit' && daysSince <= 5) ||
    ((status === 'pending' || status === 'rejected') && withinTwoWeeks);

  const submittedContent = post?.submitted_content ?? post?.content ?? '';
  const displayContent = submittedContent;
  const hasEdits =
    (draftTitle.trim() !== '' && draftTitle.trim() !== (post?.title ?? '').trim())
    || draftContent.trim() !== submittedContent.trim();
  const requestedEdit = post?.moderator_edit_request ?? null;
  const moderatorExplanation = post?.moderator_edit_or_rejection_reason ?? post?.moderator_edit_reason ?? null;
  const hasRequestedEdit = !!requestedEdit;
  const canEdit = status === 'needs_edit' && visible;
  const rejectedReason = post?.moderator_edit_or_rejection_reason ?? post?.moderator_edit_reason;

  const renderContent = (content: string) => {
    if (!content) {
      return <IonNote>No content available.</IonNote>;
    }
    return post?.markdown ? (
      <Markdown>{content}</Markdown>
    ) : (
      <IonText color="dark" className="css-fix">
        <p className="css-fix">{content}</p>
      </IonText>
    );
  };

  const handleResubmit = async () => {
    if (!post?.id || !draftContent.trim()) {
      presentToast({ message: 'Please add your edited content.', duration: 2500, color: 'medium' });
      return;
    }
    setSaving(true);
    try {
      const response = await apiClient.post(`/api/announcements/submitted/${post.id}/resubmit/`, {
        title: draftTitle.trim() || post?.title,
        content: draftContent.trim(),
      });
      if (response?.data) {
        setPost(response.data);
      } else {
        setPost((prev) => prev ? ({
          ...prev,
          title: draftTitle.trim() || prev.title,
          submitted_content: draftContent.trim(),
          approval_status: 'pending',
          approved: false,
        }) : prev);
      }
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['filteredposts'] });
      queryClient.invalidateQueries({ queryKey: postQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: postQueryKeys.postcontents() });
      queryClient.invalidateQueries({ queryKey: postQueryKeys.postcontent(post.id) });
      presentToast({ message: 'Resubmitted for review.', duration: 2500, color: 'success' });
    } catch (error) {
      presentToast({ message: 'Could not resubmit. Try again.', duration: 2500, color: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const handleApproveEdit = async () => {
    if (!post?.id) {
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(`/api/announcements/submitted/${post.id}/approve_edit/`);
      queryClient.invalidateQueries({ queryKey: ['filteredposts'] });
      queryClient.invalidateQueries({ queryKey: postQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: postQueryKeys.postcontents() });
      queryClient.invalidateQueries({ queryKey: postQueryKeys.postcontent(post.id) });
      presentToast({ message: 'Approved the edit.', duration: 2500, color: 'success' });
      router.push(`/community/${post.id}`);
    } catch (error) {
      presentToast({ message: 'Could not approve. Try again.', duration: 2500, color: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="modal-title">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/community/submitted" />
          </IonButtons>
          <IonTitle>Post Preview</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding submitted-post-preview">
        <IonCard className="preview-card">
          <IonCardContent>
            <IonText color="dark">
              <h2>{post?.title}</h2>
            </IonText>
            <IonRow className="status-row">
              <IonBadge color={statusColor}>{statusLabel}</IonBadge>
              {submittedAt && (
                <IonNote className="submitted-meta">Submitted {submittedAt}</IonNote>
              )}
            </IonRow>
            {visible && (post?.byline || post?.location || post?.link || post?.sensitive) && (
              <IonText color="medium" className="detail-block">
                {post?.byline && <p><strong>Byline:</strong> {post.byline}</p>}
                {post?.location && <p><strong>Location:</strong> {post.location}</p>}
                {post?.link && <p><strong>Link:</strong> {post.link}</p>}
                {post?.sensitive && (
                  <p>
                    <strong>Sensitive:</strong>{' '}
                    {post.sensitive_description ? post.sensitive_description : 'Yes'}
                  </p>
                )}
              </IonText>
            )}
            {visible && displayContent && renderContent(displayContent)}
            {visible && status !== 'rejected' && !displayContent && (
              <IonNote>No content available.</IonNote>
            )}
          </IonCardContent>
        </IonCard>

        {!visible && (
          <IonNote>This submission is no longer available.</IonNote>
        )}

        {visible && moderatorExplanation && (
          <IonCard className="requested-edit">
            <IonCardContent>
              <IonText color="medium">
                <p><strong>Moderator explanation:</strong> {moderatorExplanation}</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        )}

        {visible && hasRequestedEdit && (
          <IonCard className="requested-edit">
            <IonCardContent>
              <IonText color="dark">
                <h3>Requested edit</h3>
              </IonText>
              {renderContent(requestedEdit ?? '')}
              <IonText color="medium">
                <p>Approve to use this exact edit, or make changes in your own words and resubmit.</p>
              </IonText>
              {canEdit && !editing && (
                <IonRow class="ion-justify-content-center" style={{ marginTop: '8px' }}>
                  <IonButton size="small" onClick={() => {
                    setDraftTitle(post?.title ?? '');
                    setDraftContent(requestedEdit ?? submittedContent);
                    setEditing(true);
                  }}>
                    Edit
                  </IonButton>
                  <IonButton
                    size="small"
                    fill="outline"
                    onClick={handleApproveEdit}
                    disabled={saving}
                  >
                    Approve edit
                  </IonButton>
                </IonRow>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {canEdit && !editing && !hasRequestedEdit && (
          <IonRow class="ion-justify-content-center" style={{ marginBottom: '8px' }}>
            <IonButton
              onClick={() => {
                setDraftTitle(post?.title ?? '');
                setDraftContent(submittedContent);
                setEditing(true);
              }}
            >
              Edit & resubmit
            </IonButton>
          </IonRow>
        )}

        {canEdit && editing && (
          <IonCard color="white" className="edit-card">
            <IonCardContent>
              <IonText color="dark">
                <h3>Edit your submission</h3>
              </IonText>
              <IonText color="medium">
                <p>Make the requested changes, then resubmit for review.</p>
              </IonText>
              <IonText color="medium">
                <p>Title</p>
              </IonText>
              <IonInput
                value={draftTitle}
                placeholder="Title"
                onIonInput={(e) => setDraftTitle(e.detail.value ?? '')}
              />
              <IonText color="medium">
                <p>Content</p>
              </IonText>
              <IonTextarea
                value={draftContent}
                autoGrow
                onIonInput={(e) => setDraftContent(e.detail.value ?? '')}
              />
              <IonRow class="ion-justify-content-center" style={{ marginTop: '12px' }}>
                <IonButton onClick={handleResubmit} disabled={saving || !hasEdits}>
                  Edit and resubmit
                </IonButton>
                <IonButton
                  fill="outline"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </IonButton>
              </IonRow>
            </IonCardContent>
          </IonCard>
        )}

        {visible && post?.coverPhoto && (
          <IonRow class="ion-justify-content-center">
            <img src={post.coverPhoto} alt="post cover" style={{ maxWidth: '100%', borderRadius: '12px' }} />
          </IonRow>
        )}

        {visible && post?.disclaimer && (
          <IonText color="medium">
            <p><strong>Disclaimer:</strong> {post.disclaimer}</p>
          </IonText>
        )}

        {visible && post?.comment_instructions && (
          <IonText color="medium">
            <p><strong>Comment instructions:</strong> {post.comment_instructions}</p>
          </IonText>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SubmittedPostPreview;
