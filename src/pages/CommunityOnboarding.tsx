import React, { useEffect, useRef, useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonPage,
  IonRow,
  IonText,
  IonToggle,
  IonTextarea,
  IonSpinner,
  IonRadioGroup,
  IonRadio,
  useIonModal,
  useIonRouter,
  IonList,
} from '@ionic/react';
import { Pagination } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, CameraResultType } from '@capacitor/camera';
import Resizer from 'react-image-file-resizer';
import { decode } from 'base64-arraybuffer';

import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useGetCommunityProfile } from '../hooks/api/profiles/community-profile';
import { apiClient } from '../hooks/api/api-client';
import { updateCurrentUserProfile, updateUsername, uploadCommunityProfilePhoto, onImgError } from '../hooks/utilities';
import CroppedImageModal from '../components/CroppedImageModal';
import EditLocationModal from '../components/EditLocationModal';

import './OnboardingV2.css';

const USERNAME_CHANGE_WINDOW_DAYS = 60;

type AgeTier = 'exact' | 'decade' | 'none';

type CommunityProfile = {
  community_bio?: string;
  community_profile_pic?: string | null;
  show_location?: boolean;
  use_personal_profile_picture?: boolean;
  show_age_tier?: AgeTier;
};

type CommunityOnboardingProps = {
  onDismiss?: () => void;
};

const CommunityOnboarding: React.FC<CommunityOnboardingProps> = ({ onDismiss }) => {
  const router = useIonRouter();
  const queryClient = useQueryClient();
  const { data: currentProfile } = useGetCurrentProfile();
  const { data: communityProfile, refetch: refetchCommunityProfile } = useGetCommunityProfile();

  const swiperRef = useRef<any>(null);
  const [swiperReady, setSwiperReady] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameBusy, setUsernameBusy] = useState(false);

  const [communityBio, setCommunityBio] = useState('');
  const [showLocation, setShowLocation] = useState(false);
  const [showAgeTier, setShowAgeTier] = useState<AgeTier>('exact');
  const [usePersonalPhoto, setUsePersonalPhoto] = useState(false);

  const [image, setImage] = useState<any>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [picDb, setPicDb] = useState<string>('community_profile_pic');

  const [savingBio, setSavingBio] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [savingAge, setSavingAge] = useState(false);

  const hasPersonalProfile = Boolean(currentProfile?.created_profile);
  const totalSlides = 7 + (hasPersonalProfile ? 1 : 0);
  const ageNumber = typeof currentProfile?.age === 'number' ? currentProfile.age : null;
  const ageDecade = ageNumber !== null ? (ageNumber < 20 ? 'late teens' : `${Math.floor(ageNumber / 10) * 10}s`) : '-';
  const ageLabel = ageNumber !== null ? `${ageNumber}` : '-';
  const locationLabel = (currentProfile?.location ?? '').trim();
  const personalPhoto = currentProfile?.pic1_main ?? null;
  const communityPhoto = (communityProfile as CommunityProfile | undefined)?.community_profile_pic ?? null;

  const hasPersonalPhoto = Boolean(personalPhoto);
  const previewPhoto = usePersonalPhoto && personalPhoto
    ? personalPhoto
    : communityPhoto;

  useEffect(() => {
    if (!communityProfile) return;
    const profile = communityProfile as CommunityProfile;
    setCommunityBio(profile.community_bio ?? '');
    setShowLocation(Boolean(profile.show_location));
    setUsePersonalPhoto(
      hasPersonalPhoto
        ? (profile.use_personal_profile_picture ?? true)
        : false
    );
    setShowAgeTier((profile.show_age_tier as AgeTier) ?? 'exact');
  }, [communityProfile]);

  const canChangeUsername = () => {
    if (!currentProfile?.username_last_updated) return true;
    const nowDate = new Date();
    const lastChangedDate = new Date(currentProfile.username_last_updated);
    const milliseconds = Math.abs(nowDate.getTime() - lastChangedDate.getTime());
    const days = milliseconds / 86400000;
    return days >= USERNAME_CHANGE_WINDOW_DAYS;
  };

  const handleUsernameNext = async () => {
    if (usernameBusy) return;
    setUsernameError(null);

    if (currentProfile?.username && (!username || username === currentProfile.username)) {
      swiperRef.current?.slideNext();
      return;
    }

    if (!username) {
      setUsernameError('Please choose a username to continue.');
      return;
    }

    setUsernameBusy(true);
    const response = await updateUsername({ username });
    if (response?.status === 204) {
      await queryClient.invalidateQueries({ queryKey: ['current'] });
      await queryClient.invalidateQueries({ queryKey: ['global-current'] });
      swiperRef.current?.slideNext();
    } else {
      setUsernameError('That username is already taken. Try another.');
    }
    setUsernameBusy(false);
  };

  const updateCommunityProfile = async (payload: Partial<CommunityProfile>) => {
    await apiClient.patch('/api/profiles/community_profile/', payload);
    await queryClient.invalidateQueries({ queryKey: ['community-profile'] });
  };

  const handleToggleConnect = async (checked: boolean) => {
    await updateCurrentUserProfile({ settings_community_profile: checked });
    await queryClient.invalidateQueries({ queryKey: ['current'] });
    await queryClient.invalidateQueries({ queryKey: ['global-current'] });
  };

  const handleFinishLater = async () => {
    await updateCurrentUserProfile({ paused_profile: true, settings_community_profile: false });
    await queryClient.invalidateQueries({ queryKey: ['current'] });
    await queryClient.invalidateQueries({ queryKey: ['global-current'] });
    if (onDismiss) {
      onDismiss();
      return;
    }
    router.push('/community', 'root', 'replace');
  };

  const handleTogglePersonalPhoto = async (checked: boolean) => {
    if (!hasPersonalPhoto) {
      setUsePersonalPhoto(false);
      return;
    }
    setUsePersonalPhoto(checked);
    await updateCommunityProfile({ use_personal_profile_picture: checked });
  };

  const handleBioNext = async () => {
    setSavingBio(true);
    await updateCommunityProfile({ community_bio: communityBio.trim() });
    setSavingBio(false);
    swiperRef.current?.slideNext();
  };

  const handleLocationNext = async () => {
    setSavingLocation(true);
    await updateCommunityProfile({ show_location: showLocation });
    setSavingLocation(false);
    swiperRef.current?.slideNext();
  };

  const handleAgeNext = async () => {
    setSavingAge(true);
    await updateCommunityProfile({ show_age_tier: showAgeTier });
    setSavingAge(false);
    swiperRef.current?.slideNext();
  };

  const handleFinish = async () => {
    if (!currentProfile?.username) {
      setUsernameError('Please choose a username to finish.');
      swiperRef.current?.slideTo(0, 0);
      return;
    }

    await updateCommunityProfile({
      community_bio: communityBio.trim(),
      show_location: showLocation,
      show_age_tier: showAgeTier,
      use_personal_profile_picture: hasPersonalPhoto ? usePersonalPhoto : false,
    });

    router.push('/community', 'root', 'replace');
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
    setImageName('community_profile.png');
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
  const [presentLocationModal, dismissLocationModal] = useIonModal(EditLocationModal, {
    onDismiss: () => dismissLocationModal(),
  });

  return (
    <IonPage>
      <IonContent className="onboarding-v2__content">
        <Swiper
          modules={[Pagination]}
          pagination={{ clickable: false }}
          className="onboarding-v2__swiper"
          centeredSlides
          allowTouchMove={false}
          onSlideChange={(swiperInstance) => setActiveSlideIndex(swiperInstance.activeIndex)}
          onSwiper={(swiperInstance) => {
            swiperRef.current = swiperInstance;
            setSwiperReady(true);
            setActiveSlideIndex(swiperInstance.activeIndex);
          }}
        >
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
                <IonCardContent className="onboarding-v2__card-body">
                  <IonCardTitle>Welcome to your community profile</IonCardTitle>
                  <p>
                    This creates your community identity—your username for posts and comments, plus a photo
                    and any extra details you want to share. Anyone can see this.
                  </p>
                  <p>
                    {hasPersonalProfile
                      ? 'Since you already have a personal profile, you can also connect 1:1 by turning on Connect from Refreshments.'
                      : 'Later, if you create a personal profile, you can connect 1:1 by turning on Connect from Refreshments.'}
                  </p>
                </IonCardContent>
                <div className="onboarding-v2__card-footer">
                  <IonRow className="onboarding-v2__nav">
                    <IonButton
                      className="onboarding-v2__primary-action"
                      onClick={() => swiperRef.current?.slideNext()}
                    >
                      Next
                    </IonButton>
                  </IonRow>
                </div>
              </IonCard>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
                <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
                  <IonCardTitle>Pick your community username</IonCardTitle>
                  <p>
                    Your username appears next to your posts and comments. You can only change it every {USERNAME_CHANGE_WINDOW_DAYS} days.
                  </p>
                  <div className="onboarding-v2__input-wrapper">
                    <IonItem lines="none" className="onboarding-v2__input onboarding-v2__input--card">
                      <IonInput
                        value={username}
                        placeholder={currentProfile?.username ?? 'yourname'}
                        onIonInput={(e) => setUsername(e.detail.value!)}
                        maxlength={30}
                        counter
                        disabled={!canChangeUsername()}
                      />
                    </IonItem>
                    {usernameError && <IonNote color="danger" className="onboarding-v2__error">{usernameError}</IonNote>}
                    {!canChangeUsername() && (
                      <IonText color="medium">
                        You can’t change your username yet.
                      </IonText>
                    )}
                  </div>
                </IonCardContent>
                <div className="onboarding-v2__card-footer">
                  <IonRow className="onboarding-v2__nav">
                    <IonButton
                      className="onboarding-v2__primary-action"
                      disabled={!swiperReady || usernameBusy}
                      onClick={handleUsernameNext}
                    >
                      <span className={`onboarding-v2__button-label ${usernameBusy ? 'loading' : ''}`}>
                        Next
                      </span>
                      {usernameBusy && <IonSpinner name="dots" className="onboarding-v2__button-spinner" />}
                    </IonButton>
                  </IonRow>
                </div>
              </IonCard>
            </div>
          </SwiperSlide>

          {hasPersonalProfile && (
            <SwiperSlide>
              <div className="onboarding-v2__slide">
                <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
                  <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
                    <IonCardTitle>Connect from Refreshments</IonCardTitle>
                    <p>
                      Turn this on to let people discover your personal profile from your community posts and comments.
                    </p>
                    <IonItem lines="none">
                      <IonLabel>Connect from Refreshments</IonLabel>
                      <IonToggle
                        slot="end"
                        checked={Boolean(currentProfile?.settings_community_profile)}
                        disabled={currentProfile?.paused_profile || currentProfile?.deactivated_profile}
                        onIonChange={(e) => handleToggleConnect(e.detail.checked)}
                      />
                    </IonItem>
                  </IonCardContent>
                  <div className="onboarding-v2__card-footer">
                    <IonRow className="onboarding-v2__nav">
                      <IonButton fill="outline" onClick={() => swiperRef.current?.slidePrev()}>
                        Back
                      </IonButton>
                      <IonButton className="onboarding-v2__primary-action" onClick={() => swiperRef.current?.slideNext()}>
                        Next
                      </IonButton>
                    </IonRow>
                  </div>
                </IonCard>
              </div>
            </SwiperSlide>
          )}

          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <IonCard className="onboarding-v2__card">
                <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
                  <IonCardTitle>Choose your community photo</IonCardTitle>
                  <p>
                    {hasPersonalPhoto
                      ? 'Use your personal profile photo or upload a community-only photo.'
                      : 'Upload a community-only photo to represent you in the community.'}
                  </p>
                  {hasPersonalPhoto && (
                    <IonItem lines="none">
                      <IonLabel>Use personal profile photo</IonLabel>
                      <IonToggle
                        slot="end"
                        checked={usePersonalPhoto}
                        onIonChange={(e) => handleTogglePersonalPhoto(e.detail.checked)}
                      />
                    </IonItem>
                  )}
                  <IonList lines="none">
                    <IonItem lines="none">
                      {previewPhoto ? (
                        <img
                          alt="Community profile"
                          src={previewPhoto}
                          onError={(e) => onImgError(e)}
                          style={{ width: '120px', height: '120px', borderRadius: '16px', objectFit: 'cover' }}
                        />
                      ) : (
                        <img
                          alt="Community profile placeholder"
                          src={"../static/img/null.png"}
                          style={{ width: '120px', height: '120px', borderRadius: '16px', objectFit: 'cover' }}
                        />
                      )}
                    </IonItem>
                  </IonList>
                  {usePersonalPhoto && !personalPhoto && (
                    <IonText color="medium">
                      Add a personal profile photo first to use it here.
                    </IonText>
                  )}
                  <IonButton expand="block" color="tertiary" onClick={updatePicture}>
                    Upload a community photo
                  </IonButton>
                  {communityPhoto && !usePersonalPhoto && (
                    <IonText color="medium">Your current community photo will stay unless you upload a new one.</IonText>
                  )}
                </IonCardContent>
                <div className="onboarding-v2__card-footer">
                  <IonRow className="onboarding-v2__nav">
                    <IonButton fill="outline" onClick={() => swiperRef.current?.slidePrev()}>
                      Back
                    </IonButton>
                    <IonButton className="onboarding-v2__primary-action" onClick={() => swiperRef.current?.slideNext()} disabled>
                      Next
                    </IonButton>
                  </IonRow>
                  <IonRow className="onboarding-v2__nav">
                    <IonButton fill="clear" size="small" onClick={() => swiperRef.current?.slideNext()}>
                      Skip
                    </IonButton>
                  </IonRow>
                </div>
              </IonCard>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
                <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
                  <IonCardTitle>Write a community bio</IonCardTitle>
                  <p>Keep it short—this is what people will see when they click your name on comments and posts.</p>
                  <IonItem lines="none" className="onboarding-v2__input onboarding-v2__input--card">
                    <IonTextarea
                      value={communityBio}
                      autoGrow
                      maxlength={180}
                      counter
                      onIonInput={(e) => setCommunityBio(e.detail.value ?? '')}
                    />
                  </IonItem>
                </IonCardContent>
                <div className="onboarding-v2__card-footer">
                  <IonRow className="onboarding-v2__nav">
                    <IonButton fill="outline" onClick={() => swiperRef.current?.slidePrev()}>
                      Back
                    </IonButton>
                    <IonButton className="onboarding-v2__primary-action" onClick={handleBioNext} disabled>
                      <span className={`onboarding-v2__button-label ${savingBio ? 'loading' : ''}`}>
                        Next
                      </span>
                      {savingBio && <IonSpinner name="dots" className="onboarding-v2__button-spinner" />}
                    </IonButton>
                  </IonRow>
                  <IonRow className="onboarding-v2__nav">
                    <IonButton fill="clear" size="small" onClick={() => swiperRef.current?.slideNext()}>
                      Skip
                    </IonButton>
                  </IonRow>
                </div>
              </IonCard>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
                <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
                  <IonCardTitle>Show your location?</IonCardTitle>
                  <p>Share your general location on your community profile.</p>
                  <IonText color="medium">
                    <p style={{ marginTop: 0 }}>
                      Location shown on your profile: {locationLabel || '-'}
                    </p>
                  </IonText>
                  <IonButton fill="outline" size="small" onClick={() => presentLocationModal()}>
                    {locationLabel ? 'Edit location' : 'Add location'}
                  </IonButton>
                  <IonItem lines="none">
                    <IonLabel>Show location</IonLabel>
                    <IonToggle
                      slot="end"
                      checked={showLocation}
                      onIonChange={(e) => setShowLocation(e.detail.checked)}
                    />
                  </IonItem>
                </IonCardContent>
                <div className="onboarding-v2__card-footer">
                  <IonRow className="onboarding-v2__nav">
                    <IonButton fill="outline" onClick={() => swiperRef.current?.slidePrev()}>
                      Back
                    </IonButton>
                    <IonButton className="onboarding-v2__primary-action" onClick={handleLocationNext} disabled={savingLocation}>
                      <span className={`onboarding-v2__button-label ${savingLocation ? 'loading' : ''}`}>
                        Next
                      </span>
                      {savingLocation && <IonSpinner name="dots" className="onboarding-v2__button-spinner" />}
                    </IonButton>
                  </IonRow>
                </div>
              </IonCard>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
                <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
                  <IonCardTitle>Show your age?</IonCardTitle>
                  <p>Choose how your age appears on your community profile.</p>
                  <IonText color="medium">
                    <p style={{ marginTop: 0 }}>
                      Age shown on your profile:{' '}
                      {showAgeTier === 'none' ? 'Don\u2019t show age' : showAgeTier === 'decade' ? ageDecade : ageLabel}
                    </p>
                  </IonText>
                  <IonRadioGroup value={showAgeTier} onIonChange={(e) => setShowAgeTier(e.detail.value)}>
                    <IonItem lines="none">
                      <IonLabel>Show exact age</IonLabel>
                      <IonRadio slot="start" value="exact" />
                    </IonItem>
                    <IonItem lines="none">
                      <IonLabel>Show decade only</IonLabel>
                      <IonRadio slot="start" value="decade" />
                    </IonItem>
                    <IonItem lines="none">
                      <IonLabel>Hide age</IonLabel>
                      <IonRadio slot="start" value="none" />
                    </IonItem>
                  </IonRadioGroup>
                </IonCardContent>
                <div className="onboarding-v2__card-footer">
                  <IonRow className="onboarding-v2__nav">
                    <IonButton fill="outline" onClick={() => swiperRef.current?.slidePrev()}>
                      Back
                    </IonButton>
                    <IonButton className="onboarding-v2__primary-action" onClick={handleAgeNext} disabled={savingAge}>
                      <span className={`onboarding-v2__button-label ${savingAge ? 'loading' : ''}`}>
                        Next
                      </span>
                      {savingAge && <IonSpinner name="dots" className="onboarding-v2__button-spinner" />}
                    </IonButton>
                  </IonRow>
                </div>
              </IonCard>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="onboarding-v2__slide onboarding-v2__ready">
              <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
                <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
                  <IonCardTitle>Community profile ready!</IonCardTitle>
                  <p>You can update any of these choices later in Settings.</p>
                  <IonButton
                    expand="block"
                    className="onboarding-v2__primary-action"
                    onClick={handleFinish}
                  >
                    Finish
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </div>
          </SwiperSlide>
        </Swiper>
        {activeSlideIndex < totalSlides - 1 && (
          <IonButton
            size="small"
            fill="clear"
            style={{
              position: 'fixed',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              zIndex: 5,
            }}
            onClick={handleFinishLater}
          >
            Finish later
          </IonButton>
        )}
      </IonContent>
    </IonPage>
  );
};

export default CommunityOnboarding;
