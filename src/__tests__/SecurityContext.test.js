jest.mock('react-native', () => ({
  Alert: {alert: jest.fn()},
  AppState: {addEventListener: jest.fn(() => ({remove: jest.fn()})), currentState: 'active'},
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

import React from 'react';
import renderer from 'react-test-renderer';
import {SecurityProvider, useSecurity} from '../context/SecurityContext';

function DummyConsumer() {
  const {jailbreakDetected, biometricAvailable, locked} = useSecurity();
  return (
    <>
      jail={jailbreakDetected ? 'yes' : 'no'}
      bio={biometricAvailable ? 'yes' : 'no'}
      lock={locked ? 'yes' : 'no'}
    </>
  );
}

describe('SecurityContext', () => {
  it('renders SecurityProvider without crashing', () => {
    const onLogout = jest.fn();
    const tree = renderer.create(
      <SecurityProvider onLogout={onLogout}>
        <DummyConsumer />
      </SecurityProvider>,
    );
    expect(tree).toBeTruthy();
  });

  it('exposes correct default values', () => {
    const onLogout = jest.fn();
    let hookResult;
    function CaptureHook() {
      hookResult = useSecurity();
      return null;
    }
    renderer.create(
      <SecurityProvider onLogout={onLogout}>
        <CaptureHook />
      </SecurityProvider>,
    );
    expect(hookResult).toBeDefined();
    expect(hookResult).toHaveProperty('jailbreakDetected');
    expect(hookResult).toHaveProperty('biometricAvailable');
    expect(hookResult).toHaveProperty('requireBiometric');
    expect(hookResult).toHaveProperty('lock');
    expect(hookResult).toHaveProperty('locked');
  });
});
