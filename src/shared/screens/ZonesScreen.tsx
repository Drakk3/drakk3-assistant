import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import { AdminShell } from '@/shared/components/AdminShell';
import { useTheme } from '@/shared/hooks/useTheme';

export function ZonesScreen() {
  const { theme } = useTheme();

  return (
    <AdminShell
      description="Reserved route for admin zone CRUD. Structure exists now so the next batch can plug data and forms without reworking navigation."
      title="Zones"
    >
      <Card>
        <Badge label="Deferred" tone="warning" />
        <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Zone CRUD lands in the next batch</Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
          This screen is intentionally shell-only. No direct client insert to location_events will be added here.
        </Text>
      </Card>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
});
