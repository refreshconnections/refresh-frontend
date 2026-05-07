import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonContent,
  IonPage,
  IonRow,
  IonText,
  useIonAlert,
  useIonModal,
} from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCompleteOnboarding } from '../hooks/api/account/onboarding';

import './Page.css';
import './OnboardingV2.css';
import './Onboarding.css';
import '../components/OnboardingCard.css';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import OnboardingCardGenderIdentity from '../components/OnboardingCardGenderIdentity';
import OnboardingCardDone from '../components/OnboardingCardDone';
import OnboardingCardLocationCoords from '../components/OnboardingCardLocationCoords';
import OnboardingCardLocationLabel from '../components/OnboardingCardLocationLabel';
import OnboardingCardLookingFor from '../components/OnboardingCardLookingFor';
import OnboardingCardCovid from '../components/OnboardingCardCovid';
import OnboardingCardProfilePic from '../components/OnboardingCardProfilePic';
import OnboardingCardPictures from '../components/OnboardingCardPictures';
import OnboardingCardName from '../components/OnboardingCardName';
import OnboardingCardBio from '../components/OnboardingCardBio';
import OnboardingCardLetsTalkAbout from '../components/OnboardingCardLetsTalkAbout';
import { handleLogoutCommon, setFontSizePref, setTextZoom, setThemePref, updateCurrentUserProfile } from '../hooks/utilities';
import StayPausedModal from '../components/StayPausedModal';
import OnboardingCardPronouns from '../components/OnboardingCardPronouns';
import OnboardingCardLivedExperiences from '../components/OnboardingCardLivedExperiences';
import OnboardingCardConnectFromRefreshments from '../components/OnboardingCardConnectFromRefreshments';
import { useGetCurrentModeration } from '../hooks/api/profiles/current-moderation';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useGetCommunityProfile } from '../hooks/api/profiles/community-profile';
import { Preferences } from '@capacitor/preferences';
import { ONBOARDING_COPY } from '../constants/onboarding';
import { useOnboardingKeyboardState } from '../hooks/useOnboardingKeyboardState';

type PersonalProfileProps = {
  onDismiss?: () => void;
};

const PERSONAL_PROFILE_ONBOARDING_IN_PROGRESS_KEY = 'personal_profile_onboarding_in_progress';
const PERSONAL_PROFILE_ONBOARDING_SLIDE_KEY = 'personal_profile_onboarding_slide';

const PersonalProfile: React.FC<PersonalProfileProps> = ({ onDismiss }) => {
  const copy = ONBOARDING_COPY.personalProfile;
  const { keyboardHeight, keyboardOpen } = useOnboardingKeyboardState();
  const [confirmLogout] = useIonAlert();
  const [stayPausedOpen, stayPausedDismiss] = useIonModal(StayPausedModal, {
    onDismiss: () => stayPausedDismiss(),
  });
  const queryClient = useQueryClient();
  const completeOnboarding = useCompleteOnboarding({
    onSuccess: async () => {
      await Preferences.set({ key: 'ONBOARDED', value: 'true' });
    },
  });
  const swiperRef = useRef<any>(null);
  const currentProfile = useGetCurrentProfile().data;
  const moderation = useGetCurrentModeration().data;
  const { data: communityProfile } = useGetCommunityProfile();
  const hasCommunityProfile = Boolean(communityProfile?.username);

  // Start false; flip to true (and stay true) once coords appear in cache.
  // Using useState+useEffect rather than a snapshot avoids stale reads when
  // this modal is pre-mounted by useIonModal before the user has shared location.
  const [hasSharedLocationCoords, setHasSharedLocationCoords] = useState(false);
  useEffect(() => {
    if (currentProfile?.location_point_lat && currentProfile?.location_point_long) {
      setHasSharedLocationCoords(true);
    }
  }, [currentProfile?.location_point_lat, currentProfile?.location_point_long]);
  const [locationLabelDraft, setLocationLabelDraft] = useState('');
  const [locationLabelDraftFromCoords, setLocationLabelDraftFromCoords] = useState(false);
  const locationLabelDraftFromCoordsRef = useRef('');
  const [hasCreatedProfileForConnectStep, setHasCreatedProfileForConnectStep] = useState(false);

  useEffect(() => {
    const setThemeandFont = async () => {
      await setThemePref('light');
      await setFontSizePref('default');
      await setTextZoom();
    };

    setThemeandFont();
  }, []);

  useEffect(() => {
    const profileLocationLabel = (currentProfile?.location || currentProfile?.coordinates_near || '').trim();
    setLocationLabelDraft(profileLocationLabel);
    setLocationLabelDraftFromCoords(wasDraft => wasDraft && profileLocationLabel === locationLabelDraftFromCoordsRef.current);
  }, [
    currentProfile?.location,
    currentProfile?.coordinates_near,
  ]);

  useEffect(() => {
    const restoreSlide = async () => {
      if (currentProfile?.created_profile) {
        await Preferences.remove({ key: PERSONAL_PROFILE_ONBOARDING_IN_PROGRESS_KEY });
        await Preferences.remove({ key: PERSONAL_PROFILE_ONBOARDING_SLIDE_KEY });
        return;
      }
      // Coords slide is now always present. If pre-existing coords exist, the
      // old stored index was from a layout without that slide — clear it to avoid
      // landing on the wrong slide.
      if (hasSharedLocationCoords) {
        const inProgress = await Preferences.get({ key: PERSONAL_PROFILE_ONBOARDING_IN_PROGRESS_KEY });
        if (inProgress.value !== 'true') {
          await Preferences.remove({ key: PERSONAL_PROFILE_ONBOARDING_SLIDE_KEY });
          return;
        }
      }
      const stored = await Preferences.get({ key: PERSONAL_PROFILE_ONBOARDING_SLIDE_KEY });
      const storedIndex = stored?.value ? Number(stored.value) : 0;
      if (swiperRef.current && Number.isFinite(storedIndex) && storedIndex > 0) {
        swiperRef.current.slideTo(storedIndex, 0);
      }
    };
    restoreSlide();
  }, [currentProfile?.created_profile, hasSharedLocationCoords]);

  useEffect(() => {
    if (currentProfile?.created_profile) return;
    Preferences.set({ key: PERSONAL_PROFILE_ONBOARDING_IN_PROGRESS_KEY, value: 'true' });
  }, [currentProfile?.created_profile]);

  const clearResumeState = async () => {
    await Preferences.remove({ key: PERSONAL_PROFILE_ONBOARDING_IN_PROGRESS_KEY });
    await Preferences.remove({ key: PERSONAL_PROFILE_ONBOARDING_SLIDE_KEY });
  };

  const confirmLogoutAlert = async () => {
    confirmLogout({
      header: copy.logoutConfirm.header,
      subHeader: copy.logoutConfirm.subHeader,
      buttons: [
        {
          text: copy.logoutConfirm.cancel,
          role: 'destructive',
        },
        {
          text: copy.logoutConfirm.confirm,
          handler: async () => {
            await handleLogoutCommon();
          },
        },
      ],
    });
  };

  const handleFinishLater = async () => {
    if (currentProfile?.onboarded !== true) {
      await completeOnboarding.mutateAsync();
    }
    await updateCurrentUserProfile({ paused_profile: true, settings_community_profile: false });
    if (onDismiss) {
      onDismiss();
      return;
    }
    window.location.pathname = '/community';
  };

  const ensureProfileCreatedBeforeConnect = async () => {
    if (!hasCommunityProfile || currentProfile?.created_profile || hasCreatedProfileForConnectStep) {
      return;
    }

    await updateCurrentUserProfile({
      created_profile: true,
      paused_profile: moderation?.paused_on_creation ? true : false,
      location_last_updated: null,
      romance_gender_last_updated: null,
      gender_last_updated: null,
    });
    setHasCreatedProfileForConnectStep(true);
    await queryClient.invalidateQueries({ queryKey: ['current'] });
  };

  return (
    <IonPage>
      <IonContent
        className={`onboarding-v2__content${keyboardOpen ? ' onboarding-v2__content--keyboard-open' : ''}`}
        style={{ '--onboarding-keyboard-offset': `${keyboardHeight}px` } as React.CSSProperties}
      >
        <Swiper
          centeredSlides
          allowTouchMove={false}
          className="onboarding-v2__swiper"
          onSwiper={(swiperInstance) => {
            swiperRef.current = swiperInstance;
          }}
          onSlideChange={async (swiperInstance) => {
            if (currentProfile?.created_profile) {
              await clearResumeState();
              return;
            }
            await Preferences.set({ key: PERSONAL_PROFILE_ONBOARDING_IN_PROGRESS_KEY, value: 'true' });
            await Preferences.set({ key: PERSONAL_PROFILE_ONBOARDING_SLIDE_KEY, value: String(swiperInstance.activeIndex) });
          }}
        >
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <IonCard className="onboarding-v2__card onboarding-v2__card--shallow onboarding-slide">
                <IonCardContent>
                  <IonCardTitle>{copy.intro.title}</IonCardTitle>
                  <img
                    src="../static/img/flower-mask.png"
                    style={{ width: 'min(220px, 50%)', alignSelf: 'center', margin: '24px auto' }}
                  />
                  <IonText style={{ textAlign: 'center' }}>
                    <h4>{copy.intro.bodyPrimary}</h4>
                  </IonText>
                </IonCardContent>
                <div className="onboarding-v2__card-footer">
                  <IonRow className="onboarding-v2__nav">
                    <IonButton
                      className="onboarding-v2__primary-action"
                      onClick={() => swiperRef.current?.slideNext()}
                    >
                      {copy.intro.cta}
                    </IonButton>
                  </IonRow>
                </div>
              </IonCard>
            </div>
          </SwiperSlide>

          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <OnboardingCardName />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <OnboardingCardPronouns />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <OnboardingCardLocationCoords
                preExistingCoords={hasSharedLocationCoords}
                onCoordsSaved={(localLabel) => {
                  setLocationLabelDraft(localLabel);
                  locationLabelDraftFromCoordsRef.current = localLabel;
                  setLocationLabelDraftFromCoords(true);
                }}
                onCoordsCleared={() => {
                  setLocationLabelDraft('');
                  locationLabelDraftFromCoordsRef.current = '';
                  setLocationLabelDraftFromCoords(false);
                }}
              />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <OnboardingCardLocationLabel
                initialLocation={locationLabelDraft}
                initialLocationIsDraft={locationLabelDraftFromCoords}
              />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <OnboardingCardLookingFor />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <OnboardingCardGenderIdentity />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <OnboardingCardLivedExperiences />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <OnboardingCardCovid />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <OnboardingCardProfilePic />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <OnboardingCardPictures />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <OnboardingCardBio />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <OnboardingCardLetsTalkAbout onBeforeNext={ensureProfileCreatedBeforeConnect} />
            </div>
          </SwiperSlide>
          {hasCommunityProfile && (
            <SwiperSlide>
              {/* OnboardingCardConnectFromRefreshments renders its own onboarding-v2__slide wrapper */}
              <OnboardingCardConnectFromRefreshments />
            </SwiperSlide>
          )}
          <SwiperSlide>
            <div className="onboarding-v2__slide">
              <OnboardingCardDone />
            </div>
          </SwiperSlide>
        </Swiper>
        {!keyboardOpen && (
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
            {ONBOARDING_COPY.common.finishLater}
          </IonButton>
        )}
      </IonContent>
    </IonPage>
  );
};

export default PersonalProfile;
