import '@testing-library/jest-dom';
import React from 'react';
import { setupIonicReact } from '@ionic/react';
import { vi } from 'vitest';

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');

  return {
    ...actual,
    // IonApp schedules bootstrap timers that can outlive jsdom teardown in Vitest.
    // Keep the rest of Ionic real, but make the app shell a simple wrapper in tests.
    IonApp: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

setupIonicReact({
  animated: false,
  statusTap: false,
});

// jsdom doesn't implement matchMedia — Ionic needs it for platform detection
window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    media: '',
    onchange: null,
    addListener: function () {},
    removeListener: function () {},
    addEventListener: function () {},
    removeEventListener: function () {},
    dispatchEvent: function () { return false; },
  } as MediaQueryList;
};
