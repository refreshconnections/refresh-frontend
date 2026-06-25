import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp } from '@ionic/react';

const {
  mockPresentAlert,
  mockPresentActionSheet,
  mockPresentPopover,
  mockPresentModal,
  mockDismissModal,
  mockHistoryPush,
  mockHistoryBlock,
  mockInvalidateQueries,
  updateCurrentUserProfile,
} = vi.hoisted(() => ({
  mockPresentAlert: vi.fn(),
  mockPresentActionSheet: vi.fn(),
  mockPresentPopover: vi.fn(),
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
  mockHistoryPush: vi.fn(),
  mockHistoryBlock: vi.fn(),
  mockInvalidateQueries: vi.fn(),
  updateCurrentUserProfile: vi.fn(),
}));

let capturedBlocker: ((location: { pathname: string }) => boolean) | undefined;
let mockCurrentProfile: any;
let mockCommunityProfile: any;

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    useIonAlert: () => [mockPresentAlert, vi.fn()],
    useIonActionSheet: () => [mockPresentActionSheet, vi.fn()],
    useIonPopover: () => [mockPresentPopover, vi.fn()],
    useIonModal: (component: any, modalProps: any) => [
      (...args: any[]) => mockPresentModal(component?.name ?? 'AnonymousModal', modalProps, ...args),
      (...args: any[]) => mockDismissModal(...args),
    ],
  };
});

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props: any) => <span data-testid="fa-icon" data-icon={String(props.icon?.iconName ?? '')} />,
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

vi.mock('react-router-dom', () => ({
  useHistory: () => ({
    push: (...args: any[]) => mockHistoryPush(...args),
    block: (cb: any) => {
      capturedBlocker = cb;
      mockHistoryBlock(cb);
      return vi.fn();
    },
  }),
}));

vi.mock('../hooks/utilities', () => ({
  updateCurrentUserProfile: (...args: any[]) => updateCurrentUserProfile(...args),
  onImgError: vi.fn(),
}));

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: () => ({ data: mockCurrentProfile }),
}));

vi.mock('../hooks/api/profiles/community-profile', () => ({
  useGetCommunityProfile: () => ({ data: mockCommunityProfile }),
}));

vi.mock('./ProfileModal', () => ({ default: function ProfileModal() { return <div>profile-modal</div>; } }));
vi.mock('./EditLocationModal', () => ({ default: function EditLocationModal() { return <div>edit-location-modal</div>; } }));
vi.mock('./CroppedImageModal', () => ({ default: function CroppedImageModal() { return <div>cropped-image-modal</div>; } }));
vi.mock('./CommunityProfileSection', () => ({ default: () => <div>community-profile-section</div> }));
vi.mock('./CommunityProfileModal', () => ({ default: function CommunityProfileModal() { return <div>community-profile-modal</div>; } }));

vi.mock('react-image-file-resizer', () => ({
  default: { imageFileResizer: vi.fn() },
}));

vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: vi.fn() },
  CameraResultType: { Base64: 'base64' },
}));

vi.mock('base64-arraybuffer', () => ({
  decode: vi.fn(),
}));

import SelfProfileV2 from './SelfProfileV2';

const requireElement = (element: Element | null, label: string) => {
  if (!element) {
    throw new Error(`Expected to find ${label}`);
  }
  return element;
};

const baseProfile = {
  name: 'Alex',
  age: 34,
  subscription_level: 'pro',
  location: 'Brooklyn, NY',
  height: "5'8",
  pronouns: 'they/them',
  bio: 'Masked and ready to meet people.',
  job: 'Designer',
  politics: 'Left',
  school: 'State University',
  kids_info: "I don't want children",
  hometown: 'Queens',
  covid_precaution_info: 'Still masking indoors.',
  looking_for: ['friendship'],
  covid_precautions: [1, 10],
  together_idea: 'Museum date',
  freetime: 'Reading',
  hobby: 'Cooking',
  petpeeve: 'Late replies',
  talent: 'Writing',
  fave_book: 'Parable of the Sower',
  fave_movie: '',
  fave_tv: '',
  fave_topic: '',
  fave_musicalartist: '',
  fave_game: '',
  fave_album: '',
  fave_sport_watch: '',
  fave_sport_play: '',
  fixation_book: '',
  fixation_movie: '',
  fixation_tv: '',
  fixation_topic: '',
  fixation_musicalartist: '',
  fixation_game: '',
  fixation_album: '',
  gender_sexuality_choices: ['queer'],
  gender_and_sexuality_info: 'Queer and trans',
  settings_show_gender_sexuality: false,
  lived_experiences: ['poc'],
  settings_show_lived_experiences: false,
  settings_profile_banner_bool: false,
  settings_profile_banner: 'happy-pride',
  username: 'alex',
  pic1_main: '/img/1.jpg',
  pic2: '/img/2.jpg',
  pic3: '/img/3.jpg',
  pic1_main_alt: 'Primary photo alt',
  pic2_alt: 'Second photo alt',
  pic2_caption: 'Second caption',
  photo_order: ['pic1_main', 'pic2', 'pic3'],
};

const renderSelfProfile = () => {
  const queryClient = new QueryClient();
  return render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <SelfProfileV2 />
      </QueryClientProvider>
    </IonApp>
  );
};

describe('SelfProfileV2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedBlocker = undefined;
    mockCurrentProfile = { ...baseProfile };
    mockCommunityProfile = { username: 'community-alex' };
    updateCurrentUserProfile.mockResolvedValue(undefined);
  });

  it('opens the preview modal and the location editor from the basics section', async () => {
    renderSelfProfile();

    fireEvent.click(screen.getByText(/See how others see your Personal Profile/));
    expect(mockPresentModal).toHaveBeenCalledWith(
      'ProfileModal',
      expect.objectContaining({
        cardData: expect.objectContaining({ name: 'Alex', bio: 'Masked and ready to meet people.' }),
        profiletype: 'self',
        yourName: 'Alex',
      })
    );

    fireEvent.click(screen.getByText('Location:').closest('ion-item')!.querySelector('ion-button') as HTMLElement);
    expect(mockPresentModal).toHaveBeenCalledWith(
      'EditLocationModal',
      expect.objectContaining({
        onDismiss: expect.any(Function),
      })
    );
  });

  it('shows all profile-card basics fields in the active basics editor', () => {
    renderSelfProfile();

    expect(screen.getByText('Height')).toBeInTheDocument();
    expect(screen.getByText("5'8")).toBeInTheDocument();
    expect(screen.getByText('Kids info')).toBeInTheDocument();
    expect(screen.getByText("I don't want children")).toBeInTheDocument();
    expect(screen.getByText('Hometown')).toBeInTheDocument();
    expect(screen.getByText('Queens')).toBeInTheDocument();
  });

  it('saves hometown from the basics section', async () => {
    const { container } = renderSelfProfile();

    const hometownItem = requireElement(Array.from(container.querySelectorAll('ion-item')).find(
      item => item.textContent?.includes('Hometown')
    ) ?? null, 'hometown item');

    fireEvent.click(requireElement(hometownItem.querySelector('ion-button'), 'hometown edit button'));

    fireEvent(
      requireElement(hometownItem.querySelector('ion-input'), 'hometown input'),
      new CustomEvent('ionInput', { detail: { value: 'Atlanta' }, bubbles: true })
    );

    await act(async () => {
      fireEvent.click(requireElement(hometownItem.querySelector('.save-button'), 'hometown save button'));
    });

    await waitFor(() => {
      expect(updateCurrentUserProfile).toHaveBeenCalledWith({
        hometown: 'Atlanta',
      });
    });
  });

  it('saves height from feet and inches selects in the basics section', async () => {
    const { container } = renderSelfProfile();

    const heightItem = requireElement(Array.from(container.querySelectorAll('ion-item')).find(
      item => item.textContent?.includes('Height')
    ) ?? null, 'height item');

    fireEvent.click(requireElement(heightItem.querySelector('ion-button'), 'height edit button'));

    const [feetSelect, inchesSelect] = Array.from(heightItem.querySelectorAll('ion-select'));
    fireEvent(
      requireElement(feetSelect ?? null, 'feet select'),
      new CustomEvent('ionChange', { detail: { value: '6' }, bubbles: true })
    );
    fireEvent(
      requireElement(inchesSelect ?? null, 'inches select'),
      new CustomEvent('ionChange', { detail: { value: '1' }, bubbles: true })
    );

    await act(async () => {
      fireEvent.click(requireElement(heightItem.querySelector('.save-button'), 'height save button'));
    });

    await waitFor(() => {
      expect(updateCurrentUserProfile).toHaveBeenCalledWith({
        height: "6'1",
      });
    });
  });

  it('saves kids info from the select in the basics section', async () => {
    const { container } = renderSelfProfile();

    const kidsItem = requireElement(Array.from(container.querySelectorAll('ion-item')).find(
      item => item.textContent?.includes('Kids info')
    ) ?? null, 'kids info item');

    fireEvent.click(requireElement(kidsItem.querySelector('ion-button'), 'kids info edit button'));

    fireEvent(
      requireElement(kidsItem.querySelector('ion-select'), 'kids info select'),
      new CustomEvent('ionChange', { detail: { value: "I'm open to having children" }, bubbles: true })
    );

    await act(async () => {
      fireEvent.click(requireElement(kidsItem.querySelector('.save-button'), 'kids info save button'));
    });

    await waitFor(() => {
      expect(updateCurrentUserProfile).toHaveBeenCalledWith({
        kids_info: "I'm open to having children",
      });
    });
  });

  it('includes a freshly updated field when preview is opened immediately afterward', async () => {
    const { container } = renderSelfProfile();

    const bioItem = Array.from(container.querySelectorAll('ion-item')).find(
      item => item.textContent?.includes('Bio')
    ) as HTMLElement;

    fireEvent.click(bioItem.querySelector('ion-button') as HTMLElement);

    const bioTextarea = container.querySelector('ion-textarea') as HTMLElement;
    fireEvent(
      bioTextarea,
      new CustomEvent('ionInput', { detail: { value: 'Updated bio for preview.' }, bubbles: true })
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Save'));
    });

    await waitFor(() => {
      expect(updateCurrentUserProfile).toHaveBeenCalledWith({
        bio: 'Updated bio for preview.',
      });
    });

    fireEvent.click(screen.getByText(/See how others see your Personal Profile/));

    expect(mockPresentModal).toHaveBeenLastCalledWith(
      'ProfileModal',
      expect.objectContaining({
        cardData: expect.objectContaining({
          bio: 'Updated bio for preview.',
        }),
      })
    );
  });

  it('persists looking-for checkbox changes immediately while editing', async () => {
    const { container } = renderSelfProfile();

    const lookingForSection = Array.from(container.querySelectorAll('ion-accordion-group')).find(
      group => group.textContent?.includes('Looking for')
    ) as HTMLElement;
    fireEvent.click(lookingForSection.querySelector('ion-button') as HTMLElement);

    const romanceRow = Array.from(lookingForSection.querySelectorAll('ion-item')).find(
      item => item.textContent?.includes('Romance')
    ) as HTMLElement;

    await act(async () => {
      fireEvent(
        romanceRow.querySelector('ion-checkbox') as Element,
        new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true })
      );
    });

    expect(updateCurrentUserProfile).toHaveBeenCalledWith({
      looking_for: ['friendship', 'romance'],
    });
  });

  it('shows the unsaved-changes guard and can leave via the alert handler', async () => {
    const { container } = renderSelfProfile();

    const bioEditButton = Array.from(container.querySelectorAll('ion-item'))
      .find(item => item.textContent?.includes('Bio'))!
      .querySelector('ion-button') as HTMLElement;

    fireEvent.click(bioEditButton);

    const bioTextarea = container.querySelector('ion-textarea') as HTMLElement;
    fireEvent(
      bioTextarea,
      new CustomEvent('ionInput', { detail: { value: 'Updated bio draft' }, bubbles: true })
    );

    expect(capturedBlocker).toBeTypeOf('function');
    act(() => {
      capturedBlocker?.({ pathname: '/store' });
    });

    const unsavedAlert = mockPresentAlert.mock.calls.at(-1)?.[0];
    expect(unsavedAlert.header).toBe('Unsaved changes');

    await act(async () => {
      unsavedAlert.buttons[0].handler();
    });

    expect(mockHistoryPush).toHaveBeenCalledWith('/store');
  });

  it('reorders photos and saves the new photo order', async () => {
    const { container } = renderSelfProfile();

    fireEvent.click(screen.getByText('Edit order'));

    const reorderGroup = container.querySelector('ion-reorder-group') as HTMLElement;
    const complete = vi.fn();

    await act(async () => {
      fireEvent(
        reorderGroup,
        new CustomEvent('ionItemReorder', {
          detail: { from: 0, to: 2, complete },
          bubbles: true,
        })
      );
    });

    expect(complete).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Save order'));

    await waitFor(() => {
      expect(updateCurrentUserProfile).toHaveBeenCalledWith({
        photo_order: ['pic2', 'pic3', 'pic1_main'],
      });
    });
  });

  it('cancels a draft photo reorder and keeps the saved order in preview', async () => {
    const { container } = renderSelfProfile();

    fireEvent.click(screen.getByText('Edit order'));

    const reorderGroup = container.querySelector('ion-reorder-group') as HTMLElement;
    await act(async () => {
      fireEvent(
        reorderGroup,
        new CustomEvent('ionItemReorder', {
          detail: { from: 0, to: 2, complete: vi.fn() },
          bubbles: true,
        })
      );
    });

    fireEvent.click(screen.getByText('Cancel'));

    expect(updateCurrentUserProfile).not.toHaveBeenCalledWith({
      photo_order: ['pic2', 'pic3', 'pic1_main'],
    });

    fireEvent.click(screen.getByText(/See how others see your Personal Profile/));
    expect(mockPresentModal).toHaveBeenLastCalledWith(
      'ProfileModal',
      expect.objectContaining({
        cardData: expect.objectContaining({
          photo_order: ['pic1_main', 'pic2', 'pic3'],
        }),
      })
    );
  });

  it('ignores no-op photo reorders and saves the original order', async () => {
    const { container } = renderSelfProfile();

    fireEvent.click(screen.getByText('Edit order'));

    const reorderGroup = container.querySelector('ion-reorder-group') as HTMLElement;
    const complete = vi.fn();

    await act(async () => {
      fireEvent(
        reorderGroup,
        new CustomEvent('ionItemReorder', {
          detail: { from: 1, to: 1, complete },
          bubbles: true,
        })
      );
    });

    expect(complete).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Save order'));

    await waitFor(() => {
      expect(updateCurrentUserProfile).toHaveBeenCalledWith({
        photo_order: ['pic1_main', 'pic2', 'pic3'],
      });
    });
  });

  it('uses the newly saved photo order when preview is opened immediately afterward', async () => {
    const { container } = renderSelfProfile();

    fireEvent.click(screen.getByText('Edit order'));

    const reorderGroup = container.querySelector('ion-reorder-group') as HTMLElement;
    await act(async () => {
      fireEvent(
        reorderGroup,
        new CustomEvent('ionItemReorder', {
          detail: { from: 2, to: 0, complete: vi.fn() },
          bubbles: true,
        })
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Save order'));
    });

    await waitFor(() => {
      expect(updateCurrentUserProfile).toHaveBeenCalledWith({
        photo_order: ['pic3', 'pic1_main', 'pic2'],
      });
    });

    fireEvent.click(screen.getByText(/See how others see your Personal Profile/));

    expect(mockPresentModal).toHaveBeenLastCalledWith(
      'ProfileModal',
      expect.objectContaining({
        cardData: expect.objectContaining({
          photo_order: ['pic3', 'pic1_main', 'pic2'],
        }),
      })
    );
  });

  it('persists the gender-and-sexuality visibility toggle immediately', async () => {
    const { container } = renderSelfProfile();

    const section = Array.from(container.querySelectorAll('ion-accordion-group')).find(
      group => group.textContent?.includes('Gender & Sexuality')
    ) as HTMLElement;
    const toggle = section.querySelector('ion-toggle') as HTMLElement;

    await act(async () => {
      fireEvent(
        toggle,
        new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true })
      );
    });

    expect(updateCurrentUserProfile).toHaveBeenCalledWith({
      settings_show_gender_sexuality: true,
    });
  });

  it('edits more gender and sexuality info', async () => {
    const { container } = renderSelfProfile();

    const section = Array.from(container.querySelectorAll('ion-accordion-group')).find(
      group => group.textContent?.includes('Gender & Sexuality')
    ) as HTMLElement;
    const infoItem = Array.from(section.querySelectorAll('ion-item')).find(
      item => item.textContent?.includes('More gender and sexuality info')
    ) as HTMLElement;

    fireEvent.click(requireElement(infoItem.querySelector('ion-button'), 'gender info edit button'));

    fireEvent(
      requireElement(infoItem.querySelector('ion-textarea'), 'gender info textarea'),
      new CustomEvent('ionInput', { detail: { value: 'Queer, trans, and nonbinary.' }, bubbles: true })
    );

    await act(async () => {
      fireEvent.click(requireElement(infoItem.querySelector('.save-button'), 'gender info save button'));
    });

    await waitFor(() => {
      expect(updateCurrentUserProfile).toHaveBeenCalledWith({
        gender_and_sexuality_info: 'Queer, trans, and nonbinary.',
      });
    });

    fireEvent.click(screen.getByText(/See how others see your Personal Profile/));

    expect(mockPresentModal).toHaveBeenLastCalledWith(
      'ProfileModal',
      expect.objectContaining({
        cardData: expect.objectContaining({
          gender_and_sexuality_info: 'Queer, trans, and nonbinary.',
        }),
      })
    );
  });

  it('persists profile banner settings immediately', async () => {
    const { container } = renderSelfProfile();

    const section = Array.from(container.querySelectorAll('ion-accordion-group')).find(
      group => group.textContent?.includes('Profile Banner')
    ) as HTMLElement;
    const toggle = section.querySelector('ion-toggle') as HTMLElement;
    const select = section.querySelector('ion-select') as HTMLElement;

    await act(async () => {
      fireEvent(
        toggle,
        new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true })
      );
    });

    await act(async () => {
      fireEvent(
        select,
        new CustomEvent('ionChange', { detail: { value: 'fresh-air' }, bubbles: true })
      );
    });

    expect(updateCurrentUserProfile).toHaveBeenCalledWith({
      settings_profile_banner_bool: true,
    });
    expect(updateCurrentUserProfile).toHaveBeenCalledWith({
      settings_profile_banner: 'fresh-air',
    });
  });

  it('opens the support alert for locked name edits and routes to Help from the alert action', async () => {
    renderSelfProfile();

    const basicsGroup = Array.from(document.querySelectorAll('ion-accordion-group')).find(
      group => group.textContent?.includes('The Basics')
    ) as HTMLElement;
    const nameInfoButton = Array.from(basicsGroup.querySelectorAll('ion-item'))
      .find(item => item.textContent?.includes('Name:'))!
      .querySelector('ion-button') as HTMLElement;

    fireEvent.click(nameInfoButton);

    const alertConfig = mockPresentAlert.mock.calls.at(-1)?.[0];
    expect(alertConfig.header).toContain('contact support');

    await act(async () => {
      alertConfig.buttons[1].handler();
    });

    expect(mockHistoryPush).toHaveBeenCalledWith('/help?prefill=name');
  });

  it('persists covid precaution checkbox changes immediately', async () => {
    const { container } = renderSelfProfile();

    const section = Array.from(container.querySelectorAll('ion-accordion-group')).find(
      group => group.textContent?.includes('Covid Behaviors')
    ) as HTMLElement;
    fireEvent.click(screen.getByText('Covid Behaviors'));
    fireEvent.click(screen.getByText('Precautions').closest('.field-header')!.querySelector('ion-button') as HTMLElement);

    const workFromHomeCheckbox = Array.from(section.querySelectorAll('ion-item'))
      .find(item => item.textContent?.includes('I work from home'))!
      .querySelector('ion-checkbox') as HTMLElement;

    await act(async () => {
      fireEvent(
        workFromHomeCheckbox,
        new CustomEvent('ionChange', { detail: { checked: false }, bubbles: true })
      );
    });

    expect(updateCurrentUserProfile).toHaveBeenCalledWith({
      covid_precautions: [10],
    });
  });

  it('opens CommunityProfileModal with the user ID when the Refreshments preview button is clicked', () => {
    mockCurrentProfile = { ...baseProfile, user: 7 };
    renderSelfProfile();

    fireEvent.click(screen.getByText(/See how others see your Refreshments Profile/));

    expect(mockPresentModal).toHaveBeenCalledWith(
      'CommunityProfileModal',
      expect.objectContaining({ userId: 7, selfPreview: true })
    );
  });

  it('shows the Create Refreshments Profile button when user has a personal profile but no refreshments handle', () => {
    mockCurrentProfile = { ...baseProfile, username: undefined, created_profile: true };
    mockCommunityProfile = { username: undefined };
    renderSelfProfile();

    expect(screen.getByText('Create Refreshments Profile')).toBeInTheDocument();
    expect(screen.queryByText('community-profile-section')).not.toBeInTheDocument();
    expect(screen.queryByText(/See how others see your Refreshments Profile/)).not.toBeInTheDocument();
  });

  it('navigates to /community-onboarding when Create Refreshments Profile is clicked', () => {
    mockCurrentProfile = { ...baseProfile, username: undefined, created_profile: true };
    mockCommunityProfile = { username: undefined };
    renderSelfProfile();

    fireEvent.click(screen.getByText('Create Refreshments Profile').closest('ion-button') as HTMLElement);

    expect(mockHistoryPush).toHaveBeenCalledWith('/community-onboarding');
  });

  it('shows neither the Create button nor the community section when the user has no personal profile and no refreshments handle', () => {
    mockCurrentProfile = { ...baseProfile, username: undefined, created_profile: false };
    mockCommunityProfile = { username: undefined };
    renderSelfProfile();

    expect(screen.queryByText('Create Refreshments Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('community-profile-section')).not.toBeInTheDocument();
  });

  it('adds a gender or sexuality choice from the checkbox editor', async () => {
    const { container } = renderSelfProfile();

    const section = Array.from(container.querySelectorAll('ion-accordion-group')).find(
      group => group.textContent?.includes('Gender & Sexuality')
    ) as HTMLElement;

    const editButton = Array.from(section.querySelectorAll('.field-header'))
      .find(header => header.textContent?.includes('Your selections'))!
      .querySelector('ion-button') as HTMLElement;
    fireEvent.click(editButton);

    const transItem = Array.from(section.querySelectorAll('ion-item'))
      .find(item => item.textContent?.trim() === 'Trans') as HTMLElement;

    await act(async () => {
      fireEvent(
        requireElement(transItem.querySelector('ion-checkbox'), 'trans checkbox'),
        new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true })
      );
    });

    expect(updateCurrentUserProfile).toHaveBeenCalledWith({
      gender_sexuality_choices: ['queer', 'trans'],
    });
  });

  it('removes a gender or sexuality choice from the checkbox editor', async () => {
    const { container } = renderSelfProfile();

    const section = Array.from(container.querySelectorAll('ion-accordion-group')).find(
      group => group.textContent?.includes('Gender & Sexuality')
    ) as HTMLElement;

    const editButton = Array.from(section.querySelectorAll('.field-header'))
      .find(header => header.textContent?.includes('Your selections'))!
      .querySelector('ion-button') as HTMLElement;
    fireEvent.click(editButton);

    const queerItem = Array.from(section.querySelectorAll('ion-item'))
      .find(item => item.textContent?.trim() === 'Queer') as HTMLElement;

    await act(async () => {
      fireEvent(
        requireElement(queerItem.querySelector('ion-checkbox'), 'queer checkbox'),
        new CustomEvent('ionChange', { detail: { checked: false }, bubbles: true })
      );
    });

    expect(updateCurrentUserProfile).toHaveBeenCalledWith({
      gender_sexuality_choices: [],
    });
  });

  it('persists lived-experiences visibility toggle immediately', async () => {
    const { container } = renderSelfProfile();

    const section = Array.from(container.querySelectorAll('ion-accordion-group')).find(
      group => group.textContent?.includes('Lived Experiences')
    ) as HTMLElement;
    const toggle = section.querySelector('ion-toggle') as HTMLElement;

    await act(async () => {
      fireEvent(
        toggle,
        new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true })
      );
    });

    expect(updateCurrentUserProfile).toHaveBeenCalledWith({
      settings_show_lived_experiences: true,
    });
  });

  it('deletes a photo and pauses the profile when only three photos remain', async () => {
    renderSelfProfile();

    fireEvent.click(screen.getByText('Photos'));
    fireEvent.click(screen.getByText('Second caption').closest('ion-item') as HTMLElement);

    const actionSheet = mockPresentActionSheet.mock.calls.at(-1)?.[0];
    await act(async () => {
      await actionSheet.buttons.find((button: any) => button.text === 'Delete photo').handler();
    });

    const confirmAlert = mockPresentAlert.mock.calls.at(-1)?.[0];
    expect(confirmAlert.header).toContain('pause your profile');

    await act(async () => {
      await confirmAlert.buttons.find((button: any) => button.text === 'Delete').handler();
    });

    expect(updateCurrentUserProfile).toHaveBeenCalledWith({
      pic2: null,
      paused_profile: true,
    });
  });

  it('deletes a photo without pausing when more than three photos remain', async () => {
    mockCurrentProfile = {
      ...baseProfile,
      pic4: '/img/4.jpg',
    };

    renderSelfProfile();

    fireEvent.click(screen.getByText('Photos'));
    fireEvent.click(screen.getByText('Second caption').closest('ion-item') as HTMLElement);

    const actionSheet = mockPresentActionSheet.mock.calls.at(-1)?.[0];
    await act(async () => {
      await actionSheet.buttons.find((button: any) => button.text === 'Delete photo').handler();
    });

    expect(updateCurrentUserProfile).toHaveBeenCalledWith({
      pic2: null,
    });
  });

  it('edits a photo caption in the larger modal editor', async () => {
    renderSelfProfile();

    fireEvent.click(screen.getByText('Photos'));
    fireEvent.click(screen.getByText('Second caption').closest('ion-item') as HTMLElement);

    const actionSheet = mockPresentActionSheet.mock.calls.at(-1)?.[0];
    await act(async () => {
      await actionSheet.buttons.find((button: any) => button.text === 'Edit caption').handler();
    });

    expect(screen.getByText('Edit caption')).toBeInTheDocument();

    const textarea = document.querySelector('ion-textarea') as HTMLElement;
    fireEvent(
      textarea,
      new CustomEvent('ionInput', { detail: { value: 'Could use a buddy for this!' }, bubbles: true })
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Save'));
    });

    await waitFor(() => {
      expect(updateCurrentUserProfile).toHaveBeenCalledWith({
        pic2_caption: 'Could use a buddy for this!',
      });
    });
  });

  it('edits photo alt text in the larger modal editor', async () => {
    renderSelfProfile();

    fireEvent.click(screen.getByText('Photos'));
    fireEvent.click(screen.getByText('Second caption').closest('ion-item') as HTMLElement);

    const actionSheet = mockPresentActionSheet.mock.calls.at(-1)?.[0];
    await act(async () => {
      await actionSheet.buttons.find((button: any) => button.text === 'Edit alt text').handler();
    });

    expect(screen.getByText('Edit alt text')).toBeInTheDocument();

    const textarea = document.querySelector('ion-textarea') as HTMLElement;
    fireEvent(
      textarea,
      new CustomEvent('ionInput', { detail: { value: 'Me smiling outside with a blue sky behind me.' }, bubbles: true })
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Save'));
    });

    await waitFor(() => {
      expect(updateCurrentUserProfile).toHaveBeenCalledWith({
        pic2_alt: 'Me smiling outside with a blue sky behind me.',
      });
    });
  });
});
