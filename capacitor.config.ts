import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maryjanecannabisco.app',
  appName: 'Mary Jane Cannabis Co.',
  webDir: 'www',
  server: {
    hostname: "com.maryjanecannabisco.app",
    androidScheme: "https",
    allowNavigation: ["pay.aero.inc"]
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 0, // Disables Capacitor's default splash screen to use custom Angular component
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    DeepLinks: {
      schemes: ["maryjanecannabisco"],
      hosts: ["dispensary-api-ac9613fa4c11.herokuapp.com"]
    }
  },
};

export default config;
