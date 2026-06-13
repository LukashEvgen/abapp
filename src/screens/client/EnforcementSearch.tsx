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
import {searchEnforcement} from '../../services/registries';

export default function EnforcementSearch({navigation}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = useCallback(async q => {
    setLoading(true);
    setError('');
    try {
      const resp = await searchEnforcement(q);
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
    <Card onPress={() => navigation.navigate('RegistryDetail', {type: 'enforcement', data: item})}>
      <View style={globalStyles.rowBetween}>
        <Text style={styles.name}>№ {item.number}</Text>
        <View
          style={[
            styles.statusBadge,
            item.status === 'Відкрито' || item.status === 'Активне'
              ? styles.statusActive
              : styles.statusInactive,
          ]}>
          <Text style={styles.statusLabel}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.meta}>Боржник: {item.debtor} {item.debtorCode ? `(${item.debtorCode})` : ''}</Text>
      <Text style={styles.meta}>Стягувач: {item.collector}</Text>
      {item.subject ? <Text style={styles.meta}>Предмет: {item.subject}</Text> : null}
      {item.amount ? <Text style={styles.meta}>Сума: {item.amount}</Text> : null}
      {item.department ? <Text style={styles.meta}>Відділ: {item.department}</Text> : null}
      {item.dateOpen ? <Text style={styles.meta}>Відкрито: {item.dateOpen}</Text> : null}
    </Card>
  );

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.screen}>
        <Text style={styles.header}>Виконавчі провадження</Text>
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Код боржника або назва..."
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
          keyExtractor={(item, index) => item.id + index}
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
                icon="📋"
                title="Нічого не знайдено"
                subtitle="Спробуйте змінити запит"
              />
            ) : (
              <EmptyState
                icon="🔍"
                title="Введіть запит"
                subtitle="Пошук по коду боржника або назві"
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
    backgroundColor: colors.semantic.warningBg,
  },
  statusInactive: {
    backgroundColor: colors.semantic.dangerBg,
  },
  statusLabel: {
    fontSize: tokens.typography.size.xs,
    fontWeight: tokens.typography.weight.semibold,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
});
