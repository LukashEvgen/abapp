import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {getDocumentsPaginated} from '../../services/documents';
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
  const [docs, setDocs] = useState([]);
  const [signaturesMap, setSignaturesMap] = useState({});

  useEffect(() => {
    if (!user?.uid || !caseId) {
      return;
    }
    getDocumentsPaginated(user.uid, caseId).then(page => setDocs(page.data));
  }, [user, caseId]);

  useEffect(() => {
    if (!user?.uid || !caseId || !docs.length) {
      return;
    }
    let cancelled = false;
    (async () => {
      const map = {};
      for (const doc of docs) {
        try {
          const sigs = await getSignatures(user.uid, caseId, doc.id);
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
  }, [user, caseId, docs]);

  const handleSign = item => {
    if (!isLawyer) {
      Alert.alert('Доступ обмежено', 'Підписувати документи може лише юрист');
      return;
    }
    navigation.navigate('DiiaSign', {
      clientId: user.uid,
      caseId,
      documentId: item.id,
      documentName: item.name,
      documentHash: item.sha256 || 'sha256-placeholder',
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
    return (
      <Card>
        <View style={globalStyles.rowBetween}>
          <Text style={styles.name}>{item.name}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
            <Text style={styles.open}>Відкрити</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.meta}>
          {formatDate(item.uploadedAt)} · {item.type}
        </Text>
        {latest ? (
          <View style={styles.signBadgeRow}>
            <Badge status={latest.status === 'signed' ? 'Підписано' : latest.status} />
            <Text style={styles.signMeta}>
              {latest.signerName || 'КЕП'} · {formatDate(latest.signedAt || latest.createdAt)}
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
