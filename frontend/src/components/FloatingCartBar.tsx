import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useCart } from '@/src/context/CartContext';
import { colors, fonts, radius, shadow, spacing } from '@/src/theme/tokens';

export function FloatingCartBar({ testPrefix }: { testPrefix: string }) {
  const router = useRouter();
  const { itemCount, subtotal } = useCart();
  if (!itemCount) return null;

  return (
    <Pressable
      testID={`${testPrefix}-floating-view-cart`}
      onPress={() => router.push('/(tabs)/cart')}
      style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Feather name="shopping-bag" size={18} color={colors.saffron} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.total} testID={`${testPrefix}-floating-cart-total`}>₹{subtotal.toFixed(0)}</Text>
        <Text style={styles.meta} testID={`${testPrefix}-floating-cart-count`}>{itemCount} item{itemCount > 1 ? 's' : ''} in cart</Text>
      </View>
      <Text style={styles.action}>View cart</Text>
      <Feather name="chevron-right" size={18} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 78,
    height: 58,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.saffron,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.card,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  iconWrap: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 10 },
  total: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 15 },
  meta: { color: 'rgba(255,255,255,0.82)', fontFamily: fonts.bodyMedium, fontSize: 10.5, marginTop: 1 },
  action: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 13, marginRight: 2 },
});