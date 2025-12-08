import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonModal,
  IonText,
} from '@ionic/react';
import React, { useState } from 'react';
import './AgeVerificationFlow.css';

export type AgeCheckState = 'required' | 'success' | 'canceled' | 'failed' | 'error';

type Props = {
  state: AgeCheckState;
  regionName?: string | null;
  providerName?: string | null;
  verifying?: boolean;
  onStart: () => void;
  onRetry?: () => void;
  onContinue?: () => void;
  onContactSupport?: () => void;
  onLogout?: () => void;
};

const AgeVerificationFlow: React.FC<Props> = ({
  state,
  regionName,
  providerName = 'our age-check partner',
  verifying,
  onStart,
  onRetry,
  onContinue,
  onContactSupport,
  onLogout,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const regionDisplay = regionName || 'your region';
  const providerLabel = providerName || 'our age-check partner';

  const regionUsage = regionName ? regionName : 'your region';

  const supportHandler = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      window.open(
        'mailto:help@refreshconnections.com?subject=Age%20verification%20review%20request',
        '_blank'
      );
    }
  };

  const logoutHandler = () => {
    onLogout?.();
  };

  const startHandler = () => {
    onStart();
  };

  const retryHandler = () => {
    (onRetry || onStart)();
  };

  const continueHandler = () => {
    onContinue?.();
  };

  const renderRequired = () => (
    <>
      <IonCardTitle>Quick age check</IonCardTitle>
      <p>
        Because of online-safety rules in {regionDisplay}, Refresh Connections needs to confirm that
        all members are adults.
      </p>
      <p>
        We use {providerLabel}, a specialist age-check service. {providerLabel} checks your age and
        sends Refresh Connections only an age result (for example, “18+ yes/no”)—not your photo, ID
        details, or payment information.
      </p>
      <p>If you don’t complete this step, you won’t be able to keep using Refresh Connections in {regionUsage}.</p>
      <IonButton expand="block" onClick={startHandler} disabled={verifying}>
        {verifying ? 'Opening…' : `Continue to ${providerLabel}`}
      </IonButton>
      <button className="age-flow__link-button" type="button" onClick={() => setShowInfo(true)}>
        How this works
      </button>
      <IonButton fill="clear" size="small" onClick={logoutHandler}>
        Log out
      </IonButton>
    </>
  );

  const renderSuccess = () => (
    <>
      <IonCardTitle>Age check complete</IonCardTitle>
      <p>
        Thanks—{providerLabel} has confirmed you’re old enough to use Refresh Connections in {regionDisplay}. You’re all set.
      </p>
      <IonButton expand="block" onClick={continueHandler} disabled={verifying}>
        {verifying ? 'Finishing up…' : 'Continue'}
      </IonButton>
      <IonText color="medium">
        You can learn more about age checks anytime in Settings → Privacy.
      </IonText>
    </>
  );

  const renderCanceled = () => (
    <>
      <IonCardTitle>Age check not finished</IonCardTitle>
      <p>
        It looks like the age check with {providerLabel} wasn’t completed. To keep using Refresh
        Connections in {regionUsage}, you’ll need to finish this quick step.
      </p>
      <IonButton expand="block" onClick={retryHandler} disabled={verifying}>
        {verifying ? 'Opening…' : 'Try again'}
      </IonButton>
      <IonButton expand="block" fill="clear" onClick={logoutHandler}>
        Log out
      </IonButton>
    </>
  );

  const renderFailed = () => (
    <>
      <IonCardTitle>We couldn’t confirm your age</IonCardTitle>
      <p>
        Based on the information from our age-check partner, we couldn’t confirm that you meet the
        age requirement to use Refresh Connections in {regionUsage}.
      </p>
      <p>
        We know this can be frustrating. If you are over 18 and believe this is a mistake, contact
        Support so we can review what happened.
      </p>
      <IonButton expand="block" onClick={supportHandler}>
        Contact Support
      </IonButton>
      <IonButton expand="block" fill="clear" onClick={logoutHandler}>
        Log out
      </IonButton>
    </>
  );

  const renderError = () => (
    <>
      <IonCardTitle>Something went wrong</IonCardTitle>
      <p>
        We weren’t able to finish your age check this time. This may be a temporary issue with our
        age-check partner.
      </p>
      <p>Please try again in a few minutes. If the problem keeps happening, get in touch with Support.</p>
      <IonButton expand="block" onClick={retryHandler} disabled={verifying}>
        {verifying ? 'Opening…' : 'Try again'}
      </IonButton>
      <IonButton expand="block" fill="clear" onClick={supportHandler}>
        Contact Support
      </IonButton>
    </>
  );

  const renderContent = () => {
    switch (state) {
      case 'success':
        return renderSuccess();
      case 'canceled':
        return renderCanceled();
      case 'failed':
        return renderFailed();
      case 'error':
        return renderError();
      case 'required':
      default:
        return renderRequired();
    }
  };

  return (
    <>
      <IonCard className="age-verification-flow">
        <IonCardContent>{renderContent()}</IonCardContent>
      </IonCard>

      <IonModal isOpen={showInfo} onDidDismiss={() => setShowInfo(false)} initialBreakpoint={0.8} breakpoints={[0, 0.8]}>
        <div className="age-flow__sheet">
          <IonCardTitle>How this age check works</IonCardTitle>
          <ul>
            <li>Tap Continue to {providerLabel} to open a secure age-check screen.</li>
            <li>{providerLabel} asks for what it needs to confirm your age (for example, a selfie, short video, or ID).</li>
            <li>
              {providerLabel} checks your age and sends Refresh Connections only an age result (like “18 or over”) plus a code to link that result to your account.
            </li>
            <li>
              We use that result to confirm you can use the app in {regionUsage} and to meet online-safety
              rules. We don’t use age-check results for advertising.
            </li>
          </ul>
          <p className="age-flow__sheet-footer">
            By continuing, you agree to{' '}
            <a href="https://www.yoti.com/terms/" target="_blank" rel="noreferrer">
              Yoti’s Terms
            </a>
            ,{' '}
            <a href="https://www.yoti.com/privacy/" target="_blank" rel="noreferrer">
              Privacy Notice
            </a>{' '}
            and the{' '}
            <a href="https://refreshconnections.com/terms" target="_blank" rel="noreferrer">
              Refresh Connections Terms of Service
            </a>{' '}
            and{' '}
            <a href="https://refreshconnections.com/privacy" target="_blank" rel="noreferrer">
              Privacy Policy
            </a>
            .
          </p>
          <IonButton expand="block" onClick={() => setShowInfo(false)}>
            Got it
          </IonButton>
        </div>
      </IonModal>
    </>
  );
};

export default AgeVerificationFlow;
