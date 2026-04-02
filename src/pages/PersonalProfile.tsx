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
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import './Page.css';
import './Onboarding.css';
import '../components/OnboardingCard.css';

import { Swiper, SwiperSlide, useSwiper } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination, Scrollbar } from 'swiper';
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

type PersonalProfileProps = {
  onDismiss?: () => void;
};

const PersonalProfile: React.FC<PersonalProfileProps> = ({ onDismiss }) => {
  const copy = ONBOARDING_COPY.personalProfile;
  const [confirmLogout] = useIonAlert();
  const [stayPausedOpen, stayPausedDismiss] = useIonModal(StayPausedModal, {
    onDismiss: () => stayPausedDismiss(),
  });
  const queryClient = useQueryClient();
  const swiperRef = useRef<any>(null);
  const currentProfile = useGetCurrentProfile().data;
  const moderation = useGetCurrentModeration().data;
  const { data: communityProfile } = useGetCommunityProfile();
  const hasCommunityProfile = Boolean(communityProfile);
  const showConnectToggle = !hasCommunityProfile && !currentProfile?.created_profile;
  const SLIDE_KEY = 'personal_profile_onboarding_slide';
  const [hasSharedLocationCoords, setHasSharedLocationCoords] = useState(false);
  const [locationLabelDraft, setLocationLabelDraft] = useState('');
  const [hasCreatedProfileForConnectStep, setHasCreatedProfileForConnectStep] = useState(false);

  const SwiperButtonPrev = ({ children }) => {
    const swiper = useSwiper();
    return (
      <IonButton color="gray" onClick={() => swiper.slidePrev()}>
        {children}
      </IonButton>
    );
  };
  const SwiperButtonNext = ({ children }) => {
    const swiper = useSwiper();
    return <IonButton onClick={() => swiper.slideNext()}>{children}</IonButton>;
  };

  useEffect(() => {
    const setThemeandFont = async () => {
      await setThemePref('light');
      await setFontSizePref('default');
      await setTextZoom();
    };

    setThemeandFont();
  }, []);

  useEffect(() => {
    setHasSharedLocationCoords(
      Boolean(currentProfile?.location_point_lat && currentProfile?.location_point_long)
    );
    setLocationLabelDraft(
      (currentProfile?.location ?? currentProfile?.coordinates_near ?? '').trim()
    );
  }, [
    currentProfile?.location,
    currentProfile?.coordinates_near,
    currentProfile?.location_point_lat,
    currentProfile?.location_point_long,
  ]);

  useEffect(() => {
    const restoreSlide = async () => {
      if (currentProfile?.created_profile) {
        await Preferences.remove({ key: SLIDE_KEY });
        return;
      }
      const stored = await Preferences.get({ key: SLIDE_KEY });
      const storedIndex = stored?.value ? Number(stored.value) : 0;
      if (swiperRef.current && Number.isFinite(storedIndex) && storedIndex > 0) {
        swiperRef.current.slideTo(storedIndex, 0);
      }
    };
    restoreSlide();
  }, [currentProfile?.created_profile]);

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
      <IonContent className="ignore-keyboard ">
        <Swiper
          modules={[Navigation, Pagination]}
          pagination={{ type: 'progressbar' }}
          centeredSlides
          allowTouchMove={false}
          className="onboarding"
          onSwiper={(swiperInstance) => {
            swiperRef.current = swiperInstance;
          }}
          onSlideChange={async (swiperInstance) => {
            if (currentProfile?.created_profile) {
              await Preferences.remove({ key: SLIDE_KEY });
              return;
            }
            await Preferences.set({ key: SLIDE_KEY, value: String(swiperInstance.activeIndex) });
          }}
        >
          <SwiperSlide>
              <IonCard className="onboarding-slide" style={{ overflow: 'scroll', position: 'relative', height: '95vh' }}>
                <IonCardContent style={{ padding: '20px' }}>
              <IonCardTitle style={{ fontSize: '26px' }}>{copy.intro.title}</IonCardTitle>
                <img
                  src="../static/img/flower-mask.png"
                  style={{ width: '50%', alignSelf: 'center', margin: '30pt' }}
                />
                <IonText style={{ textAlign: 'center' }}>
                  <h2>{copy.intro.bodyPrimary}</h2>
                </IonText>
              </IonCardContent>
              <IonRow className="onboarding-slide-buttons">
                <SwiperButtonNext>{copy.intro.cta}</SwiperButtonNext>
              </IonRow>
            </IonCard>
          </SwiperSlide>

          <SwiperSlide>
            <OnboardingCardName />
          </SwiperSlide>
          <SwiperSlide>
            <OnboardingCardPronouns />
          </SwiperSlide>
          {!hasSharedLocationCoords && (
            <SwiperSlide>
              <OnboardingCardLocationCoords
                onCoordsSaved={(localLabel) => {
                  setHasSharedLocationCoords(true);
                  setLocationLabelDraft((prev) => prev || localLabel);
                }}
              />
            </SwiperSlide>
          )}
          <SwiperSlide>
            <OnboardingCardLocationLabel initialLocation={locationLabelDraft} />
          </SwiperSlide>
          <SwiperSlide>
            <OnboardingCardLookingFor />
          </SwiperSlide>
          <SwiperSlide>
            <OnboardingCardGenderIdentity />
          </SwiperSlide>

          <SwiperSlide>
            <OnboardingCardLivedExperiences />
          </SwiperSlide>
          <SwiperSlide>
            <OnboardingCardCovid />
          </SwiperSlide>
          <SwiperSlide>
            <OnboardingCardProfilePic />
          </SwiperSlide>
          <SwiperSlide>
            <OnboardingCardPictures />
          </SwiperSlide>
          <SwiperSlide>
            <OnboardingCardBio />
          </SwiperSlide>
          <SwiperSlide>
            <OnboardingCardLetsTalkAbout onBeforeNext={ensureProfileCreatedBeforeConnect} />
          </SwiperSlide>
          {hasCommunityProfile && (
            <SwiperSlide>
              <OnboardingCardConnectFromRefreshments />
            </SwiperSlide>
          )}
          <SwiperSlide>
            <OnboardingCardDone showConnectToggle={showConnectToggle} />
          </SwiperSlide>
        </Swiper>
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
      </IonContent>
    </IonPage>
  );
};

export default PersonalProfile;
