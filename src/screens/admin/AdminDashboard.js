import React, {useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {
  useClientsInfinite,
  useAdminMessagesSummaryPaginated,
  useInquiriesInfinite,
} from '../../hooks/useFirebaseQueries';
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
  StatCard,
  AlertBanner,
  EmptyState,
} from '../../components/shared/UIComponents';

export default function AdminDashboard({navigation}) {
  const {user} = useAuth();

  const {
    data: clientsPages,
    isFetching: clientsFetching,
    refetch: refetchClients,
    hasNextPage: hasMoreClients,
  } = useClientsInfinite();

  const {
    data: summariesPages,
    isFetching: summariesFetching,
    refetch: refetchSummaries,
    fetchNextPage: fetchNextSummaries,
    hasNextPage: hasMoreSummaries,
    isFetchingNextPage: isFetchingNextSummaries,
  } = useAdminMessagesSummaryPaginated();

  const {
    data: inquiriesPages,
    isFetching: inquiriesFetching,
    refetch: refetchInquiries,
  } = useInquiriesInfinite();

  const isRefreshing =
    clientsFetching || summariesFetching || inquiriesFetching;

  const onRefresh = () => {
    refetchClients();
    refetchSummaries();
    refetchInquiries();
  };

  const clients = useMemo(
    () => clientsPages?.pages.flatMap(p => p.data) ?? [],
    [clientsPages],
  );

  const summaries = useMemo(
    () => summariesPages?.pages.flatMap(p => p.data) ?? [],
    [summariesPages],
  );

  const inquiries = useMemo(
    () => inquiriesPages?.pages.flatMap(p => p.data) ?? [],
    [inquiriesPages],
  );

  const unreadChats = summaries.filter(s => s.unreadCount > 0);
  const newInquiriesCount = inquiries.filter(i => i.status === 'new').length;

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{padding: spacing.md}}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.gold}
        />
      }>
      <Text style={styles.header}>Адмін-панель</Text>

      <View style={styles.statsRow}>
        <StatCard
          icon="👥"
          label="Клієнтів"
          value={`${clients.length}${hasMoreClients ? '+' : ''}`}
        />
        <StatCard icon="📝" label="Звернень" value={newInquiriesCount} />
        <StatCard icon="💬" label="Чатів" value={unreadChats.length} />
      </View>

      {unreadChats.length > 0 && (
        <AlertBanner
          type="warning"
          text={`Непрочитаних повідомлень: ${unreadChats.reduce(
            (s, c) => s + c.unreadCount,
            0,
          )}`}
          onPress={() => navigation.navigate('AdminChats')}
        />
      )}

      {newInquiriesCount > 0 && (
        <AlertBanner
          type="gold"
          text={`Нових звернень: ${newInquiriesCount}`}
          onPress={() =>
            navigation.navigate('Clients', {screen: 'ClientsList'})
          }
        />
      )}

      <SectionLabel text="Останні чати" />
      {summaries.slice(0, 5).map(s => (
        <Card
          key={s.clientId}
          onPress={() =>
            navigation.navigate('Clients', {
              screen: 'AdminChatDetail',
              params: {clientId: s.clientId},
            })
          }>
          <View style={globalStyles.rowBetween}>
            <Text style={styles.clientName}>{s.name}</Text>
            {s.unreadCount > 0 && (
              <Text style={styles.unreadBadge}>{s.unreadCount}</Text>
            )}
          </View>
          <Text style={styles.lastMsg} numberOfLines={1}>
            {s.lastMessage || 'Немає повідомлень'}
          </Text>
        </Card>
      ))}
      {summaries.length === 0 && (
        <EmptyState
          icon="💬"
          title="Немає чатів"
          subtitle="Чати з клієнтами з’являться тут"
        />
      )}

      {hasMoreSummaries && (
        <TouchableOpacity
          style={styles.loadMoreBtn}
          onPress={() => fetchNextSummaries()}
          disabled={isFetchingNextSummaries}>
          {isFetchingNextSummaries ? (
            <ActivityIndicator color={colors.gold} />
          ) : (
            <Text style={styles.loadMoreText}>Завантажити ще ↓</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {...typography.h1, marginBottom: spacing.md},
  statsRow: {flexDirection: 'row', marginBottom: spacing.lg},
  clientName: {
    color: colors.text,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
    flex: 1,
  },
  lastMsg: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.xs,
  },
  unreadBadge: {
    backgroundColor: colors.danger,
    color: colors.text,
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.bold,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loadMoreText: {
    color: colors.gold,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
  },
});
