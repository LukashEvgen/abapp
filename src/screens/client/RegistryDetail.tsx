import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
  tokens,
} from '../../utils/theme';
import {Card, SectionLabel} from '../../components/shared/UIComponents';

export default function RegistryDetail({route, navigation}) {
  const {type, data} = route.params || {};

  const renderEdr = () => (
    <>
      <SectionLabel text="Загальні відомості" />
      <Card>
        <Text style={styles.label}>Назва</Text>
        <Text style={styles.value}>{data.name}</Text>
        <Text style={styles.label}>Код (ЄДРПОУ / ІПН)</Text>
        <Text style={styles.value}>{data.code}</Text>
        <Text style={styles.label}>Тип</Text>
        <Text style={styles.value}>{data.type}</Text>
        <Text style={styles.label}>Статус</Text>
        <Text style={styles.value}>{data.status === 'active' ? 'Активний' : 'Неактивний'}</Text>
      </Card>
      <SectionLabel text="Адреса та керівництво" />
      <Card>
        <Text style={styles.label}>Адреса</Text>
        <Text style={styles.value}>{data.address || '—'}</Text>
        <Text style={styles.label}>Керівник</Text>
        <Text style={styles.value}>{data.ceo || '—'}</Text>
      </Card>
    </>
  );

  const renderCourt = () => (
    <>
      <SectionLabel text="Судове рішення" />
      <Card>
        <Text style={styles.label}>Номер справи</Text>
        <Text style={styles.value}>{data.number}</Text>
        <Text style={styles.label}>Дата</Text>
        <Text style={styles.value}>{data.date || '—'}</Text>
        <Text style={styles.label}>Суд</Text>
        <Text style={styles.value}>{data.court}</Text>
        <Text style={styles.label}>Тип рішення</Text>
        <Text style={styles.value}>{data.type}</Text>
      </Card>
      <SectionLabel text="Сторони та предмет" />
      <Card>
        <Text style={styles.label}>Предмет</Text>
        <Text style={styles.value}>{data.subject || '—'}</Text>
        <Text style={styles.label}>Сторони</Text>
        <Text style={styles.value}>{data.parties || '—'}</Text>
      </Card>
      {data.link ? (
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => Linking.openURL(data.link)}>
          <Text style={styles.linkText}>Відкрити на court.gov.ua ↗</Text>
        </TouchableOpacity>
      ) : null}
    </>
  );

  const renderEnforcement = () => (
    <>
      <SectionLabel text="Виконавче провадження" />
      <Card>
        <Text style={styles.label}>Номер</Text>
        <Text style={styles.value}>№ {data.number}</Text>
        <Text style={styles.label}>Статус</Text>
        <Text style={styles.value}>{data.status}</Text>
        <Text style={styles.label}>Відділ ДВС</Text>
        <Text style={styles.value}>{data.department || '—'}</Text>
      </Card>
      <SectionLabel text="Сторони" />
      <Card>
        <Text style={styles.label}>Боржник</Text>
        <Text style={styles.value}>{data.debtor} {data.debtorCode ? `(${data.debtorCode})` : ''}</Text>
        <Text style={styles.label}>Стягувач</Text>
        <Text style={styles.value}>{data.collector}</Text>
      </Card>
      <SectionLabel text="Предмет виконання" />
      <Card>
        <Text style={styles.label}>Предмет</Text>
        <Text style={styles.value}>{data.subject || '—'}</Text>
        <Text style={styles.label}>Сума</Text>
        <Text style={styles.value}>{data.amount || '—'}</Text>
        <Text style={styles.label}>Дата відкриття</Text>
        <Text style={styles.value}>{data.dateOpen || '—'}</Text>
        {data.dateClose ? <>
          <Text style={styles.label}>Дата закриття</Text>
          <Text style={styles.value}>{data.dateClose}</Text>
        </> : null}
      </Card>
    </>
  );

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.screen}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Назад</Text>
        </TouchableOpacity>
        {type === 'edr' && renderEdr()}
        {type === 'court' && renderCourt()}
        {type === 'enforcement' && renderEnforcement()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  back: {
    color: colors.gold,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  linkButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  linkText: {
    color: colors.bg,
    fontWeight: tokens.typography.weight.bold,
    fontSize: tokens.typography.size.base,
  },
});
