import React, {useState} from 'react';
import {View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity} from 'react-native';
import {createInvoice} from '../../services/invoices';
import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
} from '../../utils/theme';
import {validateRequired, validateNumber} from '../../utils/helpers';
import {
  GoldButton,
  Card,
  SectionLabel,
} from '../../components/shared/UIComponents';
import SensitiveScreenGuard from '../../components/SensitiveScreenGuard';

export default function CreateInvoice({route, navigation}) {
  const {clientId} = route.params;
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [number, setNumber] = useState('');
  const [gateway, setGateway] = useState('none'); // 'none' | 'liqpay' | 'wayforpay'
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    const titleError = validateRequired(title, 'Назва послуги');
    if (titleError) next.title = titleError;
    const amountError = validateNumber(amount, 'Сума');
    if (amountError) next.amount = amountError;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await createInvoice(clientId, {
        title: title.trim(),
        amount: Number(amount),
        number: number.trim() || undefined,
        gateway: gateway === 'none' ? undefined : gateway,
      });
      navigation.goBack();
    } catch (e) {
      const msg = e?.message || 'Не вдалося створити рахунок';
      setErrors({general: msg});
      Alert.alert('Помилка', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SensitiveScreenGuard>
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{padding: spacing.md}}>
      <Text style={styles.header}>Новий рахунок</Text>

      {errors.general && (
        <Text style={styles.errorGeneral}>{errors.general}</Text>
      )}

      <SectionLabel text="Назва послуги" />
      <View
        style={[
          styles.inputWrap,
          errors.title && styles.inputError,
        ]}>
        <TextInput
          placeholder="Наприклад: Консультація..."
          placeholderTextColor={colors.muted}
          value={title}
          onChangeText={text => {
            setTitle(text);
            if (errors.title) setErrors(prev => ({...prev, title: undefined}));
          }}
          style={styles.input}
        />
      </View>
      {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

      <SectionLabel text="Сума (грн)" />
      <View
        style={[
          styles.inputWrap,
          errors.amount && styles.inputError,
        ]}>
        <TextInput
          placeholder="0.00"
          placeholderTextColor={colors.muted}
          value={amount}
          onChangeText={text => {
            setAmount(text);
            if (errors.amount) setErrors(prev => ({...prev, amount: undefined}));
          }}
          keyboardType="decimal-pad"
          style={styles.input}
        />
      </View>
      {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

      <SectionLabel text="Номер рахунку (необовʼязково)" />
      <View style={styles.inputWrap}>
        <TextInput
          placeholder="№..."
          placeholderTextColor={colors.muted}
          value={number}
          onChangeText={setNumber}
          style={styles.input}
        />
      </View>

      <SectionLabel text="Платіжний шлюз" />
      <View style={styles.gatewayRow}>
        {[{key: 'none', label: 'Не вказано'}, {key: 'liqpay', label: 'LiqPay'}, {key: 'wayforpay', label: 'WayForPay'}].map(g => (
          <TouchableOpacity
            key={g.key}
            onPress={() => setGateway(g.key)}
            style={[
              styles.gatewayChip,
              gateway === g.key && styles.gatewayChipActive,
            ]}>
            <Text
              style={[
                styles.gatewayChipText,
                gateway === g.key && styles.gatewayChipTextActive,
              ]}>
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <GoldButton
        title={saving ? 'Збереження...' : 'Виставити рахунок'}
        onPress={handleSave}
        loading={saving}
        disabled={!title.trim() || !amount.trim()}
      />
    </ScrollView>
    </SensitiveScreenGuard>
  );
}

const styles = StyleSheet.create({
  header: {...typography.h1, marginBottom: spacing.md},
  inputWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {color: colors.text, fontSize: tokens.typography.size.base},
  errorText: {
    color: colors.danger,
    fontSize: tokens.typography.size.sm,
    marginBottom: spacing.md,
  },
  errorGeneral: {
    color: colors.danger,
    fontSize: tokens.typography.size.base,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  gatewayRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  gatewayChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  gatewayChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  gatewayChipText: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
  },
  gatewayChipTextActive: {
    color: colors.bg,
  },
});
