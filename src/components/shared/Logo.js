import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import {colors, spacing} from '../../utils/theme.js';

/**
 * Logo — головний бренд-лок-ап LexTrack.
 * Знак (лицар на коні) + текстова частина "LexTrack".
 *
 * Використання:
 *   <Logo />                      // 32px текст, 38px знак
 *   <Logo size={24} />            // header / nav
 *   <Logo size={40} center />     // login screen
 *   <Logo markOnly size={64} />   // app icon, splash
 */
export default function Logo({size = 32, center = false, markOnly = false, style}) {
  const markSize = Math.round(size * 1.2);
  return (
    <View
      style={[
        styles.row,
        center && styles.center,
        {gap: Math.round(size * 0.35)},
        style,
      ]}>
      <Image
        source={require('../../assets/logo.png')}
        style={{width: markSize, height: Math.round(markSize * 0.94)}}
        resizeMode="contain"
      />
      {!markOnly && (
        <Text
          style={[
            styles.word,
            {fontSize: size, color: colors.brand.primary},
          ]}>
          LexTrack
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    alignSelf: 'center',
  },
  word: {
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: undefined,
  },
});
