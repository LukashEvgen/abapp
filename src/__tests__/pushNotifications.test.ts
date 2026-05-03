import {jest} from '@jest/globals';
import {saveToken, registerForPushNotifications, listenToTokenRefresh} from '../services/pushNotifications';

jest.mock('@react-native-firebase/auth', () => {
  return jest.fn(() => ({
    currentUser: {uid: 'user-123'},
  }));
});

jest.mock('@react-native-firebase/messaging', () => {
  return jest.fn(() => ({
    getToken: jest.fn(() => Promise.resolve('test-fcm-token')),
    onTokenRefresh: jest.fn((cb: (t: string) => void) => {
      return () => {};
    }),
  }));
});

const mockDocUpdate = jest.fn(() => Promise.resolve());
const mockDocGet = jest.fn(() => Promise.resolve({exists: false, data: () => null}));
const mockDoc = jest.fn(() => ({
  get: mockDocGet,
  update: mockDocUpdate,
}));

let collectionName: string | null = null;

jest.mock('@react-native-firebase/firestore', () => {
  return jest.fn(() => ({
    collection: jest.fn((name: string) => {
      collectionName = name;
      return {doc: mockDoc};
    }),
    FieldValue: {
      serverTimestamp: jest.fn(() => '__server_timestamp__'),
    },
  }));
});

describe('pushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDocUpdate.mockReset();
    mockDocGet.mockReset();
    collectionName = null;
  });

  describe('saveToken', () => {
    it('saves token to lawyers/{uid} when role = lawyer', async () => {
      await saveToken('token-1', 'lawyer');
      expect(collectionName).toBe('lawyers');
      expect(mockDocUpdate).toHaveBeenCalledWith({fcmToken: 'token-1'});
    });

    it('saves token to clients/{uid} when role = client', async () => {
      await saveToken('token-1', 'client');
      expect(collectionName).toBe('clients');
      expect(mockDocUpdate).toHaveBeenCalledWith({fcmToken: 'token-1'});
    });

    it('infers role from lawyers collection when no role provided', async () => {
      // Lawyers doc exists → inferred as lawyer
      mockDocGet.mockResolvedValueOnce({exists: true, data: () => ({})});
      await saveToken('token-1');
      expect(collectionName).toBe('lawyers');
      expect(mockDocUpdate).toHaveBeenCalledWith({fcmToken: 'token-1'});
    });

    it('falls back to clients when lawyers doc does not exist', async () => {
      // First call in saveToken: check lawyers doc → does not exist
      mockDocGet.mockResolvedValueOnce({exists: false, data: () => null});
      await saveToken('token-1');
      expect(collectionName).toBe('clients');
      expect(mockDocUpdate).toHaveBeenCalledWith({fcmToken: 'token-1'});
    });

    it('returns early when no user is authenticated', async () => {
      const authMock = require('@react-native-firebase/auth');
      authMock.mockReturnValueOnce({currentUser: null});
      await saveToken('token-1');
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
