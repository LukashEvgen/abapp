/**
 * Session expiry logic.
 * Session TTL: 30 minutes.
 */

import {
  getSessionTimestamp,
  storeSessionTimestamp,
  clearSession,
} from './biometric';

export const SESSION_TTL_MS = 30 * 60 * 1000;

export async function refreshSession() {
  await storeSessionTimestamp();
}

export async function isSessionExpired() {
  const ts = await getSessionTimestamp();
  if (!ts) return true;
  return Date.now() - ts > SESSION_TTL_MS;
}

export async function invalidateSession() {
  await clearSession();
}
