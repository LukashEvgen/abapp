jest.mock('react-native-biometrics', () => ({
  __esModule: true,
  default: {
    isSensorAvailable: jest.fn(() => Promise.resolve({available: true})),
    simplePrompt: jest.fn(() => Promise.resolve({success: true})),
  },
}));

jest.mock('react-native-keychain', () => {
  let stored = null;
  return {
    setGenericPassword: jest.fn((u, p) => { stored = p; return Promise.resolve(); }),
    getGenericPassword: jest.fn(() => stored ? Promise.resolve({username: 'user', password: stored}) : Promise.resolve(false)),
    resetGenericPassword: jest.fn(() => { stored = null; return Promise.resolve(true); }),
  };
});

import {
  isBiometricAvailable,
  promptBiometric,
  storeSessionTimestamp,
  getSessionTimestamp,
  clearSession,
} from '../security/biometric';
import {isSessionExpired, refreshSession, invalidateSession} from '../security/session';

describe('biometric module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('detects sensor availability', async () => {
    const result = await isBiometricAvailable();
    expect(result).toBe(true);
  });

  it('prompts biometric successfully', async () => {
    const result = await promptBiometric('Title', 'Subtitle');
    expect(result).toBe(true);
  });

  it('stores and retrieves session timestamp', async () => {
    await storeSessionTimestamp();
    const ts = await getSessionTimestamp();
    expect(ts).toBeGreaterThan(0);
    expect(ts).toBeLessThanOrEqual(Date.now());
  });

  it('clears session timestamp', async () => {
    await storeSessionTimestamp();
    await clearSession();
    const ts = await getSessionTimestamp();
    expect(ts).toBeNull();
  });
});

describe('session module', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await invalidateSession();
  });

  it('isSessionExpired returns true when no timestamp', async () => {
    const expired = await isSessionExpired();
    expect(expired).toBe(true);
  });

  it('refreshSession stores current timestamp', async () => {
    await refreshSession();
    const expired = await isSessionExpired();
    expect(expired).toBe(false);
  });

  it('isSessionExpired returns true after 30 min', async () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    await refreshSession();
    // Move time forward 31 minutes
    Date.now.mockReturnValue(now + 31 * 60 * 1000);
    const expired = await isSessionExpired();
    expect(expired).toBe(true);
    Date.now.mockRestore();
  });
});
