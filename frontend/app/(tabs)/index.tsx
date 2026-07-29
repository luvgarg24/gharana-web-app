import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { colors, radius, spacing, fonts, type as t } from '@/src/theme/tokens';
import { CatalogAPI, DeliveryAPI } from '@/src/api/client';
import { ProductCard } from '@/src/components/ProductCard';
import { TrustTicker } from '@/src/components/TrustTicker';
import { ETAPill } from '@/src/components/ETAPill';
import { useAuth } from '@/src/context/AuthContext';
import { catImage, collections } from '@/src/theme/catalogAssets';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [cats, setCats] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [fresh, setFresh] = useState<any[]>([]);
  const [pincode] = useState('560001');
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

  const onRefresh = async () => { setRefreshing(true); await load().catch(() => {}); setRefreshing(false); };

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : '';

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="home-screen">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.saffronDark} />}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.brandRow}>
              <Text style={styles.brand}>Gharana</Text>
              <View style={styles.brandDot} />
              <ETAPill minutes={zone?.eta_minutes ?? 28} label={zone?.express_available === false ? 'Standard' : 'Express'} />
            </View>
            <Pressable style={styles.locRow} onPress={() => router.push('/addresses')} testID="home-location">
              <Feather name="map-pin" size={13} color={colors.saffronDark} />
              <Text style={styles.locText} numberOfLines={1}>Home · Delivering to {pincode}</Text>
              <Feather name="chevron-down" size={15} color={colors.dust} />
            </Pressable>
          </View>
          <Pressable style={styles.avatar} onPress={() => router.push('/(tabs)/account')} testID="home-avatar">
            <Text style={styles.avatarText}>{(firstName || 'G').charAt(0).toUpperCase()}</Text>
          </Pressable>
        </View>

        {/* Search */}
        <Pressable style={styles.searchBar} onPress={() => router.push('/search')} testID="home-search-bar">
          <Feather name="search" size={17} color={colors.dust} />
          <Text style={styles.searchText}>Search chakki atta, ghee, dals…</Text>
          <View style={styles.micBadge}><Feather name="mic" size={13} color={colors.saffronDark} /></View>
        </Pressable>

        <TrustTicker />

        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d' }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(36, 26, 16, 0.15)', 'rgba(36, 26, 16, 0.55)', 'rgba(36, 26, 16, 0.92)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroBody}>
            <View style={styles.heroChip}>
              <View style={styles.heroChipDot} />
              <Text style={styles.heroChipText}>NO ADULTERATION · SINCE ALWAYS</Text>
            </View>
            <Text style={styles.heroTitle}>Ghar jaisi{'\n'}shuddhata.</Text>
            <Text style={styles.heroSub}>Stone-ground, cold-pressed, hand-cleaned. Nothing stripped away.</Text>
            <Pressable onPress={() => router.push('/(tabs)/categories')} style={styles.heroCta} testID="hero-cta">
              <Text style={styles.heroCtaText}>Shop the pantry</Text>
              <Feather name="arrow-right" size={15} color={colors.earth} />
            </Pressable>
          </View>
        </View>

        {/* Categories */}
        <SectionHeader title="Shop by tradition" caption="Everything a real Indian kitchen needs" onSeeAll={() => router.push('/(tabs)/categories')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {cats.map((c) => (
            <Pressable
              key={c.id}
              testID={`cat-${c.slug}`}
              onPress={() => router.push(`/category/${c.slug}`)}
              style={styles.catCard}
            >
              <View style={styles.catImageWrap}>
                <Image source={{ uri: catImage(c.slug) }} style={styles.catImage} contentFit="cover" transition={200} />
              </View>
              <Text style={styles.catName} numberOfLines={1}>{c.name}</Text>
              <Text style={styles.catHindi} numberOfLines={1}>{c.hindi}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Collections strip */}
        <SectionHeader title="Curated collections" caption="Picked by the Gharana family" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collRow}>
          {collections.map((col) => (
            <Pressable
              key={col.key}
              testID={`collection-${col.key}`}
              style={styles.collCard}
              onPress={() => router.push(`/category/${col.slug}`)}
            >
              <Image source={{ uri: col.image }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
              <LinearGradient colors={['rgba(36,26,16,0.05)', 'rgba(36,26,16,0.85)']} style={StyleSheet.absoluteFillObject} />
              <View style={styles.collBody}>
                <Text style={styles.collLabel}>{col.label}</Text>
                <Text style={styles.collCaption}>{col.caption}</Text>
              </View>
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
          <Image
            source={{ uri: 'https://images.pexels.com/photos/20689446/pexels-photo-20689446.jpeg' }}
            style={styles.thaliImg}
            contentFit="cover"
          />
          <View style={styles.thaliInfo}>
            <Text style={styles.thaliLabel}>BUILD YOUR THALI</Text>
            <Text style={styles.thaliTitle}>A week of{'\n'}ghar-ka-khana</Text>
            <Text style={styles.thaliBody}>Atta · Toor dal · Basmati · Ghee · Turmeric — bundled at ₹899.</Text>
            <Pressable style={styles.thaliBtn} onPress={() => router.push('/(tabs)/categories')} testID="thali-cta">
              <Text style={styles.thaliBtnText}>Assemble mine</Text>
              <Feather name="arrow-right" size={14} color={colors.earth} />
            </Pressable>
          </View>
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
          <Feather name="award" size={15} color={colors.jade} />
          <Text style={styles.footerText}>Every batch lab-tested. Every promise honoured.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, caption, onSeeAll }: { title: string; caption?: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.section}>
      <View style={{ flex: 1 }}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionRule} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {caption && <Text style={styles.sectionCaption}>{caption}</Text>}
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAll}>
          <Text style={styles.seeAllText}>All</Text>
          <Feather name="arrow-right" size={13} color={colors.saffronDark} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.earth, letterSpacing: 0.3 },
  brandDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.saffron },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  locText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.espresso, maxWidth: 220 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.earth,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.cream, fontFamily: fonts.displayBold, fontSize: 17 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: spacing.xl, marginTop: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: 13,
    backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
  },
  searchText: { flex: 1, color: colors.dust, fontFamily: fonts.body, fontSize: 13.5 },
  micBadge: { padding: 5, backgroundColor: colors.saffronTint, borderRadius: radius.pill },
  hero: {
    marginTop: spacing.lg, marginHorizontal: spacing.xl,
    height: 268, borderRadius: radius.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  heroBody: { flex: 1, padding: spacing.xl, justifyContent: 'flex-end' },
  heroChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,254,251,0.16)', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill, marginBottom: 12,
  },
  heroChipDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.goldSoft },
  heroChipText: { fontFamily: fonts.bodySemibold, fontSize: 8.5, letterSpacing: 1.4, color: colors.cream },
  heroTitle: { fontFamily: fonts.displayItalic, fontSize: 40, color: colors.white, lineHeight: 42 },
  heroSub: { color: colors.cream, fontFamily: fonts.body, fontSize: 12.5, marginTop: 8, opacity: 0.9, lineHeight: 18, maxWidth: 280 },
  heroCta: {
    flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
    backgroundColor: colors.cream, paddingHorizontal: 18, paddingVertical: 11, borderRadius: radius.pill, marginTop: spacing.lg,
  },
  heroCtaText: { color: colors.earth, fontFamily: fonts.bodyBold, fontSize: 13 },
  section: {
    paddingHorizontal: spacing.xl, marginTop: spacing.xxl, marginBottom: spacing.md,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionRule: { width: 20, height: 2, borderRadius: 1, backgroundColor: colors.saffron },
  sectionTitle: { ...t.h3 },
  sectionCaption: { ...t.small, color: colors.dust, marginTop: 3, marginLeft: 29 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingTop: 4 },
  seeAllText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.saffronDark },
  catRow: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  catCard: { width: 78, alignItems: 'center' },
  catImageWrap: {
    width: 72, height: 72, borderRadius: 20, overflow: 'hidden',
    backgroundColor: colors.creamDeep, borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  catImage: { width: '100%', height: '100%' },
  catName: { fontFamily: fonts.bodySemibold, fontSize: 11.5, color: colors.earth, textAlign: 'center' },
  catHindi: { fontFamily: fonts.body, fontSize: 10, color: colors.dust, marginTop: 1 },
  collRow: { paddingHorizontal: spacing.xl, gap: spacing.md },
  collCard: {
    width: 170, height: 190, borderRadius: radius.xl, overflow: 'hidden',
    justifyContent: 'flex-end', borderWidth: 1, borderColor: colors.border,
  },
  collBody: { padding: spacing.lg },
  collLabel: { fontFamily: fonts.display, fontSize: 18, color: colors.white, lineHeight: 22 },
  collCaption: { fontFamily: fonts.body, fontSize: 11, color: colors.cream, opacity: 0.9, marginTop: 3 },
  hRow: { paddingHorizontal: spacing.xl, gap: spacing.md },
  hCardWrap: { width: 172 },
  thali: {
    marginTop: spacing.xxl, marginHorizontal: spacing.xl,
    backgroundColor: colors.earth, borderRadius: radius.xl, overflow: 'hidden', flexDirection: 'row',
  },
  thaliImg: { width: 120, height: '100%' },
  thaliInfo: { flex: 1, padding: spacing.xl },
  thaliLabel: { color: colors.goldSoft, fontFamily: fonts.bodySemibold, fontSize: 9.5, letterSpacing: 1.6 },
  thaliTitle: { color: colors.white, fontFamily: fonts.displayBold, fontSize: 23, lineHeight: 27, marginTop: 8 },
  thaliBody: { color: colors.cream, opacity: 0.82, marginTop: 8, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  thaliBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: spacing.lg,
    backgroundColor: colors.goldSoft, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill,
  },
  thaliBtnText: { color: colors.earth, fontFamily: fonts.bodyBold, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl, gap: spacing.md, marginTop: spacing.sm },
  gridItem: { width: '48%' },
  footerNote: { flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xxl, padding: spacing.lg },
  footerText: { color: colors.dust, fontFamily: fonts.displayItalic, fontSize: 13 },
});
