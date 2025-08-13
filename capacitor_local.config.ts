import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.refresh-connections.app',
  appName: 'Refresh Connections',
  webDir: 'templates/frontend',
  server: {
    androidScheme: 'https',
    hostname: '192.168.4.104:8000'
  }
};

export default config;