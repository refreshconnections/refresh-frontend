import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

const NATIVE_KEYBOARD_DEFAULT_MODE = KeyboardResize.Native;


export const useOnboardingKeyboardState = (options?: { noResize?: boolean }) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let isCancelled = false;
    let restoreResizeMode = NATIVE_KEYBOARD_DEFAULT_MODE;
    let showListener: { remove: () => Promise<void> | void } | null = null;
    let hideListener: { remove: () => Promise<void> | void } | null = null;

    const attachListeners = async () => {
      try {
        if (Capacitor.getPlatform() === 'ios') {
          const currentResizeMode = await Keyboard.getResizeMode();
          restoreResizeMode = currentResizeMode.mode ?? NATIVE_KEYBOARD_DEFAULT_MODE;
          const targetMode = options?.noResize ? KeyboardResize.None : KeyboardResize.Ionic;
          await Keyboard.setResizeMode({ mode: targetMode });
        }
      } catch (error) {
        console.warn('Unable to update keyboard resize mode for onboarding', error);
      }

      showListener = await Keyboard.addListener('keyboardWillShow', (info) => {
        if (isCancelled) return;
        setKeyboardHeight(info.keyboardHeight ?? 0);
        requestAnimationFrame(() => {
          const activeElement = document.activeElement as HTMLElement | null;
          if (typeof activeElement?.scrollIntoView === 'function') {
            activeElement.scrollIntoView({ block: 'center', inline: 'nearest' });
          }
        });
      });

      hideListener = await Keyboard.addListener('keyboardDidHide', () => {
        if (isCancelled) return;
        setKeyboardHeight(0);
      });
    };

    attachListeners();

    return () => {
      isCancelled = true;
      setKeyboardHeight(0);
      showListener?.remove();
      hideListener?.remove();
      if (Capacitor.getPlatform() === 'ios') {
        Keyboard.setResizeMode({ mode: restoreResizeMode }).catch(() => undefined);
      }
    };
  }, []);

  return {
    keyboardHeight,
    keyboardOpen: keyboardHeight > 0,
  };
};
