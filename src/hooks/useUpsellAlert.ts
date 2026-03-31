import { useIonAlert } from '@ionic/react';
import { useIonRouter } from '@ionic/react';

type ExtraButton = { text: string; handler: () => void };

type UpsellAlertOptions = {
  header: string;
  message?: string;
  extraButtons?: ExtraButton[];
};

export function useUpsellAlert() {
  const [presentAlert] = useIonAlert();
  const router = useIonRouter();

  return ({ header, message, extraButtons }: UpsellAlertOptions) => {
    presentAlert({
      header,
      message,
      buttons: [
        { text: 'Not now', role: 'cancel' },
        ...(extraButtons ?? []),
        { text: 'See plans', handler: () => router.push('/store') },
      ],
    });
  };
}
