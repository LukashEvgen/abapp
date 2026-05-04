import {
  formatDate,
  formatDateTime,
  formatCurrency,
  statusColors,
  statusBgColors,
  initials,
  validatePhoneUA,
  validateCode,
  validateRequired,
  validateNumber,
} from '../utils/helpers';

describe('formatDate', () => {
  it('formats an ISO string', () => {
    const result = formatDate('2024-05-15');
    expect(result).toBe('15 трав. 2024');
  });

  it('formats a Date object', () => {
    const result = formatDate(new Date(2024, 4, 15));
    expect(result).toBe('15 трав. 2024');
  });

  it('formats a Firestore Timestamp-like object', () => {
    const ts = {toDate: () => new Date(2024, 4, 15)};
    const result = formatDate(ts);
    expect(result).toBe('15 трав. 2024');
  });

  it('returns empty string for null input', () => {
    expect(formatDate(null)).toBe('');
  });

  it('returns empty string for undefined input', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('returns empty string for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('');
  });

  it('uses custom pattern', () => {
    const result = formatDate('2024-05-15', 'yyyy-MM-dd');
    expect(result).toBe('2024-05-15');
  });
});

describe('formatDateTime', () => {
  it('formats with default pattern', () => {
    const result = formatDateTime('2024-05-15T14:30:00');
    expect(result).toBe('15 трав. 2024, 14:30');
  });

  it('returns empty string for null', () => {
    expect(formatDateTime(null)).toBe('');
  });
});

describe('formatCurrency', () => {
  it('formats a number with UK locale', () => {
    const result = formatCurrency(1234567.89);
    expect(result).toContain('1');
    expect(result).toContain('грн');
  });

  it('formats a numeric string', () => {
    const result = formatCurrency('50000');
    expect(result).toContain('50');
    expect(result).toContain('грн');
  });

  it('returns empty string for null', () => {
    expect(formatCurrency(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatCurrency(undefined)).toBe('');
  });
});

describe('statusColors', () => {
  it('contains expected keys matching V3 light palette', () => {
    expect(statusColors['Розглядається']).toBe('#2A8FA8');
    expect(statusColors.pending).toBe('#C28B3C');
    expect(statusColors.paid).toBe('#4A9B6E');
    expect(statusColors.critical).toBe('#B84545');
  });
});

describe('statusBgColors', () => {
  it('contains expected keys with rgba values matching V3', () => {
    expect(statusBgColors['Вирішено']).toBe('rgba(74,155,110,0.10)');
    expect(statusBgColors.high).toBe('rgba(184,69,69,0.10)');
  });
});

describe('initials', () => {
  it('returns ?? for empty input', () => {
    expect(initials('')).toBe('??');
  });

  it('returns ?? for null/undefined', () => {
    expect(initials(null)).toBe('??');
    expect(initials(undefined)).toBe('??');
  });

  it('returns first two letters for single name', () => {
    expect(initials('John')).toBe('JO');
  });

  it('returns first letters of two-part name', () => {
    expect(initials('John Doe')).toBe('JD');
  });

  it('handles extra whitespace', () => {
    expect(initials('  John   Doe  ')).toBe('JD');
  });

  it('trims trailing whitespace for single name', () => {
    expect(initials('John ')).toBe('JO');
  });
});

describe('validatePhoneUA', () => {
  it('returns error for empty phone', () => {
    expect(validatePhoneUA('')).toBe('Введіть номер телефону');
    expect(validatePhoneUA(null)).toBe('Введіть номер телефону');
    expect(validatePhoneUA(undefined)).toBe('Введіть номер телефону');
  });

  it('returns error for invalid format', () => {
    expect(validatePhoneUA('abc')).toBe('Невірний формат номера телефону');
    expect(validatePhoneUA('+380abc')).toBe('Невірний формат номера телефону');
    expect(validatePhoneUA('+38')).toBe('Невірний формат номера телефону');
  });

  it('returns null for valid phone', () => {
    expect(validatePhoneUA('+380501234567')).toBeNull();
    expect(validatePhoneUA('0501234567')).toBeNull();
    expect(validatePhoneUA('+38 050 123 45 67')).toBeNull();
  });
});

describe('validateCode', () => {
  it('returns error for empty code', () => {
    expect(validateCode('')).toBe('Введіть код з SMS');
    expect(validateCode(null)).toBe('Введіть код з SMS');
    expect(validateCode(undefined)).toBe('Введіть код з SMS');
  });

  it('returns error for non-numeric or wrong length', () => {
    expect(validateCode('123')).toBe('Код має містити від 4 до 8 цифр');
    expect(validateCode('123456789')).toBe('Код має містити від 4 до 8 цифр');
    expect(validateCode('12ab')).toBe('Код має містити від 4 до 8 цифр');
  });

  it('returns null for valid code', () => {
    expect(validateCode('1234')).toBeNull();
    expect(validateCode('12345678')).toBeNull();
    expect(validateCode(' 1234 ')).toBeNull();
  });
});

describe('validateRequired', () => {
  it('returns error for empty/null/undefined', () => {
    expect(validateRequired('', 'Назва')).toBe('Назва є обовʼязковим');
    expect(validateRequired(null, 'Сума')).toBe('Сума є обовʼязковим');
    expect(validateRequired(undefined, 'Поле')).toBe('Поле є обовʼязковим');
    expect(validateRequired('   ', 'Текст')).toBe('Текст є обовʼязковим');
  });

  it('returns null when value present', () => {
    expect(validateRequired('foo', 'Назва')).toBeNull();
    expect(validateRequired(0, 'Кількість')).toBeNull();
  });
});

describe('validateNumber', () => {
  it('returns error for empty or non-numeric', () => {
    expect(validateNumber('', 'Сума')).toBe('Сума є обовʼязковим');
    expect(validateNumber(null, 'Сума')).toBe('Сума є обовʼязковим');
    expect(validateNumber('abc', 'Сума')).toBe('Сума має бути додатнім числом');
    expect(validateNumber('-10', 'Сума')).toBe('Сума має бути додатнім числом');
    expect(validateNumber('0', 'Сума')).toBe('Сума має бути додатнім числом');
  });

  it('returns null for positive number', () => {
    expect(validateNumber('100', 'Сума')).toBeNull();
    expect(validateNumber('0.01', 'Сума')).toBeNull();
    expect(validateNumber(50, 'Сума')).toBeNull();
  });
});
