import { useCallback, useMemo, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/config/constants';
import { buildZoneDetectionResult } from '@/features/geofencing/services/zoneEngine';
import { processZoneTransition } from '@/features/geofencing/services/transitionApi';
import { useGeofencingStore } from '@/features/geofencing/store/geofencingStore';
import type {
  DetectionProcessingResult,
  LocationPoint,
  ProcessedTransition,
  ZoneDetectionResult,
  ZoneEventSource,
} from '@/features/geofencing/types';
import { resolveNextState } from '@/features/geofencing/hooks/useZoneDetection.utils';
import { AppError, getErrorMessage, handleError } from '@/shared/lib/errors';

interface UseZoneDetectionResult {
  activeZones: ZoneDetectionResult['evaluations'][number]['zone'][];
  checkLocation: (location: LocationPoint, source: ZoneEventSource) => Promise<DetectionProcessingResult>;
  errorMessage: string | null;
  isChecking: boolean;
}

export function useZoneDetection(): UseZoneDetectionResult {
  const queryClient = useQueryClient();
  const zones = useGeofencingStore((state) => state.zones);
  const zoneStates = useGeofencingStore((state) => state.zoneStates);
  const setLastDetectionResult = useGeofencingStore((state) => state.setLastDetectionResult);
  const setLastKnownLocation = useGeofencingStore((state) => state.setLastKnownLocation);
  const setLastTransitionResponse = useGeofencingStore((state) => state.setLastTransitionResponse);
  const setZoneState = useGeofencingStore((state) => state.setZoneState);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const activeZones = useMemo(() => {
    return zones.filter((zone) => zone.is_active);
  }, [zones]);

  const checkLocation = useCallback(
    async (location: LocationPoint, source: ZoneEventSource): Promise<DetectionProcessingResult> => {
      setIsChecking(true);
      setErrorMessage(null);

      try {
        const processedAt = new Date().toISOString();
        const detectionResult: ZoneDetectionResult = buildZoneDetectionResult({
          createClientEventId: (): string => Crypto.randomUUID(),
          location,
          occurredAt: processedAt,
          source,
          zoneStates,
          zones: activeZones,
        });

        const processedTransitions: ProcessedTransition[] = [];

        for (const candidate of detectionResult.candidates) {
          try {
            const response = await processZoneTransition(candidate);
            const processedTransition = { candidate, response };

            processedTransitions.push(processedTransition);
            setLastTransitionResponse(processedTransition);

            const nextState = resolveNextState(response, candidate);

            if (nextState) {
              setZoneState(candidate.zone_id, nextState);
            }
          } catch (error) {
            handleError(error, 'useZoneDetection.checkLocation.processTransition');
          }
        }

        const result: DetectionProcessingResult = {
          ...detectionResult,
          processedTransitions,
        };

        if (processedTransitions.length > 0) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminEvents }),
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOperationalState }),
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.geofencingPresence }),
          ]);
        }

        setLastKnownLocation(location);
        setLastDetectionResult(result);

        return result;
      } catch (error) {
        handleError(error, 'useZoneDetection.checkLocation');
        const message = getErrorMessage(error);

        setErrorMessage(message);

        throw new AppError(message, 'useZoneDetection.checkLocation', error);
      } finally {
        setIsChecking(false);
      }
    },
    [activeZones, queryClient, setLastDetectionResult, setLastKnownLocation, setLastTransitionResponse, setZoneState, zoneStates]
  );

  return {
    activeZones,
    checkLocation,
    errorMessage,
    isChecking,
  };
}
