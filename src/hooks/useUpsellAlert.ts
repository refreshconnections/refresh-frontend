import { useIonAlert } from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import { Preferences } from '@capacitor/preferences';

export const UPSELL_POPUPS_ENABLED_KEY = 'upsell_popups_enabled';

type ExtraButton = { text: string; handler: () => void };

type UpsellAlertOptions = {
  header: string;
  message?: string;
  extraButtons?: ExtraButton[];
  onSeePlans?: () => void;
};

export function useUpsellAlert() {
  const [presentAlert] = useIonAlert();
  const router = useIonRouter();

  return async ({ header, message, extraButtons, onSeePlans }: UpsellAlertOptions) => {
    const { value } = await Preferences.get({ key: UPSELL_POPUPS_ENABLED_KEY });
    if (value === 'false') return;
    presentAlert({
      header,
      message,
      buttons: [
        { text: 'Not now', role: 'cancel' },
        ...(extraButtons ?? []),
        { text: 'See plans', handler: () => { onSeePlans?.(); router.push('/store'); } },
      ],
    });
  };
}
