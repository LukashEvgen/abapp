import {StyleSheet, Appearance} from 'react-native';
import tokens from '../../design/tokens.json';
import darkTokens from '../../design/tokens-dark.json';

export {tokens, darkTokens};

// ----------------------------------------------------------------
// LexTrack Theme — V3.2 (Light by default, teal brand)
// Source of truth: design/tokens.json (light) — canonical Pantone 7459 C teal
// Default: light (matching updated design system)
// ----------------------------------------------------------------

function buildTheme(dark: boolean) {
  const t = dark ? darkTokens : tokens;
  const c = t.colors;
  const sh = t.shadows;

  const flatShadow = (level: number) => {
    const shadow = sh[level as keyof typeof sh];
    return {
      ...(shadow?.ios || {}),
      elevation: shadow?.android?.elevation || 0,
    };
  };

  const tokenShadow = (level: number) => {
    const shadow = sh[level as keyof typeof sh];
    return {
      ios: shadow?.ios || {},
      android: shadow?.android || {elevation: 0},
    };
  };

  return {
    colors: {
      // Legacy flat keys (kept for backwards compatibility across screens)
      bg: c.surface.bg,
      surface: c.surface.base,
      card: c.surface.raised,
      border: c.border.subtle,
      text: c.text.primary,
      muted: c.text.secondary,
      primary: c.brand.primary,
      // gold is now an alias to the accent (gold color) for premium look
      gold: c.brand.accent,
      green: c.brand.primaryDark,
      danger: c.semantic.danger,
      warning: c.semantic.warning,
      success: c.semantic.success,
      info: c.semantic.info,

      // Brand
      primaryLight: c.brand.primaryLight,
      primaryDark: c.brand.primaryDark,
      primaryMuted: c.brand.primaryMuted,
      primaryHover: c.brand.primaryHover,
      secondary: c.brand.secondary,
      secondaryDark: c.brand.secondaryDark,
      secondaryMuted: c.brand.secondaryMuted,

      // Accent/Gold (separate from brand primary)
      accent: c.brand.accent,
      accentLight: c.brand.accentLight,
      accentDark: c.brand.accentDark,
      accentMuted: c.brand.accentMuted,

      // Gold tokens (explicit, for premium look) - map to accent
      goldLight: c.brand.accentLight,
      goldDark: c.brand.accentDark,
      goldMuted: c.brand.accentMuted,

      // Surfaces
      background: c.surface.bg,
      surfaceRaised: c.surface.raised,
      surfaceSunken: c.surface.sunken,
      inputBg: c.surface.base,

      // Border
      borderDefault: c.border.default,
      borderStrong: c.border.strong,

      // Text
      textPrimary: c.text.primary,
      textSecondary: c.text.secondary,
      textTertiary: c.text.tertiary,
      textDisabled: c.text.disabled,
      textInverse: c.text.inverse,
      textAccent: c.text.accent,
      textLink: c.text.link,

      // Semantic
      successDark: c.semantic.successDark,
      successBg: c.semantic.successBg,
      warningDark: c.semantic.warningDark,
      warningBg: c.semantic.warningBg,
      dangerDark: c.semantic.dangerDark,
      dangerBg: c.semantic.dangerBg,
      error: c.semantic.danger,
      infoBg: c.semantic.infoBg,

      // Neutrals
      ...c.neutral,
      neutral: c.neutral,

      // Overlay
      overlay: c.surface.overlay,

      // Nested semantic palettes (for tests and new components)
      brand: c.brand,
      semantic: c.semantic,
      surfaceSemantic: c.surface,
      borderSemantic: c.border,
      textSemantic: c.text,
    },
    spacing: {
      ...t.spacing.scale,
      ...t.spacing.alias,
    },
    radius: t.radius,
    typography: {
      h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: 0.5, color: c.text.primary },
      h2: { fontSize: 22, fontWeight: '600' as const, letterSpacing: 0.5, color: c.text.primary },
      h3: { fontSize: 18, fontWeight: '600' as const, color: c.text.primary },
      body: { fontSize: 14, fontWeight: '400' as const, color: c.text.primary },
      bodyLg: { fontSize: 16, fontWeight: '400' as const, color: c.text.primary },
      caption: { fontSize: 12, fontWeight: '400' as const, color: c.text.secondary },
      label: { fontSize: 11, fontWeight: '600' as const, color: c.text.accent, textTransform: 'uppercase', letterSpacing: 1.2 },
      mono: { fontSize: 12, fontFamily: 'JetBrainsMono' },
    },
    shadows: {
      '0': tokenShadow(0),
      '1': tokenShadow(1),
      '2': tokenShadow(2),
      '3': tokenShadow(3),
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
      // Legacy global style keys used by tests and some screens
      container: {
        flex: 1,
        backgroundColor: c.surface.bg,
        padding: t.spacing.alias.md,
      },
      row: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      center: {
        alignItems: 'center',
        justifyContent: 'center',
      },
      text: {
        color: c.text.primary,
        fontSize: 14,
      },
      mutedText: {
        color: c.text.secondary,
        fontSize: 14,
      },
      goldText: {
        color: c.brand.accent,
        fontSize: 14,
      },
    }),
  };
}

export const isDarkDefault = false;
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

export function setTheme(dark: boolean) {
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