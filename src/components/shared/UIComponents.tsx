import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {colors, spacing, radius, typography} from '../../utils/theme';
import {statusColors, statusBgColors} from '../../utils/helpers';

export {default as Logo} from './Logo';

interface BadgeProps {
  status: string;
}

export const Badge = ({status}: BadgeProps) => {
  const color = statusColors[status] || colors.muted;
  const bg = statusBgColors[status] || colors.semantic.warningBg;
  return (
    <View style={[styles.badge, {backgroundColor: bg}]}>
      <View style={[styles.dot, {backgroundColor: color}]} />
      <Text style={[styles.badgeText, {color}]}>{status}</Text>
    </View>
  );
};

/**
 * GoldButton — primary CTA. Name kept for back-compat from V1
 * (palette is now teal, not gold).
 */
interface GoldButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'filled' | 'ghost';
  size?: 'normal' | 'small';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

export const GoldButton = ({
  title,
  onPress,
  variant = 'filled',
  size = 'normal',
  disabled = false,
  loading = false,
  style,
}: GoldButtonProps) => {
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
        <ActivityIndicator color={isGhost ? colors.brand.primary : colors.bg} />
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

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}

export const Card = ({children, onPress, style}: CardProps) => {
  return (
    <View style={[styles.card, style]}>
      {onPress ? (
        <TouchableOpacity onPress={onPress} style={{flex: 1}}>
          {children}
        </TouchableOpacity>
      ) : (
        children
      )}
    </View>
  );
};

interface SectionLabelProps {
  text: string;
}

export const SectionLabel = ({text}: SectionLabelProps) => (
  <Text style={styles.sectionLabel}>{text}</Text>
);

interface InputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
  style?: any;
}

export const Input = ({
  placeholder,
  value,
  onChangeText,
  multiline,
  numberOfLines,
  style,
}: InputProps) => (
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

interface AlertBannerProps {
  type: 'danger' | 'warning' | 'brand' | 'gold' | 'success';
  text: string;
  onPress?: () => void;
}

export const AlertBanner = ({type, text, onPress}: AlertBannerProps) => {
  const palette: Record<string, {bg: string; color: string}> = {
    danger: {bg: colors.semantic.dangerBg, color: colors.danger},
    warning: {bg: colors.semantic.warningBg, color: colors.warning},
    brand: {bg: colors.brand.primaryMuted, color: colors.brand.primary},
    // legacy alias
    gold: {bg: colors.brand.primaryMuted, color: colors.brand.primary},
    success: {bg: colors.semantic.successBg, color: colors.success},
  };

  const selectedPalette = palette[type] || palette.brand;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.alertBanner, {backgroundColor: selectedPalette.bg}]}>
      <Text style={[styles.alertText, {color: selectedPalette.color}]}>{text}</Text>
      <Text style={[styles.alertArrow, {color: selectedPalette.color}]}>→</Text>
    </TouchableOpacity>
  );
};

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
}

export const StatCard = ({icon, label, value}: StatCardProps) => (
  <View style={styles.statCard}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

interface AvatarProps {
  name: string;
  size?: number;
}

export const Avatar = ({name, size = 40}: AvatarProps) => {
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
    <ActivityIndicator size="large" color={colors.brand.primary} />
  </View>
);

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

export const EmptyState = ({icon = '📭', title, subtitle}: EmptyStateProps) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
  </View>
);

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
}

export const ProgressBar = ({progress, color = colors.brand.primary, height = 6}: ProgressBarProps) => (
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
    fontSize: 11,
    fontWeight: '600' as const,
  },
  button: {
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.brand.primary,
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
    fontWeight: '700' as const,
    fontSize: 14,
  },
  ghostText: {
    color: colors.brand.primary,
  },
  smallText: {
    fontSize: 12,
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
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
  alertArrow: {
    fontSize: 18,
    fontWeight: '700' as const,
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
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700' as const,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  avatar: {
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.bg,
    fontWeight: '700' as const,
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
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  progressTrack: {
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    borderRadius: 3,
  },
});