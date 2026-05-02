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
import {getInspections} from '../../services/firebase';
import {colors, spacing, radius, typography, globalStyles} from '../../utils/theme';
import {formatDate} from '../../utils/helpers';
import {Card, Badge, EmptyState} from '../../components/shared/UIComponents';

export default function MyInspections({navigation}) {
  const {user} = useAuth();
  const [inspections, setInspections] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    const data = await getInspections(user.uid);
    setInspections(data);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({item}) => (
    <Card onPress={() => navigation.navigate('InspectionDetail', {inspectionId: item.id})}>
      <View style={globalStyles.rowBetween}>
        <Text style={styles.organ}>{item.organ}</Text>
        <Badge status={item.risk || 'low'} />
      </View>
      <Text style={styles.meta}>
        {formatDate(item.dateStart)} — {item.dateEnd ? formatDate(item.dateEnd) : 'триває'}
      </Text>
      <Text style={styles.type}>{item.type}</Text>
      {item.recommendation && (
        <Text style={styles.recommendation} numberOfLines={2}>{item.recommendation}</Text>
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
              if (first) navigation.navigate('InspectionDetail', {inspectionId: first.id});
            }}>
            <Text style={styles.criticalText}>⚠️ Критичних перевірок: {criticalCount}</Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={inspections}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
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
    backgroundColor: 'rgba(192,57,43,0.15)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  criticalText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  organ: {
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
  type: {
    color: colors.text,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  recommendation: {
    color: colors.gold,
    fontSize: 13,
    marginTop: spacing.sm,
  },
});
