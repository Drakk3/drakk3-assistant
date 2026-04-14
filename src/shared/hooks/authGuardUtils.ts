import { ROUTES } from '@/config/constants';

interface ResolveAuthGuardStateParams {
  isAuthenticated: boolean;
  isLoading: boolean;
  requireAuth: boolean;
}

export interface AuthGuardState {
  isAuthorized: boolean;
  isReady: boolean;
  redirectTo: string | null;
}

export function resolveAuthGuardState({
  isAuthenticated,
  isLoading,
  requireAuth,
}: ResolveAuthGuardStateParams): AuthGuardState {
  const isAuthorized = requireAuth ? isAuthenticated : !isAuthenticated;

  if (isLoading || isAuthorized) {
    return {
      isAuthorized,
      isReady: !isLoading,
      redirectTo: null,
    };
  }

  return {
    isAuthorized,
    isReady: true,
    redirectTo: requireAuth ? ROUTES.login : ROUTES.adminHome,
  };
}
