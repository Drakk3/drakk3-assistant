export const BASE_COLORS = {
  bg: '#0A0A0A',
  surface: '#111111',
  elevated: '#161616',
  input: '#0F0F0F',
  borderDefault: '#1E1E1E',
  borderEmphasis: '#2A2A2A',
  textPrimary: '#E2E2E2',
  textSecondary: '#888888',
  textMuted: '#444444',
  danger: '#E05C5C',
  warning: '#F0A500',
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_WIDTH = {
  default: 0.5,
  focus: 1,
} as const;

export const MOTION = {
  fast: 150,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
