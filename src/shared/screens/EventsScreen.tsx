import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import { AdminShell } from '@/shared/components/AdminShell';
import { useTheme } from '@/shared/hooks/useTheme';

export function EventsScreen() {
  const { theme } = useTheme();

  return (
    <AdminShell
      description="Reserved route for event history and operational visibility once geofencing and backend processing are connected."
      title="Events"
    >
      <Card>
        <Badge label="Read model later" tone="muted" />
        <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Event history wiring is deferred</Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
          The route group exists now, but accepted transition persistence stays behind the backend contract.
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
