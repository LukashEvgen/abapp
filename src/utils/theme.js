import {StyleSheet} from 'react-native';
import tokens from '../../design/tokens.json';

// ---------------------------------------------------------------------------
// Re-export raw tokens for direct size/weight/radius access (Palette V2 compliant)
// ---------------------------------------------------------------------------
export {tokens};

// ---------------------------------------------------------------------------
// Colors — legacy flat keys preserved for backward compatibility.
// New semantic access via colors.neutral / brand / semantic / surface / textSemantic.
// ---------------------------------------------------------------------------
export const colors = {
  // --- legacy primitive keys (V2 values; names kept for backward compat) ---
  bg: tokens.colors.surface.bg,
  surface: tokens.colors.surface.base,
  card: tokens.colors.surface.raised,
  border: tokens.colors.border.subtle,
  primary: tokens.colors.brand.primary,
  gold: tokens.colors.brand.primary,
  green: tokens.colors.brand.primaryDark,
  danger: tokens.colors.semantic.danger,
  warning: tokens.colors.semantic.warning,
  success: tokens.colors.semantic.success,
  info: tokens.colors.semantic.info,
  text: tokens.colors.text.primary,
  muted: tokens.colors.text.secondary,

  // --- new systematic palettes ---
  brand: tokens.colors.brand,
  semantic: tokens.colors.semantic,
  neutral: tokens.colors.neutral,
  surfaceSemantic: tokens.colors.surface,
  borderSemantic: tokens.colors.border,
  textSemantic: tokens.colors.text,
};

// ---------------------------------------------------------------------------
// Spacing — legacy alias keys preserved.
// ---------------------------------------------------------------------------
export const spacing = {
  xs: tokens.spacing.alias.xs,
  sm: tokens.spacing.alias.sm,
  md: tokens.spacing.alias.md,
  lg: tokens.spacing.alias.lg,
  xl: tokens.spacing.alias.xl,
};

// ---------------------------------------------------------------------------
// Radius — legacy keys preserved.
// ---------------------------------------------------------------------------
export const radius = {
  sm: tokens.radius.sm,
  md: tokens.radius.md,
  lg: tokens.radius.lg,
};

// ---------------------------------------------------------------------------
// Typography — aligned to token scale for hierarchy and consistency.
// ---------------------------------------------------------------------------
export const typography = {
  h1: {
    fontSize: tokens.typography.size['2xl'],
    fontWeight: tokens.typography.weight.bold,
    color: colors.text,
    letterSpacing: tokens.typography.letterSpacing.wide,
    lineHeight:
      tokens.typography.size['2xl'] * tokens.typography.lineHeight.tight,
  },
  h2: {
    fontSize: tokens.typography.size.xl,
    fontWeight: tokens.typography.weight.semibold,
    color: colors.text,
    letterSpacing: tokens.typography.letterSpacing.wide,
    lineHeight: tokens.typography.size.xl * tokens.typography.lineHeight.snug,
  },
  h3: {
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.semibold,
    color: colors.text,
    lineHeight: tokens.typography.size.lg * tokens.typography.lineHeight.normal,
  },
  body: {
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.regular,
    color: colors.text,
    lineHeight:
      tokens.typography.size.base * tokens.typography.lineHeight.normal,
  },
  caption: {
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.regular,
    color: colors.muted,
    lineHeight: tokens.typography.size.sm * tokens.typography.lineHeight.normal,
  },
  label: {
    fontSize: tokens.typography.size.xs,
    fontWeight: tokens.typography.weight.semibold,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: tokens.typography.letterSpacing.wider,
    lineHeight: tokens.typography.size.xs * tokens.typography.lineHeight.tight,
  },
};

// ---------------------------------------------------------------------------
// Shadows — token-powered map for iOS / Android parity.
// ---------------------------------------------------------------------------
export const shadows = tokens.shadows;

// ---------------------------------------------------------------------------
// Global Styles (backward compatible; prefer composing from tokens).
// ---------------------------------------------------------------------------
export const globalStyles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {flexDirection: 'row', alignItems: 'center'},
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {alignItems: 'center', justifyContent: 'center'},
  text: {color: colors.text, fontSize: tokens.typography.size.base},
  mutedText: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
  },
  goldText: {
    color: colors.gold,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
  },
});
