import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { IonApp } from '@ionic/react';

const {
  mockCurrentProfileState,
  mockModerationState,
  mockPresentAlert,
  mockPresentModal,
  mockDismissModal,
  mockUpdateCurrentUserProfile,
  mockGetCurrentPositionSmart,
  mockIonModalProps,
  mockReverseGeocode,
  mockCheckPermissions,
  sharedSwiper,
} = vi.hoisted(() => ({
  mockCurrentProfileState: {
    value: {
      name: 'Alex',
      nickname: 'Alex',
      pronouns: 'They/Them',
      location: 'Brooklyn',
      coordinates_near: 'Brooklyn',
      location_point_lat: 40.6,
      location_point_long: -73.9,
      looking_for: ['friendship'],
      gender_sexuality_choices: ['woman'],
      settings_show_gender_sexuality: true,
      lived_experiences: ['poc'],
      settings_show_lived_experiences: true,
      covid_precautions: [18],
      covid_precaution_info: '',
      pic1_main: '/pic1.png',
      pic2: '/pic2.png',
      pic2_caption: 'Park day',
      pic3: '/pic3.png',
      pic3_caption: 'Masked meetup',
      bio: 'Hi there',
      settings_community_profile: true,
    } as any,
  },
  mockModerationState: {
    value: { paused_on_creation: false } as any,
  },
  mockPresentAlert: vi.fn(),
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  mockUpdateCurrentUserProfile: vi.fn().mockResolvedValue({ status: 204 }),
  mockGetCurrentPositionSmart: vi.fn(),
  mockIonModalProps: [] as any[],
  mockReverseGeocode: vi.fn(),
  mockCheckPermissions: vi.fn(),
  sharedSwiper: {
    slideNext: vi.fn(),
    slidePrev: vi.fn(),
  },
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    useIonAlert: () => [mockPresentAlert, vi.fn()],
    useIonModal: (_component: any, props: any) => {
      mockIonModalProps.push(props);
      return [mockPresentModal, mockDismissModal];
    },
    useIonPopover: () => [vi.fn(), vi.fn()],
  };
});

vi.mock('swiper/react', async () => ({
  useSwiper: () => sharedSwiper,
}));

vi.mock('swiper/css', () => ({}));
vi.mock('swiper/css/effect-cards', () => ({}));
vi.mock('swiper/css/navigation', () => ({}));

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: () => ({ data: mockCurrentProfileState.value }),
}));

vi.mock('../hooks/api/profiles/current-moderation', () => ({
  useGetCurrentModeration: () => ({ data: mockModerationState.value }),
}));

vi.mock('../hooks/utilities', () => ({
  getCurrentUserProfile: vi.fn().mockImplementation(async () => mockCurrentProfileState.value),
  updateCurrentUserProfile: (...args: any[]) => mockUpdateCurrentUserProfile(...args),
  uploadPhoto: vi.fn().mockResolvedValue(undefined),
  onImgError: vi.fn(),
}));

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    checkPermissions: (...args: any[]) => mockCheckPermissions(...args),
  },
}));

vi.mock('@capgo/nativegeocoder', () => ({
  NativeGeocoder: {
    reverseGeocode: (...args: any[]) => mockReverseGeocode(...args),
  },
}));

vi.mock('../hooks/geolocationUtilities', () => ({
  getCurrentPositionSmart: (...args: any[]) => mockGetCurrentPositionSmart(...args),
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

vi.mock('./CroppedImageModal', () => ({
  default: () => <div>cropped-image-modal</div>,
}));

vi.mock('./CaptionsSelect', () => ({
  default: () => <div>captions-select</div>,
}));

vi.mock('./StayPausedModal', () => ({
  default: () => <div>stay-paused-modal</div>,
}));

vi.mock('./CitySelectorModal', () => ({
  default: () => <div>city-selector-modal</div>,
}));

import OnboardingCardName from './OnboardingCardName';
import OnboardingCardPronouns from './OnboardingCardPronouns';
import OnboardingCardLocationCoords from './OnboardingCardLocationCoords';
import OnboardingCardLocationLabel from './OnboardingCardLocationLabel';
import OnboardingCardLookingFor from './OnboardingCardLookingFor';
import OnboardingCardGenderIdentity from './OnboardingCardGenderIdentity';
import OnboardingCardLivedExperiences from './OnboardingCardLivedExperiences';
import OnboardingCardCovid from './OnboardingCardCovid';
import OnboardingCardProfilePic from './OnboardingCardProfilePic';
import OnboardingCardPictures from './OnboardingCardPictures';
import OnboardingCardBio from './OnboardingCardBio';
import OnboardingCardLetsTalkAbout from './OnboardingCardLetsTalkAbout';
import OnboardingCardConnectFromRefreshments from './OnboardingCardConnectFromRefreshments';
import OnboardingCardDone from './OnboardingCardDone';
import { ONBOARDING_COPY } from '../constants/onboarding';

const renderInApp = async (ui: React.ReactNode) => {
  await act(async () => {
    render(<IonApp>{ui}</IonApp>);
    await Promise.resolve();
  });
};

const getReactProps = (el: HTMLElement) => {
  const key = Object.keys(el).find((entry) => entry.startsWith('__reactProps'));
  return key ? (el as any)[key] : undefined;
};

const clickElement = async (el: HTMLElement | null) => {
  if (!el) return;
  const onClick = getReactProps(el)?.onClick;
  if (typeof onClick === 'function') {
    await act(async () => {
      await onClick({ preventDefault: vi.fn() });
    });
    return;
  }
  fireEvent.click(el);
};

const triggerIonInput = async (el: HTMLElement, value: any) => {
  const onIonInput = getReactProps(el)?.onIonInput;
  if (typeof onIonInput === 'function') {
    await act(async () => {
      await onIonInput({ detail: { value } });
    });
  }
};

const triggerIonChange = async (el: HTMLElement, detail: any) => {
  const onIonChange = getReactProps(el)?.onIonChange;
  if (typeof onIonChange === 'function') {
    await act(async () => {
      await onIonChange({ detail });
    });
    return;
  }
  await act(async () => {
    fireEvent(
      el,
      new CustomEvent('ionChange', { detail })
    );
  });
};

describe('active onboarding cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIonModalProps.length = 0;
    mockModerationState.value = { paused_on_creation: false };
    mockCheckPermissions.mockResolvedValue({ location: 'granted' });
    mockGetCurrentPositionSmart.mockResolvedValue({
      coords: { latitude: 40.7128, longitude: -74.006 },
    });
    mockReverseGeocode.mockResolvedValue({
      addresses: [{ locality: 'New York', countryName: 'United States' }],
    });
    mockCurrentProfileState.value = {
      name: 'Alex',
      nickname: 'Alex',
      pronouns: 'They/Them',
      location: 'Brooklyn',
      coordinates_near: 'Brooklyn',
      location_point_lat: 40.6,
      location_point_long: -73.9,
      looking_for: ['friendship'],
      gender_sexuality_choices: ['woman'],
      settings_show_gender_sexuality: true,
      lived_experiences: ['poc'],
      settings_show_lived_experiences: true,
      covid_precautions: [18],
      covid_precaution_info: '',
      pic1_main: '/pic1.png',
      pic2: '/pic2.png',
      pic2_caption: 'Park day',
      pic3: '/pic3.png',
      pic3_caption: 'Masked meetup',
      bio: 'Hi there',
      settings_community_profile: true,
    };
  });

  it('renders the shared name card copy', async () => {
    await renderInApp(<OnboardingCardName />);
    expect(screen.getByText(ONBOARDING_COPY.cards.name.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.name.bodyPrimary)).toBeInTheDocument();
  });

  it('renders the shared pronouns card copy', async () => {
    mockCurrentProfileState.value = {
      ...mockCurrentProfileState.value,
      pronouns: 'ze/zir',
    };

    await renderInApp(<OnboardingCardPronouns />);
    expect(screen.getByText(ONBOARDING_COPY.cards.pronouns.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.pronouns.customLabel)).toBeInTheDocument();
  });

  it('clears custom pronouns for the prefer-not-to-say branch', async () => {
    mockCurrentProfileState.value = {
      ...mockCurrentProfileState.value,
      pronouns: 'xe/xem',
    };

    await renderInApp(<OnboardingCardPronouns />);

    const select = document.querySelector('ion-select') as HTMLElement;
    expect(screen.getByText(ONBOARDING_COPY.cards.pronouns.customLabel)).toBeInTheDocument();

    await triggerIonChange(select, { value: 'Prefer not to say' });
    await clickElement(screen.getByText(ONBOARDING_COPY.common.next).closest('ion-button'));

    expect(mockUpdateCurrentUserProfile).toHaveBeenCalledWith({ pronouns: '' });
    expect(sharedSwiper.slideNext).toHaveBeenCalled();
  });

  it('renders the shared location coords card copy', async () => {
    await renderInApp(<OnboardingCardLocationCoords />);
    expect(screen.getByText(ONBOARDING_COPY.cards.locationCoords.personal.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.locationCoords.personal.useLocation)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.locationCoords.personal.chooseCity)).toBeInTheDocument();
  });

  it('renders the community-specific location coords copy', async () => {
    await renderInApp(<OnboardingCardLocationCoords flow="community" />);
    expect(screen.getByText(ONBOARDING_COPY.cards.locationCoords.community.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.locationCoords.community.useLocation)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.locationCoords.community.chooseCity)).toBeInTheDocument();
  });

  it('shows the saved-coordinates note and denied-permission alert branch', async () => {
    mockCheckPermissions.mockResolvedValue({ location: 'denied' });

    await renderInApp(<OnboardingCardLocationCoords />);
    expect(screen.getByText(ONBOARDING_COPY.cards.locationCoords.personal.coordsSaved)).toBeInTheDocument();

    await clickElement(screen.getByText(ONBOARDING_COPY.cards.locationCoords.personal.useLocation).closest('ion-button'));

    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        header: ONBOARDING_COPY.cards.locationCoords.personal.deniedHeader,
      })
    );
  });

  it('opens the city selector and supports declining coordinates', async () => {
    await renderInApp(<OnboardingCardLocationCoords />);

    await clickElement(screen.getByText(ONBOARDING_COPY.cards.locationCoords.personal.chooseCity).closest('ion-button'));
    expect(mockPresentModal).toHaveBeenCalled();

    await clickElement(screen.getByText(ONBOARDING_COPY.cards.locationCoords.personal.dontShare).closest('ion-button'));
    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        header: ONBOARDING_COPY.cards.locationCoords.personal.declineHeader,
      })
    );
  });

  it('saves coordinates from a selected city after confirming the popup', async () => {
    const onCoordsSaved = vi.fn();
    await renderInApp(<OnboardingCardLocationCoords onCoordsSaved={onCoordsSaved} />);

    await clickElement(screen.getByText(ONBOARDING_COPY.cards.locationCoords.personal.chooseCity).closest('ion-button'));

    const citySelectorProps = mockIonModalProps.at(-1);
    await act(async () => {
      await citySelectorProps.onDismiss({ name: 'Chicago, Illinois, United States', lat: 41.8781, lng: -87.6298 });
    });

    const confirmConfig = mockPresentAlert.mock.calls.at(-1)?.[0];
    await act(async () => {
      await confirmConfig.buttons[1].handler();
    });

    expect(mockUpdateCurrentUserProfile).toHaveBeenCalledWith({
      location_point_long: -87.6298,
      location_point_lat: 41.8781,
      coordinates_near: 'Chicago, Illinois, United States',
    });
    expect(onCoordsSaved).toHaveBeenCalledWith('Chicago, Illinois, United States');
    expect(sharedSwiper.slideNext).toHaveBeenCalled();
  });

  it('does not save coordinates when the city confirmation popup is canceled', async () => {
    await renderInApp(<OnboardingCardLocationCoords />);

    await clickElement(screen.getByText(ONBOARDING_COPY.cards.locationCoords.personal.chooseCity).closest('ion-button'));

    const citySelectorProps = mockIonModalProps.at(-1);
    await act(async () => {
      await citySelectorProps.onDismiss({ name: 'Seattle, Washington, United States', lat: 47.6062, lng: -122.3321 });
    });

    const confirmConfig = mockPresentAlert.mock.calls.at(-1)?.[0];
    expect(confirmConfig.buttons[0].role).toBe('cancel');

    expect(mockUpdateCurrentUserProfile).not.toHaveBeenCalled();
    expect(sharedSwiper.slideNext).not.toHaveBeenCalled();
  });

  it('saves coordinates from device location after confirming the popup', async () => {
    const onCoordsSaved = vi.fn();
    await renderInApp(<OnboardingCardLocationCoords onCoordsSaved={onCoordsSaved} />);

    await clickElement(screen.getByText(ONBOARDING_COPY.cards.locationCoords.personal.useLocation).closest('ion-button'));

    const confirmConfig = mockPresentAlert.mock.calls.at(-1)?.[0];
    expect(confirmConfig.header).toContain('New York');

    await act(async () => {
      await confirmConfig.buttons[1].handler();
    });

    expect(mockUpdateCurrentUserProfile).toHaveBeenCalledWith({
      location_point_long: -74.006,
      location_point_lat: 40.7128,
      coordinates_near: 'New York, United States',
    });
    expect(onCoordsSaved).toHaveBeenCalledWith('New York, United States');
    expect(sharedSwiper.slideNext).toHaveBeenCalled();
  });

  it('falls back to raw coordinates when reverse geocoding has no locality', async () => {
    mockReverseGeocode.mockResolvedValue({ addresses: [{}] });

    await renderInApp(<OnboardingCardLocationCoords />);

    await clickElement(screen.getByText(ONBOARDING_COPY.cards.locationCoords.personal.useLocation).closest('ion-button'));

    const confirmConfig = mockPresentAlert.mock.calls.at(-1)?.[0];
    expect(confirmConfig.header).toContain('40.713, -74.006');
  });

  it('shows the gps error popup when device lookup returns nothing', async () => {
    mockGetCurrentPositionSmart.mockResolvedValue(null);

    await renderInApp(<OnboardingCardLocationCoords />);

    await clickElement(screen.getByText(ONBOARDING_COPY.cards.locationCoords.personal.useLocation).closest('ion-button'));

    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        header: ONBOARDING_COPY.cards.locationCoords.personal.gpsErrorHeader,
      })
    );
  });

  it('shows the gps error popup when device lookup throws', async () => {
    mockGetCurrentPositionSmart.mockRejectedValue(new Error('GPS timeout'));

    await renderInApp(<OnboardingCardLocationCoords />);

    await clickElement(screen.getByText(ONBOARDING_COPY.cards.locationCoords.personal.useLocation).closest('ion-button'));

    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        header: ONBOARDING_COPY.cards.locationCoords.personal.gpsErrorHeader,
      })
    );
  });

  it('advances when the skip-without-location popup is confirmed', async () => {
    await renderInApp(<OnboardingCardLocationCoords />);

    await clickElement(screen.getByText(ONBOARDING_COPY.cards.locationCoords.personal.dontShare).closest('ion-button'));

    const declineConfig = mockPresentAlert.mock.calls.at(-1)?.[0];
    await act(async () => {
      await declineConfig.buttons[1].handler();
    });

    expect(sharedSwiper.slideNext).toHaveBeenCalled();
  });

  it('renders the shared location label card copy', async () => {
    await renderInApp(<OnboardingCardLocationLabel />);
    expect(screen.getByText(ONBOARDING_COPY.cards.locationLabel.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.locationLabel.note)).toBeInTheDocument();
  });

  it('renders the no-coordinates location-label branch and skips redundant saves', async () => {
    mockCurrentProfileState.value = {
      ...mockCurrentProfileState.value,
      location_point_lat: null,
      location_point_long: null,
      location: 'Brooklyn',
      coordinates_near: null,
    };

    await renderInApp(<OnboardingCardLocationLabel />);
    expect(screen.getByText(ONBOARDING_COPY.cards.locationLabel.withoutCoords)).toBeInTheDocument();

    await clickElement(screen.getByText(ONBOARDING_COPY.common.next).closest('ion-button'));

    expect(mockUpdateCurrentUserProfile).not.toHaveBeenCalled();
    expect(sharedSwiper.slideNext).toHaveBeenCalled();
  });

  it('prefills the location-label card from the previous step when given an initial label', async () => {
    mockCurrentProfileState.value = {
      ...mockCurrentProfileState.value,
      location: '',
      coordinates_near: '',
      location_point_lat: null,
      location_point_long: null,
    };

    await renderInApp(<OnboardingCardLocationLabel initialLocation="Chicago" />);

    const locationInput = document.querySelector<HTMLElement>('ion-input');
    expect(locationInput).not.toBeNull();
    expect(getReactProps(locationInput!)?.value).toBe('Chicago');
    expect(screen.getByText(ONBOARDING_COPY.cards.locationLabel.withoutCoords)).toBeInTheDocument();
  });

  it('renders the shared looking-for card copy and options', async () => {
    await renderInApp(<OnboardingCardLookingFor />);
    expect(screen.getByText(ONBOARDING_COPY.cards.lookingFor.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.lookingFor.options[0].label)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.lookingFor.scrollNote)).toBeInTheDocument();
    expect(screen.queryByText('Virtual Connection Only')).not.toBeInTheDocument();
  });

  it('renders the shared gender identity card copy and options', async () => {
    await renderInApp(<OnboardingCardGenderIdentity />);
    expect(screen.getByText(ONBOARDING_COPY.cards.genderIdentity.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.genderIdentity.options[0][1])).toBeInTheDocument();
  });

  it('renders the shared lived experiences card copy and options', async () => {
    await renderInApp(<OnboardingCardLivedExperiences />);
    expect(screen.getByText(ONBOARDING_COPY.cards.livedExperiences.title)).toBeInTheDocument();
    expect(screen.getAllByText(ONBOARDING_COPY.cards.livedExperiences.popover)[0]).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.livedExperiences.options[0][1])).toBeInTheDocument();
  });

  it('renders the shared covid card copy and labels', async () => {
    await renderInApp(<OnboardingCardCovid />);
    expect(screen.getByText(ONBOARDING_COPY.cards.covid.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.covid.sections.home)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.covid.noteLabel)).toBeInTheDocument();
    expect(ONBOARDING_COPY.cards.covid.notePlaceholder).toBe('Optional');
    expect(document.querySelector('ion-input')).toHaveAttribute('auto-correct', 'on');
  });

  it('renders the shared profile photo card copy', async () => {
    await renderInApp(<OnboardingCardProfilePic />);
    expect(screen.getByText(ONBOARDING_COPY.cards.profilePic.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.profilePic.skip)).toBeInTheDocument();
  });

  it('disables next without a primary profile photo and opens the skip modal', async () => {
    mockCurrentProfileState.value = {
      ...mockCurrentProfileState.value,
      pic1_main: null,
    };

    await renderInApp(<OnboardingCardProfilePic />);

    const nextButton = screen.getByText(ONBOARDING_COPY.common.next).closest('ion-button');
    expect(nextButton).toHaveAttribute('disabled');

    await clickElement(screen.getByText(ONBOARDING_COPY.cards.profilePic.skip).closest('ion-button'));
    expect(mockPresentModal).toHaveBeenCalled();
  });

  it('renders the shared extra pictures card copy', async () => {
    await renderInApp(<OnboardingCardPictures />);
    expect(screen.getByText(ONBOARDING_COPY.cards.pictures.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.pictures.skip)).toBeInTheDocument();
  });

  it('requires both extra pictures before enabling next and opens the skip modal', async () => {
    mockCurrentProfileState.value = {
      ...mockCurrentProfileState.value,
      pic2: '/pic2.png',
      pic3: null,
    };

    await renderInApp(<OnboardingCardPictures />);

    const nextButton = screen.getByText(ONBOARDING_COPY.common.next).closest('ion-button');
    expect(nextButton).toHaveAttribute('disabled');

    await clickElement(screen.getByText(ONBOARDING_COPY.cards.pictures.skip).closest('ion-button'));
    expect(mockPresentModal).toHaveBeenCalled();
  });

  it('renders the shared bio card copy', async () => {
    await renderInApp(<OnboardingCardBio />);
    expect(screen.getByText(ONBOARDING_COPY.cards.bio.title)).toBeInTheDocument();
    expect(
      screen.getByText((content, node) => node?.textContent === ONBOARDING_COPY.cards.bio.body)
    ).toBeInTheDocument();
    expect(document.querySelector('ion-textarea')).toHaveAttribute('auto-correct', 'on');
  });

  it('renders the shared lets-talk-about card copy and option labels', async () => {
    const firstLetsTalkValue = ONBOARDING_COPY.cards.letsTalkAbout.options[0].value;
    mockCurrentProfileState.value = {
      ...mockCurrentProfileState.value,
      [firstLetsTalkValue]: 'Outdoors with masks on.',
    };

    await renderInApp(<OnboardingCardLetsTalkAbout />);
    expect(screen.getByText(ONBOARDING_COPY.cards.letsTalkAbout.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.letsTalkAbout.chooseTopics)).toBeInTheDocument();
    expect(screen.getAllByText(ONBOARDING_COPY.cards.letsTalkAbout.options[0].label).length).toBeGreaterThan(0);
    expect(document.querySelector('ion-input')).toHaveAttribute('auto-correct', 'on');
  });

  it('renders the shared done card copy', async () => {
    await renderInApp(<OnboardingCardDone />);
    expect(screen.getByText(ONBOARDING_COPY.cards.done.title)).toBeInTheDocument();
    expect(screen.getByText(ONBOARDING_COPY.cards.done.refreshCta)).toBeInTheDocument();
  });

  it('renders the shared connect-from-refreshments card copy and toggle', async () => {
    await renderInApp(<OnboardingCardConnectFromRefreshments />);

    expect(
      screen.getByRole('heading', { name: ONBOARDING_COPY.communityOnboarding.connect.title })
    ).toBeInTheDocument();
    expect(screen.getAllByText(ONBOARDING_COPY.communityOnboarding.connect.toggleLabel).length).toBeGreaterThan(0);
  });

  it('supports the connect toggle on the shared card and the paused-on-creation alert path', async () => {
    mockModerationState.value = { paused_on_creation: true };

    await renderInApp(<OnboardingCardConnectFromRefreshments />);

    const toggle = document.querySelector('ion-toggle') as HTMLElement;
    await triggerIonChange(toggle, { checked: false });
    expect(mockUpdateCurrentUserProfile).toHaveBeenCalledWith({ settings_community_profile: false });

    await renderInApp(<OnboardingCardDone />);
    await clickElement(screen.getByText(ONBOARDING_COPY.cards.done.refreshCta).closest('ion-button'));
    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        subHeader: ONBOARDING_COPY.cards.done.pausedReview.subHeader,
      })
    );
  });
});
