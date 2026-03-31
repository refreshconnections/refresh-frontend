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
import { ONBOARDING_COPY } from '../constants/onboarding';

const WelcomeSlide: React.FC = () => {
  const swiper = useSwiper();
  const copy = ONBOARDING_COPY.onboardingV2.welcome;
  return (
    <IonContent className="onboarding-v2__slide onboarding-v2__welcome onboarding-v2__welcome-wrapper">
      <div className="onboarding-v2__welcome-content onboarding-v2__welcome-content--compact">
        <div className="onboarding-v2__welcome-hero">
          <img src="../static/img/flower-mask.png" alt="Refresh Connections" />
          <h1>{copy.title}</h1>
          <p>{copy.body}</p>
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
            {copy.primaryCta}
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
            {copy.secondaryCta}
          </IonButton>
        </div>
        <IonButton
          fill="clear"
          size="small"
          className="onboarding-v2__alt"
          onClick={handleLogoutCommon}
        >
          {ONBOARDING_COPY.common.returnToLogin}
        </IonButton>
      </div>
    </IonContent>
  );
};

const InfoSlide: React.FC = () => {
  const swiper = useSwiper();
  const copy = ONBOARDING_COPY.onboardingV2.info;
  return (
    <IonContent
      scrollY
      className="onboarding-v2__slide onboarding-v2__welcome onboarding-v2__welcome-wrapper onboarding-v2__info"
    >
      <div className="onboarding-v2__welcome-content">
        <div className="onboarding-v2__welcome-hero">
          <img src="../static/img/flower-mask.png" alt="Refresh Connections" />
          <h1>{copy.title}</h1>
        </div>
        <div
          className="onboarding-v2__welcome-details"
          style={{
            paddingLeft: 'clamp(16px, 4vw, 48px)',
            paddingRight: 'clamp(16px, 4vw, 48px)'
          }}
        >
          {copy.sections.map((section) => (
            <section className="fade-in" key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
        <IonRow className="onboarding-v2__nav">
          <IonButton color="medium" onClick={() => swiper.slidePrev()}>
            {ONBOARDING_COPY.common.back}
          </IonButton>
          <IonButton onClick={() => swiper.slideTo(2)}>{copy.continueCta}</IonButton>
        </IonRow>
        <IonButton
          fill="clear"
          size="small"
          className="onboarding-v2__alt"
          onClick={handleLogoutCommon}
        >
          {ONBOARDING_COPY.common.returnToLogin}
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
  const copy = ONBOARDING_COPY.onboardingV2.phone;

  useEffect(() => {
    setPhone(existingPhone ?? undefined);
  }, [existingPhone]);

  const handleCodeEntry = () => {
    presentAlert({
      header: copy.codeAlert.header,
      inputs: [{ name: 'code', type: 'number', placeholder: copy.codeAlert.placeholder }],
      buttons: [
        { text: copy.codeAlert.cancel, role: 'cancel' },
        {
          text: copy.codeAlert.verify,
          handler: async ({ code }) => {
            try {
              await checkVerificationCode(phone!, code);
              onComplete();
              swiper.slideTo(3);
            } catch (verificationError: any) {
              presentError({
                header: copy.verificationFailed.header,
                message: verificationError?.message || copy.verificationFailed.fallback,
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
      setError(copy.invalidError);
      return;
    }
    setError(null);
    try {
      const response = await sendPhoneVerification(phone);
      if (response.status === 200) {
        handleCodeEntry();
      } else if (response.status === 409) {
        presentError({
          header: copy.inUse.header,
          message: copy.inUse.message,
          buttons: ['OK']
        });
      } else if (response.status === 429) {
        presentError({
          header: copy.tooManyAttempts.header,
          message: copy.tooManyAttempts.message,
          buttons: ['OK']
        });
      } else {
        presentError({
          header: copy.unableToSend.header,
          message: response?.data || copy.unableToSend.fallback,
          buttons: ['OK']
        });
      }
    } catch (err: any) {
      presentError({
        header: copy.unableToSend.header,
        message: err?.message || copy.unableToSend.fallback,
        buttons: ['OK']
      });
    }
  };

  return (
    <div className="onboarding-v2__slide">
      <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
        <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
          <IonCardTitle>{copy.title}</IonCardTitle>
          <p>{copy.body}</p>
          <div className="onboarding-v2__input-wrapper">
            <IonItem lines="none" className="onboarding-v2__input onboarding-v2__input--card">
              {loading ? (
                <IonSpinner />
              ) : (
                <PhoneInput
                  placeholder={copy.placeholder}
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
              {showWhy ? copy.whyHide : copy.whyShow}
            </IonButton>
            {showWhy && (
              <IonText color="medium">{copy.whyBody}</IonText>
            )}
          </div>
        </IonCardContent>
        <div className="onboarding-v2__card-footer">
          <IonRow className="onboarding-v2__nav">
            <IonButton color="medium" onClick={() => swiper.slidePrev()}>
              {ONBOARDING_COPY.common.back}
            </IonButton>
            {existingPhone ? (
              <IonButton onClick={() => swiper.slideNext()} disabled={loading}>
                {copy.existingPhoneCta}
              </IonButton>
            ) : (
              <IonButton onClick={handleSendCode} disabled={!phone || loading}>
                {copy.sendCodeCta}
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
  const copy = ONBOARDING_COPY.onboardingV2.birthday;

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
          header: `${age}${copy.confirm.suffix}`,
          buttons: [
            { text: copy.confirm.cancel, role: 'cancel' },
            {
              text: copy.confirm.confirm,
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
          <IonCardTitle>{copy.title}</IonCardTitle>
          <p>{copy.body}</p>
          <div className="onboarding-v2__input-wrapper">
            <IonItem className="onboarding-v2__input" lines="none">
              <IonLabel color={birthday ? 'dark' : 'medium'}>
                {birthday?.split('T')[0] || copy.emptyLabel}
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
              {showWhy ? copy.whyHide : copy.whyShow}
            </IonButton>
            {showWhy && (
              <IonText color="medium">{copy.whyBody}</IonText>
            )}
          </div>
        </IonCardContent>
        <div className="onboarding-v2__card-footer">
          <IonRow className="onboarding-v2__nav">
            <IonButton color="medium" onClick={() => swiper.slidePrev()}>
              {ONBOARDING_COPY.common.back}
            </IonButton>
            <IonButton
              onClick={saveBirthday}
              disabled={!hasBirthday || submitting}
              className="onboarding-v2__primary-action"
            >
              <span className={`onboarding-v2__button-label ${submitting ? 'loading' : ''}`}>
                {copy.saveCta}
              </span>
              {submitting && <IonSpinner name="dots" className="onboarding-v2__button-spinner" />}
            </IonButton>
          </IonRow>
        </div>
      </IonCard>
    </div>
  );
};

const UnderAgeSlide: React.FC = () => {
  const copy = ONBOARDING_COPY.onboardingV2.underAge;
  return (
  <div className="onboarding-v2__slide onboarding-v2__ready">
    <IonCard className="onboarding-v2__card onboarding-v2__card--shallow">
      <IonCardContent className="onboarding-v2__card-body onboarding-v2__card-body--tight">
        <IonCardTitle>{copy.title}</IonCardTitle>
        <p>{copy.body}</p>
        <p>
          {copy.contactPrefix}
          <a href={`mailto:${copy.contactEmail}`}>{copy.contactEmail}</a>.
        </p>
        <IonButton expand="block" onClick={handleLogoutCommon}>
          {copy.logoutCta}
        </IonButton>
      </IonCardContent>
    </IonCard>
  </div>
  );
};

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
  const copy = ONBOARDING_COPY.onboardingV2.ready;
  return (
    <div className="onboarding-v2__slide onboarding-v2__ready">
      <IonCard className="onboarding-v2__card">
        <IonCardContent>
          <IonCardTitle>{copy.title}</IonCardTitle>
          <div className="onboarding-v2__ready-options">
            <div className="onboarding-v2__option">
              <h2>{copy.community.title}</h2>
              <p>{copy.community.body}</p>
              <IonButton
                expand="block"
                disabled={isCompleting}
                onClick={(event) => {
                  onMarkOnboarded?.();
                  onFinish('/community-onboarding', event);
                }}
              >
                {isCompleting ? <IonSpinner name="dots" /> : copy.community.cta}
              </IonButton>
            </div>
    
            <div className="onboarding-v2__option">
              <h2>{copy.personal.title}</h2>
              <p>{copy.personal.body}</p>
            <IonButton
              expand="block"
              disabled={isCompleting}
              onClick={() => {
                onMarkOnboarded?.();
                onStartPersonalProfile();
              }}
            >
              {isCompleting ? <IonSpinner name="dots" /> : copy.personal.cta}
            </IonButton>
            </div>
            <div className="onboarding-v2__option">
              <h2>{copy.explore.title}</h2>
              <p>{copy.explore.body}</p>
              <IonButton
                expand="block"
                fill="outline"
                disabled={isCompleting}
                onClick={(event) => {
                  onMarkOnboarded?.();
                  onFinish('/community', event);
                }}
              >
                {isCompleting ? <IonSpinner name="dots" /> : copy.explore.cta}
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
