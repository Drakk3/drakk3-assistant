import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { BASE_COLORS, BORDER_WIDTH, RADIUS, SPACING } from '@/config/base';
import { STORAGE_KEYS } from '@/config/constants';
import { APP_THEMES, type AppThemeName } from '@/config/themes';
import { FONT_FAMILY, TYPOGRAPHY } from '@/config/typography';
import { handleError } from '@/shared/lib/errors';

interface ThemeContextValue {
  theme: {
    colors: typeof BASE_COLORS & (typeof APP_THEMES)[AppThemeName];
    radius: typeof RADIUS;
    spacing: typeof SPACING;
    borderWidth: typeof BORDER_WIDTH;
    typography: typeof TYPOGRAPHY;
    fontFamily: typeof FONT_FAMILY;
  };
  themeName: AppThemeName;
  isThemeReady: boolean;
  setThemeName: (value: AppThemeName) => Promise<void>;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const [themeName, setThemeNameState] = useState<AppThemeName>('green');
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    async function hydrateTheme(): Promise<void> {
      try {
        const storedTheme = await AsyncStorage.getItem(STORAGE_KEYS.themePreference);

        if (storedTheme === 'green' || storedTheme === 'violet') {
          setThemeNameState(storedTheme);
        }
      } catch (error) {
        handleError(error, 'ThemeProvider.hydrateTheme');
      } finally {
        setIsThemeReady(true);
      }
    }

    void hydrateTheme();
  }, []);

  const setThemeName = useCallback(async (value: AppThemeName): Promise<void> => {
    try {
      setThemeNameState(value);
      await AsyncStorage.setItem(STORAGE_KEYS.themePreference, value);
    } catch (error) {
      handleError(error, 'ThemeProvider.setThemeName');
    }
  }, []);

  const theme = useMemo(() => {
    return {
      colors: {
        ...BASE_COLORS,
        ...APP_THEMES[themeName],
      },
      radius: RADIUS,
      spacing: SPACING,
      borderWidth: BORDER_WIDTH,
      typography: TYPOGRAPHY,
      fontFamily: FONT_FAMILY,
    };
  }, [themeName]);

  const value = useMemo(() => {
    return {
      theme,
      themeName,
      isThemeReady,
      setThemeName,
    };
  }, [isThemeReady, setThemeName, theme, themeName]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
