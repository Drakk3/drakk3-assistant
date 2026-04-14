import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
}

export function Card({ children }: CardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderDefault,
          borderRadius: 12,
          padding: theme.spacing.md,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 0.5,
    gap: 12,
  },
});
