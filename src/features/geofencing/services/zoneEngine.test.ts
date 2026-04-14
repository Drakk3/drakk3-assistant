import { describe, expect, it } from 'vitest';

import { buildZoneDetectionResult, evaluateZone, resolveZoneThresholds } from '@/features/geofencing/services/zoneEngine';
import type { LocationPoint, Zone } from '@/features/geofencing/types';

const baseZone: Zone = {
  alexa_enabled: true,
  created_at: '2026-04-13T12:00:00.000Z',
  created_by: 'tester',
  enter_buffer_meters: 15,
  exit_buffer_meters: 15,
  id: 'zone-home',
  is_active: true,
  latitude: -34.6037,
  longitude: -58.3816,
  name: 'Home',
  radius_meters: 120,
  updated_at: '2026-04-13T12:00:00.000Z',
};

describe('zoneEngine', () => {
  it('applies enter and exit hysteresis thresholds', () => {
    expect(resolveZoneThresholds(baseZone)).toEqual({
      enterThresholdMeters: 105,
      exitThresholdMeters: 135,
    });
  });

  it('keeps gray band evaluations on the previous state', () => {
    const grayBandLocation: LocationPoint = {
      accuracy_meters: 6,
      latitude: -34.60274,
      longitude: -58.3816,
    };

    const evaluation = evaluateZone(grayBandLocation, baseZone, 'inside');

    expect(evaluation.eventType).toBeNull();
    expect(evaluation.isWithinGrayBand).toBe(true);
    expect(evaluation.nextState).toBe('inside');
  });

  it('creates candidate transitions only for active zones crossing thresholds', () => {
    const detection = buildZoneDetectionResult({
      createClientEventId: (): string => 'client-event-1',
      location: {
        accuracy_meters: 4,
        latitude: -34.6037,
        longitude: -58.3816,
      },
      occurredAt: '2026-04-13T12:00:00.000Z',
      source: 'manual-test',
      zoneStates: {
        'zone-home': 'outside',
      },
      zones: [
        baseZone,
        {
          ...baseZone,
          id: 'zone-disabled',
          is_active: false,
          name: 'Disabled',
        },
      ],
    });

    expect(detection.evaluations).toHaveLength(1);
    expect(detection.candidates).toEqual([
      {
        accuracy_meters: 4,
        client_event_id: 'client-event-1',
        event_source: 'manual-test',
        event_type: 'enter',
        latitude: -34.6037,
        longitude: -58.3816,
        occurred_at: '2026-04-13T12:00:00.000Z',
        zone_id: 'zone-home',
      },
    ]);
  });
});
