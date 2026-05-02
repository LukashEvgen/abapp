import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {getAllClients, getInquiries, getAdminMessagesSummary} from '../../services/firebase';
import {colors, spacing, radius, typography, globalStyles} from '../../utils/theme';
import {Card, SectionLabel, StatCard, AlertBanner, EmptyState} from '../../components/shared/UIComponents';

export default function AdminDashboard({navigation}) {
  const {user} = useAuth();
  const [clients, setClients] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cl, inq, sum] = await Promise.all([
        getAllClients(),
        getInquiries(),
        getAdminMessagesSummary(),
      ]);
      setClients(cl);
      setInquiries(inq);
      setSummaries(sum);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const unreadChats = summaries.filter(s => s.unreadCount > 0);
  const newInquiries = inquiries.filter(i => i.status === 'new');

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{padding: spacing.md}}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}>
      <Text style={styles.header}>Адмін-панель</Text>

      <View style={styles.statsRow}>
        <StatCard icon="👥" label="Клієнтів" value={clients.length} />
        <StatCard icon="📝" label="Звернень" value={newInquiries.length} />
        <StatCard icon="💬" label="Чатів" value={unreadChats.length} />
      </View>

      {unreadChats.length > 0 && (
        <AlertBanner
          type="warning"
          text={`Непрочитаних повідомлень: ${unreadChats.reduce((s, c) => s + c.unreadCount, 0)}`}
          onPress={() => navigation.navigate('AdminChats')}
        />
      )}

      {newInquiries.length > 0 && (
        <AlertBanner
          type="gold"
          text={`Нових звернень: ${newInquiries.length}`}
          onPress={() => navigation.navigate('Clients', {screen: 'ClientsList'})}
        />
      )}

      <SectionLabel text="Останні чати" />
      {summaries.slice(0, 5).map(s => (
        <Card key={s.clientId} onPress={() => navigation.navigate('Clients', {screen: 'AdminChatDetail', params: {clientId: s.clientId}})}>
          <View style={globalStyles.rowBetween}>
            <Text style={styles.clientName}>{s.name}</Text>
            {s.unreadCount > 0 && <Text style={styles.unreadBadge}>{s.unreadCount}</Text>}
          </View>
          <Text style={styles.lastMsg} numberOfLines={1}>{s.lastMessage || 'Немає повідомлень'}</Text>
        </Card>
      ))}
      {summaries.length === 0 && <EmptyState icon="💬" title="Немає чатів" subtitle="Чати з клієнтами з’являться тут" />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {...typography.h1, marginBottom: spacing.md},
  statsRow: {flexDirection: 'row', marginBottom: spacing.lg},
  clientName: {color: colors.text, fontSize: 15, fontWeight: '600', flex: 1},
  lastMsg: {color: colors.muted, fontSize: 13, marginTop: spacing.xs},
  unreadBadge: {
    backgroundColor: colors.danger,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
  },
});
