import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, type as t, shadow } from '@/src/theme/tokens';
import { useCart } from '@/src/context/CartContext';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { PromoAPI } from '@/src/api/client';

const FREE_DELIVERY_MIN = 499;

export default function CartScreen() {
  const router = useRouter();
  const { items, subtotal, setQuantity, removeItem } = useCart();
  const [promo, setPromo] = useState('');
  const [promoResult, setPromoResult] = useState<{ code: string; discount: number } | null>(null);
  const [promoErr, setPromoErr] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<'express' | 'scheduled'>('express');

  useEffect(() => {
    if (!promoResult) return;
    if (subtotal < FREE_DELIVERY_MIN * 0.5) setPromoResult(null);
  }, [subtotal]);

  const discount = promoResult?.discount || 0;
  const deliveryFee = subtotal - discount >= FREE_DELIVERY_MIN ? 0 : subtotal > 0 ? 29 : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);
  const remainingFree = Math.max(0, FREE_DELIVERY_MIN - (subtotal - discount));
  const progress = Math.min(1, (subtotal - discount) / FREE_DELIVERY_MIN);

  const applyPromo = async () => {
    setPromoErr(null);
    try {
      const r: any = await PromoAPI.validate(promo, subtotal);
      setPromoResult({ code: r.code, discount: r.discount });
    } catch (e: any) {
      setPromoErr(e.message || 'Invalid code');
      setPromoResult(null);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe} testID="cart-screen-empty">
        <View style={styles.header}><Text style={styles.title}>Your basket</Text></View>
        <View style={styles.empty}>
          <View style={styles.emptyCircle}><Feather name="shopping-bag" size={44} color={colors.saffronDark} /></View>
          <Text style={styles.emptyTitle}>Your Gharana basket is empty</Text>
          <Text style={styles.emptyBody}>Bring home some real atta, dal, and ghee.</Text>
          <PrimaryButton title="Fill your pantry" onPress={() => router.push('/(tabs)/categories')} style={{ marginTop: spacing.lg }} testID="empty-shop-btn" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="cart-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Your basket</Text>
        <Text style={styles.count}>{items.length} item{items.length > 1 ? 's' : ''}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 240 }}>
        {/* Free delivery progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Feather name="truck" size={14} color={remainingFree === 0 ? colors.jade : colors.saffronDark} />
            <Text style={styles.progressText}>
              {remainingFree === 0 ? 'Free delivery unlocked' : `Add ₹${remainingFree} more for free delivery`}
            </Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: remainingFree === 0 ? colors.jade : colors.saffron }]} />
          </View>
        </View>

        {/* Items */}
        {items.map((it) => (
          <View key={`${it.product_id}-${it.variant_weight}`} style={styles.item} testID={`cart-item-${it.slug}-${it.variant_weight}`}>
            <Image source={{ uri: it.image }} style={styles.itemImg} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={2}>{it.name}</Text>
              <Text style={styles.itemVar}>{it.variant_weight}</Text>
              <Text style={styles.itemPrice}>₹{it.unit_price} × {it.quantity} = ₹{(it.unit_price * it.quantity).toFixed(0)}</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable onPress={() => setQuantity(it.product_id, it.variant_weight, it.quantity - 1)} style={styles.stepBtn} testID={`cart-dec-${it.slug}`}>
                <Feather name={it.quantity === 1 ? 'trash-2' : 'minus'} size={13} color={colors.white} />
              </Pressable>
              <Text style={styles.stepQty}>{it.quantity}</Text>
              <Pressable onPress={() => setQuantity(it.product_id, it.variant_weight, it.quantity + 1)} style={styles.stepBtn} testID={`cart-inc-${it.slug}`}>
                <Feather name="plus" size={13} color={colors.white} />
              </Pressable>
            </View>
          </View>
        ))}

        {/* Promo */}
        <View style={styles.promoCard}>
          <Text style={styles.sectionLabel}>PROMO CODE</Text>
          <View style={styles.promoRow}>
            <TextInput
              value={promo}
              onChangeText={setPromo}
              placeholder="GHAR50, PURE10…"
              placeholderTextColor={colors.dustLight}
              style={styles.promoInput}
              autoCapitalize="characters"
              testID="promo-input"
            />
            <Pressable onPress={applyPromo} style={styles.promoBtn} testID="apply-promo-btn">
              <Text style={styles.promoBtnText}>APPLY</Text>
            </Pressable>
          </View>
          {promoResult && <Text style={styles.promoOk}>✓ {promoResult.code} applied — you save ₹{promoResult.discount}</Text>}
          {promoErr && <Text style={styles.promoErr}>{promoErr}</Text>}
        </View>

        {/* Delivery */}
        <View style={styles.delivery}>
          <Text style={styles.sectionLabel}>DELIVERY</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => setDeliveryType('express')} style={[styles.delTab, deliveryType === 'express' && styles.delTabActive]} testID="delivery-express">
              <Feather name="zap" size={14} color={deliveryType === 'express' ? colors.white : colors.earth} />
              <Text style={[styles.delTabText, deliveryType === 'express' && styles.delTabTextActive]}>Express · 28 min</Text>
            </Pressable>
            <Pressable onPress={() => setDeliveryType('scheduled')} style={[styles.delTab, deliveryType === 'scheduled' && styles.delTabActive]} testID="delivery-scheduled">
              <Feather name="calendar" size={14} color={deliveryType === 'scheduled' ? colors.white : colors.earth} />
              <Text style={[styles.delTabText, deliveryType === 'scheduled' && styles.delTabTextActive]}>Scheduled</Text>
            </Pressable>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <Row label="Subtotal" value={`₹${subtotal.toFixed(0)}`} />
          {discount > 0 && <Row label={`Discount (${promoResult?.code})`} value={`− ₹${discount.toFixed(0)}`} valueColor={colors.jade} />}
          <Row label="Delivery" value={deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`} valueColor={deliveryFee === 0 ? colors.jade : colors.earth} />
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
          <Row label="Total to pay" value={`₹${total.toFixed(0)}`} bold />
          {discount > 0 && <Text style={styles.savings}>You saved ₹{discount.toFixed(0)} on this order.</Text>}
        </View>
      </ScrollView>

      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.checkoutSmall}>₹{total.toFixed(0)}</Text>
          <Text style={styles.checkoutLabel}>Total · {items.length} item{items.length > 1 ? 's' : ''}</Text>
        </View>
        <Pressable
          testID="checkout-btn"
          style={styles.checkoutBtn}
          onPress={() => router.push({ pathname: '/checkout', params: { delivery: deliveryType, promo: promoResult?.code || '' } })}
        >
          <Feather name="lock" size={14} color={colors.white} />
          <Text style={styles.checkoutBtnText}>Checkout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, valueColor, bold }: { label: string; value: string; valueColor?: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ ...t.body, color: colors.dust, fontWeight: bold ? '700' : '500' }}>{label}</Text>
      <Text style={{ ...t.body, color: valueColor || colors.earth, fontWeight: bold ? '700' : '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { ...t.h2, fontStyle: 'italic' },
  count: { ...t.small, color: colors.dust },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: 6 },
  emptyCircle: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.saffronTint, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emptyTitle: { ...t.h3 },
  emptyBody: { ...t.body, color: colors.dust, textAlign: 'center' },
  progressCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  progressText: { fontSize: 12, color: colors.earth, fontWeight: '600' },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  item: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  itemImg: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.cream },
  itemName: { ...t.body, fontWeight: '600', color: colors.earth },
  itemVar: { ...t.small, color: colors.dust, marginTop: 2 },
  itemPrice: { ...t.small, color: colors.saffronDark, fontWeight: '700', marginTop: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.earth, borderRadius: radius.pill, paddingHorizontal: 4, gap: 4 },
  stepBtn: { padding: 6 },
  stepQty: { color: colors.white, fontWeight: '700', minWidth: 14, textAlign: 'center' },
  sectionLabel: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700', color: colors.dust, marginBottom: 8 },
  promoCard: { marginTop: spacing.lg, backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  promoRow: { flexDirection: 'row', gap: 8 },
  promoInput: { flex: 1, backgroundColor: colors.cream, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10, color: colors.earth, fontWeight: '600' },
  promoBtn: { backgroundColor: colors.earth, paddingHorizontal: 16, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  promoBtnText: { color: colors.white, fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  promoOk: { color: colors.jade, marginTop: 8, fontSize: 12, fontWeight: '600' },
  promoErr: { color: colors.error, marginTop: 8, fontSize: 12 },
  delivery: { marginTop: spacing.lg, backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  delTab: { flex: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.border },
  delTabActive: { backgroundColor: colors.earth, borderColor: colors.earth },
  delTabText: { fontSize: 12, fontWeight: '600', color: colors.earth },
  delTabTextActive: { color: colors.white },
  totals: { marginTop: spacing.lg, backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  savings: { color: colors.jade, textAlign: 'center', marginTop: 8, fontWeight: '600', fontSize: 12 },
  checkoutBar: { position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: spacing.lg, backgroundColor: colors.white, borderRadius: radius.pill, padding: 6, paddingLeft: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...shadow.card, borderWidth: 1, borderColor: colors.border },
  checkoutSmall: { ...t.h4, fontSize: 20 },
  checkoutLabel: { ...t.small, color: colors.dust },
  checkoutBtn: { backgroundColor: colors.saffron, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkoutBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
