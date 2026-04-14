import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveButtonColors } from '@/shared/components/primitives';
import { useTheme } from '@/shared/hooks/useTheme';

interface ButtonProps {
  isDisabled?: boolean;
  isLoading?: boolean;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'muted';
}

export function Button({
  isDisabled = false,
  isLoading = false,
  label,
  onPress,
  variant = 'primary',
}: ButtonProps): React.JSX.Element {
  const { theme } = useTheme();

  const colors = useMemo(() => {
    return resolveButtonColors(variant, theme.colors);
  }, [theme.colors, variant]);

  const isInactive = isDisabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isInactive}
      onPress={onPress}
      style={({ pressed }) => {
        return [
          styles.button,
          {
            backgroundColor: colors.backgroundColor,
            borderColor: colors.borderColor,
            opacity: isInactive ? 0.5 : pressed ? 0.8 : 1,
          },
        ];
      }}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.label,
            {
              color: colors.textColor,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.typography.body.fontSize,
              fontWeight: theme.typography.heading.fontWeight,
              letterSpacing: theme.typography.body.letterSpacing,
              lineHeight: theme.typography.body.lineHeight,
            },
          ]}
        >
          {isLoading ? 'Working…' : label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 7,
    borderWidth: 0.5,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  label: {
    textAlignVertical: 'center',
  },
});
