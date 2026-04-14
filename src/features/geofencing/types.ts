import type { AlexaTriggerRow, LocationEventRow, ZonePresenceStateRow, ZoneRow } from '@/shared/types/database';

export type ZoneEventSource = 'foreground' | 'background' | 'manual-test';
export type ZoneEventType = 'enter' | 'exit';
export type ZoneMembershipState = 'inside' | 'outside';
export type TransitionApiResult =
  | 'accepted'
  | 'ignored_duplicate'
  | 'ignored_hysteresis'
  | 'rejected_invalid_zone'
  | 'rejected_invalid_payload';

export interface LocationPoint {
  accuracy_meters: number | null;
  latitude: number;
  longitude: number;
}

export type Zone = ZoneRow;
export type AlexaTrigger = AlexaTriggerRow;

export type ZonePresenceState = ZonePresenceStateRow;

export interface AdminZoneRecord {
  trigger: AlexaTrigger | null;
  zone: Zone;
}

export interface SaveZoneInput {
  alexa_enabled: boolean;
  created_by: string;
  enter_buffer_meters: number;
  exit_buffer_meters: number;
  is_active: boolean;
  latitude: number;
  longitude: number;
  message_template: string;
  name: string;
  provider: AlexaTrigger['provider'];
  radius_meters: number;
  target_device: string | null;
  trigger_is_active: boolean;
  zone_id?: string;
}

export interface ZoneFormValues {
  alexaEnabled: boolean;
  enterBufferMeters: string;
  exitBufferMeters: string;
  isActive: boolean;
  latitude: string;
  longitude: string;
  messageTemplate: string;
  name: string;
  provider: AlexaTrigger['provider'];
  radiusMeters: string;
  targetDevice: string;
  triggerIsActive: boolean;
}

export interface ZoneFormErrors {
  enterBufferMeters?: string;
  exitBufferMeters?: string;
  latitude?: string;
  longitude?: string;
  messageTemplate?: string;
  name?: string;
  radiusMeters?: string;
}

export interface OperationalEventRecord extends LocationEventRow {
  provider: AlexaTrigger['provider'] | null;
  target_device: string | null;
  zone_name: string;
}

export interface ZoneOperationalState {
  alexaEnabled: boolean;
  currentState: ZoneMembershipState;
  dispatchError: string | null;
  isActive: boolean;
  lastDispatchStatus: LocationEventRow['dispatch_status'] | null;
  lastDistanceMeters: number | null;
  lastEventAt: string | null;
  lastEventType: ZoneEventType | null;
  provider: AlexaTrigger['provider'] | null;
  targetDevice: string | null;
  updatedAt: string | null;
  zoneId: string;
  zoneName: string;
}

export interface OperationalSummary {
  activeZoneCount: number;
  failedDispatchCount: number;
  insideZoneCount: number;
  mockedDispatchCount: number;
  pendingDispatchCount: number;
  sentDispatchCount: number;
  totalEventCount: number;
  totalZoneCount: number;
}

export interface TransitionApiRequest extends LocationPoint {
  client_event_id: string;
  event_source: ZoneEventSource;
  event_type: ZoneEventType;
  occurred_at: string;
  zone_id: string;
}

export interface TransitionApiResponse {
  dispatch_status: LocationEventRow['dispatch_status'] | null;
  event_id: string | null;
  message: string;
  result: TransitionApiResult;
}

export interface ZoneThresholds {
  enterThresholdMeters: number;
  exitThresholdMeters: number;
}

export interface ZoneEvaluation {
  distanceMeters: number;
  enterThresholdMeters: number;
  eventType: ZoneEventType | null;
  exitThresholdMeters: number;
  isWithinGrayBand: boolean;
  nextState: ZoneMembershipState;
  previousState: ZoneMembershipState;
  zone: Zone;
}

export interface ZoneDetectionResult {
  candidates: TransitionApiRequest[];
  evaluations: ZoneEvaluation[];
  processedAt: string;
  source: ZoneEventSource;
}

export interface ProcessedTransition {
  candidate: TransitionApiRequest;
  response: TransitionApiResponse;
}

export interface DetectionProcessingResult extends ZoneDetectionResult {
  processedTransitions: ProcessedTransition[];
}

export interface GeofencingRuntimeSnapshot {
  activeZoneIds: string[];
  isTrackingEnabled: boolean;
  lastDetectionResult: DetectionProcessingResult | null;
  lastKnownLocation: LocationPoint | null;
  lastTransitionResponse: ProcessedTransition | null;
  zoneStates: Record<string, ZoneMembershipState>;
  zones: Zone[];
}
