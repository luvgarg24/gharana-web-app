import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { colors, radius, spacing, type as t } from '@/src/theme/tokens';
import { CatalogAPI } from '@/src/api/client';
import { ProductCard } from '@/src/components/ProductCard';

const SORTS = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'price_asc', label: 'Price ↑' },
  { key: 'price_desc', label: 'Price ↓' },
  { key: 'rating', label: 'Top rated' },
];

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [sort, setSort] = useState('relevance');
  const [cat, setCat] = useState<any | null>(null);

  useEffect(() => {
    if (!slug) return;
    CatalogAPI.products({ category: slug, sort }).then(setProducts);
  }, [slug, sort]);

  useEffect(() => {
    if (!slug) return;
    CatalogAPI.categories().then((cs: any) => setCat((cs || []).find((c: any) => c.slug === slug)));
  }, [slug]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="category-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="cat-back"><Feather name="arrow-left" size={20} color={colors.earth} /></Pressable>
        <Text style={styles.title}>{cat?.name || 'Category'}</Text>
        <Pressable onPress={() => router.push('/search')}><Feather name="search" size={20} color={colors.earth} /></Pressable>
      </View>

      <View style={styles.sortWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          {SORTS.map((s) => (
            <Pressable key={s.key} onPress={() => setSort(s.key)} style={[styles.chip, sort === s.key && styles.chipActive]} testID={`sort-${s.key}`}>
              <Text style={[styles.chipText, sort === s.key && styles.chipTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: 120 }}
        renderItem={({ item }) => <View style={{ flex: 1 }}><ProductCard product={item} testPrefix="category" /></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  title: { ...t.h3, fontStyle: 'italic' },
  sortWrap: { height: 56, borderBottomWidth: 1, borderBottomColor: colors.border, justifyContent: 'center' },
  sortRow: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chipActive: { backgroundColor: colors.earth, borderColor: colors.earth },
  chipText: { color: colors.earth, fontWeight: '600', fontSize: 12 },
  chipTextActive: { color: colors.white },
});
