import {StyleSheet, Appearance} from 'react-native';
import tokens from '../../design/tokens.json';
import darkTokens from '../../design/tokens-dark.json';

// ----------------------------------------------------------------
// LexTrack Theme — V3.1 (Dual theme: Light + Dark)
// Source of truth: design/tokens.json (light) + design/tokens-dark.json (dark)
// Default: dark (matching canonical mockups)
// ----------------------------------------------------------------

function buildTheme(dark) {
  const t = dark ? darkTokens : tokens;
  const c = t.colors;
  const sh = t.shadows;

  const flatShadow = (level) => ({
    ...(sh[level]?.ios || {}),
    elevation: sh[level]?.android?.elevation || 0,
  });

  return {
    colors: {
      // Brand (gold in dark, teal in light)
      primary:       c.brand.primary,
      primaryLight:  c.brand.primaryLight,
      primaryDark:   c.brand.primaryDark,
      primaryMuted:  c.brand.primaryMuted,
      primaryHover:  c.brand.primaryHover,
      secondary:     c.brand.secondary,
      secondaryDark: c.brand.secondaryDark,
      secondaryMuted: c.brand.secondaryMuted,

      // Gold accent (canonical in dark; teal alias in light for backwards compat)
      gold:          dark ? c.brand.primary : '#C8A96E',
      goldLight:     '#E0C48F',
      goldDark:      '#A6854A',
      goldMuted:     'rgba(200,169,110,0.15)',

      // Surfaces
      background:   c.surface.bg,
      surface:      c.surface.base,
      surfaceRaised: c.surface.raised,
      surfaceSunken: c.surface.sunken,
      card:         c.surface.raised,
      inputBg:      c.surface.base,

      // Border
      border:        c.border.subtle,
      borderDefault: c.border.default,
      borderStrong:  c.border.strong,

      // Text
      text:         c.text.primary,
      textPrimary:  c.text.primary,
      textSecondary: c.text.secondary,
      textTertiary: c.text.tertiary,
      textMuted:    c.text.tertiary,
      textDisabled: c.text.disabled,
      textInverse:  c.text.inverse,
      textAccent:   c.text.accent,
      textLink:     c.text.link,

      // Semantic
      success:     c.semantic.success,
      successDark: c.semantic.successDark,
      successBg:   c.semantic.successBg,
      warning:     c.semantic.warning,
      warningDark: c.semantic.warningDark,
      warningBg:   c.semantic.warningBg,
      danger:      c.semantic.danger,
      dangerDark:  c.semantic.dangerDark,
      dangerBg:    c.semantic.dangerBg,
      error:       c.semantic.danger,
      info:        c.semantic.info,
      infoBg:      c.semantic.infoBg,

      // Neutrals
      ...c.neutral,

      // Overlay
      overlay: c.surface.overlay,
    },
    spacing: {
      ...t.spacing.scale,
      ...t.spacing.alias,
    },
    radius: t.radius,
    typography: {
      h1: { fontSize: 28, fontWeight: '700', letterSpacing: 0.5, color: c.text.primary },
      h2: { fontSize: 22, fontWeight: '600', letterSpacing: 0.5, color: c.text.primary },
      h3: { fontSize: 18, fontWeight: '600', color: c.text.primary },
      body: { fontSize: 14, color: c.text.primary },
      bodyLg: { fontSize: 16, color: c.text.primary },
      caption: { fontSize: 12, color: c.text.secondary },
      label: { fontSize: 11, fontWeight: '600', color: c.text.accent, textTransform: 'uppercase', letterSpacing: 1.2 },
      mono: { fontSize: 12, fontFamily: 'JetBrainsMono' },
    },
    shadows: {
      none: flatShadow(0),
      sm:   flatShadow(1),
      md:   flatShadow(2),
      lg:   flatShadow(3),
    },
    globalStyles: StyleSheet.create({
      screen: {
        flex: 1,
        backgroundColor: c.surface.bg,
        padding: t.spacing.alias.md,
      },
      card: {
        backgroundColor: c.surface.raised,
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: c.border.subtle,
        padding: t.spacing.alias.md,
        ...flatShadow(1),
      },
      input: {
        backgroundColor: c.surface.base,
        borderWidth: 1,
        borderColor: c.border.default,
        borderRadius: t.radius.md,
        paddingVertical: 11,
        paddingHorizontal: 14,
        fontSize: 14,
        color: c.text.primary,
      },
      buttonPrimary: {
        backgroundColor: c.brand.primary,
        borderRadius: t.radius.md,
        paddingVertical: 11,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
      },
      buttonPrimaryText: {
        color: dark ? '#0F1011' : '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
      },
      buttonGhost: {
        backgroundColor: 'transparent',
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: c.brand.primary,
        paddingVertical: 10,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
      },
      buttonGhostText: {
        color: c.brand.primary,
        fontSize: 14,
        fontWeight: '700',
      },
      divider: {
        height: 1,
        backgroundColor: c.border.subtle,
        marginVertical: t.spacing.alias.md,
      },
    }),
  };
}

export const isDarkDefault = true;
let _dark = isDarkDefault;

try {
  const scheme = Appearance.getColorScheme();
  _dark = scheme === null ? isDarkDefault : scheme === 'dark';
} catch (e) {
  _dark = isDarkDefault;
}

let _theme = buildTheme(_dark);
export const theme = _theme;
export const colors = _theme.colors;
export const spacing = _theme.spacing;
export const radius = _theme.radius;
export const typography = _theme.typography;
export const shadows = _theme.shadows;
export const globalStyles = _theme.globalStyles;

export function setTheme(dark) {
  _dark = dark;
  _theme = buildTheme(dark);
  Object.assign(colors, _theme.colors);
  Object.assign(spacing, _theme.spacing);
  Object.assign(typography, _theme.typography);
  Object.assign(shadows, _theme.shadows);
  Object.assign(globalStyles, _theme.globalStyles);
}

export function useDarkTheme() {
  return _dark;
}

export default { colors, spacing, radius, typography, shadows, globalStyles, theme, setTheme, useDarkTheme };
