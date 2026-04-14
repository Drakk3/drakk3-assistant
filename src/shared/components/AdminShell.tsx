import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config/constants';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTheme } from '@/shared/hooks/useTheme';

interface AdminShellProps {
  children: React.ReactNode;
  description: string;
  title: string;
}

export function AdminShell({ children, description, title }: AdminShellProps) {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { theme, themeName, setThemeName } = useTheme();

  const handleGoHome = useCallback((): void => {
    router.push(ROUTES.adminHome);
  }, [router]);

  const handleGoZones = useCallback((): void => {
    router.push(ROUTES.adminZones);
  }, [router]);

  const handleGoEvents = useCallback((): void => {
    router.push(ROUTES.adminEvents);
  }, [router]);

  const handleToggleTheme = useCallback((): void => {
    const nextTheme = themeName === 'green' ? 'violet' : 'green';
    void setThemeName(nextTheme);
  }, [setThemeName, themeName]);

  const handleSignOut = useCallback((): void => {
    void signOut();
  }, [signOut]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.bg }]}> 
      <View style={[styles.container, { padding: theme.spacing.lg }]}> 
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderDefault,
              borderRadius: 14,
              padding: theme.spacing.md,
            },
          ]}
        >
          <View style={styles.headerCopy}>
            <Badge label={profile?.role ?? 'guest'} tone="active" />

            <Text
              style={[
                styles.title,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.fontFamily.bold,
                  fontSize: theme.typography.heading.fontSize,
                  fontWeight: theme.typography.heading.fontWeight,
                  letterSpacing: theme.typography.heading.letterSpacing,
                  lineHeight: theme.typography.heading.lineHeight,
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

          <View style={styles.navRow}>
            <Button label="Dashboard" onPress={handleGoHome} variant="muted" />
            <Button label="Zones" onPress={handleGoZones} variant="muted" />
            <Button label="Events" onPress={handleGoEvents} variant="muted" />
          </View>

          <View style={styles.navRow}>
            <Button label={`Theme: ${themeName}`} onPress={handleToggleTheme} variant="ghost" />
            <Button label="Sign out" onPress={handleSignOut} variant="ghost" />
          </View>
        </View>

        <View style={styles.body}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: 16,
  },
  container: {
    flex: 1,
    gap: 16,
  },
  description: {
    maxWidth: 560,
  },
  header: {
    borderWidth: 0.5,
    gap: 16,
  },
  headerCopy: {
    gap: 8,
  },
  navRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  safeArea: {
    flex: 1,
  },
  title: {
    maxWidth: 560,
  },
});
