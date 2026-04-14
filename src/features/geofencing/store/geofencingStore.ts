import { create } from 'zustand';

import type {
  AdminZoneRecord,
  DetectionProcessingResult,
  GeofencingRuntimeSnapshot,
  LocationPoint,
  OperationalEventRecord,
  ProcessedTransition,
  Zone,
  ZoneMembershipState,
  ZoneOperationalState,
} from '@/features/geofencing/types';

interface GeofencingState extends GeofencingRuntimeSnapshot {
  operationalState: ZoneOperationalState[];
  recentEvents: OperationalEventRecord[];
  resetRuntime: () => void;
  setLastDetectionResult: (result: DetectionProcessingResult | null) => void;
  setLastKnownLocation: (location: LocationPoint | null) => void;
  setLastTransitionResponse: (transition: ProcessedTransition | null) => void;
  setOperationalState: (operationalState: ZoneOperationalState[]) => void;
  setRecentEvents: (recentEvents: OperationalEventRecord[]) => void;
  setTrackingEnabled: (isTrackingEnabled: boolean) => void;
  setZoneState: (zoneId: string, state: ZoneMembershipState) => void;
  setZoneStates: (zoneStates: Record<string, ZoneMembershipState>) => void;
  setZoneRecords: (zoneRecords: AdminZoneRecord[]) => void;
  setZones: (zones: Zone[]) => void;
}

const INITIAL_STATE: GeofencingRuntimeSnapshot = {
  activeZoneIds: [],
  isTrackingEnabled: false,
  lastDetectionResult: null,
  lastKnownLocation: null,
  lastTransitionResponse: null,
  zoneStates: {},
  zones: [],
};

const INITIAL_RECENT_EVENTS: OperationalEventRecord[] = [];
const INITIAL_OPERATIONAL_STATE: ZoneOperationalState[] = [];

function toActiveZoneIds(zoneStates: Record<string, ZoneMembershipState>): string[] {
  return Object.entries(zoneStates)
    .filter(([, state]: [string, ZoneMembershipState]) => state === 'inside')
    .map(([zoneId]: [string, ZoneMembershipState]) => zoneId);
}

export const useGeofencingStore = create<GeofencingState>((set) => ({
  ...INITIAL_STATE,
  operationalState: INITIAL_OPERATIONAL_STATE,
  recentEvents: INITIAL_RECENT_EVENTS,
  resetRuntime: (): void => {
    set({
      ...INITIAL_STATE,
      operationalState: INITIAL_OPERATIONAL_STATE,
      recentEvents: INITIAL_RECENT_EVENTS,
    });
  },
  setLastDetectionResult: (result: DetectionProcessingResult | null): void => {
    set({ lastDetectionResult: result });
  },
  setLastKnownLocation: (location: LocationPoint | null): void => {
    set({ lastKnownLocation: location });
  },
  setLastTransitionResponse: (transition: ProcessedTransition | null): void => {
    set({ lastTransitionResponse: transition });
  },
  setOperationalState: (operationalState: ZoneOperationalState[]): void => {
    set({ operationalState });
  },
  setRecentEvents: (recentEvents: OperationalEventRecord[]): void => {
    set({ recentEvents });
  },
  setTrackingEnabled: (isTrackingEnabled: boolean): void => {
    set({ isTrackingEnabled });
  },
  setZoneState: (zoneId: string, state: ZoneMembershipState): void => {
    set((currentState: GeofencingState) => {
      const zoneStates = {
        ...currentState.zoneStates,
        [zoneId]: state,
      };

      return {
        activeZoneIds: toActiveZoneIds(zoneStates),
        zoneStates,
      };
    });
  },
  setZoneStates: (zoneStates: Record<string, ZoneMembershipState>): void => {
    set({
      activeZoneIds: toActiveZoneIds(zoneStates),
      zoneStates,
    });
  },
  setZoneRecords: (zoneRecords: AdminZoneRecord[]): void => {
    set({
      zones: zoneRecords.map((record: AdminZoneRecord) => record.zone),
    });
  },
  setZones: (zones: Zone[]): void => {
    set({ zones });
  },
}));
