import '@testing-library/jest-dom';
import { setupIonicReact } from '@ionic/react';

setupIonicReact();

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
