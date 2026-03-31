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

const baseProfile = {
  name: 'Alex',
  age: 34,
  location: 'Brooklyn, NY',
  pronouns: 'they/them',
  bio: 'Masked and ready to meet people.',
  job: 'Designer',
  politics: 'Left',
  school: 'State University',
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
  settings_show_gender_sexuality: false,
  settings_show_long_covid: false,
  long_covid_choices: [],
  lived_experiences: ['poc'],
  settings_show_lived_experiences: false,
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

    fireEvent.click(screen.getByText(/See how others see your profile/));
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

    fireEvent.click(screen.getByText(/See how others see your profile/));

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

    fireEvent.click(screen.getByText(/See how others see your profile/));
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

    fireEvent.click(screen.getByText(/See how others see your profile/));

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
});
