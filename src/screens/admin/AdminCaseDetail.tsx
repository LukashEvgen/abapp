import React, {useState, useCallback, useMemo} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  useCaseByIdRealtime,
  useCaseEventsPaginated,
  useUpdateCase,
  useAddCaseEvent,
} from '../../hooks/useFirebaseQueries';
import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
  tokens,
} from '../../utils/theme';
import {formatDateTime} from '../../utils/helpers';
import {
  Card,
  Badge,
  SectionLabel,
  GoldButton,
  ProgressBar,
} from '../../components/shared/UIComponents';

export default function AdminCaseDetail({route}) {
  const {clientId, caseId} = route.params;
  const qc = useQueryClient();
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  useCaseByIdRealtime(clientId, caseId, isFocused);

  const {
    data: eventsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isFetching,
  } = useCaseEventsPaginated(clientId, caseId);

  const events = useMemo(
    () => eventsPages?.pages.flatMap(p => p.data) ?? [],
    [eventsPages],
  );

  const c = qc.getQueryData(['case', clientId, caseId]) ?? null;
  const [note, setNote] = useState('');

  const updateCase = useUpdateCase();
  const addCaseEvent = useAddCaseEvent();

  const handleAddEvent = async () => {
    if (!note.trim()) {
      return;
    }
    await addCaseEvent.mutateAsync({
      clientId,
      caseId,
      eventData: {text: note.trim(), actor: 'lawyer'},
    });
    setNote('');
  };

  const handleUpdateProgress = async progress => {
    await updateCase.mutateAsync({clientId, caseId, data: {progress}});
  };

  if (!c) {
    return null;
  }

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{padding: spacing.md}}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isFetchingNextPage}
          onRefresh={refetch}
          tintColor={colors.gold}
        />
      }>
      <View style={globalStyles.rowBetween}>
        <Text style={styles.title}>{c.title}</Text>
        <Badge status={c.status} />
      </View>
      <Text style={styles.meta}>
        {c.court} · {c.caseNumber}
      </Text>

      <SectionLabel text="Прогрес" />
      <ProgressBar progress={c.progress || 0} />
      <Text style={styles.progressText}>{c.progress || 0}%</Text>
      <View style={styles.row}>
        <GoldButton
          title="0%"
          size="small"
          onPress={() => handleUpdateProgress(0)}
        />
        <GoldButton
          title="25%"
          size="small"
          onPress={() => handleUpdateProgress(25)}
        />
        <GoldButton
          title="50%"
          size="small"
          onPress={() => handleUpdateProgress(50)}
        />
        <GoldButton
          title="75%"
          size="small"
          onPress={() => handleUpdateProgress(75)}
        />
        <GoldButton
          title="100%"
          size="small"
          onPress={() => handleUpdateProgress(100)}
        />
      </View>

      <SectionLabel text="Хронологія" />
      {events.map(e => (
        <Card key={e.id}>
          <Text style={styles.eventDate}>{formatDateTime(e.date)}</Text>
          <Text style={styles.eventActor}>
            {e.actor === 'lawyer'
              ? 'Адвокат'
              : e.actor === 'court'
              ? 'Суд'
              : 'Опонент'}
          </Text>
          <Text style={styles.eventText}>{e.text}</Text>
        </Card>
      ))}
      {events.length === 0 && <Text style={styles.empty}>Немає подій</Text>}

      {hasNextPage && (
        <TouchableOpacity
          style={styles.loadMoreBtn}
          onPress={() => fetchNextPage()}
          disabled={isFetchingNextPage}>
          {isFetchingNextPage ? (
            <ActivityIndicator color={colors.gold} />
          ) : (
            <Text style={styles.loadMoreText}>Завантажити ще ↓</Text>
          )}
        </TouchableOpacity>
      )}

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
      <GoldButton
        title="Додати подію"
        onPress={handleAddEvent}
        disabled={!note.trim() || addCaseEvent.isPending}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {...typography.h1, flex: 1, marginRight: spacing.sm},
  meta: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  progressText: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  eventDate: {
    color: colors.gold,
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  eventActor: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  eventText: {color: colors.text, fontSize: tokens.typography.size.base},
  empty: {
    color: colors.muted,
    fontSize: tokens.typography.size.base,
    marginBottom: spacing.lg,
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  loadMoreText: {
    color: colors.gold,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
  },
  inputWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    color: colors.text,
    fontSize: tokens.typography.size.base,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
