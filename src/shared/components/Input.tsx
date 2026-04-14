import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';

import { resolveInputBorderState } from '@/shared/components/primitives';
import { useTheme } from '@/shared/hooks/useTheme';

interface InputProps {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  errorMessage?: string;
  helperText?: string;
  keyboardType?: KeyboardTypeOptions;
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  value: string;
}

export function Input({
  autoCapitalize = 'none',
  autoCorrect = false,
  errorMessage,
  helperText,
  keyboardType = 'default',
  label,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  value,
}: InputProps): React.JSX.Element {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderState = useMemo(() => {
    return resolveInputBorderState(errorMessage, isFocused, theme.colors);
  }, [errorMessage, isFocused, theme.colors]);

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.typography.label.fontSize,
            fontWeight: theme.typography.label.fontWeight,
            letterSpacing: theme.typography.label.letterSpacing,
            lineHeight: theme.typography.label.lineHeight,
          },
        ]}
      >
        {label.toUpperCase()}
      </Text>

      <TextInput
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        onBlur={() => setIsFocused(false)}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        secureTextEntry={secureTextEntry}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.input,
            borderColor: borderState.borderColor,
            borderWidth: borderState.borderWidth,
            color: theme.colors.textPrimary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.typography.body.fontSize,
            fontWeight: theme.typography.body.fontWeight,
            letterSpacing: theme.typography.body.letterSpacing,
            lineHeight: theme.typography.body.lineHeight,
          },
        ]}
        value={value}
      />

      {helperText ? (
        <Text
          style={[
            styles.helper,
            {
              color: theme.colors.textMuted,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.typography.mono.fontSize,
              fontWeight: theme.typography.mono.fontWeight,
              letterSpacing: theme.typography.mono.letterSpacing,
              lineHeight: theme.typography.mono.lineHeight,
            },
          ]}
        >
          {helperText}
        </Text>
      ) : null}

      {errorMessage ? (
        <Text
          style={[
            styles.helper,
            {
              color: theme.colors.danger,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.typography.mono.fontSize,
              fontWeight: theme.typography.mono.fontWeight,
              letterSpacing: theme.typography.mono.letterSpacing,
              lineHeight: theme.typography.mono.lineHeight,
            },
          ]}
        >
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  helper: {
    marginTop: -2,
  },
  input: {
    borderRadius: 10,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    textAlignVertical: 'center',
  },
});
