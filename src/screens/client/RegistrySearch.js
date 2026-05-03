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
import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
} from '../../utils/theme';
import {
  Card,
  SectionLabel,
  EmptyState,
} from '../../components/shared/UIComponents';

// MVP mock-дані реєстру. Фаза 2 — інтеграція Opendatabot API.
const MOCK_REGISTRY = [
  {
    id: '1',
    name: 'ТОВ "Юридичний Супровід"',
    code: '12345678',
    status: 'active',
    type: 'Юридична особа',
    address: 'м. Київ, вул. Хрещатик, 1',
  },
  {
    id: '2',
    name: 'ФОП Іваненко Іван Іванович',
    code: '1234567890',
    status: 'active',
    type: 'ФОП',
    address: 'м. Львів, вул. Франка, 10',
  },
  {
    id: '3',
    name: 'ТОВ "БудМайстер"',
    code: '87654321',
    status: 'in_liquidation',
    type: 'Юридична особа',
    address: 'м. Одеса, вул. Дерибасівська, 5',
  },
  {
    id: '4',
    name: 'ФОП Петренко Олена Сергіївна',
    code: '0987654321',
    status: 'active',
    type: 'ФОП',
    address: 'м. Харків, пр. Науки, 20',
  },
  {
    id: '5',
    name: 'АТ "ФінансГруп"',
    code: '11111111',
    status: 'active',
    type: 'Юридична особа',
    address: 'м. Дніпро, пр. Гагаріна, 50',
  },
];

export default function RegistrySearch({navigation}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async q => {
    setLoading(true);
    // Імітація мережевої затримки
    await new Promise(r => setTimeout(r, 400));
    const term = q.trim().toLowerCase();
    if (!term) {
      setResults([]);
    } else {
      const filtered = MOCK_REGISTRY.filter(
        r =>
          r.name.toLowerCase().includes(term) ||
          r.code.includes(term) ||
          r.address.toLowerCase().includes(term),
      );
      setResults(filtered);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const renderItem = ({item}) => (
    <Card>
      <View style={globalStyles.rowBetween}>
        <Text style={styles.name}>{item.name}</Text>
        <View
          style={[
            styles.statusBadge,
            item.status === 'active'
              ? styles.statusActive
              : styles.statusInactive,
          ]}>
          <Text
            style={[
              styles.statusLabel,
              item.status === 'active'
                ? styles.statusTextActive
                : styles.statusTextInactive,
            ]}>
            {item.status === 'active' ? 'Активний' : 'Ліквідація'}
          </Text>
        </View>
      </View>
      <Text style={styles.meta}>
        Код: {item.code} · {item.type}
      </Text>
      <Text style={styles.meta}>{item.address}</Text>
    </Card>
  );

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.screen}>
        <Text style={styles.header}>Пошук по реєстрах</Text>
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Назва, ЄДРПОУ, адреса..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={styles.search}
          />
        </View>

        <SectionLabel text="Результати" />
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => search(query)}
              tintColor={colors.gold}
            />
          }
          ListEmptyComponent={
            query.trim() ? (
              <EmptyState
                icon="🗂"
                title="Нічого не знайдено"
                subtitle="Спробуйте змінити запит"
              />
            ) : (
              <EmptyState
                icon="🔍"
                title="Введіть запит"
                subtitle="Пошук по ЄДРПОУ, назві або адресі"
              />
            )
          }
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
    fontSize: tokens.typography.size.base,
  },
  name: {
    color: colors.text,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
    flex: 1,
    marginRight: spacing.sm,
  },
  meta: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  statusActive: {
    backgroundColor: colors.semantic.successBg,
  },
  statusInactive: {
    backgroundColor: colors.semantic.warningBg,
  },
  statusTextActive: {
    color: colors.success,
  },
  statusTextInactive: {
    color: colors.warning,
  },
  statusLabel: {
    fontSize: tokens.typography.size.xs,
    fontWeight: tokens.typography.weight.semibold,
  },
});
