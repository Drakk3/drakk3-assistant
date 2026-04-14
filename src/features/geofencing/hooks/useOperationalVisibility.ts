import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/config/constants';
import { isSupabaseRuntimeConfigured, listLocationEvents, listOperationalState } from '@/features/geofencing/services/geofencingApi';
import { useGeofencingStore } from '@/features/geofencing/store/geofencingStore';
import type { OperationalEventRecord, OperationalSummary, ZoneOperationalState } from '@/features/geofencing/types';
import { getErrorMessage, handleError } from '@/shared/lib/errors';

interface UseOperationalVisibilityResult {
  errorMessage: string | null;
  events: OperationalEventRecord[];
  isFallbackMode: boolean;
  isLoading: boolean;
  operationalState: ZoneOperationalState[];
  refresh: () => Promise<void>;
  summary: OperationalSummary;
}

function buildSummary(events: OperationalEventRecord[], operationalState: ZoneOperationalState[]): OperationalSummary {
  const activeZoneCount = operationalState.filter((item: ZoneOperationalState) => item.isActive).length;
  const failedDispatchCount = events.filter((item: OperationalEventRecord) => item.dispatch_status === 'failed').length;
  const insideZoneCount = operationalState.filter((item: ZoneOperationalState) => item.currentState === 'inside').length;
  const mockedDispatchCount = events.filter((item: OperationalEventRecord) => item.dispatch_status === 'mocked').length;
  const pendingDispatchCount = events.filter((item: OperationalEventRecord) => item.dispatch_status === 'pending').length;
  const sentDispatchCount = events.filter((item: OperationalEventRecord) => item.dispatch_status === 'sent').length;

  return {
    activeZoneCount,
    failedDispatchCount,
    insideZoneCount,
    mockedDispatchCount,
    pendingDispatchCount,
    sentDispatchCount,
    totalEventCount: events.length,
    totalZoneCount: operationalState.length,
  };
}

export function useOperationalVisibility(): UseOperationalVisibilityResult {
  const setOperationalState = useGeofencingStore((state) => state.setOperationalState);
  const setRecentEvents = useGeofencingStore((state) => state.setRecentEvents);

  const eventsQuery = useQuery({
    queryFn: listLocationEvents,
    queryKey: QUERY_KEYS.adminEvents,
  });

  const operationalStateQuery = useQuery({
    queryFn: listOperationalState,
    queryKey: QUERY_KEYS.adminOperationalState,
  });

  useEffect(() => {
    if (eventsQuery.data) {
      setRecentEvents(eventsQuery.data);
    }
  }, [eventsQuery.data, setRecentEvents]);

  useEffect(() => {
    if (operationalStateQuery.data) {
      setOperationalState(operationalStateQuery.data);
    }
  }, [operationalStateQuery.data, setOperationalState]);

  useEffect(() => {
    if (eventsQuery.error) {
      handleError(eventsQuery.error, 'useOperationalVisibility.eventsQuery');
    }
  }, [eventsQuery.error]);

  useEffect(() => {
    if (operationalStateQuery.error) {
      handleError(operationalStateQuery.error, 'useOperationalVisibility.operationalStateQuery');
    }
  }, [operationalStateQuery.error]);

  const refresh = useCallback(async (): Promise<void> => {
    await Promise.all([eventsQuery.refetch(), operationalStateQuery.refetch()]);
  }, [eventsQuery, operationalStateQuery]);

  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const operationalState = useMemo(() => operationalStateQuery.data ?? [], [operationalStateQuery.data]);
  const summary = useMemo(() => buildSummary(events, operationalState), [events, operationalState]);
  const queryError = eventsQuery.error ?? operationalStateQuery.error;

  return {
    errorMessage: queryError ? getErrorMessage(queryError) : null,
    events,
    isFallbackMode: !isSupabaseRuntimeConfigured(),
    isLoading: eventsQuery.isLoading || operationalStateQuery.isLoading,
    operationalState,
    refresh,
    summary,
  };
}
