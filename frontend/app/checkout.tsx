import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { colors, radius, spacing, fonts, type as t } from '@/src/theme/tokens';
import { AddressAPI, OrderAPI } from '@/src/api/client';
import { useCart } from '@/src/context/CartContext';
import { PrimaryButton } from '@/src/components/PrimaryButton';

const PAY_METHODS = [
  { key: 'upi', label: 'UPI', icon: 'smartphone' as const, desc: 'GPay, PhonePe, Paytm' },
  { key: 'card', label: 'Card', icon: 'credit-card' as const, desc: 'Debit / credit' },
  { key: 'wallet', label: 'Wallet', icon: 'briefcase' as const, desc: 'Paytm, Amazon Pay' },
  { key: 'cod', label: 'Cash on Delivery', icon: 'dollar-sign' as const, desc: 'Pay at doorstep' },
];

const SLOTS = ['Today 4–6 pm', 'Today 6–8 pm', 'Tomorrow 8–10 am', 'Tomorrow 10 am–12 pm'];

export default function Checkout() {
  const router = useRouter();
  const { delivery, promo } = useLocalSearchParams<{ delivery: string; promo: string }>();
  const { items, subtotal, clear } = useCart();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState('upi');
  const [slot, setSlot] = useState(SLOTS[0]);
  const [showAddr, setShowAddr] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [confirmed, setConfirmed] = useState<any | null>(null);

  const scale = useSharedValue(0);
  const rotate = useSharedValue(-20);

  useEffect(() => {
    AddressAPI.list().then((a: any) => {
      setAddresses(a);
      if (a.length) setSelectedAddr(a[0].id);
      else setShowAddr(true);
    });
  }, []);

  const discount = 0; // recomputed server-side
  const deliveryFee = subtotal >= 499 ? 0 : 29;
  const total = subtotal + deliveryFee;

  const placeOrder = async () => {
    if (!selectedAddr) { setShowAddr(true); return; }
    setPlacing(true);
    try {
      const payload = {
        items: items.map((i) => ({ product_id: i.product_id, variant_weight: i.variant_weight, quantity: i.quantity })),
        address_id: selectedAddr,
        delivery_type: (delivery === 'scheduled' ? 'scheduled' : 'express'),
        scheduled_slot: delivery === 'scheduled' ? slot : undefined,
        payment_method: payMethod,
        promo_code: promo || undefined,
      };
      const order: any = await OrderAPI.create(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setConfirmed(order);
      // stamp animation
      scale.value = 0;
      rotate.value = -20;
      scale.value = withSequence(withTiming(1.15, { duration: 380 }), withSpring(1));
      rotate.value = withSpring(-6, { damping: 8 });
      setTimeout(() => {
        clear();
        router.replace(`/order/${order.id}`);
      }, 1500);
    } catch (e: any) {
      alert(e.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const stampStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }] }));

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="checkout-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={20} color={colors.earth} /></Pressable>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 220 }}>
        {/* Address */}
        <Text style={styles.sectionLabel}>DELIVER TO</Text>
        {addresses.length === 0 ? (
          <Pressable onPress={() => setShowAddr(true)} style={styles.addAddr} testID="add-address-btn">
            <Feather name="map-pin" size={18} color={colors.saffronDark} />
            <Text style={styles.addAddrText}>Add delivery address</Text>
          </Pressable>
        ) : addresses.map((a) => (
          <Pressable key={a.id} onPress={() => setSelectedAddr(a.id)} style={[styles.addrCard, selectedAddr === a.id && styles.addrCardActive]} testID={`addr-${a.label}`}>
            <View style={{ flex: 1 }}>
              <Text style={styles.addrLabel}>{a.label} <Text style={styles.addrName}>· {a.full_name}</Text></Text>
              <Text style={styles.addrLine}>{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city} {a.pincode}</Text>
              <Text style={styles.addrPhone}>{a.phone}</Text>
            </View>
            {selectedAddr === a.id && <Feather name="check-circle" size={18} color={colors.jade} />}
          </Pressable>
        ))}
        {addresses.length > 0 && (
          <Pressable onPress={() => setShowAddr(true)} style={styles.addMore} testID="add-another-address">
            <Feather name="plus" size={14} color={colors.saffronDark} />
            <Text style={{ color: colors.saffronDark, fontWeight: '600' }}>Add another address</Text>
          </Pressable>
        )}

        {/* Delivery slot */}
        {delivery === 'scheduled' && (
          <>
            <Text style={styles.sectionLabel}>PICK A SLOT</Text>
            <View style={{ gap: 8 }}>
              {SLOTS.map((s) => (
                <Pressable key={s} onPress={() => setSlot(s)} style={[styles.slotRow, slot === s && styles.slotRowActive]} testID={`slot-${s}`}>
                  <Feather name={slot === s ? 'check-circle' : 'circle'} size={16} color={slot === s ? colors.jade : colors.dust} />
                  <Text style={{ ...t.body, fontWeight: '600' }}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Payment */}
        <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
        <View style={{ gap: 8 }}>
          {PAY_METHODS.map((m) => (
            <Pressable key={m.key} onPress={() => setPayMethod(m.key)} style={[styles.payRow, payMethod === m.key && styles.payRowActive]} testID={`pay-${m.key}`}>
              <Feather name={m.icon} size={18} color={payMethod === m.key ? colors.saffronDark : colors.earth} />
              <View style={{ flex: 1 }}>
                <Text style={styles.payLabel}>{m.label}</Text>
                <Text style={styles.paySub}>{m.desc}</Text>
              </View>
              <Feather name={payMethod === m.key ? 'check-circle' : 'circle'} size={16} color={payMethod === m.key ? colors.jade : colors.dust} />
            </Pressable>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.sectionLabel}>ORDER SUMMARY</Text>
          <SumRow label={`Subtotal (${items.length})`} value={`₹${subtotal.toFixed(0)}`} />
          <SumRow label="Delivery" value={deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`} />
          {promo ? <SumRow label={`Promo (${promo})`} value="applied" valueColor={colors.jade} /> : null}
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
          <SumRow label="You pay" value={`₹${total.toFixed(0)}`} bold />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View><Text style={styles.footPrice}>₹{total.toFixed(0)}</Text><Text style={styles.footSub}>{payMethod.toUpperCase()} · {delivery === 'scheduled' ? 'Scheduled' : '28 min'}</Text></View>
        <PrimaryButton title={placing ? 'Placing…' : 'Place order'} onPress={placeOrder} loading={placing} testID="place-order-btn" style={{ paddingHorizontal: 30 }} />
      </View>

      {/* Address modal */}
      <AddressModal visible={showAddr} onClose={() => setShowAddr(false)} onCreated={(a) => { setAddresses((p) => [a, ...p]); setSelectedAddr(a.id); setShowAddr(false); }} />

      {/* Confirmation stamp overlay */}
      {confirmed && (
        <View style={[styles.overlay, { pointerEvents: 'none' }]}>
          <Animated.View style={[styles.stamp, stampStyle]}>
            <Text style={styles.stampLine1}>· GHARANA ·</Text>
            <Text style={styles.stampLine2}>ORDER PLACED</Text>
            <View style={styles.stampDivider} />
            <Text style={styles.stampLine3}>Ghar aa raha hai</Text>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

function SumRow({ label, value, valueColor, bold }: any) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
      <Text style={{ color: colors.dust, fontWeight: bold ? '700' : '500' }}>{label}</Text>
      <Text style={{ color: valueColor || colors.earth, fontWeight: bold ? '700' : '600' }}>{value}</Text>
    </View>
  );
}

function AddressModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (a: any) => void }) {
  const [form, setForm] = useState({ label: 'Home', full_name: '', phone: '', line1: '', line2: '', city: '', pincode: '', instructions: '' });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      const a: any = await AddressAPI.create({ ...form, is_default: true });
      onCreated(a);
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <Pressable onPress={onClose}><Feather name="x" size={22} color={colors.earth} /></Pressable>
            <Text style={styles.title}>New address</Text>
            <View style={{ width: 22 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
            {[
              ['Label (Home/Work)', 'label'],
              ['Full name', 'full_name'],
              ['Phone', 'phone'],
              ['Address line 1', 'line1'],
              ['Address line 2 (optional)', 'line2'],
              ['City', 'city'],
              ['Pincode', 'pincode'],
              ['Delivery instructions (optional)', 'instructions'],
            ].map(([label, key]) => (
              <View key={key}>
                <Text style={styles.sectionLabel}>{String(label).toUpperCase()}</Text>
                <TextInput
                  testID={`addr-input-${key}`}
                  value={(form as any)[key]}
                  onChangeText={(v) => setForm({ ...form, [key]: v })}
                  placeholder=""
                  placeholderTextColor={colors.dustLight}
                  style={styles.formInput}
                  keyboardType={key === 'phone' || key === 'pincode' ? 'number-pad' : 'default'}
                />
              </View>
            ))}
            <PrimaryButton title="Save address" onPress={submit} loading={saving} testID="save-address-btn" style={{ marginTop: spacing.lg }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  title: { ...t.h3, fontStyle: 'italic' },
  sectionLabel: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700', color: colors.dust, marginTop: spacing.xl, marginBottom: 8 },
  addAddr: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.saffron, borderStyle: 'dashed' },
  addAddrText: { color: colors.saffronDark, fontWeight: '700' },
  addrCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: 6 },
  addrCardActive: { borderColor: colors.jade, backgroundColor: 'rgba(45, 106, 79, 0.05)' },
  addrLabel: { fontWeight: '700', color: colors.earth },
  addrName: { fontWeight: '500', color: colors.dust },
  addrLine: { color: colors.dust, marginTop: 4, fontSize: 13 },
  addrPhone: { color: colors.dust, marginTop: 2, fontSize: 12 },
  addMore: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 8 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  slotRowActive: { borderColor: colors.jade, backgroundColor: 'rgba(45, 106, 79, 0.05)' },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  payRowActive: { borderColor: colors.saffron, backgroundColor: 'rgba(232, 135, 58, 0.05)' },
  payLabel: { fontWeight: '700', color: colors.earth },
  paySub: { fontSize: 12, color: colors.dust, marginTop: 2 },
  summary: { marginTop: spacing.xl, backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  footer: { position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: spacing.lg, backgroundColor: colors.white, borderRadius: radius.pill, padding: 6, paddingLeft: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  footPrice: { fontSize: 18, fontWeight: '700', color: colors.earth },
  footSub: { fontSize: 11, color: colors.dust },
  formInput: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, marginTop: 4, color: colors.earth, fontSize: 14 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(28, 20, 12, 0.55)', alignItems: 'center', justifyContent: 'center' },
  stamp: { width: 220, height: 220, borderRadius: 110, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.saffronDark, gap: 6 },
  stampLine1: { color: colors.saffronDark, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  stampLine2: { color: colors.earth, fontSize: 18, letterSpacing: 2, fontWeight: '800' },
  stampDivider: { width: 60, height: 1, backgroundColor: colors.saffronDark },
  stampLine3: { color: colors.dust, fontFamily: fonts.displayItalic },
});
