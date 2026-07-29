import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { colors, radius, spacing, type as t } from '@/src/theme/tokens';
import { CatalogAPI, SubscriptionAPI } from '@/src/api/client';
import { PrimaryButton } from '@/src/components/PrimaryButton';

const FREQS = ['weekly', 'biweekly', 'monthly'];

export default function Subscriptions() {
  const router = useRouter();
  const [subs, setSubs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [show, setShow] = useState(false);

  const load = () => SubscriptionAPI.list().then(setSubs);
  useEffect(() => {
    load();
    CatalogAPI.products({ featured: true }).then(setProducts);
  }, []);

  const create = async (product: any, weight: string, frequency: string) => {
    const next = new Date();
    next.setDate(next.getDate() + (frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 14 : 30));
    await SubscriptionAPI.create({ product_id: product.id, variant_weight: weight, frequency, next_delivery: next.toISOString(), active: true });
    setShow(false);
    load();
  };

  const toggle = async (s: any) => {
    await SubscriptionAPI.update(s.id, { ...s, active: !s.active });
    load();
  };

  const remove = async (s: any) => { await SubscriptionAPI.remove(s.id); load(); };

  const productById = (id: string) => products.find((p) => p.id === id);

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="subscriptions-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={20} color={colors.earth} /></Pressable>
        <Text style={styles.title}>Ration Plans</Text>
        <Pressable onPress={() => setShow(true)} testID="new-sub-btn"><Feather name="plus" size={22} color={colors.earth} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        <View style={styles.info}>
          <Text style={styles.infoLabel}>NEVER RUN OUT</Text>
          <Text style={styles.infoTitle}>Ration plans, ghar tak.</Text>
          <Text style={styles.infoBody}>Auto-deliver staples on your schedule. Skip or cancel anytime.</Text>
        </View>

        {subs.length === 0 && <Text style={{ color: colors.dust, textAlign: 'center', padding: spacing.xxl }}>No plans yet. Tap + to set up your first ration plan.</Text>}
        {subs.map((s) => {
          const p = productById(s.product_id);
          return (
            <View key={s.id} style={styles.card} testID={`sub-${s.id}`}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                {p && <Image source={{ uri: p.image }} style={styles.thumb} contentFit="cover" />}
                <View style={{ flex: 1 }}>
                  <Text style={{ ...t.body, fontWeight: '700' }}>{p?.name || s.product_id}</Text>
                  <Text style={{ color: colors.dust, fontSize: 12, marginTop: 2 }}>{s.variant_weight} · {s.frequency}</Text>
                  <Text style={{ color: colors.saffronDark, fontSize: 12, marginTop: 4, fontWeight: '600' }}>Next: {new Date(s.next_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                </View>
                <Pressable onPress={() => toggle(s)} style={[styles.togBtn, { backgroundColor: s.active ? colors.jade : colors.dust }]} testID={`toggle-${s.id}`}>
                  <Text style={styles.togText}>{s.active ? 'ACTIVE' : 'PAUSED'}</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => remove(s)} style={styles.deleteRow} testID={`delete-sub-${s.id}`}>
                <Feather name="x" size={12} color={colors.error} />
                <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>Cancel plan</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={show} animationType="slide" onRequestClose={() => setShow(false)}>
        <SubForm products={products} onCreate={create} onClose={() => setShow(false)} />
      </Modal>
    </SafeAreaView>
  );
}

function SubForm({ products, onCreate, onClose }: { products: any[]; onCreate: (p: any, w: string, f: string) => void; onClose: () => void }) {
  const [product, setProduct] = useState<any | null>(null);
  const [weight, setWeight] = useState<string>('');
  const [freq, setFreq] = useState('weekly');

  useEffect(() => { if (product && !weight) setWeight(product.variants[0].weight); }, [product]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={styles.header}>
        <Pressable onPress={onClose}><Feather name="x" size={22} color={colors.earth} /></Pressable>
        <Text style={styles.title}>New ration plan</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Text style={styles.sectionLabel}>PICK A STAPLE</Text>
        <View style={{ gap: 8 }}>
          {products.map((p) => (
            <Pressable key={p.id} onPress={() => { setProduct(p); setWeight(p.variants[0].weight); }} style={[styles.picker, product?.id === p.id && styles.pickerActive]} testID={`pick-${p.slug}`}>
              <Image source={{ uri: p.image }} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.earth }}>{p.name}</Text>
                <Text style={{ color: colors.dust, fontSize: 12 }}>{p.tagline}</Text>
              </View>
              {product?.id === p.id && <Feather name="check-circle" size={16} color={colors.jade} />}
            </Pressable>
          ))}
        </View>

        {product && (
          <>
            <Text style={styles.sectionLabel}>WEIGHT</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {product.variants.map((v: any) => (
                <Pressable key={v.weight} onPress={() => setWeight(v.weight)} style={[styles.chip, weight === v.weight && styles.chipActive]} testID={`sub-weight-${v.weight}`}>
                  <Text style={[styles.chipText, weight === v.weight && styles.chipTextActive]}>{v.weight} · ₹{v.price}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionLabel}>FREQUENCY</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {FREQS.map((f) => (
                <Pressable key={f} onPress={() => setFreq(f)} style={[styles.chip, freq === f && styles.chipActive]} testID={`sub-freq-${f}`}>
                  <Text style={[styles.chipText, freq === f && styles.chipTextActive]}>{f}</Text>
                </Pressable>
              ))}
            </View>

            <PrimaryButton title="Start plan" onPress={() => onCreate(product, weight, freq)} testID="start-plan-btn" style={{ marginTop: spacing.xl }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  title: { ...t.h3, fontStyle: 'italic' },
  info: { backgroundColor: colors.earth, padding: spacing.lg, borderRadius: radius.md },
  infoLabel: { color: colors.saffron, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  infoTitle: { color: colors.white, fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 22, fontWeight: '700', marginTop: 4 },
  infoBody: { color: colors.cream, opacity: 0.8, marginTop: 4, fontSize: 12 },
  card: { backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.cream },
  togBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  togText: { color: colors.white, fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  deleteRow: { flexDirection: 'row', gap: 6, alignItems: 'center', alignSelf: 'flex-start' },
  sectionLabel: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700', color: colors.dust, marginTop: spacing.lg, marginBottom: 8 },
  picker: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.white },
  pickerActive: { borderColor: colors.jade },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.earth, borderColor: colors.earth },
  chipText: { fontSize: 12, color: colors.earth, fontWeight: '600' },
  chipTextActive: { color: colors.white },
});
