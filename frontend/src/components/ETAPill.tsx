import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Feather from '@expo/vector-icons/Feather';
import { colors, radius, spacing } from '@/src/theme/tokens';

export function ETAPill({ minutes = 28, label = 'Delivering' }: { minutes?: number; label?: string }) {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withRepeat(withTiming(0.55, { duration: 1400 }), -1, true);
  }, [s]);
  const style = useAnimatedStyle(() => ({ opacity: s.value }));

  return (
    <View style={styles.pill}>
      <Animated.View style={[styles.dot, style]} />
      <Feather name="zap" size={12} color={colors.saffron} />
      <Text style={styles.text}>{label} in {minutes} min</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(232, 135, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 135, 58, 0.35)',
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.saffron,
  },
  text: { fontSize: 11.5, color: colors.saffronDark, fontWeight: '700', letterSpacing: 0.4 },
});
