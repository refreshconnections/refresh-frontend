import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  useIonModal,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { apiClient } from '../hooks/api/api-client';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useProfileDetails } from '../hooks/api/profiles/details';
import ProfileModal from './ProfileModal';
import { isPersonalPlus, normalizeLocalMediaUrl, onImgError } from '../hooks/utilities';
import './CommunityProfileModal.css';
import TextModal from './TextModal';
import { useGetCurrentUserChats } from '../hooks/api/chats/current-user-chats';
import { useQueryClient } from '@tanstack/react-query';
import { chatQueryKeys } from '../hooks/api/chats/chat-query-keys';
import CommunityProfileSection from './CommunityProfileSection';


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
      <CommunityProfileSection />
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
  const showCommunityDetails = Boolean(!showRestricted && (data?.community_bio || data?.location || data?.age_display));
  const personalPhoto = showRestricted ? undefined : (normalizeLocalMediaUrl(data?.personal_photo) || displayPhoto);
  const connectName = profileDetails.data?.name || username;
  const detailsLine = [data?.location, data?.age_display].filter(Boolean).join(' • ');
  const canShowChat = Boolean(isConnected && otherConnect && viewerActive && otherActive);

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
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IonButton fill="clear" onClick={onDismiss}>Close</IonButton>
            </div>
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
                    <IonText>
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
                    <IonText>
                      <p>
                        {!viewerConnect && 'Want to connect 1:1 with people you meet in the comments? Turn on your connect from refreshments in settings.'}
                        {viewerConnect && otherConnect && 'You both have Connect from Refreshments turned on! Send '}
                        {viewerConnect && otherConnect && (
                          <>
                            <IonButton
                              fill="clear"
                              size="small"
                              className="community-profile-inline-button"
                              onClick={() => profilePresent()}
                            >
                              {connectName}
                            </IonButton>
                            {' '}a Like!
                          </>
                        )}
                        {viewerConnect && !otherConnect && `${username} is keeping Refreshments community-only for now. Please reply to them in the thread.`}
                      </p>
                    </IonText>
                    {viewerConnect && otherConnect && (
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
