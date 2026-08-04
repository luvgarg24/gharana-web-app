import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import { colors, fonts, radius, spacing } from '@/src/theme/tokens';
import { useCart } from '@/src/context/CartContext';

export type ProductLite = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  image: string;
  variants: { weight: string; price: number; stock: number }[];
  tags: string[];
  purity_certified: boolean;
  rating: number;
};

export function ProductCard({ product, testPrefix = 'catalog' }: { product: ProductLite; testPrefix?: string }) {
  const router = useRouter();
  const [wIdx, setWIdx] = useState(0);
  const { addItem, getQuantity, setQuantity } = useCart();
  const variant = product.variants[wIdx];
  const qty = getQuantity(product.id, variant.weight);

  const add = () => {
    Haptics.selectionAsync().catch(() => {});
    addItem({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      variant_weight: variant.weight,
      unit_price: variant.price,
    });
  };

  return (
    <View style={styles.card} testID={`${testPrefix}-product-card-${product.slug}`}>
      <Pressable onPress={() => router.push(`/product/${product.slug}`)} testID={`${testPrefix}-open-product-${product.slug}`}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" transition={180} />
          {product.purity_certified && (
            <View style={styles.qualityBadge} testID={`${testPrefix}-quality-${product.slug}`}>
              <Feather name="check-circle" size={10} color={colors.jade} />
              <Text style={styles.qualityText}>PURE</Text>
            </View>
          )}
        </View>
      </Pressable>

      <View style={styles.body}>
        <View style={styles.etaRow}>
          <Feather name="clock" size={10} color={colors.jade} />
          <Text style={styles.eta}>10 MINS</Text>
          <View style={styles.dot} />
          <Feather name="star" size={10} color={colors.gold} />
          <Text style={styles.rating}>{product.rating}</Text>
        </View>
        <Pressable onPress={() => router.push(`/product/${product.slug}`)} testID={`${testPrefix}-product-name-${product.slug}`}>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        </Pressable>

        <Pressable
          testID={`${testPrefix}-variant-${product.slug}`}
          onPress={() => product.variants.length > 1 && setWIdx((wIdx + 1) % product.variants.length)}
          style={styles.variant}
        >
          <Text style={styles.weight}>{variant.weight}</Text>
          {product.variants.length > 1 && <Feather name="chevron-down" size={12} color={colors.dust} />}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.price} testID={`${testPrefix}-price-${product.slug}`}>₹{variant.price}</Text>
          {qty === 0 ? (
            <Pressable testID={`${testPrefix}-add-${product.slug}`} onPress={add} style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}>
              <Text style={styles.addText}>ADD</Text>
            </Pressable>
          ) : (
            <View style={styles.stepper} testID={`${testPrefix}-stepper-${product.slug}`}>
              <Pressable testID={`${testPrefix}-dec-${product.slug}`} onPress={() => setQuantity(product.id, variant.weight, qty - 1)} style={styles.stepBtn}>
                <Feather name="minus" size={15} color={colors.white} />
              </Pressable>
              <Text style={styles.qty}>{qty}</Text>
              <Pressable testID={`${testPrefix}-inc-${product.slug}`} onPress={() => setQuantity(product.id, variant.weight, qty + 1)} style={styles.stepBtn}>
                <Feather name="plus" size={15} color={colors.white} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  imageWrap: { aspectRatio: 1.08, backgroundColor: colors.creamDeep, position: 'relative' },
  image: { width: '100%', height: '100%' },
  qualityBadge: { position: 'absolute', top: 7, left: 7, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.white },
  qualityText: { color: colors.jade, fontFamily: fonts.bodyBold, fontSize: 8, letterSpacing: 0.4 },
  body: { padding: 9 },
  etaRow: { height: 16, flexDirection: 'row', alignItems: 'center', gap: 3 },
  eta: { color: colors.jade, fontFamily: fonts.bodyBold, fontSize: 8.5 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.border, marginHorizontal: 2 },
  rating: { color: colors.dust, fontFamily: fonts.bodySemibold, fontSize: 9.5 },
  name: { color: colors.earth, fontFamily: fonts.bodySemibold, fontSize: 12.5, lineHeight: 17, height: 35, marginTop: 2 },
  variant: { minHeight: 30, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 2 },
  weight: { color: colors.dust, fontFamily: fonts.bodyMedium, fontSize: 10.5 },
  footer: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  price: { color: colors.earth, fontFamily: fonts.bodyBold, fontSize: 14 },
  addBtn: { width: 72, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 9, borderWidth: 1.5, borderColor: colors.saffron, backgroundColor: colors.saffronTint },
  addText: { color: colors.saffronDark, fontFamily: fonts.bodyBold, fontSize: 12 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  stepper: { width: 92, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 9, backgroundColor: colors.saffron },
  stepBtn: { width: 34, height: 40, alignItems: 'center', justifyContent: 'center' },
  qty: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 12 },
});