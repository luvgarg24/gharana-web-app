import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { CatalogAPI, DeliveryAPI } from '@/src/api/client';
import { ProductCard } from '@/src/components/ProductCard';
import { FloatingCartBar } from '@/src/components/FloatingCartBar';
import { useAuth } from '@/src/context/AuthContext';
import { catImage } from '@/src/theme/catalogAssets';
import { colors, fonts, radius, spacing } from '@/src/theme/tokens';

const BENEFITS = [
  { icon: 'shield', title: 'Lab tested', copy: 'Every batch' },
  { icon: 'refresh-cw', title: 'Easy returns', copy: 'No questions' },
  { icon: 'truck', title: 'Fast delivery', copy: 'At your door' },
] as const;

export default function Home() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [cats, setCats] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [fresh, setFresh] = useState<any[]>([]);
  const [zone, setZone] = useState<{ express_available: boolean; eta_minutes: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [c, f, fr] = await Promise.all([
      CatalogAPI.categories(),
      CatalogAPI.products({ featured: true, limit: 8 }),
      CatalogAPI.products({ sort: 'newest', limit: 10 }),
    ]);
    setCats(c as any[]);
    setFeatured(f as any[]);
    setFresh(fr as any[]);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);
  useEffect(() => { DeliveryAPI.check('560001').then(setZone).catch(() => setZone(null)); }, []);

  const cardWidth = Math.min(154, Math.max(142, width * 0.39));
  const onRefresh = async () => { setRefreshing(true); await load().catch(() => {}); setRefreshing(false); };

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="home-screen">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.saffron} />}
      >
        <View style={styles.header} testID="home-header">
          <View style={styles.deliveryRow}>
            <View style={styles.deliveryCopy}>
              <Text style={styles.etaLabel}>DELIVERY IN</Text>
              <Text style={styles.eta} testID="home-delivery-eta">{zone?.eta_minutes ?? 28} minutes</Text>
              <Pressable style={styles.location} onPress={() => router.push('/addresses')} testID="home-location">
                <Text style={styles.locationText} numberOfLines={1}>Home · Bengaluru 560001</Text>
                <Feather name="chevron-down" size={14} color={colors.earth} />
              </Pressable>
            </View>
            <Pressable style={styles.avatar} onPress={() => router.push('/(tabs)/account')} testID="home-avatar">
              <Text style={styles.avatarText}>{(user?.full_name || 'G').charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>

          <Pressable style={styles.search} onPress={() => router.push('/search')} testID="home-search-bar">
            <Feather name="search" size={19} color={colors.dust} />
            <Text style={styles.searchText}>Search for atta, dal, ghee...</Text>
            <View style={styles.searchRule} />
            <Feather name="mic" size={18} color={colors.saffron} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoRow}>
          <Pressable style={[styles.promo, styles.promoOrange]} onPress={() => router.push('/(tabs)/categories')} testID="promo-purity">
            <View style={styles.promoCopy}>
              <Text style={styles.promoKicker}>GHARANA QUALITY</Text>
              <Text style={styles.promoTitle}>Pure pantry,{`\n`}delivered fast.</Text>
              <View style={styles.promoButton}><Text style={styles.promoButtonText}>SHOP NOW</Text></View>
            </View>
            <View style={styles.promoIcon}><Feather name="award" size={34} color={colors.saffron} /></View>
          </Pressable>
          <Pressable style={[styles.promo, styles.promoGreen]} onPress={() => router.push('/subscriptions')} testID="promo-subscription">
            <View style={styles.promoCopy}>
              <Text style={[styles.promoKicker, { color: colors.jade }]}>NEVER RUN OUT</Text>
              <Text style={styles.promoTitle}>Weekly staples,{`\n`}sorted.</Text>
              <View style={[styles.promoButton, { backgroundColor: colors.jade }]}><Text style={styles.promoButtonText}>SET A PLAN</Text></View>
            </View>
            <View style={[styles.promoIcon, { backgroundColor: colors.jadeTint }]}><Feather name="repeat" size={32} color={colors.jade} /></View>
          </Pressable>
        </ScrollView>

        <SectionHeader title="Shop by category" action="See all" onPress={() => router.push('/(tabs)/categories')} />
        <View style={styles.categoryGrid}>
          {cats.slice(0, 8).map((c) => (
            <Pressable key={c.slug} style={styles.category} onPress={() => router.push(`/category/${c.slug}`)} testID={`cat-${c.slug}`}>
              <View style={styles.categoryImageWrap}>
                <Image source={{ uri: catImage(c.slug) }} style={styles.categoryImage} contentFit="cover" transition={160} />
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>{c.name}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.offerStrip} testID="first-order-offer">
          <View style={styles.offerIcon}><Feather name="percent" size={18} color={colors.saffron} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.offerTitle}>₹100 off on your first pantry order</Text>
            <Text style={styles.offerSub}>Use code FIRSTBOX above ₹499</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.saffron} />
        </View>

        <SectionHeader title="Bestsellers near you" subtitle="Loved by Gharana homes" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsRow}>
          {featured.map((p) => <View key={p.id} style={{ width: cardWidth }}><ProductCard product={p} testPrefix="home-best" /></View>)}
        </ScrollView>

        <SectionHeader title="Fresh pantry picks" subtitle="Milled and packed recently" />
        <View style={styles.productGrid}>
          {fresh.slice(0, 6).map((p) => <View key={p.id} style={styles.gridItem}><ProductCard product={p} testPrefix="home-fresh" /></View>)}
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((item) => (
            <View key={item.title} style={styles.benefit}>
              <Feather name={item.icon} size={18} color={colors.jade} />
              <Text style={styles.benefitTitle}>{item.title}</Text>
              <Text style={styles.benefitCopy}>{item.copy}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <FloatingCartBar testPrefix="home" />
    </SafeAreaView>
  );
}

function SectionHeader({ title, subtitle, action, onPress }: { title: string; subtitle?: string; action?: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {!!action && <Pressable onPress={onPress} style={styles.seeAll} testID={`section-${action.toLowerCase().replace(' ', '-')}`}><Text style={styles.seeAllText}>{action}</Text><Feather name="chevron-right" size={16} color={colors.saffron} /></Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { paddingBottom: 160 },
  header: { backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  deliveryCopy: { flex: 1 },
  etaLabel: { color: colors.saffronDark, fontFamily: fonts.bodyBold, fontSize: 9.5, letterSpacing: 1 },
  eta: { color: colors.earth, fontFamily: fonts.bodyBold, fontSize: 22, letterSpacing: -0.6, marginTop: 1 },
  location: { minHeight: 28, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 3 },
  locationText: { maxWidth: 240, color: colors.dust, fontFamily: fonts.bodyMedium, fontSize: 11.5 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.earth },
  avatarText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 16 },
  search: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.creamDeep, borderWidth: 1, borderColor: colors.border },
  searchText: { flex: 1, color: colors.dust, fontFamily: fonts.body, fontSize: 13 },
  searchRule: { width: 1, height: 22, backgroundColor: colors.border },
  promoRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  promo: { width: 310, height: 160, borderRadius: radius.lg, padding: spacing.lg, flexDirection: 'row', overflow: 'hidden' },
  promoOrange: { backgroundColor: '#FFF0E5' },
  promoGreen: { backgroundColor: '#EAF7EF' },
  promoCopy: { flex: 1, zIndex: 2 },
  promoKicker: { color: colors.saffronDark, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 0.9 },
  promoTitle: { color: colors.earth, fontFamily: fonts.bodyBold, fontSize: 22, lineHeight: 28, letterSpacing: -0.5, marginTop: 7 },
  promoButton: { alignSelf: 'flex-start', backgroundColor: colors.saffron, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7, marginTop: 12 },
  promoButtonText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 0.5 },
  promoIcon: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', backgroundColor: colors.white },
  sectionHeader: { paddingHorizontal: spacing.lg, marginTop: spacing.xxl, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { color: colors.earth, fontFamily: fonts.bodyBold, fontSize: 18, letterSpacing: -0.35 },
  sectionSubtitle: { color: colors.dust, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  seeAll: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  seeAllText: { color: colors.saffron, fontFamily: fonts.bodyBold, fontSize: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md },
  category: { width: '25%', alignItems: 'center', paddingHorizontal: 5, marginBottom: 15 },
  categoryImageWrap: { width: '100%', aspectRatio: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  categoryImage: { width: '100%', height: '100%' },
  categoryName: { height: 31, color: colors.earth, fontFamily: fonts.bodySemibold, fontSize: 10.5, lineHeight: 14, textAlign: 'center', marginTop: 6 },
  offerStrip: { marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 },
  offerIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.saffronTint, alignItems: 'center', justifyContent: 'center' },
  offerTitle: { color: colors.earth, fontFamily: fonts.bodySemibold, fontSize: 12.5 },
  offerSub: { color: colors.dust, fontFamily: fonts.body, fontSize: 10.5, marginTop: 2 },
  productsRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg },
  gridItem: { width: '48.8%' },
  benefits: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.xxl, paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  benefit: { flex: 1, alignItems: 'center' },
  benefitTitle: { color: colors.earth, fontFamily: fonts.bodySemibold, fontSize: 10.5, marginTop: 6 },
  benefitCopy: { color: colors.dust, fontFamily: fonts.body, fontSize: 9.5, marginTop: 1 },
});