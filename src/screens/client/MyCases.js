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
import {useAuth} from '../../context/AuthContext';
import {useCasesRealtime} from '../../hooks/useFirebaseQueries';
import {Case} from '../../services/cases';
import {colors, spacing, globalStyles} from '../../utils/theme';
import {formatDate} from '../../utils/helpers';
import {sharedStyles} from '../../utils/sharedStyles';
import {
  Card,
  Badge,
  ProgressBar,
  EmptyState,
} from '../../components/shared/UIComponents';

export default function MyCases({navigation}) {
  const {user} = useAuth();
  const [query, setQuery] = useState('');

  const {data: allCases, isFetching} = useCasesRealtime(user?.uid);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) {
      return allCases ?? [];
    }
    return (allCases ?? []).filter(
      c =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.caseNumber || '').toLowerCase().includes(q) ||
        (c.court || '').toLowerCase().includes(q),
    );
  }, [query, allCases]);

  const renderItem = ({item}: {item: Case}) => (
    <Card onPress={() => navigation.navigate('CaseDetail', {caseId: item.id})}>
      <View style={globalStyles.rowBetween}>
        <Text style={sharedStyles.caseTitle}>{item.title}</Text>
        <Badge status={item.status} />
      </View>
      <Text style={sharedStyles.caseMeta}>
        {item.court} · {item.caseNumber}
      </Text>
      {item.nextHearing && (
        <Text style={sharedStyles.caseMeta}>
          Засідання: {formatDate(item.nextHearing)}
        </Text>
      )}
      <ProgressBar progress={item.progress || 0} />
    </Card>
  );

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.screen}>
        <Text style={sharedStyles.header}>Мої справи</Text>
        <View style={sharedStyles.searchWrap}>
          <TextInput
            placeholder="Пошук за назвою, номером, судом..."
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
              icon="⚖"
              title="Немає справ"
              subtitle="Ваші судові справи з’являться тут"
            />
          }
          contentContainerStyle={{paddingBottom: spacing.lg}}
        />
      </View>
    </View>
  );
}
