import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useOperationalVisibility } from '@/features/geofencing/hooks/useOperationalVisibility';
import type { OperationalEventRecord, ZoneOperationalState } from '@/features/geofencing/types';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { AdminShell } from '@/shared/components/AdminShell';
import { useTheme } from '@/shared/hooks/useTheme';

export function OperationalVisibilityScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const { errorMessage, events, isFallbackMode, isLoading, operationalState, refresh, summary } = useOperationalVisibility();

  const handleRefresh = useCallback((): void => {
    void refresh();
  }, [refresh]);

  return (
    <AdminShell
      description="Inspect accepted transition history and basic operational state. The read model stays aligned with backend-owned location_events and zone_presence_state, with an explicit fallback runtime when envs are absent."
      title="Events"
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Badge label={isFallbackMode ? 'Fallback visibility' : 'Live visibility'} tone={isFallbackMode ? 'warning' : 'active'} />
          <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Operational summary</Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}> 
            Events {summary.totalEventCount} · Zones {summary.activeZoneCount}/{summary.totalZoneCount} active · Inside {summary.insideZoneCount}
          </Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}> 
            Dispatch pending {summary.pendingDispatchCount} · mocked {summary.mockedDispatchCount} · sent {summary.sentDispatchCount} · failed {summary.failedDispatchCount}
          </Text>
          <View style={styles.actionsRow}>
            <Button isDisabled={isLoading} label="Refresh history" onPress={handleRefresh} variant="muted" />
          </View>
          {errorMessage ? <Text style={[styles.body, { color: theme.colors.danger }]}>{errorMessage}</Text> : null}
        </Card>

        <View style={styles.sectionColumn}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Zone operational state</Text>
          {operationalState.map((item: ZoneOperationalState) => {
            return <OperationalStateRow key={item.zoneId} operationalState={item} />;
          })}
        </View>

        <View style={styles.sectionColumn}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Accepted event history</Text>
          {events.map((event: OperationalEventRecord) => {
            return <EventHistoryRow event={event} key={event.id} />;
          })}

          {events.length === 0 ? (
            <Card>
              <Text style={[styles.body, { color: theme.colors.textSecondary }]}>No accepted transitions yet.</Text>
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </AdminShell>
  );
}

interface OperationalStateRowProps {
  operationalState: ZoneOperationalState;
}

function OperationalStateRow({ operationalState }: OperationalStateRowProps): React.JSX.Element {
  const { theme } = useTheme();
  const tone = operationalState.lastDispatchStatus === 'failed' ? 'danger' : operationalState.isActive ? 'active' : 'warning';

  return (
    <Card>
      <Badge label={`${operationalState.zoneName} · ${operationalState.currentState}`} tone={tone} />
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}> 
        Provider {operationalState.provider ?? 'mock'} · target {operationalState.targetDevice ?? 'not set'} · last event {operationalState.lastEventType ?? 'none'}
      </Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}> 
        Last dispatch {operationalState.lastDispatchStatus ?? 'n/a'} · distance {operationalState.lastDistanceMeters ?? 'n/a'}m · updated {operationalState.updatedAt ?? 'n/a'}
      </Text>
      {operationalState.dispatchError ? <Text style={[styles.body, { color: theme.colors.danger }]}>{operationalState.dispatchError}</Text> : null}
    </Card>
  );
}

interface EventHistoryRowProps {
  event: OperationalEventRecord;
}

function EventHistoryRow({ event }: EventHistoryRowProps): React.JSX.Element {
  const { theme } = useTheme();
  const tone = event.dispatch_status === 'failed' ? 'danger' : event.dispatch_status === 'pending' ? 'warning' : 'active';

  return (
    <Card>
      <Badge label={`${event.event_type.toUpperCase()} · ${event.dispatch_status}`} tone={tone} />
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>{event.zone_name}</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}> 
        {event.triggered_at} · source {event.event_source} · distance {event.distance_meters}m · provider {event.provider ?? 'mock'}
      </Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}> 
        Lat {event.latitude.toFixed(4)} · Lng {event.longitude.toFixed(4)} · target {event.target_device ?? 'not set'}
      </Text>
      {event.dispatch_error ? <Text style={[styles.body, { color: theme.colors.danger }]}>{event.dispatch_error}</Text> : null}
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
  content: {
    gap: 16,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  sectionColumn: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
});
