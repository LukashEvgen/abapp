import React, {useState} from 'react';
import {View, Text, TextInput, Alert, StyleSheet, KeyboardAvoidingView, Platform} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {colors, spacing, radius, globalStyles} from '../utils/theme';
import {GoldButton} from '../components/shared/UIComponents';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const {loginWithPhone, confirmCode} = useAuth();

  const handleSendCode = async () => {
    if (!phone.trim()) {
      Alert.alert('Помилка', 'Введіть номер телефону');
      return;
    }
    setLoading(true);
    try {
      await loginWithPhone(phone.trim());
      setStep('code');
    } catch (e) {
      Alert.alert('Помилка', e.message || 'Не вдалося надіслати SMS');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      Alert.alert('Помилка', 'Введіть код з SMS');
      return;
    }
    setLoading(true);
    try {
      await confirmCode(code.trim());
    } catch (e) {
      Alert.alert('Помилка', e.message || 'Невірний код');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={globalStyles.container}>
      <View style={[globalStyles.screen, {justifyContent: 'center'}]}>
        <Text style={styles.logo}>⚖ LexTrack</Text>
        <Text style={styles.subtitle}>
          {step === 'phone'
            ? 'Введіть номер телефону для входу'
            : 'Введіть код з SMS'}
        </Text>

        {step === 'phone' ? (
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="+380..."
              placeholderTextColor={colors.muted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>
        ) : (
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Код"
              placeholderTextColor={colors.muted}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        )}

        <GoldButton
          title={step === 'phone' ? 'Надіслати код' : 'Підтвердити'}
          onPress={step === 'phone' ? handleSendCode : handleVerify}
          loading={loading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  logo: {
    color: colors.gold,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  inputWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    color: colors.text,
    fontSize: 16,
  },
});
