import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import {getCaseById, getCaseEvents, addCaseEvent, updateCase} from '../../services/firebase';
import {colors, spacing, radius, typography, globalStyles} from '../../utils/theme';
import {formatDateTime} from '../../utils/helpers';
import {Card, Badge, SectionLabel, GoldButton, ProgressBar} from '../../components/shared/UIComponents';

export default function AdminCaseDetail({route}) {
  const {clientId, caseId} = route.params;
  const [c, setCase] = useState(null);
  const [events, setEvents] = useState([]);
  const [note, setNote] = useState('');

  const load = async () => {
    const [cs, ev] = await Promise.all([
      getCaseById(clientId, caseId),
      getCaseEvents(clientId, caseId),
    ]);
    setCase(cs);
    setEvents(ev);
  };

  useEffect(() => {
    load();
  }, [clientId, caseId]);

  const handleAddEvent = async () => {
    if (!note.trim()) return;
    await addCaseEvent(clientId, caseId, {text: note.trim(), actor: 'lawyer'});
    setNote('');
    await load();
  };

  const handleUpdateProgress = async (progress) => {
    await updateCase(clientId, caseId, {progress});
    await load();
  };

  if (!c) return null;

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={{padding: spacing.md}}>
      <View style={globalStyles.rowBetween}>
        <Text style={styles.title}>{c.title}</Text>
        <Badge status={c.status} />
      </View>
      <Text style={styles.meta}>{c.court} · {c.caseNumber}</Text>

      <SectionLabel text="Прогрес" />
      <ProgressBar progress={c.progress || 0} />
      <Text style={styles.progressText}>{c.progress || 0}%</Text>
      <View style={styles.row}>
        <GoldButton title="0%" size="small" onPress={() => handleUpdateProgress(0)} />
        <GoldButton title="25%" size="small" onPress={() => handleUpdateProgress(25)} />
        <GoldButton title="50%" size="small" onPress={() => handleUpdateProgress(50)} />
        <GoldButton title="75%" size="small" onPress={() => handleUpdateProgress(75)} />
        <GoldButton title="100%" size="small" onPress={() => handleUpdateProgress(100)} />
      </View>

      <SectionLabel text="Хронологія" />
      {events.map(e => (
        <Card key={e.id}>
          <Text style={styles.eventDate}>{formatDateTime(e.date)}</Text>
          <Text style={styles.eventActor}>{e.actor === 'lawyer' ? 'Адвокат' : e.actor === 'court' ? 'Суд' : 'Опонент'}</Text>
          <Text style={styles.eventText}>{e.text}</Text>
        </Card>
      ))}
      {events.length === 0 && <Text style={styles.empty}>Немає подій</Text>}

      <SectionLabel text="Додати нотатку" />
      <View style={styles.inputWrap}>
        <TextInput
          placeholder="Новий запис..."
          placeholderTextColor={colors.muted}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          style={styles.input}
        />
      </View>
      <GoldButton title="Додати подію" onPress={handleAddEvent} disabled={!note.trim()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {...typography.h1, flex: 1, marginRight: spacing.sm},
  meta: {color: colors.muted, fontSize: 13, marginTop: spacing.xs, marginBottom: spacing.lg},
  progressText: {color: colors.muted, fontSize: 12, marginTop: spacing.xs, marginBottom: spacing.md},
  row: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg},
  eventDate: {color: colors.gold, fontSize: 12, fontWeight: '600', marginBottom: spacing.xs},
  eventActor: {color: colors.muted, fontSize: 12, fontWeight: '600', marginBottom: spacing.xs},
  eventText: {color: colors.text, fontSize: 14},
  empty: {color: colors.muted, fontSize: 14, marginBottom: spacing.lg},
  inputWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {color: colors.text, fontSize: 14, minHeight: 60, textAlignVertical: 'top'},
});
