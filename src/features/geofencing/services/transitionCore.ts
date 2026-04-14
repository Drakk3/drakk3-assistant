import { getDistanceToZoneMeters, resolveZoneThresholds } from '@/features/geofencing/services/zoneEngine';

import type { TransitionApiRequest, TransitionApiResponse, ZoneMembershipState } from '@/features/geofencing/types';
import type { AlexaTriggerRow, LocationEventRow, ZonePresenceStateRow, ZoneRow } from '@/shared/types/database';

export const TRANSITION_COOLDOWN_MS = 30_000;

export interface TriggerDispatchResolution {
  dispatchError: string | null;
  dispatchStatus: LocationEventRow['dispatch_status'];
}

export interface ProcessZoneTransitionInput {
  createEventId: () => string;
  dispatch: TriggerDispatchResolution;
  existingEvent: LocationEventRow | null;
  now: string;
  payload: TransitionApiRequest;
  presenceState: ZonePresenceStateRow | null;
  userId: string;
  zone: ZoneRow | null;
}

export interface AcceptedTransitionDecision {
  event: LocationEventRow;
  kind: 'accepted';
  presenceState: ZonePresenceStateRow;
  response: TransitionApiResponse;
}

export interface RejectedTransitionDecision {
  kind: 'rejected';
  response: TransitionApiResponse;
}

export type ProcessZoneTransitionDecision = AcceptedTransitionDecision | RejectedTransitionDecision;

function hasFiniteAccuracy(value: TransitionApiRequest['accuracy_meters']): boolean {
  return value === null || Number.isFinite(value);
}

function resolveRequestedState(eventType: TransitionApiRequest['event_type']): ZoneMembershipState {
  return eventType === 'enter' ? 'inside' : 'outside';
}

export function isTransitionPayloadValid(payload: TransitionApiRequest): boolean {
  const occurredAt = Date.parse(payload.occurred_at);

  return (
    payload.client_event_id.length > 0 &&
    payload.zone_id.length > 0 &&
    Number.isFinite(payload.latitude) &&
    Number.isFinite(payload.longitude) &&
    hasFiniteAccuracy(payload.accuracy_meters) &&
    (payload.event_type === 'enter' || payload.event_type === 'exit') &&
    Number.isFinite(occurredAt)
  );
}

export function processZoneTransitionDecision({
  createEventId,
  dispatch,
  existingEvent,
  now,
  payload,
  presenceState,
  userId,
  zone,
}: ProcessZoneTransitionInput): ProcessZoneTransitionDecision {
  if (!isTransitionPayloadValid(payload)) {
    return {
      kind: 'rejected',
      response: {
        dispatch_status: null,
        event_id: null,
        message: 'Transition request contains an invalid payload.',
        result: 'rejected_invalid_payload',
      },
    };
  }

  if (!zone || !zone.is_active) {
    return {
      kind: 'rejected',
      response: {
        dispatch_status: null,
        event_id: null,
        message: 'Transition request references an inactive or missing zone.',
        result: 'rejected_invalid_zone',
      },
    };
  }

  if (existingEvent) {
    return {
      kind: 'rejected',
      response: {
        dispatch_status: existingEvent.dispatch_status,
        event_id: existingEvent.id,
        message: 'Transition request reused an existing accepted event.',
        result: 'ignored_duplicate',
      },
    };
  }

  const distanceMeters = Math.round(
    getDistanceToZoneMeters(payload, {
      ...zone,
    })
  );
  const thresholds = resolveZoneThresholds(zone);
  const currentState = presenceState?.current_state ?? 'outside';

  if (payload.event_type === 'enter' && distanceMeters > thresholds.enterThresholdMeters) {
    return {
      kind: 'rejected',
      response: {
        dispatch_status: null,
        event_id: null,
        message: 'Transition request remained inside the hysteresis gray band.',
        result: 'ignored_hysteresis',
      },
    };
  }

  if (payload.event_type === 'exit' && distanceMeters < thresholds.exitThresholdMeters) {
    return {
      kind: 'rejected',
      response: {
        dispatch_status: null,
        event_id: null,
        message: 'Transition request remained inside the hysteresis gray band.',
        result: 'ignored_hysteresis',
      },
    };
  }

  const requestedState = resolveRequestedState(payload.event_type);

  if (currentState === requestedState) {
    return {
      kind: 'rejected',
      response: {
        dispatch_status: null,
        event_id: null,
        message: 'Transition request matched the current persisted state.',
        result: 'ignored_duplicate',
      },
    };
  }

  const lastEventAt = presenceState?.last_event_at ? Date.parse(presenceState.last_event_at) : null;
  const occurredAt = Date.parse(payload.occurred_at);

  if (lastEventAt !== null && occurredAt - lastEventAt < TRANSITION_COOLDOWN_MS) {
    return {
      kind: 'rejected',
      response: {
        dispatch_status: null,
        event_id: null,
        message: 'Transition request was rejected by cooldown duplicate protection.',
        result: 'ignored_duplicate',
      },
    };
  }

  const event: LocationEventRow = {
    accuracy_meters: payload.accuracy_meters,
    client_event_id: payload.client_event_id,
    dispatch_error: dispatch.dispatchError,
    dispatch_status: dispatch.dispatchStatus,
    distance_meters: distanceMeters,
    event_source: payload.event_source,
    event_type: payload.event_type,
    id: createEventId(),
    latitude: payload.latitude,
    longitude: payload.longitude,
    processed_at: now,
    triggered_at: payload.occurred_at,
    user_id: userId,
    zone_id: zone.id,
  };

  const nextPresenceState: ZonePresenceStateRow = {
    current_state: requestedState,
    last_distance_meters: distanceMeters,
    last_event_at: payload.occurred_at,
    last_event_type: payload.event_type,
    updated_at: now,
    user_id: userId,
    zone_id: zone.id,
  };

  return {
    event,
    kind: 'accepted',
    presenceState: nextPresenceState,
    response: {
      dispatch_status: event.dispatch_status,
      event_id: event.id,
      message: 'Transition request was accepted and persisted.',
      result: 'accepted',
    },
  };
}

export function resolveFallbackDispatch(zone: ZoneRow, trigger: AlexaTriggerRow | null): TriggerDispatchResolution {
  if (!zone.alexa_enabled) {
    return { dispatchError: null, dispatchStatus: 'skipped' };
  }

  if (!trigger || !trigger.is_active) {
    return { dispatchError: null, dispatchStatus: 'skipped' };
  }

  if (trigger.provider === 'mock') {
    return { dispatchError: null, dispatchStatus: 'mocked' };
  }

  if (!trigger.target_device) {
    return {
      dispatchError: 'Alexa mode requires target_device in fallback runtime.',
      dispatchStatus: 'failed',
    };
  }

  return { dispatchError: null, dispatchStatus: 'sent' };
}
