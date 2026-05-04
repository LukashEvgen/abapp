import {useEffect, useRef} from 'react';
import {Alert} from 'react-native';
import {
  registerForPushNotifications,
  listenToTokenRefresh,
  onMessageReceived,
  getInitialNotification,
  onNotificationOpenedApp,
} from '../services/pushNotifications';
import {useAuth} from '../context/AuthContext';
import {navigationRef} from '../navigation/navigationRef';

function routeFromNotification(message) {
  const data = message?.data || {};
  const screen = data.screen;
  const params = data.params ? JSON.parse(data.params) : undefined;

  if (!screen) {
    return;
  }

  if (navigationRef.isReady()) {
    navigationRef.navigate(screen, params);
  }
}

export default function PushNotificationsProvider({children}) {
  const {user, initializing, isLawyer} = useAuth();
  const tokenUnsubscribeRef = useRef(null);
  const foregroundUnsubscribeRef = useRef(null);
  const openedAppUnsubscribeRef = useRef(null);

  // Register once auth state is stable and user is present
  useEffect(() => {
    if (initializing || !user) {
      return;
    }

    const role = isLawyer ? 'lawyer' : 'client';

    registerForPushNotifications(role).catch(err => {
      // Silently fail; logging is sufficient for non-critical feature
      console.warn('Push registration failed:', err);
    });

    tokenUnsubscribeRef.current = listenToTokenRefresh(role);
    foregroundUnsubscribeRef.current = onMessageReceived(message => {
      console.log('Foreground push message:', message);
      const title = message?.notification?.title || 'Нове сповіщення';
      const body = message?.notification?.body || '';
      Alert.alert(title, body);
    });

    openedAppUnsubscribeRef.current = onNotificationOpenedApp(message => {
      console.log('Notification opened app:', message);
      routeFromNotification(message);
    });

    // Cold-start / killed-state notification check
    getInitialNotification().then(message => {
      if (message) {
        console.log('Initial notification:', message);
        routeFromNotification(message);
      }
    });

    return () => {
      tokenUnsubscribeRef.current?.();
      foregroundUnsubscribeRef.current?.();
      openedAppUnsubscribeRef.current?.();
      tokenUnsubscribeRef.current = null;
      foregroundUnsubscribeRef.current = null;
      openedAppUnsubscribeRef.current = null;
    };
  }, [initializing, user, isLawyer]);

  return children;
}
