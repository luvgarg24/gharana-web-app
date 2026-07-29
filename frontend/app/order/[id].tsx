import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { colors, radius, spacing, type as t } from '@/src/theme/tokens';
import { OrderAPI } from '@/src/api/client';

const STAGES = [
  { key: 'confirmed', label: 'Confirmed', hint: 'Order placed. Store informed.', icon: 'check-circle' as const },
  { key: 'packed', label: 'Packed', hint: 'Handed to the packer with love.', icon: 'package' as const },
  { key: 'out_for_delivery', label: 'Out for delivery', hint: 'On its way to your kitchen.', icon: 'truck' as const },
  { key: 'delivered', label: 'Delivered', hint: 'Safe at your door. Enjoy!', icon: 'home' as const },
];

export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const o = await OrderAPI.get(id);
    setOrder(o);
  }, [id]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [load]);

  if (!order) return <SafeAreaView style={styles.safe}><Text style={{ padding: spacing.xl }}>Loading order…</Text></SafeAreaView>;

  const stageIdx = STAGES.findIndex((s) => s.key === order.status);
  const etaTime = new Date(order.eta);
  const etaLabel = etaTime.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="order-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(tabs)')}><Feather name="arrow-left" size={20} color={colors.earth} /></Pressable>
        <Text style={styles.title}>Your order</Text>
        <View style={{ width: 20 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>
        <View style={styles.confirm}>
          <View style={styles.confirmStamp}>
            <Text style={styles.confirmStampLine1}>· GHARANA ·</Text>
            <Text style={styles.confirmStampLine2}>#{order.id.slice(0, 8).toUpperCase()}</Text>
          </View>
          <Text style={styles.confirmTitle}>Ghar aa raha hai</Text>
          <Text style={styles.confirmSub}>Arriving by {etaLabel}</Text>
        </View>

        <View style={styles.timeline}>
          {STAGES.map((s, i) => {
            const done = i <= stageIdx;
            const isCurrent = i === stageIdx;
            return (
              <View key={s.key} style={styles.stageRow}>
                <View style={styles.stageIndicatorCol}>
                  <View style={[styles.stageDot, done && styles.stageDotDone, isCurrent && styles.stageDotCurrent]}>
                    <Feather name={s.icon} size={12} color={done ? colors.white : colors.dust} />
                  </View>
                  {i < STAGES.length - 1 && <View style={[styles.stageLine, done && styles.stageLineDone]} />}
                </View>
                <View style={{ flex: 1, paddingBottom: spacing.lg }}>
                  <Text style={[styles.stageLabel, done && { color: colors.earth }]}>{s.label}</Text>
                  <Text style={styles.stageHint}>{s.hint}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>DELIVERING TO</Text>
          <Text style={{ ...t.body, fontWeight: '600' }}>{order.address.label} · {order.address.full_name}</Text>
          <Text style={{ color: colors.dust }}>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}, {order.address.city} {order.address.pincode}</Text>
          <Text style={{ color: colors.dust, fontSize: 12, marginTop: 2 }}>{order.address.phone}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ITEMS ({order.items.length})</Text>
          {order.items.map((i: any) => (
            <View key={`${i.product_id}-${i.variant_weight}`} style={styles.itemRow}>
              <Image source={{ uri: i.image }} style={styles.itemImg} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={{ ...t.body, fontWeight: '600' }}>{i.name}</Text>
                <Text style={{ color: colors.dust, fontSize: 12 }}>{i.variant_weight} × {i.quantity}</Text>
              </View>
              <Text style={{ fontWeight: '700' }}>₹{i.line_total.toFixed(0)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PAYMENT</Text>
          <Row label={`${order.payment_method.toUpperCase()}`} value="" />
          <Row label="Subtotal" value={`₹${order.subtotal.toFixed(0)}`} />
          {order.discount > 0 && <Row label="Discount" value={`− ₹${order.discount.toFixed(0)}`} valueColor={colors.jade} />}
          <Row label="Delivery" value={order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee}`} />
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
          <Row label="Total" value={`₹${order.total.toFixed(0)}`} bold />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, valueColor, bold }: any) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
      <Text style={{ color: colors.dust, fontWeight: bold ? '700' : '500' }}>{label}</Text>
      <Text style={{ color: valueColor || colors.earth, fontWeight: bold ? '700' : '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  title: { ...t.h3, fontStyle: 'italic' },
  confirm: { backgroundColor: colors.earth, padding: spacing.xl, borderRadius: radius.lg, alignItems: 'center' },
  confirmStamp: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: colors.saffron, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }], marginBottom: spacing.md },
  confirmStampLine1: { color: colors.saffron, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  confirmStampLine2: { color: colors.white, fontSize: 14, letterSpacing: 1.5, fontWeight: '800', marginTop: 4 },
  confirmTitle: { color: colors.white, fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 26, fontWeight: '700' },
  confirmSub: { color: colors.cream, marginTop: 4 },
  timeline: { marginTop: spacing.xl, paddingHorizontal: spacing.sm },
  stageRow: { flexDirection: 'row', gap: 12 },
  stageIndicatorCol: { alignItems: 'center' },
  stageDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stageDotDone: { backgroundColor: colors.jade, borderColor: colors.jade },
  stageDotCurrent: { backgroundColor: colors.saffron, borderColor: colors.saffron },
  stageLine: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  stageLineDone: { backgroundColor: colors.jade },
  stageLabel: { ...t.body, fontWeight: '700', color: colors.dust },
  stageHint: { color: colors.dust, fontSize: 12, marginTop: 2 },
  card: { backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md },
  sectionLabel: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700', color: colors.dust, marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  itemImg: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.cream },
});
