export const APP_THEMES = {
  green: {
    accent: '#1DB954',
    accentHover: '#17A349',
    accentBg: '#0D2818',
    accentBorder: '#1E3A2E',
  },
  violet: {
    accent: '#BA9EFF',
    accentHover: '#8455EF',
    accentBg: '#1A0D33',
    accentBorder: '#2E1A5E',
  },
} as const;

export type AppThemeName = keyof typeof APP_THEMES;
