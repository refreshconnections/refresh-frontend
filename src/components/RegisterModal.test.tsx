import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';

const { mockAxios } = vi.hoisted(() => ({
  mockAxios: vi.fn(),
}));

vi.mock('axios', () => ({
  default: (...args: any[]) => mockAxios(...args),
}));

vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(() => 'csrf-token'),
  },
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonModal: ({ children }: any) => <div>{children}</div>,
    IonAlert: ({ isOpen, header, message }: any) =>
      isOpen ? (
        <div data-testid="ion-alert">
          {header}
          {message}
        </div>
      ) : null,
  };
});

vi.mock('../hooks/api/sitesettings', () => ({
  useGetSiteSettings: () => ({
    data: {
      allow_account_sign_ups: true,
    },
  }),
}));

import RegisterModal from './RegisterModal';

const renderRegisterModal = () => render(
  <IonApp>
    <RegisterModal />
  </IonApp>
);

const setIonInput = (element: HTMLElement, value: string) => {
  fireEvent(
    element,
    new CustomEvent('ionInput', {
      detail: { value },
      bubbles: true,
    })
  );
};

const setIonCheckbox = (element: HTMLElement, checked: boolean) => {
  fireEvent(
    element,
    new CustomEvent('ionChange', {
      detail: { checked },
      bubbles: true,
    })
  );
};

describe('RegisterModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAxios.mockRejectedValue({
      response: {
        data: {
          email: [{ message: 'Email already in use.' }],
        },
      },
    });
  });

  it('shows signup errors above the sign up button', async () => {
    const { container } = renderRegisterModal();

    setIonInput(container.querySelector('ion-input[name="email"]') as HTMLElement, 'alex@example.com');
    setIonInput(container.querySelector('ion-input[name="first name"]') as HTMLElement, 'Alex');
    setIonInput(container.querySelector('ion-input[name="last name"]') as HTMLElement, 'Refresh');
    const passwordInputs = container.querySelectorAll('ion-input[name="password"]');
    setIonInput(passwordInputs[0] as HTMLElement, 'password123');
    setIonInput(passwordInputs[1] as HTMLElement, 'password123');
    setIonCheckbox(container.querySelector('ion-checkbox') as HTMLElement, true);

    fireEvent.submit(container.querySelector('form') as HTMLElement);

    const error = await screen.findByText(/This email cannot be used to create a new account/i);
    const signUpButton = container.querySelector('ion-button[type="submit"]') as HTMLElement;

    await waitFor(() => {
      expect(mockAxios).toHaveBeenCalled();
    });
    expect(error.compareDocumentPosition(signUpButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
