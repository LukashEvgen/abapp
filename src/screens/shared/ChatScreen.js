import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {
  getMessages,
  sendMessage,
  markMessagesRead,
} from '../../services/firebase';
import {colors, spacing, globalStyles} from '../../utils/theme';
import {formatDateTime} from '../../utils/helpers';
import {EmptyState} from '../../components/shared/UIComponents';
import {chatStyles} from '../../styles/chatStyles';

export default function ChatScreen() {
  const {user} = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }
    unsubscribeRef.current = getMessages(user.uid, msgs => {
      setMessages(msgs);
      const unread = msgs
        .filter(m => m.from === 'lawyer' && !m.read)
        .map(m => m.id);
      if (unread.length > 0) {
        markMessagesRead(user.uid, unread).catch(() => {});
      }
    });
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user]);

  useEffect(() => {
    if (messages.length > 0 && listRef.current) {
      setTimeout(() => listRef.current.scrollToEnd({animated: true}), 100);
    }
  }, [messages.length]);

  const onSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !user?.uid) {
      return;
    }
    setSending(true);
    setText('');
    try {
      await sendMessage(user.uid, trimmed, 'client');
    } catch (e) {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }, [text, user]);

  const renderItem = ({item}) => {
    const isMe = item.from === 'client';
    return (
      <View
        style={[
          chatStyles.bubbleWrap,
          isMe ? chatStyles.bubbleRight : chatStyles.bubbleLeft,
        ]}>
        <View
          style={[
            chatStyles.bubble,
            isMe ? chatStyles.bubbleMe : chatStyles.bubbleOther,
          ]}>
          <Text
            style={[
              chatStyles.bubbleText,
              isMe ? chatStyles.bubbleTextMe : chatStyles.bubbleTextOther,
            ]}>
            {item.text}
          </Text>
          <Text style={chatStyles.time}>{formatDateTime(item.timestamp)}</Text>
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
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.lg,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="💬"
            title="Почніть спілкування"
            subtitle="Ваші повідомлення з адвокатом з’являться тут"
          />
        }
      />
      <View style={chatStyles.inputRow}>
        <TextInput
          style={chatStyles.input}
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
          style={[
            chatStyles.sendBtn,
            (!text.trim() || sending) && chatStyles.sendBtnDisabled,
          ]}>
          <Text style={chatStyles.sendBtnText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
