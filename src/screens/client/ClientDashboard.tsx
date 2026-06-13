import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {
  getClientById,
  getCases,
  getInspections,
  getInvoices,
} from '../../services/firebase';
import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
} from '../../utils/theme';
import {formatDate, formatCurrency, initials} from '../../utils/helpers';
import {
  Card,
  SectionLabel,
  AlertBanner,
  StatCard,
  ProgressBar,
  Badge,
} from '../../components/shared/UIComponents';

export default function ClientDashboard({navigation}) {
  const {user} = useAuth();
  const [client, setClient] = useState(null);
  const [cases, setCases] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) {
      return;
    }
    const c = await getClientById(user.uid);
    setClient(c);
    if (c) {
      const [cs, ins, inv] = await Promise.all([
        getCases(user.uid),
        getInspections(user.uid),
        getInvoices(user.uid),
      ]);
      setCases(cs);
      setInspections(ins);
      setInvoices(inv);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openCases = invoices.filter(i => i.status === 'pending');
  const criticalInspections = inspections.filter(i => i.risk === 'critical');
  const upcomingHearings = cases
    .filter(c => c.nextHearing)
    .sort((a, b) => (a.nextHearing < b.nextHearing ? -1 : 1));

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{padding: spacing.md}}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.gold}
        />
      }>
      <Text style={styles.greeting}>
        Привіт, {client?.name || 'клієнте'} 👋
      </Text>

      {criticalInspections.length > 0 && (
        <AlertBanner
          type="danger"
          text={`Критична перевірка: ${criticalInspections[0].organ}`}
          onPress={() =>
            navigation.navigate('Inspections', {
              screen: 'InspectionDetail',
              params: {inspectionId: criticalInspections[0].id},
            })
          }
        />
      )}

      {upcomingHearings.length > 0 && (
        <AlertBanner
          type="gold"
          text={`Наступне засідання: ${formatDate(
            upcomingHearings[0].nextHearing,
          )}`}
          onPress={() =>
            navigation.navigate('Cases', {
              screen: 'CaseDetail',
              params: {caseId: upcomingHearings[0].id},
            })
          }
        />
      )}

      {openCases.length > 0 && (
        <AlertBanner
          type="warning"
          text={`Неоплачено: ${formatCurrency(
            openCases.reduce((s, i) => s + (i.amount || 0), 0),
          )}`}
          onPress={() => navigation.navigate('Cases', {screen: 'MyInvoices'})}
        />
      )}

      <View style={styles.statsRow}>
        <StatCard icon="⚖" label="Справи" value={cases.length} />
        <StatCard icon="🔍" label="Перевірки" value={inspections.length} />
        <StatCard icon="💰" label="Рахунки" value={openCases.length} />
      </View>

      <SectionLabel text="Швидкий доступ" />
      <View style={styles.quickGrid}>
        {[
          {label: 'Справи', icon: '⚖', screen: 'Cases', target: 'MyCases'},
          {
            label: 'Перевірки',
            icon: '🔍',
            screen: 'Inspections',
            target: 'MyInspections',
          },
          {
            label: 'Реєстри',
            icon: '🗂',
            screen: 'Registry',
            target: 'RegistrySearch',
          },
          {label: 'Бюро', icon: '👨‍⚖️', screen: 'Bureau', target: 'Bureau'},
          {label: 'Чат', icon: '💬', screen: 'Cases', target: 'Chat'},
          {
            label: 'Документи',
            icon: '📄',
            screen: 'Cases',
            target: 'MyDocuments',
          },
        ].map(item => (
          <TouchableOpacity
            key={item.label}
            style={styles.quickButton}
            onPress={() =>
              navigation.navigate(item.screen, {screen: item.target})
            }>
            <Text style={styles.quickIcon}>{item.icon}</Text>
            <Text style={styles.quickLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionLabel text="Активні справи" />
      {cases.slice(0, 3).map(c => (
        <Card
          key={c.id}
          onPress={() =>
            navigation.navigate('Cases', {
              screen: 'CaseDetail',
              params: {caseId: c.id},
            })
          }>
          <View style={globalStyles.rowBetween}>
            <Text style={styles.caseTitle}>{c.title}</Text>
            <Badge status={c.status} />
          </View>
          <Text style={styles.caseMeta}>
            {c.court} · {c.caseNumber}
          </Text>
          {c.nextHearing && (
            <Text style={styles.caseMeta}>
              Засідання: {formatDate(c.nextHearing)}
            </Text>
          )}
          <ProgressBar progress={c.progress || 0} />
        </Card>
      ))}
      {cases.length === 0 && (
        <Text style={styles.empty}>Немає активних справ</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  greeting: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  quickButton: {
    width: '30%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  quickIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  quickLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  caseTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  caseMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
