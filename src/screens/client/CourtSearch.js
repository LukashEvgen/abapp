import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Linking,
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
import {searchCourt} from '../../services/registries';

export default function CourtSearch({navigation}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = useCallback(async q => {
    setLoading(true);
    setError('');
    try {
      const resp = await searchCourt(q);
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
    <Card onPress={() => navigation.navigate('RegistryDetail', {type: 'court', data: item})}>
      <View style={globalStyles.rowBetween}>
        <Text style={styles.name}>{item.number || '—'}</Text>
        {item.link ? (
          <TouchableOpacity onPress={() => Linking.openURL(item.link)}>
            <Text style={styles.link}>Відкрити ↗</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.meta}>{item.court} · {item.type}</Text>
      <Text style={styles.meta}>{item.date ? `Дата: ${item.date}` : ''}</Text>
      {item.subject ? <Text style={styles.meta}>Предмет: {item.subject}</Text> : null}
      {item.parties ? <Text style={styles.meta}>Сторони: {item.parties}</Text> : null}
    </Card>
  );

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.screen}>
        <Text style={styles.header}>Реєстр судових рішень</Text>
        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Номер справи, назва сторони..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={styles.search}
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
                icon="⚖️"
                title="Нічого не знайдено"
                subtitle="Спробуйте змінити запит"
              />
            ) : (
              <EmptyState
                icon="🔍"
                title="Введіть запит"
                subtitle="Пошук по номеру справи або стороні"
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
  link: {
    color: colors.gold,
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.sm,
  },
});
