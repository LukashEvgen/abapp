import {format, parseISO} from 'date-fns';
import {uk} from 'date-fns/locale';
import {colors} from './theme';

export const formatDate = (
  dateInput: string | number | Date | null | undefined | {toDate(): Date},
  pattern = 'dd MMM yyyy',
): string => {
  if (!dateInput) {
    return '';
  }
  try {
    const date =
      typeof dateInput === 'string'
        ? parseISO(dateInput)
        : 'toDate' in dateInput && typeof dateInput.toDate === 'function'
        ? dateInput.toDate()
        : new Date(dateInput as number | Date);
    return format(date, pattern, {locale: uk});
  } catch {
    return '';
  }
};

export const formatDateTime = (
  dateInput: Parameters<typeof formatDate>[0],
): string => {
  return formatDate(dateInput, 'dd MMM yyyy, HH:mm');
};

export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount == null) {
    return '';
  }
  return `${Number(amount).toLocaleString('uk-UA')} грн`;
};

export const statusColors: Record<string, string> = {
  Розглядається: colors.gold,
  'Очікує рішення': colors.warning,
  Вирішено: colors.success,
  pending: colors.warning,
  paid: colors.success,
  new: colors.gold,
  low: colors.success,
  medium: colors.warning,
  high: colors.danger,
  critical: colors.danger,
};

export const statusBgColors: Record<string, string> = {
  Розглядається: colors.brand.primaryMuted,
  'Очікує рішення': colors.semantic.warningBg,
  Вирішено: colors.semantic.successBg,
  pending: colors.semantic.warningBg,
  paid: colors.semantic.successBg,
  new: colors.brand.primaryMuted,
  low: colors.semantic.successBg,
  medium: colors.semantic.warningBg,
  high: colors.semantic.dangerBg,
  critical: colors.semantic.dangerBg,
};

export const initials = (fullName: string | null | undefined): string => {
  if (!fullName) {
    return '??';
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
};

// --- Validation helpers ---

export const validatePhoneUA = (phone: string | null | undefined): string | null => {
  const clean = (phone || '').replace(/\s+/g, '');
  if (!clean) {
    return 'Введіть номер телефону';
  }
  if (!/^\+?\d{10,15}$/.test(clean)) {
    return 'Невірний формат номера телефону';
  }
  return null;
};

export const validateCode = (code: string | null | undefined): string | null => {
  const trimmed = (code || '').trim();
  if (!trimmed) {
    return 'Введіть код з SMS';
  }
  if (!/^\d{4,8}$/.test(trimmed)) {
    return 'Код має містити від 4 до 8 цифр';
  }
  return null;
};

export const validateRequired = (value: unknown, label: string): string | null => {
  if (value === null || value === undefined) {
    return `${label} є обовʼязковим`;
  }
  if (String(value).trim() === '') {
    return `${label} є обовʼязковим`;
  }
  return null;
};

export const validateNumber = (value: unknown, label: string): string | null => {
  if (!value || !String(value).trim()) {
    return `${label} є обовʼязковим`;
  }
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0) {
    return `${label} має бути додатнім числом`;
  }
  return null;
};
