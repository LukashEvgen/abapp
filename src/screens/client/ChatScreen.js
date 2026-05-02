import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {getMessages, sendMessage, markMessagesRead} from '../../services/firebase';
import {colors, spacing, radius, typography, globalStyles} from '../../utils/theme';
import {formatDateTime} from '../../utils/helpers';
import {EmptyState} from '../../components/shared/UIComponents';

export default function ChatScreen() {
  const {user} = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) return;
    unsubscribeRef.current = getMessages(user.uid, msgs => {
      setMessages(msgs);
      // Позначити непрочитані повідомлення від адвоката як прочитані
      const unread = msgs.filter(m => m.from === 'lawyer' && !m.read).map(m => m.id);
      if (unread.length > 0) {
        markMessagesRead(user.uid, unread).catch(() => {});
      }
    });
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [user]);

  useEffect(() => {
    // Автопрокрутка до останнього повідомлення
    if (messages.length > 0 && listRef.current) {
      setTimeout(() => listRef.current.scrollToEnd({animated: true}), 100);
    }
  }, [messages.length]);

  const onSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !user?.uid) return;
    setSending(true);
    setText('');
    try {
      await sendMessage(user.uid, trimmed, 'client');
    } catch (e) {
      // При помилці повернути текст у поле
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }, [text, user]);

  const renderItem = ({item}) => {
    const isMe = item.from === 'client';
    return (
      <View style={[styles.bubbleWrap, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
            {item.text}
          </Text>
          <Text style={styles.time}>{formatDateTime(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={globalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{padding: spacing.md, paddingBottom: spacing.lg}}
        ListEmptyComponent={
          <EmptyState
            icon="💬"
            title="Почніть спілкування"
            subtitle="Ваші повідомлення з адвокатом з’являться тут"
          />
        }
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Повідомлення..."
          placeholderTextColor={colors.muted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          onPress={onSend}
          disabled={sending || !text.trim()}
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}>
          <Text style={styles.sendBtnText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: colors.bg,
  },
  bubbleTextOther: {
    color: colors.text,
  },
  time: {
    fontSize: 10,
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
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: '700',
  },
});
