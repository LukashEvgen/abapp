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
});
