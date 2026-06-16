import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {colors, spacing, typography} from '../../utils/theme';

interface TabItem {
  key: string;
  icon: string;
  label: string;
}

interface BottomNavigationProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

export default function BottomNavigation({tabs, active, onChange}: BottomNavigationProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab: TabItem) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{selected: isActive}}
            accessibilityLabel={tab.label}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    minHeight: 44,
  },
  icon: {
    fontSize: 20,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  iconActive: {
    color: colors.primary,
  },
  label: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textTertiary,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});