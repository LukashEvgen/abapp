import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {getInvoices} from '../../services/firebase';
import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
} from '../../utils/theme';
import {formatDate, formatCurrency} from '../../utils/helpers';
import {
  Card,
  Badge,
  EmptyState,
  GoldButton,
} from '../../components/shared/UIComponents';

export default function MyInvoices({navigation}) {
  const {user} = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState('all'); // all | pending | paid | overdue
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) {
      return;
    }
    const data = await getInvoices(user.uid);
    setInvoices(data);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (filter === 'all') {
      setFiltered(invoices);
    } else {
      setFiltered(invoices.filter(i => i.status === filter));
    }
  }, [filter, invoices]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const totalPending = invoices
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .reduce((s, i) => s + (i.amount || 0), 0);

  const renderItem = ({item}) => (
    <Card>
      <View style={globalStyles.rowBetween}>
        <Text style={styles.title}>{item.title || 'Рахунок'}</Text>
        <Badge status={item.status} />
      </View>
      <Text style={styles.meta}>
        № {item.number || item.id.slice(-6)} · {formatDate(item.createdAt)}
      </Text>
      <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
      {item.status === 'pending' || item.status === 'overdue' ? (
        <GoldButton
          title="Оплатити"
          size="small"
          style={{marginTop: spacing.sm}}
          onPress={() => {
            // MVP: відкрити монобанку/приват24 або показати реквізити
            const url = item.paymentUrl || 'https://privat24.ua';
            Linking.openURL(url).catch(() => {});
          }}
        />
      ) : null}
    </Card>
  );

  const FilterChip = ({label, value}) => (
    <TouchableOpacity
      onPress={() => setFilter(value)}
      style={[styles.chip, filter === value && styles.chipActive]}>
      <Text
        style={[styles.chipText, filter === value && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.screen}>
        <Text style={styles.header}>Мої рахунки</Text>

        {totalPending > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>До сплати</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalPending)}
            </Text>
          </View>
        )}

        <View style={styles.chipRow}>
          <FilterChip label="Всі" value="all" />
          <FilterChip label="Очікують" value="pending" />
          <FilterChip label="Оплачено" value="paid" />
          <FilterChip label="Прострочено" value="overdue" />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.gold}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="💰"
              title="Немає рахунків"
              subtitle="Ваші рахунки з’являться тут після виставлення адвокатом"
            />
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
  summary: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  chipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.bg,
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
  },
  amount: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
});
