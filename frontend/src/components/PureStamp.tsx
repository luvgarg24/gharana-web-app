import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, type as t } from '@/src/theme/tokens';

export function PureStamp({ size = 44 }: { size?: number }) {
  return (
    <View style={[styles.stamp, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.line1}>VERIFIED</Text>
      <View style={styles.divider} />
      <Text style={styles.line2}>PURE</Text>
    </View>
  );
}

export function AccentLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.accent}>{children}</Text>;
}

const styles = StyleSheet.create({
  stamp: {
    borderWidth: 1.4,
    borderColor: colors.saffronDark,
    backgroundColor: 'rgba(232, 135, 58, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  line1: {
    fontSize: 7,
    letterSpacing: 1,
    color: colors.saffronDark,
    fontWeight: '700',
  },
  divider: {
    width: '60%',
    height: 0.7,
    backgroundColor: colors.saffronDark,
    marginVertical: 1,
  },
  line2: {
    fontSize: 8,
    letterSpacing: 1.4,
    color: colors.saffronDark,
    fontWeight: '700',
  },
  accent: {
    ...t.label,
    color: colors.saffronDark,
  },
});
