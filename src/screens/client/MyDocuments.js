import React, {useEffect, useState, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {useDocumentsInfinite} from '../../hooks/useFirebaseQueries';
import {getSignatures} from '../../services/signatures';
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
  SectionLabel,
  GoldButton,
  EmptyState,
  Badge,
} from '../../components/shared/UIComponents';
import SensitiveScreenGuard from '../../components/SensitiveScreenGuard';

export default function MyDocuments({route, navigation}) {
  const {caseId, clientId: paramClientId} = route.params;
  const {user, isLawyer} = useAuth();
  const clientId = paramClientId || user?.uid;
  const [signaturesMap, setSignaturesMap] = useState({});

  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useDocumentsInfinite(clientId, caseId);

  const docs = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data]);

  useEffect(() => {
    if (!clientId || !caseId || !docs.length) {
      return;
    }
    let cancelled = false;
    (async () => {
      const map = {};
      for (const doc of docs) {
        try {
          const sigs = await getSignatures(clientId, caseId, doc.id);
          if (sigs.length) {
            map[doc.id] = sigs;
          }
        } catch (e) {
          // ignore permission / missing collection errors
        }
      }
      if (!cancelled) {
        setSignaturesMap(map);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, caseId, docs]);

  const handleSign = item => {
    if (!isLawyer) {
      Alert.alert('Доступ обмежено', 'Підписувати документи може лише юрист');
      return;
    }
    navigation.navigate('DiiaSign', {
      clientId,
      caseId,
      documentId: item.id,
      documentName: item.name,
      documentHash: item.sha256 || '',
      storagePath: item.storagePath || '',
      onComplete: sig => {
        if (sig) {
          setSignaturesMap(prev => ({
            ...prev,
            [item.id]: [...(prev[item.id] || []), sig],
          }));
        }
      },
    });
  };

  const renderItem = ({item}) => {
    const sigs = signaturesMap[item.id] || [];
    const latest = sigs[0];
    const status = item.scanStatus;
    let scanLabel;
    let scanColor;
    if (status === 'clean') {
      scanLabel = '✅ Перевірено';
      scanColor = colors.success;
    } else if (status === 'infected') {
      scanLabel = '⚠ Загроза виявлена';
      scanColor = colors.danger;
    } else {
      scanLabel =
        item.scanned === true ? '✅ Перевірено' : '⏳ Очікує перевірки';
      scanColor = item.scanned === true ? colors.success : colors.warning;
    }
    return (
      <Card>
        <View style={globalStyles.rowBetween}>
          <Text style={styles.name}>{item.name}</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('DocumentDetail', {
                clientId,
                caseId,
                documentId: item.id,
              })
            }>
            <Text style={styles.open}>Відкрити</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.meta}>
          {formatDate(item.uploadedAt)} · {item.type}
        </Text>
        <Text style={[styles.scanStatus, {color: scanColor}]}>{scanLabel}</Text>
        {latest ? (
          <View style={styles.signBadgeRow}>
            <Badge
              status={latest.status === 'signed' ? 'Підписано' : latest.status}
            />
            <Text style={styles.signMeta}>
              {latest.signerName || 'КЕП'} ·{' '}
              {formatDate(latest.signedAt || latest.createdAt)}
            </Text>
          </View>
        ) : null}
        {isLawyer ? (
          <TouchableOpacity
            style={styles.signBtn}
            onPress={() => handleSign(item)}
            accessibilityLabel="Підписати документ КЕП"
            accessibilityRole="button">
            <Text style={styles.signBtnText}>Підписати КЕП ✍️</Text>
          </TouchableOpacity>
        ) : null}
      </Card>
    );
  };

  return (
    <SensitiveScreenGuard>
      <View style={globalStyles.container}>
        <View style={globalStyles.screen}>
          <Text style={styles.header}>Документи</Text>
          <Text style={styles.security}>
            🔒 AES-256 · Доступ: клієнт + адвокат
          </Text>
          <FlatList
            data={docs}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isFetchingNextPage}
                onRefresh={refetch}
                tintColor={colors.gold}
              />
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={5}
            removeClippedSubviews={true}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={{padding: spacing.md}}>
                  <ActivityIndicator color={colors.gold} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                icon="📄"
                title="Немає документів"
                subtitle="Завантажте перший документ через сканер"
              />
            }
            contentContainerStyle={{paddingBottom: spacing.lg}}
          />
          <GoldButton
            title="Сканувати документ"
            onPress={() => navigation.navigate('ScannerScreen', {caseId})}
          />
        </View>
      </View>
    </SensitiveScreenGuard>
  );
}

const styles = StyleSheet.create({
  header: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  security: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginBottom: spacing.md,
  },
  name: {
    color: colors.text,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
    flex: 1,
    marginRight: spacing.sm,
  },
  open: {
    color: colors.gold,
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
  },
  meta: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.xs,
  },
  scanStatus: {
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.xs,
    fontWeight: tokens.typography.weight.semibold,
  },
  signBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  signMeta: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginLeft: spacing.sm,
  },
  signBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  signBtnText: {
    color: colors.bg,
    fontWeight: tokens.typography.weight.bold,
    fontSize: tokens.typography.size.sm,
  },
});
