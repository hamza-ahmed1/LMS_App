// TCF Campus palette from The Citizens Foundation logo (leaf green #0B8A44, black wordmark).
// primary is a touch deeper than the logo green so text on white keeps good contrast.
export const colors = {
  brand: '#0B8A44',
  primary: '#0A7F3F',
  primaryDark: '#0B4A29',
  primaryLight: '#E2F3E8',
  secondary: '#0F5C34',
  danger: '#D64545',
  warning: '#D98E04',
  success: '#14874B',
  background: '#F3F8F4',
  surface: '#FFFFFF',
  border: '#D6E6DB',
  textPrimary: '#10271A',
  textSecondary: '#3D5747',
  textMuted: '#7A9083',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  full: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyBold: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
};

export const shadow = {
  card: {
    shadowColor: '#0B1533',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
};
