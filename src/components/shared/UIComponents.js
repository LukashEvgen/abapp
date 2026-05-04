import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {colors, spacing, radius, typography, tokens} from '../../utils/theme';
import {statusColors, statusBgColors, initials} from '../../utils/helpers';

export const Badge = ({status}) => {
  const color = statusColors[status] || colors.muted;
  const bg = statusBgColors[status] || colors.semantic.warningBg;
  return (
    <View style={[styles.badge, {backgroundColor: bg}]}>
      <View style={[styles.dot, {backgroundColor: color}]} />
      <Text style={[styles.badgeText, {color}]}>{status}</Text>
    </View>
  );
};

export const GoldButton = ({
  title,
  onPress,
  variant = 'filled',
  size = 'normal',
  disabled = false,
  loading = false,
  style,
}) => {
  const isGhost = variant === 'ghost';
  const isSmall = size === 'small';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        isGhost && styles.ghost,
        isSmall && styles.small,
        (disabled || loading) && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={isGhost ? colors.primary : colors.bg} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            isGhost && styles.ghostText,
            isSmall && styles.smallText,
          ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export const Card = ({children, onPress, style}) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} style={[styles.card, style]}>
      {children}
    </Wrapper>
  );
};

export const SectionLabel = ({text}) => (
  <Text style={styles.sectionLabel}>{text}</Text>
);

export const Input = ({
  placeholder,
  value,
  onChangeText,
  multiline,
  numberOfLines,
  style,
}) => (
  <View style={[styles.inputWrap, style]}>
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      numberOfLines={numberOfLines || 1}
      style={[
        styles.input,
        multiline && {
          minHeight: (numberOfLines || 4) * 20,
          textAlignVertical: 'top',
        },
      ]}
    />
  </View>
);

export const AlertBanner = ({type, text, onPress}) => {
  const palette = {
    danger: {bg: colors.semantic.dangerBg, color: colors.danger},
    warning: {bg: colors.semantic.warningBg, color: colors.warning},
    gold: {bg: colors.brand.primaryMuted, color: colors.gold},
    success: {bg: colors.semantic.successBg, color: colors.success},
  }[type] || {bg: colors.brand.primaryMuted, color: colors.gold};

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.alertBanner, {backgroundColor: palette.bg}]}>
      <Text style={[styles.alertText, {color: palette.color}]}>{text}</Text>
      <Text style={[styles.alertArrow, {color: palette.color}]}>→</Text>
    </TouchableOpacity>
  );
};

export const StatCard = ({icon, label, value}) => (
  <View style={styles.statCard}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const Avatar = ({name, size = 40}) => {
  const {initials: getInitials} = require('../../utils/helpers');
  return (
    <View
      style={[
        styles.avatar,
        {width: size, height: size, borderRadius: size / 2},
      ]}>
      <Text style={[styles.avatarText, {fontSize: size * 0.4}]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

export const LoadingScreen = () => (
  <View style={styles.loadingScreen}>
    <ActivityIndicator size="large" color={colors.gold} />
  </View>
);

export const EmptyState = ({icon = '📭', title, subtitle}) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
  </View>
);

export const ProgressBar = ({progress, color = colors.gold, height = 6}) => (
  <View style={[styles.progressTrack, {height}]}>
    <View
      style={[
        styles.progressFill,
        {
          width: `${Math.min(100, Math.max(0, progress))}%`,
          backgroundColor: color,
          height,
        },
      ]}
    />
  </View>
);

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  badgeText: {
    fontSize: tokens.typography.size.xs,
    fontWeight: tokens.typography.weight.semibold,
  },
  button: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  disabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: colors.bg,
    fontWeight: tokens.typography.weight.bold,
    fontSize: tokens.typography.size.base,
  },
  ghostText: {
    color: colors.gold,
  },
  smallText: {
    fontSize: tokens.typography.size.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  inputWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    color: colors.text,
    fontSize: tokens.typography.size.base,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  alertText: {
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
    flex: 1,
  },
  alertArrow: {
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.bold,
    marginLeft: spacing.sm,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  statIcon: {
    fontSize: tokens.typography.size['2xl'],
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.text,
    fontSize: tokens.typography.size.xl,
    fontWeight: tokens.typography.weight.bold,
  },
  statLabel: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.xs,
  },
  avatar: {
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.bg,
    fontWeight: tokens.typography.weight.bold,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyIcon: {
    fontSize: tokens.typography.size['3xl'],
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.semibold,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: tokens.typography.size.base,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  progressTrack: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm / 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    borderRadius: radius.sm / 2,
  },
});
