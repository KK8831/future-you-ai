import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.korek.futureyouai',
  appName: 'FutureMe AI',
  webDir: 'dist',
  ios: {
    // Prevent the status bar from overlapping app content — handled by CSS safe-areas instead
    contentInset: 'always',
    // Disable the iOS rubber-band over-scroll — makes it feel more native
    scrollEnabled: true,
    backgroundColor: '#0c1222',
    preferredContentMode: 'mobile',
  },
  android: {
    // Keep WebView background matching our dark navy theme
    backgroundColor: '#0c1222',
    // Allow mixed content for Supabase connections
    allowMixedContent: true,
    // Hide the splash screen once the app is loaded
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      // Show splash while JS loads — prevents the white flash
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0c1222',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      // iOS-specific
      iosSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      // Prevents the keyboard from pushing the whole WebView up
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
