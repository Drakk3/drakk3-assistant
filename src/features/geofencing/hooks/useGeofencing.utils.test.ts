import { describe, expect, it } from 'vitest';

import {
  isBackgroundLocationTaskData,
  isLocationObject,
  isLocationPoint,
  resolveGeofencingStatusLabel,
  toLocationPoint,
  toZoneStateMap,
} from '@/features/geofencing/hooks/useGeofencing.utils';
import type { ZonePresenceState } from '@/features/geofencing/types';

describe('useGeofencing utils', () => {
  it('validates manual location payloads before local smoke processing', () => {
    expect(
      isLocationPoint({
        accuracy_meters: 6,
        latitude: -34.6,
        longitude: -58.38,
      })
    ).toBe(true);

    expect(isLocationPoint({ latitude: -34.6, longitude: -58.38 })).toBe(false);
  });

  it('accepts Expo-style location objects and converts them into domain points', () => {
    const location = {
      coords: {
        accuracy: 4,
        latitude: -34.6,
        longitude: -58.38,
      },
      timestamp: 1,
    };

    expect(isLocationObject(location)).toBe(true);
    expect(isBackgroundLocationTaskData({ locations: [location] })).toBe(true);
    expect(toLocationPoint(location)).toEqual({
      accuracy_meters: 4,
      latitude: -34.6,
      longitude: -58.38,
    });
  });

  it('maps presence records and status labels for the tracking runtime', () => {
    const presenceStates: ZonePresenceState[] = [
      {
        current_state: 'inside',
        last_distance_meters: 8,
        last_event_at: '2026-04-13T12:00:00.000Z',
        last_event_type: 'enter',
        updated_at: '2026-04-13T12:00:00.000Z',
        user_id: 'user-1',
        zone_id: 'zone-1',
      },
    ];

    expect(toZoneStateMap(presenceStates)).toEqual({ 'zone-1': 'inside' });
    expect(resolveGeofencingStatusLabel(true, 1)).toBe('Tracking active');
    expect(resolveGeofencingStatusLabel(false, 0)).toBe('No active zones');
    expect(resolveGeofencingStatusLabel(false, 2)).toBe('Tracking idle');
  });
});
