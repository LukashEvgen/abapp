import {format, parseISO} from 'date-fns';
import {uk} from 'date-fns/locale';
import {colors} from './theme';

export const formatDate = (dateInput, pattern = 'dd MMM yyyy') => {
  if (!dateInput) {
    return '';
  }
  try {
    const date =
      typeof dateInput === 'string'
        ? parseISO(dateInput)
        : dateInput.toDate
        ? dateInput.toDate()
        : new Date(dateInput);
    return format(date, pattern, {locale: uk});
  } catch {
    return '';
  }
};

export const formatDateTime = dateInput => {
  return formatDate(dateInput, 'dd MMM yyyy, HH:mm');
};

export const formatCurrency = amount => {
  if (amount == null) {
    return '';
  }
  return `${Number(amount).toLocaleString('uk-UA')} грн`;
};

export const statusColors = {
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

export const statusBgColors = {
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

export const initials = fullName => {
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

export const validatePhoneUA = phone => {
  const clean = (phone || '').replace(/\s+/g, '');
  if (!clean) {
    return 'Введіть номер телефону';
  }
  if (!/^\+?\d{10,15}$/.test(clean)) {
    return 'Невірний формат номера телефону';
  }
  return null;
};

export const validateCode = code => {
  const trimmed = (code || '').trim();
  if (!trimmed) {
    return 'Введіть код з SMS';
  }
  if (!/^\d{4,8}$/.test(trimmed)) {
    return 'Код має містити від 4 до 8 цифр';
  }
  return null;
};

export const validateRequired = (value, label) => {
  if (value === null || value === undefined) {
    return `${label} є обовʼязковим`;
  }
  if (String(value).trim() === '') {
    return `${label} є обовʼязковим`;
  }
  return null;
};

export const validateNumber = (value, label) => {
  if (!value || !String(value).trim()) {
    return `${label} є обовʼязковим`;
  }
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0) {
    return `${label} має бути додатнім числом`;
  }
  return null;
};
