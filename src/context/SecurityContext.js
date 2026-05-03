import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {Alert, AppState} from 'react-native';
import {useInactivityTimer, INACTIVITY_MS} from '../hooks/useInactivityTimer';
import {isJailBroken} from '../security/jailbreak';
import {
  isBiometricAvailable,
  promptBiometric,
  refreshSession,
  isSessionExpired,
  invalidateSession,
} from '../security/biometric';

const SecurityContext = createContext({
  jailbreakDetected: false,
  biometricAvailable: false,
  requireBiometric: async () => false,
  lock: () => {},
  locked: false,
});

export const SecurityProvider = ({children, onLogout, onLockStateChange}) => {
  const [jailbreakDetected, setJailbreakDetected] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [locked, setLocked] = useState(false);
  const lockPendingRef = useRef(false);

  useEffect(() => {
    (async () => {
      const jailed = isJailBroken();
      if (jailed) {
        Alert.alert(
          'Попередження безпеки',
          'Виявлено модифікований пристрій (jailbreak/root). Частина функцій обмежена.',
        );
      }
      setJailbreakDetected(jailed);
      const bio = await isBiometricAvailable();
      setBiometricAvailable(bio);
    })();
  }, []);

  const requireBiometric = useCallback(async () => {
    if (locked) return false;
    if (!biometricAvailable) {
      return true; // fall through when biometric unavailable
    }
    const expired = await isSessionExpired();
    if (!expired) return true;

    setLocked(true);
    lockPendingRef.current = true;
    const ok = await promptBiometric(
      'Підтвердження особи',
      'Face ID / Fingerprint',
    );
    if (ok) {
      await refreshSession();
      setLocked(false);
      lockPendingRef.current = false;
      if (onLockStateChange) onLockStateChange(false);
    }
    return ok;
  }, [locked, biometricAvailable, onLockStateChange]);

  const lock = useCallback(() => {
    invalidateSession();
    setLocked(true);
    lockPendingRef.current = true;
    if (onLockStateChange) onLockStateChange(true);
  }, [onLockStateChange]);

  const handleInactivityExpire = useCallback(() => {
    if (lockPendingRef.current) return;
    lock();
    onLogout();
  }, [lock, onLogout]);

  useInactivityTimer(handleInactivityExpire);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && locked) {
        (async () => {
          if (lockPendingRef.current) {
            const ok = await promptBiometric();
            if (ok) {
              await refreshSession();
              setLocked(false);
              lockPendingRef.current = false;
              if (onLockStateChange) onLockStateChange(false);
            }
          }
        })();
      }
    });
    return () => subscription.remove();
  }, [locked, onLockStateChange]);

  return (
    <SecurityContext.Provider
      value={{
        jailbreakDetected,
        biometricAvailable,
        requireBiometric,
        lock,
        locked,
      }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => useContext(SecurityContext);
