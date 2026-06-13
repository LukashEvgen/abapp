import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {colors, spacing, radius, tokens, typography} from '../../utils/theme.js';
import {
  Badge,
  GoldButton,
  Card,
  AlertBanner,
  SectionLabel,
  Input,
  ProgressBar,
  Avatar,
  EmptyState,
} from '../shared/UIComponents';

/**
 * Palette V3 Visual Regression Screen
 *
 * Renders every V3 color in every supported UI context.
 * Intended for snapshot tests and manual QA preview.
 */
export default function PaletteV2RegressionScreen() {
  return (
    <ScrollView style={styles.container} testID="palette-v2-regression-screen">
      {/* Brand Swatches */}
      <Text style={styles.heading}>Brand</Text>
      <View style={styles.row}>
        <ColorSwatch name="primary" color={colors.brand.primary} />
        <ColorSwatch name="primaryLight" color={colors.brand.primaryLight} />
        <ColorSwatch name="primaryDark" color={colors.brand.primaryDark} />
      </View>

      {/* Semantic Swatches */}
      <Text style={styles.heading}>Semantic</Text>
      <View style={styles.row}>
        <ColorSwatch name="danger" color={colors.semantic.danger} />
        <ColorSwatch name="warning" color={colors.semantic.warning} />
        <ColorSwatch name="success" color={colors.semantic.success} />
        <ColorSwatch name="info" color={colors.semantic.info} />
      </View>

      {/* Neutral Scale */}
      <Text style={styles.heading}>Neutral Scale</Text>
      {['0', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000'].map(key => (
        <View key={key} style={styles.neutralRow}>
          <Text style={styles.neutralLabel}>neutral.{key}</Text>
          <View
            style={[
              styles.neutralSwatch,
              {backgroundColor: colors.neutral[key]},
            ]}
          />
        </View>
      ))}

      {/* Surface / Border / Text semantic */}
      <Text style={styles.heading}>Surface</Text>
      <View style={styles.row}>
        <ColorSwatch name="bg" color={colors.surfaceSemantic.bg} />
        <ColorSwatch name="base" color={colors.surfaceSemantic.base} />
        <ColorSwatch name="raised" color={colors.surfaceSemantic.raised} />
      </View>

      <Text style={styles.heading}>Border</Text>
      <View style={styles.row}>
        <ColorSwatch name="subtle" color={colors.borderSemantic.subtle} />
        <ColorSwatch name="default" color={colors.borderSemantic.default} />
        <ColorSwatch name="strong" color={colors.borderSemantic.strong} />
      </View>

      <Text style={styles.heading}>Text</Text>
      <View style={styles.row}>
        <ColorSwatch name="primary" color={colors.textSemantic.primary} />
        <ColorSwatch name="secondary" color={colors.textSemantic.secondary} />
        <ColorSwatch name="disabled" color={colors.textSemantic.disabled} />
        <ColorSwatch name="accent" color={colors.textSemantic.accent} />
        <ColorSwatch name="link" color={colors.textSemantic.link} />
      </View>

      {/* Legacy flat keys */}
      <Text style={styles.heading}>Legacy Flat Keys</Text>
      <View style={styles.row}>
        {[
          'bg',
          'surface',
          'card',
          'border',
          'primary',
          'gold',
          'green',
          'danger',
          'warning',
          'success',
          'info',
          'text',
          'muted',
        ].map(key => (
          <ColorSwatch key={key} name={key} color={colors[key]} />
        ))}
      </View>

      {/* UI Components — every variant that uses color */}
      <Text style={styles.heading}>UI Components</Text>

      <SectionLabel text="Badges" />
      <View style={styles.row}>
        <Badge status="danger" />
        <Badge status="warning" />
        <Badge status="success" />
        <Badge status="info" />
      </View>

      <SectionLabel text="Buttons" />
      <View style={styles.row}>
        <GoldButton title="Filled" onPress={() => {}} />
        <GoldButton title="Ghost" variant="ghost" onPress={() => {}} />
        <GoldButton title="Disabled" disabled onPress={() => {}} />
        <GoldButton title="Small" size="small" onPress={() => {}} />
      </View>

      <SectionLabel text="Alert Banners" />
      <AlertBanner type="danger" text="Error banner" />
      <AlertBanner type="warning" text="Warning banner" />
      <AlertBanner type="success" text="Success banner" />
      <AlertBanner type="gold" text="Info banner" />

      <SectionLabel text="Cards" />
      <Card>
        <Text style={{color: colors.text}}>Default card content</Text>
      </Card>

      <SectionLabel text="Inputs" />
      <Input placeholder="Placeholder text" value="" />
      <Input placeholder="" value="Typed value" />

      <SectionLabel text="Progress Bars" />
      <ProgressBar progress={25} />
      <ProgressBar progress={75} color={colors.semantic.danger} />

      <SectionLabel text="Avatars" />
      <View style={styles.row}>
        <Avatar name="Alice Smith" />
        <Avatar name="Bob Jones" size={56} />
      </View>

      <SectionLabel text="Empty State" />
      <EmptyState title="No items" subtitle="List is empty" />

      {/* Typography scale */}
      <Text style={styles.heading}>Typography Scale</Text>
      <Text style={typography.h1}>H1 heading</Text>
      <Text style={typography.h2}>H2 heading</Text>
      <Text style={typography.h3}>H3 heading</Text>
      <Text style={typography.body}>Body text</Text>
      <Text style={typography.caption}>Caption text</Text>
      <Text style={typography.label}>Label text</Text>

      {/* Shadows */}
      <Text style={styles.heading}>Shadow Levels</Text>
      {[0, 1, 2, 3].map(level => (
        <View
          key={level}
          style={[
            styles.shadowBox,
            {
              shadowColor: tokens.shadows[level].ios.shadowColor,
              shadowOffset: tokens.shadows[level].ios.shadowOffset,
              shadowOpacity: tokens.shadows[level].ios.shadowOpacity,
              shadowRadius: tokens.shadows[level].ios.shadowRadius,
              elevation: tokens.shadows[level].android.elevation,
            },
          ]}>
          <Text style={{color: colors.text}}>Shadow {level}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function ColorSwatch({name, color}) {
  return (
    <View style={styles.swatchWrap}>
      <View style={[styles.swatch, {backgroundColor: color}]} />
      <Text style={styles.swatchName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.swatchHex} numberOfLines={1}>
        {color}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg, padding: spacing.md},
  heading: {
    color: colors.text,
    fontSize: tokens.typography.size.lg,
    fontWeight: tokens.typography.weight.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  swatchWrap: {alignItems: 'center', marginBottom: spacing.sm},
  swatch: {width: 48, height: 48, borderRadius: radius.sm, marginBottom: spacing.xs},
  swatchName: {color: colors.text, fontSize: tokens.typography.size.xs, maxWidth: 60},
  swatchHex: {color: colors.muted, fontSize: tokens.typography.size.xs, maxWidth: 60},
  neutralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  neutralLabel: {color: colors.text, fontSize: tokens.typography.size.sm, minWidth: 80},
  neutralSwatch: {width: 100, height: 24, borderRadius: radius.sm},
  shadowBox: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
