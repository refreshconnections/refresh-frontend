import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp } from '@ionic/react';

const { mockPresentPopover } = vi.hoisted(() => ({
  mockPresentPopover: vi.fn(),
}));

let mockCurrentProfile: any;
let mockCurrentStreak: any;

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonApp: ({ children }: any) => <div>{children}</div>,
    useIonPopover: () => [mockPresentPopover, vi.fn()],
  };
});

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props: any) => <span data-testid="fa-icon" data-icon={String(props.icon?.iconName ?? '')} />,
}));

vi.mock('swiper/react', () => ({
  Swiper: ({ children, onInit }: any) => {
    onInit?.({ slideTo: vi.fn() });
    return <div data-testid="swiper">{children}</div>;
  },
  SwiperSlide: ({ children }: any) => <div data-testid="swiper-slide">{children}</div>,
  useSwiper: vi.fn(),
}));

vi.mock('swiper', () => ({
  Navigation: {},
  Pagination: {},
}));

vi.mock('../hooks/utilities', () => ({
  isPersonalPlus: vi.fn(() => false),
  onImgError: vi.fn(),
  getPhotoAltKey: vi.fn((photoKey: string) => photoKey === 'pic1_main' ? 'pic1_alt' : `${photoKey}_alt`),
  somethingInLetsTalkAbout: (cardData: any) =>
    Boolean(cardData?.freetime || cardData?.hobby || cardData?.together_idea || cardData?.fave_book),
}));

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: () => ({ data: mockCurrentProfile }),
}));

vi.mock('../hooks/api/profiles/current-streak', () => ({
  useGetCurrentStreak: () => ({ data: mockCurrentStreak }),
}));

import ProfileCard from './ProfileCard';

const recentRegistrationDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

const baseCardData = {
  user: 77,
  name: 'Alex',
  pronouns: 'they/them',
  location: 'Brooklyn, NY',
  bio: 'Masked and looking for community.',
  registrationDate: '2026-04-12T12:00:00.000Z',
  pic1_main: '/img/1.jpg',
  pic1_alt: 'Primary alt text',
  pic1_main_alt: 'Primary alt text',
  pic2: '/img/2.jpg',
  pic2_alt: 'Second alt text',
  pic2_caption: 'At the park',
  pic3: '/img/3.jpg',
  pic3_caption: 'On the beach',
  photo_order: ['pic2', 'pic1_main', 'pic3'],
  settings_profile_banner_bool: true,
  subscription_level: 'pro',
  settings_profile_banner: 'happy-pride',
  age: 34,
  height: `5'8"`,
  looking_for: ['friendship', 'families'],
  kids_info: 'Parent of one',
  settings_show_lived_experiences: true,
  lived_experiences: ['poc', 'chronic_illness'],
  job: 'Designer',
  school: 'State University',
  politics: 'Left',
  hometown: 'Queens',
  gender_and_sexuality_info: 'Queer and trans',
  settings_show_gender_sexuality: true,
  gender_sexuality_choices: ['queer', 'trans'],
  covid_precaution_info: 'I still take precautions seriously.',
  covid_precautions: [10, 1, 8, 5],
  settings_show_long_covid: true,
  long_covid_choices: ['I have LC', 'I could help remote'],
  freetime: 'Reading outside',
  hobby: 'Ceramics',
  together_idea: 'Museum trip',
  fave_book: 'Parable of the Sower',
  deactivated_profile: false,
};

const renderCard = (overrides: any = {}, options: { pro?: boolean; settingsAlt?: boolean } = {}) => {
  const queryClient = new QueryClient();
  return render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <ProfileCard
          cardData={{ ...baseCardData, ...overrides }}
          pro={options.pro ?? false}
          settingsAlt={options.settingsAlt ?? false}
        />
      </QueryClientProvider>
    </IonApp>
  );
};

describe('ProfileCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentProfile = { blocked_by: [] };
    mockCurrentStreak = { streak_count: 2 };
  });

  it('renders a deactivated state when the profile is deactivated or blocked', () => {
    renderCard({ deactivated_profile: true });
    expect(screen.getByText('Deactivated')).toBeInTheDocument();
    expect(screen.getByAltText('Picture 1 null')).toBeInTheDocument();
  });

  it('renders a deactivated state when the viewer is blocked by the profile owner', () => {
    mockCurrentProfile = { blocked_by: [77] };

    renderCard();

    expect(screen.getByText('Deactivated')).toBeInTheDocument();
  });

  it('uses photo_order for the primary image and toggles alt text when settingsAlt is enabled', () => {
    const { container } = renderCard({}, { settingsAlt: true });

    const heroImage = container.querySelector('img.profilepic') as HTMLImageElement;
    expect(heroImage).toHaveAttribute('src', '/img/2.jpg');
    expect(heroImage).toHaveAttribute('alt', 'Second alt text');

    fireEvent.click(container.querySelector('.alt-desc-profile') as HTMLElement);
    expect(screen.getByText('Second alt text')).toBeInTheDocument();
  });

  it('merges partial photo_order values with remaining existing photos', () => {
    const { container } = renderCard({
      photo_order: ['pic3'],
    });

    const heroImage = container.querySelector('img.profilepic') as HTMLImageElement;
    expect(heroImage).toHaveAttribute('src', '/img/3.jpg');

    const slideImages = Array.from(container.querySelectorAll('[data-testid="swiper-slide"] img')) as HTMLImageElement[];
    expect(slideImages.map(image => image.getAttribute('src'))).toEqual(['/img/1.jpg', '/img/2.jpg']);
  });

  it('shows the new-here badge, banner art, lived experiences, and long covid support details', () => {
    const { container } = renderCard({
      registrationDate: recentRegistrationDate,
    });

    expect(screen.getByText(/I'm new here!/)).toBeInTheDocument();
    expect(container.querySelector('img[alt="Happy pride banner"]')).toBeTruthy();
    expect(screen.getByText(/POC/)).toBeInTheDocument();
    expect(screen.getByText(/Chronic illness/)).toBeInTheDocument();
    expect(screen.getByText('Long Covid Support')).toBeInTheDocument();
    expect(screen.getAllByText(/I am living with Long Covid/).length).toBeGreaterThan(0);
    expect(screen.getByText(/I could provide remote support/)).toBeInTheDocument();
  });

  it('opens looking-for popovers for the enabled icon buttons', () => {
    const { container } = renderCard({
      looking_for: ['friendship', 'housing', 'families'],
    });

    const buttons = Array.from(container.querySelectorAll('.looking-for-buttons')) as HTMLElement[];
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[2]);
    fireEvent.click(buttons[5]);

    expect(mockPresentPopover).toHaveBeenCalledTimes(3);
  });

  it('toggles alt text on secondary photos when settingsAlt is enabled', () => {
    const { container } = renderCard({}, { settingsAlt: true });

    const secondarySubtitle = container.querySelector('[data-testid="swiper-slide"] ion-card-subtitle') as HTMLElement;
    fireEvent.click(secondarySubtitle);
    expect(screen.getByText('Primary alt text')).toBeInTheDocument();

    fireEvent.click(secondarySubtitle);
    expect(screen.queryByText('Primary alt text')).not.toBeInTheDocument();
  });

  it('does not show the new-here badge for older profiles', () => {
    renderCard({
      registrationDate: '2025-01-01T12:00:00.000Z',
    });

    expect(
      screen.queryByText((_, element) => element?.textContent?.includes("I'm new here!") ?? false)
    ).not.toBeInTheDocument();
  });

  it('shows the limited let’s-talk-about upsell when the viewer is not pro and has a short streak', () => {
    renderCard();

    expect(screen.getByText(`Let's Talk About`)).toBeInTheDocument();
    expect(screen.getByText('Want to see more?')).toBeInTheDocument();
  });

  it('shows the streak explainer instead of the upsell when the viewer qualifies through streak', () => {
    mockCurrentStreak = { streak_count: 4 };
    const { container } = renderCard();

    expect(screen.queryByText('Want to see more?')).not.toBeInTheDocument();
    fireEvent.click((container.querySelector('[data-icon="star-shooting"]') as HTMLElement).closest('ion-button') as HTMLElement);
    expect(screen.getByText(/4 day streak means you can view all Let's Talk About conversation starters!/)).toBeInTheDocument();
  });

  it('resets the primary-image loading state when the card data changes', () => {
    const first = { ...baseCardData, user: 1 };
    const second = {
      ...baseCardData,
      user: 2,
      name: 'Jordan',
      photo_order: ['pic1_main'],
      pic1_main: '/img/new-primary.jpg',
      registrationDate: '2025-01-01T12:00:00.000Z',
    };

    const queryClient = new QueryClient();
    const { container, rerender } = render(
      <IonApp>
        <QueryClientProvider client={queryClient}>
          <ProfileCard cardData={first} pro={false} settingsAlt={false} />
        </QueryClientProvider>
      </IonApp>
    );

    const heroImage = container.querySelector('img.profilepic') as HTMLElement;
    fireEvent.load(heroImage);
    expect(heroImage.className).toContain('loaded');

    rerender(
      <IonApp>
        <QueryClientProvider client={queryClient}>
          <ProfileCard cardData={second} pro={false} settingsAlt={false} />
        </QueryClientProvider>
      </IonApp>
    );

    const rerenderedHeroImage = container.querySelector('img.profilepic') as HTMLElement;
    expect(rerenderedHeroImage).toHaveAttribute('src', '/img/new-primary.jpg');
    expect(rerenderedHeroImage.className).toContain('loading');
  });

  it('does not get stuck loading when card data changes but the primary image src stays the same', () => {
    const first = { ...baseCardData, user: 1, name: 'Alex One' };
    const second = {
      ...baseCardData,
      user: 1,
      name: 'Alex Two',
      bio: 'Updated profile details',
    };

    const queryClient = new QueryClient();
    const { container, rerender } = render(
      <IonApp>
        <QueryClientProvider client={queryClient}>
          <ProfileCard cardData={first} pro={false} settingsAlt={false} />
        </QueryClientProvider>
      </IonApp>
    );

    const heroImage = container.querySelector('img.profilepic') as HTMLElement;
    fireEvent.load(heroImage);
    expect(heroImage.className).toContain('loaded');

    rerender(
      <IonApp>
        <QueryClientProvider client={queryClient}>
          <ProfileCard cardData={second} pro={false} settingsAlt={false} />
        </QueryClientProvider>
      </IonApp>
    );

    const rerenderedHeroImage = container.querySelector('img.profilepic') as HTMLElement;
    expect(rerenderedHeroImage).toHaveAttribute('src', '/img/2.jpg');
    expect(rerenderedHeroImage.className).toContain('loaded');
  });

});
