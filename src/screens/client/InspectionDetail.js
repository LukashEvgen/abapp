import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {getInspectionById} from '../../services/firebase';
import {colors, spacing, radius, typography, globalStyles} from '../../utils/theme';
import {formatDate} from '../../utils/helpers';
import {Badge, SectionLabel, GoldButton, Card} from '../../components/shared/UIComponents';

export default function InspectionDetail({route, navigation}) {
  const {inspectionId} = route.params;
  const {user} = useAuth();
  const [inspection, setInspection] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.uid) return;
      const data = await getInspectionById(user.uid, inspectionId);
      if (mounted) setInspection(data);
    })();
    return () => { mounted = false; };
  }, [inspectionId, user]);

  if (!inspection) return null;

  const risk = inspection.risk || 'low';
  const riskTitle = {low: 'Низький', medium: 'Середній', high: 'Високий', critical: 'Критичний'}[risk] || risk;

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={{padding: spacing.md}}>
      <View style={globalStyles.rowBetween}>
        <Text style={styles.title}>{inspection.organ}</Text>
        <Badge status={risk} />
      </View>

      <Text style={styles.meta}>{inspection.type}</Text>
      <Text style={styles.meta}>
        Період: {formatDate(inspection.dateStart)} — {inspection.dateEnd ? formatDate(inspection.dateEnd) : 'триває'}
      </Text>

      <SectionLabel text="Рівень ризику" />
      <Card style={{borderColor: colors[risk === 'critical' ? 'danger' : risk === 'high' ? 'warning' : 'success']}}>
        <Text style={[styles.riskValue, {color: colors[risk === 'critical' ? 'danger' : risk === 'high' ? 'warning' : 'success'] || colors.gold}]}>
          {riskTitle}
        </Text>
        <Text style={styles.riskDesc}>
          {risk === 'critical'
            ? 'Виявлено критичні порушення, які потребують негайної реакції адвоката.'
            : risk === 'high'
            ? 'Є значні ризики. Рекомендується термінова консультація.'
            : risk === 'medium'
            ? 'Помірні ризики. Слідкуйте за розвитком подій.'
            : 'Ризики мінімальні. Ситуація під контролем.'}
        </Text>
      </Card>

      {inspection.findings && (
        <>
          <SectionLabel text="Виявлене" />
          <Card>
            <Text style={styles.body}>{inspection.findings}</Text>
          </Card>
        </>
      )}

      {inspection.recommendation && (
        <>
          <SectionLabel text="Рекомендації" />
          <Card>
            <Text style={styles.body}>{inspection.recommendation}</Text>
          </Card>
        </>
      )}

      <View style={styles.actions}>
        <GoldButton
          title="Написати адвокату"
          onPress={() => navigation.navigate('Chat')}
        />
        {risk === 'critical' || risk === 'high' ? (
          <>
            <View style={{height: spacing.sm}} />
            <GoldButton
              title="Термінова консультація"
              variant="ghost"
              onPress={() => navigation.navigate('Chat')}
            />
          </>
        ) : null}
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
  riskValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  riskDesc: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: spacing.lg,
  },
});
