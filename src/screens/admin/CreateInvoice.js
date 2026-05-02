import React, {useState} from 'react';
import {View, Text, TextInput, StyleSheet, ScrollView, Alert} from 'react-native';
import {createInvoice} from '../../services/firebase';
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

export default function CreateInvoice({route, navigation}) {
  const {clientId} = route.params;
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [number, setNumber] = useState('');
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

      <SectionLabel text="Номер рахунку (необов’язково)" />
      <View style={styles.inputWrap}>
        <TextInput
          placeholder="№..."
          placeholderTextColor={colors.muted}
          value={number}
          onChangeText={setNumber}
          style={styles.input}
        />
      </View>

      <GoldButton
        title={saving ? 'Збереження...' : 'Виставити рахунок'}
        onPress={handleSave}
        loading={saving}
        disabled={!title.trim() || !amount.trim()}
      />
    </ScrollView>
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
  input: {color: colors.text, fontSize: 14},
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  errorGeneral: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
