import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {
  useCaseByIdRealtime,
  useCaseEventsPaginated,
} from '../../hooks/useFirebaseQueries';
import {useQueryClient} from '@tanstack/react-query';
import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
  tokens,
} from '../../utils/theme';
import {formatDate, formatDateTime} from '../../utils/helpers';
import {
  Card,
  Badge,
  ProgressBar,
  SectionLabel,
  GoldButton,
} from '../../components/shared/UIComponents';

export default function CaseDetail({route, navigation}) {
  const {caseId} = route.params;
  const {user} = useAuth();
  const qc = useQueryClient();
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  useCaseByIdRealtime(user?.uid, caseId, isFocused);

  const {
    data: eventsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isFetching,
  } = useCaseEventsPaginated(user?.uid, caseId);

  const events = useMemo(
    () => eventsPages?.pages.flatMap(p => p.data) ?? [],
    [eventsPages],
  );

  const c = qc.getQueryData(['case', user?.uid, caseId]) ?? null;

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
        {c.court} · Номер: {c.caseNumber}
      </Text>
      <Text style={styles.meta}>
        Категорія: {c.category} · Інстанція: {c.instance}
      </Text>

      <SectionLabel text="Прогрес" />
      <ProgressBar progress={c.progress || 0} />
      <Text style={styles.progressText}>{c.progress || 0}% виконано</Text>

      <SectionLabel text="Хронологія подій" />
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

      <View style={styles.actions}>
        <GoldButton
          title="Написати адвокату"
          onPress={() => navigation.navigate('Chat')}
        />
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
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.xs,
  },
  progressText: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.xs,
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
  eventText: {
    color: colors.text,
    fontSize: tokens.typography.size.base,
  },
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
  actions: {
    marginTop: spacing.lg,
  },
});
