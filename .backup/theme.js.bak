import {StyleSheet} from 'react-native';
import tokens from '../../design/tokens.json';

// ----------------------------------------------------------------
// LexTrack Theme — V3 (Light theme · Pantone 7459 C teal + 444 C grey)
// Source of truth: design/tokens.json (v3.0.0)
// ----------------------------------------------------------------

const c = tokens.colors;
const sh = tokens.shadows;

const flatShadow = (level) => ({
  ...(sh[level]?.ios || {}),
  elevation: sh[level]?.android?.elevation || 0,
});

// ----------------------------------------------------------------
// Re-export raw tokens for direct size/weight/radius access
// ----------------------------------------------------------------
export {tokens};

// ----------------------------------------------------------------
// Colors — legacy flat keys preserved for backward compatibility.
// New V3 semantic keys added (primaryLight/Dark, secondary, textTertiary, etc.)
// ----------------------------------------------------------------
export const colors = {
  // --- legacy primitive keys (V3 light values; names kept for backward compat) ---
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

  // --- V3 additional flat keys ---
  primaryLight: tokens.colors.brand.primaryLight,
  secondary: tokens.colors.brand.secondary,
  textSecondary: tokens.colors.text.secondary,
  textTertiary: tokens.colors.text.tertiary,

  // --- new systematic palettes ---
  brand: tokens.colors.brand,
  semantic: tokens.colors.semantic,
  neutral: tokens.colors.neutral,
  surfaceSemantic: tokens.colors.surface,
  borderSemantic: tokens.colors.border,
  textSemantic: tokens.colors.text,
};

// ----------------------------------------------------------------
// Spacing — legacy alias keys preserved; scale keys also exposed.
// ----------------------------------------------------------------
export const spacing = {
  ...tokens.spacing.scale,
  ...tokens.spacing.alias,
};

// ----------------------------------------------------------------
// Radius — full token scale exposed.
// ----------------------------------------------------------------
export const radius = tokens.radius;

// ----------------------------------------------------------------
// Typography — aligned to token scale.
// ----------------------------------------------------------------
export const typography = {
  h1: {
    fontSize: tokens.typography.size['2xl'],
    fontWeight: tokens.typography.weight.bold,
    letterSpacing: tokens.typography.letterSpacing.wide,
    color: colors.text,
    lineHeight: tokens.typography.size['2xl'] * tokens.typography.lineHeight.tight,
  },
  h2: {
    fontSize: tokens.typography.size.xl,
    fontWeight: tokens.typography.weight.semibold,
    letterSpacing: tokens.typography.letterSpacing.wide,
    color: colors.text,
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
    lineHeight: tokens.typography.size.base * tokens.typography.lineHeight.normal,
  },
  bodyLg: {
    fontSize: tokens.typography.size.md,
    color: colors.text,
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
  mono: {
    fontSize: tokens.typography.size.sm,
    fontFamily: tokens.typography.family.mono,
    color: colors.text,
  },
};

// ----------------------------------------------------------------
// Shadows — token-powered map for iOS / Android parity.
// Backward-compatible nested shape (keys 0..3 with ios/android).
// ----------------------------------------------------------------
export const shadows = tokens.shadows;

// ----------------------------------------------------------------
// Global Styles (backward compatible + V3 additions).
// ----------------------------------------------------------------
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
    ...flatShadow(1),
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
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.text,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGhostText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});

export default {colors, spacing, radius, typography, shadows, globalStyles};
