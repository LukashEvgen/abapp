import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {getDocuments} from '../../services/firebase';
import {colors, spacing, radius, typography, globalStyles} from '../../utils/theme';
import {formatDate} from '../../utils/helpers';
import {Card, SectionLabel, GoldButton, EmptyState} from '../../components/shared/UIComponents';

export default function MyDocuments({route, navigation}) {
  const {caseId} = route.params;
  const {user} = useAuth();
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    if (!user?.uid || !caseId) return;
    getDocuments(user.uid, caseId).then(setDocs);
  }, [user, caseId]);

  const renderItem = ({item}) => (
    <Card>
      <View style={globalStyles.rowBetween}>
        <Text style={styles.name}>{item.name}</Text>
        <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
          <Text style={styles.open}>Відкрити</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.meta}>{formatDate(item.uploadedAt)} · {item.type}</Text>
    </Card>
  );

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.screen}>
        <Text style={styles.header}>Документи</Text>
        <Text style={styles.security}>🔒 AES-256 · Доступ: клієнт + адвокат</Text>
        <FlatList
          data={docs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyState icon="📄" title="Немає документів" subtitle="Завантажте перший документ через сканер" />}
          contentContainerStyle={{paddingBottom: spacing.lg}}
        />
        <GoldButton
          title="Сканувати документ"
          onPress={() => navigation.navigate('ScannerScreen', {caseId})}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  security: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  open: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
