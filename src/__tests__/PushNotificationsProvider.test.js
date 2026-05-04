import {jest} from '@jest/globals';
import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('../services/pushNotifications', () => ({
  __esModule: true,
  registerForPushNotifications: jest.fn(() => Promise.resolve()),
  listenToTokenRefresh: jest.fn(() => jest.fn()),
  onMessageReceived: jest.fn(() => jest.fn()),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../navigation/navigationRef', () => ({
  __esModule: true,
  navigationRef: {
    isReady: () => true,
    navigate: jest.fn(),
  },
}));

jest.mock('../context/AuthContext', () => ({
  __esModule: true,
  AuthProvider: ({children}) => children,
  useAuth: jest.fn(() => ({
    user: {uid: 'user-123'},
    initializing: false,
    isLawyer: false,
  })),
}));

jest.mock('@react-native-firebase/messaging', () => jest.fn());
jest.mock('@react-native-firebase/app', () => jest.fn());

import PushNotificationsProvider from '../components/PushNotificationsProvider';

const originalUseEffect = React.useEffect;

describe('PushNotificationsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(React, 'useEffect').mockImplementation(fn => fn());
  });

  afterEach(() => {
    React.useEffect = originalUseEffect;
  });

  it('calls registerForPushNotifications after auth is ready for client', () => {
    const {registerForPushNotifications} = jest.requireMock(
      '../services/pushNotifications',
    );
    renderer.create(
      <PushNotificationsProvider>
        <>{'child'}</>
      </PushNotificationsProvider>,
    );
    expect(registerForPushNotifications).toHaveBeenCalledTimes(1);
    expect(registerForPushNotifications).toHaveBeenCalledWith('client');
  });

  it('calls registerForPushNotifications after auth is ready for lawyer', () => {
    const useAuth = jest.requireMock('../context/AuthContext').useAuth;
    const {registerForPushNotifications} = jest.requireMock(
      '../services/pushNotifications',
    );
    useAuth.mockReturnValueOnce({
      user: {uid: 'user-123'},
      initializing: false,
      isLawyer: true,
    });

    renderer.create(
      <PushNotificationsProvider>
        <>{'child'}</>
      </PushNotificationsProvider>,
    );
    expect(registerForPushNotifications).toHaveBeenCalledTimes(1);
    expect(registerForPushNotifications).toHaveBeenCalledWith('lawyer');
  });

  it('renders children without crashing while auth is initializing', () => {
    const useAuth = jest.requireMock('../context/AuthContext').useAuth;
    useAuth.mockReturnValueOnce({
      user: {uid: 'user-123'},
      initializing: true,
      isLawyer: false,
    });

    expect(() => {
      renderer.create(
        <PushNotificationsProvider>
          <>{'child'}</>
        </PushNotificationsProvider>,
      );
    }).not.toThrow();
  });

  it('renders children without crashing when user is null', () => {
    const useAuth = jest.requireMock('../context/AuthContext').useAuth;
    useAuth.mockReturnValueOnce({
      user: null,
      initializing: false,
      isLawyer: false,
    });

    expect(() => {
      renderer.create(
        <PushNotificationsProvider>
          <>{'child'}</>
        </PushNotificationsProvider>,
      );
    }).not.toThrow();
  });
});
