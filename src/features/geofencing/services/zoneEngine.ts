import { haversineDistanceMeters } from '@/shared/lib/haversine';

import type {
  LocationPoint,
  Zone,
  ZoneDetectionResult,
  ZoneEvaluation,
  ZoneEventSource,
  ZoneMembershipState,
  ZoneThresholds,
} from '@/features/geofencing/types';

const DEFAULT_ENTER_BUFFER_METERS = 15;
const DEFAULT_EXIT_BUFFER_METERS = 15;

interface BuildDetectionResultInput {
  createClientEventId: () => string;
  location: LocationPoint;
  occurredAt: string;
  source: ZoneEventSource;
  zoneStates: Record<string, ZoneMembershipState>;
  zones: Zone[];
}

export function resolveZoneThresholds(zone: Zone): ZoneThresholds {
  const enterBufferMeters = zone.enter_buffer_meters ?? DEFAULT_ENTER_BUFFER_METERS;
  const exitBufferMeters = zone.exit_buffer_meters ?? DEFAULT_EXIT_BUFFER_METERS;

  return {
    enterThresholdMeters: Math.max(0, zone.radius_meters - enterBufferMeters),
    exitThresholdMeters: zone.radius_meters + exitBufferMeters,
  };
}

export function getDistanceToZoneMeters(location: LocationPoint, zone: Zone): number {
  return haversineDistanceMeters(location, {
    latitude: zone.latitude,
    longitude: zone.longitude,
  });
}

export function evaluateZone(location: LocationPoint, zone: Zone, previousState: ZoneMembershipState): ZoneEvaluation {
  const distanceMeters = getDistanceToZoneMeters(location, zone);
  const thresholds = resolveZoneThresholds(zone);
  const isInsideEnterThreshold = distanceMeters <= thresholds.enterThresholdMeters;
  const isOutsideExitThreshold = distanceMeters >= thresholds.exitThresholdMeters;

  if (previousState === 'outside' && isInsideEnterThreshold) {
    return {
      distanceMeters,
      enterThresholdMeters: thresholds.enterThresholdMeters,
      eventType: 'enter',
      exitThresholdMeters: thresholds.exitThresholdMeters,
      isWithinGrayBand: false,
      nextState: 'inside',
      previousState,
      zone,
    };
  }

  if (previousState === 'inside' && isOutsideExitThreshold) {
    return {
      distanceMeters,
      enterThresholdMeters: thresholds.enterThresholdMeters,
      eventType: 'exit',
      exitThresholdMeters: thresholds.exitThresholdMeters,
      isWithinGrayBand: false,
      nextState: 'outside',
      previousState,
      zone,
    };
  }

  const isWithinGrayBand =
    distanceMeters > thresholds.enterThresholdMeters && distanceMeters < thresholds.exitThresholdMeters;

  return {
    distanceMeters,
    enterThresholdMeters: thresholds.enterThresholdMeters,
    eventType: null,
    exitThresholdMeters: thresholds.exitThresholdMeters,
    isWithinGrayBand,
    nextState: previousState,
    previousState,
    zone,
  };
}

export function buildZoneDetectionResult({
  createClientEventId,
  location,
  occurredAt,
  source,
  zoneStates,
  zones,
}: BuildDetectionResultInput): ZoneDetectionResult {
  const evaluations = zones
    .filter((zone: Zone) => zone.is_active)
    .map((zone: Zone) => {
      const previousState = zoneStates[zone.id] ?? 'outside';

      return evaluateZone(location, zone, previousState);
    });

  const candidates = evaluations
    .filter((evaluation: ZoneEvaluation) => evaluation.eventType !== null)
    .map((evaluation: ZoneEvaluation) => {
      return {
        accuracy_meters: location.accuracy_meters,
        client_event_id: createClientEventId(),
        event_source: source,
        event_type: evaluation.eventType === null ? 'enter' : evaluation.eventType,
        latitude: location.latitude,
        longitude: location.longitude,
        occurred_at: occurredAt,
        zone_id: evaluation.zone.id,
      };
    });

  return {
    candidates,
    evaluations,
    processedAt: occurredAt,
    source,
  };
}
