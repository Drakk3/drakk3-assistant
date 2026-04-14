import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import { AdminShell } from '@/shared/components/AdminShell';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTheme } from '@/shared/hooks/useTheme';

export function AdminHomeScreen(): React.JSX.Element {
  const { profile, session } = useAuth();
  const { theme } = useTheme();

  return (
    <AdminShell
      description="Protected admin workspace with placeholders for zones, events, and future geofencing batches."
      title="Operator dashboard"
    >
      <Card>
        <Badge label="Authenticated" tone="active" />
        <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Runtime foundation</Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}> 
          Auth state, route guards, theme persistence, and shared primitives are wired and ready.
        </Text>
      </Card>

      <View style={styles.grid}>
        <Card>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>ADMIN</Text>
          <Text style={[styles.body, { color: theme.colors.textPrimary }]}>
            {profile?.display_name ?? 'Profile pending provisioning'}
          </Text>
        </Card>

        <Card>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>SESSION</Text>
          <Text style={[styles.body, { color: theme.colors.textPrimary }]}> 
            {session?.user.email ?? 'No active session'}
          </Text>
        </Card>
      </View>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  grid: {
    gap: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1.4,
    lineHeight: 14,
  },
});
