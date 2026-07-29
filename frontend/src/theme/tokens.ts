import { Platform } from 'react-native';

export const colors = {
  cream: '#F5F0E8',
  earth: '#2C1810',
  saffron: '#E8873A',
  saffronDark: '#C9722A',
  gold: '#C9972A',
  jade: '#2D6A4F',
  jadeLight: '#3A8A65',
  dust: '#8B7355',
  dustLight: '#A89680',
  white: '#FEFCF8',
  charcoal: '#1A1A1A',
  border: '#EAE4D9',
  divider: '#EAE4D9',
  error: '#B03A2E',
  overlay: 'rgba(28, 20, 12, 0.55)',
  saffronTint: 'rgba(232, 135, 58, 0.12)',
  jadeTint: 'rgba(45, 106, 79, 0.10)',
  earthMuted: 'rgba(44, 24, 16, 0.6)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
};

// System fonts that best approximate Cormorant Garamond and Inter.
export const fonts = {
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }) as string,
  displayItalic: Platform.select({ ios: 'Georgia-Italic', android: 'serif', default: 'Georgia' }) as string,
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
  bodyMedium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }) as string,
};

export const type = {
  h1: { fontFamily: fonts.display, fontWeight: '700' as const, fontSize: 34, lineHeight: 40, color: colors.earth, letterSpacing: 0.2 },
  h2: { fontFamily: fonts.display, fontWeight: '700' as const, fontSize: 26, lineHeight: 32, color: colors.earth },
  h3: { fontFamily: fonts.display, fontWeight: '700' as const, fontSize: 22, lineHeight: 28, color: colors.earth },
  h4: { fontFamily: fonts.display, fontWeight: '700' as const, fontSize: 18, lineHeight: 24, color: colors.earth },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.earth },
  bodyDim: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.dust },
  small: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.dust },
  price: { fontFamily: fonts.bodyMedium, fontWeight: '700' as const, fontSize: 16, color: colors.earth },
  label: {
    fontFamily: fonts.bodyMedium,
    fontWeight: '600' as const,
    fontSize: 10,
    letterSpacing: 1.6, // ~0.12em for 10px
    textTransform: 'uppercase' as const,
    color: colors.saffronDark,
  },
};

export const shadow = {
  card: {
    shadowColor: '#2C1810',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  soft: {
    shadowColor: '#2C1810',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
};
