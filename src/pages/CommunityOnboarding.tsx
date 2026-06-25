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
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useQueryClient } from '@tanstack/react-query';
import { useCompleteOnboarding } from '../hooks/api/account/onboarding';
import { Camera, CameraResultType } from '@capacitor/camera';
import Resizer from 'react-image-file-resizer';
import { decode } from 'base64-arraybuffer';

import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useGetCommunityProfile } from '../hooks/api/profiles/community-profile';
import { apiClient } from '../hooks/api/api-client';
import { getPrimaryOrderedPhoto, updateCurrentUserProfile, updateUsername, uploadCommunityProfilePhoto, onImgError } from '../hooks/utilities';
import { COMMUNITY_PROFILE_FIELD_LIMITS, PROFILE_FIELD_LIMITS } from '../constants/fieldLimits';
import CroppedImageModal from '../components/CroppedImageModal';
import OnboardingCardLocationCoords from '../components/OnboardingCardLocationCoords';
import OnboardingCardConnectFromRefreshments from '../components/OnboardingCardConnectFromRefreshments';

import './OnboardingV2.css';
import { ONBOARDING_COPY } from '../constants/onboarding';
import { Preferences } from '@capacitor/preferences';
import { useOnboardingKeyboardState } from '../hooks/useOnboardingKeyboardState';

const USERNAME_CHANGE_WINDOW_DAYS = 60;
const COMMUNITY_ONBOARDING_IN_PROGRESS_KEY = 'community_onboarding_in_progress';
const COMMUNITY_ONBOARDING_SLIDE_KEY = 'community_onboarding_slide';
const PERSONAL_PROFILE_ONBOARDING_IN_PROGRESS_KEY = 'personal_profile_onboarding_in_progress';

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
  const copy = ONBOARDING_COPY.communityOnboarding;
  const { keyboardHeight, keyboardOpen } = useOnboardingKeyboardState();
  const router = useIonRouter();
  const queryClient = useQueryClient();
  const completeOnboarding = useCompleteOnboarding({
    onSuccess: async () => {
      await Preferences.set({ key: 'ONBOARDED', value: 'true' });
    },
  });
  const { data: currentProfile } = useGetCurrentProfile();
  const { data: communityProfile, refetch: refetchCommunityProfile } = useGetCommunityProfile();

  const swiperRef = useRef<any>(null);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const [swiperReady, setSwiperReady] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [usernameSavedThisSession, setUsernameSavedThisSession] = useState(false);

  const [communityBio, setCommunityBio] = useState('');
  const [showLocation, setShowLocation] = useState(false);
  const [communityLocationLabel, setCommunityLocationLabel] = useState('');
  const [showAgeTier, setShowAgeTier] = useState<AgeTier>('exact');
  const [usePersonalPhoto, setUsePersonalPhoto] = useState(false);

  const [image, setImage] = useState<any>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [picDb, setPicDb] = useState<string>('community_profile_pic');

  const [savingBio, setSavingBio] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [savingAge, setSavingAge] = useState(false);
  const locationLabelCleared = useRef(false);
  const originalLocationLabelRef = useRef('');
  const [hadLocationLabelBeforeCoords, setHadLocationLabelBeforeCoords] = useState(false);

  const hasPersonalProfile = Boolean(currentProfile?.created_profile);

  // Read synchronously from cache on first render — stable for the session.
  const [hasSharedLocationCoords] = useState(
    () => Boolean(currentProfile?.location_point_lat && currentProfile?.location_point_long)
  );

  // Tracks coords saved/cleared this session for UI text decisions (separate from slide presence).
  const [coordsSavedThisSession, setCoordsavedThisSession] = useState(false);
  const hasAnyCoords = hasSharedLocationCoords || coordsSavedThisSession;
  const shouldShowCommunityLocationInput = !hasAnyCoords || showLocation || hadLocationLabelBeforeCoords;
  const totalSlides = 7 + (hasPersonalProfile ? 1 : 0) + 1; // coords slide always rendered
  const ageNumber = typeof currentProfile?.age === 'number' ? currentProfile.age : null;
  const ageDecade = ageNumber !== null ? (ageNumber < 20 ? 'late teens' : `${Math.floor(ageNumber / 10) * 10}s`) : '-';
  const ageLabel = ageNumber !== null ? `${ageNumber}` : '-';
  const personalPhoto = getPrimaryOrderedPhoto(currentProfile);
  const communityPhoto = (communityProfile as CommunityProfile | undefined)?.community_profile_pic ?? null;

  const hasPersonalPhoto = Boolean(personalPhoto);
  const previewPhoto = usePersonalPhoto && personalPhoto
    ? personalPhoto
    : communityPhoto;
  const canContinueFromPhoto = Boolean(previewPhoto);

  const slideNext = () => {
    const swiper = swiperRef.current?.swiper ?? swiperRef.current;
    if (swiper && !swiper.destroyed) {
      swiper.slideNext();
    }
  };

  const slidePrev = () => {
    const swiper = swiperRef.current?.swiper ?? swiperRef.current;
    if (swiper && !swiper.destroyed) {
      swiper.slidePrev();
    }
  };

  const slideTo = (index: number, speed?: number) => {
    const swiper = swiperRef.current?.swiper ?? swiperRef.current;
    if (swiper && !swiper.destroyed) {
      swiper.slideTo(index, speed);
    }
  };

  const clearResumeState = async () => {
    await Preferences.remove({ key: COMMUNITY_ONBOARDING_IN_PROGRESS_KEY });
    await Preferences.remove({ key: COMMUNITY_ONBOARDING_SLIDE_KEY });
  };

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

  useEffect(() => {
    if (onDismiss) return;
    Preferences.set({ key: COMMUNITY_ONBOARDING_IN_PROGRESS_KEY, value: 'true' });
  }, [onDismiss]);

  useEffect(() => {
    if (!swiperReady || onDismiss) return;

    const restoreSlide = async () => {
      const stored = await Preferences.get({ key: COMMUNITY_ONBOARDING_SLIDE_KEY });
      const storedIndex = stored?.value ? Number(stored.value) : 0;
      if (Number.isFinite(storedIndex) && storedIndex > 0 && storedIndex < totalSlides) {
        slideTo(storedIndex, 0);
      }
    };

    restoreSlide();
  }, [onDismiss, swiperReady, totalSlides]);

  useEffect(() => {
    if (currentProfile === undefined) return;
    const newLabel = (currentProfile?.location ?? currentProfile?.coordinates_near ?? '').trim();
    const savedLocationLabel = (currentProfile?.location ?? '').trim();

    if (!coordsSavedThisSession) {
      originalLocationLabelRef.current = savedLocationLabel;
      setHadLocationLabelBeforeCoords(Boolean(savedLocationLabel));
    }

    setCommunityLocationLabel(prev => {
      if (locationLabelCleared.current) return '';
      if (coordsSavedThisSession && !hadLocationLabelBeforeCoords) return prev;
      if (coordsSavedThisSession && hadLocationLabelBeforeCoords) {
        return originalLocationLabelRef.current || prev;
      }
      return newLabel || prev;
    });
  }, [
    currentProfile?.location,
    currentProfile?.coordinates_near,
    currentProfile?.location_point_lat,
    currentProfile?.location_point_long,
    coordsSavedThisSession,
    hadLocationLabelBeforeCoords,
  ]);

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
      slideNext();
      return;
    }

    if (!username) {
      setUsernameError(copy.username.requiredToContinue);
      return;
    }

    setUsernameBusy(true);
    const response = await updateUsername({ username });
    if (response?.status === 204) {
      setUsernameSavedThisSession(true);
      await queryClient.invalidateQueries({ queryKey: ['current'] });
      await queryClient.invalidateQueries({ queryKey: ['global-current'] });
      slideNext();
    } else {
      setUsernameError(copy.username.taken);
    }
    setUsernameBusy(false);
  };

  const updateCommunityProfile = async (payload: Partial<CommunityProfile>) => {
    await apiClient.patch('/api/profiles/community_profile/', payload);
    await queryClient.invalidateQueries({ queryKey: ['community-profile'] });
  };

  const handleFinishLater = async () => {
    if (currentProfile?.onboarded !== true) {
      await completeOnboarding.mutateAsync();
    }
    const personalProfileComplete = Boolean(getPrimaryOrderedPhoto(currentProfile) && currentProfile?.bio);
    await updateCurrentUserProfile({
      ...(personalProfileComplete ? {} : { paused_profile: true }),
      settings_community_profile: false,
    });
    await queryClient.invalidateQueries({ queryKey: ['current'] });
    await queryClient.invalidateQueries({ queryKey: ['global-current'] });
    await clearResumeState();
    if (onDismiss) {
      onDismiss();
      return;
    }
    router.push('/community', 'root', 'replace');
  };

  const finishLaterButton = !keyboardOpen ? (
    <div className="onboarding-v2__finish-later-row">
      <IonButton
        size="small"
        fill="clear"
        expand="block"
        className="onboarding-v2__finish-later"
        onClick={handleFinishLater}
      >
        {ONBOARDING_COPY.common.finishLater}
      </IonButton>
    </div>
  ) : null;

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
    slideNext();
  };

  const handleLocationNext = async () => {
    const trimmedLocationLabel = communityLocationLabel.trim();
    const shouldShowLocation = hasAnyCoords ? showLocation : Boolean(trimmedLocationLabel);

    if (shouldShowLocation && !trimmedLocationLabel) {
      return;
    }

    setSavingLocation(true);
    const currentLocation = (currentProfile?.location ?? '').trim();
    if (trimmedLocationLabel && trimmedLocationLabel !== currentLocation) {
      const updatedProfile = await updateCurrentUserProfile({ location: trimmedLocationLabel });
      queryClient.setQueryData(['current'], (oldProfile: any) => ({
        ...(oldProfile ?? currentProfile ?? {}),
        ...(updatedProfile ?? {}),
        location: trimmedLocationLabel,
      }));
      queryClient.setQueryData(['global-current'], (oldProfile: any) => ({
        ...(oldProfile ?? currentProfile ?? {}),
        ...(updatedProfile ?? {}),
        location: trimmedLocationLabel,
      }));
      await queryClient.invalidateQueries({ queryKey: ['current'] });
      await queryClient.invalidateQueries({ queryKey: ['global-current'] });
    }
    setShowLocation(shouldShowLocation);
    await updateCommunityProfile({ show_location: shouldShowLocation });
    setSavingLocation(false);
    slideNext();
  };

  const handleLocationSkip = async () => {
    setSavingLocation(true);
    setShowLocation(false);
    await updateCommunityProfile({ show_location: false });
    setSavingLocation(false);
    slideNext();
  };

  const handleAgeNext = async () => {
    setSavingAge(true);
    await updateCommunityProfile({ show_age_tier: showAgeTier });
    setSavingAge(false);
    slideNext();
  };

  const handleFinish = async () => {
    if (!(currentProfile?.username || usernameSavedThisSession)) {
      setUsernameError(copy.username.requiredToFinish);
      slideTo(0, 0);
      return;
    }

    await updateCommunityProfile({
      community_bio: communityBio.trim(),
      show_location: showLocation,
      show_age_tier: showAgeTier,
      use_personal_profile_picture: hasPersonalPhoto ? usePersonalPhoto : false,
    });

    await clearResumeState();
    const params = new URLSearchParams(window.location.search);
    if (onDismiss && params.get('next') !== 'create-post') {
      onDismiss();
      return;
    }
    router.push(
      params.get('next') === 'create-post' ? '/community?createPost=1' : '/community',
      'root',
      'replace'
    );
  };

  const handleCreatePersonalProfile = async () => {
    await clearResumeState();
    await Preferences.set({ key: PERSONAL_PROFILE_ONBOARDING_IN_PROGRESS_KEY, value: 'true' });
    router.push('/personal-profile-onboarding', 'root', 'replace');
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
  return (
    <IonPage>
      <IonContent
        ref={contentRef}
        className={`onboarding-v2__content${keyboardOpen ? ' onboarding-v2__content--keyboard-open' : ''}`}
        style={{ '--onboarding-keyboard-offset': `${keyboardHeight}px` } as React.CSSProperties}
      >
        <Swiper
          className="onboarding-v2__swiper"
          centeredSlides
          allowTouchMove={false}
          onSlideChange={async (swiperInstance) => {
            contentRef.current?.scrollToTop(0);
            setActiveSlideIndex(swiperInstance.activeIndex);
            if (!onDismiss) {
              await Preferences.set({ key: COMMUNITY_ONBOARDING_IN_PROGRESS_KEY, value: 'true' });
              await Preferences.set({ key: COMMUNITY_ONBOARDING_SLIDE_KEY, value: String(swiperInstance.activeIndex) });
            }
          }}
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
                  <IonCardTitle>{copy.welcome.title}</IonCardTitle>
                  <p>{copy.welcome.withPersonalProfile}</p>
                  <p>
                    {hasPersonalProfile
                      ? copy.welcome.withPersonalProfileSecondary
                      : copy.welcome.withoutPersonalProfileSecondary}
                  </p>
                </IonCardContent>
                <div className="onboarding-v2__card-footer">
                  <IonRow className="onboarding-v2__nav">
                    <IonButton
                      className="onboarding-v2__primary-action"
                      onClick={slideNext}
                    >
                      {ONBOARDING_COPY.common.next}
                    </IonButton>
                  </IonRow>
                </div>
              </IonCard>
              {finishLaterButton}
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
                <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
                  <IonCardTitle>{copy.username.title}</IonCardTitle>
                  <p>
                    {copy.username.body.replace('{days}', String(USERNAME_CHANGE_WINDOW_DAYS))}
                  </p>
                  <div className="onboarding-v2__input-wrapper">
                    <IonItem lines="none" className="onboarding-v2__input onboarding-v2__input--card">
                      <IonInput
                        value={username}
                        placeholder={currentProfile?.username ?? copy.username.placeholderFallback}
                        maxlength={PROFILE_FIELD_LIMITS.username}
                        counter
                        onIonInput={(e) => setUsername((e.detail.value ?? '').slice(0, PROFILE_FIELD_LIMITS.username))}
                        disabled={!canChangeUsername()}
                      />
                    </IonItem>
                    {usernameError && <IonNote color="danger" className="onboarding-v2__error">{usernameError}</IonNote>}
                    {!canChangeUsername() && (
                      <IonText color="medium">
                        {copy.username.lockedNote}
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
                        {ONBOARDING_COPY.common.next}
                      </span>
                      {usernameBusy && <IonSpinner name="dots" className="onboarding-v2__button-spinner" />}
                    </IonButton>
                  </IonRow>
                </div>
              </IonCard>
              {finishLaterButton}
            </div>
          </SwiperSlide>

          {hasPersonalProfile && (
            <SwiperSlide>
              <OnboardingCardConnectFromRefreshments footer={finishLaterButton} />
            </SwiperSlide>
          )}

          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <IonCard className="onboarding-v2__card">
                <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
                  <IonCardTitle>{copy.photo.title}</IonCardTitle>
                  <p>
                    {hasPersonalPhoto
                      ? copy.photo.withPersonalPhoto
                      : copy.photo.withoutPersonalPhoto}
                  </p>
                  {hasPersonalPhoto && (
                    <IonItem lines="none" className="onboarding-v2__photo-toggle">
                      <IonLabel>{copy.photo.toggleLabel}</IonLabel>
                      <IonToggle
                        slot="end"
                        checked={usePersonalPhoto}
                        onIonChange={(e) => handleTogglePersonalPhoto(e.detail.checked)}
                      />
                    </IonItem>
                  )}
                  <IonList lines="none" className="onboarding-v2__photo-preview-list">
                    <IonItem lines="none" className="onboarding-v2__photo-preview-item">
                      <div className="onboarding-v2__photo-preview-frame">
                      {previewPhoto ? (
                        <img
                          alt="Refreshments Profile"
                          src={previewPhoto}
                          onError={(e) => onImgError(e)}
                          className="onboarding-v2__photo-preview-image"
                        />
                      ) : (
                        <img
                          alt="Refreshments Profile placeholder"
                          src={"../static/img/navynobordervector.png"}
                          className="onboarding-v2__photo-preview-image onboarding-v2__photo-preview-image--placeholder"
                        />
                      )}
                      </div>
                    </IonItem>
                  </IonList>
                  {usePersonalPhoto && !personalPhoto && (
                    <IonText color="medium">
                      {copy.photo.missingPersonalPhoto}
                    </IonText>
                  )}
                  <IonButton expand="block" color="tertiary" onClick={updatePicture}>
                    {copy.photo.uploadCta}
                  </IonButton>
                </IonCardContent>
                <div className="onboarding-v2__card-footer">
                  <IonRow className="onboarding-v2__nav">
                    <IonButton fill="outline" onClick={slidePrev}>
                      {ONBOARDING_COPY.common.back}
                    </IonButton>
                    <IonButton
                      className="onboarding-v2__primary-action"
                      onClick={slideNext}
                      disabled={!canContinueFromPhoto}
                    >
                      {ONBOARDING_COPY.common.next}
                    </IonButton>
                  </IonRow>
                  <IonRow className="onboarding-v2__nav">
                    <IonButton fill="clear" size="small" onClick={slideNext}>
                      {ONBOARDING_COPY.common.skip}
                    </IonButton>
                  </IonRow>
                </div>
              </IonCard>
              {finishLaterButton}
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <OnboardingCardLocationCoords
                flow="community"
                preExistingCoords={hasSharedLocationCoords}
                hasPersonalProfile={hasPersonalProfile}
                onCoordsSaved={(localLabel) => {
                  locationLabelCleared.current = false;
                  setCommunityLocationLabel(hadLocationLabelBeforeCoords ? originalLocationLabelRef.current : localLabel);
                  if (!hadLocationLabelBeforeCoords) {
                    setShowLocation(false);
                  }
                  setCoordsavedThisSession(true);
                }}
                onCoordsCleared={() => {
                  locationLabelCleared.current = true;
                  setCommunityLocationLabel('');
                  setCoordsavedThisSession(false);
                }}
              />
              {finishLaterButton}
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
                <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
                  <IonCardTitle>{copy.location.title}</IonCardTitle>
                  <p>
                    {hasAnyCoords
                      ? ONBOARDING_COPY.cards.locationLabel.withCoords
                      : ONBOARDING_COPY.cards.locationLabel.withoutCoords}
                  </p>
                  <h3>{ONBOARDING_COPY.cards.locationLabel.profileNote}</h3>
                  <p>{ONBOARDING_COPY.cards.locationLabel.note}</p>
                  {hasAnyCoords ? (
                    <>
                      <IonItem lines="none" className="onboarding-v2__photo-toggle">
                        <IonLabel>{copy.location.toggleLabel}</IonLabel>
                        <IonToggle
                          slot="end"
                          checked={showLocation}
                          onIonChange={(e) => setShowLocation(e.detail.checked)}
                        />
                      </IonItem>
                      {shouldShowCommunityLocationInput && (
                        <>
                          <IonText color="medium">
                            <p style={{ marginTop: 0 }}>
                              {copy.location.shownPrefix}{communityLocationLabel || '-'}
                            </p>
                          </IonText>
                          <IonItem lines="none" className="onboarding-v2__input onboarding-v2__input--card">
                            <IonInput
                              value={communityLocationLabel}
                              placeholder={ONBOARDING_COPY.cards.locationLabel.placeholder}
                              autocapitalize="words"
                              maxlength={PROFILE_FIELD_LIMITS.location}
                              counter
                              onIonInput={(event) => setCommunityLocationLabel((event.detail.value ?? '').slice(0, PROFILE_FIELD_LIMITS.location))}
                            />
                          </IonItem>
                        </>
                      )}
                    </>
                  ) : (
                    <IonItem lines="none" className="onboarding-v2__input onboarding-v2__input--card">
                      <IonInput
                        value={communityLocationLabel}
                        placeholder={ONBOARDING_COPY.cards.locationLabel.placeholder}
                        autocapitalize="words"
                        maxlength={PROFILE_FIELD_LIMITS.location}
                        counter
                        onIonInput={(event) => setCommunityLocationLabel((event.detail.value ?? '').slice(0, PROFILE_FIELD_LIMITS.location))}
                      />
                    </IonItem>
                  )}
                </IonCardContent>
                <div className="onboarding-v2__card-footer">
                  <IonRow className="onboarding-v2__nav">
                    <IonButton fill="outline" onClick={slidePrev}>
                      {ONBOARDING_COPY.common.back}
                    </IonButton>
                    <IonButton
                      className="onboarding-v2__primary-action"
                      onClick={handleLocationNext}
                      disabled={savingLocation || (hasAnyCoords && showLocation && !communityLocationLabel.trim())}
                    >
                      <span className={`onboarding-v2__button-label ${savingLocation ? 'loading' : ''}`}>
                        {ONBOARDING_COPY.common.next}
                      </span>
                      {savingLocation && <IonSpinner name="dots" className="onboarding-v2__button-spinner" />}
                    </IonButton>
                  </IonRow>
                  {!hasAnyCoords && (
                    <IonRow className="onboarding-v2__nav">
                      <IonButton fill="clear" size="small" onClick={handleLocationSkip}>
                        {ONBOARDING_COPY.common.skip}
                      </IonButton>
                    </IonRow>
                  )}
                </div>
              </IonCard>
              {finishLaterButton}
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
                <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
                  <IonCardTitle>{copy.bio.title}</IonCardTitle>
                  <p>{copy.bio.body}</p>
                  <IonItem lines="none" className="onboarding-v2__input onboarding-v2__input--card">
                    <IonTextarea
                      value={communityBio}
                      autoGrow
                      maxlength={COMMUNITY_PROFILE_FIELD_LIMITS.bio}
                      counter
                      autocapitalize='sentences'
                      autoCorrect='on'
                      onIonInput={(e) => setCommunityBio(e.detail.value ?? '')}
                    />
                  </IonItem>
                </IonCardContent>
                <div className="onboarding-v2__card-footer">
                  <IonRow className="onboarding-v2__nav">
                    <IonButton fill="outline" onClick={slidePrev}>
                      {ONBOARDING_COPY.common.back}
                    </IonButton>
                    <IonButton className="onboarding-v2__primary-action" onClick={handleBioNext} disabled={communityBio.length < 3 || savingBio}>
                      <span className={`onboarding-v2__button-label ${savingBio ? 'loading' : ''}`}>
                        {ONBOARDING_COPY.common.next}
                      </span>
                      {savingBio && <IonSpinner name="dots" className="onboarding-v2__button-spinner" />}
                    </IonButton>
                  </IonRow>
                  <IonRow className="onboarding-v2__nav">
                    <IonButton fill="clear" size="small" onClick={slideNext}>
                      {ONBOARDING_COPY.common.skip}
                    </IonButton>
                  </IonRow>
                </div>
              </IonCard>
              {finishLaterButton}
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
                <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
                  <IonCardTitle>{copy.age.title}</IonCardTitle>
                  <p>{copy.age.body}</p>
                  <IonText color="medium">
                    <p style={{ marginTop: 0 }}>
                      {copy.age.shownPrefix}
                      {showAgeTier === 'none' ? copy.age.hideAge : showAgeTier === 'decade' ? ageDecade : ageLabel}
                    </p>
                  </IonText>
                  <IonRadioGroup
                    className="onboarding-v2__choice-group"
                    value={showAgeTier}
                    onIonChange={(e) => setShowAgeTier(e.detail.value)}
                  >
                    <IonItem lines="none" className="onboarding-v2__choice-item">
                      <IonRadio value="exact" labelPlacement="start">{copy.age.showExact}</IonRadio>
                    </IonItem>
                    <IonItem lines="none" className="onboarding-v2__choice-item">
                      <IonRadio value="decade" labelPlacement="start">{copy.age.showDecade}</IonRadio>
                    </IonItem>
                    <IonItem lines="none" className="onboarding-v2__choice-item">
                      <IonRadio value="none" labelPlacement="start">{copy.age.hide}</IonRadio>
                    </IonItem>
                  </IonRadioGroup>
                </IonCardContent>
                <div className="onboarding-v2__card-footer">
                  <IonRow className="onboarding-v2__nav">
                    <IonButton fill="outline" onClick={slidePrev}>
                      {ONBOARDING_COPY.common.back}
                    </IonButton>
                    <IonButton className="onboarding-v2__primary-action" onClick={handleAgeNext} disabled={savingAge}>
                      <span className={`onboarding-v2__button-label ${savingAge ? 'loading' : ''}`}>
                        {ONBOARDING_COPY.common.next}
                      </span>
                      {savingAge && <IonSpinner name="dots" className="onboarding-v2__button-spinner" />}
                    </IonButton>
                  </IonRow>
                </div>
              </IonCard>
              {finishLaterButton}
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="onboarding-v2__slide onboarding-v2__ready">
              <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
                <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
                  <IonCardTitle>{copy.ready.title}</IonCardTitle>
                  <p>{copy.ready.body}</p>
                  {!hasPersonalProfile && (
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={handleCreatePersonalProfile}
                    >
                      {copy.ready.createPersonal}
                    </IonButton>
                  )}
                  <IonButton
                    expand="block"
                    className="onboarding-v2__primary-action"
                    onClick={handleFinish}
                  >
                    {copy.ready.finish}
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </div>
          </SwiperSlide>
        </Swiper>
      </IonContent>
    </IonPage>
  );
};

export default CommunityOnboarding;
