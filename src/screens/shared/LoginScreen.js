import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {colors, spacing, radius, globalStyles, tokens} from '../utils/theme';
import {validatePhoneUA, validateCode} from '../utils/helpers';
import {GoldButton} from '../components/shared/UIComponents';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const {loginWithPhone, confirmCode} = useAuth();

  const handleSendCode = async () => {
    setError(undefined);
    const phoneError = validatePhoneUA(phone);
    if (phoneError) {
      setError({field: 'phone', message: phoneError});
      return;
    }
    setLoading(true);
    try {
      await loginWithPhone(phone.trim());
      setStep('code');
    } catch (e) {
      const msg = e?.message || 'Не вдалося надіслати SMS';
      setError({field: 'phone', message: msg});
      Alert.alert('Помилка', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError(undefined);
    const codeError = validateCode(code);
    if (codeError) {
      setError({field: 'code', message: codeError});
      return;
    }
    setLoading(true);
    try {
      await confirmCode(code.trim());
    } catch (e) {
      const msg = e?.message || 'Невірний код';
      setError({field: 'code', message: msg});
      Alert.alert('Помилка', msg);
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

        {error?.message && (
          <Text style={styles.errorText}>{error.message}</Text>
        )}

        {step === 'phone' ? (
          <View
            style={[
              styles.inputWrap,
              error?.field === 'phone' && styles.inputError,
            ]}>
            <TextInput
              placeholder="+380..."
              placeholderTextColor={colors.muted}
              value={phone}
              onChangeText={text => {
                setPhone(text);
                if (error?.field === 'phone') setError(undefined);
              }}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>
        ) : (
          <View
            style={[
              styles.inputWrap,
              error?.field === 'code' && styles.inputError,
            ]}>
            <TextInput
              placeholder="Код"
              placeholderTextColor={colors.muted}
              value={code}
              onChangeText={text => {
                setCode(text);
                if (error?.field === 'code') setError(undefined);
              }}
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
    fontSize: tokens.typography.size['3xl'],
    fontWeight: tokens.typography.weight.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    color: colors.muted,
    fontSize: tokens.typography.size.base,
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
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    color: colors.text,
    fontSize: tokens.typography.size.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: tokens.typography.size.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
