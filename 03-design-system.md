# drakk3ai — Design System

> **Document version:** 1.0
> **Status:** Base definition — pre-code
>
> ### Update policy
> This document may be updated once the codebase is running.
> **No changes may be applied without explicit confirmation from @drakk3 (David).**
> Proposed updates must be presented as a diff of the affected section,
> with a reason for the change. Update is only valid after verbal or written approval.

---

## Creative north star: "The Silent Operator"

Precision tool, not a consumer app. Command-line utility refined through
high-end editorial restraint. **Hacker discipline meets premium restraint.**

Core rules that override everything:
- Elevation through background layers — never shadows
- 0.5px borders only — anything thicker is clunky
- Left-aligned always — no center alignment ever
- No gradients, no blur, no glow effects
- Transitions snap (150ms) — elements appear, they don't arrive

---

## Token files

```ts
// config/base.ts — fixed across all themes
export const base = {
  bg:             '#0a0a0a',
  surface:        '#111111',
  elevated:       '#161616',
  borderDefault:  '#1e1e1e',
  borderEmphasis: '#2a2a2a',
  textPrimary:    '#e2e2e2',
  textSecondary:  '#888888',
  textMuted:      '#444444',
  danger:         '#e05c5c',
  warning:        '#f0a500',
} as const;

// config/themes.ts — swap accent here to change the whole app
export const themes = {
  green: {
    accent:       '#1db954',
    accentHover:  '#17a349',
    accentBg:     '#0d2818',
    accentBorder: '#1e3a2e',
  },
  violet: {
    accent:       '#ba9eff',
    accentHover:  '#8455ef',
    accentBg:     '#1a0d33',
    accentBorder: '#2e1a5e',
  },
} as const;

export type ThemeName = keyof typeof themes;
export type Theme = typeof themes[ThemeName] & typeof base;

export function buildTheme(name: ThemeName): Theme {
  return { ...base, ...themes[name] };
}
```

---

## ThemeContext

```ts
// shared/hooks/useTheme.ts
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildTheme, ThemeName, Theme } from '../../config/themes';

const STORAGE_KEY = '@drakk3ai:theme';

interface ThemeContextValue {
  theme:     Theme;
  themeName: ThemeName;
  setTheme:  (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('green');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored === 'green' || stored === 'violet') setThemeName(stored);
    });
  }, []);

  const setTheme = (name: ThemeName) => {
    setThemeName(name);
    AsyncStorage.setItem(STORAGE_KEY, name);
    // Also persist to Supabase profiles.theme_preference
  };

  return (
    <ThemeContext.Provider value={{ theme: buildTheme(themeName), themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
```

---

## Typography

Font family: `SF Mono` → `Fira Code` → `JetBrains Mono` (fallback chain)

```ts
// config/typography.ts
export const typography = {
  display: { fontSize: 28, fontWeight: '700', letterSpacing: -0.56 },
  heading: { fontSize: 18, fontWeight: '600', letterSpacing: -0.18 },
  body:    { fontSize: 13, fontWeight: '400', letterSpacing: 0.13 },
  label:   { fontSize: 10, fontWeight: '500', letterSpacing: 1.4  },  // UPPERCASE
  mono:    { fontSize: 11, fontWeight: '400', letterSpacing: 0.66 },
} as const;
```

---

## Design tokens

| Token | Value |
|---|---|
| `radiusSm` | 6 |
| `radiusMd` | 10 |
| `radiusLg` | 14 |
| `radiusPill` | 999 |
| `borderWidth` | 0.5 |
| `borderFocus` | 1 (accent color) |
| Spacing | 4 · 8 · 12 · 16 · 24 · 32 · 48 |

---

## Components

### Button

```tsx
// shared/components/Button.tsx
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type Variant = 'primary' | 'ghost' | 'muted';

interface ButtonProps {
  label:    string;
  variant?: Variant;
  onPress:  () => void;
  disabled?: boolean;
}

export function Button({ label, variant = 'primary', onPress, disabled }: ButtonProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    primary: {
      backgroundColor: theme.accent,
      borderRadius: 7,
      paddingHorizontal: 18,
      paddingVertical: 9,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: 7,
      borderWidth: 0.5,
      borderColor: theme.accent,
      paddingHorizontal: 18,
      paddingVertical: 9,
    },
    muted: {
      backgroundColor: theme.elevated,
      borderRadius: 7,
      borderWidth: 0.5,
      borderColor: '#222',
      paddingHorizontal: 18,
      paddingVertical: 9,
    },
    primaryText: { color: '#0a0a0a', fontSize: 11, fontWeight: '700',
                   letterSpacing: 0.66, textTransform: 'uppercase' },
    ghostText:   { color: theme.accent, fontSize: 11, fontWeight: '500',
                   letterSpacing: 0.66 },
    mutedText:   { color: '#555', fontSize: 11, letterSpacing: 0.66 },
  });

  const textStyle = variant === 'primary' ? styles.primaryText
                  : variant === 'ghost'   ? styles.ghostText
                  : styles.mutedText;

  return (
    <TouchableOpacity style={styles[variant]} onPress={onPress}
      disabled={disabled} activeOpacity={0.75}>
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}
```

### Badge

```tsx
// shared/components/Badge.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type Status = 'active' | 'away' | 'offline' | 'unknown';

const statusTokens: Record<Status, { bg: string; text: string; border: string }> = {
  active:  { bg: '',      text: '',      border: '' },  // filled from theme at runtime
  away:    { bg: '#1a1200', text: '#f0a500', border: '#3a2e00' },
  offline: { bg: '#1a0808', text: '#e05c5c', border: '#3a1212' },
  unknown: { bg: '#111',    text: '#444',    border: '#1e1e1e' },
};

export function Badge({ status }: { status: Status }) {
  const { theme } = useTheme();

  const tokens = status === 'active'
    ? { bg: theme.accentBg, text: theme.accent, border: theme.accentBorder }
    : statusTokens[status];

  return (
    <View style={{ backgroundColor: tokens.bg, borderWidth: 0.5,
      borderColor: tokens.border, borderRadius: 4,
      paddingHorizontal: 9, paddingVertical: 3 }}>
      <Text style={{ color: tokens.text, fontSize: 9, fontWeight: '700',
        letterSpacing: 0.8, textTransform: 'uppercase' }}>
        {status}
      </Text>
    </View>
  );
}
```

### Card

```tsx
// shared/components/Card.tsx
import { View, ViewProps } from 'react-native';
import { base } from '../../config/base';

export function Card({ children, style, ...props }: ViewProps) {
  return (
    <View style={[{
      backgroundColor: base.surface,
      borderWidth: 0.5,
      borderColor: base.borderDefault,
      borderRadius: 12,
      padding: 16,
    }, style]} {...props}>
      {children}
    </View>
  );
}
```

### Input

```tsx
// shared/components/Input.tsx
import { useState } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { base } from '../../config/base';

interface InputProps extends TextInputProps {
  label?: string;
}

export function Input({ label, style, ...props }: InputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View>
      {label && (
        <Text style={{ color: base.textMuted, fontSize: 10, fontWeight: '500',
          letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
          {label}
        </Text>
      )}
      <TextInput
        style={[{
          backgroundColor: '#0f0f0f',
          borderWidth: 0.5,
          borderColor: focused ? theme.accent : base.borderEmphasis,
          borderRadius: 7,
          paddingHorizontal: 14,
          paddingVertical: 10,
          color: '#cccccc',
          fontSize: 11,
          fontFamily: 'SFMono-Regular',
        }, style]}
        placeholderTextColor={base.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </View>
  );
}
```

---

## Motion

```ts
// config/motion.ts
export const motion = {
  duration: 150,
  easing: [0.4, 0, 0.2, 1] as const, // cubic-bezier — swift snap
};
```

- No entrance animations — elements appear, they don't arrive
- No bouncy or elastic curves
- Active state pulse: `opacity` keyframe only (`1 → 0.4 → 1`)
- Haptic feedback on zone enter/exit events via `expo-haptics`
