import { MOCK_CATEGORIES, type Product } from './mockData';

const SHOPIFY_DOMAIN = process.env.EXPO_PUBLIC_SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = process.env.EXPO_PUBLIC_SHOPIFY_API_VERSION || '2026-01';

export const shopifyEnabled = Boolean(SHOPIFY_DOMAIN && STOREFRONT_TOKEN);

async function storefront<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  if (!SHOPIFY_DOMAIN || !STOREFRONT_TOKEN) throw new Error('Shopify Storefront API is not configured');
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors?.length) {
    throw new Error(json.errors?.[0]?.message || `Shopify request failed (${res.status})`);
  }
  return json.data as T;
}

function handleFromId(id: string) {
  return id.split('/').pop() || id;
}

function mapProduct(node: any): Product {
  const collection = node.collections?.edges?.[0]?.node;
  const firstImage = node.featuredImage?.url || node.images?.edges?.[0]?.node?.url || '';
  const tags = node.tags || [];
  return {
    id: node.id,
    name: node.title,
    slug: node.handle,
    tagline: node.description?.split('\n')[0] || 'Pure pantry, delivered fast.',
    story: node.description || 'A Gharana pantry essential, sourced and packed with care.',
    ingredients: node.metafield?.value || tags.join(', ') || 'See product packaging for ingredients.',
    how_to_use: 'Use as part of your everyday pantry routine. Store cool, dry, and airtight.',
    category_slug: collection?.handle || 'healthy-staples',
    image: firstImage,
    variants: node.variants.edges.map(({ node: variant }: any) => ({
      id: variant.id,
      weight: variant.title === 'Default Title' ? 'Pack' : variant.title,
      price: Number(variant.price.amount),
      stock: variant.availableForSale ? 40 : 0,
    })),
    tags,
    purity_certified: tags.some((tag: string) => /pure|lab|certified|organic/i.test(tag)),
    featured: tags.some((tag: string) => /featured|bestseller/i.test(tag)),
    rating: 4.8,
    reviews_count: 100 + handleFromId(node.id).length * 17,
  };
}

export const ShopifyAPI = {
  async categories() {
    const data = await storefront<any>(`
      query Collections {
        collections(first: 20) {
          edges { node { id title handle } }
        }
      }
    `);
    const collections = data.collections.edges.map(({ node }: any, idx: number) => ({
      id: node.id,
      name: node.title,
      slug: node.handle,
      icon: MOCK_CATEGORIES[idx % MOCK_CATEGORIES.length]?.icon || 'circle',
      hindi: node.title,
      sort_order: idx + 1,
    }));
    return collections.length ? collections : MOCK_CATEGORIES;
  },

  async products(q: Record<string, any> = {}) {
    const queryParts = [];
    if (q.category) queryParts.push(`collection:${q.category}`);
    if (q.q) queryParts.push(String(q.q));
    if (q.featured) queryParts.push('tag:featured OR tag:bestseller');
    const data = await storefront<any>(`
      query Products($first: Int!, $query: String) {
        products(first: $first, query: $query) {
          edges {
            node {
              id title handle description tags
              featuredImage { url }
              collections(first: 1) { edges { node { handle title } } }
              metafield(namespace: "custom", key: "ingredients") { value }
              variants(first: 8) { edges { node { id title availableForSale price { amount currencyCode } } } }
            }
          }
        }
      }
    `, { first: Number(q.limit || 50), query: queryParts.join(' ') || undefined });
    return data.products.edges.map(({ node }: any) => mapProduct(node));
  },

  async productBySlug(slug: string) {
    const data = await storefront<any>(`
      query Product($handle: String!) {
        product(handle: $handle) {
          id title handle description tags
          featuredImage { url }
          collections(first: 1) { edges { node { handle title } } }
          metafield(namespace: "custom", key: "ingredients") { value }
          variants(first: 8) { edges { node { id title availableForSale price { amount currencyCode } } } }
        }
      }
    `, { handle: slug });
    if (!data.product) throw new Error('Product not found');
    return mapProduct(data.product);
  },

  async createCheckout(lines: { merchandiseId: string; quantity: number }[]) {
    const data = await storefront<any>(`
      mutation CartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart { id checkoutUrl }
          userErrors { field message }
        }
      }
    `, { input: { lines } });
    const error = data.cartCreate.userErrors?.[0];
    if (error) throw new Error(error.message);
    return data.cartCreate.cart;
  },
};
