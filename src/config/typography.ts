export const FONT_FAMILY = {
  regular: 'monospace',
  medium: 'monospace',
  bold: 'monospace',
} as const;

export const TYPOGRAPHY = {
  display: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.56,
    lineHeight: 34,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.18,
    lineHeight: 24,
  },
  body: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.13,
    lineHeight: 18,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1.4,
    lineHeight: 14,
  },
  mono: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.66,
    lineHeight: 16,
  },
} as const;
