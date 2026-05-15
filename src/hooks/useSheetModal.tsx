import { useIonModal } from '@ionic/react';
import './sheet-modal.css';

type SheetOptions = {
  initialBreakpoint?: number;
  cssClass?: string;
  showBackdrop?: boolean;
  backdropDismiss?: boolean;
};

export const useSheetModal = (
  component: Parameters<typeof useIonModal>[0],
  props?: Parameters<typeof useIonModal>[1],
) => {
  const [present, dismiss] = useIonModal(component, props);

  const presentSheet = (options: SheetOptions = {}) => {
    const {
      initialBreakpoint = 0.8,
      cssClass = '',
      showBackdrop = false,
      backdropDismiss = true,
    } = options;
    present({
      showBackdrop,
      backdropDismiss,
      handleBehavior: 'none',
      expandToScroll: false,
      initialBreakpoint,
      breakpoints: [0, initialBreakpoint],
      cssClass: ['sheet-modal', cssClass].filter(Boolean).join(' '),
    });
  };

  return [presentSheet, dismiss] as const;
};
