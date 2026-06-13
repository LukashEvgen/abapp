import React from 'react';
import {View, TextInput, TouchableOpacity, StyleSheet, Text} from 'react-native';
import {colors, spacing, radius} from '../../utils/theme';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmit?: () => void;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder,
  onClear,
  onSubmit,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Пошук...'}
        placeholderTextColor={colors.textTertiary}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        accessibilityRole="search"
        accessibilityLabel={placeholder || 'Пошук'}
      />
      {value?.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearBtn} accessibilityLabel="Очистити пошук">
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  clearBtn: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  clearIcon: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '700',
  },
});
