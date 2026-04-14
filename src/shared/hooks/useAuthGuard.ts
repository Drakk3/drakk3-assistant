import { useEffect } from 'react';

import { useRouter } from 'expo-router';

import { useAuth } from '@/shared/hooks/useAuth';
import { resolveAuthGuardState } from '@/shared/hooks/authGuardUtils';

interface UseAuthGuardOptions {
  requireAuth: boolean;
}

interface UseAuthGuardResult {
  isAuthorized: boolean;
  isReady: boolean;
}

export function useAuthGuard({ requireAuth }: UseAuthGuardOptions): UseAuthGuardResult {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const guardState = resolveAuthGuardState({
    isAuthenticated,
    isLoading,
    requireAuth,
  });

  useEffect(() => {
    if (!guardState.redirectTo) {
      return;
    }

    router.replace(guardState.redirectTo);
  }, [guardState.redirectTo, router]);

  return {
    isAuthorized: guardState.isAuthorized,
    isReady: guardState.isReady,
  };
}
