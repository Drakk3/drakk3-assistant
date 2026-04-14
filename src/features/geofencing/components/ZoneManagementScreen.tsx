import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useZoneAdmin } from '@/features/geofencing/hooks/useZoneAdmin';
import type { AdminZoneRecord } from '@/features/geofencing/types';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { AdminShell } from '@/shared/components/AdminShell';
import { useTheme } from '@/shared/hooks/useTheme';

export function ZoneManagementScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const {
    cancelEditing,
    editingZoneId,
    errorMessage,
    formErrors,
    formValues,
    handleEditZone,
    handleFieldChange,
    handleStartCreate,
    handleSubmit,
    handleToggleZoneState,
    isEditing,
    isFallbackMode,
    isLoading,
    isSaving,
    zones,
  } = useZoneAdmin();

  const handleSubmitZone = useCallback((): void => {
    void handleSubmit();
  }, [handleSubmit]);

  const handleResetEditor = useCallback((): void => {
    cancelEditing();
  }, [cancelEditing]);

  return (
    <AdminShell
      description="Create, edit, and activate zones through feature hooks and service wrappers. The screen degrades to a typed fallback runtime when Supabase envs are missing."
      title="Zones"
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Badge label={isFallbackMode ? 'Fallback data' : 'Supabase ready'} tone={isFallbackMode ? 'warning' : 'active'} />
          <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Admin zone management</Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}> 
            Respecting the MVP contract: zones and Alexa trigger settings are editable here, while runtime events stay backend-owned.
          </Text>
          <View style={styles.actionsRow}>
            <Button isDisabled={isSaving} label="New zone" onPress={handleStartCreate} />
            <Button isDisabled={isSaving} label="Reset editor" onPress={handleResetEditor} variant="ghost" />
          </View>
          {errorMessage ? <Text style={[styles.body, { color: theme.colors.danger }]}>{errorMessage}</Text> : null}
        </Card>

        <Card>
          <Badge label={isEditing ? 'Editing zone' : 'Create zone'} tone={isEditing ? 'active' : 'muted'} />
          <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>
            {isEditing ? `Zone editor · ${editingZoneId}` : 'Zone editor'}
          </Text>
          <View style={styles.formGrid}>
            <Input
              autoCapitalize="words"
              errorMessage={formErrors.name}
              label="Zone name"
              onChangeText={(value: string): void => handleFieldChange('name', value)}
              placeholder="Home base"
              value={formValues.name}
            />
            <Input
              errorMessage={formErrors.latitude}
              helperText="Decimal latitude"
              keyboardType="decimal-pad"
              label="Latitude"
              onChangeText={(value: string): void => handleFieldChange('latitude', value)}
              placeholder="-34.6037"
              value={formValues.latitude}
            />
            <Input
              errorMessage={formErrors.longitude}
              helperText="Decimal longitude"
              keyboardType="decimal-pad"
              label="Longitude"
              onChangeText={(value: string): void => handleFieldChange('longitude', value)}
              placeholder="-58.3816"
              value={formValues.longitude}
            />
            <Input
              errorMessage={formErrors.radiusMeters}
              helperText="20 to 5000 meters"
              keyboardType="number-pad"
              label="Radius meters"
              onChangeText={(value: string): void => handleFieldChange('radiusMeters', value)}
              placeholder="120"
              value={formValues.radiusMeters}
            />
            <Input
              errorMessage={formErrors.enterBufferMeters}
              helperText="0 to 100 meters"
              keyboardType="number-pad"
              label="Enter buffer"
              onChangeText={(value: string): void => handleFieldChange('enterBufferMeters', value)}
              placeholder="15"
              value={formValues.enterBufferMeters}
            />
            <Input
              errorMessage={formErrors.exitBufferMeters}
              helperText="0 to 100 meters"
              keyboardType="number-pad"
              label="Exit buffer"
              onChangeText={(value: string): void => handleFieldChange('exitBufferMeters', value)}
              placeholder="15"
              value={formValues.exitBufferMeters}
            />
            <Input
              errorMessage={formErrors.messageTemplate}
              helperText="Supported placeholders: {name}, {zone}, {event}"
              label="Message template"
              onChangeText={(value: string): void => handleFieldChange('messageTemplate', value)}
              placeholder="{name} entered {zone}"
              value={formValues.messageTemplate}
            />
            <Input
              helperText="Only required for Alexa mode"
              label="Target device"
              onChangeText={(value: string): void => handleFieldChange('targetDevice', value)}
              placeholder="Living Room Echo"
              value={formValues.targetDevice}
            />
          </View>

          <View style={styles.actionsRow}>
            <Button
              label={`Provider: ${formValues.provider}`}
              onPress={(): void => handleFieldChange('provider', formValues.provider === 'mock' ? 'alexa' : 'mock')}
              variant="muted"
            />
            <Button
              label={`Zone ${formValues.isActive ? 'active' : 'inactive'}`}
              onPress={(): void => handleFieldChange('isActive', !formValues.isActive)}
              variant="muted"
            />
            <Button
              label={`Dispatch ${formValues.alexaEnabled ? 'enabled' : 'disabled'}`}
              onPress={(): void => handleFieldChange('alexaEnabled', !formValues.alexaEnabled)}
              variant="muted"
            />
            <Button
              label={`Trigger ${formValues.triggerIsActive ? 'active' : 'inactive'}`}
              onPress={(): void => handleFieldChange('triggerIsActive', !formValues.triggerIsActive)}
              variant="muted"
            />
          </View>

          <Button isLoading={isSaving} label={isEditing ? 'Save zone changes' : 'Create zone'} onPress={handleSubmitZone} />
        </Card>

        <View style={styles.listColumn}>
          {isLoading && zones.length === 0 ? (
            <Card>
              <Text style={[styles.body, { color: theme.colors.textSecondary }]}>Loading zones…</Text>
            </Card>
          ) : null}

          {zones.map((zoneRecord: AdminZoneRecord) => {
            return <ZoneRecordCard key={zoneRecord.zone.id} onEdit={handleEditZone} onToggleState={handleToggleZoneState} zoneRecord={zoneRecord} />;
          })}

          {zones.length === 0 && !isLoading ? (
            <Card>
              <Text style={[styles.body, { color: theme.colors.textSecondary }]}>No zones yet. Create one to bootstrap the admin flow.</Text>
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </AdminShell>
  );
}

interface ZoneRecordCardProps {
  onEdit: (zoneRecord: AdminZoneRecord) => void;
  onToggleState: (zoneRecord: AdminZoneRecord) => Promise<void>;
  zoneRecord: AdminZoneRecord;
}

function ZoneRecordCard({ onEdit, onToggleState, zoneRecord }: ZoneRecordCardProps): React.JSX.Element {
  const { theme } = useTheme();

  const handleEdit = useCallback((): void => {
    onEdit(zoneRecord);
  }, [onEdit, zoneRecord]);

  const handleToggle = useCallback((): void => {
    void onToggleState(zoneRecord);
  }, [onToggleState, zoneRecord]);

  return (
    <Card>
      <Badge label={zoneRecord.zone.is_active ? 'Active zone' : 'Inactive zone'} tone={zoneRecord.zone.is_active ? 'active' : 'warning'} />
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>{zoneRecord.zone.name}</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}> 
        {zoneRecord.zone.latitude.toFixed(4)}, {zoneRecord.zone.longitude.toFixed(4)} · radius {zoneRecord.zone.radius_meters}m · buffers {zoneRecord.zone.enter_buffer_meters}/{zoneRecord.zone.exit_buffer_meters}m
      </Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}> 
        Provider {zoneRecord.trigger?.provider ?? 'mock'} · target {zoneRecord.trigger?.target_device ?? 'not set'} · dispatch {zoneRecord.zone.alexa_enabled ? 'enabled' : 'disabled'}
      </Text>
      <View style={styles.actionsRow}>
        <Button label="Edit" onPress={handleEdit} variant="muted" />
        <Button label={zoneRecord.zone.is_active ? 'Deactivate' : 'Activate'} onPress={handleToggle} variant="ghost" />
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
  content: {
    gap: 16,
    paddingBottom: 32,
  },
  formGrid: {
    gap: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  listColumn: {
    gap: 16,
  },
});
