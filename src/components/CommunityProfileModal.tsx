import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonText,
  useIonActionSheet,
  useIonAlert,
  useIonModal,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useGetCommunityProfile } from '../hooks/api/profiles/community-profile';
import { useGetIncomingConnectionStatus } from '../hooks/api/profiles/incoming-connection-status';
import { useProfileDetails } from '../hooks/api/profiles/details';
import ProfileModal from './ProfileModal';
import { getAvatarDisplay, getPrimaryOrderedPhoto, isPersonalPlus, normalizeLocalMediaUrl, onImgError, updateBlockedConnections, updateCommunityBlocked } from '../hooks/utilities';
import { useBlockProfile } from '../hooks/useBlockProfile';
import './CommunityProfileModal.css';
import TextModal from './TextModal';
import { useGetCurrentUserChats } from '../hooks/api/chats/current-user-chats';
import { useQueryClient } from '@tanstack/react-query';
import { chatQueryKeys } from '../hooks/api/chats/chat-query-keys';
import { postQueryKeys } from '../hooks/api/refreshments/post-query-keys';
import CommunityProfileSection from './CommunityProfileSection';
import ReportModal from './ReportModal';
import { userQueryKeys } from '../hooks/api/profiles/user-query-keys';
import { ellipsisHorizontal } from 'ionicons/icons';
import BlockTypesExplainedModal from './BlockTypesExplainedModal';

type Props = {
  userId: number | null;
  isAnonymous?: boolean;
  avatarUrl?: string | null;
  selfPreview?: boolean;
  onDismiss: () => void;
};

const getAgeDisplay = (age: number | null | undefined, showAgeTier: string | null | undefined) => {
  if (showAgeTier === 'none' || age == null) return null;
  if (showAgeTier === 'decade') {
    return age < 20 ? 'late teens' : `${Math.floor(age / 10) * 10}s`;
  }
  return age;
};

const EditCommunityProfileModal: React.FC<{ onDismiss: () => void }> = ({ onDismiss: handleDismiss }) => (
  <IonContent className="ion-padding edit-community-profile-modal-content">
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <IonButton fill="clear" onClick={handleDismiss}>Close</IonButton>
    </div>
    <CommunityProfileSection useAccordion={false} />
  </IonContent>
);

const CommunityProfileModal: React.FC<Props> = ({ userId, isAnonymous, avatarUrl, selfPreview = false, onDismiss }) => {
  const { data: currentProfile } = useGetCurrentProfile();
  const effectiveUserId = userId ?? (selfPreview ? currentProfile?.user ?? null : null);
  const communityProfile = useGetCommunityProfile(effectiveUserId, Boolean(effectiveUserId));
  const data = communityProfile.data ?? null;
  const profileDetails = useProfileDetails(Number(effectiveUserId), Boolean(effectiveUserId));
  const chatsList = useGetCurrentUserChats().data || [];
  const incomingStatus = useGetIncomingConnectionStatus(effectiveUserId ?? undefined).data;
  const queryClient = useQueryClient();

  const isConnected = Boolean(effectiveUserId && currentProfile?.mutual_connections?.includes(effectiveUserId));
  const isSelf = Boolean(
    selfPreview ||
    (effectiveUserId && currentProfile?.user && String(currentProfile.user) === String(effectiveUserId))
  );
  const currentCommunityProfile = useGetCommunityProfile(undefined, isSelf);
  const selfCommunityData = isSelf ? (currentCommunityProfile.data ?? data) : data;
  const selfDisplayData = isSelf && currentProfile
    ? {
        ...(data ?? {}),
        ...(selfCommunityData ?? {}),
        user_id: currentProfile.user,
        username: currentProfile.username ?? selfCommunityData?.username ?? data?.username,
        has_community_profile: Boolean(selfCommunityData?.username ?? data?.has_community_profile),
        community_bio: selfCommunityData?.community_bio ?? data?.community_bio,
        location: selfCommunityData?.show_location ? currentProfile.location : null,
        age_display: getAgeDisplay(currentProfile.age, selfCommunityData?.show_age_tier),
        connect_enabled: Boolean(
          currentProfile.settings_community_profile &&
          !currentProfile.deactivated_profile &&
          !currentProfile.paused_profile
        ),
      }
    : null;
  const displayData = selfDisplayData ?? data;
  const [profilePresent, profileDismiss] = useIonModal(ProfileModal, {
    cardData: profileDetails.data,
    profiletype: isConnected ? 'connected-nodismiss' : 'unconnected-nodismiss',
    pro: isPersonalPlus(currentProfile?.subscription_level),
    settingsAlt: Boolean(currentProfile?.settings_alt_text),
    yourName: currentProfile?.name || '',
    onDismiss: () => profileDismiss(),
  });

  const [likeBackPresent, likeBackDismiss] = useIonModal(ProfileModal, {
    cardData: profileDetails.data,
    profiletype: 'unconnected',
    pro: isPersonalPlus(currentProfile?.subscription_level),
    settingsAlt: Boolean(currentProfile?.settings_alt_text),
    yourName: currentProfile?.name || '',
    onDismiss: () => likeBackDismiss(),
    onActionDismiss: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.incoming_status(effectiveUserId ?? undefined) });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.incoming });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.incoming_paginated });
      likeBackDismiss();
    },
  });

  const isAnonymousAuthor = Boolean(isAnonymous);

  const [blockTypesPresent, blockTypesDismiss] = useIonModal(BlockTypesExplainedModal, {
    onDismiss: () => blockTypesDismiss(),
  });

  const [editPresent, editDismiss] = useIonModal(EditCommunityProfileModal, {
    onDismiss: () => editDismiss(),
  });

  const existingChat = chatsList?.find((chat: { other_user_id?: string | number }) => {
    return String(chat?.other_user_id) === String(effectiveUserId);
  });
  const chatLabel = existingChat ? 'Continue your chat' : 'Start your chat with them';
  const viewerActive = Boolean(currentProfile && !currentProfile?.deactivated_profile);
  const otherActive = Boolean(profileDetails.data && !profileDetails.data?.deactivated_profile);
  const hasOutgoingLike = Boolean(effectiveUserId && currentProfile?.outgoing_connections?.includes(effectiveUserId));
  const hasIncomingLike = Boolean(effectiveUserId && (incomingStatus?.is_incoming ?? false));
  const isBlocked = Boolean(
    effectiveUserId &&
      (currentProfile?.blocked_connections?.includes(effectiveUserId) || currentProfile?.blocked_by?.includes(effectiveUserId))
  );
  const isCommunityBlocked = Boolean(effectiveUserId && currentProfile?.community_blocked?.includes(effectiveUserId));
  const isUnmatched = Boolean(effectiveUserId && currentProfile?.unmatched_connections?.includes(effectiveUserId));

  const handleChatDismiss = () => {
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.paginated });
    queryClient.invalidateQueries({ queryKey: ['mutuals-no-dialog'] });
    queryClient.invalidateQueries({ queryKey: ['mutuals-no-dialog-paginated-v3'] });
    dismissChat();
  };

  const [presentChat, dismissChat] = useIonModal(TextModal, {
    textModalData: existingChat
      ? existingChat
      : { other_user_id: effectiveUserId ? String(effectiveUserId) : undefined, unread_count: 0 },
    profileDetails: profileDetails.data,
    pro: isPersonalPlus(currentProfile?.subscription_level),
    settingsAlt: currentProfile?.settings_alt_text,
    from_name: currentProfile?.name,
    onDismiss: handleChatDismiss,
  });

  const otherDeactivated = Boolean(profileDetails.data?.deactivated_profile);
  const showRestricted = Boolean(otherDeactivated || isAnonymousAuthor);
  const username = isAnonymousAuthor
    ? 'Refresh member'
    : isSelf
      ? (currentProfile?.username || displayData?.username || 'You')
      : (otherDeactivated ? 'Refresh member' : (data?.username || 'Anonymous'));
  const orderedPersonalPhoto = normalizeLocalMediaUrl(getPrimaryOrderedPhoto(currentProfile));
  const selfCommunityAvatarSource = (() => {
    if (!isSelf || !selfCommunityData) return null;
    if (selfCommunityData.use_personal_profile_picture) {
      return orderedPersonalPhoto ?? null;
    }
    return normalizeLocalMediaUrl(selfCommunityData.community_profile_pic) ?? null;
  })();
  const avatarOverride = showRestricted ? undefined : normalizeLocalMediaUrl(avatarUrl);
  const authorConnect = Boolean(displayData?.connect_enabled);
  const communityAvatar = getAvatarDisplay({
    profileImage: showRestricted
      ? null
      : isSelf
        ? selfCommunityAvatarSource
        : avatarOverride ?? null,
    viewerConnect: currentProfile?.settings_community_profile,
    authorConnect,
    allowDefaultConnectBorder: !isSelf && !avatarOverride,
  });
  const showFallbackAvatar = showRestricted || !communityAvatar.hasImage;
  const showCommunityAvatarBorder = Boolean(
    !showRestricted && currentProfile?.settings_community_profile && authorConnect
  );
  const fallbackLogo = '../static/img/navynobordervector.png';
  const viewerConnect = Boolean(currentProfile?.settings_community_profile);
  const otherConnect = authorConnect;
  const canSendLikeFromCommunity = viewerConnect && otherConnect && !isConnected && !isBlocked && !isUnmatched && (hasIncomingLike || !hasOutgoingLike);
  const canLikeBack = viewerConnect && otherConnect && hasIncomingLike && !isConnected && !isBlocked && !isUnmatched;
  const showCommunityDetails = Boolean(!showRestricted && (displayData?.community_bio || displayData?.location || displayData?.age_display));
  const showSelfPreviewNote = Boolean(isSelf && !showRestricted && viewerConnect && selfPreview);
  const showSelfManageActions = Boolean(isSelf && !showRestricted && !selfPreview);
  const otherOrderedPersonalPhoto = normalizeLocalMediaUrl(getPrimaryOrderedPhoto(profileDetails.data));
  const personalPhoto = showRestricted ? undefined : (otherOrderedPersonalPhoto || normalizeLocalMediaUrl(data?.personal_photo));
  const connectName = profileDetails.data?.name || username;
  const detailsLine = [displayData?.location, displayData?.age_display].filter(Boolean).join(' • ');
  const canShowChat = Boolean(isConnected && otherConnect && viewerActive && otherActive);
  const showActionControls = Boolean(effectiveUserId && !isSelf && !showRestricted);
  const [presentAlert] = useIonAlert();
  const [presentActionSheet] = useIonActionSheet();
  const blockProfile = useBlockProfile();
  const [reportAndBlock, setReportAndBlock] = useState(false);
  const [reportRequiresDetails, setReportRequiresDetails] = useState(false);

  const blockUser = async (alsoCommunity = false) => {
    if (!effectiveUserId) return;
    await updateBlockedConnections(effectiveUserId);
    if (alsoCommunity) await updateCommunityBlocked(effectiveUserId);
    queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.paginated });
    queryClient.invalidateQueries({ queryKey: postQueryKeys.all });
    onDismiss();
  };

  const communityBlockUser = async (alsoPersonal = false) => {
    if (!effectiveUserId) return;
    await updateCommunityBlocked(effectiveUserId);
    if (alsoPersonal && !currentProfile?.blocked_connections?.includes(effectiveUserId)) {
      await updateBlockedConnections(effectiveUserId);
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.paginated });
    }
    queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
    queryClient.invalidateQueries({ queryKey: postQueryKeys.all });
    onDismiss();
  };

  const handleBlockConfirm = () => {
    if (!effectiveUserId) return;
    blockProfile(effectiveUserId, () => blockUser(false));
  };

  const handleCommunityBlockConfirm = async () => {
    if (!effectiveUserId) return;
    presentAlert({
      header: 'Full community block?',
      subHeader: 'The personal block is permanent. Type "block" to confirm.',
      message: "Their posts and comments will be hidden from you in the Refreshments Bar, and yours from them. They'll also be personally blocked.",
      inputs: [
        {
          name: 'confirmation',
          type: 'text',
          placeholder: 'Type "block" to confirm',
        },
      ],
      buttons: [
        { text: 'Nevermind', role: 'cancel' },
        {
          text: 'Full community block',
          handler: async (alertData) => {
            if ((alertData?.confirmation || '').toLowerCase() !== 'block') {
              presentAlert({
                header: 'Block not confirmed.',
                message: 'You must type "block" exactly to proceed.',
                buttons: ['OK'],
              });
              return;
            }
            await communityBlockUser(true);
          },
        },
      ],
    });
  };

  const [createReportPresent, createReportDismiss] = useIonModal(ReportModal, {
    offender: "user",
    text: connectName,
    id: effectiveUserId ?? undefined,
    requireDetails: reportRequiresDetails,
    onDismiss: (data: string, role: string) => {
      createReportDismiss(data, role);
      if (reportAndBlock) {
        setReportAndBlock(false);
        setReportRequiresDetails(false);
        blockUser(true);
      }
    },
  });
  useEffect(() => {
    if (!reportAndBlock) return;
    setReportRequiresDetails(true);
    createReportPresent();
  }, [reportAndBlock, createReportPresent]);

  const handleActionMenu = () => {
    if (!showActionControls) {
      return;
    }
    const buttons: any[] = [];

    if (!isBlocked) {
      buttons.push({
        text: 'Personal block',
        handler: () => handleBlockConfirm(),
      });
    }
    if (!isCommunityBlocked) {
      buttons.push({
        text: 'Full community block',
        handler: () => handleCommunityBlockConfirm(),
      });
    }
    buttons.push({
      text: 'Report and block',
      role: 'destructive',
      handler: () => { setReportAndBlock(true); },
    });
    buttons.push({
      text: "What's the difference?",
      handler: () => { blockTypesPresent(); },
    });
    buttons.push({ text: 'Cancel', role: 'cancel' });

    presentActionSheet({
      header: "Don't want to see any more of this member?",
      buttons,
    });
  };

  return (
    <IonContent style={{ '--background': 'transparent' } as React.CSSProperties}>
      <div
        className="community-profile-overlay"
        onClick={onDismiss}
      >
        <IonCard
          className="community-profile-card"
          onClick={(event) => event.stopPropagation()}
        >
          <IonCardContent className="community-profile-card-content">
            {showActionControls && (
              <IonButton
                fill="clear"
                size="small"
                className="community-profile-ellipsis community-profile-ellipsis--corner"
                onClick={handleActionMenu}
              >
                <IonIcon icon={ellipsisHorizontal} />
              </IonButton>
            )}
            <IonButton
              fill="clear"
              size="small"
              className="community-profile-close community-profile-close--corner"
              onClick={onDismiss}
            >
              Close
            </IonButton>
            {((!effectiveUserId && !selfPreview) || (communityProfile.isLoading && !data && !selfDisplayData)) ? (
              <div className="community-profile-skeleton">
                <div className="community-profile-skeleton__block community-profile-skeleton__circle" />
                <div className="community-profile-skeleton__block" style={{ width: '120px', height: '16px' }} />
                <div className="community-profile-skeleton__block" style={{ width: '80px', height: '12px' }} />
                <div className="community-profile-skeleton__block" style={{ width: '100%', height: '12px' }} />
                <div className="community-profile-skeleton__block" style={{ width: '85%', height: '12px' }} />
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '50%',
                      border: showCommunityAvatarBorder ? '2px solid var(--ion-color-primary)' : 'none',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      className={communityAvatar.className}
                      alt="Refreshments Profile"
                      src={showRestricted ? fallbackLogo : communityAvatar.src}
                      onError={(e) => onImgError(e)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: showFallbackAvatar ? 'grayscale(1)' : 'none',
                      }}
                    />
                  </div>
                  <IonText><strong>{username}</strong></IonText>
                  {!!detailsLine && !showRestricted && (
                    <IonText>
                      <p style={{ margin: 0 }}>{detailsLine}</p>
                    </IonText>
                  )}
                </div>

                {displayData?.has_community_profile && showCommunityDetails && (
                  <div style={{ marginTop: '16px' }}>
                    {displayData?.community_bio && (
                      <IonText>
                        <p><strong>{displayData.community_bio}</strong></p>
                      </IonText>
                    )}
                  </div>
                )}

                {showSelfPreviewNote && (
                  <div style={{ marginTop: '16px' }}>
                    <IonText className="community-profile-info-box">
                      <p>If the other member also has Connect from Refreshments on, they will also be able to see your Personal Profile like below so they can send or respond to Likes.</p>
                    </IonText>
                    <IonItem className="community-profile-profile-item" lines="none" color="white" style={{ marginTop: '8px', marginBottom: '8px' }}>
                      <img
                        alt={currentProfile?.name || ''}
                        src={normalizeLocalMediaUrl(getPrimaryOrderedPhoto(currentProfile)) || fallbackLogo}
                        onError={onImgError}
                        style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', marginRight: '12px' }}
                      />
                      <IonLabel>{currentProfile?.name}</IonLabel>
                    </IonItem>
                  </div>
                )}

                {showSelfManageActions && (
                  <div style={{ marginTop: '16px' }}>
                    <IonText className="community-profile-info-box">
                      <p><strong>This is you!</strong></p>
                    </IonText>
	                    <IonItem
	                      className="community-profile-profile-item"
	                      lines="none"
	                      button
	                      detail
	                      onClick={() => editPresent({ cssClass: 'edit-community-profile-modal' })}
	                    >
                      <IonLabel>Edit your Refreshments Profile</IonLabel>
                    </IonItem>
                  </div>
                )}

                {!isSelf && !showRestricted && canShowChat && (
                  <div style={{ marginTop: '16px' }}>
                    <IonText>
                      <p>You and {connectName} are already connected!</p>
                    </IonText>
	                    <IonItem
	                      lines="none"
	                      button
	                      detail
	                      onClick={() => presentChat()}
	                    >
                      <IonLabel>{chatLabel}</IonLabel>
                    </IonItem>
                  </div>
                )}

                {!isSelf && !showRestricted && !canShowChat && (
                  <div style={{ marginTop: '16px' }}>
                    <IonText className="community-profile-info-box">
                      <p>
                        {!viewerConnect &&
                          (currentProfile?.created_profile
                            ? 'Want to connect 1:1 with people you meet in the comments? Turn on your Connect from Refreshments in your Me tab > Settings.'
                            : 'Want to connect 1:1 with people you meet in the comments? Create an active Personal Profile and turn on your Connect from Refreshments in your Me tab > Settings.')}
                        {canLikeBack && (
                          <>
                            {username} has already sent you a Like.
                          </>
                        )}
                        {!canLikeBack && canSendLikeFromCommunity && (
                          <>
                            You both have Connect from Refreshments turned on! View their Personal Profile and Send{' '}
                            <span className="community-profile-inline-name">{connectName}</span>{' '}
                            a Like!
                          </>
                        )}

                        {viewerConnect && ((hasOutgoingLike && !hasIncomingLike) || !otherConnect || isUnmatched) && `Please reply to ${username} in the thread.`}
                      </p>
                    </IonText>
                    {canLikeBack && (
	                      <IonItem className="community-profile-profile-item" lines="none" button detail onClick={() => likeBackPresent()}>
	                        <IonLabel>Like {connectName} back</IonLabel>
	                      </IonItem>
	                    )}
	                    {!canLikeBack && canSendLikeFromCommunity && (
	                      <IonItem className="community-profile-profile-item" lines="none" button detail onClick={() => profilePresent()}>
                        {personalPhoto ? (
                          <img
                            alt="Profile"
                            src={personalPhoto}
                            onError={(e) => onImgError(e)}
                            style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', marginRight: '12px' }}
                          />
                        ) : (
                          <img
                            alt="Profile placeholder"
                            src={fallbackLogo}
                            onError={(e) => onImgError(e)}
                            style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', marginRight: '12px' }}
                          />
                        )}
                        <IonLabel>{connectName}</IonLabel>
                      </IonItem>
                    )}
                  </div>
                )}

              </>
            )}
          </IonCardContent>
        </IonCard>
      </div>
    </IonContent>
  );
};

export default CommunityProfileModal;
