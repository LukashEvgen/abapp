import React from 'react';
import {View, StyleSheet} from 'react-native';
import {colors, spacing} from '../../utils/theme';

export default function TimelineConnector({items, activeIndex}) {
  return (
    <View style={styles.container}>
      {items.map((_, idx) => (
        <View key={idx} style={styles.step}>
          <View style={[styles.dot, idx <= activeIndex && styles.dotActive]} />
          {idx < items.length - 1 && <View style={[styles.line, idx < activeIndex && styles.lineActive]} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  step: {
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.borderStrong,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
  },
  dotActive: {
    backgroundColor: colors.gold,
    borderColor: colors.goldMuted,
  },
  line: {
    width: 2,
    height: 24,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  lineActive: {
    backgroundColor: colors.gold,
  },
});
