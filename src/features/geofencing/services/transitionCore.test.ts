import { describe, expect, it } from 'vitest';

import { processZoneTransitionDecision, resolveFallbackDispatch } from '@/features/geofencing/services/transitionCore';
import type { TransitionApiRequest } from '@/features/geofencing/types';
import type { AlexaTriggerRow, LocationEventRow, ZonePresenceStateRow, ZoneRow } from '@/shared/types/database';

const zone: ZoneRow = {
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

const mockTrigger: AlexaTriggerRow = {
  created_at: '2026-04-13T12:00:00.000Z',
  id: 'trigger-home',
  is_active: true,
  message_template: '{name} entered Home',
  provider: 'mock',
  target_device: 'Echo',
  updated_at: '2026-04-13T12:00:00.000Z',
  zone_id: 'zone-home',
};

function createPayload(overrides: Partial<TransitionApiRequest> = {}): TransitionApiRequest {
  return {
    accuracy_meters: 5,
    client_event_id: 'client-event-1',
    event_source: 'manual-test',
    event_type: 'enter',
    latitude: -34.6037,
    longitude: -58.3816,
    occurred_at: '2026-04-13T12:00:00.000Z',
    zone_id: 'zone-home',
    ...overrides,
  };
}

describe('transitionCore', () => {
  it('accepts valid enter transitions and prepares persistence payloads', () => {
    const decision = processZoneTransitionDecision({
      createEventId: (): string => 'event-1',
      dispatch: resolveFallbackDispatch(zone, mockTrigger),
      existingEvent: null,
      now: '2026-04-13T12:00:01.000Z',
      payload: createPayload(),
      presenceState: null,
      userId: 'user-1',
      zone,
    });

    expect(decision.kind).toBe('accepted');
    if (decision.kind === 'accepted') {
      expect(decision.event.dispatch_status).toBe('mocked');
      expect(decision.presenceState.current_state).toBe('inside');
      expect(decision.response.result).toBe('accepted');
    }
  });

  it('returns ignored_duplicate for repeated client_event_id', () => {
    const existingEvent: LocationEventRow = {
      accuracy_meters: 5,
      client_event_id: 'client-event-1',
      dispatch_error: null,
      dispatch_status: 'mocked',
      distance_meters: 0,
      event_source: 'manual-test',
      event_type: 'enter',
      id: 'event-1',
      latitude: -34.6037,
      longitude: -58.3816,
      processed_at: '2026-04-13T12:00:01.000Z',
      triggered_at: '2026-04-13T12:00:00.000Z',
      user_id: 'user-1',
      zone_id: 'zone-home',
    };

    const decision = processZoneTransitionDecision({
      createEventId: (): string => 'event-2',
      dispatch: resolveFallbackDispatch(zone, mockTrigger),
      existingEvent,
      now: '2026-04-13T12:00:02.000Z',
      payload: createPayload(),
      presenceState: null,
      userId: 'user-1',
      zone,
    });

    expect(decision.response.result).toBe('ignored_duplicate');
    expect(decision.response.event_id).toBe('event-1');
  });

  it('returns ignored_hysteresis when the candidate stays in the gray band', () => {
    const presenceState: ZonePresenceStateRow = {
      current_state: 'inside',
      last_distance_meters: 50,
      last_event_at: '2026-04-13T11:00:00.000Z',
      last_event_type: 'enter',
      updated_at: '2026-04-13T11:00:00.000Z',
      user_id: 'user-1',
      zone_id: 'zone-home',
    };
    const decision = processZoneTransitionDecision({
      createEventId: (): string => 'event-2',
      dispatch: resolveFallbackDispatch(zone, mockTrigger),
      existingEvent: null,
      now: '2026-04-13T12:00:02.000Z',
      payload: createPayload({
        event_type: 'exit',
        latitude: -34.60274,
      }),
      presenceState,
      userId: 'user-1',
      zone,
    });

    expect(decision.response.result).toBe('ignored_hysteresis');
  });

  it('returns ignored_duplicate when cooldown has not expired', () => {
    const presenceState: ZonePresenceStateRow = {
      current_state: 'inside',
      last_distance_meters: 50,
      last_event_at: '2026-04-13T12:00:00.000Z',
      last_event_type: 'enter',
      updated_at: '2026-04-13T12:00:00.000Z',
      user_id: 'user-1',
      zone_id: 'zone-home',
    };
    const decision = processZoneTransitionDecision({
      createEventId: (): string => 'event-3',
      dispatch: resolveFallbackDispatch(zone, mockTrigger),
      existingEvent: null,
      now: '2026-04-13T12:00:10.000Z',
      payload: createPayload({
        event_type: 'exit',
        latitude: -34.6023,
        occurred_at: '2026-04-13T12:00:10.000Z',
      }),
      presenceState,
      userId: 'user-1',
      zone,
    });

    expect(decision.response.result).toBe('ignored_duplicate');
  });
});
