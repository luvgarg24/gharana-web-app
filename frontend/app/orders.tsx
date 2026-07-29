import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { colors, radius, spacing, type as t } from '@/src/theme/tokens';
import { OrderAPI } from '@/src/api/client';
import { useCart } from '@/src/context/CartContext';

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed', packed: 'Packed', out_for_delivery: 'On the way', delivered: 'Delivered',
};
const STATUS_COLOR: Record<string, string> = {
  confirmed: colors.saffron, packed: colors.saffron, out_for_delivery: colors.saffron, delivered: colors.jade,
};

export default function Orders() {
  const router = useRouter();
  const { addItem } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => setOrders(await OrderAPI.list() as any[]), []);
  useEffect(() => { load().catch(() => {}); }, [load]);

  const reorder = (o: any) => {
    o.items.forEach((i: any) => {
      addItem({ product_id: i.product_id, slug: i.slug, name: i.name, image: i.image, variant_weight: i.variant_weight, unit_price: i.unit_price }, i.quantity);
    });
    router.push('/(tabs)/cart');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="orders-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={20} color={colors.earth} /></Pressable>
        <Text style={styles.title}>My orders</Text>
        <View style={{ width: 20 }} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListEmptyComponent={<Text style={{ color: colors.dust, textAlign: 'center', padding: spacing.xxl }}>No orders yet. Start with a fresh bag of atta.</Text>}
        renderItem={({ item }) => (
          <View style={styles.orderCard} testID={`order-${item.id}`}>
            <View style={styles.orderHeaderRow}>
              <View>
                <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] || colors.dust }]}>
                <Text style={styles.badgeText}>{STATUS_LABEL[item.status] || item.status}</Text>
              </View>
            </View>
            <View style={styles.thumbRow}>
              {item.items.slice(0, 4).map((i: any, idx: number) => (
                <Image key={idx} source={{ uri: i.image }} style={styles.thumb} contentFit="cover" />
              ))}
              {item.items.length > 4 && <View style={styles.moreThumb}><Text style={styles.moreText}>+{item.items.length - 4}</Text></View>}
            </View>
            <View style={styles.footerRow}>
              <Text style={styles.totalText}>₹{item.total.toFixed(0)} · {item.items.length} item{item.items.length > 1 ? 's' : ''}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={() => reorder(item)} style={styles.smallBtn} testID={`reorder-${item.id}`}>
                  <Feather name="rotate-cw" size={12} color={colors.saffronDark} />
                  <Text style={styles.smallBtnText}>Reorder</Text>
                </Pressable>
                <Pressable onPress={() => router.push(`/order/${item.id}`)} style={styles.trackBtn} testID={`track-${item.id}`}>
                  <Text style={styles.trackBtnText}>Track</Text>
                  <Feather name="chevron-right" size={14} color={colors.white} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  title: { ...t.h3, fontStyle: 'italic' },
  orderCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  orderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { ...t.body, fontWeight: '700' },
  orderDate: { ...t.small, color: colors.dust, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  thumbRow: { flexDirection: 'row', gap: 6 },
  thumb: { width: 42, height: 42, borderRadius: radius.sm, backgroundColor: colors.cream },
  moreThumb: { width: 42, height: 42, borderRadius: radius.sm, backgroundColor: colors.saffronTint, alignItems: 'center', justifyContent: 'center' },
  moreText: { color: colors.saffronDark, fontWeight: '700' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { fontWeight: '700', color: colors.earth },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.saffronTint, borderRadius: radius.pill },
  smallBtnText: { color: colors.saffronDark, fontWeight: '700', fontSize: 12 },
  trackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.earth, borderRadius: radius.pill },
  trackBtnText: { color: colors.white, fontWeight: '700', fontSize: 12 },
});
