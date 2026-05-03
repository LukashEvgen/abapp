import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useClientsRealtime} from '../../hooks/useFirebaseQueries';
import {Client} from '../../services/clients';
import {colors, spacing, globalStyles, tokens} from '../../utils/theme';
import {formatDate} from '../../utils/helpers';
import {sharedStyles} from '../../utils/sharedStyles';
import {Card, EmptyState} from '../../components/shared/UIComponents';

export default function ClientsList({navigation}) {
  const [query, setQuery] = useState('');

  const {data: allClients, isFetching} = useClientsRealtime(100);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) {
      return allClients ?? [];
    }
    return (allClients ?? []).filter(
      c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q),
    );
  }, [query, allClients]);

  const renderItem = ({item}: {item: Client}) => (
    <Card
      onPress={() =>
        navigation.navigate('AdminClientDetail', {clientId: item.id})
      }>
      <View style={globalStyles.rowBetween}>
        <Text style={sharedStyles.caseTitle}>{item.name || 'Без імені'}</Text>
        <Text style={styles.phone}>{item.phone || ''}</Text>
      </View>
      <Text style={sharedStyles.caseMeta}>
        Зареєстровано: {formatDate(item.createdAt)}
      </Text>
    </Card>
  );

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.screen}>
        <Text style={sharedStyles.header}>Клієнти</Text>
        <View style={sharedStyles.searchWrap}>
          <TextInput
            placeholder="Пошук за іменем або телефоном..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={sharedStyles.search}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={() => {
                /* Realtime auto-refreshes; no-op is intentional */
              }}
              tintColor={colors.gold}
            />
          }
          ListFooterComponent={
            isFetching ? (
              <ActivityIndicator
                color={colors.gold}
                style={{margin: spacing.md}}
              />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="👥"
              title="Немає клієнтів"
              subtitle="Список клієнтів з’явиться тут"
            />
          }
          contentContainerStyle={{paddingBottom: spacing.lg}}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  phone: {color: colors.muted, fontSize: tokens.typography.size.sm},
});
