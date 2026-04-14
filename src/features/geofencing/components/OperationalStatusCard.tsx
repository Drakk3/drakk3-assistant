import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useOperationalVisibility } from '@/features/geofencing/hooks/useOperationalVisibility';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { useTheme } from '@/shared/hooks/useTheme';

export function OperationalStatusCard(): React.JSX.Element {
  const { theme } = useTheme();
  const { errorMessage, isFallbackMode, isLoading, refresh, summary } = useOperationalVisibility();

  const handleRefresh = useCallback((): void => {
    void refresh();
  }, [refresh]);

  return (
    <Card>
      <Badge label={isFallbackMode ? 'Fallback runtime' : 'Supabase runtime'} tone={isFallbackMode ? 'warning' : 'active'} />
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Operational visibility</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}> 
        Zones {summary.activeZoneCount}/{summary.totalZoneCount} active · Inside {summary.insideZoneCount} · Events {summary.totalEventCount}
      </Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}> 
        Dispatch mocked {summary.mockedDispatchCount} · sent {summary.sentDispatchCount} · failed {summary.failedDispatchCount}
      </Text>
      {errorMessage ? <Text style={[styles.body, { color: theme.colors.danger }]}>{errorMessage}</Text> : null}
      <View style={styles.actionsRow}>
        <Button isDisabled={isLoading} label="Refresh ops" onPress={handleRefresh} variant="muted" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
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
