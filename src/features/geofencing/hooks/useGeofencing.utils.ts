import type { LocationPoint, ZoneMembershipState, ZonePresenceState } from '@/features/geofencing/types';

interface LocationObjectLike {
  coords: {
    accuracy: number | null;
    latitude: number;
    longitude: number;
  };
  timestamp: number;
}

interface BackgroundLocationTaskData {
  locations: LocationObjectLike[];
}

export function isLocationPoint(value: unknown): value is LocationPoint {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const latitude = Reflect.get(value, 'latitude');
  const longitude = Reflect.get(value, 'longitude');
  const accuracy = Reflect.get(value, 'accuracy_meters');

  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    (typeof accuracy === 'number' || accuracy === null)
  );
}

export function isLocationObject(value: unknown): value is LocationObjectLike {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const coords = Reflect.get(value, 'coords');
  const timestamp = Reflect.get(value, 'timestamp');

  if (typeof timestamp !== 'number' || typeof coords !== 'object' || coords === null) {
    return false;
  }

  const latitude = Reflect.get(coords, 'latitude');
  const longitude = Reflect.get(coords, 'longitude');
  const accuracy = Reflect.get(coords, 'accuracy');

  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    (typeof accuracy === 'number' || accuracy === null)
  );
}

export function isBackgroundLocationTaskData(value: unknown): value is BackgroundLocationTaskData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const locations = Reflect.get(value, 'locations');

  return Array.isArray(locations) && locations.every((location: unknown) => isLocationObject(location));
}

export function toLocationPoint(location: LocationObjectLike): LocationPoint {
  return {
    accuracy_meters: location.coords.accuracy,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

export function toZoneStateMap(
  presenceStates: ZonePresenceState[]
): Record<string, ZoneMembershipState> {
  return presenceStates.reduce<Record<string, ZoneMembershipState>>((accumulator, presenceState) => {
    accumulator[presenceState.zone_id] = presenceState.current_state;
    return accumulator;
  }, {});
}

export function resolveGeofencingStatusLabel(
  isTrackingEnabled: boolean,
  zoneCount: number
): string {
  if (isTrackingEnabled) {
    return 'Tracking active';
  }

  if (zoneCount === 0) {
    return 'No active zones';
  }

  return 'Tracking idle';
}
