import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {colors, spacing, radius, typography, globalStyles, tokens} from '../../utils/theme';
import EdrSearch from './EdrSearch';
import CourtSearch from './CourtSearch';
import EnforcementSearch from './EnforcementSearch';

const TABS = [
  {key: 'edr', label: 'ЄДР'},
  {key: 'court', label: 'Судові рішення'},
  {key: 'enforcement', label: 'Виконавчі провадження'},
];

export default function RegistriesScreen({navigation}) {
  const [active, setActive] = useState('edr');

  return (
    <View style={globalStyles.container}>
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, active === tab.key && styles.tabActive]}
            onPress={() => setActive(tab.key)}>
            <Text
              style={[
                styles.tabText,
                active === tab.key && styles.tabTextActive,
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={globalStyles.container}>
        {active === 'edr' && <EdrSearch navigation={navigation} />}
        {active === 'court' && <CourtSearch navigation={navigation} />}
        {active === 'enforcement' && <EnforcementSearch navigation={navigation} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.gold,
  },
  tabText: {
    color: colors.muted,
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
  },
  tabTextActive: {
    color: colors.bg,
  },
});
