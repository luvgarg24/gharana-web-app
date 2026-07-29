import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { colors, radius, spacing, type as t, shadow } from '@/src/theme/tokens';
import { CatalogAPI, DeliveryAPI } from '@/src/api/client';
import { ProductCard } from '@/src/components/ProductCard';
import { TrustTicker } from '@/src/components/TrustTicker';
import { ETAPill } from '@/src/components/ETAPill';
import { useAuth } from '@/src/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [cats, setCats] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [fresh, setFresh] = useState<any[]>([]);
  const [pincode, setPincode] = useState('560001');
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
  useEffect(() => { DeliveryAPI.check(pincode).then(setZone).catch(() => setZone(null)); }, [pincode]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="home-screen">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.saffronDark} />}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hi}>Namaste{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="map-pin" size={12} color={colors.dust} />
              <Text style={styles.pin}>Delivering to {pincode}</Text>
            </View>
          </View>
          <ETAPill minutes={zone?.eta_minutes ?? 28} label={zone?.express_available === false ? 'Standard' : 'Delivering'} />
        </View>

        <Pressable style={styles.searchBar} onPress={() => router.push('/search')} testID="home-search-bar">
          <Feather name="search" size={16} color={colors.dust} />
          <Text style={styles.searchText}>Search chakki atta, ghee, dals…</Text>
          <View style={styles.micBadge}><Feather name="mic" size={13} color={colors.saffronDark} /></View>
        </Pressable>

        <TrustTicker />

        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/54084/wheat-grain-agriculture-seed-54084.jpeg' }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(245, 240, 232, 0.35)', 'rgba(44, 24, 16, 0.85)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroBody}>
            <Text style={styles.heroLabel}>NO ADULTERATION · SINCE ALWAYS</Text>
            <Text style={styles.heroTitle}>Ghar jaisi{'\n'}shuddhata.</Text>
            <Text style={styles.heroSub}>No shortcuts. No fillers. Just real.</Text>
            <Pressable onPress={() => router.push('/(tabs)/categories')} style={styles.heroCta} testID="hero-cta">
              <Text style={styles.heroCtaText}>Shop the pantry</Text>
              <Feather name="arrow-right" size={16} color={colors.earth} />
            </Pressable>
          </View>
        </View>

        {/* Categories */}
        <SectionHeader title="Shop by tradition" caption="Everything a real Indian kitchen needs" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {cats.map((c) => (
            <Pressable
              key={c.id}
              testID={`cat-${c.slug}`}
              onPress={() => router.push(`/category/${c.slug}`)}
              style={styles.catCard}
            >
              <View style={styles.catIcon}>
                <Feather name={c.icon} size={22} color={colors.saffronDark} />
              </View>
              <Text style={styles.catName}>{c.name}</Text>
              <Text style={styles.catHindi}>{c.hindi}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Featured */}
        <SectionHeader title="Gharana Specials" caption="This season's most cherished" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
          {featured.map((p) => (
            <View key={p.id} style={styles.hCardWrap}>
              <ProductCard product={p} />
            </View>
          ))}
        </ScrollView>

        {/* Build Your Thali */}
        <View style={styles.thali}>
          <Text style={styles.thaliLabel}>BUILD YOUR THALI</Text>
          <Text style={styles.thaliTitle}>A week of ghar-ka-khana</Text>
          <Text style={styles.thaliBody}>Atta · Toor dal · Basmati · Ghee · Turmeric — bundled at ₹899.</Text>
          <Pressable style={styles.thaliBtn} onPress={() => router.push('/(tabs)/categories')} testID="thali-cta">
            <Text style={styles.thaliBtnText}>Assemble mine</Text>
            <Feather name="arrow-right" size={14} color={colors.white} />
          </Pressable>
        </View>

        {/* Fresh this week */}
        <SectionHeader title="Fresh this week" caption="Milled, pressed, cleaned — this Monday" />
        <View style={styles.grid}>
          {fresh.map((p) => (
            <View key={p.id} style={styles.gridItem}>
              <ProductCard product={p} />
            </View>
          ))}
        </View>

        <View style={styles.footerNote}>
          <Feather name="award" size={14} color={colors.jade} />
          <Text style={styles.footerText}>Every batch lab-tested. Every promise honoured.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, caption }: { title: string; caption?: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {caption && <Text style={styles.sectionCaption}>{caption}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hi: { ...t.h4, fontSize: 20 },
  pin: { ...t.small, color: colors.dust },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.xl, marginTop: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: 12,
    backgroundColor: colors.white, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
  },
  searchText: { flex: 1, color: colors.dust, fontSize: 13 },
  micBadge: { padding: 4, backgroundColor: colors.saffronTint, borderRadius: radius.pill },
  hero: {
    marginTop: spacing.lg, marginHorizontal: spacing.xl,
    height: 240, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card,
  },
  heroBody: { flex: 1, padding: spacing.xl, justifyContent: 'flex-end' },
  heroLabel: { fontSize: 9.5, letterSpacing: 2, color: colors.saffron, fontWeight: '700', marginBottom: 8 },
  heroTitle: { fontFamily: 'Georgia', fontSize: 36, color: colors.white, fontWeight: '700', lineHeight: 40, fontStyle: 'italic' },
  heroSub: { color: colors.white, fontSize: 13, marginTop: 6, opacity: 0.85 },
  heroCta: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.cream, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, marginTop: spacing.md },
  heroCtaText: { color: colors.earth, fontWeight: '700', fontSize: 13 },
  section: { paddingHorizontal: spacing.xl, marginTop: spacing.xxl, marginBottom: spacing.md },
  sectionTitle: { ...t.h3, fontStyle: 'italic' },
  sectionCaption: { ...t.small, color: colors.dust, marginTop: 2 },
  catRow: { paddingHorizontal: spacing.xl, gap: spacing.md },
  catCard: {
    width: 96, alignItems: 'center', padding: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  catIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.saffronTint, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  catName: { fontSize: 12, fontWeight: '600', color: colors.earth, textAlign: 'center' },
  catHindi: { fontSize: 10, color: colors.dust, marginTop: 2 },
  hRow: { paddingHorizontal: spacing.xl, gap: spacing.md },
  hCardWrap: { width: 220 },
  thali: {
    marginTop: spacing.xxl, marginHorizontal: spacing.xl,
    padding: spacing.xl, backgroundColor: colors.earth, borderRadius: radius.lg,
  },
  thaliLabel: { color: colors.saffron, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  thaliTitle: { color: colors.white, fontFamily: 'Georgia', fontSize: 26, fontWeight: '700', marginTop: 8, fontStyle: 'italic' },
  thaliBody: { color: colors.cream, opacity: 0.85, marginTop: 6, fontSize: 13, lineHeight: 20 },
  thaliBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: spacing.lg, backgroundColor: colors.saffron, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill },
  thaliBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl, gap: spacing.md, marginTop: spacing.sm },
  gridItem: { width: '48%' },
  footerNote: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xxl, padding: spacing.lg },
  footerText: { color: colors.dust, fontSize: 12, fontStyle: 'italic' },
});
