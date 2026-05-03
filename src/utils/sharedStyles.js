import {colors, spacing, radius, typography, tokens} from './theme';

export const sharedStyles = {
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
    fontSize: tokens.typography.size.base,
  },

  caseTitle: {
    color: colors.text,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
    flex: 1,
    marginRight: spacing.sm,
  },

  caseMeta: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.xs,
  },

  empty: {
    color: colors.muted,
    fontSize: tokens.typography.size.base,
    marginBottom: spacing.lg,
  },

  eventDate: {
    color: colors.gold,
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
    marginBottom: spacing.xs,
  },

  eventActor: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
    marginBottom: spacing.xs,
  },

  eventText: {
    color: colors.text,
    fontSize: tokens.typography.size.base,
    lineHeight: tokens.typography.size.base * tokens.typography.lineHeight.normal,
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
    minHeight: 60,
    textAlignVertical: 'top',
  },

  actions: {
    marginTop: spacing.lg,
  },
};
