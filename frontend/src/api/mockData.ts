export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  hindi: string;
  sort_order: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  story: string;
  ingredients: string;
  how_to_use: string;
  category_slug: string;
  image: string;
  variants: { id?: string; weight: string; price: number; stock: number }[];
  tags: string[];
  purity_certified: boolean;
  featured: boolean;
  rating: number;
  reviews_count: number;
};

export const MOCK_CATEGORIES: Category[] = [
  { id: 'flours-atta', name: 'Flours & Atta', slug: 'flours-atta', icon: 'circle', hindi: 'Atta', sort_order: 1 },
  { id: 'oils-ghee', name: 'Oils & Ghee', slug: 'oils-ghee', icon: 'droplet', hindi: 'Tel aur ghee', sort_order: 2 },
  { id: 'dals-pulses', name: 'Dals & Pulses', slug: 'dals-pulses', icon: 'coffee', hindi: 'Dal', sort_order: 3 },
  { id: 'whole-spices', name: 'Whole Spices', slug: 'whole-spices', icon: 'star', hindi: 'Masale', sort_order: 4 },
  { id: 'rice-grains', name: 'Rice & Grains', slug: 'rice-grains', icon: 'wind', hindi: 'Chawal', sort_order: 5 },
  { id: 'millets', name: 'Millets', slug: 'millets', icon: 'sun', hindi: 'Bajra', sort_order: 6 },
  { id: 'specialty-flours', name: 'Specialty Flours', slug: 'specialty-flours', icon: 'aperture', hindi: 'Vishesh atta', sort_order: 7 },
  { id: 'healthy-staples', name: 'Healthy Staples', slug: 'healthy-staples', icon: 'feather', hindi: 'Paushtik', sort_order: 8 },
];

function v(weight: string, price: number, stock = 40) {
  return { id: weight, weight, price, stock };
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'chakki-whole-wheat-atta',
    name: 'Chakki Fresh Whole Wheat Atta',
    slug: 'chakki-whole-wheat-atta',
    tagline: 'Stone-ground from Madhya Pradesh sharbati wheat, milled this week.',
    story: "Sharbati wheat from the black-soil belt of MP, stone-ground on a slow chakki within 72 hours of packing so the germ oil doesn't turn. Roti stays soft for hours.",
    ingredients: '100% whole wheat. Nothing else. Ever.',
    how_to_use: 'Add water gradually. Knead 6-8 minutes for elastic dough. Rest 20 minutes before rolling.',
    category_slug: 'flours-atta',
    image: 'https://images.pexels.com/photos/17236203/pexels-photo-17236203.jpeg',
    variants: [v('1 kg', 89), v('5 kg', 399), v('10 kg', 749)],
    tags: ['stone-ground', 'no-adulteration'],
    purity_certified: true,
    featured: true,
    rating: 4.8,
    reviews_count: 1284,
  },
  {
    id: 'kachi-ghani-mustard-oil',
    name: 'Kachi Ghani Mustard Oil',
    slug: 'kachi-ghani-mustard-oil',
    tagline: 'Cold-pressed from Rajasthani mustard seeds. Single press.',
    story: 'Wooden ghani, no heat, no solvent. Sharp bite, deep amber colour, and the smell that carries across a neighbourhood when the pakoras start frying.',
    ingredients: '100% mustard seed. Kachi ghani (cold-pressed).',
    how_to_use: 'Heat to smoking point once before use to mellow the sharpness. Ideal for pickles, mustard fish, sarson.',
    category_slug: 'oils-ghee',
    image: 'https://images.unsplash.com/photo-1552592074-ea7a91b851b3',
    variants: [v('500 ml', 149), v('1 L', 279), v('5 L', 1299)],
    tags: ['cold-pressed', 'single-press'],
    purity_certified: true,
    featured: true,
    rating: 4.9,
    reviews_count: 2201,
  },
  {
    id: 'a2-desi-cow-ghee',
    name: 'A2 Desi Cow Ghee',
    slug: 'a2-desi-cow-ghee',
    tagline: 'Bilona-churned from Gir cow milk. Golden grains, deep aroma.',
    story: "Made the old way: milk to curd to butter to ghee. Bilona-churned in small batches from Gir cow A2 milk. You'll smell the nuttiness before you open the jar.",
    ingredients: 'A2 cow milk, cultured, hand-churned.',
    how_to_use: 'A spoon in your dal, a smear on roti, or a tempering for rice. Do not skimp.',
    category_slug: 'oils-ghee',
    image: 'https://images.pexels.com/photos/20689446/pexels-photo-20689446.jpeg',
    variants: [v('250 ml', 449), v('500 ml', 849), v('1 L', 1599)],
    tags: ['a2', 'bilona', 'single-source'],
    purity_certified: true,
    featured: true,
    rating: 4.9,
    reviews_count: 3120,
  },
  {
    id: 'unpolished-toor-dal',
    name: 'Unpolished Toor Dal',
    slug: 'unpolished-toor-dal',
    tagline: 'Sun-dried arhar from Vidarbha. No polish, no oil coating.',
    story: "Most toor dal is polished with water and oil to look pretty. Ours isn't. It cooks a little slower and tastes like it should.",
    ingredients: '100% toor dal, unpolished.',
    how_to_use: 'Soak 20 min. Pressure cook 3 whistles. Temper with cumin, hing, curry leaves.',
    category_slug: 'dals-pulses',
    image: 'https://images.unsplash.com/photo-1590517136325-5ddc364fc36f',
    variants: [v('500 g', 99), v('1 kg', 189), v('5 kg', 899)],
    tags: ['unpolished'],
    purity_certified: true,
    featured: true,
    rating: 4.8,
    reviews_count: 1544,
  },
  {
    id: 'turmeric-powder',
    name: 'Turmeric Powder (Salem Haldi)',
    slug: 'turmeric-powder',
    tagline: 'Single-origin Salem haldi. High curcumin. No fillers.',
    story: 'Lab-tested at 4.5% curcumin. Colour is deep ochre, not neon yellow.',
    ingredients: '100% turmeric root, sun-dried and stone-ground.',
    how_to_use: 'A pinch in everything. Bloom in oil for a minute for best flavour.',
    category_slug: 'whole-spices',
    image: 'https://images.unsplash.com/photo-1716816211590-c15a328a5ff0',
    variants: [v('100 g', 79), v('250 g', 179), v('500 g', 329)],
    tags: ['lab-tested', 'single-origin'],
    purity_certified: true,
    featured: true,
    rating: 4.9,
    reviews_count: 1401,
  },
  {
    id: 'aged-basmati-rice',
    name: 'Aged Basmati Rice (1121)',
    slug: 'aged-basmati-rice',
    tagline: '12-month aged. Long, needle-thin grains. Non-sticky.',
    story: 'Aged in a controlled warehouse for 12 months. Moisture drops, grain hardens, and cooking doubles the length.',
    ingredients: '100% aged basmati rice (1121 long-grain).',
    how_to_use: 'Soak 20 min. Cook in 1:1.5 water. Never overcook.',
    category_slug: 'rice-grains',
    image: 'https://images.pexels.com/photos/15879426/pexels-photo-15879426.jpeg',
    variants: [v('1 kg', 249), v('5 kg', 1199)],
    tags: ['aged', 'long-grain'],
    purity_certified: true,
    featured: true,
    rating: 4.9,
    reviews_count: 2189,
  },
];

export const MOCK_RECIPES = [
  {
    slug: 'simple-dal-tadka',
    name: 'Simple Dal Tadka',
    image: 'https://images.pexels.com/photos/12737916/pexels-photo-12737916.jpeg',
    time_minutes: 28,
    serves: 3,
    ingredient_ids: ['unpolished-toor-dal', 'turmeric-powder'],
  },
  {
    slug: 'home-biryani-base',
    name: 'Home Biryani Base',
    image: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg',
    time_minutes: 45,
    serves: 4,
    ingredient_ids: ['aged-basmati-rice', 'a2-desi-cow-ghee'],
  },
];
