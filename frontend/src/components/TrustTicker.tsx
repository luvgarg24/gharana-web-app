import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors, spacing, fonts } from '@/src/theme/tokens';

const CLAIMS = [
  '• ZERO ADULTERATION',
  '• STONE-GROUND FRESH',
  '• COLD-PRESSED OILS',
  '• LAB-TESTED BATCHES',
  '• SIFT-TESTED PULSES',
  '• SINGLE-PRESS INTEGRITY',
];

export function TrustTicker() {
  const x = useSharedValue(0);
  const line = CLAIMS.join('   ');
  const combined = `${line}   ${line}   `;

  useEffect(() => {
    x.value = 0;
    x.value = withRepeat(withTiming(-600, { duration: 18000, easing: Easing.linear }), -1, false);
  }, [x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.row, style]}>
        <Text style={styles.text} numberOfLines={1}>{combined}{combined}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.earth,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row' },
  text: {
    color: colors.goldSoft,
    letterSpacing: 2.4,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
  },
});
