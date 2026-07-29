import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const TOKEN_KEY = 'gharana_token';

async function readToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return await AsyncStorage.getItem(TOKEN_KEY);
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string | null) {
  if (Platform.OS === 'web') {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
    return;
  }
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getToken(): Promise<string | null> {
  return readToken();
}

type RequestOpts = {
  method?: string;
  body?: any;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
};

export async function api<T = any>(path: string, opts: RequestOpts = {}): Promise<T> {
  const url = new URL(`${BASE}/api${path}`);
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

// Convenience wrappers
export const AuthAPI = {
  register: (p: { email: string; password: string; full_name: string; phone?: string }) =>
    api('/auth/register', { method: 'POST', body: p }),
  login: (p: { email: string; password: string }) =>
    api('/auth/login', { method: 'POST', body: p }),
  me: () => api('/auth/me', { auth: true }),
  updatePrefs: (p: { dietary: string[]; notifications: boolean }) =>
    api('/auth/preferences', { method: 'PUT', body: p, auth: true }),
};

export const CatalogAPI = {
  categories: () => api('/categories'),
  products: (q: Record<string, any> = {}) => api('/products', { query: q }),
  productBySlug: (slug: string) => api(`/products/${slug}`),
  trending: () => api('/search/trending'),
};

export const AddressAPI = {
  list: () => api('/addresses', { auth: true }),
  create: (a: any) => api('/addresses', { method: 'POST', body: a, auth: true }),
  update: (id: string, a: any) => api(`/addresses/${id}`, { method: 'PUT', body: a, auth: true }),
  remove: (id: string) => api(`/addresses/${id}`, { method: 'DELETE', auth: true }),
};

export const OrderAPI = {
  create: (o: any) => api('/orders', { method: 'POST', body: o, auth: true }),
  list: () => api('/orders', { auth: true }),
  get: (id: string) => api(`/orders/${id}`, { auth: true }),
};

export const SubscriptionAPI = {
  list: () => api('/subscriptions', { auth: true }),
  create: (s: any) => api('/subscriptions', { method: 'POST', body: s, auth: true }),
  update: (id: string, s: any) => api(`/subscriptions/${id}`, { method: 'PUT', body: s, auth: true }),
  remove: (id: string) => api(`/subscriptions/${id}`, { method: 'DELETE', auth: true }),
};

export const RecipeAPI = {
  list: (product_id?: string) => api('/recipes', { query: product_id ? { product_id } : {} }),
  get: (slug: string) => api(`/recipes/${slug}`),
};

export const PromoAPI = {
  validate: (code: string, subtotal: number) =>
    api('/promo/validate', { method: 'POST', body: { code, subtotal } }),
};

export const DeliveryAPI = {
  check: (pincode: string) => api('/delivery/check', { query: { pincode } }),
};
