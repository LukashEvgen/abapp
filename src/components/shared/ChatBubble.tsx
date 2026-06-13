import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, spacing, radius, typography} from '../../utils/theme';
import Avatar from './Avatar';

export default function ChatBubble({message, isOutbound, avatar, timestamp, senderName}) {
  return (
    <View style={[styles.row, isOutbound && styles.rowOutbound]}>
      {!isOutbound && avatar && <Avatar initials={avatar} size="sm" />}
      <View style={[styles.bubble, isOutbound ? styles.bubbleOutbound : styles.bubbleInbound]}>
        {senderName && !isOutbound && <Text style={styles.sender}>{senderName}</Text>}
        <Text style={[styles.text, isOutbound && styles.textOutbound]}>{message}</Text>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
      {isOutbound && avatar && <Avatar initials={avatar} size="sm" />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  rowOutbound: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: radius.md,
    marginHorizontal: spacing.sm,
  },
  bubbleInbound: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },
  bubbleOutbound: {
    backgroundColor: colors.goldMuted,
    borderWidth: 1,
    borderColor: colors.gold,
    borderBottomRightRadius: radius.sm,
  },
  sender: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  text: {
    ...typography.body,
    color: colors.text,
    lineHeight: 20,
  },
  textOutbound: {
    color: colors.text,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textTertiary,
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
});
