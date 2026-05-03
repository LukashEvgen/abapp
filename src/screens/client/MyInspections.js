import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {getInspectionsPaginated} from '../../services/inspections';
import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
} from '../../utils/theme';
import {formatDate, statusColors, statusBgColors} from '../../utils/helpers';
import {Card, Badge, EmptyState} from '../../components/shared/UIComponents';

export default function MyInspections({navigation}) {
  const {user} = useAuth();
  const [inspections, setInspections] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) {
      return;
    }
    const page = await getInspectionsPaginated(user.uid);
    setInspections(page.data);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({item}) => (
    <Card
      onPress={() =>
        navigation.navigate('InspectionDetail', {inspectionId: item.id})
      }>
      <View style={globalStyles.rowBetween}>
        <Text style={styles.organ}>{item.organ}</Text>
        <Badge status={item.risk || 'low'} />
      </View>
      <Text style={styles.meta}>
        {formatDate(item.dateStart)} —{' '}
        {item.dateEnd ? formatDate(item.dateEnd) : 'триває'}
      </Text>
      <Text style={styles.type}>{item.type}</Text>
      {item.recommendation && (
        <Text style={styles.recommendation} numberOfLines={2}>
          {item.recommendation}
        </Text>
      )}
    </Card>
  );

  const criticalCount = inspections.filter(i => i.risk === 'critical').length;

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.screen}>
        <Text style={styles.header}>Перевірки</Text>

        {criticalCount > 0 && (
          <TouchableOpacity
            style={styles.criticalBanner}
            onPress={() => {
              const first = inspections.find(i => i.risk === 'critical');
              if (first) {
                navigation.navigate('InspectionDetail', {
                  inspectionId: first.id,
                });
              }
            }}>
            <Text style={styles.criticalText}>
              ⚠️ Критичних перевірок: {criticalCount}
            </Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={inspections}
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
              icon="🔍"
              title="Немає перевірок"
              subtitle="Інформація про перевірки з’явиться тут"
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
  criticalBanner: {
    backgroundColor: colors.semantic.dangerBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  criticalText: {
    color: colors.danger,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
  },
  organ: {
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
  type: {
    color: colors.text,
    fontSize: tokens.typography.size.base,
    marginTop: spacing.sm,
  },
  recommendation: {
    color: colors.gold,
    fontSize: tokens.typography.size.sm,
    marginTop: spacing.sm,
  },
});
