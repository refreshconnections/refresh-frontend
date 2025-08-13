import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.refresh-connections.app',
  appName: 'Refresh Connections',
  webDir: 'templates/frontend',
  server: {
    androidScheme: 'https',
    hostname: 'refreshconnections-production.up.railway.app'
  }
};

export default config;