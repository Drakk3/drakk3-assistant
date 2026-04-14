import type { TransitionApiRequest } from '@/features/geofencing/types';
import type { Database, LocationEventRow } from '@/shared/types/database';

export interface TransitionEdgeEnv {
  alexaApiKey: string | null;
  providerMode: string;
  serviceRoleKey: string | null;
  supabaseUrl: string | null;
}

export interface TransitionEdgeEnvSource {
  ALEXA_API_KEY?: string;
  ALEXA_PROVIDER_MODE?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_URL?: string;
}

export function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isTransitionApiRequest(value: unknown): value is TransitionApiRequest {
  return (
    isObjectRecord(value) &&
    typeof value.client_event_id === 'string' &&
    typeof value.zone_id === 'string' &&
    (value.event_type === 'enter' || value.event_type === 'exit') &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    (typeof value.accuracy_meters === 'number' || value.accuracy_meters === null) &&
    (value.event_source === 'foreground' ||
      value.event_source === 'background' ||
      value.event_source === 'manual-test') &&
    typeof value.occurred_at === 'string'
  );
}

export function resolveTransitionEdgeEnv(source: TransitionEdgeEnvSource): TransitionEdgeEnv {
  return {
    alexaApiKey: source.ALEXA_API_KEY?.trim() || null,
    providerMode: source.ALEXA_PROVIDER_MODE?.trim() || 'mock',
    serviceRoleKey: source.SUPABASE_SERVICE_ROLE_KEY?.trim() || null,
    supabaseUrl: source.SUPABASE_URL?.trim() || null,
  };
}

export function resolveBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  const jwt = authorizationHeader.replace('Bearer ', '').trim();
  return jwt || null;
}

export function resolveDispatchStatus(
  zone: Database['public']['Tables']['zones']['Row'],
  trigger: Database['public']['Tables']['alexa_triggers']['Row'] | null,
  env: Pick<TransitionEdgeEnv, 'alexaApiKey' | 'providerMode'>
): { dispatchError: string | null; dispatchStatus: LocationEventRow['dispatch_status'] } {
  if (!zone.alexa_enabled || !trigger || !trigger.is_active) {
    return { dispatchError: null, dispatchStatus: 'skipped' };
  }

  if (env.providerMode === 'mock' || trigger.provider === 'mock') {
    return { dispatchError: null, dispatchStatus: 'mocked' };
  }

  if (!trigger.target_device) {
    return {
      dispatchError: 'Alexa dispatch requires target_device before sending.',
      dispatchStatus: 'failed',
    };
  }

  if (!env.alexaApiKey) {
    return {
      dispatchError: 'Alexa provider mode is enabled but ALEXA_API_KEY is missing.',
      dispatchStatus: 'failed',
    };
  }

  return { dispatchError: null, dispatchStatus: 'sent' };
}
