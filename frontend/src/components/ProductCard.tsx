import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import { colors, radius, spacing, fonts, type as t } from '@/src/theme/tokens';
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
  const hasVariants = product.variants.length > 1;

  const badge = useMemo(
    () => product.tags.find((x) => ['stone-ground', 'cold-pressed', 'unpolished', 'a2', 'aged', 'bilona', 'single-press'].includes(x)),
    [product.tags],
  );

  return (
    <Pressable
      testID={`product-card-${product.slug}`}
      onPress={() => router.push(`/product/${product.slug}`)}
      style={styles.card}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" transition={220} />
        {product.purity_certified && (
          <View style={styles.stamp} pointerEvents="none">
            <PureStamp size={38} />
          </View>
        )}
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge.replace('-', ' ').toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.ratingRow}>
          <Feather name="star" size={10} color={colors.gold} />
          <Text style={styles.ratingText}>{product.rating}</Text>
          <View style={styles.ratingDivider} />
          <Text style={styles.weightHint}>{variant.weight}</Text>
        </View>

        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.tag} numberOfLines={1}>{product.tagline}</Text>

        {hasVariants && (
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
        )}

        <View style={styles.footer}>
          <Text style={styles.price}>₹{variant.price}</Text>
          {qty === 0 ? (
            <Pressable
              testID={`add-${product.slug}`}
              style={styles.addBtn}
              hitSlop={6}
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
              <Feather name="plus" size={13} color={colors.saffronDark} />
              <Text style={styles.addBtnText}>ADD</Text>
            </Pressable>
          ) : (
            <View style={styles.stepper}>
              <Pressable
                testID={`dec-${product.slug}`}
                onPress={() => setQuantity(product.id, variant.weight, qty - 1)}
                style={styles.stepBtn}
                hitSlop={6}
              >
                <Feather name="minus" size={14} color={colors.white} />
              </Pressable>
              <Text style={styles.stepperQty}>{qty}</Text>
              <Pressable
                testID={`inc-${product.slug}`}
                onPress={() => setQuantity(product.id, variant.weight, qty + 1)}
                style={styles.stepBtn}
                hitSlop={6}
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
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  imageWrap: {
    backgroundColor: colors.creamDeep,
    aspectRatio: 1,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  stamp: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  badge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: 'rgba(36, 26, 16, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeText: { color: colors.goldSoft, fontSize: 8, letterSpacing: 1.1, fontFamily: fonts.bodyBold },
  body: { padding: spacing.md, paddingTop: 10, gap: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  ratingText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.earth },
  ratingDivider: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.dustLight, marginHorizontal: 2 },
  weightHint: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.dust },
  name: { fontFamily: fonts.bodySemibold, fontSize: 14, lineHeight: 18, color: colors.earth },
  tag: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 15, color: colors.dust, marginBottom: 2 },
  variantRow: { flexDirection: 'row', gap: 5, marginTop: 5, flexWrap: 'wrap' },
  variantPill: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
  },
  variantPillActive: { borderColor: colors.earth, backgroundColor: colors.earth },
  variantText: { fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.dust },
  variantTextActive: { color: colors.white, fontFamily: fonts.bodySemibold },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  price: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.earth },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.saffronTint,
    borderWidth: 1,
    borderColor: colors.saffron,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  addBtnText: { color: colors.saffronDark, fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.8 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffron,
    borderRadius: radius.md,
    paddingHorizontal: 3,
  },
  stepBtn: { paddingHorizontal: 7, paddingVertical: 6 },
  stepperQty: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 13, minWidth: 16, textAlign: 'center' },
});
