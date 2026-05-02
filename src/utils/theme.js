import {StyleSheet} from 'react-native';

export const colors = {
  bg: '#0C0F0A',
  surface: '#13160F',
  card: '#181C13',
  border: '#252C1C',
  gold: '#C9A84C',
  green: '#2D5016',
  danger: '#C0392B',
  warning: '#D4831A',
  success: '#27AE60',
  text: '#F0EDE4',
  muted: '#7A7A6A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
};

export const typography = {
  h1: {fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: 0.5},
  h2: {fontSize: 22, fontWeight: '600', color: colors.text, letterSpacing: 0.3},
  h3: {fontSize: 18, fontWeight: '600', color: colors.text},
  body: {fontSize: 14, fontWeight: '400', color: colors.text, lineHeight: 20},
  caption: {fontSize: 12, fontWeight: '400', color: colors.muted, lineHeight: 16},
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
};

export const globalStyles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  screen: {flex: 1, backgroundColor: colors.bg, padding: spacing.md},
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {flexDirection: 'row', alignItems: 'center'},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  center: {alignItems: 'center', justifyContent: 'center'},
  text: {color: colors.text, fontSize: 14},
  mutedText: {color: colors.muted, fontSize: 12},
  goldText: {color: colors.gold, fontSize: 14, fontWeight: '600'},
});
