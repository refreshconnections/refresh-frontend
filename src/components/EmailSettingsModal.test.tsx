import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { IonApp } from '@ionic/react';

const { mockInvalidateQueries, mockAppAddListener } = vi.hoisted(() => ({
  mockInvalidateQueries: vi.fn(),
  mockAppAddListener: vi.fn(),
}));

let mockStatusQuery: any;
let setSecondaryOptions: any;
let approveSmsOptions: any;
let swapPrimaryOptions: any;
let clearSecondaryOptions: any;
const setSecondaryMutate = vi.fn();
const approveSmsMutate = vi.fn();
const swapPrimaryMutate = vi.fn();
const clearSecondaryMutate = vi.fn();
let resumeListener: (() => Promise<void> | void) | undefined;

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonAlert: ({ isOpen, header, message, buttons, inputs, onDidDismiss }: any) =>
      isOpen ? (
        <div data-testid="ion-alert">
          {header && <div>{header}</div>}
          {message && <div>{message}</div>}
          {(inputs ?? []).map((input: any, index: number) => (
            <input key={`${header ?? 'alert'}-${input.name ?? 'input'}-${index}`} aria-label={input.name} defaultValue={input.value ?? ''} />
          ))}
          {(buttons ?? []).map((button: any, index: number) => (
            <button
              key={`${header ?? 'alert'}-${button.text ?? 'button'}-${index}`}
              onClick={async () => {
                const values: Record<string, string> = {};
                document.querySelectorAll('input[aria-label]').forEach((node) => {
                  const input = node as HTMLInputElement;
                  values[input.getAttribute('aria-label')!] = input.value;
                });
                const result = await button.handler?.(values);
                if (result !== false) onDidDismiss?.();
              }}
            >
              {button.text}
            </button>
          ))}
        </div>
      ) : null,
    IonToast: ({ isOpen, message }: any) => (isOpen ? <div>{message}</div> : null),
    IonLoading: ({ isOpen, message }: any) => (isOpen ? <div>{message}</div> : null),
    isPlatform: () => false,
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

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (...args: any[]) => mockAppAddListener(...args),
  },
}));

vi.mock('../hooks/api/account/emails', () => ({
  useEmailStatus: () => mockStatusQuery,
  useSetSecondaryEmail: (opts: any) => {
    setSecondaryOptions = opts;
    return { mutate: setSecondaryMutate, isPending: false };
  },
  useApproveSecondarySms: (opts: any) => {
    approveSmsOptions = opts;
    return { mutate: approveSmsMutate, isPending: false };
  },
  useSwapPrimaryEmail: (opts: any) => {
    swapPrimaryOptions = opts;
    return { mutate: swapPrimaryMutate, isPending: false };
  },
  useClearSecondaryEmail: (opts: any) => {
    clearSecondaryOptions = opts;
    return { mutate: clearSecondaryMutate, isPending: false };
  },
}));

import EmailSettingsModal from './EmailSettingsModal';

const renderModal = () => {
  const queryClient = new QueryClient();
  const onDismiss = vi.fn();
  return {
    onDismiss,
    ...render(
      <IonApp>
        <QueryClientProvider client={queryClient}>
          <EmailSettingsModal onDismiss={onDismiss} />
        </QueryClientProvider>
      </IonApp>
    ),
  };
};

const typeIntoIonInput = async (selector: string, value: string) => {
  const el = document.querySelector(selector) as HTMLElement;
  await act(async () => {
    fireEvent(el, new CustomEvent('ionInput', { detail: { value }, bubbles: true }));
    await Promise.resolve();
  });
};

const clickAndFlush = async (node: Element | HTMLElement) => {
  await act(async () => {
    fireEvent.click(node);
    await Promise.resolve();
  });
};

const changeInputAndFlush = async (label: string, value: string) => {
  await act(async () => {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
    await Promise.resolve();
  });
};

describe('EmailSettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resumeListener = undefined;
    mockAppAddListener.mockImplementation((eventName: string, handler: () => Promise<void> | void) => {
      if (eventName === 'resume') {
        resumeListener = handler;
      }
      return Promise.resolve({ remove: vi.fn() });
    });
    mockStatusQuery = {
      data: {
        primary_email: 'primary@example.com',
        secondary_email: null,
        secondary_email_approved: false,
        secondary_email_validated: false,
        secondary_email_fully_verified: false,
        phone: '5554443322',
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    };
  });

  it('shows the initial loading shell before email status is loaded', () => {
    mockStatusQuery = {
      data: undefined,
      isLoading: true,
      isFetching: true,
      refetch: vi.fn(),
    };

    renderModal();

    expect(screen.getByText('Email & Recovery')).toBeInTheDocument();
    expect(document.querySelector('ion-spinner')).toBeTruthy();
    expect(document.querySelectorAll('ion-skeleton-text').length).toBeGreaterThan(0);
  });

  it('blocks plus-alias backup emails and allows password-first add for valid emails', async () => {
    renderModal();

    await typeIntoIonInput('ion-input[type="email"]', 'primary+alias@example.com');
    expect(await screen.findByText("Backup email cannot include '+' aliases.")).toBeInTheDocument();

    await typeIntoIonInput('ion-input[type="email"]', 'backup@example.com');
    await clickAndFlush(screen.getByText('Send approval'));
    expect(await screen.findByText('Confirm password')).toBeInTheDocument();

    await changeInputAndFlush('password', 'secret');
    await clickAndFlush(screen.getByText('Confirm'));

    expect(setSecondaryMutate).toHaveBeenCalledWith({
      email: 'backup@example.com',
      current_password: 'secret',
      method: 'email',
    });
  });

  it("blocks a backup email that is just the primary email's plus-alias equivalent", async () => {
    renderModal();

    await typeIntoIonInput('ion-input[type="email"]', 'primary+news@example.com');
    expect(await screen.findByText("Backup email cannot include '+' aliases.")).toBeInTheDocument();

    await typeIntoIonInput('ion-input[type="email"]', 'primary@example.com');
    expect(await screen.findByText("Backup email can't be the same as your primary or “+” alias.")).toBeInTheDocument();

    expect(screen.getByText('Send approval').closest('ion-button')).toHaveAttribute('disabled');
  });

  it('opens the SMS verification flow only after a successful SMS backup request', async () => {
    renderModal();

    await typeIntoIonInput('ion-input[type="email"]', 'backup@example.com');
    await act(async () => {
      fireEvent(
        document.querySelector('ion-segment') as Element,
        new CustomEvent('ionChange', { detail: { value: 'sms' }, bubbles: true })
      );
      await Promise.resolve();
    });

    await clickAndFlush(screen.getByText('Send approval'));
    await changeInputAndFlush('password', 'secret');
    await clickAndFlush(screen.getByText('Confirm'));

    expect(setSecondaryMutate).toHaveBeenCalledWith({
      email: 'backup@example.com',
      current_password: 'secret',
      method: 'sms',
    });

    await act(async () => {
      setSecondaryOptions.onSuccess('Approval sent.');
    });

    expect(await screen.findByText('Enter SMS code')).toBeInTheDocument();
    await changeInputAndFlush('code', '123456');
    await clickAndFlush(screen.getByText('Verify'));
    expect(approveSmsMutate).toHaveBeenCalledWith({ code: '123456' });
  });

  it('asks for confirmation before closing the SMS code dialog with an incomplete code', async () => {
    renderModal();

    await typeIntoIonInput('ion-input[type="email"]', 'backup@example.com');
    await act(async () => {
      fireEvent(
        document.querySelector('ion-segment') as Element,
        new CustomEvent('ionChange', { detail: { value: 'sms' }, bubbles: true })
      );
      await Promise.resolve();
    });

    await clickAndFlush(screen.getByText('Send approval'));
    await changeInputAndFlush('password', 'secret');
    await clickAndFlush(screen.getByText('Confirm'));

    await act(async () => {
      setSecondaryOptions.onSuccess('Approval sent.');
    });

    await changeInputAndFlush('code', '12');
    await clickAndFlush(screen.getByText('Cancel'));

    const confirmExitAlert = await screen.findByText('Are you sure you want to close without verifying?');
    const confirmExitDialog = confirmExitAlert.closest('[data-testid="ion-alert"]') as HTMLElement;

    await clickAndFlush(within(confirmExitDialog).getByText('Verify'));
    expect(await screen.findByText('Enter SMS code')).toBeInTheDocument();

    await clickAndFlush(screen.getByText('Cancel'));
    await clickAndFlush(await screen.findByText('Close'));

    await waitFor(() => {
      expect(screen.queryByText('Enter SMS code')).not.toBeInTheDocument();
    });
  });

  it('removes an unverified backup immediately and confirms before removing a verified backup', async () => {
    mockStatusQuery = {
      ...mockStatusQuery,
      data: {
        ...mockStatusQuery.data,
        secondary_email: 'backup@example.com',
        secondary_email_fully_verified: false,
      },
    };
    renderModal();

    await clickAndFlush(screen.getByText('Remove'));
    expect(clearSecondaryMutate).toHaveBeenCalledTimes(1);
    cleanup();

    mockStatusQuery = {
      ...mockStatusQuery,
      data: {
        ...mockStatusQuery.data,
        secondary_email: 'backup@example.com',
        secondary_email_fully_verified: true,
        secondary_email_approved: true,
        secondary_email_validated: true,
      },
    };
    renderModal();

    await clickAndFlush(screen.getAllByText('Remove')[0]);
    expect(await screen.findByText('Remove backup email?')).toBeInTheDocument();
    await clickAndFlush(screen.getByText('Yes'));
    expect(clearSecondaryMutate).toHaveBeenCalledTimes(2);
  });

  it('rechecks pending verification state and swaps a verified backup to primary with password confirmation', async () => {
    mockStatusQuery = {
      data: {
        primary_email: 'primary@example.com',
        secondary_email: 'backup@example.com',
        secondary_email_approved: true,
        secondary_email_validated: false,
        secondary_email_fully_verified: false,
        phone: '5554443322',
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    };
    renderModal();

    await clickAndFlush(screen.getByText('Recheck status'));
    expect(mockStatusQuery.refetch).toHaveBeenCalledTimes(1);
    expect(mockAppAddListener).toHaveBeenCalledWith('resume', expect.any(Function));

    mockStatusQuery = {
      ...mockStatusQuery,
      data: {
        ...mockStatusQuery.data,
        secondary_email_validated: true,
        secondary_email_fully_verified: true,
      },
    };
    renderModal();

    await clickAndFlush(screen.getAllByText('Switch backup to primary')[0]);
    expect(await screen.findByText('Confirm password')).toBeInTheDocument();
    await changeInputAndFlush('password', 'secret');
    await clickAndFlush(screen.getByText('Confirm'));

    expect(swapPrimaryMutate).toHaveBeenCalledWith({ current_password: 'secret' });
  });

  it('rechecks verification status when the app resumes', async () => {
    mockStatusQuery = {
      data: {
        primary_email: 'primary@example.com',
        secondary_email: 'backup@example.com',
        secondary_email_approved: false,
        secondary_email_validated: false,
        secondary_email_fully_verified: false,
        phone: '5554443322',
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn().mockResolvedValue(undefined),
    };

    renderModal();

    expect(mockAppAddListener).toHaveBeenCalledWith('resume', expect.any(Function));
    expect(resumeListener).toBeTypeOf('function');

    await act(async () => {
      await resumeListener?.();
    });

    expect(mockStatusQuery.refetch).toHaveBeenCalledTimes(1);
  });
});
