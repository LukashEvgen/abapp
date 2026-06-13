import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSensitiveActionGuard} from '../hooks/useSensitiveActionGuard';
import {colors, spacing, typography} from '../utils/theme';

/**
 * Wraps a sensitive screen with biometric + jailbreak check on mount.
 * While waiting for the guard the screen shows a loader.
 * If the guard fails (biometric rejected / jailbreak) the screen
 * renders nothing and navigates back.
 */
export default function SensitiveScreenGuard({children}) {
  const navigation = useNavigation();
  const guard = useSensitiveActionGuard();
  const [ready, setReady] = useState(false);

  const runGuard = useCallback(async () => {
    await guard(async () => {
      setReady(true);
    });
    if (!ready) {
      navigation.goBack?.();
    }
  }, [guard, navigation, ready]);

  useEffect(() => {
    runGuard();
  }, [runGuard]);

  if (!ready) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.text}>Перевірка безпеки…</Text>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.body,
    marginTop: spacing.md,
    color: colors.muted,
  },
});
