/**
 * Hook that wraps sensitive actions with biometric + jailbreak checks.
 */

import {useCallback} from 'react';
import {Alert} from 'react-native';
import {useSecurity} from '../context/SecurityContext';

export function useSensitiveActionGuard() {
  const {requireBiometric, jailbreakDetected} = useSecurity();

  const guard = useCallback(
    async actionFn => {
      if (jailbreakDetected) {
        Alert.alert(
          'Функція заблокована',
          'Ця функція недоступна на модифікованому пристроі.',
        );
        return;
      }
      const ok = await requireBiometric();
      if (!ok) {
        return;
      }
      await actionFn();
    },
    [jailbreakDetected, requireBiometric],
  );

  return guard;
}
