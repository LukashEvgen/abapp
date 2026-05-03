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
