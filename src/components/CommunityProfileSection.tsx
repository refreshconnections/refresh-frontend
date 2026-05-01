import {
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonCard,
  IonCardContent,
  IonCol,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonRow,
  IonText,
  IonTextarea,
  IonToggle,
  useIonModal,
} from '@ionic/react';
import { informationCircleOutline } from 'ionicons/icons';
import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraResultType } from '@capacitor/camera';
import Resizer from 'react-image-file-resizer';
import { decode } from 'base64-arraybuffer';
import { useQueryClient } from '@tanstack/react-query';

import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useGetCommunityProfile } from '../hooks/api/profiles/community-profile';
import { apiClient } from '../hooks/api/api-client';
import { getPrimaryOrderedPhoto, normalizeLocalMediaUrl, onImgError, updateCurrentUserProfile, uploadCommunityProfilePhoto } from '../hooks/utilities';
import CroppedImageModal from './CroppedImageModal';
import EditUsernameModal from './EditUsernameModal';
import { userQueryKeys } from '../hooks/api/profiles/user-query-keys';
import './CommunityProfileSection.css';

type CommunityProfileSectionProps = {
  useAccordion?: boolean;
};

const CommunityProfileSection: React.FC<CommunityProfileSectionProps> = ({ useAccordion = true }) => {
  const queryClient = useQueryClient();
  const { data: currentProfile } = useGetCurrentProfile();
  const { data: communityProfile, refetch: refetchCommunityProfile } = useGetCommunityProfile();

  const [communityBio, setCommunityBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showAgeTier, setShowAgeTier] = useState('exact');
  const [usePersonalPhoto, setUsePersonalPhoto] = useState(true);
  const [connectFromRefreshments, setConnectFromRefreshments] = useState(
    Boolean(currentProfile?.settings_community_profile)
  );

  const [image, setImage] = useState<any>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [picDb, setPicDb] = useState<string>('community_profile_pic');

  const personalPhoto = normalizeLocalMediaUrl(getPrimaryOrderedPhoto(currentProfile)) ?? null;
  const communityPhoto = normalizeLocalMediaUrl(communityProfile?.community_profile_pic) ?? null;
  const personalProfilePaused = Boolean(currentProfile?.paused_profile);
  const effectiveUsePersonalPhoto = Boolean(!personalProfilePaused && usePersonalPhoto && personalPhoto);
  const previewPhoto = effectiveUsePersonalPhoto ? personalPhoto : communityPhoto;
  const photoButtonLabel = communityPhoto ? 'Change Refreshments Profile photo' : 'Upload Refreshments Profile photo';
  const ageNumber = typeof currentProfile?.age === 'number' ? currentProfile.age : null;
  const isTeen = ageNumber !== null && ageNumber < 20;
  const ageDecade = ageNumber !== null ? (isTeen ? 'late teens' : `${Math.floor(ageNumber / 10) * 10}s`) : 'Decade';
  const ageLabel = ageNumber !== null ? `${ageNumber}` : 'Exact age';
  const displayUsername = currentProfile?.username ?? communityProfile?.username ?? '';
  const hasPersonalPhoto = Boolean(personalPhoto);
  const hasLocation = Boolean(currentProfile?.location);
  const showLocationChecked = hasLocation ? showLocation : false;
  const personalPhotoToggleChecked = hasPersonalPhoto ? effectiveUsePersonalPhoto : false;
  const personalPhotoToggleDisabled = personalProfilePaused || !hasPersonalPhoto;
  const communityFallbackPhoto = '../static/img/navynobordervector.png';
  const displayPhoto = previewPhoto || communityFallbackPhoto;
  const isFallbackPhoto = !previewPhoto;

  useEffect(() => {
    if (!communityProfile) return;
    setCommunityBio(communityProfile.community_bio ?? '');
    setShowLocation(Boolean(communityProfile.show_location));
    const savedTier = communityProfile.show_age_tier ?? 'exact';
    if (isTeen && savedTier === 'decade') {
      setShowAgeTier('exact');
      updateCommunityProfile({ show_age_tier: 'exact' });
    } else {
      setShowAgeTier(savedTier);
    }
    setUsePersonalPhoto(
      hasPersonalPhoto
        ? Boolean(communityProfile.use_personal_profile_picture ?? true)
        : false
    );
  }, [communityProfile, hasPersonalPhoto, isTeen]);

  useEffect(() => {
    if (!personalProfilePaused || !communityProfile?.use_personal_profile_picture) return;

    setUsePersonalPhoto(false);
    void updateCommunityProfile({ use_personal_profile_picture: false });
  }, [communityProfile?.use_personal_profile_picture, personalProfilePaused]);

  useEffect(() => {
    setConnectFromRefreshments(Boolean(currentProfile?.settings_community_profile));
  }, [currentProfile?.settings_community_profile]);

  const bioTextareaRef = useRef<HTMLIonTextareaElement | null>(null);

  useEffect(() => {
    if (editingBio) {
      setTimeout(() => {
        bioTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 300);
    }
  }, [editingBio]);

  const updateCommunityProfile = async (payload: Record<string, any>) => {
    await apiClient.patch('/api/profiles/community_profile/', payload);
    await queryClient.invalidateQueries({ queryKey: ['community-profile'] });
  };

  const handleTogglePersonalPhoto = async (checked: boolean) => {
    if (personalProfilePaused || !hasPersonalPhoto) {
      setUsePersonalPhoto(false);
      return;
    }

    setUsePersonalPhoto(checked);
    await updateCommunityProfile({ use_personal_profile_picture: checked });
  };

  const handleToggleLocation = async (checked: boolean) => {
    setShowLocation(checked);
    await updateCommunityProfile({ show_location: checked });
  };

  const handleAgeTierChange = async (value: string) => {
    setShowAgeTier(value);
    await updateCommunityProfile({ show_age_tier: value });
  };

  const handleToggleConnectFromRefreshments = async (checked: boolean) => {
    setConnectFromRefreshments(checked);
    await updateCurrentUserProfile({ settings_community_profile: checked });
    queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
  };

  const handleSaveBio = async () => {
    await updateCommunityProfile({ community_bio: communityBio.replace(/[\r\n]+/g, ' ').trim() });
    setEditingBio(false);
  };

  const handleCancelBio = () => {
    setCommunityBio(communityProfile?.community_bio ?? '');
    setEditingBio(false);
  };

  const updatePicture = async () => {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
    });

    const photoblob = new Blob([new Uint8Array(decode(photo.base64String!))], {
      type: `image/${photo.format}`,
    });

    Resizer.imageFileResizer(
      photoblob,
      1500,
      1500,
      'JPEG',
      100,
      0,
      (uri) => {
        setImage(uri);
      },
      'base64',
      800,
      800
    );

    setPicDb('community_profile_pic');
    setImageName('community_profile');
    cropPresent();
  };

  const handleCropDismiss = async () => {
    cropDismiss();
    const result = await refetchCommunityProfile();
    if (result.data?.community_profile_pic) {
      setUsePersonalPhoto(false);
      await updateCommunityProfile({ use_personal_profile_picture: false });
    }
  };

  const [cropPresent, cropDismiss] = useIonModal(CroppedImageModal, {
    image: image,
    picDb: picDb,
    imageName: imageName,
    uploadHandler: uploadCommunityProfilePhoto,
    onDismiss: handleCropDismiss,
  });

  const [usernamePresent, usernameDismiss] = useIonModal(EditUsernameModal, {
    onDismiss: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
      usernameDismiss();
    },
  });

  const innerContent = (
    <IonRow>
      <IonCol size="12">
        <IonCard className="accordion-card community-profile-card" style={{boxShadow: "none"}}>
          <IonCardContent className="card-grid">
            <IonItem lines="none" className="no-bottom-line prof" style={{ justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <img
                  alt="Refreshments Profile"
                  src={displayPhoto}
                  onError={(e) => onImgError(e)}
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    objectFit: isFallbackPhoto ? 'contain' : 'cover',
                    padding: isFallbackPhoto ? '16px' : 0,
                    boxSizing: 'border-box',
                    background: 'var(--ion-color-white)',
                    filter: isFallbackPhoto ? 'grayscale(1)' : 'none',
                    border: connectFromRefreshments ? '2px solid var(--ion-color-primary)' : 'none',
                  }}
                />
              </div>
            </IonItem>
            <IonItem lines="none" className="community-profile-item community-username-item">
              <IonLabel>
                <p>Refreshments handle:</p>
                <h2>{displayUsername}</h2>
              </IonLabel>
              <IonButton size="small" color="primary" fill="outline" className="edit-button" onClick={() => usernamePresent()}>
                Edit
              </IonButton>
            </IonItem>
            
            <div className="field-header">
              <p>Use Personal Profile photo</p>
              <IonToggle
                slot="end"
                checked={personalPhotoToggleChecked}
                disabled={personalPhotoToggleDisabled}
                onIonChange={(e) => handleTogglePersonalPhoto(e.detail.checked)}
              />
            </div>
            {!hasPersonalPhoto && (
              <IonText color="medium" className="community-subtitle">
                Once you've uploaded a profile pic, you can choose to use that as your Refreshments Profile picture too.
              </IonText>
            )}
            {personalProfilePaused && (
              <IonText color="medium" className="community-subtitle">
                While your Personal Profile is paused, Refreshments uses your Refreshments Profile photo or the default avatar.
              </IonText>
            )}
            <IonButton expand="block" color="tertiary" onClick={updatePicture}>
              {photoButtonLabel}
            </IonButton>

            <IonItem className={`card-field community-bio-field ${editingBio ? 'editing' : ''}`} lines="none">
              <div className="editing-section">
                <div className="field-header">
                  <p>Refreshments bio</p>
                  {!editingBio && (
                    <div className="field-actions">
                      <IonButton
                        size="small"
                        fill="outline"
                        color="primary"
                        className={`edit-button ${communityBio ? '' : 'blank-edit'}`}
                        onClick={() => setEditingBio(true)}
                      >
                        Edit
                      </IonButton>
                    </div>
                  )}
                </div>

                {editingBio ? (
                  <IonTextarea
                    ref={bioTextareaRef}
                    value={communityBio}
                    autoGrow
                    rows={4}
                    maxlength={180}
                    counter
                    placeholder="Update your Refreshments bio"
                    onIonInput={(e) => setCommunityBio((e.detail.value ?? '').replace(/[\r\n]+/g, ' '))}
                  />
                ) : (
                  <h2>
                    {communityBio ? communityBio : <span className="community-bio-placeholder community-bio-empty">Add a short Refreshments bio.</span>}
                  </h2>
                )}

                {editingBio && (
                  <div className="field-actions editing-actions">
                    {!!communityBio && (
                      <IonButton className="clear-button" size="small" fill="clear" color="danger" onClick={() => setCommunityBio('')} type="button">
                        Clear
                      </IonButton>
                    )}
                    <IonButton className="cancel-button" size="small" fill="clear" color="medium" onClick={handleCancelBio} type="button">
                      Cancel
                    </IonButton>
                    <IonButton className="save-button" size="small" color="success" onClick={handleSaveBio}>
                      Save
                    </IonButton>
                  </div>
                )}
              </div>
            </IonItem>

            <div className="field-header">
              <p>Show location</p>
              <IonToggle
                slot="end"
                checked={showLocationChecked}
                disabled={!hasLocation}
                onIonChange={(e) => handleToggleLocation(e.detail.checked)}
              />
            </div>
            {!hasLocation && (
              <IonText color="medium" className="community-subtitle">
                Once you've added a location, you can choose to share that on your Refreshments Profile.
              </IonText>
            )}

            <IonItem lines="none" className="community-toggle-item community-profile-item">
              <IonLabel className="ion-text-wrap">
                <p>Connect from Refreshments</p>
                <p className="community-subtitle">Turn this on to let people discover your Personal Profile and send you Likes from the community side of the app, including the Refreshments Bar and Calendar.</p>
              </IonLabel>
              <IonToggle
                slot="end"
                checked={connectFromRefreshments}
                disabled={currentProfile?.paused_profile || currentProfile?.deactivated_profile}
                onIonChange={(e) => handleToggleConnectFromRefreshments(e.detail.checked)}
                onClick={(e) => e.stopPropagation()}
              />
            </IonItem>

            <IonItem lines="none" className="community-age-item">
              <IonLabel>
                <p>Show age</p>
              </IonLabel>
              <IonSelect
                slot="end"
                value={showAgeTier}
                interface="popover"
                onIonChange={(e) => handleAgeTierChange(e.detail.value)}
              >
                <IonSelectOption value="exact">{ageLabel}</IonSelectOption>
                {!isTeen && <IonSelectOption value="decade">{ageDecade}</IonSelectOption>}
                <IonSelectOption value="none">Don't show age</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem lines="none" style={{ '--padding-start': '0', '--inner-padding-end': '0' }}>
              <IonIcon slot="start" icon={informationCircleOutline} color="navy" style={{ marginInlineEnd: '8px', fontSize: '18px' }} />
              <IonLabel color="navy" className="ion-text-wrap" style={{ fontSize: '0.85rem' }}>
                Changes to your Refreshments Profile may take a few minutes to appear in Refreshments.
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>
      </IonCol>
    </IonRow>
  );

  if (!useAccordion) {
    return (
      <IonCardContent className="no-padding-cc accordion-body">
        {innerContent}
      </IonCardContent>
    );
  }

  return (
    <IonAccordionGroup className="profile-accordion-group">
      <IonAccordion value="communityProfile">
        <IonItem slot="header" lines="none" className="accordion-header">
          <IonLabel>
            <h2>Refreshments Profile</h2>
          </IonLabel>
        </IonItem>
        <IonCardContent slot="content" className="no-padding-cc accordion-body">
          {innerContent}
        </IonCardContent>
      </IonAccordion>
    </IonAccordionGroup>
  );
};

export default CommunityProfileSection;
