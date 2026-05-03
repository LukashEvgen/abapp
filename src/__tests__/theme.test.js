import {
  colors,
  spacing,
  radius,
  typography,
  globalStyles,
  tokens,
  shadows,
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

    it('exposes Palette V2 primary, info, and semantic keys', () => {
      expect(colors.primary).toBe('#41A9A5');
      expect(colors.info).toBe('#4696DC');
      expect(colors.danger).toBe('#DC4B4B');
      expect(colors.warning).toBe('#E6A03C');
      expect(colors.success).toBe('#3CB46E');
    });

    it('exposes V2 nested palettes (brand, semantic, neutral)', () => {
      expect(typeof colors.brand).toBe('object');
      expect(colors.brand.primary).toBe('#41A9A5');
      expect(typeof colors.semantic).toBe('object');
      expect(colors.semantic.info).toBe('#4696DC');
      // neutral surface bg
      expect(colors.surfaceSemantic.bg).toBe('#0A0D0E');
    });

    it('legacy flat keys map to correct V2 tokens (regression)', () => {
      expect(colors.bg).toBe(tokens.colors.surface.bg);
      expect(colors.surface).toBe(tokens.colors.surface.base);
      expect(colors.card).toBe(tokens.colors.surface.raised);
      expect(colors.border).toBe(tokens.colors.border.subtle);
      expect(colors.primary).toBe(tokens.colors.brand.primary);
      expect(colors.gold).toBe(tokens.colors.brand.primary);
      expect(colors.green).toBe(tokens.colors.brand.primaryDark);
      expect(colors.danger).toBe(tokens.colors.semantic.danger);
      expect(colors.warning).toBe(tokens.colors.semantic.warning);
      expect(colors.success).toBe(tokens.colors.semantic.success);
      expect(colors.info).toBe(tokens.colors.semantic.info);
      expect(colors.text).toBe(tokens.colors.text.primary);
      expect(colors.muted).toBe(tokens.colors.text.secondary);
    });

    it('nested semantic palette includes all V2 keys', () => {
      expect(colors.semantic.success).toBe('#3CB46E');
      expect(colors.semantic.successLight).toBe('#6ED296');
      expect(colors.semantic.successDark).toBe('#2E7A50');
      expect(colors.semantic.successBg).toBe('rgba(60,180,110,0.14)');
      expect(colors.semantic.warning).toBe('#E6A03C');
      expect(colors.semantic.warningLight).toBe('#F5BE64');
      expect(colors.semantic.warningDark).toBe('#B07828');
      expect(colors.semantic.warningBg).toBe('rgba(230,160,60,0.14)');
      expect(colors.semantic.danger).toBe('#DC4B4B');
      expect(colors.semantic.dangerLight).toBe('#F07878');
      expect(colors.semantic.dangerDark).toBe('#A83232');
      expect(colors.semantic.dangerBg).toBe('rgba(220,75,75,0.14)');
      expect(colors.semantic.info).toBe('#4696DC');
      expect(colors.semantic.infoLight).toBe('#82B9EB');
      expect(colors.semantic.infoDark).toBe('#346DA3');
      expect(colors.semantic.infoBg).toBe('rgba(70,150,220,0.14)');
    });

    it('neutral palette contains expected scale keys', () => {
      expect(colors.neutral['0']).toBe('#FFFFFF');
      expect(colors.neutral['50']).toBe('#F0F1F2');
      expect(colors.neutral['300']).toBe('#8A9496');
      expect(colors.neutral['500']).toBe('#505C5E');
      expect(colors.neutral['1000']).toBe('#0A0D0E');
    });

    it('surface semantic palette matches token values', () => {
      expect(colors.surfaceSemantic.bg).toBe('#0A0D0E');
      expect(colors.surfaceSemantic.base).toBe('#101314');
      expect(colors.surfaceSemantic.raised).toBe('#161A1B');
      expect(colors.surfaceSemantic.inverse).toBe('#F0F1F2');
    });

    it('border semantic palette matches token values', () => {
      expect(colors.borderSemantic.subtle).toBe('#1E2324');
      expect(colors.borderSemantic.default).toBe('#2A3132');
      expect(colors.borderSemantic.strong).toBe('#3D4648');
    });

    it('text semantic palette matches token values', () => {
      expect(colors.textSemantic.primary).toBe('#F0F1F2');
      expect(colors.textSemantic.secondary).toBe('#8A9496');
      expect(colors.textSemantic.disabled).toBe('#505C5E');
      expect(colors.textSemantic.accent).toBe('#41A9A5');
      expect(colors.textSemantic.link).toBe('#82B9EB');
    });

    it('all flat color values are valid hex or rgba strings', () => {
      const flatLegacy = Object.values(colors).filter(
        v => typeof v === 'string',
      );
      flatLegacy.forEach(c => {
        expect(c).toMatch(/^(#[0-9A-Fa-f]{3,8}|rgba?\(.*\))$/);
      });
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

    it('spacing aliases match token scale', () => {
      expect(spacing.xs).toBe(tokens.spacing.alias.xs);
      expect(spacing.sm).toBe(tokens.spacing.alias.sm);
      expect(spacing.md).toBe(tokens.spacing.alias.md);
      expect(spacing.lg).toBe(tokens.spacing.alias.lg);
      expect(spacing.xl).toBe(tokens.spacing.alias.xl);
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

    it('radius values match token scale', () => {
      expect(radius.sm).toBe(tokens.radius.sm);
      expect(radius.md).toBe(tokens.radius.md);
      expect(radius.lg).toBe(tokens.radius.lg);
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

    it('font sizes use token scale', () => {
      expect(typography.h1.fontSize).toBe(tokens.typography.size['2xl']);
      expect(typography.h2.fontSize).toBe(tokens.typography.size.xl);
      expect(typography.h3.fontSize).toBe(tokens.typography.size.lg);
      expect(typography.body.fontSize).toBe(tokens.typography.size.base);
      expect(typography.caption.fontSize).toBe(tokens.typography.size.sm);
      expect(typography.label.fontSize).toBe(tokens.typography.size.xs);
    });

    it('font weights use token scale', () => {
      expect(typography.h1.fontWeight).toBe('700');
      expect(typography.h2.fontWeight).toBe('600');
      expect(typography.h3.fontWeight).toBe('600');
      expect(typography.body.fontWeight).toBe('400');
      expect(typography.caption.fontWeight).toBe('400');
      expect(typography.label.fontWeight).toBe('600');
    });
  });

  describe('shadows', () => {
    it('contains V2 token shadow keys', () => {
      expect(Object.keys(shadows)).toEqual(
        expect.arrayContaining(['0', '1', '2', '3']),
      );
    });

    it('each shadow defines both ios and android keys', () => {
      Object.values(shadows).forEach(s => {
        expect(s).toHaveProperty('ios');
        expect(s).toHaveProperty('android');
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

    it('globalStyles uses theme colors (regression)', () => {
      expect(globalStyles.container.backgroundColor).toBe(colors.bg);
      expect(globalStyles.screen.backgroundColor).toBe(colors.bg);
      expect(globalStyles.card.backgroundColor).toBe(colors.card);
      expect(globalStyles.card.borderColor).toBe(colors.border);
      expect(globalStyles.text.color).toBe(colors.text);
      expect(globalStyles.mutedText.color).toBe(colors.muted);
      expect(globalStyles.goldText.color).toBe(colors.gold);
    });
  });

  describe('tokens', () => {
    it('exposes raw token object', () => {
      expect(typeof tokens).toBe('object');
      expect(tokens.meta.version).toBe('2.0.0');
    });

    it('token color scheme is dark', () => {
      expect(tokens.meta.colorScheme).toBe('dark');
    });
  });
});
