import React, {useMemo, useCallback} from 'react';
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
  useClient,
  useClientCases,
  useClientInvoices,
  useClientInspections,
} from '../../hooks/useFirebaseQueries';
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
  const uid = user?.uid;

  const {
    data: client,
    isFetching: clientFetching,
    refetch: refetchClient,
  } = useClient(uid);

  const {
    data: casesPage,
    isFetching: casesFetching,
    refetch: refetchCases,
  } = useClientCases(uid);

  const {
    data: inspectionsPage,
    isFetching: inspectionsFetching,
    refetch: refetchInspections,
  } = useClientInspections(uid);

  const {
    data: invoicesPage,
    isFetching: invoicesFetching,
    refetch: refetchInvoices,
  } = useClientInvoices(uid);

  const cases = casesPage?.data ?? [];
  const inspections = inspectionsPage?.data ?? [];
  const invoices = invoicesPage?.data ?? [];

  const isRefreshing =
    clientFetching || casesFetching || inspectionsFetching || invoicesFetching;

  const onRefresh = useCallback(() => {
    refetchClient();
    refetchCases();
    refetchInspections();
    refetchInvoices();
  }, [refetchClient, refetchCases, refetchInspections, refetchInvoices]);

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
          refreshing={isRefreshing}
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
    fontSize: tokens.typography.size['2xl'],
    marginBottom: spacing.xs,
  },
  quickLabel: {
    color: colors.text,
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
  },
  caseTitle: {
    color: colors.text,
    fontSize: tokens.typography.size.md,
    fontWeight: tokens.typography.weight.semibold,
    flex: 1,
    marginRight: spacing.sm,
  },
  caseMeta: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  empty: {
    color: colors.muted,
    fontSize: tokens.typography.size.base,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
