import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fechou.finance',
  appName: 'Fechou Finance',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
