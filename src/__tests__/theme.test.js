import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
} from '../utils/theme';

describe('theme', () => {
  describe('colors', () => {
    it('is an object with expected keys', () => {
      expect(typeof colors).toBe('object');
      expect(Object.keys(colors)).toEqual(
        expect.arrayContaining([
          'bg',
          'surface',
          'card',
          'border',
          'gold',
          'green',
          'danger',
          'warning',
          'success',
          'text',
          'muted',
        ]),
      );
    });

    it('values are non-empty strings starting with #', () => {
      Object.values(colors).every(c => expect(typeof c).toBe('string'));
      expect(colors.bg).toMatch(/^#/);
      expect(colors.gold).toMatch(/^#/);
      expect(colors.text).toMatch(/^#/);
    });
  });

  describe('spacing', () => {
    it('is an object with expected keys', () => {
      expect(typeof spacing).toBe('object');
      expect(Object.keys(spacing)).toEqual(
        expect.arrayContaining(['xs', 'sm', 'md', 'lg', 'xl']),
      );
    });

    it('values are positive numbers', () => {
      Object.values(spacing).forEach(v => {
        expect(typeof v).toBe('number');
        expect(v).toBeGreaterThan(0);
      });
    });
  });

  describe('radius', () => {
    it('is an object with expected keys', () => {
      expect(typeof radius).toBe('object');
      expect(Object.keys(radius)).toEqual(
        expect.arrayContaining(['sm', 'md', 'lg']),
      );
    });

    it('values are numbers', () => {
      Object.values(radius).forEach(v => {
        expect(typeof v).toBe('number');
      });
    });
  });

  describe('typography', () => {
    it('is an object with expected keys', () => {
      expect(typeof typography).toBe('object');
      expect(Object.keys(typography)).toEqual(
        expect.arrayContaining(['h1', 'h2', 'h3', 'body', 'caption', 'label']),
      );
    });

    it('each typography entry has fontSize and color', () => {
      Object.values(typography).forEach(style => {
        expect(style).toHaveProperty('fontSize');
        expect(style).toHaveProperty('color');
      });
    });
  });

  describe('globalStyles', () => {
    it('is a StyleSheet object with expected keys', () => {
      expect(typeof globalStyles).toBe('object');
      expect(Object.keys(globalStyles)).toEqual(
        expect.arrayContaining([
          'container',
          'screen',
          'card',
          'row',
          'rowBetween',
          'center',
          'text',
          'mutedText',
          'goldText',
        ]),
      );
    });
  });
});
