import React, {useCallback} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {SecurityProvider, useSecurity} from '../context/SecurityContext';
import {useAuth} from '../context/AuthContext';
import {colors, spacing, tokens} from '../utils/theme';

function SecurityOverlay({children}) {
  const {locked} = useSecurity();
  if (!locked) {
    return children;
  }
  return (
    <>
      {children}
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.overlayText}>Підтвердження особи…</Text>
      </View>
    </>
  );
}

export default function SecurityGate({children}) {
  const {logout} = useAuth();

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <SecurityProvider onLogout={handleLogout}>
      <SecurityOverlay>{children}</SecurityOverlay>
    </SecurityProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  overlayText: {
    color: colors.gold,
    marginTop: spacing.md,
    fontSize: tokens.typography.size.md,
    fontWeight: tokens.typography.weight.semibold,
  },
});
