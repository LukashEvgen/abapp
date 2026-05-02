import {format, parseISO} from 'date-fns';
import {uk} from 'date-fns/locale';

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
  Розглядається: '#C9A84C',
  'Очікує рішення': '#D4831A',
  Вирішено: '#27AE60',
  pending: '#D4831A',
  paid: '#27AE60',
  new: '#C9A84C',
  low: '#27AE60',
  medium: '#D4831A',
  high: '#C0392B',
  critical: '#C0392B',
};

export const statusBgColors = {
  Розглядається: 'rgba(201,168,76,0.15)',
  'Очікує рішення': 'rgba(212,131,26,0.15)',
  Вирішено: 'rgba(39,174,96,0.15)',
  pending: 'rgba(212,131,26,0.15)',
  paid: 'rgba(39,174,96,0.15)',
  new: 'rgba(201,168,76,0.15)',
  low: 'rgba(39,174,96,0.15)',
  medium: 'rgba(212,131,26,0.15)',
  high: 'rgba(192,57,43,0.15)',
  critical: 'rgba(192,57,43,0.15)',
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
  if (!value || !String(value).trim()) {
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
