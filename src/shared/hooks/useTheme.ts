import { useContext } from 'react';

import { ThemeContext } from '@/shared/providers/ThemeProvider';

export function useTheme(): NonNullable<React.ContextType<typeof ThemeContext>> {
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return themeContext;
}
