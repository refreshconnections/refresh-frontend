import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IonApp } from '@ionic/react';

const mockInvalidateQueries = vi.fn();

let mockCurrentProfile: any;

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

vi.mock('../hooks/utilities', () => ({
  updateCurrentUserProfile: vi.fn(),
  updateUsername: vi.fn(),
}));

import EditUsernameModal from './EditUsernameModal';

const renderModal = () => render(
  <IonApp>
    <EditUsernameModal onDismiss={vi.fn()} />
  </IonApp>
);

describe('EditUsernameModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentProfile = {
      username: 'alex',
      username_last_updated: null,
      created_profile: true,
      paused_profile: false,
      deactivated_profile: false,
      settings_community_profile: false,
    };
  });

  it('shows the paused-profile note only when the personal profile is paused', () => {
    mockCurrentProfile = {
      ...mockCurrentProfile,
      paused_profile: true,
    };

    renderModal();

    expect(
      screen.getByText('Your personal profile is currently paused. Once you unpause it, you can turn on Connect from Refreshments.')
    ).toBeInTheDocument();
  });

  it('does not show the paused-profile note for active profiles', () => {
    renderModal();

    expect(
      screen.queryByText('Your personal profile is currently paused. Once you unpause it, you can turn on Connect from Refreshments.')
    ).not.toBeInTheDocument();
  });
});
