jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(() => ({logout: jest.fn()})),
}));

jest.mock('../security/jailbreak', () => ({
  isJailBroken: jest.fn(() => false),
}));

jest.mock('../security/biometric', () => ({
  isBiometricAvailable: jest.fn(() => Promise.resolve(false)),
  promptBiometric: jest.fn(() => Promise.resolve(true)),
  refreshSession: jest.fn(() => Promise.resolve()),
  isSessionExpired: jest.fn(() => Promise.resolve(false)),
  invalidateSession: jest.fn(() => Promise.resolve()),
}));

jest.mock('../hooks/useInactivityTimer', () => ({
  useInactivityTimer: jest.fn(),
  INACTIVITY_MS: 900000,
}));

jest.mock('react-native', () => ({
  Alert: {alert: jest.fn()},
  AppState: {addEventListener: jest.fn(() => ({remove: jest.fn()})), currentState: 'active'},
  ActivityIndicator: 'ActivityIndicator',
  View: 'View',
  Text: 'Text',
  StyleSheet: {create: (styles) => styles, absoluteFillObject: {}},
}));

import React from 'react';
import renderer from 'react-test-renderer';
import SecurityGate from '../components/SecurityGate';

function DummyChild() {
  return React.createElement('View', {testID: 'child'}, 'child');
}

describe('SecurityGate', () => {
  it('renders children', () => {
    const tree = renderer.create(
      <SecurityGate>
        <DummyChild />
      </SecurityGate>,
    );
    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });
});
