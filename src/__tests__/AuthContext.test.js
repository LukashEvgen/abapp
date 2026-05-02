jest.mock('@react-native-firebase/auth', () => {
  const signInWithPhoneNumber = jest.fn(() =>
    Promise.resolve({
      confirm: jest.fn(() => Promise.resolve({user: {uid: '123'}})),
    }),
  );
  const signOut = jest.fn(() => Promise.resolve());
  const onAuthStateChanged = jest.fn(() => {
    return () => {};
  });
  return jest.fn(() => ({
    signInWithPhoneNumber,
    signOut,
    onAuthStateChanged,
  }));
});

jest.mock('@react-native-firebase/firestore', () => {
  const get = jest.fn(() => Promise.resolve({exists: false}));
  const doc = jest.fn(() => ({get}));
  const collection = jest.fn(() => ({doc}));
  return jest.fn(() => ({collection}));
});

import React from 'react';
import renderer from 'react-test-renderer';
import {AuthProvider, useAuth} from '../context/AuthContext';

function DummyConsumer() {
  const {user, initializing, isLawyer} = useAuth();
  return (
    <>
      {user?.uid ?? 'no-user'}
      {initializing ? 'init' : 'ready'}
      {isLawyer ? 'lawyer' : 'not-lawyer'}
    </>
  );
}

describe('AuthContext', () => {
  it('renders AuthProvider without crashing', () => {
    expect(() => {
      renderer.create(
        <AuthProvider>
          <DummyConsumer />
        </AuthProvider>,
      );
    }).not.toThrow();
  });

  it('useAuth can be called inside provider', () => {
    let hookResult;
    function CaptureHook() {
      hookResult = useAuth();
      return null;
    }
    renderer.create(
      <AuthProvider>
        <CaptureHook />
      </AuthProvider>,
    );
    expect(hookResult).toBeDefined();
    expect(hookResult).toHaveProperty('user');
    expect(hookResult).toHaveProperty('initializing');
    expect(hookResult).toHaveProperty('isLawyer');
    expect(hookResult).toHaveProperty('loginWithPhone');
    expect(hookResult).toHaveProperty('confirmCode');
    expect(hookResult).toHaveProperty('logout');
  });
});
