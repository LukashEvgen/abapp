import React, {useMemo, useState, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {useClientInvoices} from '../../hooks/useFirebaseQueries';
import {payInvoice, openPaymentUrl} from '../../services/payments';
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
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  const {
    data: page,
    isFetching,
    refetch,
  } = useClientInvoices(user?.uid, isFocused);

  const invoices = page?.data ?? [];
  const [filter, setFilter] = useState('all'); // all | pending | paid | overdue

  const filtered = useMemo(() => {
    if (filter === 'all') {
      return invoices;
    }
    return invoices.filter(i => {
      if (filter === 'pending') {
        return i.status === 'pending' || i.status === 'overdue';
      }
      return i.status === filter;
    });
  }, [filter, invoices]);

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
      {(item.status === 'pending' || item.status === 'overdue') ? (
        item.gateway === 'liqpay' || item.gateway === 'wayforpay' ? (
          <GoldButton
            title="Оплатити"
            size="small"
            style={{marginTop: spacing.sm}}
            onPress={async () => {
              try {
                const result = await payInvoice(
                  user.uid,
                  item.id,
                  item.amount || 0,
                  item.title || 'Рахунок',
                  item.gateway,
                );
                if (result?.checkoutUrl) {
                  await openPaymentUrl(result.checkoutUrl);
                }
              } catch {
                // помилка вже показана всередині payInvoice
              }
            }}
          />
        ) : (
          <GoldButton
            title="Оплатити"
            size="small"
            style={{marginTop: spacing.sm}}
            onPress={() => {
              const url = item.paymentUrl || 'https://privat24.ua';
              Linking.openURL(url).catch(() => {});
            }}
          />
        )
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
              refreshing={isFetching}
              onRefresh={refetch}
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
    fontSize: tokens.typography.size['2xl'],
    fontWeight: tokens.typography.weight.bold,
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
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
  },
  chipTextActive: {
    color: colors.bg,
  },
  title: {
    color: colors.text,
    fontSize: tokens.typography.size.md,
    fontWeight: tokens.typography.weight.semibold,
    flex: 1,
    marginRight: spacing.sm,
  },
  meta: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.xs,
  },
  amount: {
    color: colors.gold,
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.bold,
    marginTop: spacing.sm,
  },
});
