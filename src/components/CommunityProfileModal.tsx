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
import { apiClient } from '../hooks/api/api-client';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useProfileDetails } from '../hooks/api/profiles/details';
import ProfileModal from './ProfileModal';
import { isPersonalPlus, normalizeLocalMediaUrl, onImgError, updateBlockedConnections } from '../hooks/utilities';
import './CommunityProfileModal.css';
import TextModal from './TextModal';
import { useGetCurrentUserChats } from '../hooks/api/chats/current-user-chats';
import { useQueryClient } from '@tanstack/react-query';
import { chatQueryKeys } from '../hooks/api/chats/chat-query-keys';
import CommunityProfileSection from './CommunityProfileSection';
import ReportModal from './ReportModal';
import { userQueryKeys } from '../hooks/api/profiles/user-query-keys';
import { ellipsisHorizontal } from 'ionicons/icons';


type CommunityProfileData = {
  user_id: number;
  username?: string | null;
  has_community_profile: boolean;
  community_bio?: string | null;
  location?: string | null;
  age_display?: string | number | null;
  connect_enabled: boolean;
  display_photo?: string | null;
  personal_photo?: string | null;
};

type Props = {
  userId: number | null;
  isAnonymous?: boolean;
  avatarUrl?: string | null;
  onDismiss: () => void;
};

const CommunityProfileModal: React.FC<Props> = ({ userId, isAnonymous, avatarUrl, onDismiss }) => {
  const { data: currentProfile } = useGetCurrentProfile();
  const [data, setData] = useState<CommunityProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  const profileDetails = useProfileDetails(Number(userId), Boolean(userId));
  const chatsList = useGetCurrentUserChats().data || [];
  const queryClient = useQueryClient();

  const isConnected = Boolean(
    userId &&
    (currentProfile?.mutual_connections?.includes(userId) || currentProfile?.outgoing_connections?.includes(userId))
  );
  const isSelf = Boolean(userId && currentProfile?.user === userId);
  const [profilePresent, profileDismiss] = useIonModal(ProfileModal, {
    cardData: profileDetails.data,
    profiletype: isConnected ? 'connected-nodismiss' : 'unconnected-nodismiss',
    pro: isPersonalPlus(currentProfile?.subscription_level),
    settingsAlt: currentProfile?.settings_alt_text || true,
    yourName: currentProfile?.name || '',
    onDismiss: () => profileDismiss(),
  });

  const isAnonymousAuthor = Boolean(isAnonymous);

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
  const isBlocked = Boolean(
    userId &&
      (currentProfile?.blocked_connections?.includes(userId) || currentProfile?.blocked_by?.includes(userId))
  );
  const isUnmatched = Boolean(userId && currentProfile?.unmatched_connections?.includes(userId));

  const handleChatDismiss = () => {
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.paginated });
    queryClient.invalidateQueries({ queryKey: ['mutuals-no-dialog'] });
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

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/api/profiles/community_profile/${userId}`);
        setData(response.data);
      } catch (error) {
        console.error('Failed to load community profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const otherDeactivated = Boolean(profileDetails.data?.deactivated_profile);
  const showRestricted = Boolean(otherDeactivated || isAnonymousAuthor);
  const username = isAnonymousAuthor
    ? 'Refresh member'
    : isSelf
      ? (currentProfile?.username || data?.username || 'You')
      : (otherDeactivated ? 'Refresh member' : (data?.username || 'Anonymous'));
  const avatarOverride = showRestricted ? undefined : normalizeLocalMediaUrl(avatarUrl);
  const displayPhoto = avatarOverride ?? (showRestricted ? undefined : normalizeLocalMediaUrl(data?.display_photo));
  const fallbackLogo = showRestricted ? '../static/img/null.png' : '../static/img/refresh-flower-blue.png';
  const viewerConnect = Boolean(currentProfile?.settings_community_profile);
  const otherConnect = Boolean(data?.connect_enabled);
  const canSendLikeFromCommunity = viewerConnect && otherConnect && !hasOutgoingLike && !isBlocked && !isUnmatched;
  const showCommunityDetails = Boolean(!showRestricted && (data?.community_bio || data?.location || data?.age_display));
  const personalPhoto = showRestricted ? undefined : (normalizeLocalMediaUrl(data?.personal_photo) || displayPhoto);
  const connectName = profileDetails.data?.name || username;
  const detailsLine = [data?.location, data?.age_display].filter(Boolean).join(' • ');
  const canShowChat = Boolean(isConnected && otherConnect && viewerActive && otherActive);
  const showActionControls = Boolean(userId && !isSelf && !showRestricted);
  const [presentAlert] = useIonAlert();
  const [presentActionSheet] = useIonActionSheet();
  const [reportAndBlock, setReportAndBlock] = useState(false);
  const [reportRequiresDetails, setReportRequiresDetails] = useState(false);

  const blockUser = async () => {
    if (!userId) return;
    await updateBlockedConnections(userId);
    queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.paginated });
    onDismiss();
  };

  const handleBlockConfirm = async () => {
    if (!userId) return;
    presentAlert({
      header: 'Are you sure you want to block this person?!',
      subHeader: 'Type "block" to confirm.',
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
          text: 'Block',
          role: 'confirm',
          handler: async (alertData) => {
            if ((alertData?.confirmation || '').toLowerCase() !== 'block') {
              presentAlert({
                header: 'Block not confirmed.',
                message: 'You must type "block" exactly to proceed.',
                buttons: ['OK'],
              });
              return;
            }
            await blockUser();
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
        blockUser();
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
    presentActionSheet({
      header: "Don't want to see any more of this member?",
      buttons: [
        {
          text: 'Block',
          handler: () => handleBlockConfirm(),
        },
        {
          text: 'Report and block',
          role: 'destructive',
          handler: () => {
            setReportAndBlock(true);
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
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
            {loading ? (
              <IonSpinner name="dots" />
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <img
                    alt="Community profile"
                    src={!showRestricted && data?.has_community_profile ? (displayPhoto || fallbackLogo) : fallbackLogo}
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
                      Edit community profile
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
                          `Want to connect 1:1 with people you meet in the comments?${currentProfile?.created_profile ? '' : ' Create an active personal profile and'} turn on your Connect from Refreshments in your Me tab > Settings.`}
                        {canSendLikeFromCommunity && (
                          <>
                            You both have Connect from Refreshments turned on! Send{' '}
                            <span className="community-profile-inline-name">{connectName}</span>{' '}
                            a Like!
                          </>
                        )}

                        {viewerConnect && !otherConnect && `${username} is keeping Refreshments community-only for now. Please reply to them in the thread.`}
                      </p>
                    </IonText>
                    {canSendLikeFromCommunity && (
                      <IonItem lines="none" button onClick={() => profilePresent()}>
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
