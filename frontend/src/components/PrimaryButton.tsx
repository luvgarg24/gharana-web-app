import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, fonts, type as t } from '@/src/theme/tokens';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'outline' | 'dark';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
  testID?: string;
};

export function PrimaryButton({ title, onPress, variant = 'primary', disabled, loading, style, icon, testID }: Props) {
  const isPrimary = variant === 'primary';
  const isDark = variant === 'dark';
  const isGhost = variant === 'ghost';
  const isOutline = variant === 'outline';

  const bg = isPrimary ? colors.saffron : isDark ? colors.earth : 'transparent';
  const fg = isPrimary || isDark ? colors.white : colors.earth;
  const borderColor = isOutline ? colors.earth : 'transparent';

  return (
    <Pressable
      testID={testID}
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: isOutline ? 1.2 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        isGhost && { paddingHorizontal: 0 },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.label, { color: fg, marginLeft: icon ? 8 : 0 }]}>
        {loading ? 'Please wait…' : title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...t.body, color: colors.white, fontFamily: fonts.bodyBold, fontSize: 15, letterSpacing: 0.3 },
});
