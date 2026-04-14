import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useGeofencing } from '@/features/geofencing/hooks/useGeofencing';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { useTheme } from '@/shared/hooks/useTheme';

export function GeofencingRuntimeCard(): React.JSX.Element {
  const { theme } = useTheme();
  const {
    activeZoneIds,
    errorMessage,
    isChecking,
    isLoadingRuntime,
    isRequestingPermissions,
    isStartingTracking,
    isTrackingEnabled,
    lastDetectionResult,
    lastTransitionResponse,
    processManualLocation,
    refreshRuntime,
    startTracking,
    statusLabel,
    stopTracking,
    zones,
  } = useGeofencing();

  const runtimeTone: 'active' | 'danger' | 'warning' = errorMessage ? 'danger' : isTrackingEnabled ? 'active' : 'warning';
  const primaryZone = zones[0] ?? null;

  const transitionLabel = useMemo(() => {
    if (!lastTransitionResponse) {
      return 'No transitions yet';
    }

    return `${lastTransitionResponse.candidate.event_type.toUpperCase()} · ${lastTransitionResponse.response.result}`;
  }, [lastTransitionResponse]);

  const handleEnableTracking = useCallback((): void => {
    void startTracking();
  }, [startTracking]);

  const handlePauseTracking = useCallback((): void => {
    void stopTracking();
  }, [stopTracking]);

  const handleRefreshRuntime = useCallback((): void => {
    void refreshRuntime();
  }, [refreshRuntime]);

  const handleSimulateEnter = useCallback((): void => {
    if (!primaryZone) {
      return;
    }

    void processManualLocation({
      accuracy_meters: 8,
      latitude: primaryZone.latitude,
      longitude: primaryZone.longitude,
    });
  }, [primaryZone, processManualLocation]);

  const handleSimulateExit = useCallback((): void => {
    if (!primaryZone) {
      return;
    }

    void processManualLocation({
      accuracy_meters: 8,
      latitude: primaryZone.latitude + 0.01,
      longitude: primaryZone.longitude + 0.01,
    });
  }, [primaryZone, processManualLocation]);

  return (
    <Card>
      <Badge label={statusLabel} tone={runtimeTone} />
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Geofencing runtime</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        Active zones: {zones.length} · Inside now: {activeZoneIds.length} · Candidates this cycle:{' '}
        {lastDetectionResult?.candidates.length ?? 0}
      </Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>Last transition: {transitionLabel}</Text>
      {errorMessage ? <Text style={[styles.body, { color: theme.colors.danger }]}>{errorMessage}</Text> : null}
      <View style={styles.actionsRow}>
        <Button
          isDisabled={isTrackingEnabled}
          isLoading={isRequestingPermissions || isStartingTracking}
          label="Enable tracking"
          onPress={handleEnableTracking}
        />
        <Button isDisabled={!isTrackingEnabled} label="Pause tracking" onPress={handlePauseTracking} variant="ghost" />
        <Button isDisabled={isLoadingRuntime} label="Refresh runtime" onPress={handleRefreshRuntime} variant="muted" />
        <Button isDisabled={!primaryZone || isChecking} label="Simulate enter" onPress={handleSimulateEnter} variant="muted" />
        <Button isDisabled={!primaryZone || isChecking} label="Simulate exit" onPress={handleSimulateExit} variant="ghost" />
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
