import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {createInvoice} from '../../services/firebase';
import {colors, spacing, radius, typography, globalStyles} from '../../utils/theme';
import {GoldButton, Card, SectionLabel} from '../../components/shared/UIComponents';

export default function CreateInvoice({route, navigation}) {
  const {clientId} = route.params;
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [number, setNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !amount.trim()) return;
    setSaving(true);
    try {
      await createInvoice(clientId, {
        title: title.trim(),
        amount: Number(amount),
        number: number.trim() || undefined,
      });
      navigation.goBack();
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={{padding: spacing.md}}>
      <Text style={styles.header}>Новий рахунок</Text>

      <SectionLabel text="Назва послуги" />
      <View style={styles.inputWrap}>
        <TextInput
          placeholder="Наприклад: Консультація..."
          placeholderTextColor={colors.muted}
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
      </View>

      <SectionLabel text="Сума (грн)" />
      <View style={styles.inputWrap}>
        <TextInput
          placeholder="0.00"
          placeholderTextColor={colors.muted}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          style={styles.input}
        />
      </View>

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

      <GoldButton title={saving ? 'Збереження...' : 'Виставити рахунок'} onPress={handleSave} loading={saving} disabled={!title.trim() || !amount.trim()} />
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
    marginBottom: spacing.md,
  },
  input: {color: colors.text, fontSize: 14},
});
