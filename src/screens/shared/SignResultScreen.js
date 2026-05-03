import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
  tokens,
} from '../../utils/theme';
import {GoldButton} from '../../components/shared/UIComponents';

export default function SignResultScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const {success, signature, reason} = route.params || {};

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
      }}>
      <Text style={styles.icon}>{success ? '✅' : '❌'}</Text>
      <Text style={styles.title}>
        {success ? 'Документ підписано КЕП' : 'Підпис не виконано'}
      </Text>
      <Text style={styles.subtitle}>
        {success
          ? 'Електронний підпис успішно накладено через Дія.Підпис'
          : reason || 'Сталася помилка під час підписання'}
      </Text>

      {success && signature && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Деталі підпису</Text>
          <DetailRow label="Тип" value={signature.signatureType || 'QES'} />
          <DetailRow label="Підписант" value={signature.signerName || '—'} />
          <DetailRow
            label="Ідентифікатор"
            value={signature.signerIdentifier || '—'}
          />
          <DetailRow
            label="Хеш"
            value={(signature.signatureHash || '').substring(0, 24) + '...'}
          />
        </View>
      )}

      <View style={styles.actions}>
        <GoldButton
          title="Готово"
          onPress={() =>
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.navigate('AdminRoot')
          }
        />
      </View>
    </ScrollView>
  );
}

function DetailRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: tokens.typography.size['3xl'],
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.muted,
    fontSize: tokens.typography.size.base,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    color: colors.gold,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.bold,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
  },
  value: {
    color: colors.text,
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.sm,
  },
  actions: {
    width: '100%',
    marginTop: spacing.lg,
  },
});
