import {Platform, PermissionsAndroid} from 'react-native';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const requestAndroidPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || Platform.Version < 33) {
    return true;
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

/**
 * Save FCM token to the user's document and devices subcollection.
 * This supports multiple devices and keeps the legacy fcmToken field in sync.
 */
const saveToken = async (
  token: string,
  role: 'client' | 'lawyer',
): Promise<void> => {
  const user = auth().currentUser;
  if (!user) {
    return;
  }
  const collection = role === 'lawyer' ? 'lawyers' : 'clients';
  const userRef = firestore().collection(collection).doc(user.uid);

  // Update legacy single-token field for backward compatibility
  await userRef.update({
    fcmToken: token,
  });

  // Store token in devices subcollection (supports multi-device)
  await userRef.collection('devices').doc(token).set({
    token,
    platform: Platform.OS,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const registerForPushNotifications = async (
  role: 'client' | 'lawyer',
): Promise<void> => {
  const permissionGranted = await requestAndroidPermission();
  if (!permissionGranted) {
    return;
  }

  const token = await messaging().getToken();
  if (token) {
    await saveToken(token, role);
  }
};

export const listenToTokenRefresh = (
  role: 'client' | 'lawyer',
): (() => void) => {
  return messaging().onTokenRefresh(async (token: string) => {
    await saveToken(token, role);
  });
};

export const onMessageReceived = (
  handler: (message: FirebaseMessagingTypes.RemoteMessage) => void,
): (() => void) => {
  return messaging().onMessage(handler);
};

export const setBackgroundMessageHandler = (
  handler: (message: FirebaseMessagingTypes.RemoteMessage) => Promise<void>,
): void => {
  messaging().setBackgroundMessageHandler(handler);
};

export const getInitialNotification =
  async (): Promise<FirebaseMessagingTypes.RemoteMessage | null> => {
    return messaging().getInitialNotification();
  };

export const onNotificationOpenedApp = (
  handler: (message: FirebaseMessagingTypes.RemoteMessage) => void,
): (() => void) => {
  return messaging().onNotificationOpenedApp(handler);
};
