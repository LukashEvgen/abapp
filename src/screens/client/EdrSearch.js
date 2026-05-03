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
  tokens,
} from '../../utils/theme';
import {
  Card,
  SectionLabel,
  EmptyState,
} from '../../components/shared/UIComponents';
import {searchEdr} from '../../services/registries';

export default function EdrSearch({navigation}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = useCallback(async q => {
    setLoading(true);
    setError('');
    try {
      const resp = await searchEdr(q);
      setResults(resp.results || []);
    } catch (e) {
      setError(e?.message || 'Помилка пошуку');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length >= 2) search(query);
    }, 500);
    return () => clearTimeout(t);
  }, [query, search]);

  const renderItem = ({item}) => (
    <Card onPress={() => navigation.navigate('RegistryDetail', {type: 'edr', data: item})}>
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
            {item.status === 'active' ? 'Активний' : 'Неактивний'}
          </Text>
        </View>
      </View>
      <Text style={styles.meta}>Код: {item.code} · {item.type}</Text>
      {item.address ? <Text style={styles.meta}>{item.address}</Text> : null}
      {item.ceo ? <Text style={styles.meta}>Керівник: {item.ceo}</Text> : null}
    </Card>
  );

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.screen}>
        <Text style={styles.header}>Єдиний державний реєстр</Text>
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Назва, ЄДРПОУ або ІПН..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={styles.search}
            keyboardType="default"
            autoCapitalize="none"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <SectionLabel text={loading ? 'Пошук...' : `Результати (${results.length})`} />
        <FlatList
          data={results}
          keyExtractor={(item, index) => item.code + index}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => query.trim().length >= 2 && search(query)}
              tintColor={colors.gold}
            />
          }
          ListEmptyComponent={
            query.trim().length >= 2 && !loading ? (
              <EmptyState
                icon="🗂"
                title="Нічого не знайдено"
                subtitle="Спробуйте змінити запит"
              />
            ) : (
              <EmptyState
                icon="🔍"
                title="Введіть запит"
                subtitle="Пошук по ЄДРПОУ, ІПН або назві"
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
    fontSize: 16,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
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
    fontSize: 12,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
});
