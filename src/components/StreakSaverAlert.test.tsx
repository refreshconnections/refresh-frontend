import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import StreakSaverAlert, { buildStreakSaverAlertMessage } from './StreakSaverAlert';

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  const MockIonAlert = ({ isOpen, header, message, buttons = [], onDidDismiss }: any) => {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-label={header}>
        <h1>{header}</h1>
        <p>{message}</p>
        {buttons.map((button: any) => {
          const text = typeof button === 'string' ? button : button.text;
          const handler = typeof button === 'string' ? undefined : button.handler;
          return (
            <button
              key={text}
              onClick={async () => {
                await handler?.();
                onDidDismiss?.();
              }}
            >
              {text}
            </button>
          );
        })}
      </div>
    );
  };

  return {
    ...actual,
    IonAlert: MockIonAlert,
  };
});

const onDismiss = vi.fn();
const onRestore = vi.fn().mockResolvedValue(undefined);

describe('StreakSaverAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds the popup message with recovery cost and saver count', () => {
    expect(buildStreakSaverAlertMessage({
      preBreak: 7,
      savers: 3,
      recoveryCost: 2,
    })).toBe('Your 7-day streak broke. Restoring it will use 2 streak savers. You have 3 streak savers — restore it now?');
  });

  it('renders the broken streak popup copy', () => {
    render(
      <IonApp>
        <StreakSaverAlert
          alert={{ preBreak: 7, savers: 3, recoveryCost: 2 }}
          onDismiss={onDismiss}
          onRestore={onRestore}
        />
      </IonApp>
    );

    expect(screen.getByRole('dialog', { name: 'Your streak broke!' })).toBeInTheDocument();
    expect(screen.getByText(/Your 7-day streak broke\./)).toBeInTheDocument();
    expect(screen.getByText(/Restoring it will use 2 streak savers\./)).toBeInTheDocument();
    expect(screen.getByText(/You have 3 streak savers/)).toBeInTheDocument();
  });

  it('calls restore and dismiss callbacks from the popup actions', async () => {
    render(
      <IonApp>
        <StreakSaverAlert
          alert={{ preBreak: 7, savers: 3, recoveryCost: 2 }}
          onDismiss={onDismiss}
          onRestore={onRestore}
        />
      </IonApp>
    );

    fireEvent.click(screen.getByText('Restore streak'));

    await waitFor(() => {
      expect(onRestore).toHaveBeenCalledTimes(1);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  it('uses singular wording when the cost and saver count are both 1', () => {
    expect(buildStreakSaverAlertMessage({
      preBreak: 3,
      savers: 1,
      recoveryCost: 1,
    })).toBe('Your 3-day streak broke. Restoring it will use 1 streak saver. You have 1 streak saver — restore it now?');
  });

  it('calls only dismiss when the user taps Maybe later', async () => {
    render(
      <IonApp>
        <StreakSaverAlert
          alert={{ preBreak: 7, savers: 3, recoveryCost: 2 }}
          onDismiss={onDismiss}
          onRestore={onRestore}
        />
      </IonApp>
    );

    fireEvent.click(screen.getByText('Maybe later'));

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(onRestore).not.toHaveBeenCalled();
    });
  });
});
