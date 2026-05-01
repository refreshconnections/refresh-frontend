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
  IonIcon,
  IonToolbar,
  useIonToast,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonSelect,
  IonSelectOption,
  useIonRouter,
  useIonPopover,
  useIonModal,
  useIonAlert,
} from '@ionic/react';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useGetSubmittedAnnouncements } from '../hooks/api/refreshments/submitted-anns';
import Markdown from 'react-markdown';
import { apiClient } from '../hooks/api/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { postQueryKeys } from '../hooks/api/refreshments';
import { annQueryKeys } from '../hooks/api/announcements-take-1/ann-query-keys';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePlus } from '@fortawesome/pro-solid-svg-icons/faCirclePlus';
import { informationCircleOutline } from 'ionicons/icons';
import './SubmittedPostPreview.css';
import { ModerationCopy } from '../enums/moderation';
import GuidelinesButton from '../components/GuidelinesButton';
import CitySelectorModal from '../components/CitySelectorModal';

type SubmittedPost = {
  id: number;
  title?: string;
  content?: string;
  submitted_content?: string;
  uploadDateTime?: string;
  link?: string;
  coverPhoto?: string;
  coverPhoto_alt?: string;
  disclaimer?: string;
  comment_instructions?: string;
  byline?: string;
  category?: string;
  location?: string;
  local_only?: boolean;
  location_point_lat?: number | string;
  location_point_long?: number | string;
  sensitive?: boolean;
  sensitive_description?: string;
  include_profile?: boolean;
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
  hide_status_author?: string;
  interested_count?: number | null;
};

type RouteParams = {
  id: string;
};

const statusLabelMap: Record<string, string> = {
  draft: 'Unsubmitted draft',
  pending: 'Pending moderator review',
  approved: 'Approved',
  needs_edit: 'Needs your edit',
  rejected: 'Rejected',
};

const statusColorMap: Record<string, string> = {
  draft: 'medium',
  pending: 'medium',
  approved: 'success',
  needs_edit: 'warning',
  rejected: 'danger',
};

const categoryLabelMap: Record<string, string> = {
  mingle: 'Mingle',
  change: 'Change',
  longcovid: 'Long Covid',
  families: 'Family',
  science: 'STEAM',
  pop: 'Pop',
  events: 'Event',
  housing: 'Housing',
  recommendations: 'Local Recommendations',
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

const StatusInfoPopover: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <IonContent className="ion-padding">
    {ModerationCopy.MODERATION_INFO_POPOVER}
  </IonContent>
);

const SubmittedPostPreview: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const location = useLocation<{ post?: SubmittedPost }>();
  const [post, setPost] = useState<SubmittedPost | undefined>(location.state?.post);
  const [searching, setSearching] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftByline, setDraftByline] = useState<string>('Anonymous');
  const [draftCategory, setDraftCategory] = useState<string>('');
  const [draftLocalOnly, setDraftLocalOnly] = useState(false);
  const [draftLocation, setDraftLocation] = useState('');
  const [draftLocationLabel, setDraftLocationLabel] = useState('');
  const [draftLat, setDraftLat] = useState<string>('');
  const [draftLong, setDraftLong] = useState<string>('');
  const [draftIncludeProfile, setDraftIncludeProfile] = useState(false);
  const [draftSensitive, setDraftSensitive] = useState(false);
  const [draftSensitiveDescription, setDraftSensitiveDescription] = useState('');
  const [draftLink, setDraftLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [hideUpdating, setHideUpdating] = useState(false);
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();
  const router = useIonRouter();
  const queryClient = useQueryClient();
  const { data: currentProfile } = useGetCurrentProfile();
  const userHandle = (currentProfile?.username ?? '').trim();
  const [presentStatusPopover, dismissStatusPopover] = useIonPopover(StatusInfoPopover, {
    onDismiss: () => dismissStatusPopover(),
  });

  type City = { name: string; lat: number; lng: number };
  const citySelectorOpeningRef = React.useRef(false);
  const [presentCitySelector, dismissCitySelector] = useIonModal(CitySelectorModal, {
    onDismiss: (selectedCity?: City) => {
      if (selectedCity) {
        setDraftLocation(selectedCity.name);
        setDraftLocationLabel(selectedCity.name);
        setDraftLat(selectedCity.lat.toString());
        setDraftLong(selectedCity.lng.toString());
      }
      dismissCitySelector();
    },
  });
  const openCitySelector = () => {
    if (citySelectorOpeningRef.current) return;
    citySelectorOpeningRef.current = true;
    presentCitySelector({
      onDidDismiss: () => { citySelectorOpeningRef.current = false; },
    });
  };

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
  const status = rawStatus === 'needs_edit' && daysSince > 7
    ? 'rejected'
    : rawStatus;
  const statusLabel = statusLabelMap[status] ?? 'Pending moderator review';
  const statusColor = statusColorMap[status] ?? 'medium';
  const submittedAt = submittedAtDate
    ? submittedAtDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;
  const withinSevenDays = daysSince <= 7;
  const daysLeft = Math.max(0, Math.ceil(7 - daysSince));
  const daysLeftLabel = daysLeft === 1 ? 'day' : 'days';
  const visible =
    status === 'approved' ||
    status === 'draft' ||
    (status === 'needs_edit' && daysSince <= 7) ||
    ((status === 'pending' || status === 'rejected') && withinSevenDays);

  const submittedContent = post?.submitted_content ?? post?.content ?? '';
  const displayContent = submittedContent;
  const hasEdits =
    (draftTitle.trim() !== '' && draftTitle.trim() !== (post?.title ?? '').trim())
    || draftContent.trim() !== submittedContent.trim()
    || draftByline !== (post?.byline ?? 'Anonymous')
    || draftCategory !== (post?.category ?? 'refreshments')
    || draftLocalOnly !== !!post?.local_only
    || draftLocation !== (post?.location ?? '')
    || draftLat !== (post?.location_point_lat?.toString() ?? '')
    || draftLong !== (post?.location_point_long?.toString() ?? '')
    || draftIncludeProfile !== !!post?.include_profile
    || draftSensitive !== !!post?.sensitive
    || draftSensitiveDescription !== (post?.sensitive_description ?? '')
    || draftLink !== (post?.link ?? '');
  const requestedEdit = post?.moderator_edit_request ?? null;
  const moderatorExplanation = post?.moderator_edit_or_rejection_reason ?? post?.moderator_edit_reason ?? null;
  const hasRequestedEdit = !!requestedEdit;
  const canEdit = (status === 'needs_edit' || status === 'draft') && visible;
  const isDraft = status === 'draft';
  const rejectedReason = post?.moderator_edit_or_rejection_reason ?? post?.moderator_edit_reason;
  const bylineOptions = Array.from(new Set([
    ...(userHandle ? [userHandle] : []),
    ...(post?.byline && post?.byline !== userHandle && post?.byline !== 'Anonymous' ? [post.byline] : []),
    'Anonymous',
  ]));
  const allowInlineEdit = editing && isDraft;
  const applyDraftDefaults = () => {
    setDraftTitle(post?.title ?? '');
    setDraftContent(submittedContent);
    setDraftByline(post?.byline ?? (userHandle || 'Anonymous'));
    setDraftCategory(post?.category ?? 'refreshments');
    setDraftLocalOnly(!!post?.local_only);
    setDraftLocation(post?.location ?? '');
    setDraftLocationLabel(post?.location ?? '');
    setDraftLat(post?.location_point_lat?.toString() ?? '');
    setDraftLong(post?.location_point_long?.toString() ?? '');
    setDraftIncludeProfile(!!post?.include_profile);
    setDraftSensitive(!!post?.sensitive);
    setDraftSensitiveDescription(post?.sensitive_description ?? '');
    setDraftLink(post?.link ?? '');
  };

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
      presentToast({ message: 'Please add your edited content.', duration: 2500, cssClass: 'status-toast' });
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
      queryClient.invalidateQueries({ queryKey: annQueryKeys.submitted });
      presentToast({ message: 'Resubmitted for review.', duration: 2500, cssClass: 'status-toast' });
    } catch (error) {
      presentToast({ message: 'Could not resubmit. Try again.', duration: 2500, cssClass: 'status-toast' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!post?.id) {
      return;
    }
    setSaving(true);
    try {
      const response = await apiClient.patch(`/api/announcements/submitted/${post.id}/save_draft/`, {
        title: draftTitle.trim() || post?.title,
        content: draftContent.trim() || post?.content,
        byline: draftByline,
        category: draftCategory,
        include_profile: draftIncludeProfile ? "true" : "false",
        sensitive: draftSensitive ? "true" : "false",
        sensitive_description: draftSensitiveDescription || null,
        link: draftLink || null,
        local_only: draftLocalOnly ? "true" : "false",
        location: draftLocalOnly ? (draftLocationLabel || draftLocation || null) : null,
        location_point_lat: draftLat || null,
        location_point_long: draftLong || null,
        coverPhoto_alt: post?.coverPhoto_alt ?? null,
        comment_instructions: post?.comment_instructions ?? "",
      });
      if (response?.data) {
        setPost(response.data);
      }
      setEditing(false);
      presentToast({ message: 'Draft saved.', duration: 2500, cssClass: 'status-toast' });
    } catch (error) {
      presentToast({ message: 'Could not save draft. Try again.', duration: 2500, cssClass: 'status-toast' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitDraft = async () => {
    if (!post?.id || !draftContent.trim()) {
      presentToast({ message: 'Please add your content before submitting.', duration: 2500, cssClass: 'status-toast' });
      return;
    }
    setSaving(true);
    try {
      const response = await apiClient.post(`/api/announcements/submitted/${post.id}/submit_draft/`, {
        title: draftTitle.trim() || post?.title,
        content: draftContent.trim(),
        byline: draftByline,
        category: draftCategory,
        include_profile: draftIncludeProfile ? "true" : "false",
        sensitive: draftSensitive ? "true" : "false",
        sensitive_description: draftSensitiveDescription || null,
        link: draftLink || null,
        local_only: draftLocalOnly ? "true" : "false",
        location: draftLocalOnly ? (draftLocationLabel || draftLocation || null) : null,
        location_point_lat: draftLat || null,
        location_point_long: draftLong || null,
        coverPhoto_alt: post?.coverPhoto_alt ?? null,
        comment_instructions: post?.comment_instructions ?? "",
      });
      if (response?.data) {
        setPost(response.data);
      }
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['filteredposts'] });
      queryClient.invalidateQueries({ queryKey: postQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: postQueryKeys.postcontents() });
      queryClient.invalidateQueries({ queryKey: postQueryKeys.postcontent(post.id) });
      queryClient.invalidateQueries({ queryKey: annQueryKeys.submitted });
      presentToast({ message: 'Submitted for review.', duration: 2500, cssClass: 'status-toast' });
    } catch (error) {
      presentToast({ message: 'Could not submit draft. Try again.', duration: 2500, cssClass: 'status-toast' });
    } finally {
      setSaving(false);
    }
  };

  const doApproveEdit = async () => {
    if (!post?.id) return;
    setSaving(true);
    try {
      await apiClient.post(`/api/announcements/submitted/${post.id}/approve_edit/`);
      queryClient.invalidateQueries({ queryKey: ['filteredposts'] });
      queryClient.invalidateQueries({ queryKey: postQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: postQueryKeys.postcontents() });
      queryClient.invalidateQueries({ queryKey: postQueryKeys.postcontent(post.id) });
      queryClient.invalidateQueries({ queryKey: annQueryKeys.submitted });
      presentToast({ message: 'Post approved!', duration: 2500, cssClass: 'status-toast' });
      router.push(`/community/${post.id}`);
    } catch (error) {
      presentToast({ message: 'Could not approve. Try again.', duration: 2500, cssClass: 'status-toast' });
    } finally {
      setSaving(false);
    }
  };

  const handleApproveEdit = () => {
    presentAlert({
      header: 'Approve this edit?',
      message: 'Your post will be approved and you can see it immediately in the Refreshments tab.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Approve', handler: () => doApproveEdit() },
      ],
    });
  };

  const handleRejectEdit = async () => {
    if (!post?.id) return;
    presentAlert({
      header: 'Reject this edit?',
      message: "This won't be posted. If you'd rather edit in your own words, choose Edit and resubmit. You could also submit a new post. Thanks!",
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          handler: async () => {
            setSaving(true);
            try {
              await apiClient.post(`/api/announcements/submitted/${post.id}/reject_edit/`);
              queryClient.invalidateQueries({ queryKey: annQueryKeys.submitted });
              presentToast({ message: 'Edit rejected.', duration: 2500, cssClass: 'status-toast' });
              router.push('/community/submitted');
            } catch (error) {
              presentToast({ message: 'Could not reject. Try again.', duration: 2500, cssClass: 'status-toast' });
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    });
  };

  const handleHideToggle = async () => {
    if (!post?.id) {
      return;
    }
    const hidden = post?.hide_status_author === 'user';
    setHideUpdating(true);
    try {
      if (hidden) {
        await apiClient.post(`/api/announcements/submitted/${post.id}/unhide/`);
        setPost((prev) => (prev ? { ...prev, hide_status_author: 'none' } : prev));
      } else {
        await apiClient.post(`/api/announcements/submitted/${post.id}/hide/`);
        setPost((prev) => (prev ? { ...prev, hide_status_author: 'user' } : prev));
      }
      queryClient.invalidateQueries({ queryKey: annQueryKeys.submitted });
      presentToast({
        message: hidden ? 'Post will show in your list view again.' : 'Post will be hidden from your submissions list.',
        duration: 2000,
        cssClass: 'status-toast',
      });
    } catch (error) {
      presentToast({ message: 'Could not update visibility.', duration: 2500, cssClass: 'status-toast' });
    } finally {
      setHideUpdating(false);
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
        <IonCard className="section-card">
          <IonCardContent>
            <IonRow className="section-header">
              <IonText color="dark" className="section-heading">
                <h3>Status</h3>
              </IonText>
              {status === 'pending' && (
                <IonButton
                  fill="clear"
                  size="small"
                  className="info-button"
                  onClick={(e) => presentStatusPopover({ event: e.nativeEvent })}
                >
                  <IonIcon icon={informationCircleOutline} />
                </IonButton>
              )}
            </IonRow>
            <IonRow className="status-row">
              <IonBadge color={statusColor}>{statusLabel}</IonBadge>
              {submittedAt && (
                <IonNote className="submitted-meta">Submitted {submittedAt}</IonNote>
              )}
            </IonRow>
            {status === 'needs_edit' && (
              <IonText color="medium">
                <p>You have {daysLeft} {daysLeftLabel} left to review and resubmit.</p>
              </IonText>
            )}
            {status === 'rejected' && post?.hide_status_author !== 'user' && (
              <IonText color="medium">
                <p>
                  This will disappear from your list view in {daysLeft} {daysLeftLabel}.
                  You can hide it now.
                </p>
              </IonText>
            )}
            {!visible && (
              <IonNote>This submission is no longer available.</IonNote>
            )}
          </IonCardContent>
        </IonCard>

        <IonCard className="preview-card section-card">
          <IonCardContent className="preview-form">
            <IonRow className="section-header">
            <IonText color="dark" className="section-heading">
                <h3>Your Submission</h3>
              </IonText>
            </IonRow>
            <IonItem color="white" lines="none">
              <IonLabel position="stacked">Title*</IonLabel>
              {allowInlineEdit ? (
                <IonInput
                  value={draftTitle}
                  placeholder="Required"
                  onIonInput={(e) => setDraftTitle(e.detail.value ?? '')}
                  type="text"
                  autocapitalize="words"
                />
              ) : (
                <IonText className="preview-value">{post?.title || '-'}</IonText>
              )}
            </IonItem>
            <IonItem color="white" lines="none">
              <IonLabel position="stacked">Byline*</IonLabel>
              {allowInlineEdit ? (
                <IonSelect
                  value={draftByline}
                  placeholder="(Who wrote the post)"
                  onIonChange={(e) => setDraftByline(e.detail.value)}
                >
                  {bylineOptions.map((option) => (
                    <IonSelectOption value={option} key={`byline-${option}`}>
                      {option}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              ) : (
                <IonText className="preview-value">{post?.byline || '-'}</IonText>
              )}
            </IonItem>
            {post?.local_only && (
              <IonItem color="white" lines="none">
                <IonLabel position="stacked">Local Post</IonLabel>
                <IonText className="preview-value">Yes</IonText>
              </IonItem>
            )}
            {post?.local_only && post?.location && (
              <IonItem color="white" lines="none">
                <IonLabel position="stacked">Location label</IonLabel>
                <IonText className="preview-value">{post.location}</IonText>
              </IonItem>
            )}
            {allowInlineEdit && (
              <IonItem color="white" lines="none">
                <IonLabel position="stacked">Category*</IonLabel>
                <IonSelect
                  value={draftCategory}
                  placeholder="Select category"
                  onIonChange={(e) => setDraftCategory(e.detail.value)}
                >
                  <IonSelectOption value="refreshments">Refreshments</IonSelectOption>
                  <IonSelectOption value="mingle">Mingle</IonSelectOption>
                  <IonSelectOption value="change">Change</IonSelectOption>
                  <IonSelectOption value="longcovid">Long Covid</IonSelectOption>
                  <IonSelectOption value="families">Family</IonSelectOption>
                  <IonSelectOption value="science">STEAM</IonSelectOption>
                  <IonSelectOption value="pop">Pop</IonSelectOption>
                  <IonSelectOption value="newcomers">Newcomers</IonSelectOption>
                  <IonSelectOption value="book">Book</IonSelectOption>
                  <IonSelectOption value="events">Event</IonSelectOption>
                  <IonSelectOption value="housing" disabled={!draftLocalOnly && draftCategory !== 'housing'}>
                    Housing
                  </IonSelectOption>
                  <IonSelectOption value="recommendations" disabled={!draftLocalOnly && draftCategory !== 'recommendations'}>
                    Local Recommendations
                  </IonSelectOption>
                </IonSelect>
              </IonItem>
            )}
            {(allowInlineEdit || post?.link) && (
              <IonItem color="white" lines="none">
                <IonLabel position="stacked">Link (optional)</IonLabel>
                {allowInlineEdit ? (
                  <IonInput
                    value={draftLink}
                    placeholder="https://"
                    onIonInput={(e) => setDraftLink(e.detail.value ?? '')}
                    type="text"
                  />
                ) : (
                  <IonText className="preview-value">{post?.link}</IonText>
                )}
              </IonItem>
            )}
            {post?.sensitive && (
              <IonItem color="white" lines="none">
                <IonLabel position="stacked">Sensitive Content</IonLabel>
                <IonText className="preview-value">
                  {post.sensitive_description ? post.sensitive_description : 'Yes'}
                </IonText>
              </IonItem>
            )}
            <IonItem color="white" lines="none" className="preview-content-item">
              <IonLabel position="stacked">Post content*</IonLabel>
              <div className="preview-content">
                {allowInlineEdit ? (
                  <IonTextarea
                    value={draftContent}
                    autoGrow
                    autocapitalize='sentences'
                    autoCorrect='on'
                    maxlength={2000}
                    style={{ minHeight: '120px' }}
                    placeholder="Write your post here..."
                    onIonInput={(e) => setDraftContent(e.detail.value ?? '')}
                    counter={true}
                  />
                ) : (
                  <>
                    {visible && displayContent && renderContent(displayContent)}
                    {visible && status !== 'rejected' && !displayContent && (
                      <IonNote>No content available.</IonNote>
                    )}
                  </>
                )}
              </div>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {allowInlineEdit && isDraft && (
          <IonRow class="ion-justify-content-center" style={{ marginTop: '12px' }}>
            <IonButton onClick={handleSaveDraft} disabled={saving || !hasEdits}>
              <FontAwesomeIcon icon={faCirclePlus} style={{ marginRight: '8px' }} />
              Save draft
            </IonButton>
            <IonButton onClick={handleSubmitDraft} disabled={saving || !hasEdits}>
              Submit for review
            </IonButton>
            <IonButton
              fill="outline"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </IonButton>
          </IonRow>
        )}

        {visible && moderatorExplanation && (
          <IonCard className="requested-edit section-card">
            <IonCardContent>
              <IonText color="dark" className="section-heading">
                <h3>Moderator explanation</h3>
              </IonText>
              <IonText color="navy">
                <p>{moderatorExplanation}</p>
              </IonText>
              <IonRow className="ion-justify-content-center">
                <GuidelinesButton label="Guidelines" fill="outline" color="primary" includeMechanics />
              </IonRow>
            </IonCardContent>
          </IonCard>
        )}

        {visible && hasRequestedEdit && (
          <IonCard className="requested-edit section-card">
            <IonCardContent>
              <IonText color="dark" className="section-heading">
                <h3>Requested content edit</h3>
              </IonText>
              {renderContent(requestedEdit ?? '')}
              <IonText color="medium">
                <br/>
                <p>Approve to use this exact edit and get it posted now, or make changes in your own words and resubmit.</p>
              </IonText>
              {canEdit && !editing && (
                <IonRow class="ion-justify-content-center" style={{ marginTop: '8px' }}>
                  <IonButton
                    size="small"
                    fill="outline"
                    color="danger"
                    onClick={handleRejectEdit}
                    disabled={saving}
                  >
                    Reject edit
                  </IonButton>
                  <IonButton size="small" fill="outline" onClick={() => {
                    applyDraftDefaults();
                    setDraftContent(requestedEdit ?? submittedContent);
                    setEditing(true);
                  }}>
                    Edit
                  </IonButton>
                  <IonButton
                    size="small"
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

        {canEdit && !editing && !hasRequestedEdit && !isDraft && (
          <IonRow class="ion-justify-content-center" style={{ marginBottom: '8px' }}>
            <IonButton
              onClick={() => {
                applyDraftDefaults();
                setEditing(true);
              }}
            >
              Edit & resubmit
            </IonButton>
          </IonRow>
        )}

        {isDraft && !editing && (
          <IonRow class="ion-justify-content-center" style={{ marginBottom: '8px' }}>
            <IonButton
              onClick={() => {
                applyDraftDefaults();
                setEditing(true);
              }}
            >
              Edit draft
            </IonButton>
          </IonRow>
        )}

        {canEdit && editing && !allowInlineEdit && (
          <div className="draft-edit-wrapper">
            <IonCard color="white" className="edit-card">
              <IonCardContent>
                <IonText color="dark">
                  <h3>{isDraft ? 'Edit your draft' : 'Edit your submission'}</h3>
                </IonText>
                <IonText color="medium">
                  <p>
                    {isDraft
                      ? 'Update your draft, then save or submit for review.'
                      : 'Make the requested changes, then resubmit for review.'}
                  </p>
                </IonText>
              </IonCardContent>
            </IonCard>
            <form className="draft-edit-form" onSubmit={(event) => event.preventDefault()}>
              <IonCard className="draft-edit-card">
                <IonItem color="white" lines="none">
                  <IonLabel position="stacked">Title*</IonLabel>
                  <IonInput
                    value={draftTitle}
                    placeholder="Required"
                    onIonInput={(e) => setDraftTitle(e.detail.value ?? '')}
                    type="text"
                    autocapitalize="words"
                  />
                </IonItem>
                <IonItem color="white" lines="none">
                  <IonLabel position="stacked">Byline*</IonLabel>
                  <IonSelect value={draftByline} placeholder="(Who wrote the post)" onIonChange={(e) => setDraftByline(e.detail.value)}>
                    {bylineOptions.map((option) => (
                      <IonSelectOption value={option} key={`byline-${option}`}>
                        {option}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonCard>

              <IonCard className="draft-edit-card">
                <IonItem color="white" lines="none">
                  <IonCheckbox
                    checked={draftLocalOnly}
                    onIonChange={(e) => setDraftLocalOnly(e.detail.checked)}
                    labelPlacement="end"
                    justify="start"
                  >
                    Local Post
                  </IonCheckbox>
                </IonItem>
                {draftLocalOnly && (
                  <IonItem color="white" lines="none">
                    <IonLabel position="stacked">Nearby City</IonLabel>
                    <IonInput
                      value={draftLocationLabel || draftLocation}
                      placeholder="Click to select"
                      readonly
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openCitySelector();
                      }}
                    />
                  </IonItem>
                )}
              </IonCard>

              <IonCard className="draft-edit-card">
                <IonItem color="white" lines="none">
                  <IonLabel position="stacked">Category*</IonLabel>
                  <IonSelect value={draftCategory} placeholder="Select category" onIonChange={(e) => setDraftCategory(e.detail.value)}>
                    <IonSelectOption value="refreshments">Refreshments</IonSelectOption>
                    <IonSelectOption value="mingle">Mingle</IonSelectOption>
                    <IonSelectOption value="change">Change</IonSelectOption>
                    <IonSelectOption value="longcovid">Long Covid</IonSelectOption>
                    <IonSelectOption value="families">Family</IonSelectOption>
                    <IonSelectOption value="science">STEAM</IonSelectOption>
                    <IonSelectOption value="pop">Pop</IonSelectOption>
                    <IonSelectOption value="newcomers">Newcomers</IonSelectOption>
                    <IonSelectOption value="book">Book</IonSelectOption>
                    <IonSelectOption value="events">Event</IonSelectOption>
                    <IonSelectOption value="housing" disabled={!draftLocalOnly && draftCategory !== 'housing'}>Housing</IonSelectOption>
                    <IonSelectOption value="recommendations" disabled={!draftLocalOnly && draftCategory !== 'recommendations'}>Local Recommendations</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </IonCard>

              <IonCard className="draft-edit-card">
                <IonItem color="white" lines="none">
                  <IonLabel position="stacked">Post Content*</IonLabel>
                  <IonTextarea
                    value={draftContent}
                    autoGrow
                    maxlength={2000}
                    style={{ minHeight: '120px' }}
                    placeholder="Write your post here..."
                    onIonInput={(e) => setDraftContent(e.detail.value ?? '')}
                    counter={true}
                  />
                </IonItem>
              </IonCard>

              <IonCard className="draft-edit-card">
                <IonItem color="white" lines="full">
                  <IonCheckbox
                    checked={draftIncludeProfile}
                    onIonChange={(e) => setDraftIncludeProfile(e.detail.checked)}
                    disabled={draftByline === 'Anonymous'}
                    labelPlacement="end"
                  >
                    Show Profile
                  </IonCheckbox>
                </IonItem>
                <IonItem color="white" lines="full">
                  <IonCheckbox
                    checked={draftSensitive}
                    onIonChange={(e) => setDraftSensitive(e.detail.checked)}
                    labelPlacement="end"
                  >
                    Sensitive Content
                  </IonCheckbox>
                </IonItem>
                {draftSensitive && (
                  <IonItem color="white" lines="none">
                    <IonLabel position="stacked">Sensitivity description (optional)</IonLabel>
                    <IonTextarea
                      value={draftSensitiveDescription}
                      placeholder="Add suggested content warnings here."
                      onIonInput={(e) => setDraftSensitiveDescription(e.detail.value ?? '')}
                    />
                  </IonItem>
                )}
              </IonCard>

              <IonCard className="draft-edit-card">
                <IonItem color="white" lines="none">
                  <IonLabel position="stacked">External link (optional)</IonLabel>
                  <IonInput
                    value={draftLink}
                    placeholder="https://"
                    onIonInput={(e) => setDraftLink(e.detail.value ?? '')}
                    type="text"
                  />
                </IonItem>
              </IonCard>
              <IonRow class="ion-justify-content-center" style={{ marginTop: '12px' }}>
                {isDraft ? (
                  <>
                    <IonButton onClick={handleSaveDraft} disabled={saving || !hasEdits}>
                      <FontAwesomeIcon icon={faCirclePlus} style={{ marginRight: '8px' }} />
                      Save draft
                    </IonButton>
                    <IonButton onClick={handleSubmitDraft} disabled={saving || !hasEdits}>
                      Submit for review
                    </IonButton>
                  </>
                ) : (
                  <IonButton onClick={handleResubmit} disabled={saving || !hasEdits}>
                    Edit and resubmit
                  </IonButton>
                )}
                <IonButton
                  fill="outline"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </IonButton>
              </IonRow>
            </form>
          </div>
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

        {visible && !editing && status !== 'approved' && (
          <IonRow className="ion-justify-content-center ion-padding-top ion-padding-bottom">
            <IonButton
              size="small"
              fill="outline"
              color="medium"
              disabled={hideUpdating}
              onClick={handleHideToggle}
            >
              {post?.hide_status_author === 'user'
                ? 'Unhide post from list view'
                : 'Hide post from list view'}
            </IonButton>
          </IonRow>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SubmittedPostPreview;
