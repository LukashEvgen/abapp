import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {getAllClients} from '../../services/firebase';
import {colors, spacing, radius, typography, globalStyles} from '../../utils/theme';
import {formatDate} from '../../utils/helpers';
import {Card, EmptyState} from '../../components/shared/UIComponents';

export default function ClientsList({navigation}) {
  const [clients, setClients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getAllClients();
    setClients(data);
    setFiltered(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(
      clients.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
      )
    );
  }, [query, clients]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({item}) => (
    <Card onPress={() => navigation.navigate('AdminClientDetail', {clientId: item.id})}>
      <View style={globalStyles.rowBetween}>
        <Text style={styles.name}>{item.name || 'Без імені'}</Text>
        <Text style={styles.phone}>{item.phone || ''}</Text>
      </View>
      <Text style={styles.meta}>Зареєстровано: {formatDate(item.createdAt)}</Text>
    </Card>
  );

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.screen}>
        <Text style={styles.header}>Клієнти</Text>
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Пошук за іменем або телефоном..."
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
          ListEmptyComponent={<EmptyState icon="👥" title="Немає клієнтів" subtitle="Список клієнтів з’явиться тут" />}
          contentContainerStyle={{paddingBottom: spacing.lg}}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {...typography.h1, marginBottom: spacing.md},
  searchWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  search: {color: colors.text, fontSize: 14},
  name: {color: colors.text, fontSize: 16, fontWeight: '600', flex: 1, marginRight: spacing.sm},
  phone: {color: colors.muted, fontSize: 13},
  meta: {color: colors.muted, fontSize: 12, marginTop: spacing.xs},
});
