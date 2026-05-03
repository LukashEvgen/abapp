/**
 * Jailbreak / root detection wrapper.
 *
 * Optional dependency: jail-monkey
 * When absent the module always reports safe (false).
 */

let JailMonkey;
try {
  JailMonkey = require('jail-monkey').default;
} catch {
  JailMonkey = null;
}

export function isJailBroken() {
  if (!JailMonkey) return false;
  try {
    return JailMonkey.isJailBroken();
  } catch {
    return false;
  }
}

export function isDebuggedMode() {
  if (!JailMonkey) return false;
  try {
    return JailMonkey.isDebuggedMode();
  } catch {
    return false;
  }
}
