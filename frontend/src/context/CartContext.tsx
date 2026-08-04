import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CartItem = {
  product_id: string;
  variant_id?: string;
  slug: string;
  name: string;
  image: string;
  variant_weight: string;
  unit_price: number;
  quantity: number;
};

type Ctx = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (product_id: string, variant_weight: string) => void;
  setQuantity: (product_id: string, variant_weight: string, qty: number) => void;
  clear: () => void;
  getQuantity: (product_id: string, variant_weight: string) => number;
  subtotal: number;
  itemCount: number;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = 'gharana_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setItems(JSON.parse(raw));
      } catch {}
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {});
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product_id === item.product_id && i.variant_weight === item.variant_weight);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((product_id: string, variant_weight: string) => {
    setItems((prev) => prev.filter((i) => !(i.product_id === product_id && i.variant_weight === variant_weight)));
  }, []);

  const setQuantity = useCallback((product_id: string, variant_weight: string, qty: number) => {
    setItems((prev) => {
      const next: CartItem[] = [];
      prev.forEach((i) => {
        if (i.product_id === product_id && i.variant_weight === variant_weight) {
          if (qty > 0) next.push({ ...i, quantity: qty });
        } else {
          next.push(i);
        }
      });
      return next;
    });
  }, []);

  const getQuantity = useCallback(
    (product_id: string, variant_weight: string) => {
      const found = items.find((i) => i.product_id === product_id && i.variant_weight === variant_weight);
      return found ? found.quantity : 0;
    },
    [items],
  );

  const clear = useCallback(() => setItems([]), []);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.unit_price * i.quantity, 0), [items]);
  const itemCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  const value = useMemo(
    () => ({ items, addItem, removeItem, setQuantity, clear, getQuantity, subtotal, itemCount }),
    [items, addItem, removeItem, setQuantity, clear, getQuantity, subtotal, itemCount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
