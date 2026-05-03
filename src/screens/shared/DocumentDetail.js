import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import {useSignaturesRealtime} from '../../hooks/useFirebaseQueries';
import {getDocumentById} from '../../services/documents';
import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
  tokens,
} from '../../utils/theme';
import {formatDate} from '../../utils/helpers';
import {
  Card,
  Badge,
  GoldButton,
  SectionLabel,
} from '../../components/shared/UIComponents';

export default function DocumentDetail({route, navigation}) {
  const {clientId, caseId, documentId} = route.params;
  const {user, isLawyer} = useAuth();

  const [document, setDocument] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const {data: signatures, isFetching: sigsFetching} = useSignaturesRealtime(
    clientId,
    caseId,
    documentId,
  );

  const latestSignature = signatures[0] ?? null;

  const loadDocument = useCallback(async () => {
    try {
      const doc = await getDocumentById(clientId, caseId, documentId);
      setDocument(doc);
    } catch (_e) {
      // Document may not exist locally; keep empty
    }
  }, [clientId, caseId, documentId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDocument();
    setRefreshing(false);
  }, [loadDocument]);

  useFocusEffect(
    useCallback(() => {
      loadDocument();
    }, [loadDocument]),
  );

  const handleOpen = () => {
    if (document?.url) {
      Linking.openURL(document.url);
    } else {
      Alert.alert('Посилання недоступне');
    }
  };

  const handleSign = () => {
    if (!isLawyer) {
      Alert.alert('Доступ обмежено', 'Підписувати документи може лише юрист');
      return;
    }
    navigation.navigate('DiiaSign', {
      clientId,
      caseId,
      documentId,
      documentName: document?.name || 'Документ',
      documentHash: document?.sha256 || 'sha256-placeholder',
      onComplete: () => {
        // Realtime listener will update signatures automatically
      },
    });
  };

  if (!document && !refreshing) {
    return (
      <View style={globalStyles.container}>
        <Text style={styles.empty}>Завантаження документа...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{padding: spacing.md}}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || sigsFetching}
          onRefresh={onRefresh}
          tintColor={colors.gold}
        />
      }>
      <Text style={styles.title}>{document?.name || 'Документ'}</Text>
      <Text style={styles.meta}>
        {document?.type?.toUpperCase() || '—'} ·{' '}
        {document?.size ? `${(document.size / 1024).toFixed(1)} KB` : '—'} ·{' '}
        {document?.uploadedAt ? formatDate(document.uploadedAt) : '—'}
      </Text>

      <View style={styles.actions}>
        <GoldButton title="Відкрити файл" onPress={handleOpen} />
      </View>

      <SectionLabel text="Статус підпису" />
      {latestSignature ? (
        <Card>
          <View style={globalStyles.rowBetween}>
            <Text style={styles.signTitle}>КЕП підпис</Text>
            <Badge
              status={
                latestSignature.status === 'signed'
                  ? 'Підписано'
                  : latestSignature.status
              }
            />
          </View>
          <Text style={styles.signMeta}>
            Підписант: {latestSignature.signerName || '—'}
          </Text>
          <Text style={styles.signMeta}>
            Ідентифікатор: {latestSignature.signerIdentifier || '—'}
          </Text>
          <Text style={styles.signMeta}>
            Дата:{' '}
            {latestSignature.signedAt
              ? formatDate(latestSignature.signedAt)
              : latestSignature.createdAt
              ? formatDate(latestSignature.createdAt)
              : '—'}
          </Text>
        </Card>
      ) : (
        <Text style={styles.empty}>Підпис ще не накладено</Text>
      )}

      {isLawyer && (
        <View style={styles.signActions}>
          <GoldButton
            title="Підписати КЕП"
            onPress={handleSign}
            disabled={latestSignature?.status === 'signed'}
          />
          {latestSignature?.status === 'signed' && (
            <Text style={styles.disabledHint}>Документ уже підписано КЕП</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {...typography.h1, marginBottom: spacing.sm},
  meta: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginBottom: spacing.lg,
  },
  actions: {
    marginBottom: spacing.lg,
  },
  signActions: {
    marginTop: spacing.lg,
  },
  disabledHint: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  signTitle: {
    color: colors.text,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
  },
  signMeta: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.xs,
  },
  empty: {
    color: colors.muted,
    fontSize: tokens.typography.size.base,
    marginBottom: spacing.lg,
  },
});
