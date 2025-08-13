// context/WebSocketProvider.tsx
import React, { createContext, useContext, useMemo } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useIonToast } from '@ionic/react';

import './WebsocketContext.css'

const WebSocketContext = createContext<ReturnType<typeof useWebSocket> | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [present] = useIonToast();

  const token = localStorage.getItem("token");
  const isAuthenticated = !!token;

  // ✅ Extracted and guarded toast logic
  const handleError = (errorMessage: string) => {
    if (!isAuthenticated) {
      console.log("[WebSocket] Skipping toast — user not logged in");
      return;
    }

    present({
      message: errorMessage,
      duration: 4000,
      color: 'danger',
      position: 'bottom',
      cssClass: 'websocket-toast-offset',
    });
  };

  const ws = useWebSocket(handleError); 


  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider");
  }
  return context;
};
