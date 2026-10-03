export const colors = {
  primary: '#0F5EFE',
  primaryDark: '#0B3FB0',
  primaryLight: '#E8EFFF',
  secondary: '#00B894',
  danger: '#E74C3C',
  warning: '#F5A623',
  success: '#22A06B',
  background: '#F6F8FC',
  surface: '#FFFFFF',
  border: '#E4E9F2',
  textPrimary: '#1A2340',
  textSecondary: '#6B7488',
  textMuted: '#9AA3B2',
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
