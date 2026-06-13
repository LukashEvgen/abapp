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

export const colors = {
  // Brand
  primary:       c.brand.primary,        // #2A8FA8
  primaryLight:  c.brand.primaryLight,   // #4FA9BF
  primaryDark:   c.brand.primaryDark,    // #1F6F84
  primaryMuted:  c.brand.primaryMuted,
  secondary:     c.brand.secondary,      // #7C8084
  secondaryDark: c.brand.secondaryDark,
  secondaryMuted: c.brand.secondaryMuted,

  // Surfaces (light)
  background:   c.surface.bg,      // #FFFFFF
  surface:      c.surface.base,    // #F8F9FA — inputs / search
  surfaceRaised: c.surface.raised, // #FFFFFF — cards
  surfaceSunken: c.surface.sunken, // #F1F3F4 — hover / alt rows
  card:         c.surface.raised,
  inputBg:      c.surface.base,

  // Border
  border:        c.border.subtle,   // #E4E7E9
  borderDefault: c.border.default,  // #C9CDD0
  borderStrong:  c.border.strong,   // #9DA1A4

  // Text
  text:         c.text.primary,    // #1B1D1F
  textPrimary:  c.text.primary,
  textSecondary: c.text.secondary, // #5C6164
  textTertiary: c.text.tertiary,   // #7C8084
  textMuted:    c.text.tertiary,
  textDisabled: c.text.disabled,
  textInverse:  c.text.inverse,    // #FFFFFF
  textAccent:   c.text.accent,     // primary teal
  textLink:     c.text.link,

  // Semantic (muted, brand-aligned)
  success:     c.semantic.success,   // #4A9B6E
  successDark: c.semantic.successDark,
  successBg:   c.semantic.successBg,

  warning:     c.semantic.warning,   // #C28B3C
  warningDark: c.semantic.warningDark,
  warningBg:   c.semantic.warningBg,

  danger:      c.semantic.danger,    // #B84545
  dangerDark:  c.semantic.dangerDark,
  dangerBg:    c.semantic.dangerBg,

  error:       c.semantic.danger,    // alias
  info:        c.semantic.info,      // #3D7AA8
  infoBg:      c.semantic.infoBg,

  // Neutrals
  ...c.neutral,

  // Overlay
  overlay: c.surface.overlay,
};

export const spacing = {
  ...tokens.spacing.scale,
  ...tokens.spacing.alias,
};

export const radius = tokens.radius;

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: 0.5, color: colors.text },
  h2: { fontSize: 22, fontWeight: '600', letterSpacing: 0.5, color: colors.text },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 14, color: colors.text },
  bodyLg: { fontSize: 16, color: colors.text },
  caption: { fontSize: 12, color: colors.textSecondary },
  label: { fontSize: 11, fontWeight: '600', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1.2 },
  mono: { fontSize: 12, fontFamily: 'monospace' },
};

export const shadows = {
  none: flatShadow(0),
  sm:   flatShadow(1),
  md:   flatShadow(2),
  lg:   flatShadow(3),
};

export const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...flatShadow(1),
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

export default { colors, spacing, radius, typography, shadows, globalStyles };
