import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { LOCATION_TASK_NAME, QUERY_KEYS } from '@/config/constants';
import { useZoneDetection } from '@/features/geofencing/hooks/useZoneDetection';
import {
  isBackgroundLocationTaskData,
  isLocationPoint,
  resolveGeofencingStatusLabel,
  toLocationPoint,
  toZoneStateMap,
} from '@/features/geofencing/hooks/useGeofencing.utils';
import { listActiveZones, listZonePresenceStates } from '@/features/geofencing/services/geofencingApi';
import { useGeofencingStore } from '@/features/geofencing/store/geofencingStore';
import type { LocationPoint, Zone, ZoneEventSource, ZonePresenceState } from '@/features/geofencing/types';
import { useAuth } from '@/shared/hooks/useAuth';
import { ENV } from '@/config/env';
import { AppError, getErrorMessage, handleError } from '@/shared/lib/errors';

interface GeofencingPermissionState {
  background: string;
  foreground: string;
}

interface UseGeofencingResult {
  activeZoneIds: string[];
  activeZones: Zone[];
  errorMessage: string | null;
  isChecking: boolean;
  isLoadingRuntime: boolean;
  isRequestingPermissions: boolean;
  isStartingTracking: boolean;
  isTrackingEnabled: boolean;
  lastDetectionResult: import('@/features/geofencing/types').DetectionProcessingResult | null;
  lastKnownLocation: LocationPoint | null;
  lastTransitionResponse: import('@/features/geofencing/types').ProcessedTransition | null;
  permissionState: GeofencingPermissionState;
  processManualLocation: (
    location: LocationPoint,
    source?: ZoneEventSource
  ) => Promise<import('@/features/geofencing/types').DetectionProcessingResult>;
  refreshRuntime: () => Promise<void>;
  startTracking: () => Promise<boolean>;
  statusLabel: string;
  stopTracking: () => Promise<void>;
  zones: Zone[];
}

let backgroundLocationHandler: ((location: LocationPoint) => Promise<void>) | null = null;

if (!TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
  TaskManager.defineTask<unknown>(LOCATION_TASK_NAME, async ({ data, error }): Promise<void> => {
    if (error) {
      handleError(new AppError(error.message, 'useGeofencing.backgroundTask', error), 'useGeofencing.backgroundTask');
      return;
    }

    if (!backgroundLocationHandler || !isBackgroundLocationTaskData(data)) {
      return;
    }

    for (const location of data.locations) {
      await backgroundLocationHandler(toLocationPoint(location));
    }
  });
}

async function fetchActiveZones(): Promise<Zone[]> {
  try {
    return await listActiveZones();
  } catch (error) {
    throw new AppError('Failed to fetch active zones', 'useGeofencing.fetchActiveZones', error);
  }
}

async function fetchZonePresenceStates(userId: string): Promise<ZonePresenceState[]> {
  try {
    return await listZonePresenceStates(userId);
  } catch (error) {
    throw new AppError('Failed to fetch zone presence state', 'useGeofencing.fetchZonePresenceStates', error);
  }
}

export function useGeofencing(): UseGeofencingResult {
  const { isAuthenticated, session } = useAuth();
  const { activeZones, checkLocation, errorMessage: detectionErrorMessage, isChecking } = useZoneDetection();

  const isMountedRef = useRef(true);
  const foregroundSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const activeZoneIds = useGeofencingStore((state) => state.activeZoneIds);
  const isTrackingEnabled = useGeofencingStore((state) => state.isTrackingEnabled);
  const lastDetectionResult = useGeofencingStore((state) => state.lastDetectionResult);
  const lastKnownLocation = useGeofencingStore((state) => state.lastKnownLocation);
  const lastTransitionResponse = useGeofencingStore((state) => state.lastTransitionResponse);
  const setTrackingEnabled = useGeofencingStore((state) => state.setTrackingEnabled);
  const setZoneStates = useGeofencingStore((state) => state.setZoneStates);
  const setZones = useGeofencingStore((state) => state.setZones);
  const zones = useGeofencingStore((state) => state.zones);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [isStartingTracking, setIsStartingTracking] = useState(false);
  const [permissionState, setPermissionState] = useState<GeofencingPermissionState>({
    background: 'undetermined',
    foreground: 'undetermined',
  });

  const zonesQuery = useQuery({
    enabled: isAuthenticated || !ENV.hasSupabaseConfig,
    queryFn: fetchActiveZones,
    queryKey: QUERY_KEYS.geofencingZones,
  });

  const presenceQuery = useQuery({
    enabled: Boolean(session?.user.id) || !ENV.hasSupabaseConfig,
    queryFn: async (): Promise<ZonePresenceState[]> => {
      if (!session?.user.id && ENV.hasSupabaseConfig) {
        return [];
      }

      return fetchZonePresenceStates(session?.user.id ?? 'local-admin-user');
    },
    queryKey: [...QUERY_KEYS.geofencingPresence, session?.user.id ?? 'anonymous'],
  });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      foregroundSubscriptionRef.current?.remove();
      foregroundSubscriptionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (zonesQuery.data) {
      setZones(zonesQuery.data);
    }
  }, [setZones, zonesQuery.data]);

  useEffect(() => {
    if (presenceQuery.data) {
      setZoneStates(toZoneStateMap(presenceQuery.data));
    }
  }, [presenceQuery.data, setZoneStates]);

  useEffect(() => {
    backgroundLocationHandler = async (location: LocationPoint): Promise<void> => {
      try {
        await checkLocation(location, 'background');
      } catch (error) {
        handleError(error, 'useGeofencing.backgroundLocationHandler');
      }
    };

    return () => {
      backgroundLocationHandler = null;
    };
  }, [checkLocation]);

  useEffect(() => {
    if (zonesQuery.error) {
      const message = getErrorMessage(zonesQuery.error);
      handleError(zonesQuery.error, 'useGeofencing.zonesQuery');
      setErrorMessage(message);
    }
  }, [zonesQuery.error]);

  useEffect(() => {
    if (presenceQuery.error) {
      const message = getErrorMessage(presenceQuery.error);
      handleError(presenceQuery.error, 'useGeofencing.presenceQuery');
      setErrorMessage(message);
    }
  }, [presenceQuery.error]);

  const refreshRuntime = useCallback(async (): Promise<void> => {
    setErrorMessage(null);

    try {
      await Promise.all([zonesQuery.refetch(), presenceQuery.refetch()]);
    } catch (error) {
      handleError(error, 'useGeofencing.refreshRuntime');
      setErrorMessage(getErrorMessage(error));
    }
  }, [presenceQuery, zonesQuery]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setIsRequestingPermissions(true);
    setErrorMessage(null);

    try {
      const areServicesEnabled = await Location.hasServicesEnabledAsync();

      if (!areServicesEnabled) {
        throw new AppError('Location services are disabled on this device', 'useGeofencing.requestPermissions');
      }

      const foregroundPermission = await Location.requestForegroundPermissionsAsync();
      const nextPermissionState: GeofencingPermissionState = {
        background: permissionState.background,
        foreground: foregroundPermission.status,
      };

      if (foregroundPermission.status !== 'granted') {
        setPermissionState(nextPermissionState);
        return false;
      }

      let backgroundStatus = permissionState.background;

      if (Platform.OS !== 'web') {
        const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
        backgroundStatus = backgroundPermission.status;
      }

      setPermissionState({
        background: backgroundStatus,
        foreground: foregroundPermission.status,
      });

      return backgroundStatus === 'granted' || Platform.OS === 'web';
    } catch (error) {
      handleError(error, 'useGeofencing.requestPermissions');
      setErrorMessage(getErrorMessage(error));
      return false;
    } finally {
      setIsRequestingPermissions(false);
    }
  }, [permissionState.background]);

  const handleForegroundLocation = useCallback(
    async (location: Location.LocationObject): Promise<void> => {
      try {
        await checkLocation(toLocationPoint(location), 'foreground');
      } catch (error) {
        handleError(error, 'useGeofencing.handleForegroundLocation');
        setErrorMessage(getErrorMessage(error));
      }
    },
    [checkLocation]
  );

  const startTracking = useCallback(async (): Promise<boolean> => {
    setIsStartingTracking(true);
    setErrorMessage(null);

    try {
      const hasTaskManager = await TaskManager.isAvailableAsync();

      if (!hasTaskManager && Platform.OS !== 'web') {
        throw new AppError(
          'TaskManager background execution is unavailable in this environment',
          'useGeofencing.startTracking'
        );
      }

      const hasPermissions = await requestPermissions();

      if (!hasPermissions && Platform.OS !== 'web') {
        return false;
      }

      foregroundSubscriptionRef.current?.remove();
      foregroundSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 25,
          timeInterval: 15_000,
        },
        (location: Location.LocationObject): void => {
          void handleForegroundLocation(location);
        }
      );

      if (hasTaskManager && Platform.OS !== 'web') {
        const hasStartedTask = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

        if (!hasStartedTask) {
          await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            activityType: Location.ActivityType.Other,
            deferredUpdatesDistance: 50,
            deferredUpdatesInterval: 60_000,
            distanceInterval: 25,
            foregroundService: {
              killServiceOnDestroy: false,
              notificationBody: 'Monitoring active zones for enter and exit transitions.',
              notificationTitle: 'drakk3 geofencing active',
            },
            pausesUpdatesAutomatically: false,
            showsBackgroundLocationIndicator: true,
            timeInterval: 15_000,
          });
        }
      }

      if (isMountedRef.current) {
        setTrackingEnabled(true);
      }

      return true;
    } catch (error) {
      handleError(error, 'useGeofencing.startTracking');
      setErrorMessage(getErrorMessage(error));
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsStartingTracking(false);
      }
    }
  }, [handleForegroundLocation, requestPermissions, setTrackingEnabled]);

  const stopTracking = useCallback(async (): Promise<void> => {
    setErrorMessage(null);

    try {
      foregroundSubscriptionRef.current?.remove();
      foregroundSubscriptionRef.current = null;

      if (Platform.OS !== 'web') {
        const hasStartedTask = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

        if (hasStartedTask) {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
      }

      if (isMountedRef.current) {
        setTrackingEnabled(false);
      }
    } catch (error) {
      handleError(error, 'useGeofencing.stopTracking');
      setErrorMessage(getErrorMessage(error));
    }
  }, [setTrackingEnabled]);

  const processManualLocation = useCallback(
    async (location: LocationPoint, source: ZoneEventSource = 'manual-test'): Promise<import('@/features/geofencing/types').DetectionProcessingResult> => {
      if (!isLocationPoint(location)) {
        throw new AppError('Invalid manual location payload', 'useGeofencing.processManualLocation');
      }

      setErrorMessage(null);

      try {
        return await checkLocation(location, source);
      } catch (error) {
        handleError(error, 'useGeofencing.processManualLocation');
        setErrorMessage(getErrorMessage(error));
        throw new AppError('Failed to process manual location', 'useGeofencing.processManualLocation', error);
      }
    },
    [checkLocation]
  );

  const statusLabel = useMemo(() => {
    return resolveGeofencingStatusLabel(isTrackingEnabled, zones.length);
  }, [isTrackingEnabled, zones.length]);

  return {
    activeZoneIds,
    activeZones,
    errorMessage: errorMessage ?? detectionErrorMessage,
    isChecking,
    isLoadingRuntime: zonesQuery.isLoading || presenceQuery.isLoading,
    isRequestingPermissions,
    isStartingTracking,
    isTrackingEnabled,
    lastDetectionResult,
    lastKnownLocation,
    lastTransitionResponse,
    permissionState,
    processManualLocation,
    refreshRuntime,
    startTracking,
    statusLabel,
    stopTracking,
    zones,
  };
}
