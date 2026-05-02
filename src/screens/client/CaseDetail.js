import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {getCaseById, getCaseEvents, getDocuments} from '../../services/firebase';
import {colors, spacing, radius, typography, globalStyles} from '../../utils/theme';
import {formatDate, formatDateTime} from '../../utils/helpers';
import {Card, Badge, ProgressBar, SectionLabel, GoldButton} from '../../components/shared/UIComponents';

export default function CaseDetail({route, navigation}) {
  const {caseId} = route.params;
  const {user} = useAuth();
  const [c, setCase] = useState(null);
  const [events, setEvents] = useState([]);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [cs, ev, dc] = await Promise.all([
        getCaseById(user.uid, caseId),
        getCaseEvents(user.uid, caseId),
        getDocuments(user.uid, caseId),
      ]);
      if (!mounted) return;
      setCase(cs);
      setEvents(ev);
      setDocs(dc);
    })();
    return () => { mounted = false; };
  }, [caseId, user]);

  if (!c) return null;

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={{padding: spacing.md}}>
      <View style={globalStyles.rowBetween}>
        <Text style={styles.title}>{c.title}</Text>
        <Badge status={c.status} />
      </View>
      <Text style={styles.meta}>{c.court} · Номер: {c.caseNumber}</Text>
      <Text style={styles.meta}>Категорія: {c.category} · Інстанція: {c.instance}</Text>

      <SectionLabel text="Прогрес" />
      <ProgressBar progress={c.progress || 0} />
      <Text style={styles.progressText}>{c.progress || 0}% виконано</Text>

      <SectionLabel text="Хронологія подій" />
      {events.map(e => (
        <Card key={e.id}>
          <Text style={styles.eventDate}>{formatDateTime(e.date)}</Text>
          <Text style={styles.eventActor}>{e.actor === 'lawyer' ? 'Адвокат' : e.actor === 'court' ? 'Суд' : 'Опонент'}</Text>
          <Text style={styles.eventText}>{e.text}</Text>
        </Card>
      ))}
      {events.length === 0 && <Text style={styles.empty}>Немає подій</Text>}

      <View style={styles.actions}>
        <GoldButton title="Написати адвокату" onPress={() => navigation.navigate('Chat')} />
        <View style={{height: spacing.sm}} />
        <GoldButton
          title="Документи справи"
          variant="ghost"
          onPress={() => navigation.navigate('MyDocuments', {caseId})}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    flex: 1,
    marginRight: spacing.sm,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  progressText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  eventDate: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  eventActor: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  eventText: {
    color: colors.text,
    fontSize: 14,
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  actions: {
    marginTop: spacing.lg,
  },
});
