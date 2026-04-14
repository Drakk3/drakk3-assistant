import { ENV } from '@/config/env';
import { AppError } from '@/shared/lib/errors';
import { supabase } from '@/shared/lib/supabaseClient';

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
import type {
  AdminZoneRecord,
  OperationalEventRecord,
  SaveZoneInput,
  TransitionApiRequest,
  TransitionApiResponse,
  Zone,
  ZoneOperationalState,
  ZonePresenceState,
} from '@/features/geofencing/types';
import type { ZonePresenceStateRow, ZoneRow } from '@/shared/types/database';

interface RestRequestOptions {
  body?: string;
  method: 'PATCH' | 'POST';
}

const createLocalId = createFallbackIdFactory();

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isZoneRow(value: unknown): value is ZoneRow {
  return (
    isObjectRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    typeof value.radius_meters === 'number' &&
    typeof value.enter_buffer_meters === 'number' &&
    typeof value.exit_buffer_meters === 'number' &&
    typeof value.is_active === 'boolean' &&
    typeof value.alexa_enabled === 'boolean' &&
    typeof value.created_by === 'string' &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  );
}

async function getRestHeaders(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new AppError(error.message, 'geofencingApi.getRestHeaders', error);
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session?.access_token ?? ENV.supabaseAnonKey}`,
      Prefer: 'return=representation',
      apikey: ENV.supabaseAnonKey,
    };
  } catch (error) {
    throw new AppError('Failed to build REST headers', 'geofencingApi.getRestHeaders', error);
  }
}

async function requestRest(path: string, options: RestRequestOptions): Promise<unknown> {
  try {
    const response = await fetch(`${ENV.supabaseUrl}/rest/v1/${path}`, {
      body: options.body,
      headers: await getRestHeaders(),
      method: options.method,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new AppError(message || 'Supabase REST request failed', 'geofencingApi.requestRest');
    }

    return response.json();
  } catch (error) {
    throw new AppError('Failed Supabase REST request', 'geofencingApi.requestRest', error);
  }
}

async function createZoneViaRest(zonePayload: {
  alexa_enabled: boolean;
  created_by: string;
  enter_buffer_meters: number;
  exit_buffer_meters: number;
  is_active: boolean;
  latitude: number;
  longitude: number;
  name: string;
  radius_meters: number;
  updated_at: string;
}): Promise<ZoneRow> {
  try {
    const response = await requestRest('zones?select=*', {
      body: JSON.stringify(zonePayload),
      method: 'POST',
    });

    if (!Array.isArray(response) || !isZoneRow(response[0])) {
      throw new AppError('Invalid zone response payload', 'geofencingApi.createZoneViaRest');
    }

    return response[0];
  } catch (error) {
    throw new AppError('Failed to create zone via REST', 'geofencingApi.createZoneViaRest', error);
  }
}

async function patchRowViaRest(path: string, payload: object): Promise<void> {
  try {
    await requestRest(path, {
      body: JSON.stringify(payload),
      method: 'PATCH',
    });
  } catch (error) {
    throw new AppError('Failed to patch row via REST', 'geofencingApi.patchRowViaRest', error);
  }
}

async function postRowViaRest(path: string, payload: object): Promise<void> {
  try {
    await requestRest(path, {
      body: JSON.stringify(payload),
      method: 'POST',
    });
  } catch (error) {
    throw new AppError('Failed to post row via REST', 'geofencingApi.postRowViaRest', error);
  }
}

async function getAdminZoneRecord(zoneId: string): Promise<AdminZoneRecord> {
  try {
    const zoneRecords = await listAdminZones();
    const zoneRecord = zoneRecords.find((item: AdminZoneRecord) => item.zone.id === zoneId);

    if (!zoneRecord) {
      throw new AppError('Zone not found after persistence', 'geofencingApi.getAdminZoneRecord');
    }

    return zoneRecord;
  } catch (error) {
    throw new AppError('Failed to resolve persisted zone', 'geofencingApi.getAdminZoneRecord', error);
  }
}

const fallbackState = createInitialFallbackState();

function listFallbackZoneRecords(): AdminZoneRecord[] {
  return mapZoneRecords(fallbackState.zones, fallbackState.triggers);
}

export function isSupabaseRuntimeConfigured(): boolean {
  return ENV.hasSupabaseConfig;
}

export async function listAdminZones(): Promise<AdminZoneRecord[]> {
  try {
    if (!ENV.hasSupabaseConfig) {
      return listFallbackZoneRecords();
    }

    const [{ data: zones, error: zoneError }, { data: triggers, error: triggerError }] = await Promise.all([
      supabase.from('zones').select('*').order('name', { ascending: true }),
      supabase.from('alexa_triggers').select('*'),
    ]);

    if (zoneError) {
      throw new AppError(zoneError.message, 'geofencingApi.listAdminZones', zoneError);
    }

    if (triggerError) {
      throw new AppError(triggerError.message, 'geofencingApi.listAdminZones', triggerError);
    }

    return mapZoneRecords(zones ?? [], triggers ?? []);
  } catch (error) {
    throw new AppError('Failed to load admin zones', 'geofencingApi.listAdminZones', error);
  }
}

export async function listActiveZones(): Promise<Zone[]> {
  try {
    const zoneRecords = await listAdminZones();

    return zoneRecords.filter((record: AdminZoneRecord) => record.zone.is_active).map((record: AdminZoneRecord) => record.zone);
  } catch (error) {
    throw new AppError('Failed to load active zones', 'geofencingApi.listActiveZones', error);
  }
}

export async function listZonePresenceStates(userId?: string): Promise<ZonePresenceState[]> {
  try {
    if (!ENV.hasSupabaseConfig) {
      return fallbackState.presenceStates.filter((presenceState: ZonePresenceStateRow) => {
        return userId ? presenceState.user_id === userId : true;
      });
    }

    const query = supabase.from('zone_presence_state').select('*').order('updated_at', { ascending: false });
    const { data, error } = userId ? await query.eq('user_id', userId) : await query;

    if (error) {
      throw new AppError(error.message, 'geofencingApi.listZonePresenceStates', error);
    }

    return data ?? [];
  } catch (error) {
    throw new AppError('Failed to load zone presence states', 'geofencingApi.listZonePresenceStates', error);
  }
}

export async function saveAdminZone(input: SaveZoneInput): Promise<AdminZoneRecord> {
  try {
    if (!ENV.hasSupabaseConfig) {
      return saveFallbackZone(fallbackState, input, createLocalId);
    }

    const zoneUpdatePayload = {
        alexa_enabled: input.alexa_enabled,
        enter_buffer_meters: input.enter_buffer_meters,
        exit_buffer_meters: input.exit_buffer_meters,
        is_active: input.is_active,
        latitude: input.latitude,
        longitude: input.longitude,
        name: input.name,
        radius_meters: input.radius_meters,
        updated_at: new Date().toISOString(),
    };

    const zoneCreatePayload = {
      ...zoneUpdatePayload,
      created_by: input.created_by,
    };

    const zoneId = input.zone_id ?? (await createZoneViaRest(zoneCreatePayload)).id;

    if (input.zone_id) {
      await patchRowViaRest(`zones?id=eq.${zoneId}`, zoneUpdatePayload);
    }

    const triggerPayload = {
      is_active: input.trigger_is_active,
      message_template: input.message_template,
      provider: input.provider,
      target_device: input.target_device,
      updated_at: new Date().toISOString(),
      zone_id: zoneId,
    };
    const { data: existingTrigger, error: existingTriggerError } = await supabase
      .from('alexa_triggers')
      .select('*')
      .eq('zone_id', zoneId)
      .maybeSingle();

    if (existingTriggerError) {
      throw new AppError(existingTriggerError.message, 'geofencingApi.saveAdminZone', existingTriggerError);
    }

    if (existingTrigger) {
      await patchRowViaRest(`alexa_triggers?zone_id=eq.${zoneId}`, triggerPayload);
    } else {
      await postRowViaRest('alexa_triggers?select=*', triggerPayload);
    }

    return getAdminZoneRecord(zoneId);
  } catch (error) {
    throw new AppError('Failed to save admin zone', 'geofencingApi.saveAdminZone', error);
  }
}

export async function toggleAdminZone(zoneId: string, isActive: boolean): Promise<AdminZoneRecord> {
  try {
    if (!ENV.hasSupabaseConfig) {
      const zoneRecord = toggleFallbackZone(fallbackState, zoneId, isActive);

      if (!zoneRecord) {
        throw new AppError('Zone not found', 'geofencingApi.toggleAdminZone');
      }

      return zoneRecord;
    }

    await patchRowViaRest(`zones?id=eq.${zoneId}`, {
      is_active: isActive,
      updated_at: new Date().toISOString(),
    });

    return getAdminZoneRecord(zoneId);
  } catch (error) {
    throw new AppError('Failed to toggle zone state', 'geofencingApi.toggleAdminZone', error);
  }
}

export async function listLocationEvents(): Promise<OperationalEventRecord[]> {
  try {
    if (!ENV.hasSupabaseConfig) {
      return mapEventRecords(fallbackState.events, listFallbackZoneRecords());
    }

    const [zoneRecords, eventResponse] = await Promise.all([
      listAdminZones(),
      supabase.from('location_events').select('*').order('triggered_at', { ascending: false }).limit(50),
    ]);

    if (eventResponse.error) {
      throw new AppError(eventResponse.error.message, 'geofencingApi.listLocationEvents', eventResponse.error);
    }

    return mapEventRecords(eventResponse.data ?? [], zoneRecords);
  } catch (error) {
    throw new AppError('Failed to load location events', 'geofencingApi.listLocationEvents', error);
  }
}

export async function listOperationalState(): Promise<ZoneOperationalState[]> {
  try {
    const [zoneRecords, presenceStates, events] = await Promise.all([
      listAdminZones(),
      listZonePresenceStates(),
      listLocationEvents(),
    ]);

    return mapOperationalState(zoneRecords, presenceStates, events);
  } catch (error) {
    throw new AppError('Failed to load operational state', 'geofencingApi.listOperationalState', error);
  }
}

export async function processFallbackZoneTransition(payload: TransitionApiRequest): Promise<TransitionApiResponse> {
  try {
    return processFallbackTransition(fallbackState, payload, createLocalId);
  } catch (error) {
    throw new AppError('Failed to process fallback transition', 'geofencingApi.processFallbackZoneTransition', error);
  }
}
