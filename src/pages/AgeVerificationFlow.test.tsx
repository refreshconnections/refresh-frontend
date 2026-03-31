import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import AgeVerificationFlow, {
  BROWSER_CLOSE_LOADING_MS,
  YOTI_BROWSER_CLOSED_EVENT,
} from './AgeVerificationFlow';

const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonModal: ({
      children,
      isOpen,
      onDidDismiss: _onDidDismiss,
      initialBreakpoint: _initialBreakpoint,
      breakpoints: _breakpoints,
      ...props
    }: any) => (isOpen ? <div data-testid="ion-modal" {...props}>{children}</div> : null),
  };
});

const renderInApp = (ui: React.ReactNode) => render(<IonApp>{ui}</IonApp>);

describe('AgeVerificationFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders the required state actions and info modal', () => {
    const onStart = vi.fn();
    const onLogout = vi.fn();
    const onRefreshResult = vi.fn();
    const onSimulatePass = vi.fn();
    const onSimulateFail = vi.fn();
    const onSimulateInconclusive = vi.fn();

    renderInApp(
      <AgeVerificationFlow
        state="required"
        regionName="New York"
        providerName="Yoti"
        onStart={onStart}
        onLogout={onLogout}
        lastSessionId="session-123"
        onRefreshResult={onRefreshResult}
        fakeModeEnabled
        onSimulatePass={onSimulatePass}
        onSimulateFail={onSimulateFail}
        onSimulateInconclusive={onSimulateInconclusive}
      />
    );

    fireEvent.click(screen.getByText('Continue to Yoti'));
    fireEvent.click(screen.getByText('Check status'));
    fireEvent.click(screen.getByText('Refresh Fake Result'));
    fireEvent.click(screen.getByText('Simulate Pass'));
    fireEvent.click(screen.getByText('Simulate Fail'));
    fireEvent.click(screen.getByText('Simulate Try Again'));
    fireEvent.click(screen.getByText('How this works'));

    expect(screen.getByText('How this age check works')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Got it'));
    fireEvent.click(screen.getByText('Log out'));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onRefreshResult).toHaveBeenCalledTimes(2);
    expect(onRefreshResult).toHaveBeenCalledWith('session-123');
    expect(onSimulatePass).toHaveBeenCalledTimes(1);
    expect(onSimulateFail).toHaveBeenCalledTimes(1);
    expect(onSimulateInconclusive).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('renders the success state and continues', () => {
    const onContinue = vi.fn();

    renderInApp(
      <AgeVerificationFlow
        state="success"
        providerName="Yoti"
        regionName="California"
        onStart={vi.fn()}
        onContinue={onContinue}
      />
    );

    fireEvent.click(screen.getByText('Continue'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('renders the canceled state with retry, status check, and logout', () => {
    const onRetry = vi.fn();
    const onRefreshResult = vi.fn();
    const onLogout = vi.fn();

    renderInApp(
      <AgeVerificationFlow
        state="canceled"
        providerName="Yoti"
        regionName="Illinois"
        onStart={vi.fn()}
        onRetry={onRetry}
        onRefreshResult={onRefreshResult}
        lastSessionId="retry-session"
        onLogout={onLogout}
      />
    );

    fireEvent.click(screen.getByText('Try again'));
    fireEvent.click(screen.getByText('Check status'));
    fireEvent.click(screen.getByText('Log out'));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRefreshResult).toHaveBeenCalledWith('retry-session');
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('renders the failed state and uses the fallback support handler', () => {
    const onLogout = vi.fn();

    renderInApp(
      <AgeVerificationFlow
        state="failed"
        providerName="Yoti"
        onStart={vi.fn()}
        onLogout={onLogout}
      />
    );

    fireEvent.click(screen.getByText('Contact Support'));
    fireEvent.click(screen.getByText('Log out'));

    expect(openSpy).toHaveBeenCalledWith(
      'mailto:help@refreshconnections.com?subject=Age%20verification%20review%20request',
      '_blank'
    );
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('renders the error state and prefers the provided support handler', () => {
    const onRetry = vi.fn();
    const onContactSupport = vi.fn();

    renderInApp(
      <AgeVerificationFlow
        state="error"
        onStart={vi.fn()}
        onRetry={onRetry}
        onContactSupport={onContactSupport}
      />
    );

    fireEvent.click(screen.getByText('Try again'));
    fireEvent.click(screen.getByText('Contact Support'));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onContactSupport).toHaveBeenCalledTimes(1);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('checks for a browser-close result after the timeout', async () => {
    const view = renderInApp(
      <AgeVerificationFlow
        state="required"
        onStart={vi.fn()}
        onRefreshResult={vi.fn()}
        lastSessionId="browser-session"
      />
    );

    await act(async () => {
      window.dispatchEvent(new Event(YOTI_BROWSER_CLOSED_EVENT));
      await Promise.resolve();
    });
    expect(screen.getByText(/Looking for your verification result/)).toBeInTheDocument();
    expect(screen.getByText('Try Yoti again')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(BROWSER_CLOSE_LOADING_MS);
    });

    await act(async () => {
      view.unmount();
      await Promise.resolve();
    });
  });

  it('renders the embedded variant without the outer gate wrapper', () => {
    renderInApp(
      <AgeVerificationFlow
        state="required"
        onStart={vi.fn()}
        embedded
      />
    );

    expect(screen.getByText('Age Verification')).toBeInTheDocument();
    expect(document.querySelector('.age-verification-gate')).not.toBeInTheDocument();
  });
});
