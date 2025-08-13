import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import { ChatBadgeContextProvider } from './components/ChatBadgeContext';
// import * as serviceWorkerRegistration from './serviceWorkerRegistration';
// import reportWebVitals from './reportWebVitals';

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { handleLogoutCommon } from './hooks/utilities';
import { WebSocketProvider } from './components/WebsocketContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300000,
    },
  },
  queryCache: new QueryCache({
    onError: async (error: any) => {
      if (error.response?.status == 401) {
        console.log("Query failed due to unauthorization", error)
        await handleLogoutCommon()
      }
    }
  }),
}
)



const container = document.getElementById('app');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
    <ChatBadgeContextProvider>
      <App />
    </ChatBadgeContextProvider>
    </WebSocketProvider>
    <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);

// // If you want your app to work offline and load faster, you can change
// // unregister() to register() below. Note this comes with some pitfalls.
// // Learn more about service workers: https://cra.link/PWA
// serviceWorkerRegistration.unregister();

// // If you want to start measuring performance in your app, pass a function
// // to log results (for example: reportWebVitals(console.log))
// // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
