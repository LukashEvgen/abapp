/**
 * Biometric + secure session storage.
 *
 * Optional dependencies:
 *   - react-native-biometrics (native sensor)
 *   - react-native-keychain   (secure keychain storage)
 *
 * When the native modules are absent the helpers degrade gracefully
 * (biometric unavailable, in-memory session tracking).
 */

let ReactNativeBiometrics;
try {
  ReactNativeBiometrics = require('react-native-biometrics').default;
} catch {
  ReactNativeBiometrics = null;
}

let RNKeychain;
try {
  RNKeychain = require('react-native-keychain');
} catch {
  RNKeychain = null;
}

const SERVICE = 'com.lextrack.security';
const KEY_SESSION_TIMESTAMP = 'lextrack_session_timestamp';
const KEY_BIOMETRIC_ENABLED = 'lextrack_biometric_enabled';

/**
 * Check whether biometric sensor is available on the device.
 */
export async function isBiometricAvailable() {
  if (!ReactNativeBiometrics) return false;
  try {
    const {available} = await ReactNativeBiometrics.isSensorAvailable();
    return available;
  } catch {
    return false;
  }
}

/**
 * Prompt the user for biometric confirmation.
 */
export async function promptBiometric(
  title = 'Authentication required',
  subtitle = 'Confirm your identity',
) {
  if (!ReactNativeBiometrics) return false;
  try {
    const {success} = await ReactNativeBiometrics.simplePrompt({
      promptMessage: title,
    });
    return success;
  } catch {
    return false;
  }
}

/**
 * Store the current session timestamp securely (keychain if available).
 */
export async function storeSessionTimestamp() {
  const ts = Date.now().toString();
  if (RNKeychain) {
    try {
      await RNKeychain.setGenericPassword(KEY_SESSION_TIMESTAMP, ts, {
        service: SERVICE,
      });
      return;
    } catch {
      // fall through to in-memory fallback
    }
  }
  // In-memory fallback when keychain is unavailable.
  _inMemorySessionTimestamp = ts;
}

/**
 * Retrieve the stored session timestamp.
 */
export async function getSessionTimestamp() {
  if (RNKeychain) {
    try {
      const creds = await RNKeychain.getGenericPassword({service: SERVICE});
      return creds ? parseInt(creds.password, 10) : null;
    } catch {
      return null;
    }
  }
  return _inMemorySessionTimestamp
    ? parseInt(_inMemorySessionTimestamp, 10)
    : null;
}

/**
 * Clear stored session data.
 */
export async function clearSession() {
  if (RNKeychain) {
    try {
      await RNKeychain.resetGenericPassword({service: SERVICE});
    } catch {
      // ignore
    }
  }
  _inMemorySessionTimestamp = null;
}

let _inMemorySessionTimestamp = null;
