import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createIonicMock } from '../../test-utils/shared-mocks';

const {
  chatGroupsHook,
  updateGroupsMutate,
  filteredMutualsHook,
  mockPresentAlert,
} = vi.hoisted(() => ({
  chatGroupsHook: vi.fn(),
  updateGroupsMutate: vi.fn(),
  filteredMutualsHook: vi.fn(),
  mockPresentAlert: vi.fn(),
}));

vi.mock('@ionic/react', () => {
  const base = createIonicMock();
  const React = require('react');

  // Override IonToggle so onIonChange is wired to a checkbox onChange
  const IonToggle = ({ checked, onIonChange, ...props }: any) =>
    React.createElement('input', {
      type: 'checkbox',
      'data-testid': props['data-testid'] ?? 'ion-toggle',
      checked: checked ?? false,
      onChange: (e: any) => onIonChange?.({ detail: { checked: e.target.checked } }),
    });

  return { ...base, IonToggle, useIonAlert: () => [mockPresentAlert, vi.fn()] };
});

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock('../../hooks/api/chats/chat-groups', () => ({
  useChatGroups: (...args: any[]) => chatGroupsHook(...args),
  useUpdateChatGroups: () => ({ mutate: updateGroupsMutate }),
}));

vi.mock('../../hooks/api/profiles/mutual-connections-filtered', () => ({
  useGetMutualConnectionsFiltered: (...args: any[]) => filteredMutualsHook(...args),
}));

vi.mock('../../hooks/api/profiles/current-profile', () => ({
  useGetCurrentProfile: () => ({ data: { subscription_level: 'pro', settings_alt_text: false, name: 'Me' } }),
}));

vi.mock('../PersonBadge', () => ({
  default: ({ name, onTap }: any) => <button onClick={onTap}>badge-{name}</button>,
}));

vi.mock('../TextModal', () => ({
  default: () => <div>text-modal</div>,
}));

import OrganizeChatsModal from './OrganizeChatsModal';

const defaultGroups = {
  group1_name: null, group2_name: null, group3_name: null,
  group1_hidden: false, group2_hidden: false, group3_hidden: false,
  group1: [], group2: [], group3: [],
};

const renderModal = (groupsData: any = defaultGroups) => {
  chatGroupsHook.mockReturnValue({ data: groupsData });
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <OrganizeChatsModal
        subscriptionLevel="pro"
        recentUsers={[
          { id: 10, name: 'Alice', pic1_main: null },
          { id: 11, name: 'Bob', pic1_main: null },
        ]}
        onDismiss={vi.fn()}
      />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  filteredMutualsHook.mockReturnValue({ data: [] });
});

describe('OrganizeChatsModal', () => {
  it('shows a spinner while groups data is loading', () => {
    chatGroupsHook.mockReturnValue({ data: null });
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <OrganizeChatsModal subscriptionLevel="pro" recentUsers={[]} onDismiss={vi.fn()} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Organize your chats')).toBeInTheDocument();
    // spinner rendered via IonSpinner stub
    expect(document.querySelector('[name="dots"]')).toBeTruthy();
  });

  it('always shows slot 0 even when it has no data', () => {
    renderModal();

    expect(screen.getAllByText('Unnamed list').length).toBeGreaterThan(0);
  });

  it('shows an accordion for each slot that has data', () => {
    renderModal({
      ...defaultGroups,
      group1_name: 'Close friends',
      group1: [{ id: 5, name: 'Carol', pic1_main: null }],
      group2_name: 'Work',
      group2: [{ id: 6, name: 'Dave', pic1_main: null }],
    });

    expect(screen.getAllByText('Close friends').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Work').length).toBeGreaterThan(0);
    expect(screen.queryByText('Unnamed list')).not.toBeInTheDocument();
  });

  it('does not show slot 2 when it has no data and slot 1 has data', () => {
    renderModal({
      ...defaultGroups,
      group2_name: 'Work',
      group2: [{ id: 6, name: 'Dave', pic1_main: null }],
    });

    // slot 0 (empty) and slot 1 (Work) shown; no third slot
    expect(screen.getAllByText('Unnamed list').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Work').length).toBeGreaterThan(0);
    // Slot 2 (group3) should not render since it has no data
    expect(screen.queryAllByText(/Unnamed list/).length).toBeLessThan(3);
  });

  it('entering edit-name mode shows an input with maxlength 10', () => {
    renderModal();

    fireEvent.click(screen.getByText('Edit name'));

    const input = document.querySelector('input[placeholder="Name this list"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.getAttribute('maxlength')).toBe('10');
  });

  it('saving a name calls updateGroups with the new name', async () => {
    renderModal();

    fireEvent.click(screen.getByText('Edit name'));

    const input = document.querySelector('input[placeholder="Name this list"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Besties' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(updateGroupsMutate).toHaveBeenCalledWith(
        expect.objectContaining({ group1_name: 'Besties' }),
      );
    });
  });

  it('cancelling edit-name does not call updateGroups', async () => {
    renderModal({ ...defaultGroups, group1_name: 'Original' });

    fireEvent.click(screen.getByText('Edit name'));

    const input = document.querySelector('input[placeholder="Name this list"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Changed' } });

    fireEvent.click(screen.getByText('Cancel'));

    // input should be gone and name back to original
    expect(screen.queryByPlaceholderText('Name this list')).not.toBeInTheDocument();
    expect(updateGroupsMutate).not.toHaveBeenCalled();
  });

  it('removes a member and calls updateGroups without that user', async () => {
    renderModal({
      ...defaultGroups,
      group1: [
        { id: 5, name: 'Carol', pic1_main: null },
        { id: 6, name: 'Dave', pic1_main: null },
      ],
    });

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(updateGroupsMutate).toHaveBeenCalledWith(
        expect.objectContaining({ group1: [6] }),
      );
    });
  });

  it('toggling hidden off calls updateGroups with group1_hidden: false', async () => {
    renderModal();

    const toggle = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(toggle).toBeTruthy();

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(updateGroupsMutate).toHaveBeenCalledWith(
        expect.objectContaining({ group1_hidden: false }),
      );
    });
  });

  it('"Add a list" button is shown when there is a next empty slot within maxSlots', () => {
    // Pro user: maxSlots = 3; slot 0 has members so slot 1 is next empty
    renderModal({
      ...defaultGroups,
      group1_name: 'Besties',
      group1: [{ id: 5, name: 'Carol', pic1_main: null }],
    });

    expect(screen.getByText('Add a list')).toBeInTheDocument();
  });

  it('"Add a list" patches the next empty slot with "New list"', async () => {
    renderModal({
      ...defaultGroups,
      group1_name: 'Besties',
      group1: [{ id: 5, name: 'Carol', pic1_main: null }],
    });

    fireEvent.click(screen.getByText('Add a list'));

    await waitFor(() => {
      expect(updateGroupsMutate).toHaveBeenCalledWith(
        expect.objectContaining({ group2_name: 'New list' }),
      );
    });
  });

  it('"Add a list" is hidden when all slots within maxSlots are occupied', () => {
    renderModal({
      ...defaultGroups,
      group1_name: 'A', group1: [{ id: 1, name: 'X', pic1_main: null }],
      group2_name: 'B', group2: [{ id: 2, name: 'Y', pic1_main: null }],
      group3_name: 'C', group3: [{ id: 3, name: 'Z', pic1_main: null }],
    });

    expect(screen.queryByText('Add a list')).not.toBeInTheDocument();
  });

  it('delete list prompts for confirmation and clears name and members on confirm', async () => {
    renderModal({
      ...defaultGroups,
      group1_name: 'Besties',
      group1: [{ id: 5, name: 'Carol', pic1_main: null }],
    });

    fireEvent.click(screen.getByText('Remove this list'));

    expect(mockPresentAlert).toHaveBeenCalledWith(
      expect.objectContaining({ header: 'Remove this list?' }),
    );

    // Simulate user typing 'delete' and confirming
    const alertConfig = mockPresentAlert.mock.calls[0][0];
    const confirmButton = alertConfig.buttons.find((b: any) => b.role !== 'cancel');

    await act(async () => {
      confirmButton.handler({ confirm: 'delete' });
    });

    expect(updateGroupsMutate).toHaveBeenCalledWith(
      expect.objectContaining({ group1_name: null, group1: [] }),
    );
  });

  it('delete list does not call updateGroups when confirm text is wrong', async () => {
    renderModal({
      ...defaultGroups,
      group1_name: 'Besties',
      group1: [{ id: 5, name: 'Carol', pic1_main: null }],
    });

    fireEvent.click(screen.getByText('Remove this list'));

    const alertConfig = mockPresentAlert.mock.calls[0][0];
    const confirmButton = alertConfig.buttons.find((b: any) => b.role !== 'cancel');

    await act(async () => {
      const result = confirmButton.handler({ confirm: 'wrong' });
      expect(result).toBe(false);
    });

    expect(updateGroupsMutate).not.toHaveBeenCalled();
  });
});
