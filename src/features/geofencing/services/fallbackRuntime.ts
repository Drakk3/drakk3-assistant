import { processZoneTransitionDecision, resolveFallbackDispatch } from '@/features/geofencing/services/transitionCore';

import type { AdminZoneRecord, OperationalEventRecord, SaveZoneInput, TransitionApiRequest, TransitionApiResponse, ZoneOperationalState } from '@/features/geofencing/types';
import type { AlexaTriggerRow, LocationEventRow, ZonePresenceStateRow, ZoneRow } from '@/shared/types/database';

const FALLBACK_CREATED_BY = 'local-admin-user';

export interface FallbackState {
  events: LocationEventRow[];
  presenceStates: ZonePresenceStateRow[];
  triggers: AlexaTriggerRow[];
  zones: ZoneRow[];
}

function createIsoTimestamp(minutesAgo = 0): string {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

export function createInitialFallbackState(): FallbackState {
  return {
    events: [
      {
        accuracy_meters: 12,
        client_event_id: 'local-client-event-1',
        dispatch_error: null,
        dispatch_status: 'mocked',
        distance_meters: 42,
        event_source: 'manual-test',
        event_type: 'enter',
        id: 'local-event-1',
        latitude: -34.6037,
        longitude: -58.3816,
        processed_at: createIsoTimestamp(18),
        triggered_at: createIsoTimestamp(18),
        user_id: FALLBACK_CREATED_BY,
        zone_id: 'local-zone-home',
      },
    ],
    presenceStates: [
      {
        current_state: 'inside',
        last_distance_meters: 42,
        last_event_at: createIsoTimestamp(18),
        last_event_type: 'enter',
        updated_at: createIsoTimestamp(18),
        user_id: FALLBACK_CREATED_BY,
        zone_id: 'local-zone-home',
      },
    ],
    triggers: [
      {
        created_at: createIsoTimestamp(240),
        id: 'local-trigger-home',
        is_active: true,
        message_template: '{name} entered Home base',
        provider: 'mock',
        target_device: 'Living Room Echo',
        updated_at: createIsoTimestamp(30),
        zone_id: 'local-zone-home',
      },
    ],
    zones: [
      {
        alexa_enabled: true,
        created_at: createIsoTimestamp(240),
        created_by: FALLBACK_CREATED_BY,
        enter_buffer_meters: 15,
        exit_buffer_meters: 15,
        id: 'local-zone-home',
        is_active: true,
        latitude: -34.6037,
        longitude: -58.3816,
        name: 'Home base',
        radius_meters: 120,
        updated_at: createIsoTimestamp(30),
      },
      {
        alexa_enabled: false,
        created_at: createIsoTimestamp(120),
        created_by: FALLBACK_CREATED_BY,
        enter_buffer_meters: 20,
        exit_buffer_meters: 20,
        id: 'local-zone-office',
        is_active: false,
        latitude: -34.6118,
        longitude: -58.4173,
        name: 'Office fallback',
        radius_meters: 180,
        updated_at: createIsoTimestamp(45),
      },
    ],
  };
}

export function mapZoneRecords(zones: ZoneRow[], triggers: AlexaTriggerRow[]): AdminZoneRecord[] {
  const triggersByZone = new Map<string, AlexaTriggerRow>();

  triggers.forEach((trigger: AlexaTriggerRow) => {
    triggersByZone.set(trigger.zone_id, trigger);
  });

  return [...zones]
    .sort((left: ZoneRow, right: ZoneRow) => left.name.localeCompare(right.name))
    .map((zone: ZoneRow) => ({
      trigger: triggersByZone.get(zone.id) ?? null,
      zone,
    }));
}

export function mapEventRecords(events: LocationEventRow[], zoneRecords: AdminZoneRecord[]): OperationalEventRecord[] {
  const zonesById = new Map<string, AdminZoneRecord>();

  zoneRecords.forEach((record: AdminZoneRecord) => {
    zonesById.set(record.zone.id, record);
  });

  return [...events]
    .sort((left: LocationEventRow, right: LocationEventRow) => right.triggered_at.localeCompare(left.triggered_at))
    .map((event: LocationEventRow) => {
      const zoneRecord = zonesById.get(event.zone_id);

      return {
        ...event,
        provider: zoneRecord?.trigger?.provider ?? null,
        target_device: zoneRecord?.trigger?.target_device ?? null,
        zone_name: zoneRecord?.zone.name ?? 'Unknown zone',
      };
    });
}

export function mapOperationalState(
  zoneRecords: AdminZoneRecord[],
  presenceStates: ZonePresenceStateRow[],
  events: LocationEventRow[]
): ZoneOperationalState[] {
  const presenceByZone = new Map<string, ZonePresenceStateRow>();
  const lastEventByZone = new Map<string, LocationEventRow>();

  presenceStates.forEach((presenceState: ZonePresenceStateRow) => {
    presenceByZone.set(presenceState.zone_id, presenceState);
  });

  [...events]
    .sort((left: LocationEventRow, right: LocationEventRow) => right.triggered_at.localeCompare(left.triggered_at))
    .forEach((event: LocationEventRow) => {
      if (!lastEventByZone.has(event.zone_id)) {
        lastEventByZone.set(event.zone_id, event);
      }
    });

  return zoneRecords.map((record: AdminZoneRecord) => {
    const presenceState = presenceByZone.get(record.zone.id);
    const lastEvent = lastEventByZone.get(record.zone.id);

    return {
      alexaEnabled: record.zone.alexa_enabled,
      currentState: presenceState?.current_state ?? 'outside',
      dispatchError: lastEvent?.dispatch_error ?? null,
      isActive: record.zone.is_active,
      lastDispatchStatus: lastEvent?.dispatch_status ?? null,
      lastDistanceMeters: presenceState?.last_distance_meters ?? null,
      lastEventAt: presenceState?.last_event_at ?? null,
      lastEventType: presenceState?.last_event_type ?? null,
      provider: record.trigger?.provider ?? null,
      targetDevice: record.trigger?.target_device ?? null,
      updatedAt: presenceState?.updated_at ?? record.zone.updated_at,
      zoneId: record.zone.id,
      zoneName: record.zone.name,
    };
  });
}

export function saveFallbackZone(
  state: FallbackState,
  input: SaveZoneInput,
  createId: (prefix: string) => string
): AdminZoneRecord {
  const now = new Date().toISOString();
  const zoneId = input.zone_id ?? createId('local-zone');
  const existingZoneIndex = state.zones.findIndex((zone: ZoneRow) => zone.id === zoneId);
  const existingZone = existingZoneIndex >= 0 ? state.zones[existingZoneIndex] : null;

  const nextZone: ZoneRow = {
    alexa_enabled: input.alexa_enabled,
    created_at: existingZone?.created_at ?? now,
    created_by: input.created_by || FALLBACK_CREATED_BY,
    enter_buffer_meters: input.enter_buffer_meters,
    exit_buffer_meters: input.exit_buffer_meters,
    id: zoneId,
    is_active: input.is_active,
    latitude: input.latitude,
    longitude: input.longitude,
    name: input.name,
    radius_meters: input.radius_meters,
    updated_at: now,
  };

  if (existingZoneIndex >= 0) {
    state.zones[existingZoneIndex] = nextZone;
  } else {
    state.zones.push(nextZone);
  }

  const triggerIndex = state.triggers.findIndex((trigger: AlexaTriggerRow) => trigger.zone_id === zoneId);
  const existingTrigger = triggerIndex >= 0 ? state.triggers[triggerIndex] : null;
  const nextTrigger: AlexaTriggerRow = {
    created_at: existingTrigger?.created_at ?? now,
    id: existingTrigger?.id ?? createId('local-trigger'),
    is_active: input.trigger_is_active,
    message_template: input.message_template,
    provider: input.provider,
    target_device: input.target_device,
    updated_at: now,
    zone_id: zoneId,
  };

  if (triggerIndex >= 0) {
    state.triggers[triggerIndex] = nextTrigger;
  } else {
    state.triggers.push(nextTrigger);
  }

  return { trigger: nextTrigger, zone: nextZone };
}

export function toggleFallbackZone(state: FallbackState, zoneId: string, isActive: boolean): AdminZoneRecord | null {
  const zoneIndex = state.zones.findIndex((zone: ZoneRow) => zone.id === zoneId);

  if (zoneIndex < 0) {
    return null;
  }

  const currentZone = state.zones[zoneIndex];

  if (!currentZone) {
    return null;
  }

  const nextZone: ZoneRow = {
    ...currentZone,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };
  state.zones[zoneIndex] = nextZone;

  return {
    trigger: state.triggers.find((item: AlexaTriggerRow) => item.zone_id === zoneId) ?? null,
    zone: nextZone,
  };
}

export function processFallbackTransition(
  state: FallbackState,
  payload: TransitionApiRequest,
  createId: (prefix: string) => string
): TransitionApiResponse {
  const zone = state.zones.find((item: ZoneRow) => item.id === payload.zone_id && item.is_active) ?? null;
  const existingEvent = state.events.find((event: LocationEventRow) => event.client_event_id === payload.client_event_id) ?? null;
  const presenceState =
    state.presenceStates.find((item: ZonePresenceStateRow) => item.zone_id === payload.zone_id && item.user_id === FALLBACK_CREATED_BY) ??
    null;
  const trigger = state.triggers.find((item: AlexaTriggerRow) => item.zone_id === payload.zone_id) ?? null;
  const now = new Date().toISOString();
  const decision = processZoneTransitionDecision({
    createEventId: (): string => createId('local-event'),
    dispatch: zone ? resolveFallbackDispatch(zone, trigger) : { dispatchError: null, dispatchStatus: 'skipped' },
    existingEvent,
    now,
    payload,
    presenceState,
    userId: FALLBACK_CREATED_BY,
    zone,
  });

  if (decision.kind === 'accepted') {
    state.events.unshift(decision.event);
    const presenceIndex = state.presenceStates.findIndex((item: ZonePresenceStateRow) => {
      return item.zone_id === decision.presenceState.zone_id && item.user_id === decision.presenceState.user_id;
    });

    if (presenceIndex >= 0) {
      state.presenceStates[presenceIndex] = decision.presenceState;
    } else {
      state.presenceStates.push(decision.presenceState);
    }
  }

  return decision.response;
}

export function createFallbackIdFactory(initialSequence = 4): (prefix: string) => string {
  let sequence = initialSequence;

  return (prefix: string): string => {
    sequence += 1;
    return `${prefix}-${sequence}`;
  };
}

export function getFallbackCreatedBy(): string {
  return FALLBACK_CREATED_BY;
}
