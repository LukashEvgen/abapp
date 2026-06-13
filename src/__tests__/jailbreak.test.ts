jest.mock('jail-monkey', () => ({
  __esModule: true,
  default: {
    isJailBroken: jest.fn(() => false),
    isDebuggedMode: jest.fn(() => false),
  },
}));

import {isJailBroken, isDebuggedMode} from '../security/jailbreak';

describe('jailbreak module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false by default', () => {
    expect(isJailBroken()).toBe(false);
    expect(isDebuggedMode()).toBe(false);
  });

  it('returns true when jail-monkey reports jailbroken', () => {
    const JailMonkey = require('jail-monkey').default;
    JailMonkey.isJailBroken.mockReturnValue(true);
    expect(isJailBroken()).toBe(true);
  });

  it('returns true when jail-monkey reports debugged mode', () => {
    const JailMonkey = require('jail-monkey').default;
    JailMonkey.isDebuggedMode.mockReturnValue(true);
    expect(isDebuggedMode()).toBe(true);
  });

  it('returns false when jail-monkey throws', () => {
    const JailMonkey = require('jail-monkey').default;
    JailMonkey.isJailBroken.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(isJailBroken()).toBe(false);
  });
});
