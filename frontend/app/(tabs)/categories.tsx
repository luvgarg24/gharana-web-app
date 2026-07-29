import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, type as t } from '@/src/theme/tokens';
import { CatalogAPI } from '@/src/api/client';
import { ProductCard } from '@/src/components/ProductCard';

export default function CategoriesScreen() {
  const router = useRouter();
  const [cats, setCats] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    CatalogAPI.categories().then((c: any) => {
      setCats(c);
      if (c.length && !active) setActive(c[0].slug);
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    CatalogAPI.products({ category: active }).then((p: any) => setProducts(p)).finally(() => setLoading(false));
  }, [active]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="categories-screen">
      <View style={styles.header}>
        <Text style={styles.title}>The Pantry</Text>
        <Pressable onPress={() => router.push('/search')} testID="cat-search-btn">
          <Feather name="search" size={20} color={colors.earth} />
        </Pressable>
      </View>

      <View style={styles.chipsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {cats.map((c) => (
            <Pressable
              key={c.slug}
              testID={`chip-${c.slug}`}
              onPress={() => setActive(c.slug)}
              style={[styles.chip, active === c.slug && styles.chipActive]}
            >
              <Text style={[styles.chipText, active === c.slug && styles.chipTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.md, paddingBottom: 120, gap: spacing.md }}
        renderItem={({ item }) => <View style={{ flex: 1 }}><ProductCard product={item} /></View>}
        ListEmptyComponent={
          <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
            <Feather name="package" size={32} color={colors.dust} />
            <Text style={{ color: colors.dust, marginTop: 8 }}>{loading ? 'Loading…' : 'No products in this category yet.'}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...t.h2, fontStyle: 'italic' },
  chipsWrap: { height: 56, borderBottomWidth: 1, borderBottomColor: colors.border, justifyContent: 'center' },
  chipsRow: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  chip: {
    height: 36, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  chipActive: { backgroundColor: colors.earth, borderColor: colors.earth },
  chipText: { color: colors.earth, fontWeight: '600', fontSize: 12 },
  chipTextActive: { color: colors.white },
});
