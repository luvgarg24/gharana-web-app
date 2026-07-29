import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, fonts, type as t } from '@/src/theme/tokens';
import { CatalogAPI } from '@/src/api/client';
import { ProductCard } from '@/src/components/ProductCard';
import { catImage } from '@/src/theme/catalogAssets';

export default function CategoriesScreen() {
  const router = useRouter();
  const [cats, setCats] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    CatalogAPI.categories().then((c: any) => {
      setCats(c);
      if (c.length) setActive(c[0].slug);
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    CatalogAPI.products({ category: active }).then((p: any) => setProducts(p)).finally(() => setLoading(false));
  }, [active]);

  const activeCat = cats.find((c) => c.slug === active);

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="categories-screen">
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>THE GHARANA PANTRY</Text>
          <Text style={styles.title}>Shop by shelf</Text>
        </View>
        <Pressable onPress={() => router.push('/search')} style={styles.searchBtn} testID="cat-search-btn">
          <Feather name="search" size={19} color={colors.earth} />
        </Pressable>
      </View>

      <View style={styles.bodyRow}>
        {/* Left rail */}
        <ScrollView
          style={styles.rail}
          contentContainerStyle={{ paddingVertical: spacing.sm, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {cats.map((c) => {
            const on = c.slug === active;
            return (
              <Pressable
                key={c.slug}
                testID={`chip-${c.slug}`}
                onPress={() => setActive(c.slug)}
                style={[styles.railItem, on && styles.railItemActive]}
              >
                {on && <View style={styles.railBar} />}
                <View style={[styles.railThumb, on && styles.railThumbActive]}>
                  <Image source={{ uri: catImage(c.slug) }} style={styles.railImg} contentFit="cover" />
                </View>
                <Text style={[styles.railText, on && styles.railTextActive]} numberOfLines={2}>{c.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Right grid */}
        <View style={styles.gridWrap}>
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: spacing.sm }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.gridHeader}>
                <Text style={styles.gridTitle}>{activeCat?.name || 'Products'}</Text>
                <Text style={styles.gridCount}>
                  {activeCat?.hindi ? `${activeCat.hindi} · ` : ''}{products.length} item{products.length === 1 ? '' : 's'}
                </Text>
              </View>
            }
            contentContainerStyle={{ paddingHorizontal: spacing.sm, paddingTop: spacing.sm, paddingBottom: 130, gap: spacing.sm }}
            renderItem={({ item }) => <View style={{ flex: 1 }}><ProductCard product={item} /></View>}
            ListEmptyComponent={
              <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
                <Feather name="package" size={30} color={colors.dustLight} />
                <Text style={styles.emptyText}>{loading ? 'Loading the shelf…' : 'Nothing here yet.'}</Text>
              </View>
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const RAIL_W = 84;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: {
    paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  eyebrow: { fontFamily: fonts.bodySemibold, fontSize: 9.5, letterSpacing: 1.6, color: colors.saffronDark, marginBottom: 3 },
  title: { ...t.h2 },
  searchBtn: {
    width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  bodyRow: { flex: 1, flexDirection: 'row' },
  rail: { width: RAIL_W, flexGrow: 0, flexShrink: 0, backgroundColor: colors.creamDeep, borderRightWidth: 1, borderRightColor: colors.border },
  railItem: { width: RAIL_W, paddingVertical: 12, alignItems: 'center', gap: 6, position: 'relative' },
  railItemActive: { backgroundColor: colors.cream },
  railBar: { position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3, backgroundColor: colors.saffron },
  railThumb: {
    width: 50, height: 50, borderRadius: 16, overflow: 'hidden',
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, opacity: 0.75,
  },
  railThumbActive: { opacity: 1, borderColor: colors.saffron, borderWidth: 1.5 },
  railImg: { width: '100%', height: '100%' },
  railText: { width: RAIL_W - 10, fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.dust, textAlign: 'center', lineHeight: 13 },
  railTextActive: { color: colors.earth, fontFamily: fonts.bodySemibold },
  gridWrap: { flex: 1, minWidth: 0 },
  gridHeader: { paddingHorizontal: spacing.xs, paddingTop: spacing.xs, paddingBottom: spacing.sm },
  gridTitle: { ...t.h4, fontSize: 18 },
  gridCount: { fontFamily: fonts.body, fontSize: 11.5, color: colors.dust, marginTop: 2 },
  emptyText: { color: colors.dust, fontFamily: fonts.body, marginTop: 10 },
});
