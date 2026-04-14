import { createClient } from 'jsr:@supabase/supabase-js@2';

import {
  isTransitionApiRequest,
  resolveBearerToken,
  resolveDispatchStatus,
  resolveTransitionEdgeEnv,
} from '../../../src/features/geofencing/services/processZoneTransitionEdge.ts';
import { processZoneTransitionDecision } from '../../../src/features/geofencing/services/transitionCore.ts';

import type { Database } from '../../../src/shared/types/database.ts';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
} as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    status,
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const env = resolveTransitionEdgeEnv({
      ALEXA_API_KEY: Deno.env.get('ALEXA_API_KEY') ?? undefined,
      ALEXA_PROVIDER_MODE: Deno.env.get('ALEXA_PROVIDER_MODE') ?? undefined,
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? undefined,
      SUPABASE_URL: Deno.env.get('SUPABASE_URL') ?? undefined,
    });

    if (!env.supabaseUrl || !env.serviceRoleKey) {
      return jsonResponse({ message: 'Missing Supabase service configuration.' }, 500);
    }

    const jwt = resolveBearerToken(request.headers.get('Authorization'));

    if (!jwt) {
      return jsonResponse({ message: 'Missing bearer token.' }, 401);
    }

    const supabase = createClient<Database>(env.supabaseUrl, env.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !authData.user) {
      return jsonResponse({ message: 'Unauthorized request.' }, 401);
    }

    const rawPayload: unknown = await request.json();

    if (!isTransitionApiRequest(rawPayload)) {
      return jsonResponse(
        {
          dispatch_status: null,
          event_id: null,
          message: 'Transition request contains an invalid payload.',
          result: 'rejected_invalid_payload',
        },
        400
      );
    }

    const payload = rawPayload;
    const [{ data: zone, error: zoneError }, { data: trigger, error: triggerError }, { data: presenceState, error: presenceError }, { data: existingEvent, error: eventError }] =
      await Promise.all([
        supabase.from('zones').select('*').eq('id', payload.zone_id).maybeSingle(),
        supabase.from('alexa_triggers').select('*').eq('zone_id', payload.zone_id).maybeSingle(),
        supabase.from('zone_presence_state').select('*').eq('zone_id', payload.zone_id).eq('user_id', authData.user.id).maybeSingle(),
        supabase.from('location_events').select('*').eq('client_event_id', payload.client_event_id).maybeSingle(),
      ]);

    if (zoneError || triggerError || presenceError || eventError) {
      throw zoneError || triggerError || presenceError || eventError;
    }

    const decision = processZoneTransitionDecision({
      createEventId: (): string => crypto.randomUUID(),
      dispatch: zone
        ? resolveDispatchStatus(zone, trigger, env)
        : { dispatchError: null, dispatchStatus: 'skipped' },
      existingEvent: existingEvent ?? null,
      now: new Date().toISOString(),
      payload,
      presenceState: presenceState ?? null,
      userId: authData.user.id,
      zone: zone ?? null,
    });

    if (decision.kind === 'accepted') {
      const { error: insertError } = await supabase.from('location_events').insert(decision.event);

      if (insertError) {
        throw insertError;
      }

      const { error: upsertError } = await supabase.from('zone_presence_state').upsert(decision.presenceState, {
        onConflict: 'user_id,zone_id',
      });

      if (upsertError) {
        throw upsertError;
      }
    }

    return jsonResponse(decision.response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected edge function failure.';

    return jsonResponse(
      {
        dispatch_status: null,
        event_id: null,
        message,
        result: 'rejected_invalid_payload',
      },
      500
    );
  }
});
