import {colors, spacing, radius, typography} from './theme';
import {ViewStyle, TextStyle} from 'react-native';

export interface SharedStyles {
  header: TextStyle;
  searchWrap: ViewStyle;
  search: TextStyle;
  caseTitle: TextStyle;
  caseMeta: TextStyle;
  empty: TextStyle;
  eventDate: TextStyle;
  eventActor: TextStyle;
  eventText: TextStyle;
  inputWrap: ViewStyle;
  input: TextStyle;
  actions: ViewStyle;
}

export const sharedStyles: SharedStyles = {
  header: {...typography.h1, marginBottom: spacing.md},

  searchWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },

  search: {
    color: colors.text,
    fontSize: 14,
  },

  caseTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },

  caseMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },

  empty: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: spacing.lg,
  },

  eventDate: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },

  eventActor: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },

  eventText: {
    color: colors.text,
    fontSize: 14,
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
    minHeight: 60,
    textAlignVertical: 'top',
  },

  actions: {
    marginTop: spacing.lg,
  },
};
