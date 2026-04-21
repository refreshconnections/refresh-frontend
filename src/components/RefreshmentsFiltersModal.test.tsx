import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp } from '@ionic/react';
import { DEFAULT_EVENT_FILTERS } from '../hooks/api/events';

const {
  preferencesGet,
  preferencesSet,
  addSavedLocation,
  deleteSavedLocation,
  invalidateQueries,
  mockPresentAlert,
  mockPresentModal,
  mockDismissModal,
} = vi.hoisted(() => ({
  preferencesGet: vi.fn(),
  preferencesSet: vi.fn(),
  addSavedLocation: vi.fn(),
  deleteSavedLocation: vi.fn(),
  invalidateQueries: vi.fn(),
  mockPresentAlert: vi.fn(),
  mockPresentModal: vi.fn(),
  mockDismissModal: vi.fn(),
}));

let mockCurrentProfile: any;
let mockSavedLocations: any;

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonApp: ({ children }: any) => <div>{children}</div>,
    useIonAlert: () => [mockPresentAlert, vi.fn()],
    useIonModal: (_component: any, modalProps: any) => [
      () => mockPresentModal(modalProps),
      (...args: any[]) => mockDismissModal(...args),
    ],
  };
});

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: (...args: any[]) => preferencesGet(...args),
    set: (...args: any[]) => preferencesSet(...args),
  },
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: (...args: any[]) => invalidateQueries(...args),
    }),
  };
});

vi.mock('../hooks/utilities', () => ({
  addSavedLocation: (...args: any[]) => addSavedLocation(...args),
  deleteSavedLocation: (...args: any[]) => deleteSavedLocation(...args),
  isCommunityPlus: vi.fn((level: string) => level === 'communityplus' || level === 'pro'),
  isPro: vi.fn((level: string) => level === 'pro'),
}));

vi.mock('../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: () => ({ data: mockCurrentProfile }),
}));

vi.mock('../hooks/api/profiles/current-streak', () => ({
  useGetCurrentStreak: () => ({ data: { streak_count: 5 } }),
}));

vi.mock('../hooks/api/profiles/saved-locations', () => ({
  useGetSavedLocations: () => mockSavedLocations,
}));

vi.mock('./CitySelectorModal', () => ({
  default: () => <div>city-selector-modal</div>,
}));

vi.mock('./EditLocationModal', () => ({
  default: () => <div>edit-location-modal</div>,
}));

vi.mock('./EventFiltersSection', () => ({
  default: ({ filters, onChange }: any) => (
    <div>
      <div>event-types:{filters.eventTypes.join(',')}</div>
      <button
        onClick={() =>
          onChange({
            eventTypes: ['online'],
            attendeePrecautionPreferences: ['masked'],
            inPersonPrecautions: ['outdoors'],
          })
        }
      >
        change-event-filters
      </button>
    </div>
  ),
}));

import RefreshmentsFiltersModal from './RefreshmentsFiltersModal';

const renderModal = (overrides?: Partial<React.ComponentProps<typeof RefreshmentsFiltersModal>>) => {
  const queryClient = new QueryClient();
  const onDismiss = vi.fn();
  const onNavigate = vi.fn();

  const props = {
    barsProp: 'all',
    radiusProp: 45,
    localProp: true,
    sortProp: 'recent',
    onDismiss,
    onNavigate,
    ...overrides,
  };

  return {
    onDismiss,
    onNavigate,
    ...render(
      <IonApp>
        <QueryClientProvider client={queryClient}>
          <RefreshmentsFiltersModal {...props} />
        </QueryClientProvider>
      </IonApp>
    ),
  };
};

describe('RefreshmentsFiltersModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCurrentProfile = {
      subscription_level: 'communityplus',
      location_point_lat: 40.7,
      location_point_long: -73.9,
      coordinates_near: 'Brooklyn, NY',
    };

    mockSavedLocations = {
      data: [
        { id: 10, coordinates_near: 'Queens, NY', location_point_lat: 40.7, location_point_long: -73.8 },
      ],
      isLoading: false,
    };

    preferencesGet.mockImplementation(({ key }: { key: string }) => {
      const values: Record<string, string | null> = {
        event_types: null,
        attendee_precaution_preferences: null,
        in_person_precautions: null,
      };
      return Promise.resolve({ value: values[key] ?? null });
    });
    preferencesSet.mockResolvedValue(undefined);
    addSavedLocation.mockResolvedValue(undefined);
    deleteSavedLocation.mockResolvedValue(undefined);
  });

  it('persists filters and event preferences on Done', async () => {
    const { onDismiss } = renderModal({
      barsProp: 'mingle,events',
      radiusProp: 25,
      localProp: true,
      sortProp: 'comment',
    });

    await screen.findByText('Filters');

    await act(async () => {
      fireEvent(
        document.querySelector('ion-select') as Element,
        new CustomEvent('ionChange', {
          detail: { value: ['mingle', 'families', 'events'] },
          bubbles: true,
        })
      );
    });

    await act(async () => {
      fireEvent(
        document.querySelector('ion-range') as Element,
        new CustomEvent('ionChange', {
          detail: { value: 77 },
          bubbles: true,
        })
      );
    });

    fireEvent.click(screen.getByText('change-event-filters'));
    fireEvent.click(screen.getByText('Done'));

    await waitFor(() => {
      expect(preferencesSet).toHaveBeenCalledWith({ key: 'radius', value: '77' });
      expect(preferencesSet).toHaveBeenCalledWith({ key: 'local', value: 'on' });
      expect(preferencesSet).toHaveBeenCalledWith({ key: 'sort', value: 'comment' });
      expect(preferencesSet).toHaveBeenCalledWith({ key: 'filters', value: 'mingle,families,events' });
      expect(onDismiss).toHaveBeenCalledWith('mingle,families,events', true, 77, 'comment', {
        eventTypes: ['online'],
        attendeePrecautionPreferences: ['masked'],
        inPersonPrecautions: ['outdoors'],
      });
      expect(preferencesSet).toHaveBeenCalledWith({ key: 'event_filter_type', value: 'online' });
      expect(preferencesSet).toHaveBeenCalledWith({ key: 'event_filter_attendee_precaution', value: 'masked' });
      expect(preferencesSet).toHaveBeenCalledWith({ key: 'event_filter_in_person_precautions', value: 'outdoors' });
    });
  });

  it('removes local-only categories when local posts are turned off before saving', async () => {
    const { onDismiss } = renderModal({
      barsProp: 'mingle,events,housing',
      localProp: true,
    });

    await screen.findByText('Filters');

    const localToggle = screen.getByText('Local posts and events').closest('ion-toggle') as HTMLElement;
    await act(async () => {
      fireEvent(
        localToggle,
        new CustomEvent('ionChange', { detail: { checked: false }, bubbles: true })
      );
    });

    fireEvent.click(screen.getByText('Done'));

    await waitFor(() => {
      expect(preferencesSet).toHaveBeenCalledWith({ key: 'local', value: 'off' });
      expect(preferencesSet).toHaveBeenCalledWith({ key: 'filters', value: 'mingle' });
      expect(onDismiss).toHaveBeenCalledWith('mingle', false, 45, 'recent', DEFAULT_EVENT_FILTERS);
    });
  });

  it('shows the share-location path and opens the edit-location modal when location is missing', async () => {
    mockCurrentProfile = {
      subscription_level: 'communityplus',
      location_point_lat: null,
      location_point_long: null,
    };

    renderModal();

    expect(await screen.findByText('Share your Location to turn on local posts.')).toBeInTheDocument();
    const localToggle = screen.getByText('Local posts and events').closest('ion-toggle') as HTMLElement;
    expect(localToggle).toHaveAttribute('disabled');

    fireEvent.click(screen.getByText('Share location'));
    expect(mockPresentModal).toHaveBeenCalled();
  });

  it('keeps free users on the default sort and blocks narrowing to a single category', async () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      subscription_level: 'none',
    };

    const { onDismiss } = renderModal({
      barsProp: 'all',
      localProp: false,
    });

    expect(await screen.findByText('Upgrade to a subscription level to filter by more categories.')).toBeInTheDocument();

    await act(async () => {
      fireEvent(
        document.querySelector('ion-radio-group') as Element,
        new CustomEvent('ionChange', { detail: { value: 'liked' }, bubbles: true })
      );
    });

    await act(async () => {
      fireEvent(
        document.querySelector('ion-select') as Element,
        new CustomEvent('ionChange', {
          detail: { value: ['mingle'] },
          bubbles: true,
        })
      );
    });

    fireEvent.click(screen.getByText('Done'));

    await waitFor(() => {
      expect(preferencesSet).toHaveBeenCalledWith({ key: 'sort', value: 'liked' });
      expect(preferencesSet).toHaveBeenCalledWith({ key: 'filters', value: 'all' });
      expect(onDismiss).toHaveBeenCalledWith('all', false, 45, 'liked', DEFAULT_EVENT_FILTERS);
    });
  });

  it('lets pro users enable everywhere mode and manage saved locations', async () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      subscription_level: 'pro',
    };

    renderModal();

    expect(await screen.findByText('Add Another Location')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Add Another Location'));
    expect(mockPresentModal).toHaveBeenCalled();

    const citySelectorConfig = mockPresentModal.mock.calls.at(-1)?.[0];
    await act(async () => {
      await citySelectorConfig.onDismiss({ name: 'Boston, MA', lat: 42.36, lng: -71.05 });
    });

    expect(addSavedLocation).toHaveBeenCalledWith({
      coordinates_near: 'Boston, MA',
      location_point_lat: 42.36,
      location_point_long: -71.05,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['saved-locations'] });

    fireEvent.click(document.querySelector('ion-button[color="danger"]') as HTMLElement);
    await waitFor(() => {
      expect(deleteSavedLocation).toHaveBeenCalledWith(10);
    });

    const everywhereToggle = screen.getByText('Show local posts and events from everywhere').closest('ion-toggle') as HTMLElement;
    await act(async () => {
      fireEvent(
        everywhereToggle,
        new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true })
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Distance Radius (km)')).not.toBeInTheDocument();
    });
  });
});
