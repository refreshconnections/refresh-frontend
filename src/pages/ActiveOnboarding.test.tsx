import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { IonApp } from '@ionic/react';

const {
  mockCompleteOnboardingMutate,
  mockCompleteOnboardingMutateAsync,
  mockCheckVerificationCode,
  mockPresentAlert,
  mockPresentModal,
  mockDismissModal,
  mockHandleLogoutCommon,
  mockSendPhoneVerification,
  mockUpdateCurrentUserProfile,
  mockUpdateUsername,
  mockPreferencesSet,
  mockPreferencesGet,
  mockPreferencesRemove,
  mockRouterPush,
  mockSwiperOnSlideChange,
  mockInvalidateQueries,
  mockApiPatch,
  mockRefetchCommunityProfile,
  mockUpdateCurrentUserProfileWStatus,
  mockCompleteAgeVerificationMutate,
  mockStartYotiSession,
  mockBrowserOpen,
  mockApiGet,
  mockAgeVerificationProps,
  mockWindowOpen,
  mockKeyboardAddListener,
  mockKeyboardGetResizeMode,
  mockKeyboardSetResizeMode,
  keyboardListeners,
  sharedSwiper,
} = vi.hoisted(() => ({
  mockCompleteOnboardingMutate: vi.fn(),
  mockCompleteOnboardingMutateAsync: vi.fn().mockResolvedValue(undefined),
  mockCheckVerificationCode: vi.fn().mockResolvedValue(undefined),
  mockPresentAlert: vi.fn(),
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  mockHandleLogoutCommon: vi.fn(),
  mockSendPhoneVerification: vi.fn().mockResolvedValue({ status: 200 }),
  mockUpdateCurrentUserProfile: vi.fn().mockResolvedValue({ status: 204 }),
  mockUpdateUsername: vi.fn().mockResolvedValue({ status: 204 }),
  mockPreferencesSet: vi.fn().mockResolvedValue(undefined),
  mockPreferencesGet: vi.fn().mockResolvedValue({ value: null }),
  mockPreferencesRemove: vi.fn().mockResolvedValue(undefined),
  mockRouterPush: vi.fn(),
  mockSwiperOnSlideChange: vi.fn(),
  mockInvalidateQueries: vi.fn(),
  mockApiPatch: vi.fn().mockResolvedValue({}),
  mockRefetchCommunityProfile: vi.fn(),
  mockUpdateCurrentUserProfileWStatus: vi.fn().mockResolvedValue({ status: 204 }),
  mockCompleteAgeVerificationMutate: vi.fn(),
  mockStartYotiSession: vi.fn(),
  mockBrowserOpen: vi.fn(),
  mockApiGet: vi.fn(),
  mockAgeVerificationProps: [] as any[],
  mockWindowOpen: vi.fn(),
  mockKeyboardAddListener: vi.fn(),
  mockKeyboardGetResizeMode: vi.fn().mockResolvedValue({ mode: 'native' }),
  mockKeyboardSetResizeMode: vi.fn().mockResolvedValue(undefined),
  keyboardListeners: {} as Record<string, (...args: any[]) => void>,
  sharedSwiper: {
    slideTo: vi.fn(),
    slideNext: vi.fn(),
    slidePrev: vi.fn(),
    allowSlideNext: true,
    allowSlidePrev: true,
    activeIndex: 0,
  },
}));

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
vi.stubGlobal('open', mockWindowOpen);
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
});

let mockGlobalProfile: any = {
  birth_date: null,
  registrationDate: '2020-01-01T00:00:00.000Z',
};
let mockEmailStatus: any = { phone: null };
let mockEligibilityStatus: any = {
  needs_age_verification: false,
  failed_result: false,
  region_name: null,
  provider: null,
};
let mockCurrentProfile: any = {
  created_profile: false,
  username: 'alex',
  username_last_updated: null,
  age: 34,
  location: 'Brooklyn',
  pic1_main: '/personal.png',
  settings_community_profile: true,
  paused_profile: false,
  deactivated_profile: false,
};
let mockCommunityProfile: any = {
  community_bio: 'Masked and mingling',
  community_profile_pic: '/community.png',
  show_location: true,
  use_personal_profile_picture: true,
  show_age_tier: 'exact',
};
let mockModeration: any = {
  paused_on_creation: false,
};

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonApp: ({ children }: any) => <div>{children}</div>,
    IonDatetime: ({
      children: _children,
      preferWheel: _preferWheel,
      showDefaultButtons: _showDefaultButtons,
      onIonChange,
      ...props
    }: any) => (
      <input
        data-testid="ion-datetime"
        onChange={(event: any) => onIonChange?.({ detail: { value: event.target.value } })}
        {...props}
      />
    ),
    IonDatetimeButton: ({ children, datetime: _datetime, ...props }: any) => (
      <button data-testid="ion-datetime-button" {...props}>{children}</button>
    ),
    IonModal: ({ children, keepContentsMounted: _keepContentsMounted, ...props }: any) => (
      <div data-testid="ion-modal" {...props}>{children}</div>
    ),
    useIonAlert: () => [mockPresentAlert, vi.fn()],
    useIonModal: () => [mockPresentModal, mockDismissModal],
    useIonRouter: () => ({
      push: mockRouterPush,
      goBack: vi.fn(),
      canGoBack: vi.fn(() => true),
    }),
  };
});

vi.mock('swiper/react', async () => {
  const ReactModule = await vi.importActual<typeof import('react')>('react');
  return {
    Swiper: ({ children, onSwiper, onSlideChange }: any) => {
      ReactModule.useEffect(() => {
        onSwiper?.(sharedSwiper);
      }, [onSwiper]);
      ReactModule.useEffect(() => {
        mockSwiperOnSlideChange.mockImplementation((swiperInstance: any) => onSlideChange?.(swiperInstance));
      }, [onSlideChange]);
      return <div data-testid="swiper">{children}</div>;
    },
    SwiperSlide: ({ children }: any) => <div data-testid="swiper-slide">{children}</div>,
    useSwiper: () => sharedSwiper,
  };
});

vi.mock('swiper/css', () => ({}));
vi.mock('swiper/css/pagination', () => ({}));

vi.mock('./AgeVerificationFlow', () => ({
  default: (props: any) => {
    mockAgeVerificationProps.push(props);
    return <div>age-verification-flow</div>;
  },
}));

vi.mock('../hooks/api/account/onboarding', () => ({
  useCompleteOnboarding: () => ({
    isPending: false,
    mutate: (...args: any[]) => mockCompleteOnboardingMutate(...args),
    mutateAsync: (...args: any[]) => mockCompleteOnboardingMutateAsync(...args),
  }),
}));

vi.mock('../hooks/api/account/emails', () => ({
  useEmailStatus: () => ({ data: mockEmailStatus, isLoading: false }),
}));

vi.mock('../hooks/api/profiles/global-app-current-profile', () => ({
  useGetGlobalAppCurrentProfile: () => ({ data: mockGlobalProfile }),
}));

vi.mock('../hooks/api/eligibility', () => ({
  useEligibilityStatus: () => ({ data: mockEligibilityStatus }),
  useCompleteAgeVerification: () => ({
    isPending: false,
    isSuccess: false,
    mutate: (...args: any[]) => mockCompleteAgeVerificationMutate(...args),
  }),
}));

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: () => ({ data: mockCurrentProfile }),
}));

vi.mock('../hooks/api/profiles/current-moderation', () => ({
  useGetCurrentModeration: () => ({ data: mockModeration }),
}));

vi.mock('../hooks/api/profiles/community-profile', () => ({
  useGetCommunityProfile: () => ({
    data: mockCommunityProfile,
    refetch: (...args: any[]) => mockRefetchCommunityProfile(...args),
  }),
}));

vi.mock('../hooks/api/api-client', () => ({
  apiClient: {
    patch: (...args: any[]) => mockApiPatch(...args),
  },
}));

vi.mock('../hooks/api', () => ({
  apiClient: {
    get: (...args: any[]) => mockApiGet(...args),
  },
}));

vi.mock('../hooks/api/account/yoti', () => ({
  simulateFakeYotiResultForUser: vi.fn(),
  startYotiSession: (...args: any[]) => mockStartYotiSession(...args),
}));

vi.mock('../hooks/useYotiCallbackListener', () => ({
  useYotiCallbackListener: vi.fn(),
}));

vi.mock('../utils/age-verification', () => ({
  consumeAgeCheckQuery: () => null,
}));

vi.mock('@capacitor/browser', () => ({
  Browser: { open: (...args: any[]) => mockBrowserOpen(...args) },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn().mockReturnValue(true),
    getPlatform: vi.fn().mockReturnValue('ios'),
  },
}));

vi.mock('@capacitor/keyboard', () => ({
  KeyboardResize: {
    Ionic: 'ionic',
    Native: 'native',
  },
  Keyboard: {
    addListener: (...args: any[]) => mockKeyboardAddListener(...args),
    getResizeMode: (...args: any[]) => mockKeyboardGetResizeMode(...args),
    setResizeMode: (...args: any[]) => mockKeyboardSetResizeMode(...args),
  },
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: (...args: any[]) => mockPreferencesSet(...args),
    get: (...args: any[]) => mockPreferencesGet(...args),
    remove: (...args: any[]) => mockPreferencesRemove(...args),
  },
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: (...args: any[]) => mockInvalidateQueries(...args),
    }),
  };
});

vi.mock('../hooks/utilities', () => ({
  getPrimaryOrderedPhoto: (profile: any) => {
    if (!profile) return null;
    const keys = ['pic1_main', 'pic2', 'pic3', 'pic4', 'pic5', 'pic6', 'pic7', 'pic8', 'pic9'];
    const preferredOrder = Array.isArray(profile.photo_order) && profile.photo_order.length > 0
      ? profile.photo_order
      : keys;
    const existing = keys.filter((key) => Boolean(profile[key]));
    const ordered = [
      ...preferredOrder.filter((key: string) => existing.includes(key)),
      ...existing.filter((key) => !preferredOrder.includes(key)),
    ];
    return ordered[0] ? profile[ordered[0]] : null;
  },
  checkVerificationCode: (...args: any[]) => mockCheckVerificationCode(...args),
  handleLogoutCommon: (...args: any[]) => mockHandleLogoutCommon(...args),
  sendPhoneVerification: (...args: any[]) => mockSendPhoneVerification(...args),
  setFontSizePref: vi.fn().mockResolvedValue(undefined),
  setTextZoom: vi.fn().mockResolvedValue(undefined),
  setThemePref: vi.fn().mockResolvedValue(undefined),
  updateCurrentUserProfileWStatus: (...args: any[]) => mockUpdateCurrentUserProfileWStatus(...args),
  updateCurrentUserProfile: (...args: any[]) => mockUpdateCurrentUserProfile(...args),
  updateUsername: (...args: any[]) => mockUpdateUsername(...args),
  uploadCommunityProfilePhoto: vi.fn().mockResolvedValue(undefined),
  onImgError: vi.fn(),
}));

vi.mock('../components/CroppedImageModal', () => ({
  default: () => <div>cropped-image-modal</div>,
}));

vi.mock('../components/EditLocationModal', () => ({
  default: () => <div>edit-location-modal</div>,
}));

vi.mock('../components/OnboardingCardName', () => ({
  default: () => <div>onboarding-card-name</div>,
}));

vi.mock('../components/OnboardingCardPronouns', () => ({
  default: () => <div>onboarding-card-pronouns</div>,
}));

vi.mock('../components/OnboardingCardLocationCoords', () => ({
  default: () => <div>onboarding-card-location-coords</div>,
}));

vi.mock('../components/OnboardingCardLocationLabel', () => ({
  default: () => <div>onboarding-card-location-label</div>,
}));

vi.mock('../components/OnboardingCardLookingFor', () => ({
  default: () => <div>onboarding-card-looking-for</div>,
}));

vi.mock('../components/OnboardingCardGenderIdentity', () => ({
  default: () => <div>onboarding-card-gender-identity</div>,
}));

vi.mock('../components/OnboardingCardLivedExperiences', () => ({
  default: () => <div>onboarding-card-lived-experiences</div>,
}));

vi.mock('../components/OnboardingCardCovid', () => ({
  default: () => <div>onboarding-card-covid</div>,
}));

vi.mock('../components/OnboardingCardProfilePic', () => ({
  default: () => <div>onboarding-card-profile-pic</div>,
}));

vi.mock('../components/OnboardingCardPictures', () => ({
  default: () => <div>onboarding-card-pictures</div>,
}));

vi.mock('../components/OnboardingCardBio', () => ({
  default: () => <div>onboarding-card-bio</div>,
}));

vi.mock('../components/OnboardingCardLetsTalkAbout', () => ({
  default: () => <div>onboarding-card-lets-talk-about</div>,
}));

vi.mock('../components/OnboardingCardDone', () => ({
  default: () => <div>onboarding-card-done</div>,
}));

vi.mock('../components/StayPausedModal', () => ({
  default: () => <div>stay-paused-modal</div>,
}));

import OnboardingV2 from './OnboardingV2';
import CommunityOnboarding from './CommunityOnboarding';
import PersonalProfile from './PersonalProfile';
import { ONBOARDING_COPY } from '../constants/onboarding';

const renderInApp = (ui: React.ReactNode) => render(<IonApp>{ui}</IonApp>);

describe('active onboarding pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(keyboardListeners).forEach((key) => delete keyboardListeners[key]);
    mockKeyboardAddListener.mockImplementation(async (eventName: string, listener: (...args: any[]) => void) => {
      keyboardListeners[eventName] = listener;
      return {
        remove: vi.fn(() => {
          delete keyboardListeners[eventName];
        }),
      };
    });
    mockKeyboardGetResizeMode.mockResolvedValue({ mode: 'native' });
    mockKeyboardSetResizeMode.mockResolvedValue(undefined);
    sharedSwiper.slideTo.mockClear();
    sharedSwiper.slideNext.mockClear();
    sharedSwiper.slidePrev.mockClear();
    mockSwiperOnSlideChange.mockReset();
    mockPreferencesGet.mockResolvedValue({ value: null });
    mockPreferencesSet.mockResolvedValue(undefined);
    mockPreferencesRemove.mockResolvedValue(undefined);
    mockUpdateCurrentUserProfile.mockResolvedValue({ status: 204 });
    mockUpdateCurrentUserProfileWStatus.mockResolvedValue({ status: 204 });
    mockUpdateUsername.mockResolvedValue({ status: 204 });
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockApiPatch.mockResolvedValue({});
    mockRefetchCommunityProfile.mockResolvedValue({ data: mockCommunityProfile });
    mockCompleteAgeVerificationMutate.mockReset();
    mockStartYotiSession.mockResolvedValue({ session_id: 'session-123', redirect_url: 'https://yoti.test/start' });
    mockBrowserOpen.mockResolvedValue(undefined);
    mockApiGet.mockResolvedValue({ data: { status: 'pending' } });
    mockAgeVerificationProps.length = 0;
    mockWindowOpen.mockReset();
    mockGlobalProfile = {
      birth_date: null,
      registrationDate: '2020-01-01T00:00:00.000Z',
    };
    mockEmailStatus = { phone: null };
    mockEligibilityStatus = {
      needs_age_verification: false,
      failed_result: false,
      region_name: null,
      provider: null,
    };
    mockCurrentProfile = {
      created_profile: false,
      username: 'alex',
      username_last_updated: null,
      age: 34,
      location: 'Brooklyn',
      pic1_main: '/personal.png',
      settings_community_profile: true,
      paused_profile: false,
      deactivated_profile: false,
    };
    mockCommunityProfile = {
      community_bio: 'Masked and mingling',
      community_profile_pic: '/community.png',
      show_location: true,
      use_personal_profile_picture: true,
      show_age_tier: 'exact',
    };
  });

  it('renders the active OnboardingV2 slide copy from the shared constants', () => {
    renderInApp(<OnboardingV2 />);

    expect(screen.getByText(ONBOARDING_COPY.onboardingV2.welcome.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.onboardingV2.info.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.onboardingV2.phone.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.onboardingV2.birthday.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.onboardingV2.ready.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.onboardingV2.underAge.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.onboardingV2.ready.community.cta)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.onboardingV2.ready.personal.cta)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.onboardingV2.ready.explore.cta)).toBeInTheDocument();
  });

  it('shows the age verification slide when eligibility requires it', () => {
    mockEligibilityStatus = {
      ...mockEligibilityStatus,
      needs_age_verification: true,
      region_name: 'New York',
      provider: 'yoti',
    };

    renderInApp(<OnboardingV2 />);

    expect(screen.getByText('age-verification-flow')).toBeInTheDocument();
  });

  it('supports the onboarding branch actions from the ready slide', async () => {
    renderInApp(<OnboardingV2 />);

    fireEvent.click(screen.getByText(ONBOARDING_COPY.onboardingV2.ready.personal.cta));
    await waitFor(() => {
      expect(mockCompleteOnboardingMutateAsync).toHaveBeenCalledTimes(1);
      expect(mockPresentModal).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText(ONBOARDING_COPY.onboardingV2.ready.explore.cta));
    await waitFor(() => {
      expect(mockCompleteOnboardingMutateAsync).toHaveBeenCalledTimes(2);
    });
    expect(mockCompleteOnboardingMutate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(ONBOARDING_COPY.onboardingV2.welcome.secondaryCta));
    expect(sharedSwiper.slideNext).toHaveBeenCalled();

    fireEvent.click(screen.getByText(ONBOARDING_COPY.onboardingV2.info.continueCta));
    expect(sharedSwiper.slideTo).toHaveBeenCalledWith(2);
  });

  it('renders the phone why-text branch and reuses the existing-phone path when present', () => {
    mockEmailStatus = { phone: '+19175551212' };

    renderInApp(<OnboardingV2 />);

    fireEvent.click(screen.getByText(ONBOARDING_COPY.onboardingV2.phone.whyShow));
    expect(screen.getByText(ONBOARDING_COPY.onboardingV2.phone.whyBody)).toBeInTheDocument();
    expect(screen.queryByText(ONBOARDING_COPY.onboardingV2.phone.sendCodeCta)).not.toBeInTheDocument();
    expect(document.querySelector('ion-input')?.getAttribute('disabled')).not.toBeNull();
    expect(document.querySelector('ion-input')?.getAttribute('value')).toBe('+•••••••••12');
    expect(screen.getByText('You have already verified your phone number.')).toBeInTheDocument();
  });

  it('lifts the OnboardingV2 layout when the mobile keyboard opens', async () => {
    renderInApp(<OnboardingV2 />);

    const content = document.querySelector('ion-content');
    expect(content).not.toHaveClass('onboarding-v2__content--keyboard-open');
    await waitFor(() => expect(mockKeyboardAddListener).toHaveBeenCalled());

    await act(async () => {
      keyboardListeners.keyboardWillShow?.({ keyboardHeight: 280 });
    });

    expect(content).toHaveClass('onboarding-v2__content--keyboard-open');
    expect(content).toHaveStyle('--onboarding-keyboard-offset: 280px');
    expect(mockKeyboardSetResizeMode).toHaveBeenCalledWith({ mode: 'ionic' });
  });

  it('applies the same keyboard-safe layout in CommunityOnboarding', async () => {
    renderInApp(<CommunityOnboarding />);

    const content = document.querySelector('ion-content');
    await waitFor(() => expect(mockKeyboardAddListener).toHaveBeenCalled());

    await act(async () => {
      keyboardListeners.keyboardWillShow?.({ keyboardHeight: 220 });
    });

    expect(content).toHaveClass('onboarding-v2__content--keyboard-open');
    expect(content).toHaveStyle('--onboarding-keyboard-offset: 220px');
  });

  it('routes logout actions through the shared logout helper', () => {
    renderInApp(<OnboardingV2 />);

    fireEvent.click(screen.getAllByText(ONBOARDING_COPY.common.returnToLogin)[0]);
    fireEvent.click(screen.getByText(ONBOARDING_COPY.onboardingV2.underAge.logoutCta));

    expect(mockHandleLogoutCommon).toHaveBeenCalledTimes(2);
  });

  it('sends a phone verification code and verifies it successfully', async () => {
    renderInApp(<OnboardingV2 />);

    const phoneInput = document.querySelector('input[type="tel"], input') as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: '+19175551212' } });

    fireEvent.click(screen.getByText(ONBOARDING_COPY.onboardingV2.phone.sendCodeCta));

    await waitFor(() => {
      expect(mockSendPhoneVerification).toHaveBeenCalledWith('+19175551212');
    });

    const phoneAlert = mockPresentAlert.mock.calls.at(-1)?.[0];
    expect(phoneAlert.header).toBe(ONBOARDING_COPY.onboardingV2.phone.codeAlert.header);

    await act(async () => {
      await phoneAlert.buttons[1].handler({ code: '123456' });
    });

    expect(mockCheckVerificationCode).toHaveBeenCalledWith('+19175551212', '123456');
    expect(sharedSwiper.slideTo).toHaveBeenCalledWith(3);
  });

  it('shows the in-use phone alert when phone verification returns 409', async () => {
    mockSendPhoneVerification.mockResolvedValueOnce({ status: 409 });

    renderInApp(<OnboardingV2 />);

    const phoneInput = document.querySelector('input[type="tel"], input') as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: '+19175551212' } });

    fireEvent.click(screen.getByText(ONBOARDING_COPY.onboardingV2.phone.sendCodeCta));

    await waitFor(() => {
      expect(mockSendPhoneVerification).toHaveBeenCalled();
    });
    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        header: ONBOARDING_COPY.onboardingV2.phone.inUse.header,
        message: ONBOARDING_COPY.onboardingV2.phone.inUse.message,
      })
    );
  });

  it('shows the verification failure alert when code verification throws', async () => {
    mockCheckVerificationCode.mockRejectedValueOnce(new Error('Wrong code'));

    renderInApp(<OnboardingV2 />);

    const phoneInput = document.querySelector('input[type="tel"], input') as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: '+19175551212' } });

    fireEvent.click(screen.getByText(ONBOARDING_COPY.onboardingV2.phone.sendCodeCta));

    await waitFor(() => {
      expect(mockPresentAlert).toHaveBeenCalled();
    });
    const phoneAlert = mockPresentAlert.mock.calls[0][0];

    await act(async () => {
      await phoneAlert.buttons[1].handler({ code: '000000' });
    });

    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        header: ONBOARDING_COPY.onboardingV2.phone.verificationFailed.header,
        message: 'Wrong code',
      })
    );
  });

  it('saves an adult birthday and advances after confirmation', async () => {
    renderInApp(<OnboardingV2 />);

    const datePicker = screen.getByTestId('ion-datetime');
    fireEvent.change(datePicker, { target: { value: '1990-04-12' } });

    fireEvent.click(screen.getByText(ONBOARDING_COPY.onboardingV2.birthday.saveCta));

    await waitFor(() => {
      expect(mockUpdateCurrentUserProfileWStatus).toHaveBeenCalledWith({ birth_date: '1990-04-12' });
    });

    const birthdayAlert = mockPresentAlert.mock.calls.at(-1)?.[0];
    await act(async () => {
      await birthdayAlert.buttons[1].handler();
    });

    expect(sharedSwiper.slideTo).toHaveBeenCalled();
  });

  it('launches Yoti and completes the age-verification success callback path', async () => {
    mockEligibilityStatus = {
      ...mockEligibilityStatus,
      needs_age_verification: true,
      region_name: 'New York',
      provider: 'yoti',
    };

    renderInApp(<OnboardingV2 />);

    const ageProps = mockAgeVerificationProps.at(-1);
    await act(async () => {
      await ageProps.onStart();
    });

    expect(mockStartYotiSession).toHaveBeenCalled();
    expect(mockBrowserOpen).toHaveBeenCalledWith({ url: 'https://yoti.test/start' });

    await act(async () => {
      await ageProps.onSimulatePass();
    });

    await waitFor(() => {
      expect(mockCompleteAgeVerificationMutate).toHaveBeenCalled();
    });
  });

  it('opens support from the age-verification slide and can continue after success state', async () => {
    mockEligibilityStatus = {
      ...mockEligibilityStatus,
      needs_age_verification: true,
      region_name: 'New York',
      provider: 'yoti',
    };

    renderInApp(<OnboardingV2 />);

    const ageProps = mockAgeVerificationProps.at(-1);
    await act(async () => {
      await ageProps.onContactSupport();
      await ageProps.onContinue();
    });

    expect(mockWindowOpen).toHaveBeenCalled();
    expect(sharedSwiper.slideTo).toHaveBeenCalled();
  });

  it('renders the active community onboarding slide copy from the shared constants', () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: true,
    };

    renderInApp(<CommunityOnboarding />);

    expect(screen.getByText(ONBOARDING_COPY.communityOnboarding.welcome.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.communityOnboarding.username.title)).toBeInTheDocument();
    expect(screen.getAllByText(ONBOARDING_COPY.communityOnboarding.connect.title)[0]).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.communityOnboarding.photo.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.communityOnboarding.bio.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.communityOnboarding.location.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.communityOnboarding.age.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.communityOnboarding.ready.title)).toBeInTheDocument();
    expect(screen.getAllByText(ONBOARDING_COPY.common.finishLater)[0]).toBeInTheDocument();
  });

  it('renders the no-personal-profile branch of community onboarding', () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: false,
      pic1_main: null,
      location_point_lat: null,
      location_point_long: null,
      location: '',
    };
    mockCommunityProfile = {
      ...mockCommunityProfile,
      community_profile_pic: null,
    };

    renderInApp(<CommunityOnboarding />);

    expect(
      screen.getByText(ONBOARDING_COPY.communityOnboarding.welcome.withoutPersonalProfileSecondary)
    ).toBeInTheDocument();
    expect(
      screen.getByText(ONBOARDING_COPY.communityOnboarding.location.withoutSharedCoords)
    ).toBeInTheDocument();
    expect(screen.getByText('onboarding-card-location-coords')).toBeInTheDocument();
    expect(screen.queryByText(ONBOARDING_COPY.communityOnboarding.connect.title)).not.toBeInTheDocument();
    expect(
      screen.getByText((content, node) => node?.textContent === ONBOARDING_COPY.communityOnboarding.photo.withoutPersonalPhoto)
    ).toBeInTheDocument();
    expect(screen.queryByText(ONBOARDING_COPY.communityOnboarding.location.toggleLabel)).not.toBeInTheDocument();
    expect(screen.getAllByText(ONBOARDING_COPY.common.skip).length).toBeGreaterThan(0);
    expect(screen.getByText(ONBOARDING_COPY.communityOnboarding.ready.createPersonal)).toBeInTheDocument();
    expect(screen.getByAltText('Refreshments profile placeholder')).toBeInTheDocument();
  });

  it('shows the shared-personal-location copy in community onboarding when coordinates already exist', () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: true,
      location_point_lat: 40.7128,
      location_point_long: -74.006,
    };

    renderInApp(<CommunityOnboarding />);

    expect(
      screen.getByText(ONBOARDING_COPY.communityOnboarding.location.withSharedCoords)
    ).toBeInTheDocument();
    expect(screen.queryByText('onboarding-card-location-coords')).not.toBeInTheDocument();
    expect(screen.queryByText(ONBOARDING_COPY.communityOnboarding.ready.createPersonal)).not.toBeInTheDocument();
  });

  it('shows the community location-sharing step when a personal profile exists but shared coordinates do not', () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: true,
      location_point_lat: null,
      location_point_long: null,
    };

    renderInApp(<CommunityOnboarding />);

    expect(screen.getAllByText(ONBOARDING_COPY.communityOnboarding.connect.title).length).toBeGreaterThan(0);
    expect(screen.getByText(ONBOARDING_COPY.communityOnboarding.location.withoutSharedCoords)).toBeInTheDocument();
    expect(screen.getByText('onboarding-card-location-coords')).toBeInTheDocument();
    expect(screen.queryByText(ONBOARDING_COPY.communityOnboarding.location.toggleLabel)).not.toBeInTheDocument();
  });

  it('renders the locked-username and age-hidden community branches', () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: true,
      username_last_updated: new Date().toISOString(),
      age: 19,
    };
    mockCommunityProfile = {
      ...mockCommunityProfile,
      show_age_tier: 'none',
    };

    renderInApp(<CommunityOnboarding />);

    expect(screen.getByText(ONBOARDING_COPY.communityOnboarding.username.lockedNote)).toBeInTheDocument();
    expect(screen.getByText(/Age shown on your Refreshments profile:/)).toHaveTextContent(
      `Age shown on your Refreshments profile: ${ONBOARDING_COPY.communityOnboarding.age.hideAge}`
    );
  });

  it('saves a new username and advances in community onboarding', async () => {
    renderInApp(<CommunityOnboarding />);

    const usernameInput = document.querySelector('ion-input')!;
    fireEvent(usernameInput, new CustomEvent('ionInput', { detail: { value: 'new-alex' }, bubbles: true }));

    fireEvent.click(screen.getAllByText(ONBOARDING_COPY.common.next)[1]);

    await waitFor(() => {
      expect(mockUpdateUsername).toHaveBeenCalledWith({ username: 'new-alex' });
    });
    await waitFor(() => {
      expect(sharedSwiper.slideNext).toHaveBeenCalled();
    });
  });

  it('shows the username error when community onboarding username submit fails', async () => {
    mockUpdateUsername.mockResolvedValueOnce({ status: 400 });

    renderInApp(<CommunityOnboarding />);

    const usernameInput = document.querySelector('ion-input')!;
    fireEvent(usernameInput, new CustomEvent('ionInput', { detail: { value: 'taken-name' }, bubbles: true }));

    fireEvent.click(screen.getAllByText(ONBOARDING_COPY.common.next)[1]);

    expect(await screen.findByText(ONBOARDING_COPY.communityOnboarding.username.taken)).toBeInTheDocument();
  });

  it('skips username update and advances when the same username is already set', () => {
    renderInApp(<CommunityOnboarding />);

    fireEvent.click(screen.getAllByText(ONBOARDING_COPY.common.next)[1]);

    expect(mockUpdateUsername).not.toHaveBeenCalled();
    expect(sharedSwiper.slideNext).toHaveBeenCalled();
  });

  it('persists community finish-later and final finish actions', async () => {
    const onDismiss = vi.fn();
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: true,
      onboarded: false,
    };

    renderInApp(<CommunityOnboarding onDismiss={onDismiss} />);

    fireEvent.click(screen.getAllByText(ONBOARDING_COPY.common.finishLater)[0]);
    await waitFor(() => {
      expect(mockCompleteOnboardingMutateAsync).toHaveBeenCalledTimes(1);
      expect(mockUpdateCurrentUserProfile).toHaveBeenCalledWith({ paused_profile: true, settings_community_profile: false });
    });
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText(ONBOARDING_COPY.communityOnboarding.ready.finish));
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/community', 'root', 'replace');
    });
  });

  it('persists the connect toggle and personal-photo toggle in community onboarding', async () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: true,
      settings_community_profile: true,
      pic1_main: '/personal.png',
    };
    mockCommunityProfile = {
      ...mockCommunityProfile,
      use_personal_profile_picture: true,
    };

    renderInApp(<CommunityOnboarding />);

    fireEvent(
      document.querySelectorAll('ion-toggle')[0] as HTMLElement,
      new CustomEvent('ionChange', { detail: { checked: false }, bubbles: true })
    );
    await waitFor(() => {
      expect(mockUpdateCurrentUserProfile).toHaveBeenCalledWith({ settings_community_profile: false });
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['current'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['global-current'] });

    fireEvent(
      document.querySelectorAll('ion-toggle')[1] as HTMLElement,
      new CustomEvent('ionChange', { detail: { checked: false }, bubbles: true })
    );
    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith('/api/profiles/community_profile/', {
        use_personal_profile_picture: false,
      });
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['community-profile'] });
  });

  it('enables next on the community photo step when a personal photo is in use', async () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: true,
      pic1_main: '/personal.png',
    };
    mockCommunityProfile = {
      ...mockCommunityProfile,
      community_profile_pic: null,
      use_personal_profile_picture: true,
    };

    renderInApp(<CommunityOnboarding />);

    const photoCard = screen.getByText(ONBOARDING_COPY.communityOnboarding.photo.uploadCta).closest('ion-card');
    const photoNextButton = within(photoCard as HTMLElement).getByText(ONBOARDING_COPY.common.next).closest('ion-button');
    expect(photoNextButton).toHaveAttribute('disabled', 'false');
  });

  it('disables next on the community photo step when there is no selected photo', async () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: true,
      pic1_main: '/personal.png',
    };
    mockCommunityProfile = {
      ...mockCommunityProfile,
      community_profile_pic: null,
      use_personal_profile_picture: false,
    };

    renderInApp(<CommunityOnboarding />);

    const photoCard = screen.getByText(ONBOARDING_COPY.communityOnboarding.photo.uploadCta).closest('ion-card');
    const photoNextButton = within(photoCard as HTMLElement).getByText(ONBOARDING_COPY.common.next).closest('ion-button');
    expect(photoNextButton).toHaveAttribute('disabled');
  });

  it('saves the bio, location, and age selections through the community profile patch helper', async () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: true,
      location_point_lat: 40.7128,
      location_point_long: -74.006,
    };

    renderInApp(<CommunityOnboarding />);

    const bioTextarea = document.querySelector('ion-textarea') as HTMLElement;
    fireEvent(bioTextarea, new CustomEvent('ionInput', { detail: { value: '  New community bio  ' }, bubbles: true }));
    fireEvent.click(screen.getAllByText(ONBOARDING_COPY.common.next)[5]);

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith('/api/profiles/community_profile/', {
        community_bio: 'New community bio',
      });
    });

    fireEvent(
      document.querySelectorAll('ion-toggle')[2] as HTMLElement,
      new CustomEvent('ionChange', { detail: { checked: false }, bubbles: true })
    );
    fireEvent.click(screen.getAllByText(ONBOARDING_COPY.common.next)[4]);

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith('/api/profiles/community_profile/', {
        show_location: false,
      });
    });

    fireEvent(
      document.querySelector('ion-radio-group') as HTMLElement,
      new CustomEvent('ionChange', { detail: { value: 'decade' }, bubbles: true })
    );
    fireEvent.click(screen.getAllByText(ONBOARDING_COPY.common.next)[6]);

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith('/api/profiles/community_profile/', {
        show_age_tier: 'decade',
      });
    });
  });

  it('requires a username before finishing community onboarding', async () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: true,
      username: '',
    };

    renderInApp(<CommunityOnboarding />);

    fireEvent.click(screen.getByText(ONBOARDING_COPY.communityOnboarding.ready.finish));

    expect(await screen.findByText(ONBOARDING_COPY.communityOnboarding.username.requiredToFinish)).toBeInTheDocument();
    expect(sharedSwiper.slideTo).toHaveBeenCalledWith(0, 0);
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('opens the location editor and saves location and age visibility on next', () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: true,
      location_point_lat: 40.7128,
      location_point_long: -74.006,
    };

    renderInApp(<CommunityOnboarding />);

    fireEvent.click(screen.getByText(ONBOARDING_COPY.communityOnboarding.location.editLocation));
    expect(mockPresentModal).toHaveBeenCalled();

    fireEvent(
      document.querySelectorAll('ion-toggle')[1] as HTMLElement,
      new CustomEvent('ionChange', { detail: { checked: false }, bubbles: true })
    );
    fireEvent.click(screen.getAllByText(ONBOARDING_COPY.common.next)[4]);

    fireEvent(
      document.querySelector('ion-radio-group') as HTMLElement,
      new CustomEvent('ionChange', { detail: { value: 'decade' }, bubbles: true })
    );
    fireEvent.click(screen.getAllByText(ONBOARDING_COPY.common.next)[6]);

    expect(screen.getByText(/Age shown on your Refreshments profile:/)).toHaveTextContent('30s');
  });

  it('auto-enables community location display when a label is added without shared coordinates', async () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: true,
      location_point_lat: null,
      location_point_long: null,
      location: '',
    };

    renderInApp(<CommunityOnboarding />);

    const locationInputs = document.querySelectorAll<HTMLElement>('ion-input');
    const locationInput = locationInputs[1];
    expect(locationInput).toBeDefined();
    fireEvent(locationInput!, new CustomEvent('ionInput', { detail: { value: 'Chicago, IL, USA' }, bubbles: true }));
    fireEvent.click(screen.getAllByText(ONBOARDING_COPY.common.next)[4]);

    await waitFor(() => {
      expect(mockUpdateCurrentUserProfile).toHaveBeenCalledWith({ location: 'Chicago, IL, USA' });
    });
    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith('/api/profiles/community_profile/', {
        show_location: true,
      });
    });
  });

  it('keeps community location display off when the optional no-coords label step is skipped', async () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: true,
      location_point_lat: null,
      location_point_long: null,
      location: '',
    };

    renderInApp(<CommunityOnboarding />);

    fireEvent.click(screen.getAllByText(ONBOARDING_COPY.common.skip)[1]);

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith('/api/profiles/community_profile/', {
        show_location: false,
      });
    });
  });

  it('renders the active personal profile intro copy from the shared constants', () => {
    renderInApp(<PersonalProfile />);

    expect(screen.getByText(ONBOARDING_COPY.personalProfile.intro.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.personalProfile.intro.bodyPrimary)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.personalProfile.intro.cta)).toBeInTheDocument();
    expect(screen.getAllByText(ONBOARDING_COPY.common.finishLater)[0]).toBeInTheDocument();
  });

  it('shows the connect from refreshments slide in personal onboarding when a community profile already exists', () => {
    renderInApp(<PersonalProfile />);

    expect(screen.getAllByText(ONBOARDING_COPY.communityOnboarding.connect.title).length).toBeGreaterThan(0);
    expect(screen.getAllByText(ONBOARDING_COPY.communityOnboarding.connect.toggleLabel).length).toBeGreaterThan(0);
  });

  it('completes onboarding before personal finish later when onboarded is still false', async () => {
    const onDismiss = vi.fn();
    mockCurrentProfile = {
      ...mockCurrentProfile,
      onboarded: false,
    };

    renderInApp(<PersonalProfile onDismiss={onDismiss} />);

    fireEvent.click(screen.getAllByText(ONBOARDING_COPY.common.finishLater)[0]);

    await waitFor(() => {
      expect(mockCompleteOnboardingMutateAsync).toHaveBeenCalledTimes(1);
      expect(mockUpdateCurrentUserProfile).toHaveBeenCalledWith({
        paused_profile: true,
        settings_community_profile: false,
      });
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  it('includes the location-sharing card in personal onboarding when shared coordinates do not exist', () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      location_point_lat: null,
      location_point_long: null,
    };

    renderInApp(<PersonalProfile />);

    expect(screen.getByText('onboarding-card-location-coords')).toBeInTheDocument();
    expect(screen.getByText('onboarding-card-location-label')).toBeInTheDocument();
  });

  it('skips the location-sharing card in personal onboarding when shared coordinates already exist', () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      location_point_lat: 40.7128,
      location_point_long: -74.006,
    };

    renderInApp(<PersonalProfile />);

    expect(screen.queryByText('onboarding-card-location-coords')).not.toBeInTheDocument();
    expect(screen.getByText('onboarding-card-location-label')).toBeInTheDocument();
  });

  it('skips the location-sharing card in personal onboarding when location was set during refreshments onboarding', () => {
    // Simulates the flow: account created → refreshments profile completed (sets coords) → personal profile started
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: false,
      location_point_lat: 40.7128,
      location_point_long: -74.006,
    };
    // mockCommunityProfile is already set, representing the completed refreshments profile

    renderInApp(<PersonalProfile />);

    // Location coords slide must be absent from the first render so Swiper never initialises with it
    expect(screen.queryByText('onboarding-card-location-coords')).not.toBeInTheDocument();
    expect(screen.getByText('onboarding-card-location-label')).toBeInTheDocument();
  });

  it('shows the finish-later branch on personal profile and not the connect toggle card mock', () => {
    renderInApp(<PersonalProfile />);

    expect(screen.getByText(ONBOARDING_COPY.common.finishLater)).toBeInTheDocument();
    expect(screen.getByText('onboarding-card-done')).toBeInTheDocument();
  });

  it('advances through the personal-profile intro nav button', () => {
    renderInApp(<PersonalProfile />);

    fireEvent.click(screen.getByText(ONBOARDING_COPY.personalProfile.intro.cta));
    expect(sharedSwiper.slideNext).toHaveBeenCalled();
  });

  it('restores the saved personal-profile slide for incomplete onboarding', async () => {
    mockPreferencesGet.mockResolvedValueOnce({ value: '4' });

    renderInApp(<PersonalProfile />);

    await Promise.resolve();

    expect(mockPreferencesGet).toHaveBeenCalledWith({ key: 'personal_profile_onboarding_slide' });
    expect(sharedSwiper.slideTo).toHaveBeenCalledWith(4, 0);
  });

  it('clears the saved personal-profile slide once the profile already exists', async () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: true,
    };

    renderInApp(<PersonalProfile />);

    await Promise.resolve();

    expect(mockPreferencesRemove).toHaveBeenCalledWith({ key: 'personal_profile_onboarding_slide' });
    expect(mockPreferencesGet).not.toHaveBeenCalledWith({ key: 'personal_profile_onboarding_slide' });
  });

  it('persists slide changes and supports personal-profile finish later dismissal', async () => {
    const onDismiss = vi.fn();

    renderInApp(<PersonalProfile onDismiss={onDismiss} />);

    await mockSwiperOnSlideChange({ activeIndex: 6 });

    fireEvent.click(screen.getAllByText(ONBOARDING_COPY.common.finishLater)[0]);

    expect(mockPreferencesSet).toHaveBeenCalledWith({ key: 'personal_profile_onboarding_slide', value: '6' });
    await waitFor(() => {
      expect(mockUpdateCurrentUserProfile).toHaveBeenCalledWith({ paused_profile: true, settings_community_profile: false });
    });
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  it('clears saved slide progress on slide change once the personal profile already exists', async () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      created_profile: true,
    };

    renderInApp(<PersonalProfile />);

    await mockSwiperOnSlideChange({ activeIndex: 3 });

    expect(mockPreferencesRemove).toHaveBeenCalledWith({ key: 'personal_profile_onboarding_slide' });
    expect(mockPreferencesSet).not.toHaveBeenCalledWith({ key: 'personal_profile_onboarding_slide', value: '3' });
  });
});
