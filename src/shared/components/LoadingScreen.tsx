import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/shared/hooks/useTheme';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Preparing workspace…' }: LoadingScreenProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}> 
      <ActivityIndicator color={theme.colors.accent} />
      <Text
        style={[
          styles.message,
          {
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.typography.body.fontSize,
            fontWeight: theme.typography.body.fontWeight,
            letterSpacing: theme.typography.body.letterSpacing,
            lineHeight: theme.typography.body.lineHeight,
          },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  message: {
    maxWidth: 280,
  },
});
