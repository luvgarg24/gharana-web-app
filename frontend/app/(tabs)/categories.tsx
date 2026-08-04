import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { CatalogAPI } from '@/src/api/client';
import { ProductCard } from '@/src/components/ProductCard';
import { FloatingCartBar } from '@/src/components/FloatingCartBar';
import { catImage } from '@/src/theme/catalogAssets';
import { colors, fonts, radius, spacing } from '@/src/theme/tokens';

export default function CategoriesScreen() {
  const router = useRouter();
  const [cats, setCats] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    CatalogAPI.categories().then((rows: any) => {
      setCats(rows);
      if (rows.length) setActive(rows[0].slug);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    CatalogAPI.products({ category: active })
      .then((rows: any) => setProducts(rows))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [active]);

  const activeCat = cats.find((c) => c.slug === active);

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="categories-screen">
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>GHARANA PANTRY</Text>
          <Text style={styles.title} testID="categories-title">All categories</Text>
        </View>
        <Pressable onPress={() => router.push('/search')} style={styles.searchBtn} testID="cat-search-btn">
          <Feather name="search" size={20} color={colors.earth} />
        </Pressable>
      </View>

      <View style={styles.searchHint}>
        <Feather name="search" size={16} color={colors.dust} />
        <Text style={styles.searchHintText}>Search in {activeCat?.name || 'Gharana'}</Text>
      </View>

      <View style={styles.bodyRow}>
        <ScrollView style={styles.rail} contentContainerStyle={styles.railContent} showsVerticalScrollIndicator={false}>
          {cats.map((c) => {
            const selected = c.slug === active;
            return (
              <Pressable
                key={c.slug}
                testID={`chip-${c.slug}`}
                onPress={() => setActive(c.slug)}
                style={[styles.railItem, selected && styles.railItemActive]}
              >
                {selected && <View style={styles.railBar} />}
                <View style={[styles.railImageWrap, selected && styles.railImageActive]}>
                  <Image source={{ uri: catImage(c.slug) }} style={styles.railImage} contentFit="cover" />
                </View>
                <Text style={[styles.railText, selected && styles.railTextActive]} numberOfLines={2}>{c.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.catalog}>
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columns}
            contentContainerStyle={styles.catalogContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.catalogHeader}>
                <View>
                  <Text style={styles.catalogTitle} testID="active-category-title">{activeCat?.name || 'Products'}</Text>
                  <Text style={styles.catalogCount} testID="active-category-count">{products.length} products</Text>
                </View>
                <View style={styles.fastBadge}><Feather name="zap" size={11} color={colors.jade} /><Text style={styles.fastText}>10 min</Text></View>
              </View>
            }
            renderItem={({ item }) => <View style={styles.product}><ProductCard product={item} /></View>}
            ListEmptyComponent={
              <View style={styles.empty}>
                {loading ? <ActivityIndicator color={colors.saffron} /> : <Feather name="package" size={30} color={colors.dustLight} />}
                <Text style={styles.emptyText}>{loading ? 'Loading products…' : 'No products found'}</Text>
              </View>
            }
          />
        </View>
      </View>
      <FloatingCartBar />
    </SafeAreaView>
  );
}

const RAIL_WIDTH = 78;
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm, backgroundColor: colors.white },
  kicker: { color: colors.saffron, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1 },
  title: { color: colors.earth, fontFamily: fonts.bodyBold, fontSize: 23, letterSpacing: -0.6, marginTop: 2 },
  searchBtn: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.creamDeep },
  searchHint: { height: 42, flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: colors.creamDeep, borderWidth: 1, borderColor: colors.border },
  searchHintText: { color: colors.dust, fontFamily: fonts.body, fontSize: 12 },
  bodyRow: { flex: 1, flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border },
  rail: { width: RAIL_WIDTH, flexGrow: 0, flexShrink: 0, backgroundColor: '#F0F0F2', borderRightWidth: 1, borderRightColor: colors.border },
  railContent: { paddingBottom: 130 },
  railItem: { width: RAIL_WIDTH, minHeight: 92, paddingVertical: 9, alignItems: 'center', position: 'relative' },
  railItemActive: { backgroundColor: colors.white },
  railBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.saffron, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  railImageWrap: { width: 48, height: 48, borderRadius: 13, overflow: 'hidden', backgroundColor: colors.white, opacity: 0.72 },
  railImageActive: { opacity: 1, borderWidth: 1.5, borderColor: colors.saffron },
  railImage: { width: '100%', height: '100%' },
  railText: { width: 68, color: colors.dust, fontFamily: fonts.bodyMedium, fontSize: 9.5, lineHeight: 12.5, textAlign: 'center', marginTop: 6 },
  railTextActive: { color: colors.earth, fontFamily: fonts.bodyBold },
  catalog: { flex: 1, minWidth: 0, backgroundColor: colors.white },
  catalogContent: { paddingHorizontal: spacing.sm, paddingBottom: 150 },
  columns: { gap: spacing.sm },
  catalogHeader: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catalogTitle: { color: colors.earth, fontFamily: fonts.bodyBold, fontSize: 16, letterSpacing: -0.25 },
  catalogCount: { color: colors.dust, fontFamily: fonts.body, fontSize: 10.5, marginTop: 2 },
  fastBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.jadeTint, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 7 },
  fastText: { color: colors.jade, fontFamily: fonts.bodyBold, fontSize: 9.5 },
  product: { width: '48.6%', flexGrow: 0, marginBottom: spacing.sm },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { color: colors.dust, fontFamily: fonts.bodyMedium, fontSize: 12, marginTop: spacing.sm },
});