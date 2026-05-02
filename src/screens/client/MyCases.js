import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {getCases} from '../../services/firebase';
import {colors, spacing, radius, typography, globalStyles} from '../../utils/theme';
import {formatDate} from '../../utils/helpers';
import {Card, Badge, ProgressBar, EmptyState} from '../../components/shared/UIComponents';

export default function MyCases({navigation}) {
  const {user} = useAuth();
  const [cases, setCases] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    const data = await getCases(user.uid);
    setCases(data);
    setFiltered(data);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(
      cases.filter(c =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.caseNumber || '').toLowerCase().includes(q) ||
        (c.court || '').toLowerCase().includes(q)
      )
    );
  }, [query, cases]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({item}) => (
    <Card onPress={() => navigation.navigate('CaseDetail', {caseId: item.id})}>
      <View style={globalStyles.rowBetween}>
        <Text style={styles.title}>{item.title}</Text>
        <Badge status={item.status} />
      </View>
      <Text style={styles.meta}>{item.court} · {item.caseNumber}</Text>
      {item.nextHearing && <Text style={styles.meta}>Засідання: {formatDate(item.nextHearing)}</Text>}
      <ProgressBar progress={item.progress || 0} />
    </Card>
  );

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.screen}>
        <Text style={styles.header}>Мої справи</Text>
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Пошук за назвою, номером, судом..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={styles.search}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
          ListEmptyComponent={<EmptyState icon="⚖" title="Немає справ" subtitle="Ваші судові справи з’являться тут" />}
          contentContainerStyle={{paddingBottom: spacing.lg}}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
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
    fontSize: 14,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
});
