import {jest} from '@jest/globals';
import {
  saveToken,
  registerForPushNotifications,
  listenToTokenRefresh,
} from '../services/pushNotifications';

jest.mock('@react-native-firebase/auth', () => {
  return jest.fn(() => ({
    currentUser: {uid: 'user-123'},
  }));
});

jest.mock('@react-native-firebase/messaging', () => {
  return jest.fn(() => ({
    getToken: jest.fn(() => Promise.resolve('test-fcm-token')),
    onTokenRefresh: jest.fn((_cb: (t: string) => void) => {
      return () => {};
    }),
  }));
});

const mockDocUpdate = jest.fn(() => Promise.resolve());
const mockDocSet = jest.fn(() => Promise.resolve());
const mockDocGet = jest.fn(() => Promise.resolve({exists: false, data: () => null}));

let collectionName: string | null = null;

const mockFieldValueServerTimestamp = jest.fn(() => '__server_timestamp__');

const mockDoc = jest.fn(() => ({
  get: mockDocGet,
  update: mockDocUpdate,
  set: mockDocSet,
  collection: jest.fn(() => ({doc: mockDoc})),
}));

jest.mock('@react-native-firebase/firestore', () => {
  const instance = jest.fn(() => ({
    collection: jest.fn((name: string) => {
      collectionName = name;
      return {doc: mockDoc};
    }),
    FieldValue: {
      serverTimestamp: mockFieldValueServerTimestamp,
    },
  }));
  instance.FieldValue = {
    serverTimestamp: mockFieldValueServerTimestamp,
  };
  instance.serverTimestamp = mockFieldValueServerTimestamp;
  return instance;
});

jest.mock('react-native', () => {
  return {
    Platform: {OS: 'ios', Version: 16},
    PermissionsAndroid: {
      PERMISSIONS: {POST_NOTIFICATIONS: 'POST_NOTIFICATIONS'},
      RESULTS: {GRANTED: 'granted'},
      request: jest.fn(() => Promise.resolve('granted')),
    },
  };
});

describe('pushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDocUpdate.mockReset();
    mockDocSet.mockReset();
    mockDocGet.mockReset();
    mockFieldValueServerTimestamp.mockReset();
    collectionName = null;
  });

  describe('saveToken', () => {
    it('saves token to lawyers/{uid} when role = lawyer', async () => {
      await saveToken('token-1', 'lawyer');
      expect(collectionName).toBe('lawyers');
      expect(mockDocUpdate).toHaveBeenCalledWith({fcmToken: 'token-1'});
      expect(mockDocSet).toHaveBeenCalledWith({
        token: 'token-1',
        platform: 'ios',
        updatedAt: expect.any(Date),
      });
    });

    it('saves token to clients/{uid} when role = client', async () => {
      await saveToken('token-1', 'client');
      expect(collectionName).toBe('clients');
      expect(mockDocUpdate).toHaveBeenCalledWith({fcmToken: 'token-1'});
    });

    it('returns early when no user is authenticated', async () => {
      const authMock = require('@react-native-firebase/auth');
      authMock.mockReturnValueOnce({currentUser: null});
      await saveToken('token-1', 'client');
      expect(mockDocUpdate).not.toHaveBeenCalled();
    });
  });

  describe('registerForPushNotifications', () => {
    it('saves token with provided role', async () => {
      await registerForPushNotifications('lawyer');
      expect(collectionName).toBe('lawyers');
      expect(mockDocUpdate).toHaveBeenCalledWith({fcmToken: 'test-fcm-token'});
    });

    it('short-circuits when no token is returned', async () => {
      const messagingMock = require('@react-native-firebase/messaging');
      messagingMock.mockReturnValueOnce({
        getToken: jest.fn(() => Promise.resolve(null)),
      });
      await registerForPushNotifications('client');
      expect(mockDocUpdate).not.toHaveBeenCalled();
    });
  });

  describe('listenToTokenRefresh', () => {
    it('returns an unsubscribe function', () => {
      const unsubscribe = listenToTokenRefresh('client');
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
