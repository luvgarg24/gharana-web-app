import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, type as t, shadow } from '@/src/theme/tokens';
import { CatalogAPI, RecipeAPI } from '@/src/api/client';
import { useCart } from '@/src/context/CartContext';
import { PureStamp, AccentLabel } from '@/src/components/PureStamp';

const TABS = ['Story', 'Ingredients', 'How to Use', 'Reviews'] as const;

export default function ProductDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { addItem, getQuantity, setQuantity } = useCart();
  const [product, setProduct] = useState<any | null>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [wIdx, setWIdx] = useState(0);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Story');

  useEffect(() => {
    if (!slug) return;
    CatalogAPI.productBySlug(slug).then((p: any) => {
      setProduct(p);
      RecipeAPI.list(p.id).then(setRecipes).catch(() => {});
    });
  }, [slug]);

  if (!product) return <SafeAreaView style={styles.safe}><Text style={{ padding: spacing.xl }}>Loading…</Text></SafeAreaView>;
  const variant = product.variants[wIdx];
  const inCart = getQuantity(product.id, variant.weight);

  const onAdd = () => {
    Haptics.selectionAsync().catch(() => {});
    addItem({
      product_id: product.id,
      variant_id: variant.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      variant_weight: variant.weight,
      unit_price: variant.price,
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="product-detail">
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="pd-back"><Feather name="arrow-left" size={20} color={colors.earth} /></Pressable>
          <Pressable onPress={() => router.push('/(tabs)/cart')} style={styles.iconBtn} testID="pd-cart"><Feather name="shopping-bag" size={20} color={colors.earth} /></Pressable>
        </View>

        {/* Image */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" transition={250} />
          {product.purity_certified && <View style={styles.stamp}><PureStamp size={60} /></View>}
        </View>

        <View style={{ padding: spacing.xl }}>
          <AccentLabel>{product.tags.join(' · ').toUpperCase() || 'GHARANA'}</AccentLabel>
          <Text style={styles.name} testID="product-detail-name">{product.name}</Text>
          <Text style={styles.tag}>{product.tagline}</Text>

          <View style={styles.rating}>
            <Feather name="star" size={13} color={colors.jade} />
            <Text style={{ ...t.small, color: colors.jade, fontWeight: '700' }}>{product.rating}</Text>
            <Text style={{ ...t.small, color: colors.dust }}>· {product.reviews_count} reviews</Text>
          </View>

          {/* Variants */}
          <Text style={styles.sectionLabel}>CHOOSE WEIGHT</Text>
          <View style={styles.variantRow}>
            {product.variants.map((v: any, i: number) => (
              <Pressable key={v.weight} onPress={() => setWIdx(i)} style={[styles.variantChip, i === wIdx && styles.variantChipActive]} testID={`pd-var-${v.weight}`}>
                <Text style={[styles.variantW, i === wIdx && styles.variantWActive]}>{v.weight}</Text>
                <Text style={[styles.variantP, i === wIdx && styles.variantPActive]}>₹{v.price}</Text>
              </Pressable>
            ))}
          </View>

          {variant.stock < 20 && <Text style={styles.lowStock}>Only {variant.stock} left in stock</Text>}

          {/* Tabs */}
          <View style={styles.tabs}>
            {TABS.map((x) => (
              <Pressable key={x} onPress={() => setTab(x)} style={[styles.tab, tab === x && styles.tabActive]} testID={`tab-${x}`}>
                <Text style={[styles.tabText, tab === x && styles.tabTextActive]}>{x}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.tabBody}>
            {tab === 'Story' && <Text style={styles.body}>{product.story}</Text>}
            {tab === 'Ingredients' && <Text style={styles.body}>{product.ingredients}</Text>}
            {tab === 'How to Use' && <Text style={styles.body}>{product.how_to_use}</Text>}
            {tab === 'Reviews' && <ReviewsBlock rating={product.rating} count={product.reviews_count} />}
          </View>

          {/* Recipes */}
          {recipes.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Cook with this</Text>
              {recipes.map((r) => (
                <Pressable key={r.slug} style={styles.recipe} testID={`recipe-${r.slug}`}>
                  <Image source={{ uri: r.image }} style={styles.recipeImg} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recipeName}>{r.name}</Text>
                    <Text style={styles.recipeMeta}>{r.time_minutes} min · serves {r.serves}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.dust} />
                </Pressable>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerPrice}>₹{variant.price}</Text>
          <Text style={styles.footerVar}>for {variant.weight}</Text>
        </View>
        {inCart > 0 ? (
          <View style={styles.footerStepper} testID="pd-cart-stepper">
            <Pressable style={styles.footerStepBtn} onPress={() => setQuantity(product.id, variant.weight, inCart - 1)} testID="pd-dec">
              <Feather name="minus" size={18} color={colors.white} />
            </Pressable>
            <Text style={styles.footerQty}>{inCart}</Text>
            <Pressable style={styles.footerStepBtn} onPress={() => setQuantity(product.id, variant.weight, inCart + 1)} testID="pd-inc">
              <Feather name="plus" size={18} color={colors.white} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.addBtn} onPress={onAdd} testID="pd-add-to-cart">
            <Text style={styles.addBtnText}>Add to cart</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function ReviewsBlock({ rating, count }: { rating: number; count: number }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ ...t.h3 }}>{rating} <Text style={{ ...t.small, color: colors.dust }}>from {count} reviews</Text></Text>
      <View style={{ gap: 6, marginTop: 8 }}>
        <ReviewRow name="Priya S." text="Ghee smells exactly like my nani used to make. Bilona ka farak dikh raha hai." />
        <ReviewRow name="Rahul M." text="Toor dal cooks a little slower but tastes so much better. No polish is the way." />
        <ReviewRow name="Meera K." text="Basmati grains double in length. Perfect biryani. Worth every rupee." />
      </View>
    </View>
  );
}
function ReviewRow({ name, text }: { name: string; text: string }) {
  return (
    <View style={{ backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ fontWeight: '700', color: colors.earth, fontSize: 13 }}>{name} <Text style={{ color: colors.jade, fontSize: 10, fontWeight: '700' }}>· VERIFIED BUYER</Text></Text>
      <Text style={{ ...t.body, color: colors.dust, marginTop: 4 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, position: 'absolute', top: spacing.lg, left: 0, right: 0, zIndex: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  imageWrap: { height: 310, margin: spacing.md, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.cream },
  image: { width: '100%', height: '100%' },
  stamp: { position: 'absolute', bottom: spacing.lg, right: spacing.lg },
  name: { ...t.h1, fontSize: 25, lineHeight: 31, marginTop: 8 },
  tag: { ...t.body, color: colors.dust, marginTop: 4 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md },
  sectionLabel: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700', color: colors.dust, marginTop: spacing.xl, marginBottom: 8 },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center' },
  variantChipActive: { backgroundColor: colors.saffronTint, borderColor: colors.saffron },
  variantW: { fontSize: 13, fontWeight: '700', color: colors.earth },
  variantWActive: { color: colors.saffronDark },
  variantP: { fontSize: 11, color: colors.dust, marginTop: 2 },
  variantPActive: { color: colors.saffronDark },
  lowStock: { color: colors.saffronDark, fontSize: 12, marginTop: 8, fontWeight: '600' },
  tabs: { flexDirection: 'row', marginTop: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { paddingVertical: 10, paddingHorizontal: 14, marginRight: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.saffron, marginBottom: -1 },
  tabText: { fontSize: 13, color: colors.dust, fontWeight: '600' },
  tabTextActive: { color: colors.earth },
  tabBody: { paddingVertical: spacing.md, minHeight: 90 },
  body: { ...t.body, lineHeight: 24 },
  sectionTitle: { ...t.h3, marginTop: spacing.xl, marginBottom: 8 },
  recipe: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.sm, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  recipeImg: { width: 56, height: 56, borderRadius: radius.sm },
  recipeName: { ...t.body, fontWeight: '600' },
  recipeMeta: { ...t.small, color: colors.dust, marginTop: 2 },
  footer: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md, minHeight: 64, backgroundColor: colors.white, borderRadius: radius.lg, padding: 7, paddingLeft: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...shadow.card, borderWidth: 1, borderColor: colors.border },
  footerPrice: { color: colors.earth, fontSize: 19, fontWeight: '700' },
  footerVar: { color: colors.dust, fontSize: 10.5 },
  addBtn: { minWidth: 156, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.saffron, borderRadius: radius.md },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  footerStepper: { width: 156, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.saffron, borderRadius: radius.md },
  footerStepBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  footerQty: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
