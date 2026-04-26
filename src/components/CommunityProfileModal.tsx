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
  onDismiss: () => void;
};

const CommunityProfileModal: React.FC<Props> = ({ userId, isAnonymous, avatarUrl, onDismiss }) => {
  const { data: currentProfile } = useGetCurrentProfile();
  const communityProfile = useGetCommunityProfile(userId, Boolean(userId));
  const data = communityProfile.data ?? null;
  const profileDetails = useProfileDetails(Number(userId), Boolean(userId));
  const chatsList = useGetCurrentUserChats().data || [];
  const incomingStatus = useGetIncomingConnectionStatus(userId ?? undefined).data;
  const queryClient = useQueryClient();

  const isConnected = Boolean(userId && currentProfile?.mutual_connections?.includes(userId));
  const isSelf = Boolean(userId && currentProfile?.user && String(currentProfile.user) === String(userId));
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
      queryClient.invalidateQueries({ queryKey: userQueryKeys.incoming_status(userId ?? undefined) });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.incoming });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.incoming_paginated });
      likeBackDismiss();
    },
  });

  const isAnonymousAuthor = Boolean(isAnonymous);

  const [blockTypesPresent, blockTypesDismiss] = useIonModal(BlockTypesExplainedModal, {
    onDismiss: () => blockTypesDismiss(),
  });

  const EditCommunityProfileModal: React.FC<{ onDismiss: () => void }> = ({ onDismiss: handleDismiss }) => (
    <IonContent className="ion-padding">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <IonButton fill="clear" onClick={handleDismiss}>Close</IonButton>
      </div>
      <CommunityProfileSection useAccordion={false} />
    </IonContent>
  );

  const [editPresent, editDismiss] = useIonModal(EditCommunityProfileModal, {
    onDismiss: () => editDismiss(),
  });

  const existingChat = chatsList?.find((chat: { other_user_id?: string | number }) => {
    return String(chat?.other_user_id) === String(userId);
  });
  const chatLabel = existingChat ? 'Continue your chat' : 'Start your chat with them';
  const viewerActive = Boolean(currentProfile && !currentProfile?.deactivated_profile && !currentProfile?.paused_profile);
  const otherActive = Boolean(profileDetails.data && !profileDetails.data?.deactivated_profile && !profileDetails.data?.paused_profile);
  const hasOutgoingLike = Boolean(userId && currentProfile?.outgoing_connections?.includes(userId));
  const hasIncomingLike = Boolean(userId && (incomingStatus?.is_incoming ?? false));
  const isBlocked = Boolean(
    userId &&
      (currentProfile?.blocked_connections?.includes(userId) || currentProfile?.blocked_by?.includes(userId))
  );
  const isCommunityBlocked = Boolean(userId && currentProfile?.community_blocked?.includes(userId));
  const isUnmatched = Boolean(userId && currentProfile?.unmatched_connections?.includes(userId));

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
      : { other_user_id: userId ? String(userId) : undefined, unread_count: 0 },
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
      ? (currentProfile?.username || data?.username || 'You')
      : (otherDeactivated ? 'Refresh member' : (data?.username || 'Anonymous'));
  const avatarOverride = showRestricted ? undefined : normalizeLocalMediaUrl(avatarUrl);
  const ownerPaused = Boolean(profileDetails.data?.paused_profile);
  const pausedCommunityPhoto = normalizeLocalMediaUrl((data as any)?.community_profile_pic);
  const communityAvatar = getAvatarDisplay({
    profileImage: avatarOverride ?? (
      showRestricted
        ? null
        : ownerPaused
          ? pausedCommunityPhoto
          : data?.display_photo
    ),
    viewerConnect: currentProfile?.settings_community_profile,
    authorConnect: data?.connect_enabled,
  });
  const orderedPersonalPhoto = normalizeLocalMediaUrl(getPrimaryOrderedPhoto(profileDetails.data));
  const fallbackLogo = '../static/img/navynobordervector.png';
  const viewerConnect = Boolean(currentProfile?.settings_community_profile);
  const otherConnect = Boolean(data?.connect_enabled);
  const canSendLikeFromCommunity = viewerConnect && otherConnect && !isConnected && !isBlocked && !isUnmatched && (hasIncomingLike || !hasOutgoingLike);
  const canLikeBack = viewerConnect && otherConnect && hasIncomingLike && !isConnected && !isBlocked && !isUnmatched;
  const showCommunityDetails = Boolean(!showRestricted && (data?.community_bio || data?.location || data?.age_display));
  const personalPhoto = showRestricted ? undefined : (orderedPersonalPhoto || normalizeLocalMediaUrl(data?.personal_photo));
  const connectName = profileDetails.data?.name || username;
  const detailsLine = [data?.location, data?.age_display].filter(Boolean).join(' • ');
  const canShowChat = Boolean(isConnected && otherConnect && viewerActive && otherActive);
  const showActionControls = Boolean(userId && !isSelf && !showRestricted);
  const [presentAlert] = useIonAlert();
  const [presentActionSheet] = useIonActionSheet();
  const blockProfile = useBlockProfile();
  const [reportAndBlock, setReportAndBlock] = useState(false);
  const [reportRequiresDetails, setReportRequiresDetails] = useState(false);

  const blockUser = async (alsoCommunity = false) => {
    if (!userId) return;
    await updateBlockedConnections(userId);
    if (alsoCommunity) await updateCommunityBlocked(userId);
    queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.paginated });
    queryClient.invalidateQueries({ queryKey: postQueryKeys.all });
    onDismiss();
  };

  const communityBlockUser = async (alsoPersonal = false) => {
    if (!userId) return;
    await updateCommunityBlocked(userId);
    if (alsoPersonal && !currentProfile?.blocked_connections?.includes(userId)) {
      await updateBlockedConnections(userId);
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.paginated });
    }
    queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
    queryClient.invalidateQueries({ queryKey: postQueryKeys.all });
    onDismiss();
  };

  const handleBlockConfirm = () => {
    if (!userId) return;
    blockProfile(userId, () => blockUser(false));
  };

  const handleCommunityBlockConfirm = async () => {
    if (!userId) return;
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
    id: userId ?? undefined,
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
            {communityProfile.isLoading && !data ? (
              <IonSpinner name="dots" />
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <img
                    alt="Refreshments profile"
                    src={showRestricted ? fallbackLogo : communityAvatar.src}
                    onError={(e) => onImgError(e)}
                    style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <IonText><strong>{username}</strong></IonText>
                  {!!detailsLine && !showRestricted && (
                    <IonText>
                      <p style={{ margin: 0 }}>{detailsLine}</p>
                    </IonText>
                  )}
                </div>

                {data?.has_community_profile && showCommunityDetails && (
                  <div style={{ marginTop: '16px' }}>
                    {data?.community_bio && (
                      <IonText>
                        <p><strong>{data.community_bio}</strong></p>
                      </IonText>
                    )}
                  </div>
                )}

                {isSelf && !showRestricted && (
                  <div style={{ marginTop: '16px' }}>
                    <IonText className="community-profile-info-box community-profile-info-center">
                      <p>This is you!</p>
                    </IonText>
                    <IonButton expand="block" onClick={() => editPresent()}>
                      Edit Refreshments profile
                    </IonButton>
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
                            : 'Want to connect 1:1 with people you meet in the comments? Create an active personal profile and turn on your Connect from Refreshments in your Me tab > Settings.')}
                        {canLikeBack && (
                          <>
                            {username} has already sent you a Like.
                          </>
                        )}
                        {!canLikeBack && canSendLikeFromCommunity && (
                          <>
                            You both have Connect from Refreshments turned on! Send{' '}
                            <span className="community-profile-inline-name">{connectName}</span>{' '}
                            a Like!
                          </>
                        )}

                        {((hasOutgoingLike && !hasIncomingLike) || !otherConnect || isUnmatched) && `Please reply to ${username} in the thread.`}
                      </p>
                    </IonText>
                    {canLikeBack && (
                      <IonItem className="community-profile-profile-item" lines="none" button onClick={() => likeBackPresent()}>
                        <IonLabel>Like {connectName} back</IonLabel>
                      </IonItem>
                    )}
                    {!canLikeBack && canSendLikeFromCommunity && (
                      <IonItem className="community-profile-profile-item" lines="none" button onClick={() => profilePresent()}>
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
