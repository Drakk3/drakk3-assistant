import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/shared/components/Card';
import { useTheme } from '@/shared/hooks/useTheme';

interface AuthShellProps {
  children: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}

export function AuthShell({ children, description, eyebrow, title }: AuthShellProps) {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.colors.bg }]}
    >
      <View style={[styles.container, { padding: theme.spacing.lg }]}> 
        <View style={styles.header}>
          <Text
            style={[
              styles.eyebrow,
              {
                color: theme.colors.accent,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.typography.label.fontSize,
                fontWeight: theme.typography.label.fontWeight,
                letterSpacing: theme.typography.label.letterSpacing,
                lineHeight: theme.typography.label.lineHeight,
              },
            ]}
          >
            {eyebrow.toUpperCase()}
          </Text>

          <Text
            style={[
              styles.title,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.fontFamily.bold,
                fontSize: theme.typography.display.fontSize,
                fontWeight: theme.typography.display.fontWeight,
                letterSpacing: theme.typography.display.letterSpacing,
                lineHeight: theme.typography.display.lineHeight,
              },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.description,
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
            {description}
          </Text>
        </View>

        <Card>{children}</Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 24,
    justifyContent: 'center',
  },
  description: {
    maxWidth: 420,
  },
  eyebrow: {
    textTransform: 'uppercase',
  },
  header: {
    gap: 8,
  },
  safeArea: {
    flex: 1,
  },
  title: {
    maxWidth: 420,
  },
});
