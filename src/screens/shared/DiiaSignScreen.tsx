import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
  tokens,
} from '../../utils/theme';
import {GoldButton} from '../../components/shared/UIComponents';
import {signDocument} from '../../services/signatures';
import {initiateKEPAuth, exchangeKEPCode} from '../../services/kepAuth';

enum SignState {
  Idle = 'idle',
  Initiating = 'initiating',
  AwaitingOAuth = 'awaitingOAuth',
  Exchanging = 'exchanging',
  Signing = 'signing',
  Done = 'done',
}

const REDIRECT_SCHEME = 'lextrack';
const REDIRECT_HOST = 'kep';

export default function DiiaSignScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [status, setStatus] = useState<SignState>(SignState.Idle);
  const [error, setError] = useState<string | null>(null);
  const pendingStateRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const {
    clientId,
    caseId,
    documentId,
    documentName,
    documentHash,
    storagePath,
    onComplete,
  } = route.params || {};

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSignResult = useCallback(
    (success: boolean, signature?: any, reason?: string) => {
      if (!isMountedRef.current) {
        return;
      }
      setStatus(SignState.Done);
      if (onComplete) {
        onComplete(success ? signature : null);
      }
      navigation.navigate('SignResult', {
        success,
        signature,
        reason,
      });
    },
    [navigation, onComplete],
  );

  const performSign = useCallback(
    async (accessToken: string) => {
      if (!isMountedRef.current) {
        return;
      }
      setStatus(SignState.Signing);
      try {
        const signature = await signDocument({
          clientId,
          caseId,
          documentId,
          documentName: documentName || 'Документ',
          documentHash: documentHash || '',
          storagePath: storagePath || '',
          accessToken,
        });
        handleSignResult(true, signature);
      } catch (e: any) {
        console.warn('signDocument failed', e);
        handleSignResult(
          false,
          undefined,
          e?.message || 'Помилка підпису на сервері',
        );
      }
    },
    [
      clientId,
      caseId,
      documentId,
      documentName,
      documentHash,
      storagePath,
      handleSignResult,
    ],
  );

  const handleDeepLink = useCallback(
    async (url: string) => {
      if (!isMountedRef.current) {
        return;
      }
      const parsed = new URL(url);
      if (
        parsed.protocol !== `${REDIRECT_SCHEME}:` ||
        parsed.hostname !== REDIRECT_HOST
      ) {
        return;
      }

      const code = parsed.searchParams.get('code');
      const state = parsed.searchParams.get('state');
      if (!code || !state) {
        setError('Неповний redirect URL (відсутній code або state)');
        handleSignResult(false, undefined, 'Неповний redirect URL');
        return;
      }

      if (pendingStateRef.current && pendingStateRef.current !== state) {
        setError('State mismatch — можливо CSRF-атака');
        handleSignResult(false, undefined, 'Невідповідність state');
        return;
      }

      setStatus(SignState.Exchanging);
      try {
        await exchangeKEPCode(code, state);
        // Token is now stored server-side; signDocument callable will fetch it
        await performSign('');
      } catch (e: any) {
        console.warn('exchangeKEPCode failed', e);
        handleSignResult(
          false,
          undefined,
          e?.message || 'Помилка обміну коду авторизації',
        );
      }
    },
    [handleSignResult, performSign],
  );

  useEffect(() => {
    const subscription = Linking.addEventListener('url', event => {
      if (event?.url) {
        handleDeepLink(event.url);
      }
    });

    // Handle cold-start deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription?.remove?.();
    };
  }, [handleDeepLink]);

  const startOAuth = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }
    setStatus(SignState.Initiating);
    setError(null);
    try {
      const {authorizeUrl, state} = await initiateKEPAuth();
      if (!isMountedRef.current) {
        return;
      }
      pendingStateRef.current = state;
      setStatus(SignState.AwaitingOAuth);
      await Linking.openURL(authorizeUrl);
    } catch (e: any) {
      console.warn('initiateKEPAuth failed', e);
      setStatus(SignState.Idle);
      setError(e?.message || 'Не вдалося розпочати авторизацію КЕП');
      Alert.alert(
        'Помилка авторизації',
        e?.message || 'Не вдалося розпочати авторизацію КЕП',
      );
    }
  }, []);

  const handleCancel = useCallback(() => {
    handleSignResult(false, undefined, 'Скасовано користувачем');
  }, [handleSignResult]);

  const statusText =
    status === SignState.Initiating
      ? 'Розпочинаємо авторизацію...'
      : status === SignState.AwaitingOAuth
      ? 'Очікуємо підтвердження в Дія / id.gov.ua...'
      : status === SignState.Exchanging
      ? 'Обмінюємо код авторизації...'
      : status === SignState.Signing
      ? 'Накладаємо КЕП-підпис...'
      : null;

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Дія.Підпис</Text>
        <Text style={styles.headerSubtitle}>{documentName || 'Документ'}</Text>
      </View>

      <View style={styles.body}>
        {status === SignState.Idle || status === SignState.Initiating ? (
          <>
            <Text style={styles.instruction}>
              Натисніть «Підписати КЕП», щоб авторизуватися через Дія /
              id.gov.ua та накласти електронний підпис.
            </Text>
            {error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            <GoldButton
              title="Підписати КЕП"
              onPress={startOAuth}
              disabled={status === SignState.Initiating}
            />
            <View style={styles.cancelBtn}>
              <GoldButton
                title="Скасувати"
                onPress={handleCancel}
                disabled={false}
              />
            </View>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.gold} />
            {statusText ? (
              <Text style={styles.statusText}>{statusText}</Text>
            ) : null}
            {status === SignState.AwaitingOAuth ? (
              <View style={styles.cancelBtn}>
                <GoldButton title="Скасувати" onPress={handleCancel} />
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h1,
    fontSize: tokens.typography.size.lg,
  },
  headerSubtitle: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.xs,
  },
  body: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instruction: {
    color: colors.text,
    fontSize: tokens.typography.size.base,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  statusText: {
    color: colors.muted,
    fontSize: tokens.typography.size.base,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  cancelBtn: {
    marginTop: spacing.md,
    width: '100%',
  },
  errorCard: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    width: '100%',
  },
  errorText: {
    color: colors.danger,
    fontSize: tokens.typography.size.sm,
    textAlign: 'center',
  },
});
