import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';

const {
  mockInvalidateQueries,
  mockApiPatch,
  mockUpdateCurrentUserProfile,
} = vi.hoisted(() => ({
  mockInvalidateQueries: vi.fn(),
  mockApiPatch: vi.fn().mockResolvedValue({}),
  mockUpdateCurrentUserProfile: vi.fn().mockResolvedValue({ status: 204 }),
}));

let mockCurrentProfile: any;
let mockCommunityProfile: any;

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    useIonModal: () => [vi.fn(), vi.fn()],
  };
});

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: (...args: any[]) => mockInvalidateQueries(...args),
    }),
  };
});

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: () => ({ data: mockCurrentProfile }),
}));

vi.mock('../hooks/api/profiles/community-profile', () => ({
  useGetCommunityProfile: () => ({
    data: mockCommunityProfile,
    refetch: vi.fn().mockResolvedValue({ data: mockCommunityProfile }),
  }),
}));

vi.mock('../hooks/api/api-client', () => ({
  apiClient: {
    patch: (...args: any[]) => mockApiPatch(...args),
  },
}));

vi.mock('../hooks/utilities', () => ({
  getPrimaryOrderedPhoto: (profile: any) => profile?.pic1_main ?? null,
  normalizeLocalMediaUrl: (value: string | null | undefined) => value ?? null,
  onImgError: vi.fn(),
  updateCurrentUserProfile: (...args: any[]) => mockUpdateCurrentUserProfile(...args),
  uploadCommunityProfilePhoto: vi.fn(),
}));

vi.mock('./CroppedImageModal', () => ({
  default: () => <div>cropped-image-modal</div>,
}));

vi.mock('./EditUsernameModal', () => ({
  default: () => <div>edit-username-modal</div>,
}));

import CommunityProfileSection from './CommunityProfileSection';

const renderSection = () => render(
  <IonApp>
    <CommunityProfileSection />
  </IonApp>
);

describe('CommunityProfileSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentProfile = {
      username: 'alex',
      pic1_main: '/img/personal.jpg',
      settings_community_profile: true,
      location: 'Brooklyn',
      age: 32,
    };
    mockCommunityProfile = {
      username: 'alex-refresh',
      community_profile_pic: null,
      use_personal_profile_picture: true,
      community_bio: '',
      show_location: false,
      show_age_tier: 'exact',
    };
  });

  it('shows the default Refreshments avatar when personal photo use is turned off and there is no community photo', async () => {
    renderSection();

    const avatar = screen.getByAltText('Refreshments profile');
    expect(avatar).toHaveAttribute('src', '/img/personal.jpg');

    const toggle = document.querySelector('ion-toggle') as HTMLElement;
    await act(async () => {
      fireEvent(toggle, new CustomEvent('ionChange', { detail: { checked: false }, bubbles: true }));
    });

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith('/api/profiles/community_profile/', {
        use_personal_profile_picture: false,
      });
    });

    expect(screen.getByAltText('Refreshments profile')).toHaveAttribute(
      'src',
      '../static/img/navynobordervector.png'
    );
  });
});
