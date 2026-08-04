export const colors = {
  cream: '#F7F7F7',
  creamDeep: '#F1F2F4',
  earth: '#171717',
  espresso: '#252525',
  saffron: '#E95F16',
  saffronDark: '#C94708',
  gold: '#F59E0B',
  goldSoft: '#FDE68A',
  jade: '#16834B',
  jadeLight: '#DDF4E8',
  dust: '#6B7280',
  dustLight: '#A1A1AA',
  white: '#FFFFFF',
  charcoal: '#111827',
  border: '#E8E8EA',
  divider: '#EEEEF0',
  error: '#DC2626',
  overlay: 'rgba(17, 24, 39, 0.48)',
  saffronTint: '#FFF1E8',
  jadeTint: '#E7F7EE',
  goldTint: '#FFF7D6',
  creamTint: 'rgba(255, 255, 255, 0.88)',
  earthMuted: 'rgba(23, 23, 23, 0.62)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const fonts = {
  display: 'PlusJakartaSans_600SemiBold',
  displayBold: 'PlusJakartaSans_700Bold',
  displayMedium: 'PlusJakartaSans_500Medium',
  displayItalic: 'PlusJakartaSans_700Bold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemibold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
};

export const type = {
  h1: { fontFamily: fonts.bodyBold, fontSize: 28, lineHeight: 34, color: colors.earth, letterSpacing: -0.8 },
  h2: { fontFamily: fonts.bodyBold, fontSize: 23, lineHeight: 29, color: colors.earth, letterSpacing: -0.5 },
  h3: { fontFamily: fonts.bodyBold, fontSize: 19, lineHeight: 25, color: colors.earth, letterSpacing: -0.3 },
  h4: { fontFamily: fonts.bodySemibold, fontSize: 16, lineHeight: 22, color: colors.earth },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.earth },
  bodyMed: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: colors.earth },
  bodyDim: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.dust },
  small: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16, color: colors.dust },
  smallMed: { fontFamily: fonts.bodyMedium, fontSize: 11.5, lineHeight: 16, color: colors.dust },
  price: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.earth },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: colors.saffronDark,
  },
};

export const shadow = {
  card: {
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  soft: {
    shadowColor: '#111827',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
};