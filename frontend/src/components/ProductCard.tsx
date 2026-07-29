import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import { colors, radius, spacing, type as t, shadow } from '@/src/theme/tokens';
import { PureStamp } from './PureStamp';
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

export function ProductCard({ product }: { product: ProductLite }) {
  const router = useRouter();
  const [wIdx, setWIdx] = useState(0);
  const { addItem, getQuantity, setQuantity } = useCart();
  const variant = product.variants[wIdx];
  const qty = getQuantity(product.id, variant.weight);

  const badge = useMemo(() => product.tags.find((x) => ['stone-ground', 'cold-pressed', 'unpolished', 'a2', 'aged'].includes(x)), [product.tags]);

  return (
    <Pressable
      testID={`product-card-${product.slug}`}
      onPress={() => router.push(`/product/${product.slug}`)}
      style={styles.card}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" transition={200} />
        {product.purity_certified && (
          <View style={styles.stamp} pointerEvents="none">
            <PureStamp size={40} />
          </View>
        )}
        {badge && (
          <View style={styles.badge}><Text style={styles.badgeText}>{badge.replace('-', ' ').toUpperCase()}</Text></View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.tag} numberOfLines={1}>{product.tagline}</Text>

        <View style={styles.variantRow}>
          {product.variants.map((v, i) => (
            <Pressable
              key={v.weight}
              testID={`variant-${product.slug}-${v.weight}`}
              onPress={() => setWIdx(i)}
              style={[styles.variantPill, i === wIdx && styles.variantPillActive]}
            >
              <Text style={[styles.variantText, i === wIdx && styles.variantTextActive]}>{v.weight}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>₹{variant.price}</Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={11} color={colors.jade} />
              <Text style={styles.ratingText}>{product.rating}</Text>
            </View>
          </View>
          {qty === 0 ? (
            <Pressable
              testID={`add-${product.slug}`}
              style={styles.addBtn}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                addItem({
                  product_id: product.id,
                  slug: product.slug,
                  name: product.name,
                  image: product.image,
                  variant_weight: variant.weight,
                  unit_price: variant.price,
                });
              }}
            >
              <Text style={styles.addBtnText}>ADD</Text>
            </Pressable>
          ) : (
            <View style={styles.stepper}>
              <Pressable
                testID={`dec-${product.slug}`}
                onPress={() => setQuantity(product.id, variant.weight, qty - 1)}
                style={styles.stepBtn}
              >
                <Feather name="minus" size={14} color={colors.white} />
              </Pressable>
              <Text style={styles.stepperQty}>{qty}</Text>
              <Pressable
                testID={`inc-${product.slug}`}
                onPress={() => setQuantity(product.id, variant.weight, qty + 1)}
                style={styles.stepBtn}
              >
                <Feather name="plus" size={14} color={colors.white} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.soft,
  },
  imageWrap: {
    backgroundColor: colors.cream,
    aspectRatio: 1,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  stamp: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  badge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: colors.earth,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeText: { color: colors.white, fontSize: 8, letterSpacing: 1.2, fontWeight: '700' },
  body: { padding: spacing.md, gap: 6 },
  name: { ...t.h4, fontSize: 16, lineHeight: 20 },
  tag: { ...t.small, color: colors.dust },
  variantRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  variantPill: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  variantPillActive: { borderColor: colors.earth, backgroundColor: colors.earth },
  variantText: { ...t.small, color: colors.dust, fontWeight: '500' },
  variantTextActive: { color: colors.white },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 },
  price: { ...t.price, fontSize: 18 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  ratingText: { ...t.small, color: colors.jade, fontWeight: '600' },
  addBtn: {
    backgroundColor: colors.saffron,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffron,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    gap: 6,
  },
  stepBtn: { padding: 6 },
  stepperQty: { color: colors.white, fontWeight: '700', minWidth: 14, textAlign: 'center' },
});
