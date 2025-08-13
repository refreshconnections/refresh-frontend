import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.refresh-connections.app',
  appName: 'Refresh Connections',
  webDir: 'templates/frontend',
  server: {
    androidScheme: 'https',
    // Android bc of cookies
    hostname: 'com.refreshconnections.app',

    // Ios bc of cookies
    // hostname: 'refreshconnections-production.up.railway.app',
    // hostname: '192.168.4.105:8000'
    // hostname: 'test-refreshconnections-staging.up.railway.app'
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    allowsLinkPreview: true,
    handleApplicationNotifications: false,
  },
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 3000,
      backgroundColor: "#22215d",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "large",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: false,
    },
  },
};

export default config;