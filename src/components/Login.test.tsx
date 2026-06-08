import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IonApp } from '@ionic/react';

const {
  mockAxios,
  mockConnect,
  mockPushOneSignalExtId,
} = vi.hoisted(() => ({
  mockAxios: vi.fn(),
  mockConnect: vi.fn(),
  mockPushOneSignalExtId: vi.fn(),
}));

vi.mock('axios', () => ({
  default: (...args: any[]) => mockAxios(...args),
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');

  return {
    ...actual,
    IonAlert: ({ isOpen, header, subHeader, message, buttons }: any) =>
      isOpen ? (
        <div data-testid="ion-alert">
          {header && <div>{header}</div>}
          {subHeader && <div>{subHeader}</div>}
          {message && <div>{message}</div>}
          {(buttons ?? []).map((button: any, index: number) => (
            <button key={`${button.text}-${index}`} onClick={() => button.handler?.()}>
              {button.text}
            </button>
          ))}
        </div>
      ) : null,
  };
});

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: vi.fn(),
  },
}));

vi.mock('../hooks/utilities', () => ({
  pushOneSignalExtId: (...args: any[]) => mockPushOneSignalExtId(...args),
}));

vi.mock('../hooks/capacitorPreferences/all', () => ({
  clearOnLoginStorage: vi.fn(),
}));

vi.mock('./WebsocketContext', () => ({
  useWebSocketContext: () => ({
    connect: mockConnect,
  }),
}));

vi.mock('./RegisterModal', () => ({
  default: () => <div>register-modal</div>,
}));

vi.mock('./ForgotPasswordModal', () => ({
  default: () => <div>forgot-password-modal</div>,
}));

vi.mock('./ResetPasswordModalInner', () => ({
  default: () => <div>reset-password-modal</div>,
}));

vi.mock('../pages/Construction', () => ({
  default: () => <div>construction</div>,
}));

import Login from './Login';

const renderLogin = () => {
  const queryClient = new QueryClient();

  return render(
    <IonApp>
      <QueryClientProvider client={queryClient}>
        <Login setLoggedin={vi.fn()} />
      </QueryClientProvider>
    </IonApp>
  );
};

const setIonInput = (element: HTMLElement, value: string) => {
  fireEvent(
    element,
    new CustomEvent('ionInput', {
      detail: { value },
      bubbles: true,
    })
  );
};

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAxios.mockRejectedValue({
      response: {
        status: 410,
        data: {
          reason: 'Bans happen for Terms of Service violations.',
          help: 'If you believe there has been a mistake, please reach out at help@refreshconnections.com.',
        },
      },
    });
  });

  it('clears email and password after acknowledging a banned-account login alert', async () => {
    const { container } = renderLogin();
    const emailInput = container.querySelector('ion-input[name="email"]') as HTMLElement;
    const passwordInput = container.querySelector('ion-input[name="password"]') as HTMLElement;

    setIonInput(emailInput, 'banned@example.com');
    setIonInput(passwordInput, 'password123');

    expect(emailInput).toHaveAttribute('value', 'banned@example.com');
    expect(passwordInput).toHaveAttribute('value', 'password123');

    fireEvent.submit(container.querySelector('form')!);

    expect(await screen.findByText('This account has been banned.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Ok'));

    await waitFor(() => {
      expect(emailInput).toHaveAttribute('value', '');
      expect(passwordInput).toHaveAttribute('value', '');
    });
  });
});
