import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/config/constants';
import { isSupabaseRuntimeConfigured, listAdminZones, saveAdminZone, toggleAdminZone } from '@/features/geofencing/services/geofencingApi';
import type { AdminZoneRecord, SaveZoneInput, ZoneFormErrors, ZoneFormValues } from '@/features/geofencing/types';
import { useGeofencingStore } from '@/features/geofencing/store/geofencingStore';
import { useAuth } from '@/shared/hooks/useAuth';
import { getErrorMessage, handleError, ValidationError } from '@/shared/lib/errors';

interface UseZoneAdminResult {
  cancelEditing: () => void;
  editingZoneId: string | null;
  errorMessage: string | null;
  formErrors: ZoneFormErrors;
  formValues: ZoneFormValues;
  handleEditZone: (zoneRecord: AdminZoneRecord) => void;
  handleFieldChange: (field: keyof ZoneFormValues, value: boolean | string) => void;
  handleStartCreate: () => void;
  handleSubmit: () => Promise<void>;
  handleToggleZoneState: (zoneRecord: AdminZoneRecord) => Promise<void>;
  isEditing: boolean;
  isFallbackMode: boolean;
  isLoading: boolean;
  isSaving: boolean;
  zones: AdminZoneRecord[];
}

const DEFAULT_FORM_VALUES: ZoneFormValues = {
  alexaEnabled: true,
  enterBufferMeters: '15',
  exitBufferMeters: '15',
  isActive: true,
  latitude: '',
  longitude: '',
  messageTemplate: '{name} entered {zone}',
  name: '',
  provider: 'mock',
  radiusMeters: '120',
  targetDevice: '',
  triggerIsActive: true,
};

function toFormValues(zoneRecord: AdminZoneRecord): ZoneFormValues {
  return {
    alexaEnabled: zoneRecord.zone.alexa_enabled,
    enterBufferMeters: String(zoneRecord.zone.enter_buffer_meters),
    exitBufferMeters: String(zoneRecord.zone.exit_buffer_meters),
    isActive: zoneRecord.zone.is_active,
    latitude: String(zoneRecord.zone.latitude),
    longitude: String(zoneRecord.zone.longitude),
    messageTemplate: zoneRecord.trigger?.message_template ?? '{name} entered {zone}',
    name: zoneRecord.zone.name,
    provider: zoneRecord.trigger?.provider ?? 'mock',
    radiusMeters: String(zoneRecord.zone.radius_meters),
    targetDevice: zoneRecord.trigger?.target_device ?? '',
    triggerIsActive: zoneRecord.trigger?.is_active ?? true,
  };
}

function parseNumber(value: string, field: keyof ZoneFormErrors): number {
  const parsedValue = Number(value.trim());

  if (!Number.isFinite(parsedValue)) {
    throw new ValidationError(`Invalid ${field} value`, 'useZoneAdmin.parseNumber');
  }

  return parsedValue;
}

function validateFormValues(formValues: ZoneFormValues): ZoneFormErrors {
  const errors: ZoneFormErrors = {};
  const name = formValues.name.trim();
  const messageTemplate = formValues.messageTemplate.trim();

  if (name.length < 3) {
    errors.name = 'Zone name must contain at least 3 characters.';
  }

  try {
    const latitude = parseNumber(formValues.latitude, 'latitude');

    if (latitude < -90 || latitude > 90) {
      errors.latitude = 'Latitude must be between -90 and 90.';
    }
  } catch (error) {
    errors.latitude = getErrorMessage(error);
  }

  try {
    const longitude = parseNumber(formValues.longitude, 'longitude');

    if (longitude < -180 || longitude > 180) {
      errors.longitude = 'Longitude must be between -180 and 180.';
    }
  } catch (error) {
    errors.longitude = getErrorMessage(error);
  }

  try {
    const radiusMeters = parseNumber(formValues.radiusMeters, 'radiusMeters');

    if (radiusMeters < 20 || radiusMeters > 5000) {
      errors.radiusMeters = 'Radius must stay between 20 and 5000 meters.';
    }
  } catch (error) {
    errors.radiusMeters = getErrorMessage(error);
  }

  try {
    const enterBufferMeters = parseNumber(formValues.enterBufferMeters, 'enterBufferMeters');

    if (enterBufferMeters < 0 || enterBufferMeters > 100) {
      errors.enterBufferMeters = 'Enter buffer must stay between 0 and 100 meters.';
    }
  } catch (error) {
    errors.enterBufferMeters = getErrorMessage(error);
  }

  try {
    const exitBufferMeters = parseNumber(formValues.exitBufferMeters, 'exitBufferMeters');

    if (exitBufferMeters < 0 || exitBufferMeters > 100) {
      errors.exitBufferMeters = 'Exit buffer must stay between 0 and 100 meters.';
    }
  } catch (error) {
    errors.exitBufferMeters = getErrorMessage(error);
  }

  if (messageTemplate.length === 0) {
    errors.messageTemplate = 'Message template is required.';
  }

  return errors;
}

function buildSaveZoneInput(formValues: ZoneFormValues, editingZoneId: string | null, createdBy: string): SaveZoneInput {
  return {
    alexa_enabled: formValues.alexaEnabled,
    created_by: createdBy,
    enter_buffer_meters: Math.round(parseNumber(formValues.enterBufferMeters, 'enterBufferMeters')),
    exit_buffer_meters: Math.round(parseNumber(formValues.exitBufferMeters, 'exitBufferMeters')),
    is_active: formValues.isActive,
    latitude: parseNumber(formValues.latitude, 'latitude'),
    longitude: parseNumber(formValues.longitude, 'longitude'),
    message_template: formValues.messageTemplate.trim(),
    name: formValues.name.trim(),
    provider: formValues.provider,
    radius_meters: Math.round(parseNumber(formValues.radiusMeters, 'radiusMeters')),
    target_device: formValues.targetDevice.trim() || null,
    trigger_is_active: formValues.triggerIsActive,
    zone_id: editingZoneId ?? undefined,
  };
}

export function useZoneAdmin(): UseZoneAdminResult {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const setZoneRecords = useGeofencingStore((state) => state.setZoneRecords);

  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<ZoneFormErrors>({});
  const [formValues, setFormValues] = useState<ZoneFormValues>(DEFAULT_FORM_VALUES);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const zonesQuery = useQuery({
    queryFn: listAdminZones,
    queryKey: QUERY_KEYS.adminZones,
  });

  const saveMutation = useMutation({
    mutationFn: saveAdminZone,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ isActive, zoneId }: { isActive: boolean; zoneId: string }) => toggleAdminZone(zoneId, isActive),
  });

  const zones = zonesQuery.data ?? [];

  useEffect(() => {
    if (zonesQuery.data) {
      setZoneRecords(zonesQuery.data);
    }
  }, [setZoneRecords, zonesQuery.data]);

  const resetEditor = useCallback((): void => {
    setEditingZoneId(null);
    setFormErrors({});
    setFormValues(DEFAULT_FORM_VALUES);
    setErrorMessage(null);
  }, []);

  const handleFieldChange = useCallback((field: keyof ZoneFormValues, value: boolean | string): void => {
    setFormValues((currentState: ZoneFormValues) => ({
      ...currentState,
      [field]: value,
    }));
  }, []);

  const handleStartCreate = useCallback((): void => {
    resetEditor();
  }, [resetEditor]);

  const handleEditZone = useCallback((zoneRecord: AdminZoneRecord): void => {
    setEditingZoneId(zoneRecord.zone.id);
    setFormErrors({});
    setFormValues(toFormValues(zoneRecord));
    setErrorMessage(null);
  }, []);

  const refreshQueries = useCallback(async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminEvents }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOperationalState }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminZones }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.geofencingZones }),
    ]);
  }, [queryClient]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    setErrorMessage(null);

    const nextErrors = validateFormValues(formValues);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setErrorMessage('Zone form has validation errors');
      return;
    }

    try {
      const createdBy = session?.user.id ?? 'local-admin-user';
      await saveMutation.mutateAsync(buildSaveZoneInput(formValues, editingZoneId, createdBy));
      await refreshQueries();
      resetEditor();
    } catch (error) {
      handleError(error, 'useZoneAdmin.handleSubmit');
      setErrorMessage(getErrorMessage(error));
    }
  }, [editingZoneId, formValues, refreshQueries, resetEditor, saveMutation, session?.user.id]);

  const handleToggleZoneState = useCallback(
    async (zoneRecord: AdminZoneRecord): Promise<void> => {
      setErrorMessage(null);

      try {
        await toggleMutation.mutateAsync({
          isActive: !zoneRecord.zone.is_active,
          zoneId: zoneRecord.zone.id,
        });
        await refreshQueries();
      } catch (error) {
        handleError(error, 'useZoneAdmin.handleToggleZoneState');
        setErrorMessage(getErrorMessage(error));
      }
    },
    [refreshQueries, toggleMutation]
  );

  const isLoading = zonesQuery.isLoading;

  const isFallbackMode = !isSupabaseRuntimeConfigured();

  return {
    cancelEditing: resetEditor,
    editingZoneId,
    errorMessage: errorMessage ?? (zonesQuery.error ? getErrorMessage(zonesQuery.error) : null),
    formErrors,
    formValues,
    handleEditZone,
    handleFieldChange,
    handleStartCreate,
    handleSubmit,
    handleToggleZoneState,
    isEditing: Boolean(editingZoneId),
    isFallbackMode,
    isLoading,
    isSaving: saveMutation.isPending || toggleMutation.isPending,
    zones,
  };
}
