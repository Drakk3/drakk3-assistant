import { describe, expect, it } from 'vitest';

import { resolveNextState } from '@/features/geofencing/hooks/useZoneDetection.utils';
import type { TransitionApiRequest, TransitionApiResponse } from '@/features/geofencing/types';

const candidate: TransitionApiRequest = {
  accuracy_meters: 4,
  client_event_id: 'client-1',
  event_source: 'manual-test',
  event_type: 'enter',
  latitude: -34.6,
  longitude: -58.38,
  occurred_at: '2026-04-13T12:00:00.000Z',
  zone_id: 'zone-1',
};

function createResponse(result: TransitionApiResponse['result']): TransitionApiResponse {
  return {
    dispatch_status: null,
    event_id: null,
    message: 'test',
    result,
  };
}

describe('useZoneDetection utils', () => {
  it('maps accepted enter and exit transitions into next membership states', () => {
    expect(resolveNextState(createResponse('accepted'), candidate)).toBe('inside');
    expect(resolveNextState(createResponse('ignored_duplicate'), { ...candidate, event_type: 'exit' })).toBe('outside');
  });

  it('keeps local state unchanged for non-accepted backend outcomes', () => {
    expect(resolveNextState(createResponse('ignored_hysteresis'), candidate)).toBeNull();
    expect(resolveNextState(createResponse('rejected_invalid_payload'), candidate)).toBeNull();
  });
});
