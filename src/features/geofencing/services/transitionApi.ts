import { AppError } from '@/shared/lib/errors';
import { ENV } from '@/config/env';
import { processFallbackZoneTransition } from '@/features/geofencing/services/geofencingApi';
import { supabase } from '@/shared/lib/supabaseClient';

import type { TransitionApiRequest, TransitionApiResponse, TransitionApiResult } from '@/features/geofencing/types';

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTransitionResult(value: unknown): value is TransitionApiResult {
  return (
    value === 'accepted' ||
    value === 'ignored_duplicate' ||
    value === 'ignored_hysteresis' ||
    value === 'rejected_invalid_payload' ||
    value === 'rejected_invalid_zone'
  );
}

function isDispatchStatus(value: unknown): value is TransitionApiResponse['dispatch_status'] {
  return value === null || value === 'failed' || value === 'mocked' || value === 'pending' || value === 'sent' || value === 'skipped';
}

function isTransitionApiResponse(value: unknown): value is TransitionApiResponse {
  if (!isObjectRecord(value)) {
    return false;
  }

  return (
    isTransitionResult(value.result) &&
    (typeof value.event_id === 'string' || value.event_id === null) &&
    isDispatchStatus(value.dispatch_status) &&
    typeof value.message === 'string'
  );
}

export async function processZoneTransition(payload: TransitionApiRequest): Promise<TransitionApiResponse> {
  try {
    if (!ENV.hasSupabaseConfig) {
      return processFallbackZoneTransition(payload);
    }

    const { data, error } = await supabase.functions.invoke('process-zone-transition', {
      body: payload,
    });

    if (error) {
      throw new AppError(error.message, 'transitionApi.processZoneTransition', error);
    }

    if (!isTransitionApiResponse(data)) {
      throw new AppError('Invalid transition response payload', 'transitionApi.processZoneTransition');
    }

    return data;
  } catch (error) {
    throw new AppError('Failed to process zone transition', 'transitionApi.processZoneTransition', error);
  }
}
