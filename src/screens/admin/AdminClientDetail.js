import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {getClientById, getCases, getInvoices, getInspections} from '../../services/firebase';
import {colors, spacing, radius, typography, globalStyles} from '../../utils/theme';
import {formatDate} from '../../utils/helpers';
import {Card, Badge, SectionLabel, GoldButton, StatCard} from '../../components/shared/UIComponents';

export default function AdminClientDetail({route, navigation}) {
  const {clientId} = route.params;
  const [client, setClient] = useState(null);
  const [cases, setCases] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [inspections, setInspections] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [cl, cs, inv, ins] = await Promise.all([
        getClientById(clientId),
        getCases(clientId),
        getInvoices(clientId),
        getInspections(clientId),
      ]);
      if (!mounted) return;
      setClient(cl);
      setCases(cs);
      setInvoices(inv);
      setInspections(ins);
    })();
    return () => { mounted = false; };
  }, [clientId]);

  if (!client) return null;

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={{padding: spacing.md}}>
      <Text style={styles.header}>{client.name || 'Без імені'}</Text>
      <Text style={styles.meta}>Телефон: {client.phone || '—'}</Text>
      <Text style={styles.meta}>Зареєстровано: {formatDate(client.createdAt)}</Text>

      <View style={styles.statsRow}>
        <StatCard icon="⚖" label="Справи" value={cases.length} />
        <StatCard icon="💰" label="Рахунки" value={invoices.length} />
        <StatCard icon="🔍" label="Перевірки" value={inspections.length} />
      </View>

      <SectionLabel text="Справи" />
      {cases.slice(0, 3).map(c => (
        <Card key={c.id} onPress={() => navigation.navigate('AdminCaseDetail', {clientId, caseId: c.id})}>
          <View style={globalStyles.rowBetween}>
            <Text style={styles.caseTitle}>{c.title}</Text>
            <Badge status={c.status} />
          </View>
          <Text style={styles.caseMeta}>{c.court} · {c.caseNumber}</Text>
        </Card>
      ))}
      {cases.length === 0 && <Text style={styles.empty}>Немає справ</Text>}

      <View style={styles.actions}>
        <GoldButton title="Чат з клієнтом" onPress={() => navigation.navigate('AdminChatDetail', {clientId})} />
        <View style={{height: spacing.sm}} />
        <GoldButton title="Виставити рахунок" variant="ghost" onPress={() => navigation.navigate('CreateInvoice', {clientId})} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {...typography.h1, marginBottom: spacing.sm},
  meta: {color: colors.muted, fontSize: 13, marginTop: spacing.xs},
  statsRow: {flexDirection: 'row', marginVertical: spacing.lg},
  caseTitle: {color: colors.text, fontSize: 15, fontWeight: '600', flex: 1, marginRight: spacing.sm},
  caseMeta: {color: colors.muted, fontSize: 12, marginTop: spacing.xs},
  empty: {color: colors.muted, fontSize: 14, marginBottom: spacing.lg},
  actions: {marginTop: spacing.lg},
});
