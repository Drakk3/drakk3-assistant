import type { TransitionApiRequest, TransitionApiResponse, ZoneMembershipState } from '@/features/geofencing/types';

export function resolveNextState(
  response: TransitionApiResponse,
  candidate: TransitionApiRequest
): ZoneMembershipState | null {
  if (response.result === 'accepted' || response.result === 'ignored_duplicate') {
    return candidate.event_type === 'enter' ? 'inside' : 'outside';
  }

  return null;
}
