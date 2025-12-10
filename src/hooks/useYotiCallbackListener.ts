import { useCallback, useEffect } from 'react';

export type YotiCallbackPayload = {
  type: 'yoti-verification';
  status?: string | null;
  sessionId?: string | null;
  session?: {
    id?: string | null;
    session_id?: string | null;
  };
};

const STORAGE_KEY = 'refresh-yoti-callback-payload';

export function useYotiCallbackListener(onPayload: (payload: YotiCallbackPayload) => void) {
  const handlePayload = useCallback(
    (payload: YotiCallbackPayload | null) => {
      if (!payload || payload.type !== 'yoti-verification') {
        return;
      }
      onPayload(payload);
    },
    [onPayload]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      handlePayload(event.data as YotiCallbackPayload);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }
      try {
        const payload = JSON.parse(event.newValue) as YotiCallbackPayload;
        handlePayload(payload);
      } catch (error) {
        console.error('Unable to parse stored Yoti callback payload', error);
      } finally {
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const payload = JSON.parse(stored) as YotiCallbackPayload;
        handlePayload(payload);
      } catch (error) {
        console.error('Unable to parse stored Yoti callback payload', error);
      } finally {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [handlePayload]);
}
