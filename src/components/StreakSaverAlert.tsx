import React from 'react';
import { IonAlert } from '@ionic/react';

export type StreakSaverAlertState = {
  preBreak: number;
  savers: number;
  recoveryCost: number | null;
};

type Props = {
  alert: StreakSaverAlertState | null;
  onDismiss: () => void;
  onRestore: () => Promise<void>;
};

export const buildStreakSaverAlertMessage = (alert: StreakSaverAlertState | null) => {
  if (!alert) return '';
  return `Your ${alert.preBreak}-day streak broke. Restoring it will cost ${alert.recoveryCost ?? '?'} streak saver${alert.recoveryCost === 1 ? '' : 's'}. You have ${alert.savers} streak saver${alert.savers === 1 ? '' : 's'} — restore it now?`;
};

const StreakSaverAlert: React.FC<Props> = ({ alert, onDismiss, onRestore }) => {
  return (
    <IonAlert
      isOpen={!!alert}
      header="Your streak broke!"
      message={buildStreakSaverAlertMessage(alert)}
      onDidDismiss={onDismiss}
      buttons={[
        { text: 'Maybe later', role: 'cancel' },
        {
          text: 'Restore streak',
          handler: async () => {
            await onRestore();
          },
        },
      ]}
    />
  );
};

export default StreakSaverAlert;
