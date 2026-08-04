import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_RECIPES } from './mockData';
import { ShopifyAPI, shopifyEnabled } from './shopify';

const BACKEND_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const TOKEN_KEY = 'gharana_token';
const USER_KEY = 'gharana_user';
const ADDRESS_KEY = 'gharana_addresses';
const ORDER_KEY = 'gharana_orders';
const SUBSCRIPTION_KEY = 'gharana_subscriptions';

type RequestOpts = {
  method?: string;
  body?: any;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
};

type User = {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  referral_code: string;
  credits: number;
  preferences: { dietary?: string[]; notifications?: boolean };
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

async function writeJson(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function readToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function saveToken(token: string | null) {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getToken(): Promise<string | null> {
  return readToken();
}

function hasBackend() {
  return BACKEND_BASE.trim().length > 0;
}

export async function api<T = any>(path: string, opts: RequestOpts = {}): Promise<T> {
  if (!hasBackend()) throw new Error('Backend API is not configured for this web deployment');
  const url = new URL(`/api${path}`, BACKEND_BASE);
  if (opts.query) {
    Object.entries(opts.query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, String(v));
    });
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.auth) {
    const token = await readToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url.toString(), {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data as T;
}

function normalizeUser(email: string, fullName?: string, phone?: string): User {
  return {
    id: email.toLowerCase(),
    email: email.toLowerCase(),
    full_name: fullName || email.split('@')[0] || 'Gharana Customer',
    phone,
    referral_code: 'GHRWEB',
    credits: 0,
    preferences: { dietary: [], notifications: true },
  };
}

function filterProducts(q: Record<string, any> = {}) {
  let rows = [...MOCK_PRODUCTS];
  if (q.category) rows = rows.filter((p) => p.category_slug === q.category);
  if (q.featured) rows = rows.filter((p) => p.featured);
  if (q.q) {
    const term = String(q.q).toLowerCase();
    rows = rows.filter((p) => [p.name, p.tagline, p.category_slug, ...p.tags].join(' ').toLowerCase().includes(term));
  }
  if (q.sort === 'newest') rows = rows.reverse();
  if (q.sort === 'price_asc') rows = rows.sort((a, b) => a.variants[0].price - b.variants[0].price);
  if (q.sort === 'price_desc') rows = rows.sort((a, b) => b.variants[0].price - a.variants[0].price);
  return rows.slice(0, Number(q.limit || rows.length));
}

export const AuthAPI = {
  async register(p: { email: string; password: string; full_name: string; phone?: string }) {
    if (hasBackend()) return api('/auth/register', { method: 'POST', body: p });
    const user = normalizeUser(p.email, p.full_name, p.phone);
    await writeJson(USER_KEY, user);
    return { token: `web-${Date.now()}`, user };
  },
  async login(p: { email: string; password: string }) {
    if (hasBackend()) return api('/auth/login', { method: 'POST', body: p });
    const stored = await readJson<User | null>(USER_KEY, null);
    const user = stored?.email === p.email.toLowerCase() ? stored : normalizeUser(p.email, 'Gharana Customer');
    await writeJson(USER_KEY, user);
    return { token: `web-${Date.now()}`, user };
  },
  async me() {
    if (hasBackend()) return api('/auth/me', { auth: true });
    const user = await readJson<User | null>(USER_KEY, null);
    if (!user) throw new Error('No active session');
    return user;
  },
  async updatePrefs(p: { dietary: string[]; notifications: boolean }) {
    if (hasBackend()) return api('/auth/preferences', { method: 'PUT', body: p, auth: true });
    const user = await readJson<User>(USER_KEY, normalizeUser('guest@gharana.in', 'Gharana Customer'));
    const next = { ...user, preferences: p };
    await writeJson(USER_KEY, next);
    return next;
  },
};

export const CatalogAPI = {
  async categories() {
    if (shopifyEnabled) return ShopifyAPI.categories();
    if (hasBackend()) return api('/categories');
    return MOCK_CATEGORIES;
  },
  async products(q: Record<string, any> = {}) {
    if (shopifyEnabled) return ShopifyAPI.products(q);
    if (hasBackend()) return api('/products', { query: q });
    return filterProducts(q);
  },
  async productBySlug(slug: string) {
    if (shopifyEnabled) return ShopifyAPI.productBySlug(slug);
    if (hasBackend()) return api(`/products/${slug}`);
    const product = MOCK_PRODUCTS.find((p) => p.slug === slug);
    if (!product) throw new Error('Product not found');
    return product;
  },
  async trending() {
    if (hasBackend()) return api('/search/trending');
    return { trending: ['Mustard oil', 'Toor dal', 'Basmati rice', 'Cow ghee', 'Turmeric', 'Whole wheat atta'] };
  },
};

export const AddressAPI = {
  async list() {
    if (hasBackend()) return api('/addresses', { auth: true });
    return readJson(ADDRESS_KEY, []);
  },
  async create(a: any) {
    if (hasBackend()) return api('/addresses', { method: 'POST', body: a, auth: true });
    const addresses = await readJson<any[]>(ADDRESS_KEY, []);
    const next = { ...a, id: `addr-${Date.now()}` };
    await writeJson(ADDRESS_KEY, [next, ...addresses]);
    return next;
  },
  update: (id: string, a: any) => api(`/addresses/${id}`, { method: 'PUT', body: a, auth: true }),
  remove: (id: string) => api(`/addresses/${id}`, { method: 'DELETE', auth: true }),
};

export const OrderAPI = {
  async create(o: any) {
    if (shopifyEnabled) {
      const lines = o.items
        .filter((item: any) => item.variant_id)
        .map((item: any) => ({ merchandiseId: item.variant_id, quantity: item.quantity }));
      if (lines.length) {
        const cart = await ShopifyAPI.createCheckout(lines);
        return {
          id: cart.id,
          checkout_url: cart.checkoutUrl,
          items: [],
          total: 0,
          status: 'confirmed',
          created_at: new Date().toISOString(),
        };
      }
    }
    if (hasBackend()) return api('/orders', { method: 'POST', body: o, auth: true });
    const orders = await readJson<any[]>(ORDER_KEY, []);
    const items = o.items.map((item: any) => {
      const product = MOCK_PRODUCTS.find((p) => p.id === item.product_id || p.slug === item.product_id);
      const variant = product?.variants.find((v) => v.weight === item.variant_weight) || product?.variants[0];
      return {
        product_id: product?.id || item.product_id,
        slug: product?.slug || item.product_id,
        name: product?.name || item.product_id,
        image: product?.image || '',
        variant_weight: item.variant_weight,
        unit_price: variant?.price || 0,
        quantity: item.quantity,
      };
    });
    const subtotal = items.reduce((sum: number, item: any) => sum + item.unit_price * item.quantity, 0);
    const order = {
      id: `web-${Date.now()}`,
      items,
      subtotal,
      discount: 0,
      delivery_fee: subtotal >= 499 ? 0 : 29,
      total: subtotal + (subtotal >= 499 ? 0 : 29),
      status: 'confirmed',
      status_history: [{ status: 'confirmed', at: new Date().toISOString() }],
      eta: new Date(Date.now() + 28 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };
    await writeJson(ORDER_KEY, [order, ...orders]);
    return order;
  },
  async list() {
    if (hasBackend()) return api('/orders', { auth: true });
    return readJson(ORDER_KEY, []);
  },
  async get(id: string) {
    if (hasBackend()) return api(`/orders/${id}`, { auth: true });
    const orders = await readJson<any[]>(ORDER_KEY, []);
    const order = orders.find((o) => o.id === id);
    if (!order) throw new Error('Order not found');
    return order;
  },
};

export const SubscriptionAPI = {
  async list() {
    if (hasBackend()) return api('/subscriptions', { auth: true });
    return readJson(SUBSCRIPTION_KEY, []);
  },
  async create(s: any) {
    if (hasBackend()) return api('/subscriptions', { method: 'POST', body: s, auth: true });
    const rows = await readJson<any[]>(SUBSCRIPTION_KEY, []);
    const next = { ...s, id: `sub-${Date.now()}` };
    await writeJson(SUBSCRIPTION_KEY, [next, ...rows]);
    return next;
  },
  update: (id: string, s: any) => api(`/subscriptions/${id}`, { method: 'PUT', body: s, auth: true }),
  remove: (id: string) => api(`/subscriptions/${id}`, { method: 'DELETE', auth: true }),
};

export const RecipeAPI = {
  async list(product_id?: string) {
    if (hasBackend()) return api('/recipes', { query: product_id ? { product_id } : {} });
    return product_id ? MOCK_RECIPES.filter((r) => r.ingredient_ids.includes(product_id)) : MOCK_RECIPES;
  },
  get: (slug: string) => api(`/recipes/${slug}`),
};

export const PromoAPI = {
  async validate(code: string, subtotal: number) {
    if (hasBackend()) return api('/promo/validate', { method: 'POST', body: { code, subtotal } });
    const normalized = code.toUpperCase();
    if (normalized === 'FIRSTBOX' && subtotal >= 499) return { code: normalized, discount: 100, type: 'flat' };
    if (normalized === 'PURE10' && subtotal >= 199) return { code: normalized, discount: Math.round(subtotal * 0.1), type: 'percent' };
    throw new Error(normalized === 'FIRSTBOX' ? 'Minimum order Rs 499 required' : 'Invalid promo code');
  },
};

export const DeliveryAPI = {
  async check(pincode: string) {
    if (hasBackend()) return api('/delivery/check', { query: { pincode } });
    const express = /^\d{6}$/.test(pincode) && Number(pincode[pincode.length - 1]) % 2 === 0;
    return { available: /^\d{6}$/.test(pincode), express_available: express, eta_minutes: express ? 28 : 90, pincode };
  },
};
