import {Platform} from 'react-native';
import appCheck from '@react-native-firebase/app-check';

/**
 * Activate Firebase App Check.
 * - Debug provider is used in development so emulators / side-loaded builds can pass attestation.
 * - Play Integrity (Android) / DeviceCheck (iOS) are used in release builds.
 * - Debug tokens are printed to console for CI/emulator registration in Firebase Console.
 */
export async function activateAppCheck(): Promise<void> {
  const provider = Platform.OS === 'android' ? 'playintegrity' : 'deviceCheck';
  const chosenProvider = __DEV__ ? 'debug' : provider;

  try {
    // Debug builds: print token for Firebase Console registration
    if (__DEV__) {
      const token = await appCheck().getToken(true);
      // eslint-disable-next-line no-console
      console.log(`[AppCheck DEBUG TOKEN] ${token.token}`);
    }

    await appCheck().activate(chosenProvider, true);
    // eslint-disable-next-line no-console
    console.log(`Firebase App Check activated: ${chosenProvider}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Firebase App Check activation failed:', error);
    // In release builds App Check failure is non-fatal: log and continue
    if (!__DEV__) {
      // Optionally: send to crashlytics or Sentry here
      console.warn('App Check failed in release — Play Integrity may reject side-loaded APKs.');
    }
    throw error;
  }
}
