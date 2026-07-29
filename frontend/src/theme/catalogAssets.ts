// Curated imagery + accent tints per category for a premium, editorial browse.
export const categoryImages: Record<string, string> = {
  'flours-atta': 'https://images.pexels.com/photos/17236203/pexels-photo-17236203.jpeg',
  'oils-ghee': 'https://images.pexels.com/photos/20689446/pexels-photo-20689446.jpeg',
  'dals-pulses': 'https://images.unsplash.com/photo-1590517136325-5ddc364fc36f',
  'whole-spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d',
  'rice-grains': 'https://images.pexels.com/photos/15879426/pexels-photo-15879426.jpeg',
  'millets': 'https://images.pexels.com/photos/18275951/pexels-photo-18275951.jpeg',
  'specialty-flours': 'https://images.pexels.com/photos/17236203/pexels-photo-17236203.jpeg',
  'healthy-staples': 'https://images.pexels.com/photos/7334141/pexels-photo-7334141.jpeg',
};

export function catImage(slug: string, fallback?: string): string {
  return categoryImages[slug] || fallback || 'https://images.pexels.com/photos/54084/wheat-grain-agriculture-seed-54084.jpeg';
}

// Editorial "collections" strip on Home.
export const collections = [
  {
    key: 'thali',
    label: 'The Everyday Thali',
    caption: 'Atta · Dal · Rice · Ghee',
    image: 'https://images.pexels.com/photos/20689446/pexels-photo-20689446.jpeg',
    slug: 'oils-ghee',
  },
  {
    key: 'cold-pressed',
    label: 'Cold-Pressed Oils',
    caption: 'Wooden ghani, single press',
    image: 'https://images.unsplash.com/photo-1552592074-ea7a91b851b3',
    slug: 'oils-ghee',
  },
  {
    key: 'spice-box',
    label: 'The Spice Box',
    caption: 'Whole, sun-dried, hand-cleaned',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d',
    slug: 'whole-spices',
  },
  {
    key: 'unpolished-dals',
    label: 'Unpolished Dals',
    caption: 'Nothing stripped away',
    image: 'https://images.unsplash.com/photo-1590517136325-5ddc364fc36f',
    slug: 'dals-pulses',
  },
];
