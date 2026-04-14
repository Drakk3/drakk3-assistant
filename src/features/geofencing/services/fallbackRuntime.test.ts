import { describe, expect, it } from 'vitest';

import {
  createFallbackIdFactory,
  createInitialFallbackState,
  mapEventRecords,
  mapOperationalState,
  mapZoneRecords,
  processFallbackTransition,
  saveFallbackZone,
  toggleFallbackZone,
} from '@/features/geofencing/services/fallbackRuntime';
import type { SaveZoneInput } from '@/features/geofencing/types';

function createZoneInput(overrides: Partial<SaveZoneInput> = {}): SaveZoneInput {
  return {
    alexa_enabled: true,
    created_by: 'admin-1',
    enter_buffer_meters: 10,
    exit_buffer_meters: 20,
    is_active: true,
    latitude: -34.61,
    longitude: -58.39,
    message_template: '{name} entered Office',
    name: 'Office',
    provider: 'mock',
    radius_meters: 150,
    target_device: 'Desk Echo',
    trigger_is_active: true,
    ...overrides,
  };
}

describe('fallbackRuntime', () => {
  it('supports zone save and toggle flows for admin management', () => {
    const state = createInitialFallbackState();
    const createId = createFallbackIdFactory();

    const saved = saveFallbackZone(state, createZoneInput(), createId);
    const toggled = toggleFallbackZone(state, saved.zone.id, false);

    expect(saved.zone.name).toBe('Office');
    expect(toggled?.zone.is_active).toBe(false);
  });

  it('maps event history and operational visibility from fallback state', () => {
    const state = createInitialFallbackState();
    const zoneRecords = mapZoneRecords(state.zones, state.triggers);
    const events = mapEventRecords(state.events, zoneRecords);
    const operationalState = mapOperationalState(zoneRecords, state.presenceStates, state.events);

    expect(events[0]?.zone_name).toBe('Home base');
    expect(operationalState[0]?.currentState).toBe('inside');
  });

  it('persists accepted transitions into the backend-owned fallback ledger', () => {
    const state = createInitialFallbackState();
    const createId = createFallbackIdFactory();
    const previousCount = state.events.length;
    const response = processFallbackTransition(
      state,
      {
        accuracy_meters: 8,
        client_event_id: 'client-event-exit-1',
        event_source: 'manual-test',
        event_type: 'exit',
        latitude: -34.5937,
        longitude: -58.3716,
        occurred_at: '2099-04-13T13:00:00.000Z',
        zone_id: 'local-zone-home',
      },
      createId
    );

    expect(response.result).toBe('accepted');
    expect(state.events).toHaveLength(previousCount + 1);
    expect(state.presenceStates[0]?.current_state).toBe('outside');
  });
});
