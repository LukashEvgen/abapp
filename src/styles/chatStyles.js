import {StyleSheet} from 'react-native';
import {colors, spacing, radius, tokens} from '../utils/theme';

export const chatStyles = StyleSheet.create({
  bubbleWrap: {
    marginBottom: spacing.sm,
  },
  bubbleLeft: {
    alignItems: 'flex-start',
  },
  bubbleRight: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleMe: {
    backgroundColor: colors.gold,
  },
  bubbleOther: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: {
    fontSize: tokens.typography.size.base,
    lineHeight: tokens.typography.size.base * tokens.typography.lineHeight.normal,
  },
  bubbleTextMe: {
    color: colors.bg,
  },
  bubbleTextOther: {
    color: colors.text,
  },
  time: {
    fontSize: tokens.typography.size.xs,
    color: colors.muted,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: tokens.typography.size.base,
    maxHeight: 120,
  },
  sendBtn: {
    marginLeft: spacing.sm,
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: colors.bg,
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.bold,
  },
});
