// (Platform import removed — fonts are now bundled TTFs, no system fallbacks.)

export const colors = {
  cream: '#FBF8F1',
  creamDeep: '#F1E8D8',
  earth: '#241A10',
  espresso: '#3A2A1B',
  saffron: '#C9682C',
  saffronDark: '#A84E1F',
  gold: '#B0862B',
  goldSoft: '#D9B25A',
  jade: '#1E5A43',
  jadeLight: '#2E7357',
  dust: '#8A7960',
  dustLight: '#B4A489',
  white: '#FFFEFB',
  charcoal: '#1A1A1A',
  border: '#ECE3D3',
  divider: '#ECE3D3',
  error: '#A5342B',
  overlay: 'rgba(28, 20, 12, 0.55)',
  saffronTint: 'rgba(201, 104, 44, 0.12)',
  jadeTint: 'rgba(30, 90, 67, 0.10)',
  goldTint: 'rgba(176, 134, 43, 0.14)',
  creamTint: 'rgba(255, 254, 251, 0.85)',
  earthMuted: 'rgba(36, 26, 16, 0.6)',
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

// Premium pairing: Playfair Display (display) + Plus Jakarta Sans (body/UI).
// Weights are baked into distinct family names — never combine with fontWeight.
export const fonts = {
  display: 'PlayfairDisplay_600SemiBold',
  displayBold: 'PlayfairDisplay_700Bold',
  displayMedium: 'PlayfairDisplay_500Medium',
  displayItalic: 'PlayfairDisplay_700BoldItalic',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemibold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
};

export const type = {
  h1: { fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 38, color: colors.earth, letterSpacing: 0.2 },
  h2: { fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 32, color: colors.earth },
  h3: { fontFamily: fonts.display, fontSize: 21, lineHeight: 28, color: colors.earth },
  h4: { fontFamily: fonts.display, fontSize: 17, lineHeight: 23, color: colors.earth },
  body: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: colors.earth },
  bodyMed: { fontFamily: fonts.bodyMedium, fontSize: 14.5, lineHeight: 21, color: colors.earth },
  bodyDim: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.dust },
  small: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.dust },
  smallMed: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16, color: colors.dust },
  price: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.earth },
  label: {
    fontFamily: fonts.bodySemibold,
    fontSize: 10.5,
    letterSpacing: 1.4,
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
