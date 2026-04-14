import { describe, expect, it } from 'vitest';

import {
  isTransitionApiRequest,
  resolveBearerToken,
  resolveDispatchStatus,
  resolveTransitionEdgeEnv,
} from '@/features/geofencing/services/processZoneTransitionEdge';
import type { AlexaTriggerRow, ZoneRow } from '@/shared/types/database';

const zone: ZoneRow = {
  alexa_enabled: true,
  created_at: '2026-04-13T12:00:00.000Z',
  created_by: 'tester',
  enter_buffer_meters: 10,
  exit_buffer_meters: 15,
  id: 'zone-1',
  is_active: true,
  latitude: -34.6,
  longitude: -58.38,
  name: 'Home',
  radius_meters: 100,
  updated_at: '2026-04-13T12:00:00.000Z',
};

const trigger: AlexaTriggerRow = {
  created_at: '2026-04-13T12:00:00.000Z',
  id: 'trigger-1',
  is_active: true,
  message_template: '{name} entered {zone}',
  provider: 'alexa',
  target_device: 'Echo',
  updated_at: '2026-04-13T12:00:00.000Z',
  zone_id: 'zone-1',
};

describe('processZoneTransitionEdge', () => {
  it('validates the edge env wrapper and bearer token parsing', () => {
    expect(
      resolveTransitionEdgeEnv({
        ALEXA_PROVIDER_MODE: ' alexa ',
        SUPABASE_SERVICE_ROLE_KEY: ' service-role ',
        SUPABASE_URL: ' https://project.supabase.co ',
      })
    ).toEqual({
      alexaApiKey: null,
      providerMode: 'alexa',
      serviceRoleKey: 'service-role',
      supabaseUrl: 'https://project.supabase.co',
    });

    expect(resolveBearerToken('Bearer token-123')).toBe('token-123');
    expect(resolveBearerToken('Basic nope')).toBeNull();
  });

  it('accepts the canonical transition payload shape used by the edge function', () => {
    expect(
      isTransitionApiRequest({
        accuracy_meters: 5,
        client_event_id: 'client-1',
        event_source: 'manual-test',
        event_type: 'enter',
        latitude: -34.6,
        longitude: -58.38,
        occurred_at: '2026-04-13T12:00:00.000Z',
        zone_id: 'zone-1',
      })
    ).toBe(true);

    expect(isTransitionApiRequest({ zone_id: 'zone-1' })).toBe(false);
  });

  it('resolves provider dispatch outcomes without needing live Supabase infra', () => {
    expect(
      resolveDispatchStatus(zone, trigger, {
        alexaApiKey: null,
        providerMode: 'mock',
      })
    ).toEqual({
      dispatchError: null,
      dispatchStatus: 'mocked',
    });

    expect(
      resolveDispatchStatus(zone, trigger, {
        alexaApiKey: null,
        providerMode: 'alexa',
      })
    ).toEqual({
      dispatchError: 'Alexa provider mode is enabled but ALEXA_API_KEY is missing.',
      dispatchStatus: 'failed',
    });
  });
});
