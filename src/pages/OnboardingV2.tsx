import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonNote,
  IonPage,
  IonRow,
  IonSpinner,
  IonText,
  useIonAlert,
  useIonModal
} from '@ionic/react';
import { IonDatetime, IonDatetimeButton, IonModal } from '@ionic/react';
import { Preferences } from '@capacitor/preferences';
import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Pagination } from 'swiper';
import { Swiper, SwiperSlide, useSwiper } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { useQueryClient } from '@tanstack/react-query';
import { useCompleteOnboarding } from '../hooks/api/account/onboarding';
import { useEmailStatus } from '../hooks/api/account/emails';
import { useGetGlobalAppCurrentProfile } from '../hooks/api/profiles/global-app-current-profile';
import { useEligibilityStatus, useCompleteAgeVerification } from '../hooks/api/eligibility';
import AgeVerificationFlow, { AgeCheckState } from './AgeVerificationFlow';
import { consumeAgeCheckQuery } from '../utils/age-verification';
import { simulateFakeYotiResultForUser, startYotiSession } from '../hooks/api/account/yoti';
import { apiClient } from '../hooks/api';
import { Browser } from '@capacitor/browser';
import { useYotiCallbackListener, YotiCallbackPayload } from '../hooks/useYotiCallbackListener';
import { extractSessionIdFromPayload, normalizeYotiSessionId } from '../utils/yoti-session';
import {
  checkVerificationCode,
  handleLogoutCommon,
  sendPhoneVerification,
  setFontSizePref,
  setTextZoom,
  setThemePref,
  updateCurrentUserProfileWStatus
} from '../hooks/utilities';
import './OnboardingV2.css';
import PersonalProfile from './PersonalProfile';

const WelcomeSlide: React.FC = () => {
  const swiper = useSwiper();
  return (
    <IonContent className="onboarding-v2__slide onboarding-v2__welcome onboarding-v2__welcome-wrapper">
      <div className="onboarding-v2__welcome-content onboarding-v2__welcome-content--compact">
        <div className="onboarding-v2__welcome-hero">
          <img src="../static/img/flower-mask.png" alt="Refresh Connections" />
          <h1>Welcome to Refresh Connections</h1>
          <p>
            We're a Covid conscientious community for building friendships, support, and (if you
            choose) one-on-one connections.
          </p>
        </div>
        <div className="onboarding-v2__cta">
          <IonButton
            expand="block"
            onClick={() => {
              swiper.allowSlideNext = true;
              swiper.allowSlidePrev = true;
              swiper.slideTo(2, 0);
            }}
          >
            I'm ready to get started
          </IonButton>
          <IonButton
            expand="block"
            fill="outline"
            onClick={() => {
              swiper.allowSlideNext = true;
              swiper.allowSlidePrev = true;
              swiper.slideNext();
            }}
          >
            I want to know more first
          </IonButton>
        </div>
        <IonButton
          fill="clear"
          size="small"
          className="onboarding-v2__alt"
          onClick={handleLogoutCommon}
        >
          Return to login
        </IonButton>
      </div>
    </IonContent>
  );
};

const InfoSlide: React.FC = () => {
  const swiper = useSwiper();
  return (
    <IonContent
      scrollY
      className="onboarding-v2__slide onboarding-v2__welcome onboarding-v2__welcome-wrapper onboarding-v2__info"
    >
      <div className="onboarding-v2__welcome-content">
        <div className="onboarding-v2__welcome-hero">
          <img src="../static/img/flower-mask.png" alt="Refresh Connections" />
          <h1>What to expect</h1>
        </div>
        <div
          className="onboarding-v2__welcome-details"
          style={{
            paddingLeft: 'clamp(16px, 4vw, 48px)',
            paddingRight: 'clamp(16px, 4vw, 48px)'
          }}
        >
          <section className="fade-in">
            <h2>Community connections</h2>
            <p>
              You'll start on the community side of the app--a shared space where members can gather,
              listen, and join in when they're ready. Here you can join conversations, community
              check-ins at the Refreshments Bar, and other spaces to share wins, resources, and
              gatherings that match your comfort level.
            </p>
          </section>
          <section className="fade-in">
            <h2>Personal connections</h2>
            <p>
              Refresh Connections also has a personal side, where you can discover intentional
              one-on-one connections. Create a profile that reflects how you approach Covid and what
              you're looking for, then explore potential matches for friendship, support, or dating.
              Messaging always requires mutual consent.
            </p>
          </section>
          <section className="fade-in">
            <h2>Getting started</h2>
            <p>
              On the next two screens we’ll ask for your mobile number and birthdate. They help keep your account and the community safer.
              <br/>
            After that, you can start exploring the community—and, if you’d like, fill out a profile so you can join the discovery on the one-on-one connections side of the app.
            </p>
          </section>
        </div>
        <IonRow className="onboarding-v2__nav">
          <IonButton color="medium" onClick={() => swiper.slidePrev()}>
            Back
          </IonButton>
          <IonButton onClick={() => swiper.slideTo(2)}>Sounds good, let's verify</IonButton>
        </IonRow>
        <IonButton
          fill="clear"
          size="small"
          className="onboarding-v2__alt"
          onClick={handleLogoutCommon}
        >
          Return to login
        </IonButton>
      </div>
    </IonContent>
  );
};

type PhoneSlideProps = {
  existingPhone?: string | null;
  loading: boolean;
  onComplete: () => void;
};

const PhoneSlide: React.FC<PhoneSlideProps> = ({ existingPhone, loading, onComplete }) => {
  const [phone, setPhone] = useState<string | undefined>(existingPhone ?? undefined);
  const [error, setError] = useState<string | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const swiper = useSwiper();
  const [presentAlert] = useIonAlert();
  const [presentError] = useIonAlert();

  useEffect(() => {
    setPhone(existingPhone ?? undefined);
  }, [existingPhone]);

  const handleCodeEntry = () => {
    presentAlert({
      header: 'Enter the 6-digit code we texted you',
      inputs: [{ name: 'code', type: 'number', placeholder: 'Code' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Verify',
          handler: async ({ code }) => {
            try {
              await checkVerificationCode(phone!, code);
              onComplete();
              swiper.slideTo(3);
            } catch (verificationError: any) {
              presentError({
                header: 'Verification failed',
                message: verificationError?.message || 'Please try again',
                buttons: ['OK']
              });
            }
          }
        }
      ]
    });
  };

  const handleSendCode = async () => {
    if (!phone) {
      setError('Enter a valid phone number.');
      return;
    }
    setError(null);
    try {
      const response = await sendPhoneVerification(phone);
      if (response.status === 200) {
        handleCodeEntry();
      } else if (response.status === 409) {
        presentError({
          header: 'Phone number in use',
          message:
            'This phone number is already associated with another account. Return to the login page and choose "Forgot email / password" to search for another account, or contact help@refreshconnections.com if you deleted a previous account in error.',
          buttons: ['OK']
        });
      } else if (response.status === 429) {
        presentError({
          header: 'Too many attempts',
          message: 'Please wait a bit before trying again.',
          buttons: ['OK']
        });
      } else {
        presentError({
          header: 'Unable to send code',
          message: response?.data || 'Please try again later.',
          buttons: ['OK']
        });
      }
    } catch (err: any) {
      presentError({
        header: 'Unable to send code',
        message: err?.message || 'Please try again later.',
        buttons: ['OK']
      });
    }
  };

  return (
    <div className="onboarding-v2__slide">
      <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
        <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
          <IonCardTitle>Verify your mobile number </IonCardTitle>
          <p>
            We’ll send a short code by SMS to confirm this number is yours.
          </p>
          <div className="onboarding-v2__input-wrapper">
            <IonItem lines="none" className="onboarding-v2__input onboarding-v2__input--card">
              {loading ? (
                <IonSpinner />
              ) : (
                <PhoneInput
                  placeholder="Enter phone number"
                  defaultCountry="US"
                  value={phone}
                  onChange={setPhone}
                  disabled={Boolean(existingPhone)}
                />
              )}
            </IonItem>
            {error && (
              <IonNote color="danger" className="onboarding-v2__error">
                {error}
              </IonNote>
            )}
          </div>
          <div className="onboarding-v2__why">
            <IonButton
              fill="clear"
              size="small"
              className="onboarding-v2__why-toggle"
              onClick={() => setShowWhy((prev) => !prev)}
            >
              {showWhy ? 'Hide why we ask' : 'Why do you need my phone number?'}
            </IonButton>
            {showWhy && (
              <IonText color="medium">
                We use your mobile number to help secure your account, support community safety by preventing duplicate accounts, and as a second check when you make important account changes.
                Your number is never shown to other members or used for marketing texts, and how we handle it is explained in our Privacy Policy.
                Temporary or anonymous numbers can’t be used.
              </IonText>
            )}
          </div>
        </IonCardContent>
        <div className="onboarding-v2__card-footer">
          <IonRow className="onboarding-v2__nav">
            <IonButton color="medium" onClick={() => swiper.slidePrev()}>
              Back
            </IonButton>
            {existingPhone ? (
              <IonButton onClick={() => swiper.slideNext()} disabled={loading}>
                Next
              </IonButton>
            ) : (
              <IonButton onClick={handleSendCode} disabled={!phone || loading}>
                Send code
              </IonButton>
            )}
          </IonRow>
        </div>
      </IonCard>
    </div>
  );
};

type BirthdaySlideProps = {
  profileBirthDate: string | null;
  onComplete: (isAdult: boolean) => void;
  targetSlide: (index: number) => void;
  adultSlideIndex: number;
  underAgeSlideIndex: number;
};

const BirthdaySlide: React.FC<BirthdaySlideProps> = ({
  profileBirthDate,
  onComplete,
  targetSlide,
  adultSlideIndex,
  underAgeSlideIndex
}) => {
  const [birthday, setBirthday] = useState<string | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [hasBirthday, setHasBirthday] = useState(false);
  const [isAdult, setIsAdult] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const swiper = useSwiper();
  const [presentAlert] = useIonAlert();

  const maxBirthday = () => moment().format('YYYY-MM-DD');

  const handleChange = (value?: string | string[] | null) => {
    const normalized = Array.isArray(value) ? value[0] : value ?? null;
    setBirthday(normalized);
    if (!normalized) {
      setHasBirthday(false);
      setAge(null);
      setIsAdult(null);
      return;
    }
    setHasBirthday(true);
    const justDate = normalized.split('T')[0];
    const computedAge = moment().diff(moment(justDate, 'YYYY-MM-DD'), 'years');
    setAge(computedAge);
    setIsAdult(computedAge >= 18);
  };

  const normalizedProfileBirthDate =
    profileBirthDate && profileBirthDate !== '1001-01-01' ? profileBirthDate : null;

  useEffect(() => {
    handleChange(normalizedProfileBirthDate);
  }, [normalizedProfileBirthDate]);

  const saveBirthday = async () => {
    if (!birthday) return;
    setSubmitting(true);
    try {
      const justDate = birthday.split('T')[0];
      const response = await updateCurrentUserProfileWStatus({ birth_date: justDate });
      if (response?.status === 204) {
        const nextSlide = isAdult ? adultSlideIndex : underAgeSlideIndex;
        presentAlert({
          header: `${age} will show as your age. Is this correct?`,
          buttons: [
            { text: 'No, go back', role: 'cancel' },
            {
              text: 'Yes',
              handler: () => {
                onComplete(Boolean(isAdult));
                targetSlide(nextSlide);
              }
            }
          ]
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="onboarding-v2__slide">
      <IonCard className="onboarding-v2__card">
        <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight onboarding-v2__birthday">
          <IonCardTitle>When is your birthday?</IonCardTitle>
          <p>
            We use your birthdate to verify that you're eligible to use Refresh Connections and to support
            community safety features like age-based filters.
          </p>
          <div className="onboarding-v2__input-wrapper">
            <IonItem className="onboarding-v2__input" lines="none">
              <IonLabel color={birthday ? 'dark' : 'medium'}>
                {birthday?.split('T')[0] || 'Choose your birthday'}
              </IonLabel>
              <IonDatetimeButton
                datetime="birthdayPicker"
                style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0 }}
              />
            </IonItem>
          </div>
          <IonModal keepContentsMounted>
            <IonDatetime
              id="birthdayPicker"
              value={birthday ?? normalizedProfileBirthDate ?? '1990-01-01'}
              presentation="date"
              preferWheel
              max={maxBirthday()}
              onIonChange={(e) => handleChange(e.detail.value)}
              showDefaultButtons
            />
          </IonModal>
          <div className="onboarding-v2__why">
            <IonButton
              fill="clear"
              size="small"
              className="onboarding-v2__why-toggle"
              onClick={() => setShowWhy((prev) => !prev)}
            >
              {showWhy ? 'Hide why we ask' : 'Why do you need my birthday?'}
            </IonButton>
            {showWhy && (
              <IonText color="medium">
                Used for account verification, community safety, and making sure age filters work the way
                members expect. You won't be able to edit your birthdate yourself later. Your full birthdate
                isn't shown to other members, and how we handle it is explained in our Privacy Policy.
              </IonText>
            )}
          </div>
        </IonCardContent>
        <div className="onboarding-v2__card-footer">
          <IonRow className="onboarding-v2__nav">
            <IonButton color="medium" onClick={() => swiper.slidePrev()}>
              Back
            </IonButton>
            <IonButton
              onClick={saveBirthday}
              disabled={!hasBirthday || submitting}
              className="onboarding-v2__primary-action"
            >
              <span className={`onboarding-v2__button-label ${submitting ? 'loading' : ''}`}>
                Save birthday
              </span>
              {submitting && <IonSpinner name="dots" className="onboarding-v2__button-spinner" />}
            </IonButton>
          </IonRow>
        </div>
      </IonCard>
    </div>
  );
};

const UnderAgeSlide: React.FC = () => (
  <div className="onboarding-v2__slide onboarding-v2__ready">
    <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
      <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
        <IonCardTitle>Thanks for your interest</IonCardTitle>
        <p>
          Refresh Connections is only available to members who are 18 or older. Since you're under 18, we
          can't create an account for you right now. We'll be here when you're ready.
        </p>
        <p>
          If you feel a mistake has been made, please contact{' '}
          <a href="mailto:ageverification@refreshconnections.com">ageverification@refreshconnections.com</a>.
        </p>
        <IonButton expand="block" onClick={handleLogoutCommon}>
          Log out
        </IonButton>
      </IonCardContent>
    </IonCard>
  </div>
);

const AgeVerificationSlide: React.FC<{
  state: AgeCheckState;
  regionName?: string | null;
  providerName?: string | null;
  onStart: () => void;
  onRetry: () => void;
  onContinue: () => void;
  onContactSupport: () => void;
  onLogout: () => void;
  verifying: boolean;
  fakeModeEnabled?: boolean;
  lastSessionId?: string | null;
  onRefreshResult?: () => void;
  onSimulatePass?: () => void;
  onSimulateFail?: () => void;
  onSimulateInconclusive?: () => void;
}> = ({
  state,
  regionName,
  providerName,
  onStart,
  onRetry,
  onContinue,
  onContactSupport,
  onLogout,
  verifying,
  fakeModeEnabled,
  lastSessionId,
  onRefreshResult,
  onSimulatePass,
  onSimulateFail,
  onSimulateInconclusive,
}) => (
  <div className="onboarding-v2__slide onboarding-v2__ready">
    <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
      <AgeVerificationFlow
        state={state}
        regionName={regionName}
        providerName={providerName}
        verifying={verifying}
        onStart={onStart}
        onRetry={onRetry}
        onContinue={onContinue}
        onContactSupport={onContactSupport}
        onLogout={onLogout}
        fakeModeEnabled={fakeModeEnabled}
        lastSessionId={lastSessionId}
        onRefreshResult={onRefreshResult}
        onSimulatePass={onSimulatePass}
        onSimulateFail={onSimulateFail}
        onSimulateInconclusive={onSimulateInconclusive}
        embedded
      />
    </IonCard>
  </div>
);

type ReadySlideProps = {
  onFinish: (
    destination: string,
    event?: React.MouseEvent<HTMLIonButtonElement>
  ) => void;
  isCompleting: boolean;
  onStartPersonalProfile: () => void;
  onMarkOnboarded: () => void;
};

const ReadySlide: React.FC<ReadySlideProps> = ({
  onFinish,
  isCompleting,
  onStartPersonalProfile,
  onMarkOnboarded,
}) => {
  return (
    <div className="onboarding-v2__slide onboarding-v2__ready">
      <IonCard className="onboarding-v2__card">
        <IonCardContent>
          <IonCardTitle>You're ready to get started!</IonCardTitle>
          <div className="onboarding-v2__ready-options">
            <div className="onboarding-v2__option">
              <h2>Set up a community profile</h2>
              <p>Join in on conversations at the Refreshments Bar and other shared spaces.</p>
              <IonButton
                expand="block"
                disabled={isCompleting}
                onClick={(event) => {
                  onMarkOnboarded?.();
                  onFinish('/community-onboarding', event);
                }}
              >
                {isCompleting ? <IonSpinner name="dots" /> : 'Start community profile'}
              </IonButton>
            </div>
    
            <div className="onboarding-v2__option">
              <h2>Set up a personal profile</h2>
              <p>Send Likes and exchange one-on-one messages when you're ready for personal connections.</p>
            <IonButton
              expand="block"
              disabled={isCompleting}
              onClick={() => {
                onMarkOnboarded?.();
                onStartPersonalProfile();
              }}
            >
              {isCompleting ? <IonSpinner name="dots" /> : 'Start personal profile'}
            </IonButton>
            </div>
            <div className="onboarding-v2__option">
              <h2>Check things out first</h2>
              <p>Take a look around first. You can always add a personal profile later.</p>
              <IonButton
                expand="block"
                fill="outline"
                disabled={isCompleting}
                onClick={(event) => {
                  onMarkOnboarded?.();
                  onFinish('/community', event);
                }}
              >
                {isCompleting ? <IonSpinner name="dots" /> : 'Explore the app'}
              </IonButton>
            </div>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  );
};

const OnboardingV2: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: globalCurrentProfile } = useGetGlobalAppCurrentProfile();
  const { data: emailStatus, isLoading: emailStatusLoading } = useEmailStatus();
  const { data: eligibilityStatus } = useEligibilityStatus(true);
  const initialAgeResult = React.useMemo(() => consumeAgeCheckQuery(), []);
  const [phoneComplete, setPhoneComplete] = useState(false);
  const [birthdayComplete, setBirthdayComplete] = useState(false);
  const [isAdult, setIsAdult] = useState(true);
  const swiperRef = useRef<any>(null);
  const [swiperReady, setSwiperReady] = useState(false);
  const [launchingYoti, setLaunchingYoti] = useState(false);
  const [ageCheckState, setAgeCheckState] = useState<AgeCheckState | null>(initialAgeResult);
  const [lastYotiSessionId, setLastYotiSessionId] = useState<string | null>(null);
  const fakeModeEnabled = process.env.NODE_ENV !== 'production';
  const [presentPersonalProfile, dismissPersonalProfile] = useIonModal(PersonalProfile, {
    onDismiss: () => dismissPersonalProfile(),
  });
  const handleStartPersonalProfile = () => {
    presentPersonalProfile();
  };
  useEffect(() => {
    if (eligibilityStatus?.failed_result) {
      setAgeCheckState('failed');
    }
  }, [eligibilityStatus?.failed_result]);

  const needsAgeVerification = Boolean(
    eligibilityStatus?.needs_age_verification || eligibilityStatus?.failed_result
  );
  const hasSpecialAgeState =
    ageCheckState === 'success' ||
    ageCheckState === 'canceled' ||
    ageCheckState === 'failed' ||
    ageCheckState === 'error';
  const showAgeSlide = needsAgeVerification || hasSpecialAgeState;
  const readySlideIndex = showAgeSlide ? 5 : 4;
  const underAgeSlideIndex = showAgeSlide ? 6 : 5;
  const adultSlideIndex = showAgeSlide ? 4 : readySlideIndex;

  const completeOnboarding = useCompleteOnboarding({
    onSuccess: async () => {
      await Preferences.set({ key: 'ONBOARDED', value: 'true' });
    }
  });
  const markOnboarded = useCallback(() => {
    if (completeOnboarding.isPending) {
      return;
    }
    completeOnboarding.mutate();
  }, [completeOnboarding]);
  const completeAgeVerification = useCompleteAgeVerification({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eligibility', 'status'] });
    }
  });
  const verifyingAgeGate = launchingYoti || completeAgeVerification.isPending;

  const regionName = eligibilityStatus?.region_name;

  useEffect(() => {
    const setPrefs = async () => {
      await setThemePref('light');
      await setFontSizePref('default');
      await setTextZoom();
    };
    setPrefs();
  }, []);

  useEffect(() => {
    if (emailStatus?.phone) {
      setPhoneComplete(true);
    }
  }, [emailStatus?.phone]);

  useEffect(() => {
    const birthDate = globalCurrentProfile?.birth_date;
    if (birthDate && birthDate !== '1001-01-01') {
      setBirthdayComplete(true);
      const computedAge = moment().diff(moment(birthDate, 'YYYY-MM-DD'), 'years');
      setIsAdult(computedAge >= 18);
    }
  }, [globalCurrentProfile?.birth_date]);

  useEffect(() => {
    if (!swiperReady) return;
    if (birthdayComplete && !isAdult) {
      swiperRef.current?.slideTo(underAgeSlideIndex, 0);
      return;
    }
    if (!showAgeSlide && phoneComplete && birthdayComplete && isAdult) {
      swiperRef.current?.slideTo(readySlideIndex, 0);
    }
  }, [
    phoneComplete,
    birthdayComplete,
    isAdult,
    swiperReady,
    showAgeSlide,
    readySlideIndex,
    underAgeSlideIndex
  ]);

  useEffect(() => {
    if (
      ageCheckState === 'success' &&
      needsAgeVerification &&
      !completeAgeVerification.isPending &&
      !completeAgeVerification.isSuccess
    ) {
      completeAgeVerification.mutate();
    }
  }, [ageCheckState, needsAgeVerification, completeAgeVerification]);

  const handleFinish = async (
    destination: string,
    event?: React.MouseEvent<HTMLIonButtonElement>
  ) => {
    event?.preventDefault();
    if (completeOnboarding.isPending) return;
    try {
      await completeOnboarding.mutateAsync();
    } catch (error) {
      console.error('Failed to complete onboarding', error);
    } finally {
      window.location.href = destination;
    }
  };

  const handleTargetSlide = (index: number) => {
    if (!swiperRef.current) return;
    swiperRef.current.allowSlideNext = true;
    swiperRef.current.allowSlidePrev = true;
    swiperRef.current.slideTo(index, 0);
  };

  const launchYoti = async () => {
    setLaunchingYoti(true);
    try {
      const session = await startYotiSession();
      setLastYotiSessionId(session.session_id ?? null);
      await Browser.open({ url: session.redirect_url });
    } catch (error: any) {
      console.error('Failed to launch age verification', error);
      setLastYotiSessionId(null);
      if (error?.response?.status === 403) {
        setAgeCheckState('failed');
      } else {
        setAgeCheckState('error');
      }
    } finally {
      setLaunchingYoti(false);
    }
  };

  const applyAgeCheckState = useCallback(
    (state: AgeCheckState) => {
      setAgeCheckState(state);
      if (state === 'success' || state === 'failed') {
        queryClient.invalidateQueries({ queryKey: ['eligibility', 'status'] });
      }
    },
    [queryClient]
  );

  const refreshYotiResult = useCallback(
    async (sessionId?: string | null) => {
      const normalizedFromCallback = normalizeYotiSessionId(sessionId);
      const normalizedFromState = normalizeYotiSessionId(lastYotiSessionId);
      const targetSessionId = normalizedFromCallback ?? normalizedFromState;
      if (!targetSessionId) {
        console.warn('No valid Yoti session to refresh');
        return;
      }
      setLastYotiSessionId(targetSessionId);
      try {
        const res = await apiClient.get('/account/yoti/result/', {
          params: { session_id: targetSessionId },
        });
        const status = res.data?.status;
        if (status === 'passed') {
          applyAgeCheckState('success');
        } else if (status === 'failed') {
          applyAgeCheckState('failed');
        } else {
          applyAgeCheckState('canceled');
        }
      } catch (error) {
        console.error('Unable to refresh Yoti result', error);
      }
    },
    [lastYotiSessionId, applyAgeCheckState]
  );

  const handleYotiCallbackPayload = useCallback(
    (payload: YotiCallbackPayload) => {
      const payloadSessionId = extractSessionIdFromPayload(payload);
      if (!payloadSessionId) {
        console.warn('Yoti callback payload missing a session id', payload);
      }
      refreshYotiResult(payloadSessionId);
    },
    [refreshYotiResult]
  );

  useYotiCallbackListener(handleYotiCallbackPayload);

  const simulateYotiResult = useCallback(
    async (state: AgeCheckState) => {
      const fakeStatusMap: Partial<Record<AgeCheckState, 'passed' | 'failed' | 'inconclusive'>> = {
        success: 'passed',
        failed: 'failed',
        canceled: 'inconclusive',
      };
      const fakeStatus = fakeStatusMap[state];
      if (fakeModeEnabled && fakeStatus) {
        try {
          const res = await simulateFakeYotiResultForUser(fakeStatus);
          if (res.status === 'passed') {
            applyAgeCheckState('success');
            return;
          }
          if (res.status === 'failed' || res.failed_result) {
            applyAgeCheckState('failed');
            return;
          }
          applyAgeCheckState('canceled');
          return;
        } catch (error) {
          console.error('Failed to simulate fake Yoti result', error);
        }
      }
      applyAgeCheckState(state);
    },
    [applyAgeCheckState, fakeModeEnabled]
  );

  const openSupport = () => {
    window.open(
      'mailto:help@refreshconnections.com?subject=Age%20verification%20review%20request',
      '_blank'
    );
  };

  return (
    <IonPage>
      <IonContent className="onboarding-v2__content">
          <Swiper
            modules={[Pagination]}
            pagination={{ clickable: true }}
            className="onboarding-v2__swiper"
            centeredSlides
            allowTouchMove={false}
            onSwiper={(swiperInstance) => {
              swiperRef.current = swiperInstance;
              setSwiperReady(true);
            }}
          >
          <SwiperSlide>
            <WelcomeSlide />
          </SwiperSlide>
          <SwiperSlide>
            <InfoSlide />
          </SwiperSlide>
          <SwiperSlide>
            <PhoneSlide
              existingPhone={emailStatus?.phone}
              loading={emailStatusLoading}
              onComplete={() => setPhoneComplete(true)}
            />
          </SwiperSlide>
          <SwiperSlide>
            <BirthdaySlide
              profileBirthDate={globalCurrentProfile?.birth_date ?? null}
              onComplete={(adult) => {
                setBirthdayComplete(true);
                setIsAdult(adult);
              }}
              targetSlide={handleTargetSlide}
              adultSlideIndex={adultSlideIndex}
              underAgeSlideIndex={underAgeSlideIndex}
            />
          </SwiperSlide>
          {showAgeSlide && (
            <SwiperSlide>
              <AgeVerificationSlide
                state={ageCheckState || 'required'}
                regionName={regionName}
                providerName={eligibilityStatus?.provider ? 'Yoti' : undefined}
                onStart={launchYoti}
                onRetry={launchYoti}
                onContinue={() => {
                  setAgeCheckState(null);
                  swiperRef.current?.slideTo(readySlideIndex, 0);
                }}
                onContactSupport={openSupport}
                onLogout={handleLogoutCommon}
                verifying={verifyingAgeGate}
                fakeModeEnabled={fakeModeEnabled}
                lastSessionId={lastYotiSessionId}
                onRefreshResult={refreshYotiResult}
                onSimulatePass={() => simulateYotiResult('success')}
                onSimulateFail={() => simulateYotiResult('failed')}
                onSimulateInconclusive={() => simulateYotiResult('canceled')}
              />
            </SwiperSlide>
          )}
          <SwiperSlide>
            <ReadySlide
              onFinish={handleFinish}
              isCompleting={completeOnboarding.isPending}
              onStartPersonalProfile={handleStartPersonalProfile}
              onMarkOnboarded={markOnboarded}
            />
          </SwiperSlide>
          <SwiperSlide>
            <UnderAgeSlide />
          </SwiperSlide>
        </Swiper>
      </IonContent>
    </IonPage>
  );
};

export default OnboardingV2;
