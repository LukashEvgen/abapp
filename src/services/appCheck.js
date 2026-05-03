import {Platform} from 'react-native';
import appCheck from '@react-native-firebase/app-check';

/**
 * Activate Firebase App Check.
 * - Debug provider is used in development so emulators / side-loaded builds can pass attestation.
 * - Play Integrity (Android) / DeviceCheck (iOS) are used in release builds.
 */
export async function activateAppCheck() {
  const provider = Platform.OS === 'android' ? 'playintegrity' : 'deviceCheck';
  const chosenProvider = __DEV__ ? 'debug' : provider;

  try {
    await appCheck().activate(chosenProvider, true);
    // eslint-disable-next-line no-console
    console.log(`Firebase App Check activated: ${chosenProvider}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Firebase App Check activation failed:', error);
    throw error;
  }
}
