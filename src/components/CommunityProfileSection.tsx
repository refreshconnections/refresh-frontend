import {
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonCard,
  IonCardContent,
  IonCol,
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
import React, { useEffect, useState } from 'react';
import { Camera, CameraResultType } from '@capacitor/camera';
import Resizer from 'react-image-file-resizer';
import { decode } from 'base64-arraybuffer';
import { useQueryClient } from '@tanstack/react-query';

import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useGetCommunityProfile } from '../hooks/api/profiles/community-profile';
import { apiClient } from '../hooks/api/api-client';
import { onImgError, updateCurrentUserProfile, uploadCommunityProfilePhoto } from '../hooks/utilities';
import CroppedImageModal from './CroppedImageModal';
import EditUsernameModal from './EditUsernameModal';
import { userQueryKeys } from '../hooks/api/profiles/user-query-keys';

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

  const personalPhoto = currentProfile?.pic1_main ?? null;
  const communityPhoto = communityProfile?.community_profile_pic ?? null;
  const previewPhoto = usePersonalPhoto ? personalPhoto : (communityPhoto || personalPhoto);
  const photoButtonLabel = communityPhoto ? 'Change community photo' : 'Upload community photo';
  const ageNumber = typeof currentProfile?.age === 'number' ? currentProfile.age : null;
  const ageDecade = ageNumber !== null ? (ageNumber < 20 ? 'late teens' : `${Math.floor(ageNumber / 10) * 10}s`) : 'Decade';
  const ageLabel = ageNumber !== null ? `${ageNumber}` : 'Exact age';
  const displayUsername = currentProfile?.username ?? communityProfile?.username ?? '';
  const hasPersonalPhoto = Boolean(personalPhoto);
  const hasLocation = Boolean(currentProfile?.location);
  const showLocationChecked = hasLocation ? showLocation : false;
  const forcePersonalPhoto = Boolean(connectFromRefreshments && !communityPhoto);
  const personalPhotoToggleChecked = hasPersonalPhoto ? (forcePersonalPhoto ? true : usePersonalPhoto) : false;
  const personalPhotoToggleDisabled = !hasPersonalPhoto || forcePersonalPhoto;

  useEffect(() => {
    if (!communityProfile) return;
    setCommunityBio(communityProfile.community_bio ?? '');
    setShowLocation(Boolean(communityProfile.show_location));
    setShowAgeTier(communityProfile.show_age_tier ?? 'exact');
    setUsePersonalPhoto(communityProfile.use_personal_profile_picture ?? true);
  }, [communityProfile]);

  useEffect(() => {
    setConnectFromRefreshments(Boolean(currentProfile?.settings_community_profile));
  }, [currentProfile?.settings_community_profile]);

  const updateCommunityProfile = async (payload: Record<string, any>) => {
    await apiClient.patch('/api/profiles/community_profile/', payload);
    await queryClient.invalidateQueries({ queryKey: ['community-profile'] });
  };

  const handleTogglePersonalPhoto = async (checked: boolean) => {
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
    await updateCommunityProfile({ community_bio: communityBio.trim() });
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
        <IonCard className="accordion-card" style={{boxShadow: "none"}}>
          <IonCardContent className="card-grid">
            <IonItem lines="none" className="no-bottom-line prof" style={{ justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                {previewPhoto ? (
                  <img alt="Community profile" src={previewPhoto} onError={onImgError} />
                ) : (
                  <img alt="Community profile placeholder" src={"../static/img/null.png"} />
                )}
              </div>
            </IonItem>
            <IonItem lines="none" className="community-profile-item">
              <IonLabel>
                <p>Refreshments username:</p>
                <h2>{displayUsername}</h2>
              </IonLabel>
              <IonButton size="small" color="primary" fill="outline" className="edit-button" onClick={() => usernamePresent()}>
                Edit
              </IonButton>
            </IonItem>
            
            <div className="field-header">
              <p>Use personal profile photo</p>
              <IonToggle
                slot="end"
                checked={personalPhotoToggleChecked}
                disabled={personalPhotoToggleDisabled}
                onIonChange={(e) => handleTogglePersonalPhoto(e.detail.checked)}
              />
            </div>
            {!hasPersonalPhoto && (
              <IonText color="medium" className="community-subtitle">
                Once you've uploaded a profile pic, you can choose to use that as your community profile picture too.
              </IonText>
            )}
            <IonButton expand="block" color="tertiary" onClick={updatePicture}>
              {photoButtonLabel}
            </IonButton>

            <div className="field-header">
              <p>Community bio</p>
              <IonButton
                size="small"
                fill="outline"
                color="primary"
                onClick={() => setEditingBio((prev) => !prev)}
              >
                {editingBio ? 'Cancel' : 'Edit'}
              </IonButton>
            </div>
            {editingBio ? (
              <div className="choice-editor">
                <IonList lines="none">
                  <IonItem lines="none" className="community-bio-item">
                    <IonTextarea
                      value={communityBio}
                      autoGrow
                      maxlength={180}
                      counter
                      onIonInput={(e) => setCommunityBio(e.detail.value ?? '')}
                    />
                  </IonItem>
                  <IonButton expand="block" onClick={handleSaveBio}>Save bio</IonButton>
                </IonList>
              </div>
            ) : (
              <p className={`placeholder community-bio-placeholder ${communityBio ? 'community-bio-text' : 'community-bio-empty'}`}>
                {communityBio ? communityBio : 'Add a short community bio.'}
              </p>
            )}

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
                Once you've added a location, you can choose to share that on your community profile.
              </IonText>
            )}

            <div className="field-header">
              <p>Connect from Refreshments</p>
              <IonToggle
                slot="end"
                checked={connectFromRefreshments}
                disabled={currentProfile?.paused_profile || currentProfile?.deactivated_profile}
                onIonChange={(e) => handleToggleConnectFromRefreshments(e.detail.checked)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <IonText color="medium" className="community-subtitle">
              Turn this on to let people discover your personal profile from your community posts and comments.
            </IonText>

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
                <IonSelectOption value="decade">{ageDecade}</IonSelectOption>
                <IonSelectOption value="none">Don't show age</IonSelectOption>
              </IonSelect>
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
    <IonAccordionGroup>
      <IonAccordion value="communityProfile">
        <IonItem slot="header" lines="none" className="accordion-header">
          <IonLabel>
            <h2>Community Profile</h2>
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
