/**
 * Inactivity auto-logout hook.
 *
 * Uses AppState + a 1-second interval to track user activity.
 * Triggers onExpire after 15 minutes of inactivity.
 */

import {useEffect, useRef, useCallback} from 'react';
import {AppState} from 'react-native';

export const INACTIVITY_MS = 15 * 60 * 1000;

export function useInactivityTimer(onExpire) {
  const timerRef = useRef(null);
  const lastActiveRef = useRef(Date.now());

  const resetTimer = useCallback(() => {
    lastActiveRef.current = Date.now();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      if (Date.now() - lastActiveRef.current >= INACTIVITY_MS) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        onExpire();
      }
    }, 1000);
  }, [onExpire]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        const away = Date.now() - lastActiveRef.current;
        if (away >= INACTIVITY_MS) {
          onExpire();
        } else {
          resetTimer();
        }
      } else {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    });

    resetTimer();

    return () => {
      subscription.remove();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [onExpire, resetTimer]);

  return {resetTimer};
}
