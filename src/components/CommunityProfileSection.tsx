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
import { onImgError, uploadCommunityProfilePhoto } from '../hooks/utilities';
import CroppedImageModal from './CroppedImageModal';

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

  const [image, setImage] = useState<any>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [picDb, setPicDb] = useState<string>('community_profile_pic');

  const personalPhoto = currentProfile?.pic1_main ?? null;
  const communityPhoto = communityProfile?.community_profile_pic ?? null;
  const previewPhoto = usePersonalPhoto ? personalPhoto : (communityPhoto || personalPhoto);
  const photoButtonLabel = communityPhoto ? 'Change community photo' : 'Upload community photo';
  const ageNumber = typeof currentProfile?.age === 'number' ? currentProfile.age : null;
  const ageDecade = ageNumber !== null ? `${Math.floor(ageNumber / 10) * 10}s` : 'Decade';
  const ageLabel = ageNumber !== null ? `${ageNumber}` : 'Exact age';

  useEffect(() => {
    if (!communityProfile) return;
    setCommunityBio(communityProfile.community_bio ?? '');
    setShowLocation(Boolean(communityProfile.show_location));
    setShowAgeTier(communityProfile.show_age_tier ?? 'exact');
    setUsePersonalPhoto(communityProfile.use_personal_profile_picture ?? true);
  }, [communityProfile]);

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
            <IonItem lines="none">
              <IonLabel>Use personal profile photo</IonLabel>
              <IonToggle
                slot="end"
                checked={usePersonalPhoto}
                onIonChange={(e) => handleTogglePersonalPhoto(e.detail.checked)}
              />
            </IonItem>
            {usePersonalPhoto && !personalPhoto && (
              <IonText color="medium">Add a personal profile photo to use it here.</IonText>
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
                  <IonItem lines="none">
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
              <p className="placeholder">
                {communityBio ? communityBio : 'Add a short community bio.'}
              </p>
            )}

            <div className="field-header">
              <p>Show location</p>
              <IonToggle
                slot="end"
                checked={showLocation}
                onIonChange={(e) => handleToggleLocation(e.detail.checked)}
              />
            </div>

            <div className="field-header">
              <p>Show age</p>
            </div>
            <IonItem lines="none">
              <IonSelect
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
