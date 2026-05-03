import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from 'react-native';
import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
} from '../../utils/theme';
import {
  Card,
  SectionLabel,
  GoldButton,
  Input,
} from '../../components/shared/UIComponents';
import {submitInquiry} from '../../services/inquiries';

const SERVICES = [
  {
    icon: '⚖️',
    title: 'Судовий супровід',
    desc: 'Повний цикл представництва в суді',
  },
  {
    icon: '📋',
    title: 'Консультації',
    desc: 'Усні та письмові правові висновки',
  },
  {
    icon: '🏢',
    title: 'Реєстрація бізнесу',
    desc: 'Відкриття ФОП/ТОВ, зміни, ліквідація',
  },
  {
    icon: '📑',
    title: 'Договірна робота',
    desc: 'Розробка та експертиза договорів',
  },
  {
    icon: '🔍',
    title: 'Due Diligence',
    desc: 'Перевірка контрагентів та активів',
  },
  {
    icon: '🛡️',
    title: 'Захист бізнесу',
    desc: 'Антирейдерська підтримка, скарги',
  },
];

export default function BureauScreen({navigation}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!form.name.trim() || !form.message.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      await submitInquiry({...form, source: 'app'});
      setSubmitted(true);
      setForm({name: '', email: '', phone: '', message: ''});
    } catch (e) {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{padding: spacing.md}}>
      <Text style={styles.header}>Юридичне бюро</Text>

      <Card>
        <Text style={styles.bureauName}>LexTrack Legal</Text>
        <Text style={styles.bureauMeta}>
          м. Київ, вул. Хрещатик, 15, оф. 42
        </Text>
        <Text style={styles.bureauMeta}>Пн–Пт: 09:00 – 18:00</Text>
        <TouchableOpacity onPress={() => Linking.openURL('tel:+380441234567')}>
          <Text style={styles.bureauLink}>+38 (044) 123-45-67</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openURL('mailto:info@lextrack.ua')}>
          <Text style={styles.bureauLink}>info@lextrack.ua</Text>
        </TouchableOpacity>
      </Card>

      <SectionLabel text="Послуги" />
      <View style={styles.servicesGrid}>
        {SERVICES.map(s => (
          <View key={s.title} style={styles.serviceCard}>
            <Text style={styles.serviceIcon}>{s.icon}</Text>
            <Text style={styles.serviceTitle}>{s.title}</Text>
            <Text style={styles.serviceDesc}>{s.desc}</Text>
          </View>
        ))}
      </View>

      <SectionLabel text="Зв’язатися з бюро" />
      {submitted ? (
        <Card>
          <Text style={styles.successTitle}>✅ Дякуємо!</Text>
          <Text style={styles.successText}>
            Ваше звернення прийнято. Ми зв’яжемося з вами найближчим часом.
          </Text>
          <View style={{height: spacing.sm}} />
          <GoldButton
            title="Надіслати ще"
            variant="ghost"
            size="small"
            onPress={() => setSubmitted(false)}
          />
        </Card>
      ) : (
        <>
          <Input
            placeholder="Ваше ім’я"
            value={form.name}
            onChangeText={t => setForm(f => ({...f, name: t}))}
          />
          <Input
            placeholder="Email"
            value={form.email}
            onChangeText={t => setForm(f => ({...f, email: t}))}
          />
          <Input
            placeholder="Телефон"
            value={form.phone}
            onChangeText={t => setForm(f => ({...f, phone: t}))}
          />
          <Input
            placeholder="Повідомлення"
            value={form.message}
            onChangeText={t => setForm(f => ({...f, message: t}))}
            multiline
            numberOfLines={4}
          />
          <GoldButton
            title={submitting ? 'Надсилання...' : 'Надіслати звернення'}
            onPress={onSubmit}
            disabled={submitting || !form.name.trim() || !form.message.trim()}
          />
        </>
      )}

      <View style={{height: spacing.lg}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  bureauName: {
    color: colors.gold,
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.bold,
    marginBottom: spacing.sm,
  },
  bureauMeta: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    marginBottom: spacing.xs,
  },
  bureauLink: {
    color: colors.gold,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
    marginTop: spacing.xs,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  serviceIcon: {
    fontSize: tokens.typography.size['2xl'],
    marginBottom: spacing.sm,
  },
  serviceTitle: {
    color: colors.text,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  serviceDesc: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    lineHeight: tokens.typography.size.sm * tokens.typography.lineHeight.normal,
  },
  successTitle: {
    color: colors.success,
    fontSize: tokens.typography.size.md,
    fontWeight: tokens.typography.weight.bold,
    marginBottom: spacing.sm,
  },
  successText: {
    color: colors.text,
    fontSize: tokens.typography.size.base,
    lineHeight: tokens.typography.size.base * tokens.typography.lineHeight.normal,
  },
});
