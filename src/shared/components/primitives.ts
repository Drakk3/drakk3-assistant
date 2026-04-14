import { BORDER_WIDTH } from '@/config/base';

interface PrimitiveThemeColors {
  accent: string;
  accentBg: string;
  accentBorder: string;
  bg: string;
  borderDefault: string;
  borderEmphasis: string;
  danger: string;
  elevated: string;
  input: string;
  textMuted: string;
  textPrimary: string;
  textSecondary: string;
  warning: string;
}

export interface PrimitiveButtonColors {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

export interface PrimitiveBadgeColors {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

export interface PrimitiveInputBorderState {
  borderColor: string;
  borderWidth: number;
}

export function resolveButtonColors(
  variant: 'primary' | 'ghost' | 'muted',
  themeColors: PrimitiveThemeColors
): PrimitiveButtonColors {
  if (variant === 'ghost') {
    return {
      backgroundColor: 'transparent',
      borderColor: themeColors.accent,
      textColor: themeColors.accent,
    };
  }

  if (variant === 'muted') {
    return {
      backgroundColor: themeColors.elevated,
      borderColor: themeColors.borderEmphasis,
      textColor: themeColors.textSecondary,
    };
  }

  return {
    backgroundColor: themeColors.accent,
    borderColor: themeColors.accent,
    textColor: themeColors.bg,
  };
}

export function resolveBadgeColors(
  tone: 'active' | 'warning' | 'danger' | 'muted',
  themeColors: PrimitiveThemeColors
): PrimitiveBadgeColors {
  if (tone === 'active') {
    return {
      backgroundColor: themeColors.accentBg,
      borderColor: themeColors.accentBorder,
      textColor: themeColors.accent,
    };
  }

  if (tone === 'warning') {
    return {
      backgroundColor: themeColors.elevated,
      borderColor: themeColors.warning,
      textColor: themeColors.warning,
    };
  }

  if (tone === 'danger') {
    return {
      backgroundColor: themeColors.elevated,
      borderColor: themeColors.danger,
      textColor: themeColors.danger,
    };
  }

  return {
    backgroundColor: themeColors.elevated,
    borderColor: themeColors.borderDefault,
    textColor: themeColors.textSecondary,
  };
}

export function resolveInputBorderState(
  errorMessage: string | undefined,
  isFocused: boolean,
  themeColors: PrimitiveThemeColors
): PrimitiveInputBorderState {
  if (errorMessage) {
    return {
      borderColor: themeColors.danger,
      borderWidth: BORDER_WIDTH.focus,
    };
  }

  return {
    borderColor: isFocused ? themeColors.accent : themeColors.borderEmphasis,
    borderWidth: isFocused ? BORDER_WIDTH.focus : BORDER_WIDTH.default,
  };
}
